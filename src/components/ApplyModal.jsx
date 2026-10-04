import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, CheckCircle, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_USER_PROFILE } from '../data/mockData';

export default function ApplyModal({ request, isOpen, onClose, onApplySuccess, user: propUser }) {
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser || SAMPLE_USER_PROFILE;

  const [selectedRole, setSelectedRole] = useState('');
  const [pitch, setPitch] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [hoursCommitment, setHoursCommitment] = useState('10-15 hrs/week');

  // Sync state when modal opens or user profile changes
  useEffect(() => {
    if (isOpen) {
      const userGithub = currentUser?.links?.github || currentUser?.github || '';
      setPortfolioLink(userGithub);
      if (request?.openRoles && request.openRoles.length > 0) {
        setSelectedRole(request.openRoles[0]);
      }
    }
  }, [isOpen, currentUser, request]);

  if (!isOpen || !request) return null;

  const defaultRole = request.openRoles && request.openRoles.length > 0 ? request.openRoles[0] : 'Teammate';

  // Safely check if the current user is the owner/creator of the team request
  const checkIsOwner = () => {
    if (!currentUser || !request) return false;

    const currentUserId = currentUser.id ? String(currentUser.id).trim() : null;
    const currentUserEmail = (currentUser.email || currentUser.links?.email || '').trim().toLowerCase();
    const currentUserName = (currentUser.name || '').trim().toLowerCase();

    const requestCreatorId = (request.creatorId || request.creator?.id)
      ? String(request.creatorId || request.creator?.id).trim()
      : null;
    const requestCreatorEmail = (request.creatorEmail || request.creator?.email || '').trim().toLowerCase();
    const requestCreatorName = (request.creator?.name || '').trim().toLowerCase();

    // 1. Strict ID match (ONLY if both IDs are non-empty strings)
    if (currentUserId && requestCreatorId) {
      return currentUserId === requestCreatorId;
    }

    // 2. Strict Email match (ONLY if both emails are non-empty strings)
    if (currentUserEmail && requestCreatorEmail) {
      return currentUserEmail === requestCreatorEmail;
    }

    // 3. Name match fallback (ONLY if both names are non-empty strings)
    if (currentUserName && requestCreatorName) {
      return currentUserName === requestCreatorName;
    }

    return false;
  };

  const isOwner = checkIsOwner();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isOwner) return;

    onApplySuccess(request, {
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applicantEmail: currentUser.email || currentUser.links?.email,
      applicantCollege: currentUser.college,
      applicantAvatar: currentUser.avatar,
      roleApplied: selectedRole || defaultRole,
      pitch: pitch || "Hey! I saw your request and would love to collaborate. I have experience and would be glad to contribute to the team.",
      portfolioLink: portfolioLink || currentUser.links?.github || 'https://github.com',
      hoursCommitment
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div>
            <span className="badge badge-emerald" style={{ marginBottom: '0.35rem' }}>
              Student Application
            </span>
            <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>
              Apply to join {request.eventName}
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Project Banner Reminder */}
            <div style={{
              background: 'var(--surface-alt)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project:</div>
              <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{request.title}</strong>
            </div>

            {/* Applicant Summary with Authenticated User Profile */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              marginBottom: '1.25rem',
              padding: '0.85rem 1rem',
              background: 'var(--primary-light)',
              border: '1px solid #c7d2fe',
              borderRadius: 'var(--radius-md)'
            }}>
              <img 
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                alt={currentUser.name} 
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Applying as: {currentUser.name}</span>
                  {currentUser.isVerified && (
                    <span title="Verified Campus Student" style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>✓</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {currentUser.college || 'Campus Student'} • {currentUser.role || 'Student Developer'}
                </div>
              </div>
            </div>

            {/* Creator Self-Apply Warning */}
            {isOwner && (
              <div style={{
                background: 'var(--accent-amber-light)',
                border: '1px solid #fde68a',
                color: '#92400e',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.88rem'
              }}>
                <AlertCircle size={18} />
                <span>You created this team request. As the project lead, you cannot apply to your own team.</span>
              </div>
            )}

            {/* Desired Role */}
            <div className="form-group">
              <label className="form-label" htmlFor="apply-role">
                Which role are you applying for?
              </label>
              <select 
                id="apply-role"
                className="form-select"
                value={selectedRole || defaultRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isOwner}
              >
                {request.openRoles && request.openRoles.length > 0 ? (
                  request.openRoles.map((role, idx) => (
                    <option key={idx} value={role}>{role}</option>
                  ))
                ) : (
                  <option value="General Teammate">General Teammate</option>
                )}
                <option value="Flexible Contributor">Flexible / Cross-Functional Contributor</option>
              </select>
            </div>

            {/* Quick Pitch */}
            <div className="form-group">
              <label className="form-label" htmlFor="apply-pitch">
                Quick Pitch & Relevance
              </label>
              <textarea 
                id="apply-pitch"
                className="form-textarea"
                placeholder="Share a sentence or two on why you're excited about this project and what relevant tools you've used..."
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                style={{ minHeight: '85px' }}
                disabled={isOwner}
                defaultValue="Hey! I saw your request and would love to collaborate. I have experience and would be glad to contribute to the team."
              />
            </div>

            {/* Portfolio / GitHub Link & Hours */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="apply-portfolio">
                  Portfolio or GitHub URL
                </label>
                <input 
                  id="apply-portfolio"
                  type="text"
                  className="form-input"
                  placeholder="https://github.com/your-handle"
                  value={portfolioLink}
                  onChange={(e) => setPortfolioLink(e.target.value)}
                  disabled={isOwner}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="apply-hours">
                  Weekly Commitment
                </label>
                <select 
                  id="apply-hours"
                  className="form-select"
                  value={hoursCommitment}
                  onChange={(e) => setHoursCommitment(e.target.value)}
                  disabled={isOwner}
                >
                  <option value="5-10 hrs/week">5-10 hrs/week</option>
                  <option value="10-15 hrs/week">10-15 hrs/week</option>
                  <option value="Hackathon Sprint (Full Weekend)">Hackathon Sprint (Full Weekend)</option>
                  <option value="15+ hrs/week">15+ hrs/week</option>
                </select>
              </div>
            </div>

            {/* Application review note */}
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              background: '#f8fafc',
              border: '1px dashed var(--border)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              💡 <em>Your profile information and pitch will be sent directly to the team owner for review.</em>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              id="submit-application-btn"
              disabled={isOwner}
              style={isOwner ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Send size={15} />
              <span>Submit Application</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
