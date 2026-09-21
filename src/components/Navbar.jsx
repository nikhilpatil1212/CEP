import React from 'react';
import { Users, PlusCircle, Search } from 'lucide-react';
import { SAMPLE_USER_PROFILE } from '../data/mockData';

export default function Navbar({ onOpenCreate, onOpenProfile, onFindTeam }) {
  return (
    <header className="navbar-wrapper">
      <div className="container">
        <nav className="navbar">
          {/* Brand Logo */}
          <div 
            className="brand-logo" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            role="button"
            tabIndex={0}
          >
            <div className="logo-badge">
              <Users size={22} strokeWidth={2.4} />
            </div>
            <span>Campus<span className="brand-highlight">Connect</span></span>
          </div>

          {/* Right Actions: Find a Team, Post Request & Demo Profile for Onkar */}
          <div className="nav-actions">
            <button 
              id="nav-find-team-btn"
              className="btn btn-secondary btn-sm"
              onClick={onFindTeam}
            >
              <Search size={15} />
              <span>Find a Team</span>
            </button>

            <button 
              id="nav-create-btn"
              className="btn btn-primary btn-sm"
              onClick={onOpenCreate}
            >
              <PlusCircle size={16} />
              <span>Post Request</span>
            </button>

            {/* Onkar Profile Pill */}
            <div 
              id="user-profile-trigger"
              className="user-profile-pill"
              onClick={onOpenProfile}
              title="View Onkar's profile"
              role="button"
              tabIndex={0}
            >
              <img 
                src={SAMPLE_USER_PROFILE.avatar} 
                alt="Onkar" 
              />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span className="pill-text">Onkar</span>
                <span className="pill-sub">PICT Pune '27</span>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
