import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import './FocusCountdown.css';

export const FocusCountdown = ({ onSessionStop, elapsed = 0 }) => {
  const { runningFocusSession, setRunningFocusSession, setFocusDistractions, saveFocusSession, getLocalDateString, triggerNotification } = useApp();
  
  const [customMinutes, setCustomMinutes] = useState('');
  
  // Timer mode state to distinguish from stopwatch
  const isCountdownMode = runningFocusSession?.mode === 'countdown';
  const targetDuration = runningFocusSession?.targetDuration || 0; // in seconds
  const remaining = isCountdownMode ? Math.max(0, targetDuration - elapsed) : 0;

  const playAlarm = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);

      setTimeout(() => {
        try {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(800, audioCtx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.3);
          gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.3);
          osc2.onended = () => {
            audioCtx.close().catch(() => {});
          };
        } catch {
          audioCtx.close().catch(() => {});
        }
      }, 400);

    } catch (e) {
      console.log("AudioContext blocked or not supported:", e);
    }
  }, []);

  const handleAutoComplete = useCallback(() => {
    if (!runningFocusSession || runningFocusSession.status === 'idle') return;

    playAlarm();
    triggerNotification("Focus Session Completed!", "You have successfully completed your focus session.", 'system');

    // Save session automatically
    saveFocusSession({
      id: `session_${crypto.randomUUID()}`,
      startTime: runningFocusSession.startTime,
      endTime: new Date().toISOString(),
      duration: targetDuration,
      task: runningFocusSession.task,
      notes: "Completed countdown session successfully.",
      distractions: { pauseCount: 0, stopCount: 0, windowLostFocusCount: 0, browserHiddenCount: 0 },
      focusScore: 100,
      date: getLocalDateString(),
      timestamp: new Date().toISOString()
    });

    setRunningFocusSession(prev => ({
      ...prev,
      status: 'idle',
      startTime: null,
      totalPausedMs: 0,
      mode: null,
      targetDuration: 0
    }));
    
    setFocusDistractions({
      pauseCount: 0, stopCount: 0, browserHiddenCount: 0, windowLostFocusCount: 0, idleTime: 0
    });
  }, [runningFocusSession, playAlarm, triggerNotification, saveFocusSession, targetDuration, getLocalDateString, setRunningFocusSession, setFocusDistractions]);

  // Auto-complete when remaining hits zero in active countdown
  useEffect(() => {
    if (isCountdownMode && runningFocusSession?.status === 'running' && remaining <= 0 && targetDuration > 0) {
      handleAutoComplete();
    }
  }, [remaining, isCountdownMode, runningFocusSession?.status, targetDuration, handleAutoComplete]);

  const handleStart = (minutes) => {
    if (!runningFocusSession || !runningFocusSession.task) {
      alert("Please select a task or habit first.");
      return;
    }
    
    const duration = minutes * 60;
    
    setRunningFocusSession({
      ...runningFocusSession,
      status: 'running',
      startTime: new Date().toISOString(),
      totalPausedMs: 0,
      mode: 'countdown',
      targetDuration: duration
    });
    
    setFocusDistractions({
      pauseCount: 0,
      stopCount: 0,
      browserHiddenCount: 0,
      windowLostFocusCount: 0,
      idleTime: 0
    });
  };

  const handleCustomStart = (e) => {
    e.preventDefault();
    const mins = parseInt(customMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      handleStart(mins);
      setCustomMinutes('');
    }
  };

  const handlePause = () => {
    if (runningFocusSession?.status !== 'running') return;
    
    setRunningFocusSession({
      ...runningFocusSession,
      status: 'paused',
      lastPausedAt: new Date().toISOString()
    });
    
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
    
    setFocusDistractions(prev => ({ ...prev, stopCount: prev.stopCount + 1 }));
    
    let finalDuration = targetDuration - remaining;
    if (runningFocusSession.status === 'running') {
      const now = Date.now();
      const sessionStart = new Date(runningFocusSession.startTime).getTime();
      const pausedMs = runningFocusSession.totalPausedMs || 0;
      finalDuration = Math.floor((now - sessionStart - pausedMs) / 1000);
    }
    
    // Pass to parent to show notes modal
    onSessionStop({
      duration: finalDuration,
      startTime: runningFocusSession.startTime,
      task: runningFocusSession.task
    });
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset this session? It will not be saved.")) {
      setRunningFocusSession(prev => ({ ...prev, status: 'idle', startTime: null, totalPausedMs: 0, mode: null, targetDuration: 0 }));
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

  const status = isCountdownMode ? (runningFocusSession?.status || 'idle') : 'idle';
  const { h, m, s } = formatTimeParts(remaining);
  const presets = [5, 10, 15, 25, 30, 45, 60];

  return (
    <div className="focus-countdown-container glass-panel">
      <div className={`countdown-display ${status} ${remaining <= 60 && status === 'running' ? 'pulse-urgent' : ''}`}>
        <span className="time-part">{h}</span>
        <span className="time-sep">:</span>
        <span className="time-part">{m}</span>
        <span className="time-sep">:</span>
        <span className="time-part">{s}</span>
      </div>
      
      {status === 'idle' ? (
        <div className="countdown-presets-container">
          <div className="presets-grid">
            {presets.map(mins => (
              <button key={mins} className="preset-btn" onClick={() => handleStart(mins)}>
                {mins}m
              </button>
            ))}
          </div>
          <form className="custom-mins-form" onSubmit={handleCustomStart}>
            <input 
              type="number" 
              placeholder="Custom mins" 
              value={customMinutes} 
              onChange={e => setCustomMinutes(e.target.value)}
              min="1"
              max="999"
              className="custom-mins-input"
            />
            <button type="submit" className="custom-start-btn">Start</button>
          </form>
        </div>
      ) : (
        <div className="countdown-controls">
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
      )}
    </div>
  );
};
