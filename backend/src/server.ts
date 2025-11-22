import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';

dotenv.config();
export const prisma = new PrismaClient();
const app = express();

// --- 1. SETUP ---
app.use(cookieParser());
app.use(cors({ 
  origin: 'http://localhost:3000', 
  credentials: true 
}));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'; 

// --- 2. UTILITIES ---
const sendMagicLinkEmail = (email: string, link: string) => {
  console.log(`\n-------------------------------------------------------`);
  console.log(`📧 MAGIC LINK SENT TO ${email}`);
  console.log(`🔗 CLICK HERE: ${link}`);
  console.log(`-------------------------------------------------------\n`);
};

// 🔥 GAMIFICATION HELPER: UPDATE STREAK 🔥
const updateUserStreak = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const now = new Date();
  const lastPost = user.lastPostedAt ? new Date(user.lastPostedAt) : null;
  
  // Helper to compare dates (ignoring time)
  const isSameDay = (d1: Date, d2: Date) => 
    d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
  
  const isYesterday = (d1: Date, d2: Date) => {
    const yesterday = new Date(d1);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(yesterday, d2);
  };

  // 1. If already posted today, do nothing
  if (lastPost && isSameDay(now, lastPost)) return;

  let newStreak = user.currentStreak;

  // 2. If posted yesterday, increment streak
  if (lastPost && isYesterday(now, lastPost)) {
    newStreak += 1;
  } 
  // 3. If missed a day or first post, reset to 1
  else {
    newStreak = 1;
  }

  // 4. Update DB
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      lastPostedAt: now,
      longestStreak: Math.max(newStreak, user.longestStreak)
    }
  });
};

// --- 3. AUTH MIDDLEWARE ---
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.user = payload;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// --- 4. AUTH ROUTES ---

app.post('/auth/request-link', async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, password: 'passwordless_entry' } });
    }

    const magicToken = crypto.randomBytes(32).toString('hex');
    const validUntil = new Date(Date.now() + 15 * 60 * 1000); 

    await prisma.magicLink.create({
      data: { token: magicToken, userId: user.id, validUntil },
    });

    const link = `http://localhost:5000/auth/verify?token=${magicToken}`; 
    sendMagicLinkEmail(email, link);

    res.json({ message: 'Magic link sent!' });
  } catch (error) {
    console.error("Link Error:", error);
    res.status(500).json({ error: 'Failed to generate link' });
  }
});

app.get('/auth/verify', async (req: any, res: any) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') return res.status(400).send('Invalid link.');

  try {
    const magicLink = await prisma.magicLink.findUnique({ where: { token } });
    if (!magicLink || magicLink.validUntil < new Date()) {
      return res.status(401).send('Link expired or invalid.');
    }

    const sessionToken = jwt.sign({ userId: magicLink.userId }, JWT_SECRET, { expiresIn: '7d' });
    await prisma.magicLink.delete({ where: { token } });

    res.cookie('token', sessionToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 7 * 24 * 60 * 60 * 1000, 
      sameSite: 'lax',
    });

    res.redirect('http://localhost:3000/'); 

  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).send('Verification failed.');
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// --- 5. DATA ROUTES (Protected) ---

// 📊 GET STATS (For Dashboard)
app.get('/api/stats', authMiddleware, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.userId },
      select: { currentStreak: true, longestStreak: true }
    });
    
    const totalNotes = await prisma.note.count({
      where: { userId: req.user.userId }
    });

    res.json({
      streak: user?.currentStreak || 0,
      totalNotes: totalNotes
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// 📝 GET ALL NOTES
app.get('/api/notes', authMiddleware, async (req: any, res: any) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.user.userId },
      orderBy: { updatedAt: 'desc' },
      take: 5 
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// 📝 GET SINGLE NOTE
app.get('/api/notes/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const note = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!note) return res.status(404).json({ error: "Not found" });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

// 📝 CREATE NOTE (With Streak & Mood)
app.post('/api/notes', authMiddleware, async (req: any, res: any) => {
  try {
    const note = await prisma.note.create({
      data: {
        title: req.body.title || 'Untitled',
        content: '',
        drawingData: {},
        contentType: 'TEXT',
        mood: req.body.mood || null,
        userId: req.user.userId 
      }
    });

    // 🔥 Update Streak
    await updateUserStreak(req.user.userId);

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: "Failed to create note" });
  }
});

// 📝 UPDATE NOTE (With Streak & Mood)
app.put('/api/notes/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const updated = await prisma.note.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title,
        content: req.body.content,
        drawingData: req.body.drawingData,
        contentType: req.body.contentType,
        mood: req.body.mood
      }
    });

    // 🔥 Update Streak (Editing counts!)
    await updateUserStreak(req.user.userId);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update note" });
  }
});

app.listen(5000, () => console.log('Backend running on port 5000'));