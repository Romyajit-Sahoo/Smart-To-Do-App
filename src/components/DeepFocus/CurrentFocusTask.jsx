import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Target, CheckCircle2, Circle, Flame, CheckSquare } from 'lucide-react';
import './CurrentFocusTask.css';

export const CurrentFocusTask = ({ onTaskSelect, onTaskComplete }) => {
  const { tasks, habits, runningFocusSession, getLocalDateString } = useApp();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionTab, setSelectionTab] = useState('tasks'); // 'tasks' | 'habits'

  const activeTask = runningFocusSession?.task;

  const handleSelect = (item, type) => {
    onTaskSelect({ ...item, type });
    setIsSelecting(false);
  };

  const getFilteredTasks = () => {
    const todayStr = getLocalDateString();
    return tasks.filter(t => !t.completed && !t.missed && t.dueDate === todayStr);
  };

  const isCompleted = activeTask?.type === 'task' 
    ? tasks.find(t => t.id === activeTask?.id)?.completed 
    : dailyRecords[getLocalDateString()]?.[activeTask?.id];

  if (activeTask) {
    return (
      <div className="current-focus-task-card glass-panel">
        <div className="cft-header">
          <span className="cft-label">Current Focus</span>
          {activeTask.type === 'task' ? (
            <span className="cft-badge task-badge"><CheckSquare size={14} /> Task</span>
          ) : (
            <span className="cft-badge habit-badge"><Flame size={14} /> Habit</span>
          )}
        </div>
        
        <h3 className="cft-title">{activeTask.name || activeTask.title}</h3>
        
        <div className="cft-details">
          {activeTask.category && (
            <span className="cft-category">{activeTask.category}</span>
          )}
          {activeTask.priority && (
            <span className={`cft-priority priority-${activeTask.priority}`}>
              {activeTask.priority}
            </span>
          )}
          {activeTask.type === 'habit' && (
            <span className="cft-frequency">Daily</span>
          )}
          <span className="cft-status">
            {isCompleted ? 'Completed' : runningFocusSession?.status === 'running' ? 'In Progress' : runningFocusSession?.status === 'paused' ? 'Paused' : 'Selected'}
          </span>
          {activeTask.estimatedDuration && (
            <span className="cft-duration">{activeTask.estimatedDuration}m</span>
          )}
        </div>

        <button 
          className="cft-complete-btn" 
          onClick={() => onTaskComplete(activeTask)}
          disabled={isCompleted}
          style={{ opacity: isCompleted ? 0.6 : 1, cursor: isCompleted ? 'not-allowed' : 'pointer' }}
        >
          <CheckCircle2 size={18} />
          {isCompleted ? 'Completed' : (activeTask.type === 'task' ? 'Complete Task' : 'Mark Habit Complete')}
        </button>
      </div>
    );
  }

  if (isSelecting) {
    return (
      <div className="current-focus-task-card glass-panel cft-selecting">
        <div className="cft-selection-header">
          <h3>Select Focus Task</h3>
          <button className="cft-close-btn" onClick={() => setIsSelecting(false)}>Cancel</button>
        </div>
        
        <div className="cft-tabs">
          <button 
            className={`cft-tab ${selectionTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setSelectionTab('tasks')}
          >
            Tasks
          </button>
          <button 
            className={`cft-tab ${selectionTab === 'habits' ? 'active' : ''}`}
            onClick={() => setSelectionTab('habits')}
          >
            Habits
          </button>
        </div>

        <div className="cft-list">
          {selectionTab === 'tasks' ? (
            getFilteredTasks().length > 0 ? (
              getFilteredTasks().map(task => (
                <div key={task.id} className="cft-list-item" onClick={() => handleSelect(task, 'task')}>
                  <Circle size={16} className="cft-list-icon" />
                  <div className="cft-list-content">
                    <span className="cft-list-title">{task.title}</span>
                    {task.category && <span className="cft-list-cat">{task.category}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="cft-empty">No pending tasks found.</div>
            )
          ) : (
            habits.length > 0 ? (
              habits.map(habit => (
                <div key={habit.id} className="cft-list-item" onClick={() => handleSelect(habit, 'habit')}>
                  <Flame size={16} className="cft-list-icon habit" />
                  <div className="cft-list-content">
                    <span className="cft-list-title">{habit.name}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="cft-empty">No habits found.</div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="current-focus-task-card glass-panel cft-empty-state">
      <div className="cft-empty-icon">
        <Target size={32} />
      </div>
      <h3>No task selected.</h3>
      <p>Select a task or habit to track your progress during this session.</p>
      <button className="cft-select-btn" onClick={() => setIsSelecting(true)}>
        Select Focus Task
      </button>
    </div>
  );
};
