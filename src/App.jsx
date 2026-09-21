import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import RequestList from './components/RequestList';
import Footer from './components/Footer';

// Modals
import CreateRequestModal from './components/CreateRequestModal';
import RequestDetailsModal from './components/RequestDetailsModal';
import ApplyModal from './components/ApplyModal';
import ProfileModal from './components/ProfileModal';

// Mock Data
import { INITIAL_REQUESTS } from './data/mockData';
import { Check } from 'lucide-react';

export default function App() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [selectedRequestApply, setSelectedRequestApply] = useState(null);

  // Toast Notification state
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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

  // Create team request handler
  const handleCreateSubmit = (newRequest) => {
    setRequests(prev => [newRequest, ...prev]);
    showToast(`🎉 Team request "${newRequest.title.slice(0, 28)}..." posted successfully!`);
    
    setTimeout(() => {
      handleScrollToRequests();
    }, 300);
  };

  // Apply to team handler
  const handleApplySuccess = (projectTitle, roleName) => {
    showToast(`🚀 Demo Application submitted for "${roleName}" on ${projectTitle}!`);
  };

  return (
    <div className="app-container">
      {/* Simplified Navigation */}
      <Navbar 
        onFindTeam={handleScrollToRequests}
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main>
        {/* Minimal Hero Section */}
        <Hero />

        {/* Browse Team Requests Section */}
        <RequestList 
          requests={requests}
          onViewDetails={(req) => setSelectedRequestDetails(req)}
          onApply={(req) => setSelectedRequestApply(req)}
          onCreateRequest={() => setIsCreateOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </main>

      {/* Simplified Footer */}
      <Footer />

      {/* Modals */}
      <CreateRequestModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateSubmit={handleCreateSubmit}
      />

      <RequestDetailsModal 
        request={selectedRequestDetails}
        isOpen={Boolean(selectedRequestDetails)}
        onClose={() => setSelectedRequestDetails(null)}
        onApply={(req) => {
          setSelectedRequestDetails(null);
          setSelectedRequestApply(req);
        }}
      />

      <ApplyModal 
        request={selectedRequestApply}
        isOpen={Boolean(selectedRequestApply)}
        onClose={() => setSelectedRequestApply(null)}
        onApplySuccess={handleApplySuccess}
      />

      <ProfileModal 
        isOpen={isProfileOpen}
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
