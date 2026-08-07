import React from 'react';
import { Play } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TABS } from '../../constants/constants';
import './QuickActions.css';

export const QuickActions = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="quick-actions-container glass-panel">
      <h3 className="quick-actions-title">Ready to Focus?</h3>
      <div className="quick-actions-buttons">
        <button 
          className="action-btn primary-action"
          onClick={() => setActiveTab(TABS.FOCUS_SESSION)}
          style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', background: 'var(--primary)', color: 'white', border: 'none' }}
        >
          <Play size={20} fill="currentColor" />
          <span style={{ fontWeight: 600 }}>Start Focus Session</span>
        </button>
      </div>
    </div>
  );
};
