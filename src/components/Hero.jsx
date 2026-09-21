import React from 'react';

export default function Hero() {
  return (
    <section className="hero-section" id="hero" style={{ padding: '3.5rem 0 2rem' }}>
      <div className="container">
        <div className="hero-content">
          {/* Main Title */}
          <h1 className="hero-title" style={{ fontSize: '2.75rem', marginBottom: '1rem' }}>
            Find your <span className="gradient-text">teammates</span>.
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle" style={{ fontSize: '1.08rem', margin: '0 auto', maxWidth: '640px' }}>
            Connect with fellow student builders, form balanced teams, and collaborate on exciting projects.
          </p>
        </div>
      </div>
    </section>
  );
}
