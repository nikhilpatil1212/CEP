import React from 'react';
import { Calendar, MapPin, ArrowRight, Trophy } from 'lucide-react';
import { UPCOMING_HACKATHONS } from '../data/mockData';

export default function UpcomingHackathons({ onSelectEvent }) {
  return (
    <section className="upcoming-section" id="hackathons">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">Competition Calendar</div>
          <h2 className="section-title">Upcoming Major Hackathons</h2>
          <p className="section-subtitle">
            Find teams forming right now for top national collegiate hackathons and showcase events.
          </p>
        </div>

        <div className="hackathons-grid">
          {UPCOMING_HACKATHONS.map((event, idx) => (
            <div key={idx} className="hackathon-card">
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase'
                }}>
                  <Trophy size={14} />
                  <span>College Hackathon</span>
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  {event.name}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} />
                    <span>{event.dates}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={14} />
                    <span>{event.loc}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
                  {event.tags.map((tag, i) => (
                    <span key={i} className="skill-tag" style={{ fontSize: '0.72rem' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={() => onSelectEvent(event.name.split(' ')[0])}
              >
                <span>Find Teams Here</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
