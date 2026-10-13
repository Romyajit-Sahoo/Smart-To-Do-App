import { useApp } from '../../context/AppContext';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import './FocusStopwatch.css';

export const FocusStopwatch = ({ onSessionStop, elapsed = 0 }) => {
  const { runningFocusSession, setRunningFocusSession, setFocusDistractions } = useApp();

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

  const formatTimeParts = (seconds) => {
    const sVal = Math.max(0, Number(seconds) || 0);
    const h = Math.floor(sVal / 3600);
    const m = Math.floor((sVal % 3600) / 60);
    const s = sVal % 60;
    
    return {
      h: h.toString().padStart(2, '0'),
      m: m.toString().padStart(2, '0'),
      s: s.toString().padStart(2, '0')
    };
  };

  const status = runningFocusSession?.status || 'idle';
  const { h, m, s } = formatTimeParts(elapsed);

  return (
    <div className="focus-stopwatch-container glass-panel">
      <div className={`stopwatch-display ${status}`}>
        <span className="time-part">{h}</span>
        <span className="time-sep">:</span>
        <span className="time-part">{m}</span>
        <span className="time-sep">:</span>
        <span className="time-part">{s}</span>
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
