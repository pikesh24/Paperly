'use client';
import { useState } from 'react';
import { Smile } from 'lucide-react';
import styles from './MoodPicker.module.css'; // Import the CSS Module

const MOODS = [
  { emoji: '🔥', label: 'Productive' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '🧠', label: 'Learning' },
  { emoji: '🤔', label: 'Idea' },
  { emoji: '😰', label: 'Stressed' },
  { emoji: '💤', label: 'Tired' },
];

interface MoodPickerProps {
  selectedMood: string | null;
  onChange: (mood: string) => void;
}

export default function MoodPicker({ selectedMood, onChange }: MoodPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.triggerBtn} ${selectedMood ? styles.hasMood : ''}`}
        title="Set Mood"
      >
        {selectedMood ? (
          <span style={{fontSize: '18px'}}>{selectedMood}</span>
        ) : (
          <Smile size={16} />
        )}
        <span>{selectedMood ? '' : 'Add Mood'}</span>
      </button>

      {isOpen && (
        <>
          {/* Invisible Backdrop to close when clicking outside */}
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          
          {/* The Glass Dropdown */}
          <div className={styles.dropdown}>
            {MOODS.map((m) => (
              <div
                key={m.label}
                onClick={() => { onChange(m.emoji); setIsOpen(false); }}
                className={styles.moodOption}
              >
                <span className={styles.emoji}>{m.emoji}</span>
                <span className={styles.label}>{m.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}