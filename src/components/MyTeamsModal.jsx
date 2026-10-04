import React, { useState, useEffect } from 'react';
import { 
  X, Users, PlusCircle, Settings, Trash2, Edit3, Check, AlertTriangle, 
  ArrowLeft, ShieldCheck, UserCheck, Clock, ArrowUpRight, Sparkles 
} from 'lucide-react';
import { 
  getMyTeams, 
  updateTeamApi, 
  deleteTeamApi, 
  getTeamApplications, 
  acceptApplicationApi, 
  rejectApplicationApi,
  deleteApplicationApi
} from '../services/api';

export default function MyTeamsModal({
  isOpen,
  onClose,
  onOpenCreate,
  onTeamUpdated,
  showToast
}) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamApplications, setTeamApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // Edit mode inside selected team
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load owned teams
  const loadMyTeams = async () => {
    setLoading(true);
    try {
      const data = await getMyTeams();
      if (Array.isArray(data)) {
        setTeams(data);
      }
    } catch (err) {
      console.warn('Failed to load owned teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMyTeams();
      setSelectedTeam(null);
      setIsEditing(false);
      setConfirmDeleteId(null);
    }
  }, [isOpen]);

  // Load applications when a specific team is opened
  const handleSelectTeam = async (team) => {
    setSelectedTeam(team);
    setIsEditing(false);
    setEditError('');
    setEditFormData({
      title: team.title || '',
      eventName: team.eventName || '',
      shortDesc: team.shortDesc || '',
      fullDesc: team.fullDesc || '',
      skillsRequired: Array.isArray(team.skillsRequired) ? team.skillsRequired.join(', ') : (team.skillsRequired || ''),
      techStack: Array.isArray(team.techStack) ? team.techStack.join(', ') : (team.techStack || ''),
      membersNeeded: String(team.membersNeeded || 4),
      experienceLevel: team.experienceLevel || 'Intermediate'
    });

    setLoadingApps(true);
    try {
      const apps = await getTeamApplications(team.id);
      if (Array.isArray(apps)) {
        setTeamApplications(apps);
      } else {
        setTeamApplications([]);
      }
    } catch (err) {
      console.warn('Failed to load applications for team:', err);
      setTeamApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  // Handle Approve Application
  const handleApprove = async (appId) => {
    setActionLoadingId(appId);
    try {
      const res = await acceptApplicationApi(appId);
      if (showToast) showToast('🎉 Application approved and student added to roster!');

      // Update local team membership & seats
      if (res && res.updatedRequest) {
        setSelectedTeam(res.updatedRequest);
        setTeams(prev => prev.map(t => t.id === res.updatedRequest.id ? res.updatedRequest : t));
        if (onTeamUpdated) onTeamUpdated(res.updatedRequest);
      } else {
        // Fallback state update
        setSelectedTeam(prev => {
          if (!prev) return prev;
          const newSize = (prev.currentTeamSize || 1) + 1;
          const targetApp = teamApplications.find(a => a.id === appId);
          const newMember = {
            name: targetApp?.applicant_name || 'Teammate',
            role: targetApp?.role_applied || 'Teammate',
            college: targetApp?.applicant_college || 'Campus Student',
            avatar: targetApp?.applicant_avatar || ''
          };
          const updated = {
            ...prev,
            currentTeamSize: newSize,
            currentMembers: [...(prev.currentMembers || []), newMember]
          };
          setTeams(tList => tList.map(t => t.id === updated.id ? updated : t));
          if (onTeamUpdated) onTeamUpdated(updated);
          return updated;
        });
      }

      // Update application status in list
      setTeamApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'APPROVED' } : a));
    } catch (err) {
      if (showToast) showToast(`❌ ${err.message || 'Failed to approve application'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Deny Application
  const handleDeny = async (appId) => {
    setActionLoadingId(appId);
    try {
      await rejectApplicationApi(appId);
      if (showToast) showToast('Application denied.');
      setTeamApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'DENIED' } : a));
    } catch (err) {
      if (showToast) showToast(`❌ ${err.message || 'Failed to deny application'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Save Team Edits
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editFormData.title.trim()) {
      setEditError('Team title is required.');
      return;
    }

    const newMembersNeeded = parseInt(editFormData.membersNeeded, 10);
    const occupiedSeats = selectedTeam.currentTeamSize || 0;
    if (newMembersNeeded < occupiedSeats) {
      setEditError(`Cannot set team size to ${newMembersNeeded}. The team already has ${occupiedSeats} occupied seat(s).`);
      return;
    }

    setSavingEdit(true);
    try {
      const skillsArray = editFormData.skillsRequired
        ? editFormData.skillsRequired.split(',').map(s => s.trim()).filter(Boolean)
        : selectedTeam.skillsRequired;

      const techArray = editFormData.techStack
        ? editFormData.techStack.split(',').map(s => s.trim()).filter(Boolean)
        : selectedTeam.techStack;

      const payload = {
        title: editFormData.title,
        eventName: editFormData.eventName,
        shortDesc: editFormData.shortDesc,
        fullDesc: editFormData.fullDesc,
        skillsRequired: skillsArray,
        techStack: techArray,
        membersNeeded: newMembersNeeded,
        experienceLevel: editFormData.experienceLevel
      };

      const updated = await updateTeamApi(selectedTeam.id, payload);
      setSelectedTeam(updated);
      setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (onTeamUpdated) onTeamUpdated(updated);
      setIsEditing(false);
      if (showToast) showToast('✅ Team details updated successfully.');
    } catch (err) {
      setEditError(err.message || 'Failed to update team.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    setDeleting(true);
    try {
      await deleteTeamApi(teamId);
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setSelectedTeam(null);
      setConfirmDeleteId(null);
      if (showToast) showToast('🗑️ Team deleted successfully.');
      if (onTeamUpdated) onTeamUpdated({ id: teamId, deleted: true });
    } catch (err) {
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setSelectedTeam(null);
      setConfirmDeleteId(null);
      if (onTeamUpdated) onTeamUpdated({ id: teamId, deleted: true });
      if (showToast) showToast(`🗑️ ${err.message || 'Team deleted.'}`);
    } finally {
      setDeleting(false);
    }
  };

  // Handle Remove Old/Processed Application
  const handleRemoveApplication = async (appId) => {
    try {
      await deleteApplicationApi(appId);
      setTeamApplications(prev => prev.filter(a => a.id !== appId));
      if (showToast) showToast('Old application removed.');
    } catch (err) {
      if (showToast) showToast(`❌ ${err.message || 'Failed to remove application'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-lg" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 840 }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {selectedTeam ? (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => { setSelectedTeam(null); setIsEditing(false); }}
                style={{ padding: '0.35rem 0.6rem' }}
                title="Back to all my teams"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            ) : (
              <div className="logo-badge" style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)' }}>
                <Users size={18} />
              </div>
            )}
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>
                {selectedTeam ? selectedTeam.title : 'My Teams'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {selectedTeam 
                  ? 'Manage team requirements, member roster, and incoming applications' 
                  : 'Teams created and managed by you'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close My Teams Modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {selectedTeam ? (
            /* --- SINGLE TEAM MANAGEMENT VIEW --- */
            <div>
              {/* Action Toolbar */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '1.2rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
                paddingBottom: '0.85rem',
                borderBottom: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span className="badge badge-primary">
                    {selectedTeam.category || 'Hackathon'}
                  </span>
                  {selectedTeam.eventName && (
                    <span className="badge badge-slate">
                      {selectedTeam.eventName}
                    </span>
                  )}
                  <span className={`badge ${selectedTeam.ownerIncluded ? 'badge-emerald' : 'badge-slate'}`}>
                    {selectedTeam.ownerIncluded ? 'Owner Included (1 Seat)' : 'Owner Managing Only (0 Seats)'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {!isEditing ? (
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 size={14} />
                      <span>Edit Details</span>
                    </button>
                  ) : (
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setIsEditing(false)}
                    >
                      <span>Cancel Edit</span>
                    </button>
                  )}

                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setConfirmDeleteId(selectedTeam.id)}
                    style={{ color: 'var(--accent-rose)', borderColor: '#fecdd3' }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Team</span>
                  </button>
                </div>
              </div>

              {/* Delete Confirmation Alert */}
              {confirmDeleteId === selectedTeam.id && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecdd3',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <AlertTriangle size={20} color="#e11d48" />
                    <div>
                      <strong style={{ color: '#9f1239', fontSize: '0.92rem' }}>Permanently Delete This Team?</strong>
                      <div style={{ fontSize: '0.82rem', color: '#be123c' }}>
                        This will remove the team, all pending applications, and roster memberships. This action cannot be undone.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleDeleteTeam(selectedTeam.id)}
                      disabled={deleting}
                      style={{ background: '#e11d48', borderColor: '#e11d48' }}
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete Team'}
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Team Form (if isEditing) */}
              {isEditing ? (
                <form onSubmit={handleSaveEdit} style={{ 
                  background: 'var(--surface-alt)', 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Edit3 size={16} />
                    <span>Edit Team Information</span>
                  </h3>

                  {editError && (
                    <div style={{
                      padding: '0.65rem 0.85rem',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.86rem',
                      marginBottom: '1rem'
                    }}>
                      {editError}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Team Title *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editFormData.title} 
                      onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Event / Hackathon Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={editFormData.eventName} 
                        onChange={e => setEditFormData({ ...editFormData, eventName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Maximum Team Size *</label>
                      <select 
                        className="form-select"
                        value={editFormData.membersNeeded}
                        onChange={e => setEditFormData({ ...editFormData, membersNeeded: e.target.value })}
                      >
                        <option value="2">2 Members</option>
                        <option value="3">3 Members</option>
                        <option value="4">4 Members</option>
                        <option value="5">5 Members</option>
                        <option value="6">6 Members</option>
                      </select>
                      <div className="form-hint">
                        Current occupied seats: {selectedTeam.currentTeamSize || 0}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Short Elevator Pitch</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editFormData.shortDesc} 
                      onChange={e => setEditFormData({ ...editFormData, shortDesc: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Detailed Project Vision</label>
                    <textarea 
                      className="form-textarea" 
                      value={editFormData.fullDesc} 
                      onChange={e => setEditFormData({ ...editFormData, fullDesc: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Required Skills (comma-separated)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editFormData.skillsRequired} 
                      onChange={e => setEditFormData({ ...editFormData, skillsRequired: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setIsEditing(false)}
                      disabled={savingEdit}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm"
                      disabled={savingEdit}
                    >
                      <Check size={14} />
                      <span>{savingEdit ? 'Saving...' : 'Save Team Changes'}</span>
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Roster & Seat Summary Card */}
              <div style={{
                background: 'var(--surface-alt)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem',
                border: '1px solid var(--border)',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Capacity Goal</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {selectedTeam.membersNeeded} Members
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Occupied Seats</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {selectedTeam.currentTeamSize || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remaining Available Seats</div>
                  <div style={{ 
                    fontSize: '1.35rem', 
                    fontWeight: 800, 
                    color: Math.max(0, (selectedTeam.membersNeeded || 4) - (selectedTeam.currentTeamSize || 0)) > 0 ? '#059669' : '#e11d48' 
                  }}>
                    {Math.max(0, (selectedTeam.membersNeeded || 4) - (selectedTeam.currentTeamSize || 0))}
                  </div>
                </div>
              </div>

              {/* Current Roster Members */}
              <div style={{ marginBottom: '1.8rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ShieldCheck size={18} color="var(--primary)" />
                  <span>Current Team Members ({selectedTeam.currentMembers?.length || selectedTeam.currentTeamSize || 0})</span>
                </h3>

                {(!selectedTeam.currentMembers || selectedTeam.currentMembers.length === 0) ? (
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.75rem', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    No members added yet. Approve incoming applications below to fill roster seats!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    {selectedTeam.currentMembers.map((member, idx) => (
                      <div 
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.75rem',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <img 
                          src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                          alt={member.name}
                          style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {member.role || 'Teammate'} • {member.college || 'PICT'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Incoming Applications Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <UserCheck size={18} color="#059669" />
                    <span>Incoming Student Applications ({teamApplications.length})</span>
                  </h3>
                </div>

                {loadingApps ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Loading student applications...
                  </div>
                ) : teamApplications.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    background: 'var(--surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border)',
                    color: 'var(--text-muted)'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      No applications submitted yet
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      Prospective teammates applying to this project will appear here for your review.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {teamApplications.map((app) => {
                      const isPending = app.status === 'PENDING';
                      const isApproved = app.status === 'APPROVED';
                      const isDenied = app.status === 'DENIED';
                      const isWithdrawn = app.status === 'WITHDRAWN';
                      const isProcessing = actionLoadingId === app.id;
                      const hasSeats = Math.max(0, (selectedTeam.membersNeeded || 4) - (selectedTeam.currentTeamSize || 0)) > 0;

                      return (
                        <div 
                          key={app.id}
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.1rem',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <img 
                                src={app.applicant_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                                alt={app.applicant_name}
                                style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                              />
                              <div>
                                <strong style={{ fontSize: '0.96rem', color: 'var(--text-main)' }}>
                                  {app.applicant_name}
                                </strong>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {app.applicant_college || 'Campus Member'} {app.applicant_email ? `• ${app.applicant_email}` : ''}
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {isPending && (
                                <span className="badge badge-amber" style={{ fontSize: '0.78rem' }}>
                                  Pending Review
                                </span>
                              )}
                              {isApproved && (
                                <span className="badge badge-emerald" style={{ fontSize: '0.78rem' }}>
                                  <Check size={12} />
                                  <span>Approved & In Roster</span>
                                </span>
                              )}
                              {isDenied && (
                                <span className="badge badge-rose" style={{ fontSize: '0.78rem' }}>
                                  Application Denied
                                </span>
                              )}
                              {isWithdrawn && (
                                <span className="badge badge-slate" style={{ fontSize: '0.78rem' }}>
                                  Withdrawn by Applicant
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Role & Pitch */}
                          <div style={{ marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                              Applied For: {app.role_applied}
                            </span>
                          </div>

                          <div style={{
                            background: 'var(--surface-alt)',
                            padding: '0.75rem 0.95rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.88rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            marginBottom: '0.75rem',
                            borderLeft: '3px solid var(--primary)'
                          }}>
                            "{app.pitch}"
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              {app.portfolio_link && (
                                <a 
                                  href={app.portfolio_link.startsWith('http') ? app.portfolio_link : `https://${app.portfolio_link}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                >
                                  <span>Portfolio</span>
                                  <ArrowUpRight size={13} />
                                </a>
                              )}
                              <span>Commitment: {app.hours_commitment || '10-15 hrs/week'}</span>
                            </div>

                            {/* Owner Action Buttons */}
                            {isPending && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleDeny(app.id)}
                                  disabled={isProcessing}
                                  style={{ color: 'var(--accent-rose)', borderColor: '#fecdd3' }}
                                >
                                  <X size={14} />
                                  <span>Deny</span>
                                </button>
                                <button 
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleApprove(app.id)}
                                  disabled={isProcessing || !hasSeats}
                                  title={!hasSeats ? 'No remaining seats available' : 'Accept applicant into roster'}
                                  style={{ background: '#059669', borderColor: '#059669' }}
                                >
                                  <Check size={14} />
                                  <span>{isProcessing ? 'Approving...' : !hasSeats ? 'Team Full' : 'Approve'}</span>
                                </button>
                              </div>
                            )}

                            {/* Remove old/processed application */}
                            {(isDenied || isWithdrawn) && (
                              <button 
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleRemoveApplication(app.id)}
                                title="Remove this application from list"
                                style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                              >
                                <Trash2 size={13} />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --- TEAMS LIST VIEW --- */
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading your teams...
                </div>
              ) : teams.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3.5rem 1.5rem',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--surface-alt)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    color: 'var(--text-subtle)'
                  }}>
                    <Users size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                    You haven't created any teams yet
                  </h3>
                  <p style={{ fontSize: '0.9rem', maxWidth: 440, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                    Start a new hackathon team or campus project to invite students and match with prospective teammates.
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => { onClose(); if (onOpenCreate) onOpenCreate(); }}
                  >
                    <PlusCircle size={16} />
                    <span>Create Your First Team</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {teams.map((team) => {
                    const remaining = Math.max(0, (team.membersNeeded || 4) - (team.currentTeamSize || 0));

                    return (
                      <div 
                        key={team.id}
                        className="my-team-card"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'var(--transition-fast)'
                        }}
                      >
                        <div>
                          {/* Category and Badges */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                              {team.category || 'Hackathons'}
                            </span>
                            <span className={`badge ${team.ownerIncluded ? 'badge-emerald' : 'badge-slate'}`} style={{ fontSize: '0.72rem' }}>
                              {team.ownerIncluded ? 'Owner in Team' : 'Owner Managing'}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                            {team.title}
                          </h3>

                          {team.eventName && (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                              🎯 {team.eventName}
                            </div>
                          )}

                          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                            {team.shortDesc}
                          </p>

                          {/* Skills preview */}
                          {team.skillsRequired && team.skillsRequired.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                              {team.skillsRequired.slice(0, 3).map((sk, idx) => (
                                <span key={idx} className="badge badge-slate" style={{ fontSize: '0.72rem' }}>
                                  {sk}
                                </span>
                              ))}
                              {team.skillsRequired.length > 3 && (
                                <span className="badge badge-slate" style={{ fontSize: '0.72rem' }}>
                                  +{team.skillsRequired.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Footer: Seats & Action */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              Seats: <strong>{team.currentTeamSize || 0} / {team.membersNeeded || 4}</strong>
                            </span>
                            <div style={{ fontSize: '0.78rem', color: remaining > 0 ? '#059669' : '#e11d48', fontWeight: 600 }}>
                              {remaining > 0 ? `${remaining} seat${remaining === 1 ? '' : 's'} remaining` : 'Team Full'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to permanently delete "${team.title}"?`)) {
                                  handleDeleteTeam(team.id);
                                }
                              }}
                              style={{ color: 'var(--accent-rose)', borderColor: '#fecdd3', padding: '0.35rem 0.55rem' }}
                              title="Delete this team post"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleSelectTeam(team)}
                            >
                              <Settings size={14} />
                              <span>Manage</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
