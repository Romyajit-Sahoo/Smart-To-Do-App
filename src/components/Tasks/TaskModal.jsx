import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { 
  Tag, Plus, X, Layers, 
  Flame, Zap, Coffee, Droplet, Heart, Book, Activity, Smile, Star, Briefcase 
} from 'lucide-react';
import './TaskModal.css';

const HABIT_ICONS = [
  { id: 'Flame', component: Flame },
  { id: 'Zap', component: Zap },
  { id: 'Coffee', component: Coffee },
  { id: 'Droplet', component: Droplet },
  { id: 'Heart', component: Heart },
  { id: 'Book', component: Book },
  { id: 'Activity', component: Activity },
  { id: 'Smile', component: Smile },
  { id: 'Star', component: Star },
  { id: 'Briefcase', component: Briefcase }
];

const TaskForm = ({ taskToEdit, initialIsHabit, onClose }) => {
  const { addTask, editTask, updateRecurringTask, categories, recurringTasks, getLocalDateString } = useApp();
  const isHabitMode = Boolean(taskToEdit?.isHabit || initialIsHabit);

  const tpl = taskToEdit?.recurringTaskId 
    ? recurringTasks.find(t => t.id === taskToEdit.recurringTaskId) 
    : null;

  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [category, setCategory] = useState(taskToEdit?.category || 'personal');
  const [priority, setPriority] = useState(taskToEdit?.priority || 'medium');
  const [dueDate, setDueDate] = useState(taskToEdit?.dueDate || getLocalDateString());
  const [dueTime, setDueTime] = useState(taskToEdit?.dueTime || '');
  const [reminderOffset, setReminderOffset] = useState(taskToEdit?.reminderOffset || 'none');
  const [icon, setIcon] = useState(taskToEdit?.icon || 'Flame');
  const [color, setColor] = useState(taskToEdit?.color || '#10b981');
  const [customInterval, setCustomInterval] = useState(taskToEdit?.customInterval || tpl?.customInterval || 2);
  const [frequency, setFrequency] = useState(tpl?.frequency || taskToEdit?.frequency || (isHabitMode ? 'daily' : 'one-time'));
  const [repeatDays, setRepeatDays] = useState(tpl?.repeatDays || taskToEdit?.repeatDays || []);
  const [repeatDate, setRepeatDate] = useState(tpl?.repeatDate || taskToEdit?.repeatDate || 1);
  const [tags, setTags] = useState(taskToEdit?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [showEditScopeModal, setShowEditScopeModal] = useState(false);

  const handleAddTag = (e) => {
    e.preventDefault();
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags(prev => [...prev, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskToEdit && taskToEdit.recurringTaskId && !showEditScopeModal) {
      setShowEditScopeModal(true);
      return;
    }

    submitTaskData();
  };

  const handleConfirmScope = (scope) => {
    submitTaskData(scope);
  };

  const submitTaskData = (editMode = null) => {
    const taskData = {
      title,
      description,
      category,
      priority,
      dueDate: frequency === 'one-time' ? dueDate : getLocalDateString(),
      dueTime,
      reminderOffset,
      tags,
      frequency,
      repeatDays: frequency === 'weekly' ? repeatDays : [],
      repeatDate: frequency === 'monthly' ? repeatDate : 1,
      customInterval: frequency === 'custom' ? customInterval : null,
      isHabit: isHabitMode,
      icon: isHabitMode ? icon : null,
      color: isHabitMode ? color : null,
    };

    if (taskToEdit) {
      const isTemplate = recurringTasks.some(r => r.id === taskToEdit.id);
      if (isTemplate && updateRecurringTask) {
        updateRecurringTask(taskToEdit.id, taskData);
      } else {
        editTask(taskToEdit.id, taskData, editMode);
      }
    } else {
      addTask(taskData);
    }
    onClose();
  };

  const submitBtnText = taskToEdit 
    ? "Save Changes" 
    : (isHabitMode ? "Create Habit" : "Create Task");

  if (showEditScopeModal) {
    return (
      <div className="edit-scope-confirmation">
        <div className="scope-icon-banner">
          <Layers size={36} className="banner-icon" />
        </div>
        <h3 className="scope-confirm-title">Recurring Task Edit</h3>
        <p className="scope-confirm-text">
          This task was auto-generated from a recurring template. How would you like to apply your edits?
        </p>
        
        <div className="scope-actions-col">
          <button 
            type="button" 
            className="btn-scope-option"
            onClick={() => handleConfirmScope('single')}
          >
            <div className="scope-option-header">
              <span className="scope-option-title">Only this occurrence</span>
            </div>
            <p className="scope-option-desc">
              Edits will only apply to today's task card. This card will detach from the recurring series.
            </p>
          </button>
          
          <button 
            type="button" 
            className="btn-scope-option primary-choice"
            onClick={() => handleConfirmScope('future')}
          >
            <div className="scope-option-header">
              <span className="scope-option-title">All future occurrences</span>
            </div>
            <p className="scope-option-desc">
              Edits will update the recurring template. All future pending instances will match these details.
            </p>
          </button>
        </div>

        <div className="scope-footer-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowEditScopeModal(false)}>
            Back to editing
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="task-form">
      {/* Title */}
      <div className="form-group">
        <label htmlFor="task-title" className="form-label">{isHabitMode ? "Habit Name *" : "Title *"}</label>
        <input
          id="task-title"
          type="text"
          required
          placeholder={isHabitMode ? "e.g., Read 20 Pages, Drink Water..." : "e.g. Finish reading Chapter 4"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input"
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="task-desc" className="form-label">{isHabitMode ? "Description (Optional)" : "Description"}</label>
        <textarea
          id="task-desc"
          placeholder={isHabitMode ? "Why are you building this habit?" : "Describe details of this task..."}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-textarea"
          rows={isHabitMode ? 2 : 3}
        />
      </div>

      {/* Habit Visual Customization */}
      {isHabitMode && (
        <div className="form-row animate-fade-in">
          <div className="form-group flex-1">
            <label className="form-label">Habit Icon</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {HABIT_ICONS.map(IconItem => {
                const isSelected = icon === IconItem.id;
                const Component = IconItem.component;
                return (
                  <button
                    key={IconItem.id}
                    type="button"
                    onClick={() => setIcon(IconItem.id)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-primary)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Component size={20} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="form-group" style={{ flex: '0 0 100px' }}>
            <label className="form-label">Color</label>
            <input 
              type="color" 
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="form-input"
              style={{ padding: '0 0.5rem', height: '42px', width: '100%', cursor: 'pointer', marginTop: '0.25rem' }}
            />
          </div>
        </div>
      )}

      <div className="form-row">
        {/* Category */}
        <div className="form-group flex-1">
          <label htmlFor="task-category" className="form-label">Category</label>
          <select
            id="task-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-select"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date (Only applicable for one-time tasks) */}
        {!isHabitMode && frequency === 'one-time' && (
          <div className="form-group flex-1 animate-fade-in">
            <label htmlFor="task-due" className="form-label">Due Date</label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-input"
            />
          </div>
        )}
      </div>

      <div className="form-row animate-fade-in">
        {/* Due Time */}
        <div className="form-group flex-1">
          <label htmlFor="task-time" className="form-label">Due Time (Optional)</label>
          <input
            id="task-time"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Reminder Offset dropdown */}
        <div className="form-group flex-1">
          <label htmlFor="task-reminder" className="form-label">Reminder</label>
          <select
            id="task-reminder"
            value={reminderOffset}
            onChange={(e) => setReminderOffset(e.target.value)}
            className="form-select"
          >
            <option value="none">No Reminder</option>
            <option value="0">At Due Time</option>
            <option value="5">5 Minutes Before</option>
            <option value="10">10 Minutes Before</option>
            <option value="15">15 Minutes Before</option>
            <option value="30">30 Minutes Before</option>
            <option value="60">1 Hour Before</option>
          </select>
        </div>
      </div>

      {/* Frequency Selection */}
      <div className="form-group">
        <label className="form-label">{isHabitMode ? "Schedule & Frequency" : "Task Frequency"}</label>
        <div className="frequency-segments">
          {(isHabitMode ? ['daily', 'weekly', 'monthly', 'custom'] : ['one-time', 'daily', 'weekly', 'monthly']).map((f) => (
            <button
              key={f}
              type="button"
              className={`frequency-segment-btn ${frequency === f ? 'active' : ''}`}
              onClick={() => setFrequency(f)}
            >
              {f === 'one-time' ? 'One Time' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly configuration */}
      {frequency === 'weekly' && (
        <div className="form-group animate-fade-in">
          <label className="form-label">Repeat On</label>
          <div className="weekday-pills">
            {[
              { label: 'M', id: 'monday' },
              { label: 'T', id: 'tuesday' },
              { label: 'W', id: 'wednesday' },
              { label: 'T', id: 'thursday' },
              { label: 'F', id: 'friday' },
              { label: 'S', id: 'saturday' },
              { label: 'S', id: 'sunday' }
            ].map((day) => {
              const isSelected = repeatDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  className={`weekday-pill-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    if (isSelected) {
                      setRepeatDays(prev => prev.filter(d => d !== day.id));
                    } else {
                      setRepeatDays(prev => [...prev, day.id]);
                    }
                  }}
                  title={day.id.charAt(0).toUpperCase() + day.id.slice(1)}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly configuration */}
      {frequency === 'monthly' && (
        <div className="form-group animate-fade-in">
          <label htmlFor="repeat-date" className="form-label">Repeat Every Month On</label>
          <select
            id="repeat-date"
            value={repeatDate}
            onChange={(e) => setRepeatDate(Number(e.target.value))}
            className="form-select"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Custom configuration (Habits) */}
      {frequency === 'custom' && (
        <div className="frequency-segments" style={{ marginTop: '0.25rem', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)' }}>
          <span className="form-label" style={{ margin: 0 }}>Repeat every: </span>
          <input 
            type="number" 
            min="2" max="365" 
            value={customInterval}
            onChange={(e) => setCustomInterval(Number(e.target.value))}
            className="form-input"
            style={{ width: '80px', padding: '0.25rem 0.5rem' }}
          />
          <span className="form-label" style={{ margin: 0 }}>days</span>
        </div>
      )}

      {/* Priority Selector */}
      <div className="form-group">
        <label className="form-label">Priority</label>
        <div className="priority-pills">
          {['low', 'medium', 'high'].map((p) => (
            <button
              key={p}
              type="button"
              className={`priority-pill pill-${p} ${priority === p ? 'active' : ''}`}
              onClick={() => setPriority(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tags input (for tasks) */}
      {!isHabitMode && (
        <div className="form-group">
          <label htmlFor="task-tags" className="form-label">Tags</label>
          <div className="tag-input-wrap">
            <input
              id="task-tags"
              type="text"
              placeholder="Press Enter to add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(e);
                }
              }}
              className="form-input"
            />
            <button 
              type="button" 
              className="add-tag-btn" 
              onClick={handleAddTag}
              aria-label="Add tag"
            >
              <Plus size={16} />
            </button>
          </div>

          {tags.length > 0 && (
            <div className="tags-display-list">
              {tags.map((tag) => (
                <span key={tag} className="tag-item">
                  <Tag size={12} />
                  {tag}
                  <button 
                    type="button" 
                    className="remove-tag-btn" 
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {submitBtnText}
        </button>
      </div>
    </form>
  );
};

export const TaskModal = ({ isOpen, onClose, taskToEdit = null, initialIsHabit = false }) => {
  if (!isOpen) return null;

  const isHabitMode = Boolean(taskToEdit?.isHabit || initialIsHabit);
  const modalTitle = taskToEdit 
    ? (isHabitMode ? "Edit Habit" : "Edit Task") 
    : (isHabitMode ? "Create New Habit" : "Create New Task");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
    >
      <TaskForm 
        key={taskToEdit?.id || (initialIsHabit ? 'new_habit' : 'new_task')}
        taskToEdit={taskToEdit}
        initialIsHabit={initialIsHabit}
        onClose={onClose}
      />
    </Modal>
  );
};
export default TaskModal;


