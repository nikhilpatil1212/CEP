import React, { useState } from 'react';
import { X, Send, Sparkles, CheckCircle, UserCheck } from 'lucide-react';
import { SAMPLE_USER_PROFILE } from '../data/mockData';

export default function ApplyModal({ request, isOpen, onClose, onApplySuccess }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [pitch, setPitch] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('github.com/onkar-dev');
  const [hoursCommitment, setHoursCommitment] = useState('10-15 hrs/week');

  if (!isOpen || !request) return null;

  const defaultRole = request.openRoles && request.openRoles.length > 0 ? request.openRoles[0] : 'Teammate';

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplySuccess(request.title, selectedRole || defaultRole);
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
              Student Application Preview
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

            {/* Applicant Summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
              padding: '0.75rem',
              background: 'var(--primary-light)',
              borderRadius: 'var(--radius-md)'
            }}>
              <img 
                src={SAMPLE_USER_PROFILE.avatar} 
                alt={SAMPLE_USER_PROFILE.name} 
                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Applying as: {SAMPLE_USER_PROFILE.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {SAMPLE_USER_PROFILE.college} • {SAMPLE_USER_PROFILE.role}
                </div>
              </div>
            </div>

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
                defaultValue="Hey! I saw your request and would love to collaborate. I have experience building React apps and have worked on similar hackathon projects."
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
                  value={portfolioLink}
                  onChange={(e) => setPortfolioLink(e.target.value)}
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
                >
                  <option value="5-10 hrs/week">5-10 hrs/week</option>
                  <option value="10-15 hrs/week">10-15 hrs/week</option>
                  <option value="Hackathon Sprint (Full Weekend)">Hackathon Sprint (Full Weekend)</option>
                  <option value="15+ hrs/week">15+ hrs/week</option>
                </select>
              </div>
            </div>

            {/* Scope disclaimer */}
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              background: '#f8fafc',
              border: '1px dashed var(--border)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              💡 <em>Prototype demo note: Submitting here will trigger an instant demo confirmation and simulate the applicant notification.</em>
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
            >
              <Send size={15} />
              <span>Send Demo Application</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
