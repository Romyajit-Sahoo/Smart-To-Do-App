import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateDayPerformance, calculateDayDetailedStats } from '../utils/productivityUtils';
import { Badge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Calendar as CalendarIcon, 
  List, 
  Smile, 
  FileText, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  HelpCircle,
  BarChart,
  RefreshCw,
  Folder,
  Tag
} from 'lucide-react';
import './CalendarPage.css';

export const CalendarPage = () => {
  const { tasks, categories, dailyHistoryNotes, saveDailyHistoryNotes, getLocalDateString, focusSessions } = useApp();

  // Local View States
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'timeline'
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Selected Day Details Modal States
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);

  // Journal form temporary states
  const [journalNotes, setJournalNotes] = useState('');
  const [journalReflection, setJournalReflection] = useState('');
  const [journalMood, setJournalMood] = useState('');

  // Search & Filter state for Timeline View
  const [searchQuery, setSearchQuery] = useState('');
  const [timelineFilter, setTimelineFilter] = useState('All'); // 'All' | 'Perfect' | 'Completed' | 'Missed'
  const [timelineCategory, setTimelineCategory] = useState('All');

  // Month names constant array
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Handle Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // 1. Generate Days list for Calendar View
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const totalDaysPrev = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Preceding Month padding cells
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = totalDaysPrev - i;
      const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYearVal = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYearVal}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      cells.push({
        dayNumber: prevDay,
        dateStr,
        isCurrentMonth: false,
      });
    }

    // Current Month active cells
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Succeeding Month padding cells to make 6 rows (42 cells)
    const totalGridCells = 42;
    const remainingCells = totalGridCells - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYearVal = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYearVal}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: false,
      });
    }

    return cells.map(cell => {
      const performance = calculateDayPerformance(tasks, cell.dateStr);
      const dayFocusSessions = focusSessions.filter(s => s.timestamp.startsWith(cell.dateStr));
      const focusDuration = dayFocusSessions.reduce((acc, s) => acc + s.duration, 0);
      return {
        ...cell,
        performance,
        focusDuration,
        focusSessionsCount: dayFocusSessions.length
      };
    });
  }, [currentMonth, currentYear, tasks, focusSessions]);

  // 2. Open Details Dialog handler
  const handleOpenDayDetails = (dateStr) => {
    setSelectedDateStr(dateStr);
    const savedNotes = dailyHistoryNotes[dateStr] || {};
    setJournalNotes(savedNotes.notes || '');
    setJournalReflection(savedNotes.reflection || '');
    setJournalMood(savedNotes.mood || '');
    setIsDayDetailsOpen(true);
  };

  // 3. Save Notes / Reflection
  const handleSaveJournal = (e) => {
    e.preventDefault();
    if (!selectedDateStr) return;
    saveDailyHistoryNotes(selectedDateStr, {
      notes: journalNotes,
      reflection: journalReflection,
      mood: journalMood
    });
    setIsDayDetailsOpen(false);
  };

  // 4. Generate Chronological Timeline View Days list
  const timelineDays = useMemo(() => {
    // Collect all unique dueDates in tasks that are <= today
    const todayStr = getLocalDateString();
    const uniqueDates = Array.from(
      new Set(tasks.map(t => t.dueDate).filter(d => d && d <= todayStr))
    ).sort().reverse(); // Reverse chronological

    let daysList = uniqueDates.map(dateStr => {
      const performance = calculateDayPerformance(tasks, dateStr);
      const savedNotes = dailyHistoryNotes[dateStr] || {};
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      const dayFocusSessions = focusSessions.filter(s => s.timestamp.startsWith(dateStr));
      const focusDuration = dayFocusSessions.reduce((acc, s) => acc + s.duration, 0);
      return {
        dateStr,
        performance,
        notes: savedNotes.notes,
        mood: savedNotes.mood,
        tasks: dayTasks,
        focusDuration,
        focusSessionsCount: dayFocusSessions.length
      };
    });

    // Apply Timeline Search queries (by date, task name, category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      daysList = daysList.filter(day => {
        const dateMatch = day.dateStr.includes(q);
        const taskMatch = day.tasks.some(t => {
          const catName = categories.find(c => c.id === t.category)?.name.toLowerCase() || '';
          return (
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.priority.toLowerCase().includes(q) ||
            catName.includes(q)
          );
        });
        return dateMatch || taskMatch;
      });
    }

    // Apply Filters (Completed Days, Missed Days, Perfect Days)
    if (timelineFilter !== 'All') {
      if (timelineFilter === 'Perfect') {
        daysList = daysList.filter(day => day.performance.total > 0 && day.performance.rate === 100);
      } else if (timelineFilter === 'Completed') {
        daysList = daysList.filter(day => day.performance.completed > 0);
      } else if (timelineFilter === 'Missed') {
        daysList = daysList.filter(day => day.tasks.some(t => t.missed));
      }
    }

    // Apply Category Filter
    if (timelineCategory !== 'All') {
      daysList = daysList.filter(day => day.tasks.some(t => t.category === timelineCategory));
    }

    return daysList;
  }, [tasks, dailyHistoryNotes, searchQuery, timelineFilter, timelineCategory, categories, getLocalDateString]);

  const selectedDayDetailed = useMemo(() => {
    if (!selectedDateStr) return null;
    const dayTasks = tasks.filter(t => t.dueDate === selectedDateStr);
    const dayFocusSessions = focusSessions.filter(s => s.timestamp.startsWith(selectedDateStr));
    const focusDuration = dayFocusSessions.reduce((acc, s) => acc + s.duration, 0);
    
    return {
      ...calculateDayDetailedStats(dayTasks, categories),
      focusDuration,
      focusSessionsCount: dayFocusSessions.length
    };
  }, [selectedDateStr, tasks, categories, focusSessions]);

  // Mood Config mapping
  const moodPills = [
    { id: 'happy', label: '😊 Happy', color: '#10b981' },
    { id: 'satisfied', label: '😎 Satisfied', color: '#3b82f6' },
    { id: 'neutral', label: '😐 Neutral', color: '#f59e0b' },
    { id: 'tired', label: '😴 Tired', color: '#8b5cf6' },
    { id: 'stressed', label: '😰 Stressed', color: '#ef4444' }
  ];

  return (
    <div className="page-container calendar-page">
      {/* Subview Selector & Nav toolbar */}
      <section className="calendar-toolbar" aria-label="Toolbar navigation">
        <div className="toolbar-left">
          <div className="view-toggle-wrap">
            <button
              className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon size={16} />
              <span>Calendar</span>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              <List size={16} />
              <span>Timeline</span>
            </button>
          </div>

          <button className="jump-today-btn" onClick={handleJumpToToday}>
            Today
          </button>
        </div>

        {/* Month Navigation Title */}
        {viewMode === 'calendar' && (
          <div className="month-navigator">
            <button className="nav-arrow-btn" onClick={handlePrevMonth} aria-label="Previous month">
              <ChevronLeft size={20} />
            </button>
            <h2 className="current-month-label">{monthNames[currentMonth]} {currentYear}</h2>
            <button className="nav-arrow-btn" onClick={handleNextMonth} aria-label="Next month">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </section>

      {/* VIEWPORT 1: MONTHLY CALENDAR GRID */}
      {viewMode === 'calendar' && (
        <main className="calendar-view-container glass-panel animate-fade-in" aria-label="Calendar view">
          {/* Weekday headers */}
          <div className="weekday-header-grid">
            {weekdays.map(day => (
              <div key={day} className="weekday-header-cell">{day}</div>
            ))}
          </div>

          {/* Month Day cells */}
          <div className="month-days-grid">
            {calendarCells.map((cell, idx) => {
              const todayStr = getLocalDateString();
              const isToday = cell.dateStr === todayStr;
              
              return (
                <button
                  key={`${cell.dateStr}-${idx}`}
                  className={`calendar-day-cell cell-${cell.performance.colorClass} ${cell.isCurrentMonth ? '' : 'pad-day'} ${isToday ? 'is-today' : ''}`}
                  onClick={() => handleOpenDayDetails(cell.dateStr)}
                >
                  <div className="day-cell-top">
                    <span className="day-number-label">{cell.dayNumber}</span>
                    {isToday && <span className="today-dot" />}
                  </div>

                  {cell.performance.total > 0 && (
                    <div className="day-cell-stats">
                      <span className="cell-stats-percent">{cell.performance.rate}%</span>
                      <span className="cell-stats-ratio">
                        {cell.performance.completed}/{cell.performance.total}
                      </span>
                    </div>
                  )}
                  {cell.focusSessionsCount > 0 && (
                    <div className="day-cell-focus" style={{ fontSize: '0.7rem', color: '#6366f1', marginTop: 'auto', textAlign: 'center', fontWeight: '500' }}>
                      {Math.floor(cell.focusDuration / 60)}m focus
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </main>
      )}

      {/* VIEWPORT 2: CHRONOLOGICAL HISTORY TIMELINE */}
      {viewMode === 'timeline' && (
        <main className="timeline-view-container animate-fade-in" aria-label="Timeline view">
          {/* Timeline search & filtering row */}
          <div className="timeline-filter-card glass-panel">
            <div className="timeline-search-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search history by task, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="timeline-filters-grid">
              {/* Type Filter */}
              <div className="timeline-filter-group">
                <span className="filter-title-label">Performance</span>
                <select
                  value={timelineFilter}
                  onChange={(e) => setTimelineFilter(e.target.value)}
                  className="timeline-filter-select"
                >
                  <option value="All">All Days</option>
                  <option value="Perfect">Perfect Days (100%)</option>
                  <option value="Completed">Completed Days</option>
                  <option value="Missed">Missed Days</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="timeline-filter-group">
                <span className="filter-title-label">Category</span>
                <select
                  value={timelineCategory}
                  onChange={(e) => setTimelineCategory(e.target.value)}
                  className="timeline-filter-select"
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Timeline Days List */}
          {timelineDays.length > 0 ? (
            <div className="timeline-cards-list">
              {timelineDays.map((day) => (
                <article 
                  key={day.dateStr} 
                  className={`timeline-card glass-panel border-${day.performance.colorClass}`}
                >
                  <div className="timeline-card-header">
                    <div className="timeline-header-left">
                      <h3 className="timeline-date-label">
                        {new Date(day.dateStr + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </h3>
                      {day.mood && (
                        <span className="timeline-mood-badge">
                          {moodPills.find(m => m.id === day.mood)?.label || day.mood}
                        </span>
                      )}
                    </div>
                    
                    <div className="timeline-header-right">
                      <div className="timeline-completion-summary">
                        <span className="timeline-percent-val">{day.performance.rate}% Complete</span>
                        <span className="timeline-ratio-val">{day.performance.completed}/{day.performance.total} tasks</span>
                      </div>
                      
                      {day.focusSessionsCount > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: '500', marginBottom: '0.5rem' }}>
                          🧠 {Math.floor(day.focusDuration / 60)}m Focus ({day.focusSessionsCount} sessions)
                        </div>
                      )}

                      <button 
                        className="timeline-action-btn"
                        onClick={() => handleOpenDayDetails(day.dateStr)}
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  {day.notes && (
                    <p className="timeline-notes-snippet">
                      <strong>Journal Summary:</strong> {day.notes}
                    </p>
                  )}

                  {/* Tasks nested summary list */}
                  <div className="timeline-nested-tasks">
                    {day.tasks.map(t => (
                      <div key={t.id} className="nested-task-row">
                        <div className="nested-task-title-wrap">
                          <span className={`task-status-dot ${t.completed ? 'done' : t.missed ? 'missed' : 'pending'}`} />
                          <span className={`nested-task-title ${t.completed ? 'completed-strike' : ''}`}>
                            {t.title}
                          </span>
                        </div>
                        <div className="nested-task-meta">
                          <span className="meta-text">{t.category}</span>
                          <span className={`meta-priority prio-${t.priority}`}>{t.priority}</span>
                          {t.recurringTaskId && <RefreshCw size={10} className="spin-slow" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="timeline-empty-card glass-panel">
              <AlertCircle size={36} className="empty-icon" />
              <h3>No history match found</h3>
              <p>Try refining your search keyword or clearing the filters above.</p>
            </div>
          )}
        </main>
      )}

      {/* SELECTED DATE DETAILS DIALOG MODAL */}
      <Modal
        isOpen={isDayDetailsOpen}
        onClose={() => setIsDayDetailsOpen(false)}
        title={selectedDateStr ? new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : ''}
      >
        {selectedDayDetailed && (
          <div className="day-details-container animate-fade-in">
            {/* 1. Statistics Cards breakdown */}
            <div className="day-details-stats-section">
              <div className="detail-stat-bubble glass-panel">
                <span className="bubble-val">{selectedDayDetailed.rate}%</span>
                <span className="bubble-lbl">Completion Rate</span>
              </div>
              <div className="detail-stat-bubble glass-panel">
                <span className="bubble-val">{selectedDayDetailed.completed} / {selectedDayDetailed.total}</span>
                <span className="bubble-lbl">Tasks Done</span>
              </div>
              <div className="detail-stat-bubble glass-panel">
                <span className="bubble-val text-truncate" title={selectedDayDetailed.mostActiveCategory}>
                  {selectedDayDetailed.mostActiveCategory}
                </span>
                <span className="bubble-lbl">Active Category</span>
              </div>
              <div className="detail-stat-bubble glass-panel">
                <span className="bubble-val">{selectedDayDetailed.avgCompletionTimeText}</span>
                <span className="bubble-lbl">Avg Completion Time</span>
              </div>
              {selectedDayDetailed.focusSessionsCount > 0 && (
                <div className="detail-stat-bubble glass-panel" style={{ borderLeft: '2px solid #6366f1' }}>
                  <span className="bubble-val">{Math.floor(selectedDayDetailed.focusDuration / 60)}m</span>
                  <span className="bubble-lbl">Total Focus</span>
                </div>
              )}
            </div>

            {/* 2. Task Details List */}
            <section className="modal-section-box">
              <h4 className="modal-section-title">Scheduled Tasks</h4>
              <div className="modal-tasks-list">
                {tasks.filter(t => t.dueDate === selectedDateStr).length > 0 ? (
                  tasks.filter(t => t.dueDate === selectedDateStr).map((task) => (
                    <div key={task.id} className="modal-task-item glass-panel">
                      <div className="modal-task-left">
                        <div className="modal-task-title-line">
                          <span className={`task-indicator-icon-wrap ${task.completed ? 'check' : task.missed ? 'x' : 'clock'}`}>
                            {task.completed ? <CheckCircle size={14} /> : task.missed ? <AlertCircle size={14} /> : <Clock size={14} />}
                          </span>
                          <span className={`modal-task-name ${task.completed ? 'completed-strike' : ''}`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="modal-task-sub-tags">
                          <span className="modal-tag-item"><Folder size={11} /> {categories.find(c => c.id === task.category)?.name || task.category}</span>
                          <span className="modal-tag-item"><Tag size={11} /> Priority: {task.priority}</span>
                        </div>
                      </div>
                      <div className="modal-task-right">
                        {task.completed && task.completionTime && (
                          <span className="modal-task-time">
                            Completed at {new Date(task.completionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {task.missed && <Badge type="missed">Missed</Badge>}
                        {!task.completed && !task.missed && <Badge type="pending">Pending</Badge>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-tasks-text">No tasks scheduled for this day.</p>
                )}
              </div>
            </section>

            {/* 3. Daily Notes and Mood Journal form */}
            <form onSubmit={handleSaveJournal} className="modal-journal-box">
              <h4 className="modal-section-title">Daily Journal & Reflection</h4>
              
              {/* Mood picker */}
              <div className="form-group">
                <label className="form-label">How was your mood today?</label>
                <div className="mood-pills-row">
                  {moodPills.map(mood => (
                    <button
                      key={mood.id}
                      type="button"
                      className={`mood-pill-btn ${journalMood === mood.id ? 'active' : ''}`}
                      onClick={() => setJournalMood(mood.id)}
                      style={{ '--mood-active-color': mood.color }}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Achievements notes */}
              <div className="form-group">
                <label htmlFor="journal-notes" className="form-label">What did you achieve today?</label>
                <textarea
                  id="journal-notes"
                  placeholder="Record your achievements, successes, or what went well..."
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  className="form-textarea"
                  rows={2}
                />
              </div>

              {/* Reflection notes */}
              <div className="form-group">
                <label htmlFor="journal-ref" className="form-label">What needs improvement?</label>
                <textarea
                  id="journal-ref"
                  placeholder="Reflections on obstacles faced and how you can do better next time..."
                  value={journalReflection}
                  onChange={(e) => setJournalReflection(e.target.value)}
                  className="form-textarea"
                  rows={2}
                />
              </div>

              <div className="modal-journal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsDayDetailsOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Journal Entry
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default CalendarPage;
