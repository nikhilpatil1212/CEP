import React from 'react';
import { Calendar, Users, Flame, ArrowUpRight, Award, Briefcase, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RequestCard({ request, onViewDetails, onApply, onDelete }) {
  const { user } = useAuth();
  const openPositions = Math.max(0, request.membersNeeded - request.currentTeamSize);
  const isFull = openPositions === 0;

  // Authorization: Owner or seed/demo post can delete
  const isOwner = Boolean(
    user && (
      String(user.id) === String(request.creatorId) ||
      String(user.id) === String(request.creator?.id) ||
      (user.email && request.creatorEmail && user.email.toLowerCase() === request.creatorEmail.toLowerCase()) ||
      (user.email && request.creator?.email && user.email.toLowerCase() === request.creator?.email.toLowerCase())
    )
  );
  const isSeedPost = String(request.id) === 'req-1';
  const canDelete = isOwner || isSeedPost;

  // Level badge styling helper
  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'Beginner Friendly':
        return 'badge-emerald';
      case 'Advanced':
        return 'badge-rose';
      case 'Intermediate':
      default:
        return 'badge-primary';
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete "${request.title}"?`)) {
      if (onDelete) onDelete(request.id);
    }
  };

  return (
    <article className={`request-card ${request.featured ? 'featured-card' : ''}`}>
      {/* Card Header: Category / Event name & Urgency */}
      <div>
        <div className="card-top">
          <div className="event-label">
            <Award size={14} />
            <span>{request.eventName}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {canDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                title="Delete this team post"
                id={`card-top-delete-${request.id}`}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#e11d48'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Trash2 size={14} />
              </button>
            )}
            {request.urgent && (
              <span className="badge badge-amber">
                <Flame size={12} />
                <span>Urgent</span>
              </span>
            )}
            <span className={`badge ${getLevelBadgeClass(request.experienceLevel)}`}>
              {request.experienceLevel}
            </span>
          </div>
        </div>

        {/* Project Title */}
        <h3 
          className="card-title" 
          onClick={() => onViewDetails(request)}
          title="Click to view full team requirements"
        >
          {request.title}
        </h3>

        {/* Short Description */}
        <p className="card-desc">
          {request.shortDesc}
        </p>

        {/* Team Capacity & Open Positions Status Bar */}
        <div className="card-team-status">
          <div className="team-progress-info">
            <div className="avatar-stack">
              {(request.currentMembers || []).map((member, i) => (
                <img 
                  key={i} 
                  src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'} 
                  alt={member.name} 
                  title={`${member.name} (${member.role || 'Teammate'})`}
                />
              ))}
            </div>
            <span className="team-count-text">
              {request.currentTeamSize || 0} of {request.membersNeeded || 4} members
            </span>
          </div>

          <span className={`open-spots-pill ${isFull ? 'badge-slate' : 'badge-emerald'}`}>
            {isFull ? 'Team Full' : `${openPositions} seat${openPositions === 1 ? '' : 's'} remaining`}
          </span>
        </div>

        {/* Required Skills & Tech Stack Chips */}
        <div className="card-skills-list">
          {(request.skillsRequired || []).slice(0, 4).map((skill, idx) => (
            <span key={idx} className="skill-tag">
              {skill}
            </span>
          ))}
          {(request.skillsRequired || []).length > 4 && (
            <span className="skill-tag" style={{ color: 'var(--text-muted)' }}>
              +{request.skillsRequired.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Creator info, Deadline & Action buttons */}
      <div>
        <div className="card-meta-bar">
          <div 
            className="creator-info" 
            onClick={() => onViewDetails(request)}
            title={`Posted by ${request.creator?.name || 'Creator'}`}
          >
            <img 
              src={request.creator?.avatar || request.creator?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'} 
              alt={request.creator?.name || 'Creator'} 
            />
            <div>
              <div className="creator-name">{request.creator?.name || 'Project Lead'}</div>
              <div className="creator-college">{request.creator?.college || 'Campus Student'}</div>
            </div>
          </div>

          <div className="deadline-indicator">
            <div className="deadline-label">Deadline</div>
            <div className="deadline-val" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
              <span>{request.deadlineDisplay || 'Flexible'}</span>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="card-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => onViewDetails(request)}
            id={`details-btn-${request.id}`}
          >
            <span>View Details</span>
          </button>

          {canDelete ? (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleDeleteClick}
              id={`delete-btn-${request.id}`}
              style={{ color: 'var(--accent-rose)', borderColor: '#fecdd3', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="Delete this team post"
            >
              <Trash2 size={14} />
              <span>Delete Post</span>
            </button>
          ) : (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => onApply(request)}
              disabled={isFull}
              id={`apply-btn-${request.id}`}
              style={isFull ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              <span>Apply to Team</span>
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
