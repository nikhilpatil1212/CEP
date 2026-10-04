import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Clock, Check, AlertCircle, Ban, ArrowUpRight, 
  Trash2, ShieldCheck, Compass 
} from 'lucide-react';
import { getMyApplications, withdrawApplicationApi, deleteApplicationApi } from '../services/api';

export default function MyApplicationsModal({
  isOpen,
  onClose,
  onBrowseTeams,
  showToast
}) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const handleDeleteApplication = async (applicationId) => {
    try {
      await deleteApplicationApi(applicationId);
      setApplications(prev => prev.filter(a => a.id !== applicationId));
      if (showToast) showToast('Application removed from your list.');
    } catch (err) {
      if (showToast) showToast(`❌ ${err.message || 'Failed to remove application'}`);
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await getMyApplications();
      if (Array.isArray(data)) {
        setApplications(data);
      }
    } catch (err) {
      console.warn('Failed to load my applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadApplications();
    }
  }, [isOpen]);

  const handleWithdraw = async (applicationId, teamTitle) => {
    if (!window.confirm(`Are you sure you want to withdraw your application for "${teamTitle}"?`)) {
      return;
    }

    setWithdrawingId(applicationId);
    try {
      await withdrawApplicationApi(applicationId);
      setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: 'WITHDRAWN' } : a));
      if (showToast) showToast('Application withdrawn successfully.');
    } catch (err) {
      if (showToast) showToast(`❌ ${err.message || 'Failed to withdraw application'}`);
    } finally {
      setWithdrawingId(null);
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
        style={{ maxWidth: 780 }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="logo-badge" style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)' }}>
              <FileText size={18} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>My Applications</span>
                <span className="badge badge-slate" style={{ fontSize: '0.78rem' }}>
                  {applications.length} Total
                </span>
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Track and manage all team join requests submitted from your account
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close My Applications Modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading your submitted applications...
            </div>
          ) : applications.length === 0 ? (
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
                <FileText size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                No Applications Yet
              </h3>
              <p style={{ fontSize: '0.9rem', maxWidth: 420, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                Browse open teams on CampusConnect and submit pitches to hackathons or campus projects to join student rosters.
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => { onClose(); if (onBrowseTeams) onBrowseTeams(); }}
              >
                <Compass size={16} />
                <span>Explore Teams to Join</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {applications.map((app) => {
                const isPending = app.status === 'PENDING';
                const isApproved = app.status === 'APPROVED';
                const isDenied = app.status === 'DENIED';
                const isWithdrawn = app.status === 'WITHDRAWN';
                const isProcessing = withdrawingId === app.id;
                const formattedDate = app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'Recently';

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
                    {/* Header Row: Team Name and Status Indicator */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      paddingBottom: '0.65rem',
                      borderBottom: '1px solid #f1f5f9'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-slate" style={{ fontSize: '0.72rem' }}>
                            {app.event_name || app.category || 'Team Project'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Applied on {formattedDate}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                          {app.request_title || 'Campus Team'}
                        </h4>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isPending && (
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-amber" style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}>
                              <Clock size={13} />
                              <span>Pending</span>
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, marginTop: '0.25rem' }}>
                              Waiting for team leader
                            </div>
                          </div>
                        )}
                        {isApproved && (
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-emerald" style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}>
                              <Check size={13} strokeWidth={2.5} />
                              <span>Accepted</span>
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600, marginTop: '0.25rem' }}>
                              Accepted — You are now a member of this team
                            </div>
                          </div>
                        )}
                        {isDenied && (
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-rose" style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}>
                              <Ban size={13} />
                              <span>Rejected</span>
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: 600, marginTop: '0.25rem' }}>
                              Application rejected
                            </div>
                          </div>
                        )}
                        {isWithdrawn && (
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-slate" style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}>
                              <span>Withdrawn</span>
                            </span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              Application withdrawn
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Applied & Pitch */}
                    <div style={{ marginBottom: '0.65rem' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--primary)' }}>
                        Role: {app.role_applied || 'Teammate'}
                      </span>
                      {app.hours_commitment && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
                          • Commitment: {app.hours_commitment}
                        </span>
                      )}
                    </div>

                    {app.pitch && (
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
                    )}

                    {/* Footer Row: Portfolio link and Cancel Application action for PENDING */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.65rem',
                      marginTop: '0.5rem'
                    }}>
                      <div>
                        {app.portfolio_link && (
                          <a 
                            href={app.portfolio_link.startsWith('http') ? app.portfolio_link : `https://${app.portfolio_link}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--primary)',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <span>View Submitted Portfolio</span>
                            <ArrowUpRight size={13} />
                          </a>
                        )}
                      </div>

                      {/* Withdraw Application Option (ONLY for PENDING applications) */}
                      {isPending && (
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleWithdraw(app.id, app.request_title || 'this team')}
                          disabled={isProcessing}
                          style={{
                            color: 'var(--accent-rose)',
                            borderColor: '#fecdd3',
                            fontSize: '0.82rem'
                          }}
                        >
                          <X size={14} />
                          <span>{isProcessing ? 'Withdrawing...' : 'Withdraw Application'}</span>
                        </button>
                      )}

                      {/* Remove Old Application (for WITHDRAWN or DENIED) */}
                      {(isWithdrawn || isDenied) && (
                        <button 
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteApplication(app.id)}
                          title="Remove this application from your list"
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
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

        {/* Footer */}
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
