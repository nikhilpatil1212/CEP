import React, { useState, useEffect } from 'react';
import { 
  X, Users, PlusCircle, Settings, Trash2, Edit3, Check, AlertTriangle, 
  ArrowLeft, ShieldCheck, UserCheck, Clock, ArrowUpRight, Crown, Eye, 
  Calendar, Award, Code, CheckCircle, Ban, AlertCircle, Sparkles
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
import { useAuth } from '../context/AuthContext';

export default function MyTeamsModal({
  isOpen,
  onClose,
  onOpenCreate,
  onTeamUpdated,
  showToast,
  initialTeamId = null,
  initialManageMode = false
}) {
  const { user: authUser } = useAuth();
  
  // Tab state: 'ALL' | 'HOSTED' | 'JOINED'
  const [activeTab, setActiveTab] = useState('ALL');

  // Categorized teams
  const [teamsData, setTeamsData] = useState({
    all: [],
    hosted: [],
    joined: []
  });
  const [loading, setLoading] = useState(false);

  // Selected team for viewing or managing
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'view' | 'manage'
  const [manageSubTab, setManageSubTab] = useState('overview'); // 'overview' | 'members' | 'applications'

  // Applications state for selected team
  const [teamApplications, setTeamApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Edit mode inside manage view
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Current logged in user ID helper
  const currentUserId = authUser?.id ? String(authUser.id) : null;

  // Determine if user is leader of a given team
  const isTeamLeader = (team) => {
    if (!currentUserId || !team) return false;
    const creatorId = String(team.creatorId || team.creator?.id || '');
    return creatorId === currentUserId;
  };

  // Load user teams
  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await getMyTeams();
      if (data && typeof data === 'object') {
        const all = Array.isArray(data.all) ? data.all : (Array.isArray(data) ? data : []);
        const hosted = Array.isArray(data.hosted) 
          ? data.hosted 
          : all.filter(t => isTeamLeader(t));
        const joined = Array.isArray(data.joined) 
          ? data.joined 
          : all.filter(t => !isTeamLeader(t) && (t.currentMembers || []).some(m => String(m.userId) === currentUserId));

        setTeamsData({ all, hosted, joined });

        // If initialTeamId was passed, find and select it
        if (initialTeamId) {
          const match = all.find(t => String(t.id) === String(initialTeamId));
          if (match) {
            if (initialManageMode && isTeamLeader(match)) {
              handleOpenManage(match, 'applications');
            } else {
              handleOpenView(match);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load my teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTeams();
      if (!initialTeamId) {
        setSelectedTeam(null);
        setViewMode('list');
        setIsEditing(false);
        setConfirmDeleteId(null);
      }
    }
  }, [isOpen, initialTeamId]);

  // Open "View Team" (for Members and Leaders alike)
  const handleOpenView = (team) => {
    setSelectedTeam(team);
    setViewMode('view');
    setIsEditing(false);
  };

  // Open "Manage Team" (Leader only)
  const handleOpenManage = async (team, initialSubTab = 'overview') => {
    setSelectedTeam(team);
    setViewMode('manage');
    setManageSubTab(initialSubTab);
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

    // Fetch team applications for leader
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

  // Accept applicant into team roster
  const handleApprove = async (appId) => {
    // Capacity check
    const currentOccupied = selectedTeam.currentTeamSize || 0;
    const maxCapacity = selectedTeam.membersNeeded || 4;
    if (currentOccupied >= maxCapacity) {
      if (showToast) showToast('❌ Team has reached maximum capacity. Cannot accept more members.');
      return;
    }

    setActionLoadingId(appId);
    try {
      const res = await acceptApplicationApi(appId);
      if (showToast) showToast('🎉 Applicant accepted! Added to official team roster.');

      if (res && res.updatedRequest) {
        setSelectedTeam(res.updatedRequest);
        setTeamsData(prev => ({
          all: prev.all.map(t => t.id === res.updatedRequest.id ? res.updatedRequest : t),
          hosted: prev.hosted.map(t => t.id === res.updatedRequest.id ? res.updatedRequest : t),
          joined: prev.joined.map(t => t.id === res.updatedRequest.id ? res.updatedRequest : t)
        }));
        if (onTeamUpdated) onTeamUpdated(res.updatedRequest);
      } else {
        // Fallback state update
        const targetApp = teamApplications.find(a => a.id === appId);
        const newMember = {
          userId: targetApp?.applicant_id,
          name: targetApp?.applicant_name || 'Teammate',
          role: targetApp?.role_applied || 'Teammate',
          college: targetApp?.applicant_college || 'Campus Student',
          avatar: targetApp?.applicant_avatar || ''
        };
        const updated = {
          ...selectedTeam,
          currentTeamSize: currentOccupied + 1,
          currentMembers: [...(selectedTeam.currentMembers || []), newMember]
        };
        setSelectedTeam(updated);
        setTeamsData(prev => ({
          all: prev.all.map(t => t.id === updated.id ? updated : t),
          hosted: prev.hosted.map(t => t.id === updated.id ? updated : t),
          joined: prev.joined.map(t => t.id === updated.id ? updated : t)
        }));
        if (onTeamUpdated) onTeamUpdated(updated);
      }

      // Remove accepted application from pending list
      setTeamApplications(prev => prev.filter(a => a.id !== appId));
    } catch (err) {
      if (showToast) showToast(`❌ ${err.message || 'Failed to accept application'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject / deny applicant
  const handleDeny = async (appId) => {
    setActionLoadingId(appId);
    try {
      await rejectApplicationApi(appId);
      if (showToast) showToast('Application rejected.');
      // Remove from active pending list
      setTeamApplications(prev => prev.filter(a => a.id !== appId));
    } catch (err) {
      if (showToast) showToast(`❌ ${err.message || 'Failed to reject application'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Save Team Edits
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
      setTeamsData(prev => ({
        all: prev.all.map(t => t.id === updated.id ? updated : t),
        hosted: prev.hosted.map(t => t.id === updated.id ? updated : t),
        joined: prev.joined.map(t => t.id === updated.id ? updated : t)
      }));
      if (onTeamUpdated) onTeamUpdated(updated);
      setIsEditing(false);
      if (showToast) showToast('✅ Team details updated successfully.');
    } catch (err) {
      setEditError(err.message || 'Failed to update team.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId) => {
    setDeleting(true);
    try {
      await deleteTeamApi(teamId);
      setTeamsData(prev => ({
        all: prev.all.filter(t => t.id !== teamId),
        hosted: prev.hosted.filter(t => t.id !== teamId),
        joined: prev.joined.filter(t => t.id !== teamId)
      }));
      setSelectedTeam(null);
      setViewMode('list');
      setConfirmDeleteId(null);
      if (showToast) showToast('🗑️ Team deleted successfully.');
      if (onTeamUpdated) onTeamUpdated({ id: teamId, deleted: true });
    } catch (err) {
      setTeamsData(prev => ({
        all: prev.all.filter(t => t.id !== teamId),
        hosted: prev.hosted.filter(t => t.id !== teamId),
        joined: prev.joined.filter(t => t.id !== teamId)
      }));
      setSelectedTeam(null);
      setViewMode('list');
      setConfirmDeleteId(null);
      if (onTeamUpdated) onTeamUpdated({ id: teamId, deleted: true });
      if (showToast) showToast(`🗑️ ${err.message || 'Team deleted.'}`);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  // Active list based on active tab
  const activeTeamsList = activeTab === 'HOSTED' 
    ? teamsData.hosted 
    : activeTab === 'JOINED' 
      ? teamsData.joined 
      : teamsData.all;

  // Count helper
  const pendingAppsCount = teamApplications.filter(a => a.status === 'PENDING').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-lg" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 880 }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {viewMode !== 'list' ? (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => { setSelectedTeam(null); setViewMode('list'); setIsEditing(false); }}
                style={{ padding: '0.35rem 0.65rem' }}
                title="Back to teams list"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            ) : (
              <div className="logo-badge" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)' }}>
                <Users size={19} />
              </div>
            )}
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{selectedTeam ? selectedTeam.title : 'My Teams'}</span>
                {viewMode === 'manage' && (
                  <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>Leader Dashboard</span>
                )}
                {viewMode === 'view' && (
                  <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>Team View</span>
                )}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {viewMode === 'manage'
                  ? 'Manage your team overview, roster members, and applicant reviews'
                  : viewMode === 'view'
                    ? 'View project details, requirements, and roster teammates'
                    : 'Manage teams you host and access project rosters you have joined'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close My Teams Modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          
          {/* ======================================================== */}
          {/* 1. TEAMS LIST VIEW (With ALL, TEAMS I HOST, TEAMS I JOINED) */}
          {/* ======================================================== */}
          {viewMode === 'list' && (
            <div>
              {/* Three Section Tabs */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.85rem',
                marginBottom: '1.25rem',
                overflowX: 'auto'
              }}>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('ALL')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <span>ALL</span>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                    background: activeTab === 'ALL' ? 'rgba(255,255,255,0.25)' : 'var(--surface-alt)',
                    color: activeTab === 'ALL' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 700
                  }}>
                    {teamsData.all.length}
                  </span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'HOSTED' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('HOSTED')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Crown size={14} />
                  <span>TEAMS I HOST</span>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                    background: activeTab === 'HOSTED' ? 'rgba(255,255,255,0.25)' : 'var(--surface-alt)',
                    color: activeTab === 'HOSTED' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 700
                  }}>
                    {teamsData.hosted.length}
                  </span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'JOINED' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('JOINED')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <ShieldCheck size={14} />
                  <span>TEAMS I JOINED</span>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                    background: activeTab === 'JOINED' ? 'rgba(255,255,255,0.25)' : 'var(--surface-alt)',
                    color: activeTab === 'JOINED' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 700
                  }}>
                    {teamsData.joined.length}
                  </span>
                </button>
              </div>

              {/* Team Cards Grid or Empty States */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading your teams...
                </div>
              ) : activeTeamsList.length === 0 ? (
                /* Empty States specifically tailored per tab as required */
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

                  {activeTab === 'ALL' && (
                    <>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                        You are not part of any teams yet.
                      </h3>
                      <p style={{ fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                        Host a new project or explore open hackathon requests to join an existing student squad.
                      </p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => { onClose(); if (onOpenCreate) onOpenCreate(); }}
                      >
                        <PlusCircle size={16} />
                        <span>Create a Team</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'HOSTED' && (
                    <>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                        You haven't hosted any teams yet.
                      </h3>
                      <p style={{ fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                        Create a team request to start recruiting student teammates and manage incoming applications.
                      </p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => { onClose(); if (onOpenCreate) onOpenCreate(); }}
                      >
                        <PlusCircle size={16} />
                        <span>Host Your First Team</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'JOINED' && (
                    <>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                        You haven't joined any teams yet.
                      </h3>
                      <p style={{ fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                        Browse open campus teams and apply to hackathons or course projects to become a roster member.
                      </p>
                      <button 
                        className="btn btn-primary"
                        onClick={onClose}
                      >
                        <Users size={16} />
                        <span>Explore Open Teams</span>
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
                  {activeTeamsList.map((team) => {
                    const isLeader = isTeamLeader(team);
                    const occupied = team.currentTeamSize || 0;
                    const maxCap = team.membersNeeded || 4;
                    const remaining = Math.max(0, maxCap - occupied);
                    const isFull = remaining === 0;

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
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div>
                          {/* Badges: Category & Role Indicator */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                                {team.category || 'Hackathon'}
                              </span>
                              {team.eventName && (
                                <span className="badge badge-slate" style={{ fontSize: '0.72rem' }}>
                                  {team.eventName}
                                </span>
                              )}
                            </div>

                            {/* Clear Role Distinction */}
                            {isLeader ? (
                              <span className="badge badge-amber" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Crown size={11} />
                                <span>Leader / Host</span>
                              </span>
                            ) : (
                              <span className="badge badge-emerald" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <ShieldCheck size={11} />
                                <span>Joined Member</span>
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                            {team.title}
                          </h3>

                          {/* Leader Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <img 
                              src={team.creator?.avatar || team.creator?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                              alt=""
                              style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span>Leader: <strong style={{ color: 'var(--text-main)' }}>{team.creator?.name || 'Student Lead'}</strong></span>
                            {team.creator?.college && <span>• {team.creator.college}</span>}
                          </div>

                          {/* Description */}
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

                        {/* Card Footer: Seats & Actions */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              Members: <strong>{occupied} / {maxCap}</strong>
                            </span>
                            <div style={{ fontSize: '0.78rem', color: isFull ? '#e11d48' : '#059669', fontWeight: 600 }}>
                              {isFull ? 'Team Full' : `${remaining} seat${remaining === 1 ? '' : 's'} remaining`}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {/* [View Team] button for all */}
                            <button 
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenView(team)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Eye size={14} />
                              <span>View Team</span>
                            </button>

                            {/* [Manage Team] button ONLY for Leader / Host */}
                            {isLeader && (
                              <button 
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleOpenManage(team)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <Settings size={14} />
                                <span>Manage Team</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. LEADER TEAM MANAGEMENT PANEL (Requirement 4)           */}
          {/* ======================================================== */}
          {viewMode === 'manage' && selectedTeam && (
            <div>
              {/* Management Top Info Card */}
              <div style={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem 1.25rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge badge-primary">{selectedTeam.category || 'Hackathon'}</span>
                      {selectedTeam.eventName && <span className="badge badge-slate">{selectedTeam.eventName}</span>}
                      <span className="badge badge-amber">Leader: {selectedTeam.creator?.name || 'You'}</span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {selectedTeam.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit3 size={14} />
                      <span>{isEditing ? 'Cancel Edit' : 'Edit Details'}</span>
                    </button>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setConfirmDeleteId(selectedTeam.id)}
                      style={{ color: 'var(--accent-rose)', borderColor: '#fecdd3' }}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Capacity Counter Strip */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TEAM CAPACITY</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {selectedTeam.currentTeamSize || 0} / {selectedTeam.membersNeeded || 4} Members
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REMAINING SEATS</span>
                    <div style={{ 
                      fontSize: '1.15rem', 
                      fontWeight: 800, 
                      color: Math.max(0, (selectedTeam.membersNeeded || 4) - (selectedTeam.currentTeamSize || 0)) > 0 ? '#059669' : '#e11d48'
                    }}>
                      {Math.max(0, (selectedTeam.membersNeeded || 4) - (selectedTeam.currentTeamSize || 0)) > 0 
                        ? `${Math.max(0, (selectedTeam.membersNeeded || 4) - (selectedTeam.currentTeamSize || 0))} Available` 
                        : 'Team Full'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PENDING APPLICANTS</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {pendingAppsCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete Confirmation Alert */}
              {confirmDeleteId === selectedTeam.id && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecdd3',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.25rem',
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
                        This will remove the team, all pending applications, and roster memberships.
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

              {/* Edit Team Form */}
              {isEditing && (
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
                      <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Three Clean Sub-Tabs: [Overview] [Members] [Applications] */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <button
                  type="button"
                  className={`btn btn-sm ${manageSubTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setManageSubTab('overview')}
                >
                  <span>Overview</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${manageSubTab === 'members' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setManageSubTab('members')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Users size={14} />
                  <span>Members ({selectedTeam.currentMembers?.length || selectedTeam.currentTeamSize || 0})</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${manageSubTab === 'applications' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setManageSubTab('applications')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <UserCheck size={14} />
                  <span>Applications</span>
                  {pendingAppsCount > 0 && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '10px',
                      background: '#059669',
                      color: '#fff',
                      fontWeight: 700
                    }}>
                      {pendingAppsCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Sub-Tab 1: OVERVIEW */}
              {manageSubTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Project Description
                    </h4>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {selectedTeam.fullDesc || selectedTeam.shortDesc}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                      Required Skills & Tech Stack
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {(selectedTeam.skillsRequired || []).map((sk, i) => (
                        <span key={i} className="skill-tag">{sk}</span>
                      ))}
                      {(selectedTeam.techStack || []).map((tech, i) => (
                        <span key={i} className="badge badge-slate">{tech}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    <span>Deadline: <strong style={{ color: 'var(--text-main)' }}>{selectedTeam.deadlineDisplay || 'Flexible'}</strong></span>
                    <span>Experience: <strong style={{ color: 'var(--text-main)' }}>{selectedTeam.experienceLevel || 'Intermediate'}</strong></span>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: CURRENT MEMBERS */}
              {manageSubTab === 'members' && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                    Official Team Roster ({selectedTeam.currentMembers?.length || selectedTeam.currentTeamSize || 0} / {selectedTeam.membersNeeded || 4})
                  </h4>

                  {(!selectedTeam.currentMembers || selectedTeam.currentMembers.length === 0) ? (
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)' }}>
                      No members added yet. Review incoming applications to build your squad!
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                      {selectedTeam.currentMembers.map((member, idx) => {
                        const isLeaderMember = String(member.userId) === currentUserId || member.role === 'Team Lead' || member.role === 'Project Lead';
                        return (
                          <div 
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.85rem',
                              background: 'var(--surface)',
                              border: isLeaderMember ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <img 
                              src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                              alt={member.name}
                              style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <strong style={{ fontSize: '0.94rem', color: 'var(--text-main)' }}>
                                  {member.name}
                                </strong>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {member.college || 'Campus Student'}
                              </div>
                              <div style={{ marginTop: '0.2rem' }}>
                                {isLeaderMember ? (
                                  <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                    <Crown size={10} />
                                    <span>Team Leader</span>
                                  </span>
                                ) : (
                                  <span className="badge badge-emerald" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                    <span>{member.role || 'Member'}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 3: APPLICATIONS (Requirement 4 & 7) */}
              {manageSubTab === 'applications' && (
                <div>
                  {/* Team Capacity Notice */}
                  {selectedTeam.currentTeamSize >= (selectedTeam.membersNeeded || 4) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      background: '#fef2f2',
                      border: '1px solid #fecdd3',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                      marginBottom: '1rem',
                      color: '#9f1239',
                      fontSize: '0.88rem'
                    }}>
                      <AlertCircle size={18} color="#e11d48" />
                      <div>
                        <strong>Team Full (No seats remaining):</strong> You have reached maximum capacity ({selectedTeam.membersNeeded} members). Further applications cannot be accepted unless you increase team size.
                      </div>
                    </div>
                  )}

                  {loadingApps ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      Loading applicant submissions...
                    </div>
                  ) : teamApplications.filter(a => a.status === 'PENDING').length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '2.5rem 1rem',
                      background: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border)',
                      color: 'var(--text-muted)'
                    }}>
                      <UserCheck size={28} style={{ margin: '0 auto 0.5rem', color: 'var(--text-subtle)' }} />
                      <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        No pending applications.
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        When students apply to your team, their pitches will appear here for review.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {teamApplications.filter(a => a.status === 'PENDING').map((app) => {
                        const isProcessing = actionLoadingId === app.id;
                        const hasSeats = Math.max(0, (selectedTeam.membersNeeded || 4) - (selectedTeam.currentTeamSize || 0)) > 0;

                        return (
                          <div 
                            key={app.id}
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              padding: '1.15rem',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <img 
                                  src={app.applicant_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                                  alt={app.applicant_name}
                                  style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
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

                              <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>
                                Role: {app.role_applied}
                              </span>
                            </div>

                            {/* Pitch */}
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

                            {/* Meta & Action Buttons */}
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

                              {/* [Accept] [Reject] Buttons */}
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleDeny(app.id)}
                                  disabled={isProcessing}
                                  style={{ color: 'var(--accent-rose)', borderColor: '#fecdd3' }}
                                >
                                  <X size={14} />
                                  <span>Reject</span>
                                </button>
                                <button 
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleApprove(app.id)}
                                  disabled={isProcessing || !hasSeats}
                                  title={!hasSeats ? 'Team roster full' : 'Accept applicant into team roster'}
                                  style={{ background: '#059669', borderColor: '#059669' }}
                                >
                                  <Check size={14} />
                                  <span>{isProcessing ? 'Accepting...' : !hasSeats ? 'Team Full' : 'Accept'}</span>
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
          )}

          {/* ======================================================== */}
          {/* 3. MEMBER TEAM VIEW PANEL (Requirement 5: Non-Leader View) */}
          {/* ======================================================== */}
          {viewMode === 'view' && selectedTeam && (
            <div>
              {/* Member banner */}
              <div style={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-primary">{selectedTeam.category || 'Hackathon'}</span>
                    {selectedTeam.eventName && <span className="badge badge-slate">{selectedTeam.eventName}</span>}
                  </div>
                  {isTeamLeader(selectedTeam) ? (
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenManage(selectedTeam)}
                    >
                      <Settings size={14} />
                      <span>Switch to Manage View</span>
                    </button>
                  ) : (
                    <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle size={13} />
                      <span>You are an active member</span>
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  {selectedTeam.title}
                </h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {selectedTeam.fullDesc || selectedTeam.shortDesc}
                </p>
              </div>

              {/* Team Specs Strip */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TEAM LEADER</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
                    <img 
                      src={selectedTeam.creator?.avatar || selectedTeam.creator?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                      alt=""
                      style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <strong style={{ fontSize: '0.94rem', color: 'var(--text-main)' }}>
                      {selectedTeam.creator?.name || 'Lead'}
                    </strong>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ROSTER SIZE</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {selectedTeam.currentTeamSize || 0} / {selectedTeam.membersNeeded || 4} Members
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</div>
                  <div style={{ 
                    fontSize: '1.05rem', 
                    fontWeight: 700, 
                    color: (selectedTeam.currentTeamSize || 0) >= (selectedTeam.membersNeeded || 4) ? '#e11d48' : '#059669',
                    marginTop: '0.2rem' 
                  }}>
                    {(selectedTeam.currentTeamSize || 0) >= (selectedTeam.membersNeeded || 4) ? 'Team Full' : 'Open for Members'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DEADLINE</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {selectedTeam.deadlineDisplay || 'Flexible'}
                  </div>
                </div>
              </div>

              {/* Skills & Tech Stack */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Skills & Technologies
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {(selectedTeam.skillsRequired || []).map((sk, i) => (
                    <span key={i} className="skill-tag">{sk}</span>
                  ))}
                  {(selectedTeam.techStack || []).map((tech, i) => (
                    <span key={i} className="badge badge-slate">{tech}</span>
                  ))}
                </div>
              </div>

              {/* Roster Teammates List */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  Team Members ({selectedTeam.currentMembers?.length || selectedTeam.currentTeamSize || 0})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  {(selectedTeam.currentMembers || []).map((m, i) => (
                    <div 
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.85rem',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <img 
                        src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                        alt={m.name}
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{m.name}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {m.role || 'Teammate'} • {m.college || 'Campus Student'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {viewMode !== 'list' && (
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => { setSelectedTeam(null); setViewMode('list'); setIsEditing(false); }}
              >
                <ArrowLeft size={14} />
                <span>Back to Teams List</span>
              </button>
            )}
          </div>
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
