import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../Common/Badge';
import { 
  Calendar, 
  Copy, 
  Edit3, 
  Trash2, 
  Check, 
  Folder,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { APP_ICONS } from '../../constants/constants';
import './TaskCard.css';

export const TaskCard = ({ task, onEdit }) => {
  const { toggleTaskCompletion, deleteTask, duplicateTask, categories, getLocalDateString } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteScope, setShowDeleteScope] = useState(false);

  const categoryData = categories.find(c => c.id === task.category) || {
    name: 'Custom',
    icon: 'Folder',
    color: '#8b5cf6'
  };
  const IconComponent = APP_ICONS[categoryData.icon] || Folder;

  // Check if overdue (not completed, has a due date in the past, or time is past today)
  const todayStr = getLocalDateString();
  let isOverdue = !task.completed && task.dueDate && task.dueDate < todayStr;
  if (!isOverdue && !task.completed && task.dueDate === todayStr && task.dueTime) {
    const now = new Date();
    const [dueH, dueM] = task.dueTime.split(':').map(Number);
    const taskTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), dueH, dueM, 0);
    isOverdue = now > taskTime;
  }

  const isLocked = task.dueDate && task.dueDate < todayStr;

  const handleDeleteClick = () => {
    if (task.recurringTaskId) {
      setShowDeleteScope(true);
    } else {
      setIsDeleting(true);
      setTimeout(() => {
        deleteTask(task.id);
      }, 250);
    }
  };

  const handleConfirmDelete = (scope) => {
    setShowDeleteScope(false);
    setIsDeleting(true);
    setTimeout(() => {
      deleteTask(task.id, scope);
    }, 250);
  };

  const handleCheckboxChange = () => {
    toggleTaskCompletion(task.id);
  };

  // Format Due Date
  const formatDueDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <article 
      className={`task-card glass-panel ${task.completed ? 'completed' : ''} ${task.missed ? 'missed' : ''} ${isOverdue ? 'overdue-border' : ''} ${isDeleting ? 'deleting' : ''}`}
      style={{ '--category-color': categoryData.color }}
    >
      {/* Inline Delete Dialog Overlay for Recurring Tasks */}
      {showDeleteScope && (
        <div className="card-delete-overlay animate-fade-in">
          <span className="delete-overlay-title">Delete Recurring Task?</span>
          <div className="delete-overlay-options">
            <button 
              className="delete-overlay-btn btn-danger-pill"
              onClick={() => handleConfirmDelete('single')}
              title="Delete only this task card instance"
            >
              This Only
            </button>
            <button 
              className="delete-overlay-btn btn-danger-pill"
              onClick={() => handleConfirmDelete('future')}
              title="Stop future occurrences of this task"
            >
              All Future
            </button>
            <button 
              className="delete-overlay-btn btn-danger-pill"
              onClick={() => handleConfirmDelete('all')}
              title="Delete templates and all instances completely"
            >
              Entire Series
            </button>
            <button 
              className="delete-overlay-btn btn-secondary-pill"
              onClick={() => setShowDeleteScope(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="task-card-main">
        {/* Checkbox trigger */}
        <label className={`checkbox-container ${isLocked ? 'locked' : ''}`}>
          <input 
            type="checkbox" 
            checked={task.completed} 
            onChange={handleCheckboxChange} 
            disabled={isLocked}
          />
          <span className="checkmark">
            <Check className="check-icon" size={12} />
          </span>
        </label>

        {/* Task Details */}
        <div className="task-details-wrap">
          <div className="task-title-row">
            <h3 className="task-title">{task.title}</h3>
          </div>
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}

          {/* Tags list */}
          {task.tags && task.tags.length > 0 && (
            <div className="task-tags-row">
              {task.tags.map(t => (
                <span key={t} className="task-tag">#{t}</span>
              ))}
            </div>
          )}

          {/* Footer Metadata */}
          <div className="task-meta-row">
            {/* Category */}
            <div className="task-meta-item cat-badge" style={{ color: categoryData.color }}>
              <IconComponent size={14} />
              <span>{categoryData.name}</span>
            </div>

            {/* Due Date Indicator */}
            {task.dueDate && (
              <div className={`task-meta-item date-badge ${task.completed ? '' : isOverdue ? 'overdue-text' : ''}`}>
                <Calendar size={14} />
                <span>
                  {formatDueDate(task.dueDate)}
                  {task.dueTime && ` at ${task.dueTime}`}
                </span>
                {isOverdue && !task.completed && <span className="overdue-label">Overdue</span>}
              </div>
            )}

            {/* Priority Badge */}
            <Badge type={task.priority}>
              {task.priority}
            </Badge>

            {/* Recurring Indicator Badge */}
            {task.recurringTaskId && (
              <Badge type="pending" icon={<RefreshCw size={11} className="spin-slow" />}>
                Recurring
              </Badge>
            )}

            {/* Missed Indicator */}
            {task.missed && (
              <Badge type="missed" icon={<AlertCircle size={12} />}>
                Missed
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="task-card-actions">
        <button 
          className="action-icon-btn" 
          onClick={() => !isLocked && onEdit(task)} 
          title={isLocked ? "Historical tasks cannot be edited" : "Edit Task"}
          aria-label="Edit task"
          disabled={isLocked}
          style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <Edit3 size={16} />
        </button>
        <button 
          className="action-icon-btn" 
          onClick={() => duplicateTask(task.id)} 
          title="Duplicate Task"
          aria-label="Duplicate task"
        >
          <Copy size={16} />
        </button>
        <button 
          className="action-icon-btn delete-btn" 
          onClick={handleDeleteClick} 
          title="Delete Task"
          aria-label="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
};
