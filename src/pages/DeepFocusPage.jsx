import React from 'react';
import { DeepFocusHero } from '../components/DeepFocus/DeepFocusHero';
import { FocusSummary } from '../components/DeepFocus/FocusSummary';
import './DeepFocusPage.css';

export const DeepFocusPage = () => {
  return (
    <div className="deep-focus-page-container">
      <DeepFocusHero />
      
      <div className="dashboard-summary-section" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.2rem' }}>Today's Focus Summary</h2>
        <FocusSummary />
      </div>
    </div>
  );
};
