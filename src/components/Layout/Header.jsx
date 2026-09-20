import { useApp } from '../../context/AppContext';
import { Sun, Moon, Search } from 'lucide-react';
import { NotificationCenter } from '../Notifications/NotificationCenter';
import './Header.css';

export const Header = () => {
  const { theme, toggleTheme, activeTab, searchQuery, setSearchQuery } = useApp();

  // Formatting date beautifully
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="app-header glass-panel" aria-label="Page header">
      <div className="header-left">
        <h1 className="header-title">{activeTab}</h1>
        <span className="header-date">{formattedDate}</span>
      </div>

      <div className="header-right">
        {/* Real-time Search Box */}
        <div className="header-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search tasks"
          />
        </div>

        {/* Notification Bell Center (Feature 13) */}
        <NotificationCenter />

        {/* Theme Toggle Button */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
};
