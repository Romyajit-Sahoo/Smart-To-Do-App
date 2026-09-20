import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import './FocusAnalytics.css';

export const FocusAnalytics = () => {
  const { focusSessions = [], getLocalDateString } = useApp();

  const data = useMemo(() => {
    const list = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateString(d);
      
      const daySessions = focusSessions.filter(s => s.timestamp && s.timestamp.startsWith(dateStr));
      const totalSeconds = daySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      
      list.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: Number((totalSeconds / 3600).toFixed(2))
      });
    }
    return list;
  }, [focusSessions, getLocalDateString]);

  const maxHours = Math.max(...data.map(d => d.hours), 1);
  const totalHoursWeek = data.reduce((acc, d) => acc + d.hours, 0).toFixed(1);

  return (
    <div className="focus-analytics-card glass-panel">
      <div className="fa-header">
        <h3>This Week's Focus</h3>
        <span className="fa-total-hours">{totalHoursWeek}h Total</span>
      </div>
      
      <div className="fa-native-chart">
        {data.map(item => (
          <div key={item.name} className="fa-bar-item">
            <span className="fa-bar-val">{item.hours > 0 ? `${item.hours}h` : ''}</span>
            <div className="fa-bar-track">
              <div 
                className="fa-bar-fill" 
                style={{ height: `${Math.max(4, (item.hours / maxHours) * 100)}%` }}
                title={`${item.name}: ${item.hours}h`}
              />
            </div>
            <span className="fa-bar-lbl">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

