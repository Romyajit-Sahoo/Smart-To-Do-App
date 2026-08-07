import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TABS } from '../../constants/constants';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Flame, 
  BarChart2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Trophy,
  Brain
} from 'lucide-react';
import './Sidebar.css';

export const Sidebar = () => {
  const { activeTab, setActiveTab, tasks } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Quick stats calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const menuItems = [
    { id: TABS.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: TABS.TASKS, label: 'Tasks', icon: CheckSquare, badge: tasks.filter(t => !t.completed && !t.missed).length },
    { id: TABS.HABITS, label: 'Habits', icon: Flame },
    { id: TABS.DEEP_FOCUS, label: 'Deep Focus', icon: Brain },
    { id: TABS.ANALYTICS, label: 'Analytics', icon: BarChart2 },
    { id: TABS.CALENDAR, label: 'Calendar', icon: Calendar },
    { id: TABS.GAMIFICATION, label: 'Rewards', icon: Trophy },
  ];

  return (
    <aside className={`app-sidebar glass-panel ${isCollapsed ? 'collapsed' : ''}`} aria-label="Sidebar navigation">
      {/* Sidebar Header / Logo */}
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon-wrap">
            <TrendingUp size={24} className="logo-icon" />
          </div>
          {!isCollapsed && <span className="logo-text">FocusFlow</span>}
        </div>
        <button 
          className="collapse-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  className={`nav-item-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={20} className="nav-icon" />
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mini Streak / Stats Card */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="productivity-card glass-panel">
            <div className="prod-card-header">
              <span className="prod-card-title">Daily Progress</span>
              <span className="prod-card-percent">{completionRate}%</span>
            </div>
            <div className="prod-progress-bar-wrap">
              <div 
                className="prod-progress-bar-fill" 
                style={{ width: `${completionRate}%` }} 
              />
            </div>
            <span className="prod-card-desc">
              {completedTasks}/{totalTasks} tasks completed
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
