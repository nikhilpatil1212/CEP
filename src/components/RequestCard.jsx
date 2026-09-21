import React from 'react';
import { Calendar, Users, Flame, ArrowUpRight, Award, Briefcase } from 'lucide-react';

export default function RequestCard({ request, onViewDetails, onApply }) {
  const openPositions = Math.max(0, request.membersNeeded - request.currentTeamSize);
  const isFull = openPositions === 0;

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
              {request.currentMembers.map((member, i) => (
                <img 
                  key={i} 
                  src={member.avatar} 
                  alt={member.name} 
                  title={`${member.name} (${member.role})`}
                />
              ))}
            </div>
            <span className="team-count-text">
              {request.currentTeamSize} of {request.membersNeeded} members
            </span>
          </div>

          <span className={`open-spots-pill ${isFull ? 'badge-slate' : 'badge-emerald'}`}>
            {isFull ? 'Team Full' : `${openPositions} spot${openPositions > 1 ? 's' : ''} left`}
          </span>
        </div>

        {/* Required Skills & Tech Stack Chips */}
        <div className="card-skills-list">
          {request.skillsRequired.slice(0, 4).map((skill, idx) => (
            <span key={idx} className="skill-tag">
              {skill}
            </span>
          ))}
          {request.skillsRequired.length > 4 && (
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
            title={`Posted by ${request.creator.name}`}
          >
            <img src={request.creator.avatar} alt={request.creator.name} />
            <div>
              <div className="creator-name">{request.creator.name}</div>
              <div className="creator-college">{request.creator.college}</div>
            </div>
          </div>

          <div className="deadline-indicator">
            <div className="deadline-label">Deadline</div>
            <div className="deadline-val" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
              <span>{request.deadlineDisplay}</span>
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
        </div>
      </div>
    </article>
  );
}
