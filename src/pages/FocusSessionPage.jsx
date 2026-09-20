import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TABS } from '../constants/constants';
import { CurrentFocusTask } from '../components/DeepFocus/CurrentFocusTask';
import { FocusStopwatch } from '../components/DeepFocus/FocusStopwatch';
import { FocusCountdown } from '../components/DeepFocus/FocusCountdown';
import { FocusTree } from '../components/DeepFocus/FocusTree';
import { FocusSummary } from '../components/DeepFocus/FocusSummary';
import { DistractionTracker } from '../components/DeepFocus/DistractionTracker';
import { SessionNotesModal } from '../components/DeepFocus/SessionNotesModal';
import { ArrowLeft, Maximize2, Minimize2, Settings2 } from 'lucide-react';
import './FocusSessionPage.css';

export const FocusSessionPage = () => {
  const { 
    saveFocusSession, 
    runningFocusSession,
    setRunningFocusSession, 
    getLocalDateString, 
    setActiveTab,
    focusDistractions,
    setFocusDistractions,
    toggleTaskCompletion,
    triggerNotification
  } = useApp();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimal, setIsMinimal] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState(null);
  const [localTimerMode, setLocalTimerMode] = useState('stopwatch');
  const [runningElapsed, setRunningElapsed] = useState(0);
  const containerRef = useRef(null);

  const timerMode = runningFocusSession?.mode || localTimerMode;

  // Active elapsed calculation: derived when paused/idle, live tick when running
  const pausedElapsed = (runningFocusSession && runningFocusSession.status === 'paused')
    ? Math.floor((new Date(runningFocusSession.lastPausedAt).getTime() - new Date(runningFocusSession.startTime).getTime() - (runningFocusSession.totalPausedMs || 0)) / 1000)
    : 0;

  const elapsed = runningFocusSession?.status === 'paused'
    ? pausedElapsed
    : runningFocusSession?.status === 'running'
      ? runningElapsed
      : 0;

  // Live timer interval: only active while session status is 'running'
  useEffect(() => {
    if (!runningFocusSession || runningFocusSession.status !== 'running') {
      return;
    }

    const calcElapsed = () => {
      const now = Date.now();
      const sessionStart = new Date(runningFocusSession.startTime).getTime();
      const pausedMs = runningFocusSession.totalPausedMs || 0;
      setRunningElapsed(Math.floor((now - sessionStart - pausedMs) / 1000));
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningFocusSession?.status, runningFocusSession?.startTime, runningFocusSession?.totalPausedMs]);

  // Fullscreen toggle logic - target the container specifically for native browser isolation
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Manage body class for Minimal Mode to cleanly hide sidebar/header without breaking layout
  useEffect(() => {
    if (isMinimal || isFullscreen) {
      document.body.classList.add('session-minimal-active');
    } else {
      document.body.classList.remove('session-minimal-active');
    }
    
    // Cleanup on unmount
    return () => document.body.classList.remove('session-minimal-active');
  }, [isMinimal, isFullscreen]);

  const handleTaskSelect = (task) => {
    setRunningFocusSession({ status: 'idle', task, startTime: null, totalPausedMs: 0 });
  };

  const handleTaskComplete = (task) => {
    if (!task) return;

    toggleTaskCompletion(task.id);
    triggerNotification("Success!", task.type === 'habit' ? "Habit marked complete!" : "Task completed successfully!", 'system');

    // Auto-finalize the focus session
    let finalDuration = 0;
    if (runningFocusSession) {
      if (runningFocusSession.status === 'running') {
        const now = Date.now();
        const sessionStart = new Date(runningFocusSession.startTime).getTime();
        const pausedMs = runningFocusSession.totalPausedMs || 0;
        finalDuration = Math.floor((now - sessionStart - pausedMs) / 1000);
      } else if (runningFocusSession.status === 'paused') {
        const sessionStart = new Date(runningFocusSession.startTime).getTime();
        const pausedAt = new Date(runningFocusSession.lastPausedAt).getTime();
        const pausedMs = runningFocusSession.totalPausedMs || 0;
        finalDuration = Math.floor((pausedAt - sessionStart - pausedMs) / 1000);
      }
    }

    saveFocusSession({
      id: `session_${crypto.randomUUID()}`,
      startTime: runningFocusSession?.startTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: finalDuration,
      task: task,
      notes: "Completed successfully.",
      distractions: focusDistractions || { pauseCount: 0, stopCount: 0, windowLostFocusCount: 0, browserHiddenCount: 0 },
      focusScore: 100,
      date: getLocalDateString(),
      timestamp: new Date().toISOString()
    });

    setRunningFocusSession(prev => ({
      ...(prev || {}),
      status: 'idle',
      startTime: null,
      totalPausedMs: 0
    }));
    
    setFocusDistractions({
      pauseCount: 0, stopCount: 0, browserHiddenCount: 0, windowLostFocusCount: 0, idleTime: 0
    });
  };

  const handleSessionStop = (sessionData) => {
    // Show session notes modal before saving
    setCompletedSessionData(sessionData);
  };

  const handleSaveSession = (finalData) => {
    // Save the session safely
    saveFocusSession({
      id: `session_${crypto.randomUUID()}`,
      startTime: finalData?.startTime || completedSessionData?.startTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: finalData?.duration || completedSessionData?.duration || 0,
      task: finalData?.task || completedSessionData?.task || null,
      notes: finalData?.notes || '',
      distractions: finalData?.distractions || { pauseCount: 0, stopCount: 0, windowLostFocusCount: 0, browserHiddenCount: 0 },
      focusScore: finalData?.focusScore || 100,
      date: getLocalDateString(),
      timestamp: new Date().toISOString()
    });

    // Clean up
    setCompletedSessionData(null);
    setRunningFocusSession(prev => ({
      ...(prev || {}),
      status: 'idle',
      startTime: null,
      totalPausedMs: 0
    }));
    
    // Reset distractions
    setFocusDistractions({
      pauseCount: 0,
      stopCount: 0,
      browserHiddenCount: 0,
      windowLostFocusCount: 0,
      idleTime: 0
    });
  };

  const handleDiscardSession = () => {
    // Save safely without notes
    saveFocusSession({
      id: `session_${crypto.randomUUID()}`,
      startTime: completedSessionData?.startTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: completedSessionData?.duration || 0,
      task: completedSessionData?.task || null,
      date: getLocalDateString(),
      timestamp: new Date().toISOString()
    });
    
    setCompletedSessionData(null);
    setRunningFocusSession(prev => ({
      ...(prev || {}),
      status: 'idle',
      startTime: null,
      totalPausedMs: 0
    }));
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setActiveTab(TABS.DASHBOARD);
  };

  // Safe checks against runningFocusSession being null or undefined
  const status = runningFocusSession?.status || 'idle';
  const hasTask = Boolean(runningFocusSession?.task);
  const isRunning = status === 'running';

  // STATE 1: No session exists (Idle without a task)
  if (!hasTask) {
    return (
      <div ref={containerRef} className={`focus-session-page ${isFullscreen ? 'is-fullscreen' : ''} ${isMinimal ? 'is-minimal' : ''}`}>
        <div className="session-topbar">
          <button className="exit-session-btn" onClick={handleExit}>
            <ArrowLeft size={20} /> Exit Session
          </button>
        </div>
        
        <div className="session-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '2rem', padding: '2rem 1rem' }}>
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '640px', width: '100%' }}>
            <h2 style={{ marginBottom: '0.75rem' }}>🧠 Deep Focus</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>Select a task or habit to begin your focus session.</p>
            <CurrentFocusTask onTaskSelect={handleTaskSelect} onTaskComplete={handleTaskComplete} />
          </div>
          <div style={{ maxWidth: '640px', width: '100%' }}>
            <FocusSummary />
          </div>
        </div>
      </div>
    );
  }

  // STATE 2 & 3: Session exists (Paused or Running)
  return (
    <div ref={containerRef} className={`focus-session-page ${isFullscreen ? 'is-fullscreen' : ''} ${isMinimal ? 'is-minimal' : ''}`}>
      {/* Session Top Bar */}
      <div className="session-topbar">
        <button className="exit-session-btn" onClick={handleExit}>
          <ArrowLeft size={20} /> Exit Session
        </button>
        <div className="session-modes">
          <button 
            className={`mode-toggle-btn ${isMinimal ? 'active' : ''}`}
            onClick={() => setIsMinimal(!isMinimal)}
            title="Minimal Mode"
          >
            <Settings2 size={18} /> {isMinimal ? 'Standard Mode' : 'Minimal Mode'}
          </button>
          <button 
            className={`mode-toggle-btn ${isFullscreen ? 'active' : ''}`}
            onClick={toggleFullscreen}
            title="Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            {isFullscreen ? ' Exit Fullscreen' : ' Fullscreen'}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="session-workspace-grid">
        <div className="workspace-center">
          <CurrentFocusTask 
            onTaskSelect={handleTaskSelect} 
            onTaskComplete={handleTaskComplete} 
          />
          
          <div className="timer-mode-toggle-group" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '2rem 0 1rem 0', flexWrap: 'wrap' }}>
            <button 
              className={`timer-mode-toggle-btn ${timerMode === 'stopwatch' ? 'active' : ''}`}
              onClick={() => setLocalTimerMode('stopwatch')}
              style={{ 
                padding: '0.6rem 1.5rem', 
                borderRadius: 'var(--radius-full)', 
                background: timerMode === 'stopwatch' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                color: 'white', 
                border: timerMode === 'stopwatch' ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                cursor: (isRunning || status === 'paused') ? 'not-allowed' : 'pointer', 
                fontWeight: 600,
                opacity: (isRunning || status === 'paused') && timerMode !== 'stopwatch' ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              disabled={isRunning || status === 'paused'}
            >
              Stopwatch Mode
            </button>
            <button 
              className={`timer-mode-toggle-btn ${timerMode === 'countdown' ? 'active' : ''}`}
              onClick={() => setLocalTimerMode('countdown')}
              style={{ 
                padding: '0.6rem 1.5rem', 
                borderRadius: 'var(--radius-full)', 
                background: timerMode === 'countdown' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                color: 'white', 
                border: timerMode === 'countdown' ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                cursor: (isRunning || status === 'paused') ? 'not-allowed' : 'pointer', 
                fontWeight: 600,
                opacity: (isRunning || status === 'paused') && timerMode !== 'countdown' ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              disabled={isRunning || status === 'paused'}
            >
              Countdown Mode
            </button>
          </div>

          {timerMode === 'countdown' ? (
            <FocusCountdown onSessionStop={handleSessionStop} elapsed={elapsed} />
          ) : (
            <FocusStopwatch onSessionStop={handleSessionStop} elapsed={elapsed} />
          )}
        </div>

        {/* Auxiliary components (Tree always visible if running, Distractions hidden in minimal mode) */}
        {isRunning && (
          <div className="workspace-auxiliary">
            <FocusTree elapsed={elapsed} />
            {!isMinimal && <DistractionTracker />}
          </div>
        )}
      </div>

      {/* Session Notes Modal */}
      {completedSessionData && (
        <SessionNotesModal 
          duration={completedSessionData?.duration || 0}
          task={completedSessionData?.task || null}
          distractions={focusDistractions}
          onSave={handleSaveSession}
          onClose={handleDiscardSession}
        />
      )}
    </div>
  );
};
