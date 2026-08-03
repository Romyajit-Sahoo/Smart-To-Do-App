import React from 'react';
import { useApp } from '../../context/AppContext';
import { TABS } from '../../constants/constants';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Flame, 
  BarChart2, 
  Calendar,
  Trophy 
} from 'lucide-react';
import './MobileNav.css';

export const MobileNav = () => {
  const { activeTab, setActiveTab, tasks } = useApp();

  const navItems = [
    { id: TABS.DASHBOARD, label: 'Home', icon: LayoutDashboard },
    { id: TABS.TASKS, label: 'Tasks', icon: CheckSquare, badge: tasks.filter(t => !t.completed && !t.missed).length },
    { id: TABS.CALENDAR, label: 'History', icon: Calendar },
    { id: TABS.ANALYTICS, label: 'Stats', icon: BarChart2 },
    { id: TABS.GAMIFICATION, label: 'Rewards', icon: Trophy }
  ];

  return (
    <nav className="mobile-bottom-nav glass-panel" aria-label="Mobile bottom navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <div className="mobile-icon-wrap">
              <Icon size={22} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="mobile-nav-badge">{item.badge}</span>
              )}
            </div>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
