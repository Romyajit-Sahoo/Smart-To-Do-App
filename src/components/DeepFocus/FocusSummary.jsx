import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Zap, TrendingUp, Award } from 'lucide-react';
import { formatTime } from '../../utils/productivityUtils';
import './FocusSummary.css';

export const FocusSummary = () => {
  const { focusSessions, getLocalDateString } = useApp();

  const summary = useMemo(() => {
    const todayStr = getLocalDateString();
    const todaySessions = focusSessions.filter(s => s.timestamp.startsWith(todayStr));
    
    const todayTime = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    const count = todaySessions.length;
    const avg = count > 0 ? Math.floor(todayTime / count) : 0;
    const longest = count > 0 ? Math.max(...todaySessions.map(s => s.duration)) : 0;

    return { todayTime, count, avg, longest };
  }, [focusSessions, getLocalDateString]);

  return (
    <div className="focus-summary-grid">
      <div className="fs-card glass-panel">
        <div className="fs-icon-wrap time"><Clock size={20} /></div>
        <div className="fs-info">
          <span className="fs-label">Today's Focus</span>
          <span className="fs-value">{formatTime(summary.todayTime)}</span>
        </div>
      </div>

      <div className="fs-card glass-panel">
        <div className="fs-icon-wrap sessions"><Zap size={20} /></div>
        <div className="fs-info">
          <span className="fs-label">Sessions</span>
          <span className="fs-value">{summary.count}</span>
        </div>
      </div>

      <div className="fs-card glass-panel">
        <div className="fs-icon-wrap avg"><TrendingUp size={20} /></div>
        <div className="fs-info">
          <span className="fs-label">Avg. Session</span>
          <span className="fs-value">{formatTime(summary.avg)}</span>
        </div>
      </div>

      <div className="fs-card glass-panel">
        <div className="fs-icon-wrap best"><Award size={20} /></div>
        <div className="fs-info">
          <span className="fs-label">Longest</span>
          <span className="fs-value">{formatTime(summary.longest)}</span>
        </div>
      </div>
    </div>
  );
};
