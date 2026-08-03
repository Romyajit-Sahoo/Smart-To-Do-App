import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { Flame, Star, Coffee, Zap, Droplet, Heart, Book, Briefcase, Activity, Calendar, Clock, Smile } from 'lucide-react';
import '../Tasks/TaskModal.css';

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

export const CreateHabitModal = ({ isOpen, onClose, habitToEdit = null }) => {
  const { addRecurringTask, updateRecurringTask, categories } = useApp();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [priority, setPriority] = useState('medium');
  const [dueTime, setDueTime] = useState('');
  const [reminderOffset, setReminderOffset] = useState('none');
  const [icon, setIcon] = useState('Flame');
  const [color, setColor] = useState('#10b981');
  
  const [frequency, setFrequency] = useState('daily');
  const [repeatDays, setRepeatDays] = useState([]);
  const [repeatDate, setRepeatDate] = useState(1);
  const [customInterval, setCustomInterval] = useState(2);

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title);
      setDescription(habitToEdit.description || '');
      setCategory(habitToEdit.category);
      setPriority(habitToEdit.priority);
      setDueTime(habitToEdit.dueTime || '');
      setReminderOffset(habitToEdit.reminderOffset || 'none');
      setIcon(habitToEdit.icon || 'Flame');
      setColor(habitToEdit.color || '#10b981');
      setFrequency(habitToEdit.frequency || 'daily');
      setRepeatDays(habitToEdit.repeatDays || []);
      setRepeatDate(habitToEdit.repeatDate || 1);
      setCustomInterval(habitToEdit.customInterval || 2);
    } else {
      resetForm();
    }
  }, [habitToEdit, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('personal');
    setPriority('medium');
    setDueTime('');
    setReminderOffset('none');
    setIcon('Flame');
    setColor('#10b981');
    setFrequency('daily');
    setRepeatDays([]);
    setRepeatDate(1);
    setCustomInterval(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const habitData = {
      title,
      description,
      category,
      priority,
      frequency,
      repeatDays: frequency === 'weekly' ? repeatDays : [],
      repeatDate: frequency === 'monthly' ? repeatDate : null,
      customInterval: frequency === 'custom' ? customInterval : null,
      dueTime,
      reminderOffset,
      isHabit: true,
      icon,
      color,
    };

    if (habitToEdit) {
      updateRecurringTask(habitToEdit.id, habitData);
    } else {
      addRecurringTask(habitData);
    }

    resetForm();
    onClose();
  };

  const handleDayToggle = (day) => {
    setRepeatDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={habitToEdit ? "Edit Habit" : "Create New Habit"}>
      <form onSubmit={handleSubmit} className="task-form">
        
        {/* Basic Info */}
        <div className="form-group">
          <label className="form-label">Habit Name</label>
          <input 
            type="text" 
            placeholder="e.g., Read 20 Pages, Drink Water..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <textarea 
            placeholder="Why are you building this habit?" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
            rows="2"
          />
        </div>

        {/* Visual Customization */}
        <div className="form-row">
          <div className="form-group flex-1">
            <label className="form-label">Habit Icon</label>
            <div className="icon-selector" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
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
                )
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

        {/* Category & Priority */}
        <div className="form-row">
          <div className="form-group flex-1">
            <label className="form-label">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group flex-1">
            <label className="form-label">Priority</label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="form-select"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Schedule */}
        <div className="form-group" style={{ marginTop: '0.5rem' }}>
          <label className="form-label">Schedule & Frequency</label>
          <div className="frequency-segments">
            <button 
              type="button" 
              className={`frequency-segment-btn ${frequency === 'daily' ? 'active' : ''}`}
              onClick={() => setFrequency('daily')}
            >
              Daily
            </button>
            <button 
              type="button" 
              className={`frequency-segment-btn ${frequency === 'weekly' ? 'active' : ''}`}
              onClick={() => setFrequency('weekly')}
            >
              Weekly
            </button>
            <button 
              type="button" 
              className={`frequency-segment-btn ${frequency === 'monthly' ? 'active' : ''}`}
              onClick={() => setFrequency('monthly')}
            >
              Monthly
            </button>
            <button 
              type="button" 
              className={`frequency-segment-btn ${frequency === 'custom' ? 'active' : ''}`}
              onClick={() => setFrequency('custom')}
            >
              Custom
            </button>
          </div>

          {frequency === 'weekly' && (
            <div className="weekday-pills">
              {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
                <button
                  key={day}
                  type="button"
                  className={`weekday-pill-btn ${repeatDays.includes(day) ? 'active' : ''}`}
                  onClick={() => handleDayToggle(day)}
                >
                  {day.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {frequency === 'monthly' && (
            <div className="frequency-segments" style={{ marginTop: '0.5rem', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)' }}>
              <span className="form-label" style={{ margin: 0 }}>Repeat on day: </span>
              <input 
                type="number" 
                min="1" max="31" 
                value={repeatDate}
                onChange={(e) => setRepeatDate(Number(e.target.value))}
                className="form-input"
                style={{ width: '80px', padding: '0.25rem 0.5rem' }}
              />
            </div>
          )}

          {frequency === 'custom' && (
            <div className="frequency-segments" style={{ marginTop: '0.5rem', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)' }}>
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
        </div>

        {/* Reminders */}
        <div className="form-row" style={{ marginTop: '0.5rem' }}>
          <div className="form-group flex-1">
            <label className="form-label">Reminder Time</label>
            <div style={{ position: 'relative' }}>
              <Clock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="time" 
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          <div className="form-group flex-1">
            <label className="form-label">Remind me</label>
            <select 
              value={reminderOffset}
              onChange={(e) => setReminderOffset(e.target.value)}
              className="form-select"
              disabled={!dueTime}
            >
              <option value="none">At time of event</option>
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
            </select>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            {habitToEdit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
