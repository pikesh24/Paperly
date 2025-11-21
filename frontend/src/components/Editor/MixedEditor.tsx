'use client'; import { useEffect, useState } from 'react'; import { useNoteStore } from '../../store/noteStore'; import MarkdownEditor from './MarkdownEditor'; import DrawingCanvas from './DrawingCanvas'; import { Save, PenTool, Type } from 'lucide-react'; import toast, { Toaster } from 'react-hot-toast';
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
}