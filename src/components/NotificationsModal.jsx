import React from 'react';
import { 
  X, Check, Bell, UserCheck, ExternalLink, 
  Clock, ShieldCheck, Inbox, ArrowUpRight, CheckCheck, Sparkles, ArrowRight
} from 'lucide-react';

function timeAgo(dateString) {
  if (!dateString) return 'Recently';
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications = [],
  onAccept,
  onReject,
  onMarkAllAsRead,
  onMarkAsRead,
  onOpenManageTeam,
  actionLoadingId = null
}) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 760 }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="logo-badge" style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)' }}>
              <Bell size={18} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Notifications & Alerts</span>
                {unreadCount > 0 ? (
                  <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>
                    {unreadCount} New
                  </span>
                ) : (
                  <span className="badge badge-slate" style={{ fontSize: '0.78rem' }}>
                    {notifications.length} Total
                  </span>
                )}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Application activity, approvals, team alerts, and join notifications
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onMarkAllAsRead && unreadCount > 0 && (
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={onMarkAllAsRead}
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                <span>Mark All Read</span>
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose} aria-label="Close Notifications Modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3.5rem 1.5rem',
              color: 'var(--text-muted)'
            }}>
              <div style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'var(--surface-alt)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                color: 'var(--text-subtle)'
              }}>
                <Inbox size={26} />
              </div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                No Notifications
              </h3>
              <p style={{ fontSize: '0.88rem', maxWidth: 420, margin: '0 auto', lineHeight: 1.5 }}>
                When teammates apply to your team, or your applications get approved/denied, notifications will show up here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {notifications.map((item) => {
                const isDirectNotif = Boolean(item.title && item.message);
                const isRead = item.is_read;
                const formattedTime = timeAgo(item.created_at);

                if (isDirectNotif) {
                  const isNewApp = item.type === 'NEW_APPLICATION';
                  const isApproved = item.type === 'APPLICATION_APPROVED';
                  const isDenied = item.type === 'APPLICATION_DENIED';

                  return (
                    <div 
                      key={item.id}
                      style={{
                        background: isRead ? 'var(--surface)' : 'rgba(99, 102, 241, 0.05)',
                        border: isRead ? '1px solid var(--border)' : '1px solid rgba(99, 102, 241, 0.3)',
                        borderLeft: isRead ? '1px solid var(--border)' : '4px solid var(--primary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem 1.15rem',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 240 }}>
                          <img 
                            src={item.sender_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                            alt=""
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginTop: '0.1rem', border: '1px solid var(--border)' }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {isNewApp && (
                                <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                                  New Application
                                </span>
                              )}
                              {isApproved && (
                                <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                                  Application Approved
                                </span>
                              )}
                              {isDenied && (
                                <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>
                                  Application Update
                                </span>
                              )}
                              <strong style={{ fontSize: '0.94rem', color: 'var(--text-main)' }}>
                                {item.title}
                              </strong>
                              {!isRead && (
                                <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                                  New
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.45 }}>
                              {item.message}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{formattedTime}</span>
                              {item.request_title && <span>• Team: <strong>{item.request_title}</strong></span>}
                            </div>
                          </div>
                        </div>

                        {/* Action: Open / Manage Application (Requirement 3) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isNewApp && item.request_id && onOpenManageTeam && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                if (onMarkAsRead && !isRead) onMarkAsRead(item.id);
                                onOpenManageTeam(item.request_id);
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                            >
                              <span>View Application</span>
                              <ArrowRight size={13} />
                            </button>
                          )}

                          {!isRead && onMarkAsRead && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => onMarkAsRead(item.id)}
                              style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}
                              title="Mark as read"
                            >
                              <Check size={13} />
                              <span>Read</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Legacy application card with quick Accept / Decline
                const app = item;
                const isProcessing = actionLoadingId === app.id;

                return (
                  <div 
                    key={app.id} 
                    className="notification-app-card"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.15rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-slate" style={{ fontSize: '0.75rem' }}>
                          {app.event_name || 'Hackathon'}
                        </span>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {app.request_title}
                        </strong>
                      </div>
                      <span className="badge badge-emerald" style={{ fontSize: '0.78rem' }}>
                        <UserCheck size={12} />
                        <span>Role: {app.role_applied}</span>
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      marginBottom: '0.75rem'
                    }}>
                      <img 
                        src={app.applicant_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} 
                        alt={app.applicant_name}
                        style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-main)' }}>
                            {app.applicant_name}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {app.applicant_college || 'Campus Student'}
                        </div>
                      </div>
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

                    {onAccept && onReject && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '0.65rem',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '0.65rem'
                      }}>
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onReject(app.id, app)}
                          disabled={isProcessing}
                          style={{ color: 'var(--accent-rose)', borderColor: '#fecdd3' }}
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>

                        <button 
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onAccept(app.id, app)}
                          disabled={isProcessing}
                          style={{ background: '#059669', borderColor: '#059669' }}
                        >
                          <Check size={14} strokeWidth={2.5} />
                          <span>{isProcessing ? 'Accepting...' : 'Accept Member'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
