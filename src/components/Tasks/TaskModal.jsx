import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { Tag, Plus, X, Layers, CalendarRange } from 'lucide-react';
import './TaskModal.css';

export const TaskModal = ({ isOpen, onClose, taskToEdit = null }) => {
  const { addTask, editTask, categories, recurringTasks, getLocalDateString } = useApp();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminderOffset, setReminderOffset] = useState('none');
  
  // Frequency local states
  const [frequency, setFrequency] = useState('one-time');
  const [repeatDays, setRepeatDays] = useState([]);
  const [repeatDate, setRepeatDate] = useState(1);

  // Edit scope selection overlays state
  const [showEditScopeModal, setShowEditScopeModal] = useState(false);

  // Tags local state
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);

  // Load task data if editing
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate || '');
      setDueTime(taskToEdit.dueTime || '');
      setReminderOffset(taskToEdit.reminderOffset || 'none');
      setTags(taskToEdit.tags || []);
      
      // Load recurring properties from parent template if it's generated
      if (taskToEdit.recurringTaskId) {
        const tpl = recurringTasks.find(t => t.id === taskToEdit.recurringTaskId);
        if (tpl) {
          setFrequency(tpl.frequency || 'one-time');
          setRepeatDays(tpl.repeatDays || []);
          setRepeatDate(tpl.repeatDate || 1);
        } else {
          setFrequency('one-time');
          setRepeatDays([]);
          setRepeatDate(1);
        }
      } else {
        setFrequency('one-time');
        setRepeatDays([]);
        setRepeatDate(1);
      }
    } else {
      // Reset form for creation
      setTitle('');
      setDescription('');
      setCategory('personal');
      setPriority('medium');
      setDueDate(getLocalDateString()); // Default due date is today
      setDueTime('');
      setReminderOffset('none');
      setTags([]);
      setFrequency('one-time');
      setRepeatDays([]);
      setRepeatDate(1);
    }
    setTagInput('');
    setShowEditScopeModal(false);
  }, [taskToEdit, isOpen, recurringTasks]);

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

    // Show scope selection overlay if editing a recurring instance
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
      dueDate: frequency === 'one-time' ? dueDate : getLocalDateString(), // Recurring instances get generated with custom dates
      dueTime,
      reminderOffset,
      tags,
      frequency,
      repeatDays,
      repeatDate
    };

    if (taskToEdit) {
      editTask(taskToEdit.id, taskData, editMode);
    } else {
      addTask(taskData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? "Edit Task" : "Create New Task"}
    >
      {showEditScopeModal ? (
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
      ) : (
        <form onSubmit={handleSubmit} className="task-form">
          {/* Task Title */}
          <div className="form-group">
            <label htmlFor="task-title" className="form-label">Title *</label>
            <input
              id="task-title"
              type="text"
              required
              placeholder="e.g. Finish reading Chapter 4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Task Description */}
          <div className="form-group">
            <label htmlFor="task-desc" className="form-label">Description</label>
            <textarea
              id="task-desc"
              placeholder="Describe details of this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              rows={3}
            />
          </div>

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
            {frequency === 'one-time' && (
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

          {/* Task Frequency Selection */}
          <div className="form-group">
            <label className="form-label">Task Frequency</label>
            <div className="frequency-segments">
              {['one-time', 'daily', 'weekly', 'monthly'].map((f) => (
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

          {/* Tags input */}
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

            {/* Tags list */}
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

          {/* Footer Actions */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {taskToEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
export default TaskModal;
