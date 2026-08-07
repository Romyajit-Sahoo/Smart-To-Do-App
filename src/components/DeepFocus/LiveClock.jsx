import React, { useState, useEffect } from 'react';
import './LiveClock.css';

export const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getWeekday = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getFullDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="live-clock-wrapper glass-panel">
      <div className="live-clock-time">{formatTime(time)}</div>
      <div className="live-clock-date-group">
        <span className="live-clock-weekday">{getWeekday(time)}</span>
        <span className="live-clock-full-date">{getFullDate(time)}</span>
      </div>
    </div>
  );
};
