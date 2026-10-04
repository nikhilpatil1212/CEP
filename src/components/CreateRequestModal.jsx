import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, Check, AlertCircle } from 'lucide-react';
import { CATEGORIES, EXPERIENCE_LEVELS, SAMPLE_USER_PROFILE } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export default function CreateRequestModal({ isOpen, onClose, onCreateSubmit, user: propUser }) {
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser || SAMPLE_USER_PROFILE;

  const [formData, setFormData] = useState({
    title: '',
    category: 'Hackathons',
    eventName: '',
    shortDesc: '',
    fullDesc: '',
    skillsRequired: '',
    techStack: '',
    membersNeeded: '4',
    ownerIncluded: 'true',
    currentTeamSize: '1',
    experienceLevel: 'Intermediate',
    openRoles: '',
    deadline: '',
    requirements: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrorMsg('Please provide a project or hackathon name.');
      return;
    }

    if (!formData.shortDesc.trim()) {
      setErrorMsg('Please provide a short description.');
      return;
    }

    if (formData.ownerIncluded === '' || formData.ownerIncluded === undefined || formData.ownerIncluded === null) {
      setErrorMsg('Please specify whether you are included in this team.');
      return;
    }

    // Split skills & tech stack by commas or spaces
    const skillsList = formData.skillsRequired
      ? formData.skillsRequired.split(',').map(s => s.trim()).filter(Boolean)
      : ['React', 'JavaScript'];

    const techList = formData.techStack
      ? formData.techStack.split(',').map(s => s.trim()).filter(Boolean)
      : ['React', 'Vite', 'CSS'];

    const rolesList = formData.openRoles
      ? formData.openRoles.split(',').map(r => r.trim()).filter(Boolean)
      : ['Frontend Developer'];

    const reqsList = formData.requirements
      ? formData.requirements.split('\n').map(r => r.trim()).filter(Boolean)
      : ['Team player with good communication', 'Ready to hack during event days'];

    const creatorUserId = currentUser.id || `user-${Date.now()}`;
    const creatorUserEmail = currentUser.email || currentUser.links?.email || '';
    const isOwnerIncluded = formData.ownerIncluded === 'true' || formData.ownerIncluded === true;
    const membersNeeded = parseInt(formData.membersNeeded, 10) || 4;
    const initialTeamSize = isOwnerIncluded ? 1 : 0;

    const newRequest = {
      id: `req-${Date.now()}`,
      title: formData.title,
      category: formData.category,
      eventName: formData.eventName || (formData.category === 'Hackathons' ? 'Upcoming Hackathon' : 'Campus Project'),
      shortDesc: formData.shortDesc,
      fullDesc: formData.fullDesc || formData.shortDesc,
      creator: {
        id: creatorUserId,
        name: currentUser.name,
        email: creatorUserEmail,
        college: `${currentUser.college || 'Campus Student'}`,
        avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        role: currentUser.role || 'Project Creator',
        bio: currentUser.bio || ''
      },
      creatorId: creatorUserId,
      creatorEmail: creatorUserEmail,
      skillsRequired: skillsList,
      techStack: techList,
      membersNeeded: membersNeeded,
      currentTeamSize: initialTeamSize,
      ownerIncluded: isOwnerIncluded,
      openRoles: rolesList,
      currentMembers: isOwnerIncluded ? [
        {
          name: currentUser.name,
          role: 'Team Lead',
          college: currentUser.college || 'Campus Student',
          avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'
        }
      ] : [],
      experienceLevel: formData.experienceLevel,
      deadline: formData.deadline || '2026-11-20',
      deadlineDisplay: formData.deadline ? new Date(formData.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Nov 20, 2026',
      daysLeft: 14,
      urgent: false,
      featured: true,
      requirements: reqsList
    };

    onCreateSubmit(newRequest);
    onClose();
  };

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
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PlusCircle size={20} />
            </div>
            <div>
              <h2 className="modal-title">Create a Team Request</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Describe your project, roles needed, and ideal student teammates.
              </p>
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'var(--accent-rose-light)',
                border: '1px solid #fecdd3',
                color: 'var(--accent-rose)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.9rem'
              }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Project / Event Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-title">
                Project / Hackathon Title <span className="required-star">*</span>
              </label>
              <input 
                id="field-title"
                name="title"
                type="text"
                className="form-input"
                placeholder="e.g. KrishiSetu AI - Smart Crop Advisory"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Category & Event Name */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="field-category">
                  Category
                </label>
                <select 
                  id="field-category"
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="field-event">
                  Event / Course / Lab Name
                </label>
                <input 
                  id="field-event"
                  name="eventName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Smart India Hackathon (SIH 2026) or Capstone"
                  value={formData.eventName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Short Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-shortDesc">
                Short Elevator Pitch <span className="required-star">*</span>
              </label>
              <input 
                id="field-shortDesc"
                name="shortDesc"
                type="text"
                className="form-input"
                placeholder="A punchy 1-2 sentence overview displayed on browse cards"
                value={formData.shortDesc}
                onChange={handleChange}
                required
              />
            </div>

            {/* Full Detailed Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-fullDesc">
                Detailed Project Description & Vision
              </label>
              <textarea 
                id="field-fullDesc"
                name="fullDesc"
                className="form-textarea"
                placeholder="Describe what problem you're tackling, current architecture progress, and what you aim to demo..."
                value={formData.fullDesc}
                onChange={handleChange}
              />
            </div>

            {/* Required Skills & Tech Stack */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="field-skills">
                  Required Skills (comma-separated)
                </label>
                <input 
                  id="field-skills"
                  name="skillsRequired"
                  type="text"
                  className="form-input"
                  placeholder="e.g. React, FastAPI, PyTorch, Figma"
                  value={formData.skillsRequired}
                  onChange={handleChange}
                />
                <div className="form-hint">Key tools prospective teammates should know</div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="field-tech">
                  Tech Stack (comma-separated)
                </label>
                <input 
                  id="field-tech"
                  name="techStack"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Python, Docker, Supabase, Tailwind"
                  value={formData.techStack}
                  onChange={handleChange}
                />
                <div className="form-hint">Architecture & libraries planned</div>
              </div>
            </div>

            {/* Are you included in this team? * (Required Field) */}
            <div className="form-group" style={{ 
              background: 'var(--surface-alt)', 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border)' 
            }}>
              <label className="form-label" style={{ marginBottom: '0.45rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Are you included in this team?</span>
                <span className="required-star" style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  cursor: 'pointer', 
                  fontWeight: 500,
                  fontSize: '0.92rem'
                }}>
                  <input 
                    type="radio" 
                    id="owner-included-yes"
                    name="ownerIncluded" 
                    value="true" 
                    checked={formData.ownerIncluded === 'true'} 
                    onChange={handleChange} 
                    required 
                  />
                  <span><strong>Yes</strong> (I occupy 1 seat as Team Member)</span>
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  cursor: 'pointer', 
                  fontWeight: 500,
                  fontSize: '0.92rem'
                }}>
                  <input 
                    type="radio" 
                    id="owner-included-no"
                    name="ownerIncluded" 
                    value="false" 
                    checked={formData.ownerIncluded === 'false'} 
                    onChange={handleChange} 
                    required 
                  />
                  <span><strong>No</strong> (I manage only as Owner, 0 seats occupied)</span>
                </label>
              </div>

              <div style={{ 
                fontSize: '0.82rem', 
                color: 'var(--text-secondary)', 
                marginTop: '0.55rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ 
                  background: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  fontWeight: 700, 
                  padding: '0.15rem 0.45rem', 
                  borderRadius: 'var(--radius-sm)' 
                }}>
                  Seat Calculation
                </span>
                <span>
                  Max Team Size: <strong>{formData.membersNeeded}</strong> | Initial Occupied: <strong>{formData.ownerIncluded === 'true' ? '1 (Owner)' : '0'}</strong> | Initial Remaining Seats: <strong style={{ color: '#059669' }}>{formData.ownerIncluded === 'true' ? (parseInt(formData.membersNeeded, 10) || 4) - 1 : (parseInt(formData.membersNeeded, 10) || 4)}</strong>
                </span>
              </div>
            </div>

            {/* Team Size, Experience Level & Deadline */}
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="field-members">
                  Total Team Goal <span className="required-star">*</span>
                </label>
                <select 
                  id="field-members"
                  name="membersNeeded"
                  className="form-select"
                  value={formData.membersNeeded}
                  onChange={handleChange}
                >
                  <option value="2">2 Members</option>
                  <option value="3">3 Members</option>
                  <option value="4">4 Members (Standard)</option>
                  <option value="5">5 Members</option>
                  <option value="6">6 Members</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="field-level">
                  Experience Level
                </label>
                <select 
                  id="field-level"
                  name="experienceLevel"
                  className="form-select"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                >
                  {EXPERIENCE_LEVELS.filter(l => l !== 'All Levels').map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="field-deadline">
                  Application Deadline
                </label>
                <input 
                  id="field-deadline"
                  name="deadline"
                  type="date"
                  className="form-input"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Preferred Roles */}
            <div className="form-group">
              <label className="form-label" htmlFor="field-roles">
                Preferred Roles Needed (comma-separated)
              </label>
              <input 
                id="field-roles"
                name="openRoles"
                type="text"
                className="form-input"
                placeholder="e.g. Lead Frontend (React), UI/UX Designer, ML Engineer"
                value={formData.openRoles}
                onChange={handleChange}
              />
            </div>

            {/* Additional Requirements */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="field-reqs">
                Additional Requirements / Expectations
              </label>
              <textarea 
                id="field-reqs"
                name="requirements"
                className="form-textarea"
                style={{ minHeight: '70px' }}
                placeholder="e.g. Available for weekly syncs, passion for healthcare tech, 10 hrs/week commitment"
                value={formData.requirements}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Footer */}
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
              id="submit-create-request-btn"
            >
              <Sparkles size={16} />
              <span>Publish Team Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
