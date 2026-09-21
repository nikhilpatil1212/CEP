import React from 'react';
import { Users } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      padding: '1.75rem 0',
      marginTop: '3.5rem'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.88rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
          <div className="logo-badge" style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)' }}>
            <Users size={15} />
          </div>
          <span>CampusConnect</span>
        </div>

        <div>
          Frontend Prototype Demo • Built with React & Vite
        </div>

        <div>
          © {new Date().getFullYear()} CampusConnect
        </div>
      </div>
    </footer>
  );
}
