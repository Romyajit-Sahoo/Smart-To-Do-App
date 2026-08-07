import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Sprout, TreePine, TreeDeciduous } from 'lucide-react';
import './FocusTree.css';

export const FocusTree = () => {
  const { runningFocusSession } = useApp();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval;
    if (runningFocusSession && runningFocusSession.status === 'running') {
      interval = setInterval(() => {
        const now = Date.now();
        const sessionStart = new Date(runningFocusSession.startTime).getTime();
        const pausedMs = runningFocusSession.totalPausedMs || 0;
        setElapsed(Math.floor((now - sessionStart - pausedMs) / 1000));
      }, 1000);
    } else if (runningFocusSession && runningFocusSession.status === 'paused') {
      const sessionStart = new Date(runningFocusSession.startTime).getTime();
      const pausedAt = new Date(runningFocusSession.lastPausedAt).getTime();
      const pausedMs = runningFocusSession.totalPausedMs || 0;
      setElapsed(Math.floor((pausedAt - sessionStart - pausedMs) / 1000));
    } else {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [runningFocusSession]);

  // Determine tree stage based on elapsed time (e.g., 5 mins per stage for demo purposes, can be tuned)
  const getTreeStage = (seconds) => {
    const minutes = seconds / 60;
    if (minutes < 5) return { stage: 1, label: 'Seed', icon: <div className="seed-dot" /> };
    if (minutes < 15) return { stage: 2, label: 'Sprout', icon: <Sprout size={32} /> };
    if (minutes < 30) return { stage: 3, label: 'Small Tree', icon: <TreePine size={48} /> };
    if (minutes < 60) return { stage: 4, label: 'Growing Tree', icon: <TreeDeciduous size={64} /> };
    return { stage: 5, label: 'Full Tree', icon: <TreeDeciduous size={96} className="full-tree" /> };
  };

  const currentStage = getTreeStage(elapsed);
  
  // Calculate progress to next stage (assuming max 60 mins for full tree)
  const progressPercent = Math.min(100, (elapsed / 3600) * 100);

  if (!runningFocusSession || runningFocusSession.status === 'idle') {
    return (
      <div className="focus-tree-container glass-panel empty">
        <Sprout size={48} className="tree-empty-icon" />
        <p>Start a session to grow your focus tree!</p>
      </div>
    );
  }

  return (
    <div className="focus-tree-container glass-panel">
      <div className="tree-visual-area">
        <div className={`tree-icon-wrapper stage-${currentStage.stage} ${runningFocusSession.status}`}>
          {currentStage.icon}
        </div>
      </div>
      
      <div className="tree-info">
        <span className="tree-stage-label">{currentStage.label}</span>
        <div className="tree-progress-bar">
          <div 
            className={`tree-progress-fill ${runningFocusSession.status}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="tree-progress-text">
          {runningFocusSession.status === 'paused' ? 'Growth paused...' : 'Growing...'}
        </span>
      </div>
    </div>
  );
};
