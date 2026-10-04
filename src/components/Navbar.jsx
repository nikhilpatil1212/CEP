import React from 'react';
import { 
  Users, PlusCircle, Search, LogIn, UserPlus, LogOut, Bell, 
  Briefcase, FileText 
} from 'lucide-react';
import { SAMPLE_USER_PROFILE } from '../data/mockData';

export default function Navbar({ 
  onOpenCreate, 
  onOpenProfile, 
  onOpenMyTeams,
  onOpenMyApplications,
  onFindTeam, 
  onOpenLogin,
  onOpenRegister,
  onLogout,
  onOpenNotifications,
  notificationsCount = 0,
  isAuthenticated = false,
  user = SAMPLE_USER_PROFILE 
}) {
  const currentUser = user || SAMPLE_USER_PROFILE;

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

          {/* Right Actions */}
          <div className="nav-actions">
            {/* Find a Team is always public */}
            <button 
              id="nav-find-team-btn"
              className="btn btn-secondary btn-sm"
              onClick={onFindTeam}
            >
              <Search size={15} />
              <span>Find a Team</span>
            </button>

            {isAuthenticated ? (
              /* LOGGED IN ACTIONS */
              <>
                {/* My Teams */}
                <button
                  id="nav-my-teams-btn"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenMyTeams}
                  title="View and manage teams created by you"
                >
                  <Briefcase size={15} />
                  <span>My Teams</span>
                </button>

                {/* My Applications */}
                <button
                  id="nav-my-applications-btn"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenMyApplications}
                  title="View teams you have applied to"
                >
                  <FileText size={15} />
                  <span>My Applications</span>
                </button>

                {/* Post Request */}
                <button 
                  id="nav-create-btn"
                  className="btn btn-primary btn-sm"
                  onClick={onOpenCreate}
                >
                  <PlusCircle size={16} />
                  <span>Post Request</span>
                </button>

                {/* Notifications Bell */}
                <button 
                  id="nav-notifications-btn"
                  className="btn btn-secondary btn-sm nav-notif-btn"
                  onClick={onOpenNotifications}
                  title={notificationsCount > 0 ? `${notificationsCount} notification(s)` : 'Notifications'}
                  style={{ position: 'relative', padding: '0.45rem 0.65rem' }}
                >
                  <Bell size={16} />
                  {notificationsCount > 0 && (
                    <span className="notif-badge-count">
                      {notificationsCount}
                    </span>
                  )}
                </button>

                {/* User Profile Pill */}
                <div 
                  id="user-profile-trigger"
                  className="user-profile-pill"
                  onClick={onOpenProfile}
                  title={`View ${currentUser.displayName || currentUser.name}'s profile`}
                  role="button"
                  tabIndex={0}
                >
                  <img 
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                    alt={currentUser.displayName || currentUser.name} 
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span className="pill-text">{currentUser.displayName || currentUser.name}</span>
                    <span className="pill-sub">{currentUser.college || 'Campus Member'}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  id="nav-logout-btn"
                  className="btn btn-ghost btn-sm"
                  onClick={onLogout}
                  title="Sign out of your account"
                  style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              /* LOGGED OUT ACTIONS */
              <>
                <button 
                  id="nav-login-btn"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenLogin}
                >
                  <LogIn size={15} />
                  <span>Log In</span>
                </button>

                <button 
                  id="nav-register-btn"
                  className="btn btn-primary btn-sm"
                  onClick={onOpenRegister}
                >
                  <UserPlus size={15} />
                  <span>Register</span>
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
