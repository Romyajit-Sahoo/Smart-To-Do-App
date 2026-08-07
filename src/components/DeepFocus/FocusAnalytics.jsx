import React from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './FocusAnalytics.css';

export const FocusAnalytics = () => {
  const { focusSessions, getLocalDateString } = useApp();

  // Generate last 7 days data
  const getLast7DaysData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateString(d);
      
      const daySessions = focusSessions.filter(s => s.timestamp.startsWith(dateStr));
      const totalSeconds = daySessions.reduce((acc, s) => acc + s.duration, 0);
      
      data.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: Number((totalSeconds / 3600).toFixed(2))
      });
    }
    return data;
  };

  const data = getLast7DaysData();
  const totalHoursWeek = data.reduce((acc, d) => acc + d.hours, 0).toFixed(1);

  return (
    <div className="focus-analytics-card glass-panel">
      <div className="fa-header">
        <h3>This Week's Focus</h3>
        <span className="fa-total-hours">{totalHoursWeek}h Total</span>
      </div>
      
      <div className="fa-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              contentStyle={{ background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
