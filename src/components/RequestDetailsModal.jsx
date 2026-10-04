import React from 'react';
import { 
  X, Calendar, Users, Award, ShieldCheck, 
  ArrowUpRight, CheckCircle, Code, UserCheck, Flame, Trash2, Check, Clock, Settings 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RequestDetailsModal({ 
  request, 
  isOpen, 
  onClose, 
  onApply, 
  onDelete,
  onManageTeam,
  userApplications = []
}) {
  const { user } = useAuth();
  if (!isOpen || !request) return null;

  const currentUserId = user?.id ? String(user.id) : null;

  const isOwner = Boolean(
    currentUserId && (
      String(request.creatorId) === currentUserId ||
      String(request.creator?.id) === currentUserId ||
      (user?.email && request.creatorEmail && user.email.toLowerCase() === request.creatorEmail.toLowerCase()) ||
      (user?.email && request.creator?.email && user.email.toLowerCase() === request.creator?.email.toLowerCase())
    )
  );

  const isMember = Boolean(
    currentUserId && (
      (request.currentMembers || []).some(m => String(m.userId) === currentUserId)
    )
  );

  const userApp = (userApplications || []).find(
    a => String(a.request_id || a.requestId) === String(request.id)
  );

  const appStatus = userApp ? userApp.status : null;
  const isPending = appStatus === 'PENDING';
  const isApproved = appStatus === 'APPROVED' || appStatus === 'ACCEPTED' || isMember;
  const isDenied = appStatus === 'DENIED';

  const isSeedPost = String(request.id) === 'req-1';
  const canDelete = isOwner || isSeedPost;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to permanently delete "${request.title}"? This cannot be undone.`)) {
      if (onDelete) onDelete(request.id);
      onClose();
    }
  };

  const openPositions = Math.max(0, (request.membersNeeded || 4) - (request.currentTeamSize || 0));
  const isFull = openPositions === 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-lg" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="badge badge-primary">
              {request.category}
            </span>
            {request.eventName && (
              <span className="badge badge-slate">
                {request.eventName}
              </span>
            )}
            {request.urgent && (
              <span className="badge badge-amber">
                <Flame size={12} />
                <span>Urgent</span>
              </span>
            )}
            {isOwner && (
              <span className="badge badge-amber">
                Your Team (Leader)
              </span>
            )}
            {isMember && !isOwner && (
              <span className="badge badge-emerald">
                Joined Member
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                title="Delete this team post"
                id="modal-header-delete-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius-sm)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#e11d48'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Trash2 size={17} />
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Main Hero Header */}
          <div className="detail-hero-banner">
            <h2 style={{ fontSize: '1.65rem', marginBottom: '0.75rem', lineHeight: 1.25 }}>
              {request.title}
            </h2>
            <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {request.fullDesc || request.shortDesc}
            </p>

            {/* Quick Specs Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.75)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Experience
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  {request.experienceLevel || 'Intermediate'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Team Status
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isFull ? 'var(--text-muted)' : 'var(--accent-emerald)' }}>
                  {request.currentTeamSize || 0}/{request.membersNeeded || 4} Members ({openPositions} seat{openPositions === 1 ? '' : 's'} remaining)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Deadline
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} style={{ color: 'var(--primary)' }} />
                  <span>{request.deadlineDisplay || 'Flexible'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Open Roles Needed */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 className="detail-section-heading">
              <Users size={18} style={{ color: 'var(--primary)' }} />
              <span>Roles Actively Recruited ({openPositions} Open Spot{openPositions > 1 ? 's' : ''})</span>
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              {request.openRoles && request.openRoles.length > 0 ? (
                request.openRoles.map((role, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'var(--accent-emerald-light)',
                      border: '1px solid #a7f3d0',
                      color: '#065f46',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <UserCheck size={15} />
                    <span>{role}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  General team members welcome!
                </div>
              )}
            </div>
          </div>

          {/* Required Skills & Tech Stack */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 className="detail-section-heading">
              <Code size={18} style={{ color: 'var(--primary)' }} />
              <span>Skills & Technologies</span>
            </h3>

            <div style={{ marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Required Student Skills:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {(request.skillsRequired || []).map((skill, idx) => (
                  <span key={idx} className="skill-tag" style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {request.techStack && (
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  Project Architecture / Tech Stack:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {(request.techStack || []).map((tech, idx) => (
                    <span key={idx} className="badge badge-slate" style={{ fontSize: '0.82rem' }}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current Team Members Roster */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 className="detail-section-heading">
              <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
              <span>Current Team Roster ({request.currentTeamSize || 0} Members)</span>
            </h3>

            <div className="member-list-grid">
              {(!request.currentMembers || request.currentMembers.length === 0) ? (
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No members added to roster yet.
                </div>
              ) : (
                request.currentMembers.map((member, idx) => (
                  <div key={idx} className="member-card-item">
                    <img 
                      src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'} 
                      alt={member.name} 
                    />
                    <div>
                      <div className="member-card-name">{member.name}</div>
                      <div className="member-card-role">{member.role || 'Teammate'}</div>
                      <div className="member-card-college">{member.college || 'Campus Student'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Project Requirements & Expectations */}
          {request.requirements && request.requirements.length > 0 && (
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 className="detail-section-heading">
                <CheckCircle size={18} style={{ color: 'var(--primary)' }} />
                <span>Expectations & Requirements</span>
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {request.requirements.map((req, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-emerald)', marginTop: '2px' }}>✔</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* About the Project Creator */}
          <div style={{
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <img 
              src={request.creator?.avatar || request.creator?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'} 
              alt={request.creator?.name || 'Lead'} 
              style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <strong style={{ fontSize: '1rem' }}>{request.creator?.name || 'Project Lead'}</strong>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                  {request.creator?.role || 'Project Lead'}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                {request.creator?.college}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                "{request.creator?.bio || 'Organizing this hackathon squad to build something remarkable.'}"
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer with Dynamic Action Button */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {canDelete && (
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={handleDelete}
                id="detail-delete-btn"
                style={{ color: 'var(--accent-rose)', borderColor: '#fecdd3', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                title="Delete this team post"
              >
                <Trash2 size={15} />
                <span>Delete Post</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Close
            </button>
            
            {/* Dynamic Button States according to Application State */}
            {isOwner ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  if (onManageTeam) onManageTeam(request.id);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Settings size={15} />
                <span>Manage Team</span>
              </button>
            ) : isApproved ? (
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled
                style={{
                  background: 'var(--accent-emerald-light)',
                  borderColor: '#a7f3d0',
                  color: '#065f46',
                  cursor: 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600
                }}
              >
                <Check size={16} strokeWidth={2.5} />
                <span>Joined Team</span>
              </button>
            ) : isPending ? (
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled
                style={{
                  background: 'var(--accent-amber-light)',
                  borderColor: '#fde68a',
                  color: '#92400e',
                  cursor: 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600
                }}
              >
                <Clock size={16} />
                <span>Application Pending</span>
              </button>
            ) : isDenied ? (
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled
                style={{
                  background: '#fef2f2',
                  borderColor: '#fecdd3',
                  color: '#9f1239',
                  cursor: 'not-allowed',
                  fontWeight: 600
                }}
              >
                <span>Application Denied</span>
              </button>
            ) : isFull ? (
              <button 
                type="button" 
                className="btn btn-primary"
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                <span>Team Roster Full</span>
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onApply(request);
                }}
                id="detail-apply-btn"
              >
                <span>Apply to Join This Team</span>
                <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
