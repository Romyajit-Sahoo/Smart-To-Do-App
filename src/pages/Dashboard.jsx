import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  calculateTodayStats, 
  calculateProductivityScore, 
  calculateStreaks, 
  calculateQuickStats, 
  getMotivationalMessage 
} from '../utils/productivityUtils';
import { Badge } from '../components/Common/Badge';
import { 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CalendarRange, 
  Flame, 
  TrendingUp, 
  Sparkles, 
  Activity,
  Layers,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import './Dashboard.css';

export const Dashboard = () => {
  const { tasks, categories, activities, setActiveTab, getLocalDateString } = useApp();

  // 1. Calculate Greeting message
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Today Date Formatting (e.g. Saturday, 1 August 2026)
  const fullDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  // 2. Compute dynamic stats from localStorage
  const todayStats = useMemo(() => calculateTodayStats(tasks), [tasks]);
  const scoreStats = useMemo(() => calculateProductivityScore(tasks), [tasks]);
  const streakStats = useMemo(() => calculateStreaks(tasks), [tasks]);
  const quickStats = useMemo(() => calculateQuickStats(tasks, categories), [tasks, categories]);
  const motivator = useMemo(() => getMotivationalMessage(todayStats), [todayStats]);

  // 3. Format Activity Relative Time
  const formatRelativeTime = (timestampStr) => {
    try {
      const diffMs = Date.now() - new Date(timestampStr).getTime();
      if (diffMs < 0) return 'just now'; // catch future clocks
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch {
      return 'some time ago';
    }
  };

  // 4. SVG Progress Ring settings
  const radius = 50;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI; // Circumference = 251.3
  const strokeDashoffset = circumference - (todayStats.rate / 100) * circumference;

  return (
    <div className="page-container dashboard-page">
      {/* SECTION 1: GREETINGS HEADER */}
      <header className="dashboard-greeting-wrap">
        <div className="greeting-left">
          <span className="greeting-pill"><Sparkles size={14} /> Welcome back</span>
          <h2 className="greeting-title">{greeting}, User</h2>
          <p className="greeting-subtitle">{fullDate}</p>
        </div>
        <div className="productivity-rating-card glass-panel">
          <div className="rating-left">
            <span className="rating-label">Overall Rating</span>
            <span className="rating-value">{scoreStats.level}</span>
          </div>
          <div className="rating-percentage">{scoreStats.score}%</div>
        </div>
      </header>

      {/* SECTION 2 & 3: STATS CARDS */}
      <section className="dashboard-stats-grid" aria-label="Today stats cards">
        <div className="stats-card glass-panel">
          <div className="stats-card-icon-wrap task-blue">
            <ListTodo size={20} />
          </div>
          <div className="stats-card-info">
            <span className="stats-number">{todayStats.total}</span>
            <span className="stats-label">Today's Tasks</span>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <div className="stats-card-icon-wrap task-green">
            <CheckCircle2 size={20} />
          </div>
          <div className="stats-card-info">
            <span className="stats-number">{todayStats.completed}</span>
            <span className="stats-label">Completed Today</span>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <div className="stats-card-icon-wrap task-orange">
            <Clock size={20} />
          </div>
          <div className="stats-card-info">
            <span className="stats-number">{todayStats.pending}</span>
            <span className="stats-label">Pending Today</span>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <div className="stats-card-icon-wrap task-red">
            <AlertCircle size={20} />
          </div>
          <div className="stats-card-info">
            <span className="stats-number">{todayStats.missed}</span>
            <span className="stats-label">Missed Today</span>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <div className="stats-card-icon-wrap task-purple">
            <CalendarRange size={20} />
          </div>
          <div className="stats-card-info">
            <span className="stats-number">{todayStats.overdue}</span>
            <span className="stats-label">Overdue Tasks</span>
          </div>
        </div>
      </section>

      {/* MAIN TWO COLUMN VIEW */}
      <div className="dashboard-main-columns">
        {/* LEFT COLUMN: PROGRESS, STREAKS, INSIGHTS */}
        <div className="dashboard-col-left">
          
          {/* SECTION 4 & 5: PROGRESS & MOTIVATION */}
          <div className="progress-motivation-card glass-panel">
            <div className="progress-ring-container">
              <svg height={radius * 2} width={radius * 2}>
                {/* Background Ring */}
                <circle
                  stroke="var(--border-color)"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                {/* Active Ring */}
                <circle
                  stroke="url(#progress-gradient)"
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  className="progress-ring-circle"
                />
                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="progress-ring-text">
                <span className="progress-ring-percent">{todayStats.rate}%</span>
              </div>
            </div>

            <div className="progress-details-content">
              <h3 className="progress-details-title">Today's Progress</h3>
              <p className="progress-details-desc">
                {todayStats.completed} of {todayStats.total} tasks completed
              </p>
              <div className="motivation-banner-text">
                <Sparkles size={16} className="sparkle-icon" />
                <span>{motivator}</span>
              </div>
            </div>
          </div>

          {/* SECTION 6 & 7: STREAKS SECTION */}
          <div className="streaks-row">
            <div className="streak-card-wrapper glass-panel current-streak-glow">
              <div className="streak-card-icon-wrap">
                <Flame className="flame-active" size={24} />
              </div>
              <div className="streak-card-info">
                <span className="streak-value">{streakStats.currentStreak} Days</span>
                <span className="streak-label">Current Streak</span>
              </div>
            </div>

            <div className="streak-card-wrapper glass-panel longest-streak-glow">
              <div className="streak-card-icon-wrap">
                <Flame className="flame-gold" size={24} />
              </div>
              <div className="streak-card-info">
                <span className="streak-value">{streakStats.longestStreak} Days</span>
                <span className="streak-label">🔥 Longest Streak</span>
              </div>
            </div>
          </div>

          {/* SECTION 8: QUICK INSIGHTS */}
          <div className="quick-insights-panel glass-panel">
            <h3 className="section-panel-title">Quick Insights</h3>
            <div className="insights-grid">
              <div className="insight-stat-item">
                <span className="insight-stat-val">{quickStats.completedThisWeek}</span>
                <span className="insight-stat-lbl">Completed This Week</span>
              </div>
              <div className="insight-stat-item">
                <span className="insight-stat-val">{quickStats.completedThisMonth}</span>
                <span className="insight-stat-lbl">Completed This Month</span>
              </div>
              <div className="insight-stat-item">
                <span className="insight-stat-val">{quickStats.totalCompleted}</span>
                <span className="insight-stat-lbl">Total Completed</span>
              </div>
              <div className="insight-stat-item">
                <span className="insight-stat-val">{quickStats.totalMissed}</span>
                <span className="insight-stat-lbl">Total Missed</span>
              </div>
              <div className="insight-stat-item">
                <span className="insight-stat-val">{quickStats.totalPending}</span>
                <span className="insight-stat-lbl">Total Pending</span>
              </div>
              <div className="insight-stat-item">
                <span className="insight-stat-val">{quickStats.recurringCount}</span>
                <span className="insight-stat-lbl">Recurring Instances</span>
              </div>
              <div className="insight-stat-item">
                <span className="insight-stat-val">{quickStats.oneTimeCount}</span>
                <span className="insight-stat-lbl">One-Time Tasks</span>
              </div>
              <div className="insight-stat-item">
                <span className="insight-stat-val text-truncate" title={quickStats.mostUsedCategory}>
                  {quickStats.mostUsedCategory}
                </span>
                <span className="insight-stat-lbl">Most Active Category</span>
              </div>
            </div>

            {quickStats.highPriorityCount > 0 && (
              <div className="high-priority-banner animate-pulse">
                <AlertCircle size={16} />
                <span>You have {quickStats.highPriorityCount} pending high priority task{quickStats.highPriorityCount > 1 ? 's' : ''}!</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT ACTIVITIES */}
        <div className="dashboard-col-right">
          <div className="recent-activity-panel glass-panel">
            <div className="activity-panel-header">
              <h3 className="section-panel-title">
                <Activity size={18} /> Recent Activity
              </h3>
            </div>

            {activities.length > 0 ? (
              <div className="activity-timeline-list">
                {activities.slice(0, 10).map((act) => {
                  let actClass = '';
                  let actBadgeText = '';
                  if (act.type === 'completed') {
                    actClass = 'act-completed';
                    actBadgeText = 'completed';
                  } else if (act.type === 'created') {
                    actClass = 'act-created';
                    actBadgeText = 'created';
                  } else if (act.type === 'deleted') {
                    actClass = 'act-deleted';
                    actBadgeText = 'deleted';
                  } else if (act.type === 'missed') {
                    actClass = 'act-missed';
                    actBadgeText = 'missed';
                  } else {
                    actClass = 'act-restore';
                    actBadgeText = 'updated';
                  }

                  return (
                    <div key={act.id} className="timeline-item">
                      <div className="timeline-indicator-wrap">
                        <div className={`timeline-indicator-dot ${actClass}`} />
                        <div className="timeline-connector-line" />
                      </div>
                      <div className="timeline-item-body">
                        <div className="timeline-item-content">
                          <span className="activity-task-name">{act.taskTitle}</span>
                          <span className={`activity-type-tag ${actClass}`}>{actBadgeText}</span>
                        </div>
                        <span className="activity-time-stamp">
                          {formatRelativeTime(act.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="activity-empty-state">
                <span className="activity-empty-desc">No activities logged yet. Tasks you create or complete will show up here.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
