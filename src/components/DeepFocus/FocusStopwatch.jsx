import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import './FocusStopwatch.css';

export const FocusStopwatch = ({ onSessionStop }) => {
  const { runningFocusSession, setRunningFocusSession, setFocusDistractions } = useApp();
  
  // Local state for UI updates
  const [elapsed, setElapsed] = useState(0);

  // Sync elapsed time from global state
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

  const handleStart = () => {
    if (!runningFocusSession || !runningFocusSession.task) {
      alert("Please select a task or habit first.");
      return;
    }
    
    setRunningFocusSession({
      ...runningFocusSession,
      status: 'running',
      startTime: new Date().toISOString(),
      totalPausedMs: 0
    });
    
    setFocusDistractions({
      pauseCount: 0,
      stopCount: 0,
      browserHiddenCount: 0,
      windowLostFocusCount: 0,
      idleTime: 0
    });
  };

  const handlePause = () => {
    if (runningFocusSession?.status !== 'running') return;
    
    setRunningFocusSession({
      ...runningFocusSession,
      status: 'paused',
      lastPausedAt: new Date().toISOString()
    });
    
    // Track distraction (pause)
    setFocusDistractions(prev => ({ ...prev, pauseCount: prev.pauseCount + 1 }));
  };

  const handleResume = () => {
    if (runningFocusSession?.status !== 'paused') return;
    
    const now = new Date();
    const pausedAt = new Date(runningFocusSession.lastPausedAt);
    const pauseDuration = now.getTime() - pausedAt.getTime();
    
    setRunningFocusSession({
      ...runningFocusSession,
      status: 'running',
      totalPausedMs: (runningFocusSession.totalPausedMs || 0) + pauseDuration,
      lastPausedAt: null
    });
  };

  const handleStop = () => {
    if (!runningFocusSession || runningFocusSession.status === 'idle') return;
    
    // Track distraction (stop)
    setFocusDistractions(prev => ({ ...prev, stopCount: prev.stopCount + 1 }));
    
    // Finalize time calculation before passing to parent
    let finalDuration = elapsed;
    if (runningFocusSession.status === 'running') {
      const now = Date.now();
      const sessionStart = new Date(runningFocusSession.startTime).getTime();
      const pausedMs = runningFocusSession.totalPausedMs || 0;
      finalDuration = Math.floor((now - sessionStart - pausedMs) / 1000);
    }
    
    onSessionStop({
      duration: finalDuration,
      startTime: runningFocusSession.startTime,
      task: runningFocusSession.task
    });
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset this session? It will not be saved.")) {
      setRunningFocusSession(prev => ({ ...prev, status: 'idle', startTime: null, totalPausedMs: 0 }));
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    return `${h.toString().padStart(2, '0')} : ${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`;
  };

  const status = runningFocusSession?.status || 'idle';

  return (
    <div className="focus-stopwatch-container glass-panel">
      <div className={`stopwatch-display ${status}`}>
        {formatTime(elapsed)}
      </div>
      
      <div className="stopwatch-controls">
        {status === 'idle' && (
          <button className="sw-btn sw-start" onClick={handleStart}>
            <Play size={20} fill="currentColor" /> Start
          </button>
        )}
        
        {status === 'running' && (
          <button className="sw-btn sw-pause" onClick={handlePause}>
            <Pause size={20} fill="currentColor" /> Pause
          </button>
        )}
        
        {status === 'paused' && (
          <button className="sw-btn sw-resume" onClick={handleResume}>
            <Play size={20} fill="currentColor" /> Resume
          </button>
        )}
        
        {(status === 'running' || status === 'paused') && (
          <>
            <button className="sw-btn sw-stop" onClick={handleStop}>
              <Square size={20} fill="currentColor" /> Stop
            </button>
            <button className="sw-btn sw-reset" onClick={handleReset} title="Reset">
              <RotateCcw size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
