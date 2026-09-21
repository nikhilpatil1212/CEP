import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, Check, AlertCircle } from 'lucide-react';
import { CATEGORIES, EXPERIENCE_LEVELS, SAMPLE_USER_PROFILE } from '../data/mockData';

export default function CreateRequestModal({ isOpen, onClose, onCreateSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Hackathons',
    eventName: '',
    shortDesc: '',
    fullDesc: '',
    skillsRequired: '',
    techStack: '',
    membersNeeded: '4',
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

    const newRequest = {
      id: `req-${Date.now()}`,
      title: formData.title,
      category: formData.category,
      eventName: formData.eventName || (formData.category === 'Hackathons' ? 'Upcoming Hackathon' : 'Campus Project'),
      shortDesc: formData.shortDesc,
      fullDesc: formData.fullDesc || formData.shortDesc,
      creator: {
        name: SAMPLE_USER_PROFILE.name,
        college: `${SAMPLE_USER_PROFILE.college} • ${SAMPLE_USER_PROFILE.year.split(' ')[0]}`,
        avatar: SAMPLE_USER_PROFILE.avatar,
        role: 'Project Creator',
        bio: SAMPLE_USER_PROFILE.bio
      },
      skillsRequired: skillsList,
      techStack: techList,
      membersNeeded: parseInt(formData.membersNeeded, 10) || 4,
      currentTeamSize: parseInt(formData.currentTeamSize, 10) || 1,
      openRoles: rolesList,
      currentMembers: [
        {
          name: SAMPLE_USER_PROFILE.name,
          role: 'Team Lead',
          college: SAMPLE_USER_PROFILE.college,
          avatar: SAMPLE_USER_PROFILE.avatar
        }
      ],
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

            {/* Team Size, Experience Level & Deadline */}
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="field-members">
                  Total Team Goal
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
