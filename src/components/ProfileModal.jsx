import React from 'react';
import { 
  X, Award, ExternalLink, MessageSquare, 
  Sparkles, Code, CheckCircle, GraduationCap, MapPin 
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './SocialIcons';
import { SAMPLE_USER_PROFILE } from '../data/mockData';

export default function ProfileModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const profile = SAMPLE_USER_PROFILE;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-lg" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Cover Graphic Banner */}
        <div className="profile-cover">
          <button 
            className="modal-close-btn" 
            onClick={onClose} 
            aria-label="Close Profile"
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.9)' }}
          >
            <X size={18} />
          </button>
          <div className="profile-avatar-wrapper">
            <img src={profile.avatar} alt={profile.name} />
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ paddingTop: '0.5rem' }}>
          {/* Header Info */}
          <div className="profile-header-info">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem' }}>{profile.name}</h2>
                  <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                    <CheckCircle size={12} /> Student Verified
                  </span>
                </div>
                <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.92rem', marginTop: '0.2rem' }}>
                  {profile.role}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <GraduationCap size={15} /> {profile.college}
                  </span>
                  <span>•</span>
                  <span>{profile.major}</span>
                  <span>•</span>
                  <span>{profile.year}</span>
                </div>
              </div>

              <span className="badge badge-primary" style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}>
                {profile.experienceLevel} Builder
              </span>
            </div>

            {/* Bio */}
            <p style={{ marginTop: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {profile.bio}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="profile-stat-pills">
            <div className="profile-stat-box">
              <div className="profile-stat-val">{profile.stats.hackathonsAttended}</div>
              <div className="profile-stat-title">Hackathons</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-val">{profile.stats.projectsBuilt}</div>
              <div className="profile-stat-title">Projects Built</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-val">{profile.stats.podiumFinishes}</div>
              <div className="profile-stat-title">Podiums Won</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-val">{profile.stats.teamsJoined}</div>
              <div className="profile-stat-title">Teams Joined</div>
            </div>
          </div>

          {/* Skills & Technologies */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 className="detail-section-heading">
              <Code size={17} style={{ color: 'var(--primary)' }} />
              <span>Skills & Tech Stack</span>
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {profile.skills.map((skill, idx) => (
                <span key={idx} className="skill-tag" style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Hackathons Participated In */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 className="detail-section-heading">
              <Award size={17} style={{ color: 'var(--primary)' }} />
              <span>Hackathons & Competitions</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {profile.hackathonHistory.map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Project: <em>{item.project}</em>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-amber" style={{ fontSize: '0.8rem' }}>
                      {item.award}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Projects */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 className="detail-section-heading">
              <Sparkles size={17} style={{ color: 'var(--primary)' }} />
              <span>Past Project Portfolio</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
              {profile.featuredProjects.map((proj, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                      {proj.title}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      {proj.desc}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {proj.stack.map((t, i) => (
                      <span key={i} className="skill-tag" style={{ fontSize: '0.72rem' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social / Contact Links */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Connect with {profile.name.split(' ')[0]}:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="btn btn-secondary btn-sm" style={{ cursor: 'default' }}>
                <GithubIcon size={14} /> GitHub
              </span>
              <span className="btn btn-secondary btn-sm" style={{ cursor: 'default' }}>
                <LinkedinIcon size={14} /> LinkedIn
              </span>
              <span className="btn btn-secondary btn-sm" style={{ cursor: 'default' }}>
                <MessageSquare size={14} /> Discord
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
