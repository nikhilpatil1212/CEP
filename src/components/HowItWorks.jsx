import React from 'react';
import { HOW_IT_WORKS_STEPS } from '../data/mockData';
import { FileCode, UserCheck, Trophy } from 'lucide-react';

const STEP_ICONS = [FileCode, UserCheck, Trophy];

export default function HowItWorks() {
  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">Frictionless Collaboration</div>
          <h2 className="section-title">How CampusConnect Works</h2>
          <p className="section-subtitle">
            From an initial spark of an idea to submitting a winning hackathon repo in 3 straightforward steps.
          </p>
        </div>

        <div className="steps-grid">
          {HOW_IT_WORKS_STEPS.map((step, idx) => {
            const Icon = STEP_ICONS[idx % STEP_ICONS.length];
            return (
              <div key={idx} className="step-card">
                <div className="step-header">
                  <span className="step-num">{step.step}</span>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={22} />
                  </div>
                </div>
                <span className="badge badge-primary" style={{ marginBottom: '0.85rem' }}>
                  {step.badge}
                </span>
                <h3 className="step-card-title">{step.title}</h3>
                <p className="step-card-desc">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
