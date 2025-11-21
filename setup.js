const fs = require('fs');
const path = require('path');

const projectStructure = {
  'backend/package.json': JSON.stringify({
    "name": "notes-backend", "version": "1.0.0", "main": "src/server.ts",
    "scripts": { "dev": "ts-node-dev --respawn --transpile-only src/server.ts", "build": "tsc" },
    "dependencies": { "@prisma/client": "^5.0.0", "bcryptjs": "^2.4.3", "cors": "^2.8.5", "dotenv": "^16.0.3", "express": "^4.18.2", "jsonwebtoken": "^9.0.0" },
    "devDependencies": { "@types/cors": "^2.8.13", "@types/express": "^4.17.17", "@types/node": "^18.15.11", "prisma": "^5.0.0", "ts-node-dev": "^2.0.0", "typescript": "^5.0.4" }
  }, null, 2),

  'backend/tsconfig.json': JSON.stringify({ "compilerOptions": { "target": "es2016", "module": "commonjs", "rootDir": "./src", "outDir": "./dist", "esModuleInterop": true, "strict": true, "skipLibCheck": true } }, null, 2),

  'backend/.env': `PORT=5000
DATABASE_URL="REPLACE_WITH_YOUR_NEON_URL_HERE"
JWT_SECRET="supersecret"`,

  'backend/prisma/schema.prisma': `generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") }
enum ContentType { TEXT, DRAWING, MIXED }
model User { id String @id @default(uuid()) email String @unique password String name String? notes Note[] createdAt DateTime @default(now()) }
model Note { id String @id @default(uuid()) title String content String? @db.Text drawingData Json? contentType ContentType @default(TEXT) userId String user User @relation(fields: [userId], references: [id]) createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }`,

  'backend/src/server.ts': `import express from 'express'; import cors from 'cors'; import dotenv from 'dotenv'; import { PrismaClient } from '@prisma/client';
dotenv.config(); export const prisma = new PrismaClient(); const app = express(); app.use(cors()); app.use(express.json());
const mockAuth = async (req: any, res: any, next: any) => { 
  let user = await prisma.user.findFirst();
  if(!user) user = await prisma.user.create({data: {email: 'test@test.com', password: 'hash'}});
  req.user = { userId: user.id }; next(); 
};
app.post('/api/notes', mockAuth, async (req: any, res: any) => {
  const note = await prisma.note.create({ data: { title: req.body.title || 'Untitled', content: '', drawingData: {}, contentType: 'TEXT', userId: req.user.userId } });
  res.status(201).json(note);
});
app.put('/api/notes/:id', mockAuth, async (req: any, res: any) => {
  const updated = await prisma.note.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});
app.get('/api/notes/:id', mockAuth, async (req: any, res: any) => {
  const note = await prisma.note.findUnique({ where: { id: req.params.id } });
  res.json(note);
});
app.listen(5000, () => console.log('Backend on 5000'));`,

  'frontend/package.json': JSON.stringify({
    "name": "notes-frontend", "version": "0.1.0", "private": true,
    "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },
    "dependencies": { "@excalidraw/excalidraw": "^0.17.0", "axios": "^1.6.0", "lucide-react": "^0.292.0", "next": "14.0.0", "react": "^18", "react-dom": "^18", "react-hot-toast": "^2.4.1", "react-markdown": "^9.0.0", "remark-gfm": "^4.0.0", "zustand": "^4.4.6", "clsx": "^2.0.0", "tailwind-merge": "^2.0.0" },
    "devDependencies": { "@types/node": "^20", "@types/react": "^18", "@types/react-dom": "^18", "autoprefixer": "^10", "postcss": "^8", "tailwindcss": "^3", "typescript": "^5" }
  }, null, 2),

  'frontend/tsconfig.json': JSON.stringify({ "compilerOptions": { "lib": ["dom", "dom.iterable", "esnext"], "allowJs": true, "skipLibCheck": true, "strict": true, "noEmit": true, "esModuleInterop": true, "module": "esnext", "moduleResolution": "bundler", "resolveJsonModule": true, "isolatedModules": true, "jsx": "preserve", "incremental": true, "plugins": [{"name": "next"}], "paths": {"@/*": ["./src/*"]} }, "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], "exclude": ["node_modules"] }, null, 2),
  'frontend/tailwind.config.js': `module.exports = { content: ["./src/**/*.{js,ts,jsx,tsx}"], theme: { extend: {} }, plugins: [require('@tailwindcss/typography')], };`,
  'frontend/src/styles/globals.css': `@tailwind base; @tailwind components; @tailwind utilities;`,
  
  'frontend/src/store/noteStore.ts': `import { create } from 'zustand'; import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000/api' });
export const useNoteStore = create((set) => ({
  activeNote: null,
  fetchNote: async (id) => { const res = await api.get(\`/notes/\${id}\`); set({ activeNote: res.data }); },
  saveNote: async (id, data) => { const res = await api.put(\`/notes/\${id}\`, data); set({ activeNote: res.data }); },
}));`,

  'frontend/src/components/Editor/DrawingCanvas.tsx': `'use client'; import dynamic from 'next/dynamic';
const Excalidraw = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw, { ssr: false });
export default function DrawingCanvas({ initialData, onChange }) {
  return <div className="h-[600px] border rounded"><Excalidraw initialData={{ elements: initialData?.elements || [] }} onChange={(els, state) => onChange(els, state)} /></div>;
}`,

  'frontend/src/components/Editor/MarkdownEditor.tsx': `import ReactMarkdown from 'react-markdown'; import remarkGfm from 'remark-gfm';
export default function MarkdownEditor({ content, onChange }) {
  return <div className="h-full grid grid-cols-2 gap-4"><textarea className="p-4 border rounded resize-none" value={content} onChange={(e) => onChange(e.target.value)} /><div className="prose p-4 border rounded overflow-auto"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div></div>;
}`,

  'frontend/src/components/Editor/MixedEditor.tsx': `'use client'; import { useEffect, useState } from 'react'; import { useNoteStore } from '../../store/noteStore'; import MarkdownEditor from './MarkdownEditor'; import DrawingCanvas from './DrawingCanvas'; import { Save, PenTool, Type } from 'lucide-react'; import toast, { Toaster } from 'react-hot-toast';
export default function MixedEditor({ noteId }) {
  const { activeNote, fetchNote, saveNote } = useNoteStore();
  const [content, setContent] = useState('');
  const [drawingData, setDrawingData] = useState(null);
  const [mode, setMode] = useState('TEXT');
  useEffect(() => { if(noteId) fetchNote(noteId) }, [noteId]);
  useEffect(() => { if(activeNote) { setContent(activeNote.content||''); setDrawingData(activeNote.drawingData||{}); setMode(activeNote.contentType); } }, [activeNote]);
  const handleSave = async () => { await saveNote(noteId, { content, drawingData, contentType: mode }); toast.success('Saved!'); };
  if (!activeNote) return <div>Loading...</div>;
  return (
    <div className="h-screen flex flex-col p-4 bg-gray-50">
      <Toaster/><header className="mb-4 flex justify-between"><h1 className="text-xl font-bold">My Notes</h1><div className="flex gap-2"><button onClick={()=>setMode('TEXT')} className="p-2 bg-white border"><Type/></button><button onClick={()=>setMode('DRAWING')} className="p-2 bg-white border"><PenTool/></button><button onClick={handleSave} className="p-2 bg-black text-white flex gap-2"><Save/> Save</button></div></header>
      <div className="flex-1 bg-white shadow rounded p-2">
        {mode === 'TEXT' && <MarkdownEditor content={content} onChange={setContent} />}
        {mode === 'DRAWING' && <DrawingCanvas initialData={drawingData} onChange={(els, st) => setDrawingData({elements: els, appState: st})} />}
      </div>
    </div>
  );
}`,

  'frontend/src/app/notes/[id]/page.tsx': `import MixedEditor from '@/components/Editor/MixedEditor'; export default function P({ params }) { return <MixedEditor noteId={params.id} />; }`,
  'frontend/src/app/page.tsx': `'use client'; import axios from 'axios'; import { useRouter } from 'next/navigation';
export default function Home() {
  const router = useRouter();
  const create = async () => { try { const res = await axios.post('http://localhost:5000/api/notes', {}); router.push(\`/notes/\${res.data.id}\`); } catch(e) { alert('Is backend running?'); } };
  return <div className="h-screen flex items-center justify-center"><button onClick={create} className="px-6 py-3 bg-blue-600 text-white rounded text-xl">+ Create Note</button></div>;
}`
};

Object.keys(projectStructure).forEach(f => {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(path.dirname(p))) fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, projectStructure[f]);
});
console.log("Files created.");