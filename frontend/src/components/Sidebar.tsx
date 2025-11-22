'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, Search, Settings, Star, Clock, LogOut } from 'lucide-react';
import axios from 'axios';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Helper to determine active class
  const isActive = (path: string) => pathname === path ? styles.active : '';

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
    try {
      // 1. Call backend to clear the cookie
      await axios.post('http://localhost:5000/auth/logout', {}, { withCredentials: true });
      
      // 2. Redirect to login page
      router.push('/login');
      router.refresh(); // Force refresh to update middleware state
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo Area */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>P</div>
        <span className={styles.logoText}>Paperly</span>
      </div>

      {/* Primary Action */}
      <button className={styles.createBtn}>
        <Plus size={18} strokeWidth={2.5} />
        <span>New Note</span>
      </button>

      {/* Main Navigation */}
      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${isActive('/')}`}>
          <Home size={18} />
          <span>Home</span>
        </Link>
        
        <Link href="/search" className={`${styles.navItem} ${isActive('/search')}`}>
          <Search size={18} />
          <span>Search</span>
        </Link>
        
        <Link href="/favorites" className={`${styles.navItem} ${isActive('/favorites')}`}>
          <Star size={18} />
          <span>Favorites</span>
        </Link>
        
        <Link href="/recent" className={`${styles.navItem} ${isActive('/recent')}`}>
          <Clock size={18} />
          <span>Recent</span>
        </Link>
      </nav>

      {/* Bottom Actions */}
      <div className={styles.footer}>
        <Link href="/settings" className={`${styles.navItem} ${isActive('/settings')}`}>
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        
        {/* LOGOUT BUTTON */}
        <button 
          onClick={handleLogout} 
          className={styles.navItem} 
          style={{width: '100%', marginTop: '4px', color: '#ef4444', cursor: 'pointer'}}
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}