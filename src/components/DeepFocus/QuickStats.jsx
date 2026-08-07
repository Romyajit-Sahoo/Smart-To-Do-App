import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Activity, Flame, Trophy } from 'lucide-react';
import './QuickStats.css';

export const QuickStats = () => {
  const { focusSessions, getLocalDateString } = useApp();

  const stats = useMemo(() => {
    const todayStr = getLocalDateString();
    const todaySessions = focusSessions?.filter(s => s.timestamp.startsWith(todayStr)) || [];
    const todayTime = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    const sessionsToday = todaySessions.length;
    
    let longestSession = 0;
    if (focusSessions?.length > 0) {
      longestSession = Math.max(...focusSessions.map(s => s.duration));
    }

    let currentStreak = 0;
    let checkDate = new Date();
    
    if (sessionsToday > 0) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    if (focusSessions?.length > 0) {
      while (true) {
        const checkStr = getLocalDateString(checkDate);
        if (focusSessions.some(s => s.timestamp.startsWith(checkStr))) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const formatTime = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    };

    return {
      todayFocus: formatTime(todayTime),
      sessionsToday,
      currentStreak: `${currentStreak} Days`,
      longestSession: formatTime(longestSession)
    };
  }, [focusSessions, getLocalDateString]);

  const cards = [
    {
      id: 1,
      title: "Today's Focus",
      value: stats.todayFocus,
      icon: Clock,
      color: "#6366f1" // primary
    },
    {
      id: 2,
      title: "Sessions Today",
      value: stats.sessionsToday,
      icon: Activity,
      color: "#10b981" // emerald
    },
    {
      id: 3,
      title: "Current Streak",
      value: stats.currentStreak,
      icon: Flame,
      color: "#f59e0b" // amber
    },
    {
      id: 4,
      title: "Longest Session",
      value: stats.longestSession,
      icon: Trophy,
      color: "#ec4899" // pink
    }
  ];

  return (
    <div className="quick-stats-grid">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div key={card.id} className="quick-stat-card glass-panel" style={{ '--card-color': card.color }}>
            <div className="quick-stat-icon-wrap" style={{ color: card.color, backgroundColor: `${card.color}15` }}>
              <Icon size={20} />
            </div>
            <div className="quick-stat-info">
              <span className="quick-stat-value">{card.value}</span>
              <span className="quick-stat-title">{card.title}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
