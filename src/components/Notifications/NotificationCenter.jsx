import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  Settings, 
  Trash2, 
  Check, 
  Clock, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  ChevronDown
} from 'lucide-react';
import './NotificationCenter.css';

export const NotificationCenter = () => {
  const { 
    notifications, 
    notificationSettings, 
    setNotificationSettings, 
    requestNotificationPermission, 
    markNotificationRead, 
    markAllNotificationsRead, 
    deleteNotification, 
    clearAllNotifications, 
    snoozeTaskReminder 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'reminder' | 'missed' | 'completed'
  const [showSettings, setShowSettings] = useState(false);
  const [activeSnoozeTaskId, setActiveSnoozeTaskId] = useState(null); // toggled snooze menu
  const panelRef = useRef(null);

  // Close panel if clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowSettings(false);
        setActiveSnoozeTaskId(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Count unread
  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.unread).length;
  }, [notifications]);

  // Filtered Notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === 'unread') return n.unread;
      if (activeTab === 'reminder') return n.type === 'reminder';
      if (activeTab === 'missed') return n.type === 'missed';
      if (activeTab === 'completed') return n.type === 'completed';
      return true; // 'all'
    });
  }, [notifications, activeTab]);

  const togglePanel = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setShowSettings(false);
      setActiveSnoozeTaskId(null);
    }
  };

  const handleSnoozeOption = (taskId, minutes) => {
    snoozeTaskReminder(taskId, minutes);
    setActiveSnoozeTaskId(null);
  };

  // Format Elapsed Time
  const formatTimeElapsed = (timestampStr) => {
    try {
      const diffMs = Date.now() - new Date(timestampStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(timestampStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Handle setting checkboxes
  const handleToggleSetting = (key) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleQuietHoursChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const snoozeOptions = [
    { label: '5m', value: 5 },
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '1h', value: 60 }
  ];

  return (
    <div className="notification-center-container" ref={panelRef}>
      {/* Bell Button Toggler */}
      <button 
        className={`bell-trigger-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={togglePanel}
        aria-label={`In-app notifications, ${unreadCount} unread`}
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="bell-badge-count">{unreadCount}</span>}
      </button>

      {/* Floating Panel overlay */}
      {isOpen && (
        <div className="notification-panel glass-panel animate-fade-in">
          {/* Header Panel */}
          <div className="panel-header-line">
            <h3 className="panel-title">
              {showSettings ? 'Notification Settings' : 'Notifications'}
            </h3>
            <div className="panel-header-actions">
              <button 
                className={`panel-header-btn ${showSettings ? 'active' : ''}`}
                onClick={() => setShowSettings(!showSettings)}
                title="Reminder Configurations"
              >
                <Settings size={16} />
              </button>
              <button className="panel-header-btn" onClick={togglePanel}>
                <X size={16} />
              </button>
            </div>
          </div>

          {showSettings ? (
            /* PREFERENCES SETTINGS VIEW */
            <div className="panel-settings-content animate-fade-in">
              {/* Native browser notifications permission */}
              <div className="settings-option-item">
                <div className="option-info">
                  <span className="option-title">System Push Notifications</span>
                  <p className="option-desc">Recieve reminders in system tray</p>
                </div>
                <button 
                  type="button" 
                  className={`permission-btn ${notificationSettings.browserEnabled ? 'enabled' : ''}`}
                  onClick={requestNotificationPermission}
                >
                  {notificationSettings.browserEnabled ? 'Enabled' : 'Enable'}
                </button>
              </div>

              {/* Checkbox settings */}
              {[
                { key: 'inAppEnabled', title: 'Enable In-App Notifications', desc: 'Display alerts inside FocusFlow' },
                { key: 'dailySummaryEnabled', title: 'Morning Briefing Alerts', desc: 'Receive Today\'s tasks summary' },
                { key: 'missedAlertsEnabled', title: 'Missed Task Recaps', desc: 'Summary of incomplete yesterday tasks' },
                { key: 'soundsEnabled', title: 'Play Sounds', desc: 'Play synthesized sound alerts' }
              ].map(opt => (
                <label key={opt.key} className="settings-checkbox-row">
                  <div className="option-info">
                    <span className="option-title">{opt.title}</span>
                    <p className="option-desc">{opt.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings[opt.key]}
                    onChange={() => handleToggleSetting(opt.key)}
                    className="settings-cb"
                  />
                </label>
              ))}

              {/* Quiet hours configuration */}
              <div className="quiet-hours-config">
                <span className="option-title flex-align"><Moon size={14} /> Quiet Hours</span>
                <p className="option-desc">Mute all alert sounds and notification displays</p>
                <div className="time-range-inputs">
                  <div className="time-input-group">
                    <span>From</span>
                    <input 
                      type="time" 
                      value={notificationSettings.quietHoursStart} 
                      onChange={(e) => handleQuietHoursChange('quietHoursStart', e.target.value)} 
                    />
                  </div>
                  <div className="time-input-group">
                    <span>To</span>
                    <input 
                      type="time" 
                      value={notificationSettings.quietHoursEnd} 
                      onChange={(e) => handleQuietHoursChange('quietHoursEnd', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* NOTIFICATIONS LIST VIEW */
            <div className="panel-list-content">
              {/* Quick actions panel */}
              {notifications.length > 0 && (
                <div className="quick-actions-line">
                  <button className="quick-action-text" onClick={markAllNotificationsRead}>
                    Mark all read
                  </button>
                  <button className="quick-action-text danger" onClick={clearAllNotifications}>
                    Clear all
                  </button>
                </div>
              )}

              {/* Filter tabs */}
              <div className="panel-filters-scroll">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'unread', label: 'Unread' },
                  { id: 'reminder', label: 'Reminders' },
                  { id: 'missed', label: 'Missed' },
                  { id: 'completed', label: 'Completed' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`filter-pill-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Message cards */}
              {filteredNotifications.length > 0 ? (
                <div className="notifications-cards-list">
                  {filteredNotifications.map((notif) => {
                    let typeIcon = <Info size={14} className="info" />;
                    if (notif.type === 'completed') typeIcon = <CheckCircle size={14} className="completed" />;
                    if (notif.type === 'missed') typeIcon = <AlertCircle size={14} className="missed" />;
                    if (notif.type === 'reminder') typeIcon = <Clock size={14} className="reminder" />;

                    return (
                      <div 
                        key={notif.id} 
                        className={`notification-item-card ${notif.unread ? 'unread' : ''}`}
                      >
                        <div className="item-card-left">
                          <span className="item-type-icon">{typeIcon}</span>
                        </div>
                        <div className="item-card-body">
                          <div className="item-title-line">
                            <span className="item-card-title">{notif.title}</span>
                            <span className="item-card-time">{formatTimeElapsed(notif.timestamp)}</span>
                          </div>
                          <p className="item-card-desc">{notif.body}</p>

                          {/* Snooze actions wrapper (Only for upcoming task reminders) */}
                          {notif.type === 'reminder' && notif.taskInfo && (
                            <div className="snooze-actions-row">
                              <button 
                                className="snooze-toggle-btn"
                                onClick={() => setActiveSnoozeTaskId(activeSnoozeTaskId === notif.id ? null : notif.id)}
                              >
                                <Clock size={12} /> Snooze <ChevronDown size={10} />
                              </button>
                              
                              {activeSnoozeTaskId === notif.id && (
                                <div className="snooze-options-bubble glass-panel">
                                  {snoozeOptions.map(opt => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      className="snooze-bubble-item"
                                      onClick={() => handleSnoozeOption(notif.taskInfo.id, opt.value)}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="item-card-actions">
                          {notif.unread && (
                            <button 
                              className="item-btn" 
                              onClick={() => markNotificationRead(notif.id)}
                              title="Mark read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button 
                            className="item-btn delete" 
                            onClick={() => deleteNotification(notif.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="panel-empty-state">
                  <Bell size={24} className="empty-bell" />
                  <span className="empty-desc">No notifications matching filters.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default NotificationCenter;
