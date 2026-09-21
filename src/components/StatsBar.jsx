import React from 'react';
import { PLATFORM_STATS } from '../data/mockData';

export default function StatsBar() {
  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {PLATFORM_STATS.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-sub">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
