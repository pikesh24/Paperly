'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import TextareaAutosize from 'react-textarea-autosize';
import { Type, PenTool, Save, ArrowLeft, Check, Loader2 } from 'lucide-react';
import styles from './Editor.module.css';
import api from '@/lib/api';
import MoodPicker from './MoodPicker';

// Excalidraw Types
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";

// Lazy load Excalidraw
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { 
    ssr: false,
    loading: () => <div className="h-[600px] bg-gray-100 animate-pulse rounded-2xl" />
  }
);

export default function MixedEditor({ noteId }: { noteId: string }) {
  const router = useRouter();
  
  // --- STATE ---
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'TEXT' | 'DRAWING'>('TEXT');
  const [mood, setMood] = useState<string | null>(null); // Mood State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Drawing State Retention
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [drawingData, setDrawingData] = useState<any>(null);

  // 1. LOAD DATA
  useEffect(() => {
    const loadNote = async () => {
      try {
        const res = await api.get(`/notes/${noteId}`);
        setTitle(res.data.title || '');
        setContent(res.data.content || '');
        if (res.data.mood) setMood(res.data.mood);
        if (res.data.drawingData) {
          setDrawingData(res.data.drawingData);
        }
        if (res.data.contentType) setMode(res.data.contentType);
      } catch (error) {
        console.error("Failed to load note", error);
      } finally {
        setLoading(false);
      }
    };
    if (noteId) loadNote();
  }, [noteId]);

  // 2. MODE SWITCHER (Prevents data loss when toggling)
  const handleSwitchMode = (newMode: 'TEXT' | 'DRAWING') => {
    if (mode === newMode) return;

    // If leaving Drawing mode, capture strokes first
    if (mode === 'DRAWING' && excalidrawAPI) {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      setDrawingData({ 
        elements, 
        appState: { viewBackgroundColor: appState.viewBackgroundColor } 
      });
    }
    setMode(newMode);
  };

  // 3. SAVE FUNCTION
  const handleSave = async () => {
    setSaving(true);
    try {
      let currentDrawingData = drawingData;

      // If currently drawing, get the latest version
      if (mode === 'DRAWING' && excalidrawAPI) {
        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        currentDrawingData = { 
          elements, 
          appState: { viewBackgroundColor: appState.viewBackgroundColor } 
        };
        setDrawingData(currentDrawingData);
      }

      await api.put(`/notes/${noteId}`, {
        title,
        content,
        contentType: mode,
        mood, // Saving Mood
        drawingData: currentDrawingData,
      });
    } catch (error) {
      alert("Failed to save work");
    } finally {
      setTimeout(() => setSaving(false), 800);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center text-gray-400 gap-2">
      <Loader2 className="animate-spin" /> Loading space...
    </div>
  );

  return (
    <div className={styles.container}>
      
      <button onClick={() => router.push('/')} className={styles.backButton}>
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <TextareaAutosize
        className={styles.titleInput}
        placeholder="Untitled Idea"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* --- META BAR --- */}
      <div style={{
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', /* Increased gap for breathing room */
        marginBottom: '32px',
        borderBottom: '1px solid rgba(0,0,0,0.05)', /* Subtle divider line */
        paddingBottom: '16px'
      }}>
        
        <MoodPicker selectedMood={mood} onChange={setMood} />
        
        <div className={styles.divider} style={{height: '16px', background: 'rgba(0,0,0,0.1)'}}></div>

        {/* Tag with better styling */}
        <div style={{
          padding: '4px 10px', 
          background: 'rgba(0,0,0,0.04)', 
          borderRadius: '6px', 
          fontSize: '12px', 
          fontWeight: 500, 
          color: 'var(--text-secondary)'
        }}>
          #general
        </div>
        
        <div style={{marginLeft: 'auto', fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace'}}>
          {saving ? 'Saving...' : 'Synced'}
        </div>
      </div>
      {/* STRICT CONDITIONAL RENDERING */}
      {mode === 'TEXT' ? (
        <TextareaAutosize
          className={styles.textArea}
          placeholder="Start typing..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          minRows={15}
        />
      ) : (
        <div className={styles.canvasWrapper}>
          <Excalidraw 
            theme="light" 
            initialData={drawingData || { elements: [], appState: {} }}
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
          />
        </div>
      )}

      {/* DOCK */}
      <div className={styles.dockContainer}>
        <div className={styles.dock}>
          <button 
            className={`${styles.dockBtn} ${mode === 'TEXT' ? styles.active : ''}`}
            onClick={() => handleSwitchMode('TEXT')}
            title="Text Mode"
          >
            <Type size={20} />
          </button>
          
          <button 
            className={`${styles.dockBtn} ${mode === 'DRAWING' ? styles.active : ''}`}
            onClick={() => handleSwitchMode('DRAWING')}
            title="Drawing Mode"
          >
            <PenTool size={20} />
          </button>

          <div className={styles.divider} />

          <button 
            className={styles.dockBtn} 
            onClick={handleSave}
            title="Save"
            style={{color: saving ? '#10b981' : 'inherit'}}
          >
            {saving ? <Check size={20} /> : <Save size={20} />}
          </button>
        </div>
      </div>

    </div>
  );
}