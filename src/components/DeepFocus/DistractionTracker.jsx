import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { EyeOff, AlertTriangle } from 'lucide-react';
import './DistractionTracker.css';

export const DistractionTracker = () => {
  const { runningFocusSession, focusDistractions, setFocusDistractions } = useApp();

  useEffect(() => {
    // Only track when running
    if (!runningFocusSession || runningFocusSession.status !== 'running') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFocusDistractions(prev => ({
          ...prev,
          browserHiddenCount: prev.browserHiddenCount + 1
        }));
      }
    };

    const handleWindowBlur = () => {
      setFocusDistractions(prev => ({
        ...prev,
        windowLostFocusCount: prev.windowLostFocusCount + 1
      }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [runningFocusSession, setFocusDistractions]);

  // If no distractions, don't render much or render a clean state
  const totalDistractions = focusDistractions.pauseCount + focusDistractions.stopCount + focusDistractions.browserHiddenCount + focusDistractions.windowLostFocusCount;

  if (totalDistractions === 0) return null;

  return (
    <div className="distraction-tracker glass-panel">
      <div className="dt-header">
        <AlertTriangle size={16} className="dt-icon" />
        <span>Distractions Detected</span>
      </div>
      <div className="dt-stats">
        {focusDistractions.pauseCount > 0 && (
          <div className="dt-stat">
            <span className="dt-val">{focusDistractions.pauseCount}</span>
            <span className="dt-lbl">Pauses</span>
          </div>
        )}
        {focusDistractions.windowLostFocusCount > 0 && (
          <div className="dt-stat">
            <span className="dt-val">{focusDistractions.windowLostFocusCount}</span>
            <span className="dt-lbl">Focus Lost</span>
          </div>
        )}
        {focusDistractions.browserHiddenCount > 0 && (
          <div className="dt-stat">
            <span className="dt-val">{focusDistractions.browserHiddenCount}</span>
            <span className="dt-lbl">Tab Hidden</span>
          </div>
        )}
      </div>
    </div>
  );
};
