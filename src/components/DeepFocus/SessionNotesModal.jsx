import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import './SessionNotesModal.css';

export const SessionNotesModal = ({ duration, task, distractions, onSave, onClose }) => {
  const [notes, setNotes] = useState('');

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const calculateFocusScore = () => {
    let score = 100;
    score -= (distractions.pauseCount * 5);
    score -= (distractions.windowLostFocusCount * 2);
    return Math.max(0, score);
  };

  const handleSave = () => {
    onSave({
      notes,
      duration,
      task,
      distractions,
      focusScore: calculateFocusScore(),
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="modal-overlay">
      <div className="session-notes-modal glass-panel">
        <div className="modal-header">
          <h2>Session Completed!</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="session-stats-grid">
          <div className="stat-box">
            <span className="stat-label">Duration</span>
            <span className="stat-value">{formatTime(duration)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Focus Score</span>
            <span className="stat-value highlight">{calculateFocusScore()}%</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Interruptions</span>
            <span className="stat-value">{distractions.pauseCount + distractions.windowLostFocusCount}</span>
          </div>
        </div>

        <div className="notes-input-group">
          <label>Session Notes (Optional)</label>
          <textarea 
            placeholder="What did you accomplish? Any learnings or ideas?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Discard</button>
          <button className="btn-save" onClick={handleSave}>
            <Save size={18} /> Save Session
          </button>
        </div>
      </div>
    </div>
  );
};
