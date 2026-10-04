import React, { useState, useMemo } from 'react';
import { Search, Filter, RefreshCw, PlusCircle } from 'lucide-react';
import RequestCard from './RequestCard';
import { CATEGORIES } from '../data/mockData';

export default function RequestList({ 
  requests, 
  onViewDetails, 
  onApply, 
  onDelete,
  onCreateRequest,
  searchQuery,
  setSearchQuery 
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter & Sort Logic
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // 1. Search query (title, description, eventName, techStack, skillsRequired, creator)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = req.title.toLowerCase().includes(q);
        const matchesDesc = req.shortDesc.toLowerCase().includes(q);
        const matchesEvent = req.eventName.toLowerCase().includes(q);
        const matchesSkills = req.skillsRequired.some(s => s.toLowerCase().includes(q));
        const matchesTech = req.techStack.some(t => t.toLowerCase().includes(q));
        const matchesCreator = req.creator.name.toLowerCase().includes(q);
        
        if (!matchesTitle && !matchesDesc && !matchesEvent && !matchesSkills && !matchesTech && !matchesCreator) {
          return false;
        }
      }

      // 2. Category
      if (selectedCategory !== 'All' && req.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [requests, searchQuery, selectedCategory]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'All';

  return (
    <section className="browse-section" id="requests">
      <div className="container">
        {/* Section Title Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-tag">Explore Opportunities</div>
          <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Active Team Requests</h2>
          <p className="section-subtitle">
            Browse open rosters, connect with project leads, and claim your spot on a squad.
          </p>
        </div>

        {/* Toolbar: Category Tabs + Search */}
        <div className="browse-toolbar" style={{ padding: '1rem', gap: '1rem' }}>
          {/* Category Tabs */}
          <div className="category-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar & Reset */}
          <form 
            className="search-filter-row" 
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="search-input-wrapper">
              <Search size={18} className="search-input-icon" />
              <input 
                id="search-requests-input"
                type="text" 
                placeholder="Search by keyword, skill (React, FastAPI, etc.), or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn btn-primary btn-sm search-submit-btn"
                id="search-requests-submit-btn"
              >
                Search
              </button>
            </div>

            {hasActiveFilters && (
              <button 
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={resetAllFilters}
                style={{ color: 'var(--accent-rose)' }}
                title="Reset filters"
              >
                <RefreshCw size={14} />
                <span>Reset</span>
              </button>
            )}
          </form>
        </div>

        {/* Counter Info Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <div>
            Showing <strong style={{ color: 'var(--text-main)' }}>{filteredRequests.length}</strong> active team request{filteredRequests.length !== 1 ? 's' : ''}
            {selectedCategory !== 'All' && <span> in <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedCategory}</span></span>}
          </div>
        </div>

        {/* Grid of Team Requests */}
        {filteredRequests.length > 0 ? (
          <div className="requests-grid">
            {filteredRequests.map((req) => (
              <RequestCard 
                key={req.id} 
                request={req} 
                onViewDetails={onViewDetails}
                onApply={onApply}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="empty-state">
            <div className="empty-state-icon">
              <Filter size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No matching team requests found</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 1.5rem' }}>
              We couldn't find any team requests matching your current filter settings. Try clearing some filters or be the first to create one!
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={resetAllFilters}>
                <RefreshCw size={16} />
                <span>Clear All Filters</span>
              </button>
              <button className="btn btn-primary" onClick={onCreateRequest}>
                <PlusCircle size={16} />
                <span>Post This Request</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
