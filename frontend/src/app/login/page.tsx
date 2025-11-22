'use client';
import { useState } from 'react';
import axios from 'axios';
import { Mail, ArrowRight, Sparkles } from 'lucide-react';
import styles from './Login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Important: This needs credentials: true to handle cookies properly later
      await axios.post('http://localhost:5000/auth/request-link', 
        { email },
        { withCredentials: true }
      );
      setSent(true);
    } catch (error) {
      alert('Login failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        
        <div className={styles.logoBlock}>
          <div className={styles.logoIcon}>P</div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>
            Enter your email to access your<br/>
            second brain. No passwords required.
          </p>
        </div>

        {sent ? (
          <div className={styles.successMessage}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: '12px'}}>
              <Sparkles size={24} />
            </div>
            <strong>Magic Link Sent!</strong><br/>
            Check your backend terminal (simulated email) to click the link and log in.
          </div>
        ) : (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <Mail size={18} className={styles.icon} />
              <input 
                type="email" 
                required
                className={styles.input}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}
        
      </div>
    </div>
  );
}