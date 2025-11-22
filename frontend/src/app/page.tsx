'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { 
  PenTool, Flame, Zap, ArrowRight, MoreHorizontal, FileText 
} from 'lucide-react';
import styles from './Home.module.css';
import api from '@/lib/api';

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
};

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [notes, setNotes] = useState<any[]>([]);
  const [stats, setStats] = useState({ streak: 0, totalNotes: 0 });
  const [fetching, setFetching] = useState(true);

  // 1. Fetch Data (Notes + Stats)
  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      const timestamp = new Date().getTime(); // Prevent caching
      
      // Parallel Fetch
      const [notesRes, statsRes] = await Promise.all([
        api.get(`/notes?t=${timestamp}`),
        api.get(`/stats?t=${timestamp}`)
      ]);

      setNotes(notesRes.data);
      setStats(statsRes.data);
      
    } catch (e) {
      console.error("Failed to fetch dashboard data");
    } finally {
      setFetching(false);
    }
  }, []);

  // 2. Refresh on Focus
  useEffect(() => {
    fetchData();
    const onFocus = () => fetchData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchData]);

  const create = async () => {
    setLoading(true);
    try {
      const res = await api.post('/notes', {}); 
      router.push(`/notes/${res.data.id}`);
    } catch(e: any) {
      if (e.response?.status === 401) router.push('/login');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      
      <header className={styles.header}>
        <div className={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <h1 className={styles.welcome}>Welcome back.</h1>
      </header>

      <div className={styles.bentoGrid}>
        
        {/* 1. HERO: Create Note (Fixed Contrast) */}
        <div className={`bento-card ${styles.heroCard}`} style={{background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)'}}>
          <div>
            <div className={styles.iconCircle} style={{background: '#2563eb', color: 'white'}}>
              <PenTool size={24} />
            </div>
            <h2 className={styles.heroTitle}>Capture Thought</h2>
            <p className={styles.heroDesc}>
              Create a drawing, text, or mixed note instantly.
            </p>
          </div>
          <button 
            onClick={create}
            disabled={loading}
            className={styles.heroBtn}
            style={{opacity: loading ? 0.7 : 1}}
          >
            {loading ? 'Creating...' : 'Start Writing'} <ArrowRight size={16} />
          </button>
        </div>

        {/* 2. STAT: Total Notes (REAL DATA) */}
        <div className={`bento-card ${styles.squareCard}`}>
          <div className={styles.statBig}>{stats.totalNotes}</div>
          <div className={styles.statLabel}>Notes Created</div>
        </div>

        {/* 3. LIST: Recent Activity (REAL DATA) */}
        <div className={`bento-card ${styles.tallCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Recent</h3>
          </div>
          
          <div className={styles.list}>
            {notes.length === 0 && !fetching ? (
              <div style={{color: 'var(--text-tertiary)', fontSize: '14px', textAlign: 'center', marginTop: '20px'}}>No notes yet.</div>
            ) : (
              notes.map((note) => (
                <div 
                  key={note.id} 
                  className={styles.listItem} 
                  onClick={() => router.push(`/notes/${note.id}`)}
                  style={{cursor: 'pointer'}}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    background: note.contentType === 'DRAWING' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: note.contentType === 'DRAWING' ? '#8b5cf6' : '#2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {note.contentType === 'DRAWING' ? <PenTool size={14} /> : <FileText size={14} />}
                  </div>

                  <div style={{minWidth: 0, flex: 1}}>
                    <div className={styles.listTitle} style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {note.mood && <span style={{marginRight: '8px'}}>{note.mood}</span>}
                      {note.title || (note.contentType === 'DRAWING' ? 'Untitled Drawing' : 'Untitled Note')}
                    </div>
                    <div className={styles.listSub}>{timeAgo(note.updatedAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. STAT: Streak (REAL DATA) */}
        <div className={`bento-card ${styles.squareCard}`}>
          <Flame size={32} color="#f59e0b" style={{marginBottom: '12px'}} />
          <div className={styles.statBig}>{stats.streak}</div>
          <div className={styles.statLabel}>Day Streak</div>
        </div>

        {/* 5. ACTION: Review Queue (Static for now) */}
        <div className={`bento-card ${styles.wideCard}`}>
          <div className={styles.iconCircle} style={{background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', marginBottom: 0}}>
            <Zap size={24} />
          </div>
          <div>
            <div style={{fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)'}}>Daily Review</div>
            <div style={{color: 'var(--text-secondary)', fontSize: '14px'}}>No notes due for review</div>
          </div>
        </div>

      </div>
    </div>
  );
}