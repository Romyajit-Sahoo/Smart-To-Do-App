import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TaskCard } from '../components/Tasks/TaskCard';
import { CreateHabitModal } from '../components/Habits/CreateHabitModal';
import * as Icons from 'lucide-react';
import './HabitsPage.css';

export const HabitsPage = () => {
  const { tasks, recurringTasks, updateRecurringTask, getLocalDateString } = useApp();
  
  const [activeTab, setActiveTab] = useState('today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);

  const todayStr = getLocalDateString();

  // 1. Filter out Habit Templates
  const habitTemplates = useMemo(() => {
    return recurringTasks.filter(tpl => tpl.isHabit);
  }, [recurringTasks]);

  // 2. Filter out Generated Habit Instances
  const habitInstances = useMemo(() => {
    return tasks.filter(t => t.isHabit);
  }, [tasks]);

  // Sub-groupings
  const todayInstances = habitInstances.filter(t => t.dueDate === todayStr && !t.missed);
  const activeHabits = habitTemplates.filter(tpl => tpl.isActive && !tpl.isArchived);
  const pausedHabits = habitTemplates.filter(tpl => !tpl.isActive && !tpl.isArchived);
  const archivedHabits = habitTemplates.filter(tpl => tpl.isArchived);

  const totalCompletions = habitInstances.filter(t => t.completed).length;

  const handleEditHabit = (tpl) => {
    setHabitToEdit(tpl);
    setIsModalOpen(true);
  };

  const handleTogglePause = (tpl) => {
    updateRecurringTask(tpl.id, { isActive: !tpl.isActive });
  };

  const handleToggleArchive = (tpl) => {
    updateRecurringTask(tpl.id, { isArchived: !tpl.isArchived, isActive: false });
  };

  const renderHabitCard = (tpl) => {
    const Icon = Icons[tpl.icon] || Icons.Flame;
    const isPaused = !tpl.isActive;
    const isArchived = tpl.isArchived;

    return (
      <div key={tpl.id} className={`habit-tpl-card glass-panel ${isPaused ? 'paused' : ''} ${isArchived ? 'archived' : ''}`} style={{ borderLeftColor: tpl.color }}>
        <div className="habit-tpl-header">
          <div>
            <div className="habit-icon-circle" style={{ background: tpl.color }}>
              <Icon size={24} />
            </div>
            <div className="habit-tpl-title">{tpl.title}</div>
            {tpl.description && <div className="habit-tpl-desc">{tpl.description}</div>}
          </div>
          <button className="icon-btn" onClick={() => handleEditHabit(tpl)} aria-label="Edit Habit">
            <Icons.Edit2 size={16} />
          </button>
        </div>

        <div className="habit-meta-badges">
          <span className="habit-meta-badge">
            <Icons.Repeat size={12} /> {tpl.frequency} {tpl.customInterval ? `(${tpl.customInterval}d)` : ''}
          </span>
          {tpl.dueTime && (
            <span className="habit-meta-badge">
              <Icons.Clock size={12} /> {tpl.dueTime}
            </span>
          )}
        </div>

        <div className="habit-actions">
          {!isArchived && (
            <button 
              className={`habit-action-btn ${isPaused ? 'play' : 'pause'}`}
              onClick={() => handleTogglePause(tpl)}
            >
              {isPaused ? <><Icons.Play size={16} /> Resume</> : <><Icons.Pause size={16} /> Pause</>}
            </button>
          )}
          <button 
            className={`habit-action-btn archive`}
            onClick={() => handleToggleArchive(tpl)}
          >
            {isArchived ? <><Icons.RotateCcw size={16} /> Restore</> : <><Icons.Archive size={16} /> Archive</>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="habits-page">
      <div className="habits-header-row">
        <h1>
          <Icons.Flame size={32} color="var(--primary)" /> 
          Habits Manager
        </h1>
        <button className="btn btn-primary" onClick={() => { setHabitToEdit(null); setIsModalOpen(true); }}>
          <Icons.Plus size={18} /> New Habit
        </button>
      </div>

      {/* OVERVIEW STATS */}
      <div className="habits-stats-grid">
        <div className="habit-stat-card glass-panel">
          <Icons.Activity size={24} color="var(--primary)" />
          <div className="value">{activeHabits.length}</div>
          <div className="label">Active Habits</div>
        </div>
        <div className="habit-stat-card glass-panel">
          <Icons.CheckCircle size={24} color="var(--success)" />
          <div className="value">{totalCompletions}</div>
          <div className="label">Total Completions</div>
        </div>
        <div className="habit-stat-card glass-panel">
          <Icons.PauseCircle size={24} color="var(--warning)" />
          <div className="value">{pausedHabits.length}</div>
          <div className="label">Paused Habits</div>
        </div>
      </div>

      {/* TABS */}
      <div className="habits-tabs">
        <button className={`habit-tab-btn ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
          Today's Routine ({todayInstances.length})
        </button>
        <button className={`habit-tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          Active ({activeHabits.length})
        </button>
        <button className={`habit-tab-btn ${activeTab === 'paused' ? 'active' : ''}`} onClick={() => setActiveTab('paused')}>
          Paused ({pausedHabits.length})
        </button>
        <button className={`habit-tab-btn ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => setActiveTab('archived')}>
          Archived ({archivedHabits.length})
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'today' && (
        <div className="tasks-list">
          {todayInstances.length === 0 ? (
            <div className="empty-state glass-panel">
              <Icons.Coffee size={48} className="empty-icon" />
              <h3>All caught up!</h3>
              <p>No habits scheduled for today, or you've completed them all.</p>
            </div>
          ) : (
            todayInstances.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div className="habit-grid">
          {activeHabits.length === 0 ? <p className="text-secondary">No active habits. Create one to start building your routine!</p> : activeHabits.map(renderHabitCard)}
        </div>
      )}

      {activeTab === 'paused' && (
        <div className="habit-grid">
          {pausedHabits.length === 0 ? <p className="text-secondary">No paused habits.</p> : pausedHabits.map(renderHabitCard)}
        </div>
      )}

      {activeTab === 'archived' && (
        <div className="habit-grid">
          {archivedHabits.length === 0 ? <p className="text-secondary">No archived habits.</p> : archivedHabits.map(renderHabitCard)}
        </div>
      )}

      {/* MODAL */}
      <CreateHabitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        habitToEdit={habitToEdit} 
      />
    </div>
  );
};
