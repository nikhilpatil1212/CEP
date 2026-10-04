import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import RequestList from './components/RequestList';
import Footer from './components/Footer';

// Modals
import CreateRequestModal from './components/CreateRequestModal';
import RequestDetailsModal from './components/RequestDetailsModal';
import ApplyModal from './components/ApplyModal';
import ProfileModal from './components/ProfileModal';
import AuthModal from './components/AuthModal';
import NotificationsModal from './components/NotificationsModal';
import MyTeamsModal from './components/MyTeamsModal';
import MyApplicationsModal from './components/MyApplicationsModal';

// Auth Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Mock Data fallback
import { INITIAL_REQUESTS, SAMPLE_USER_PROFILE } from './data/mockData';
import { Check } from 'lucide-react';

// Backend API Service
import { 
  getRequests, 
  createRequest, 
  deleteTeamApi,
  submitApplication,
  fetchOwnerNotifications,
  acceptApplicationApi,
  rejectApplicationApi,
  getNotificationsApi,
  markAllNotificationsReadApi
} from './services/api';

function MainContent() {
  const { user, isAuthenticated, logout } = useAuth();

  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMyTeamsOpen, setIsMyTeamsOpen] = useState(false);
  const [isMyApplicationsOpen, setIsMyApplicationsOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [selectedRequestApply, setSelectedRequestApply] = useState(null);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notifActionLoadingId, setNotifActionLoadingId] = useState(null);

  // Auth modal state & route protection
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authPrompt, setAuthPrompt] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  // Toast Notification state
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Load notifications for authenticated user
  const loadNotifications = async (showLoginAlert = false) => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    try {
      const notifRes = await getNotificationsApi();
      if (notifRes && Array.isArray(notifRes.notifications) && notifRes.notifications.length > 0) {
        setNotifications(notifRes.notifications);
        if (showLoginAlert && notifRes.unreadCount > 0) {
          showToast(`🔔 You have ${notifRes.unreadCount} new notification(s)!`);
        }
        return;
      }

      // Fallback to legacy owner notifications
      const res = await fetchOwnerNotifications();
      if (res && Array.isArray(res.applications)) {
        setNotifications(res.applications);
        if (showLoginAlert && res.applications.length > 0) {
          showToast(`🔔 You have ${res.applications.length} pending team application(s) awaiting your review!`);
        }
      }
    } catch (err) {
      console.warn('Error loading notifications:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.warn('Error marking notifications as read:', err);
    }
  };

  const reloadRequests = async () => {
    try {
      const backendRequests = await getRequests();
      if (backendRequests && Array.isArray(backendRequests)) {
        setRequests(backendRequests);
      }
    } catch (err) {
      console.warn('Error reloading requests:', err);
    }
  };

  const handleTeamUpdated = (updatedOrDeleted) => {
    if (updatedOrDeleted?.deleted) {
      setRequests(prev => {
        const next = prev.filter(r => r.id !== updatedOrDeleted.id);
        try {
          const local = JSON.parse(localStorage.getItem('campusconnect_local_requests') || '[]');
          localStorage.setItem('campusconnect_local_requests', JSON.stringify(local.filter(r => r.id !== updatedOrDeleted.id)));
        } catch (e) {}
        return next;
      });
      if (selectedRequestDetails && selectedRequestDetails.id === updatedOrDeleted.id) {
        setSelectedRequestDetails(null);
      }
      if (selectedRequestApply && selectedRequestApply.id === updatedOrDeleted.id) {
        setSelectedRequestApply(null);
      }
    } else if (updatedOrDeleted?.id) {
      setRequests(prev => prev.map(r => r.id === updatedOrDeleted.id ? updatedOrDeleted : r));
    }
    reloadRequests();
  };

  // Direct Team Post Deletion handler
  const handleDeleteRequest = async (requestId) => {
    try {
      await deleteTeamApi(requestId);
      setRequests(prev => {
        const next = prev.filter(r => r.id !== requestId);
        try {
          const local = JSON.parse(localStorage.getItem('campusconnect_local_requests') || '[]');
          localStorage.setItem('campusconnect_local_requests', JSON.stringify(local.filter(r => r.id !== requestId)));
        } catch (e) {}
        return next;
      });

      if (selectedRequestDetails && selectedRequestDetails.id === requestId) {
        setSelectedRequestDetails(null);
      }
      if (selectedRequestApply && selectedRequestApply.id === requestId) {
        setSelectedRequestApply(null);
      }

      showToast('🗑️ Team post deleted successfully.');
      reloadRequests();
    } catch (err) {
      // Even if API call threw error, ensure team is removed locally
      setRequests(prev => {
        const next = prev.filter(r => r.id !== requestId);
        try {
          const local = JSON.parse(localStorage.getItem('campusconnect_local_requests') || '[]');
          localStorage.setItem('campusconnect_local_requests', JSON.stringify(local.filter(r => r.id !== requestId)));
        } catch (e) {}
        return next;
      });

      if (selectedRequestDetails && selectedRequestDetails.id === requestId) {
        setSelectedRequestDetails(null);
      }
      if (selectedRequestApply && selectedRequestApply.id === requestId) {
        setSelectedRequestApply(null);
      }

      showToast(err.message ? `🗑️ ${err.message}` : '🗑️ Team post deleted.');
    }
  };

  // Fetch notifications on authentication change
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications(false);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, user?.id]);

  // Fetch team requests on initial load
  useEffect(() => {
    // Purge any stale legacy seed 'req-1' from local storage
    try {
      const local = JSON.parse(localStorage.getItem('campusconnect_local_requests') || '[]');
      const cleaned = local.filter(r => r.id !== 'req-1');
      if (cleaned.length !== local.length) {
        localStorage.setItem('campusconnect_local_requests', JSON.stringify(cleaned));
      }
    } catch (e) {}

    async function loadRequests() {
      try {
        const backendRequests = await getRequests();
        if (backendRequests && Array.isArray(backendRequests)) {
          setRequests(backendRequests);
          return;
        }
      } catch (err) {
        console.warn('Backend unavailable, using local requests fallback:', err);
      }

      // Fallback: load local created requests if backend is unreachable
      try {
        const localCreated = JSON.parse(localStorage.getItem('campusconnect_local_requests') || '[]');
        if (Array.isArray(localCreated)) {
          setRequests(localCreated.filter(r => r.id !== 'req-1'));
        }
      } catch (e) {}
    }

    loadRequests();
  }, []);

  // Scroll to requests section helper
  const handleScrollToRequests = () => {
    const el = document.getElementById('requests');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    const searchInput = document.getElementById('search-requests-input');
    if (searchInput) {
      setTimeout(() => {
        searchInput.focus();
      }, 350);
    }
  };

  // Protected action: Post Request
  const handleTriggerCreate = () => {
    if (isAuthenticated) {
      setIsCreateOpen(true);
    } else {
      setAuthPrompt('Please sign in or create an account to post a team request.');
      setAuthMode('login');
      setPendingAction(() => () => setIsCreateOpen(true));
      setIsAuthOpen(true);
    }
  };

  // Protected action: Apply to Team
  const handleTriggerApply = (req) => {
    if (isAuthenticated) {
      setSelectedRequestApply(req);
    } else {
      setAuthPrompt(`Please sign in to apply for "${req.title}".`);
      setAuthMode('login');
      setPendingAction(() => () => setSelectedRequestApply(req));
      setIsAuthOpen(true);
    }
  };

  // Protected action: View Profile
  const handleTriggerProfile = () => {
    if (isAuthenticated) {
      setIsProfileOpen(true);
    } else {
      setAuthPrompt('Please sign in to view your profile.');
      setAuthMode('login');
      setPendingAction(() => () => setIsProfileOpen(true));
      setIsAuthOpen(true);
    }
  };

  // Open Auth Modal for Login
  const handleOpenLogin = () => {
    setAuthPrompt('');
    setAuthMode('login');
    setPendingAction(null);
    setIsAuthOpen(true);
  };

  // Open Auth Modal for Register
  const handleOpenRegister = () => {
    setAuthPrompt('');
    setAuthMode('register');
    setPendingAction(null);
    setIsAuthOpen(true);
  };

  // Handle Logout
  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
    setNotifications([]);
    showToast('👋 You have been logged out successfully.');
  };

  // Callback on successful Login or Register
  const handleAuthSuccess = () => {
    showToast('🎉 Successfully signed in!');
    // Alert owner if they have pending applications
    setTimeout(() => {
      loadNotifications(true);
    }, 400);

    if (pendingAction) {
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 200);
    }
  };

  // Team owner accepts an application -> updates roster and remaining seats
  const handleAcceptApplication = async (appId, app) => {
    setNotifActionLoadingId(appId);
    try {
      const res = await acceptApplicationApi(appId);
      if (res && res.updatedRequest) {
        // Update requests list with new member roster and remaining seats
        setRequests(prev => prev.map(r => r.id === res.updatedRequest.id ? res.updatedRequest : r));
        // If details modal is open for this request, update it
        setSelectedRequestDetails(prev => (prev && prev.id === res.updatedRequest.id ? res.updatedRequest : prev));
      } else {
        // Fallback roster update for local/offline demo
        setRequests(prev => prev.map(r => {
          if (r.id === app.request_id) {
            const currentMembers = r.currentMembers || [];
            const newMember = {
              name: app.applicant_name,
              role: app.role_applied || 'Teammate',
              college: app.applicant_college || 'Campus Student',
              avatar: app.applicant_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'
            };
            return {
              ...r,
              currentTeamSize: (r.currentTeamSize || 1) + 1,
              currentMembers: [...currentMembers, newMember]
            };
          }
          return r;
        }));
      }
      // Remove accepted application from pending notifications
      setNotifications(prev => prev.filter(a => a.id !== appId));
      showToast(`🎉 ${app.applicant_name} has joined "${app.request_title || 'the project'}"! Team roster & remaining seats updated.`);
    } catch (err) {
      showToast(`❌ ${err.message || 'Failed to accept application'}`);
    } finally {
      setNotifActionLoadingId(null);
    }
  };

  // Team owner declines an application
  const handleRejectApplication = async (appId, app) => {
    setNotifActionLoadingId(appId);
    try {
      await rejectApplicationApi(appId);
      setNotifications(prev => prev.filter(a => a.id !== appId));
      showToast(`Application from ${app.applicant_name} declined.`);
    } catch (err) {
      showToast(`❌ ${err.message || 'Failed to decline application'}`);
    } finally {
      setNotifActionLoadingId(null);
    }
  };

  // Create team request submit handler
  const handleCreateSubmit = async (newRequest) => {
    try {
      const savedRequest = await createRequest(newRequest);
      const requestToAdd = savedRequest || newRequest;

      setRequests(prev => {
        const next = [requestToAdd, ...prev.filter(r => r.id !== requestToAdd.id)];
        try {
          const custom = next.filter(r => r.id !== 'req-1');
          localStorage.setItem('campusconnect_local_requests', JSON.stringify(custom));
        } catch (e) {}
        return next;
      });
      showToast(`🎉 Team request "${requestToAdd.title.slice(0, 28)}..." posted successfully!`);
    } catch (err) {
      setRequests(prev => {
        const next = [newRequest, ...prev];
        try {
          const custom = next.filter(r => r.id !== 'req-1');
          localStorage.setItem('campusconnect_local_requests', JSON.stringify(custom));
        } catch (e) {}
        return next;
      });
      showToast(`🎉 Team request "${newRequest.title.slice(0, 28)}..." posted successfully!`);
    }
    
    setTimeout(() => {
      handleScrollToRequests();
    }, 300);
  };

  // Apply to team submit handler
  const handleApplySuccess = async (targetRequest, appPayload) => {
    try {
      if (targetRequest && targetRequest.id) {
        await submitApplication(targetRequest.id, appPayload);
      }
    } catch (err) {
      console.warn('Application submit error:', err);
    }
    const projectTitle = targetRequest?.title || 'the project';
    const roleName = appPayload?.roleApplied || 'Teammate';
    showToast(`🚀 Application submitted for "${roleName}" on ${projectTitle}!`);

    // Refresh notifications for owner
    setTimeout(() => {
      loadNotifications(false);
    }, 500);
  };

  const activeUserProfile = user || SAMPLE_USER_PROFILE;

  return (
    <div className="app-container">
      {/* Navigation with Auth & Notifications Integration */}
      <Navbar 
        user={activeUserProfile}
        isAuthenticated={isAuthenticated}
        notificationsCount={notifications.filter(n => !n.is_read).length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenMyTeams={() => setIsMyTeamsOpen(true)}
        onOpenMyApplications={() => setIsMyApplicationsOpen(true)}
        onFindTeam={handleScrollToRequests}
        onOpenCreate={handleTriggerCreate}
        onOpenProfile={handleTriggerProfile}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onLogout={handleLogout}
      />

      <main>
        {/* Minimal Hero Section */}
        <Hero />

        {/* Browse Team Requests Section */}
        <RequestList 
          requests={requests}
          onViewDetails={(req) => setSelectedRequestDetails(req)}
          onApply={handleTriggerApply}
          onDelete={handleDeleteRequest}
          onCreateRequest={handleTriggerCreate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </main>

      {/* Simplified Footer */}
      <Footer />

      {/* Auth Modal (Login / Register) */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => { setIsAuthOpen(false); setPendingAction(null); }}
        initialMode={authMode}
        promptMessage={authPrompt}
        onSuccess={handleAuthSuccess}
      />

      {/* Team Request Creation Modal */}
      <CreateRequestModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateSubmit={handleCreateSubmit}
      />

      {/* Team Request Details Modal */}
      <RequestDetailsModal 
        request={selectedRequestDetails}
        isOpen={Boolean(selectedRequestDetails)}
        onClose={() => setSelectedRequestDetails(null)}
        onApply={(req) => {
          setSelectedRequestDetails(null);
          handleTriggerApply(req);
        }}
        onDelete={handleDeleteRequest}
      />

      {/* Team Application Modal with Logged-in User Profile */}
      <ApplyModal 
        request={selectedRequestApply}
        user={user}
        isOpen={Boolean(selectedRequestApply)}
        onClose={() => setSelectedRequestApply(null)}
        onApplySuccess={handleApplySuccess}
      />

      {/* Owner Notifications & Team Applications Modal */}
      <NotificationsModal 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onAccept={handleAcceptApplication}
        onReject={handleRejectApplication}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        actionLoadingId={notifActionLoadingId}
      />

      {/* My Teams Modal (Owner Team Management & Incoming Applications) */}
      <MyTeamsModal 
        isOpen={isMyTeamsOpen}
        onClose={() => setIsMyTeamsOpen(false)}
        onOpenCreate={() => { setIsMyTeamsOpen(false); setIsCreateOpen(true); }}
        onTeamUpdated={handleTeamUpdated}
        showToast={showToast}
      />

      {/* My Applications Modal (Submitted Applications & Withdrawal) */}
      <MyApplicationsModal 
        isOpen={isMyApplicationsOpen}
        onClose={() => setIsMyApplicationsOpen(false)}
        onBrowseTeams={() => { setIsMyApplicationsOpen(false); handleScrollToRequests(); }}
        showToast={showToast}
      />

      {/* User Profile Modal */}
      <ProfileModal 
        isOpen={isProfileOpen}
        user={activeUserProfile}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification" role="status" aria-live="polite">
          <div className="toast-icon">
            <Check size={16} strokeWidth={3} />
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 500, lineHeight: 1.4 }}>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
