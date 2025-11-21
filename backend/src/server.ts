import express from 'express'; 
import cors from 'cors'; 
import dotenv from 'dotenv'; 
import { PrismaClient } from '@prisma/client';

dotenv.config(); 
export const prisma = new PrismaClient(); 
const app = express(); 

app.use(cors()); 
app.use(express.json());

// Middleware to simulate a logged-in user
const mockAuth = async (req: any, res: any, next: any) => { 
  try {
    let user = await prisma.user.findFirst();
    if(!user) {
      console.log("Creating test user...");
      user = await prisma.user.create({data: {email: 'test@test.com', password: 'hash'}});
    }
    req.user = { userId: user.id }; 
    next(); 
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// CREATE NOTE
app.post('/api/notes', mockAuth, async (req: any, res: any) => {
  try {
    const note = await prisma.note.create({ 
      data: { 
        title: req.body.title || 'Untitled', 
        content: '', 
        drawingData: {}, 
        contentType: 'TEXT', 
        userId: req.user.userId 
      } 
    });
    console.log(`[CREATED] Note ${note.id}`);
    res.status(201).json(note);
  } catch (error) {
    console.error("Create Error:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// UPDATE NOTE (The one currently failing for you)
app.put('/api/notes/:id', mockAuth, async (req: any, res: any) => {
  try {
    console.log(`[PUT] Saving note ${req.params.id}...`);
    const updated = await prisma.note.update({ 
      where: { id: req.params.id }, 
      data: req.body 
    });
    console.log(`[PUT] Success!`);
    res.json(updated);
  } catch (error) {
    console.error("❌ SAVE ERROR:", error);
    // This tells the frontend something went wrong
    res.status(500).json({ error: 'Failed to save note', details: error });
  }
});

// GET NOTE
app.get('/api/notes/:id', mockAuth, async (req: any, res: any) => {
  try {
    const note = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (error) {
    console.error("Get Error:", error);
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

app.listen(5000, () => console.log('Backend running on port 5000'));