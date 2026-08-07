import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Target } from 'lucide-react';
import './FocusGoalCard.css';

export const FocusGoalCard = () => {
  const { focusSessions, getLocalDateString } = useApp();
  
  // Default goal is 4 hours (14400 seconds)
  const defaultGoalSeconds = 4 * 60 * 60;

  const { todayTime, progressPercent, formattedToday, formattedGoal } = useMemo(() => {
    const todayStr = getLocalDateString();
    const todaySessions = focusSessions?.filter(s => s.timestamp.startsWith(todayStr)) || [];
    const totalTime = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    
    const percent = Math.min(Math.round((totalTime / defaultGoalSeconds) * 100), 100);

    const formatTime = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
    };

    return {
      todayTime: totalTime,
      progressPercent: percent,
      formattedToday: formatTime(totalTime),
      formattedGoal: formatTime(defaultGoalSeconds)
    };
  }, [focusSessions, getLocalDateString]);

  return (
    <div className="focus-goal-card glass-panel">
      <div className="focus-goal-header">
        <div className="focus-goal-title">
          <Target size={20} className="goal-icon" />
          <h3>Today's Goal</h3>
        </div>
        <div className="focus-goal-value">4 Hours</div>
      </div>
      
      <div className="focus-goal-body">
        <div className="focus-goal-stats">
          <span className="goal-progress-text">Progress</span>
          <span className="goal-progress-ratio">{formattedToday} / {formattedGoal}</span>
        </div>
        
        <div className="goal-progress-track">
          <div 
            className="goal-progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="goal-percent-text">{progressPercent}% Completed</div>
      </div>
    </div>
  );
};
