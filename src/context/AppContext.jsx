import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_CATEGORIES, TABS, PRIORITIES } from '../constants/constants';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // 1. Theme State
  const [theme, setTheme] = useLocalStorage('theme', 'dark');

  // 2. Active View Tab State
  const [activeTab, setActiveTab] = useLocalStorage('activeTab', TABS.TASKS);

  // 3. Categories State (Supports custom categories)
  const [categories, setCategories] = useLocalStorage('categories', DEFAULT_CATEGORIES);

  // 4. Tasks (Daily/Generated and Standalone Instances) State
  const [tasks, setTasks] = useLocalStorage('tasks', []);

  // 4.b Recurring Task Templates State
  const [recurringTasks, setRecurringTasks] = useLocalStorage('recurringTasks', []);

  // 4.c Tracking Rollover Date
  const [lastCheckedDate, setLastCheckedDate] = useLocalStorage('lastCheckedDate', '');

  // 4.d Recent Activity Log (Feature 9)
  const [activities, setActivities] = useLocalStorage('activities', []);

  // 5. Habits Configuration State (Feature 7)
  const [habits, setHabits] = useLocalStorage('habits', [
    { id: 'h1', name: 'Wake up at 5 AM', icon: 'Sun', color: '#f59e0b' },
    { id: 'h2', name: 'LeetCode Practice', icon: 'Code', color: '#10b981' },
    { id: 'h3', name: 'Workout', icon: 'Dumbbell', color: '#ef4444' },
    { id: 'h4', name: 'Read Book', icon: 'Book', color: '#ec4899' },
    { id: 'h5', name: 'Meditation', icon: 'Compass', color: '#8b5cf6' },
    { id: 'h6', name: 'Drink 3L Water', icon: 'Droplet', color: '#3b82f6' }
  ]);

  // 6. Daily Records for Habits state (Stores completions per date: { "2026-08-01": { h1: true, h2: false } })
  const [dailyRecords, setDailyRecords] = useLocalStorage('dailyRecords', {});

  // 6.b Daily Notes and Reflection Journal (Feature 12)
  const [dailyHistoryNotes, setDailyHistoryNotes] = useLocalStorage('dailyHistoryNotes', {});

  // 6.c Notifications & Reminders State (Feature 13)
  const [notifications, setNotifications] = useLocalStorage('notifications', []);
  const [notificationSettings, setNotificationSettings] = useLocalStorage('notificationSettings', {
    browserEnabled: false,
    inAppEnabled: true,
    dailySummaryEnabled: true,
    missedAlertsEnabled: true,
    soundsEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  });
  const [firedReminders, setFiredReminders] = useLocalStorage('firedReminders', []);
  const [snoozedReminders, setSnoozedReminders] = useLocalStorage('snoozedReminders', {});

  // 6.d Deep Focus State
  const [focusSessions, setFocusSessions] = useLocalStorage('focusSessions', []);
  const [runningFocusSession, setRunningFocusSession] = useLocalStorage('runningFocusSession', null);
  const [focusDistractions, setFocusDistractions] = useLocalStorage('focusDistractions', {
    pauseCount: 0,
    stopCount: 0,
    browserHiddenCount: 0,
    windowLostFocusCount: 0,
    idleTime: 0
  });

  // 7. General Navigation & Search Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'All', // 'All', 'Pending', 'Completed', 'Missed', 'Overdue'
    category: 'All', // 'All' or specific category id
    priority: 'All', // 'All' or specific priority id ('low', 'medium', 'high')
    timeRange: 'All', // 'All', 'Today', 'Tomorrow', 'Week', 'Month'
  });
  const [sortBy, setSortBy] = useState('Newest');

  // Local Date Helper (YYYY-MM-DD) based on local timezone
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to log recent activities (Feature 9)
  const logActivity = (type, taskTitle) => {
    const newActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type, // 'created' | 'completed' | 'uncompleted' | 'missed' | 'deleted'
      taskTitle: taskTitle.trim(),
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50));
  };

  // Engine to generate recurring task instances for a range of dates (inclusive)
  const generateTasksForDateRange = (startStr, endStr) => {
    if (!startStr || !endStr) return;
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    const todayStr = getLocalDateString();

    const datesToProcess = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      datesToProcess.push(getLocalDateString(d));
    }

    setTasks(prevTasks => {
      let updated = false;
      const nextTasks = [...prevTasks];

      datesToProcess.forEach(dateStr => {
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dateObj.getDay()];
        const dayOfMonth = dateObj.getDate();

        // 1. Mark existing pending overdue tasks for this date as missed (if dateStr is in the past)
        if (dateStr < todayStr) {
          nextTasks.forEach((task, idx) => {
            if (task.dueDate === dateStr && !task.completed && !task.missed) {
              nextTasks[idx] = {
                ...task,
                missed: true,
                updatedDate: new Date().toISOString()
              };
              updated = true;
            }
          });
        }

        // 2. Evaluate and generate recurring templates for this date
        recurringTasks.forEach(tpl => {
          if (!tpl.isActive) return;
          if (tpl.startDate && tpl.startDate > dateStr) return;
          if (tpl.endDate && tpl.endDate < dateStr) return;

          let matches = false;
          if (tpl.frequency === 'daily') {
            matches = true;
          } else if (tpl.frequency === 'weekly') {
            matches = tpl.repeatDays && tpl.repeatDays.includes(dayOfWeek);
          } else if (tpl.frequency === 'monthly') {
            matches = Number(tpl.repeatDate) === dayOfMonth;
          } else if (tpl.frequency === 'custom' && tpl.customInterval) {
            const startObj = new Date(tpl.startDate + 'T00:00:00');
            const diffDays = Math.floor(Math.abs(dateObj - startObj) / (1000 * 60 * 60 * 24));
            matches = diffDays % tpl.customInterval === 0;
          }

          if (matches) {
            // Check if instance already exists
            const exists = nextTasks.some(t => t.recurringTaskId === tpl.id && (t.generatedDate === dateStr || t.dueDate === dateStr));
            if (!exists) {
              const isPast = dateStr < todayStr;
              nextTasks.push({
                id: `task_inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                recurringTaskId: tpl.id,
                generatedDate: dateStr,
                title: tpl.title,
                description: tpl.description || '',
                category: tpl.category || 'personal',
                priority: tpl.priority || 'medium',
                dueDate: dateStr,
                dueTime: tpl.dueTime || '',
                reminderOffset: tpl.reminderOffset || 'none',
                isHabit: tpl.isHabit || false,
                icon: tpl.icon || null,
                color: tpl.color || null,
                createdDate: new Date().toISOString(),
                updatedDate: new Date().toISOString(),
                completed: false,
                completionTime: null,
                missed: isPast, // Auto-mark missed if date is in the past
                tags: tpl.tags || [],
              });
              updated = true;
            }
          }
        });
      });

      return updated ? nextTasks : prevTasks;
    });
  };

  // Apply Theme attribute on mount & change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-Check and Mark Missed / Auto-Generate tasks on day change
  useEffect(() => {
    const todayStr = getLocalDateString();
    
    // Log missed activities BEFORE running generation to avoid duplicate events
    if (lastCheckedDate && lastCheckedDate < todayStr) {
      const missedTasks = tasks.filter(t => !t.completed && !t.missed && t.dueDate && t.dueDate < todayStr);
      missedTasks.forEach(t => {
        logActivity('missed', t.title);
      });

      // Raise missed alerts notification (Feature 13)
      if (missedTasks.length > 0 && notificationSettings.missedAlertsEnabled) {
        triggerNotification(
          "Yesterday's Recap",
          `You missed ${missedTasks.length} task${missedTasks.length > 1 ? 's' : ''} yesterday. Let's start fresh today!`,
          'missed'
        );
      }
    }

    if (!lastCheckedDate) {
      // First time init
      setLastCheckedDate(todayStr);
      generateTasksForDateRange(todayStr, todayStr);
    } else if (lastCheckedDate < todayStr) {
      // User opens app on a new day (or later), run rollover evaluations
      generateTasksForDateRange(lastCheckedDate, todayStr);
      setLastCheckedDate(todayStr);

      // Trigger morning summary briefing after generation completes
      setTimeout(() => {
        const todayTasks = tasks.filter(t => t.dueDate === todayStr);
        if (notificationSettings.dailySummaryEnabled && todayTasks.length > 0) {
          triggerNotification(
            "Today's Overview",
            `Good Morning! You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} scheduled for today.`,
            'system'
          );
        }
      }, 500);
    } else {
      // Normal refresh, confirm today's tasks are generated
      generateTasksForDateRange(todayStr, todayStr);
    }
  }, [recurringTasks]);

  // Synthetic Sound Beep using AudioContext (Feature 13)
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.log("AudioContext blocked or not supported:", e);
    }
  };

  // Check Quiet Hours before raising notifications
  const isQuietHoursActive = () => {
    const { quietHoursStart, quietHoursEnd } = notificationSettings;
    if (!quietHoursStart || !quietHoursEnd) return false;
    
    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentTotal = currentH * 60 + currentM;

    const [startH, startM] = quietHoursStart.split(':').map(Number);
    const [endH, endM] = quietHoursEnd.split(':').map(Number);
    
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal <= endTotal) {
      return currentTotal >= startTotal && currentTotal <= endTotal;
    } else {
      // Quiet hours cross midnight (e.g. 22:00 to 07:00)
      return currentTotal >= startTotal || currentTotal <= endTotal;
    }
  };

  // Request browser permission for native push notifications
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationSettings(prev => ({
          ...prev,
          browserEnabled: permission === 'granted'
        }));
      });
    }
  };

  // Unified Notification Trigger Action
  const triggerNotification = (title, body, type = 'system', taskInfo = null) => {
    if (isQuietHoursActive()) {
      console.log("Notification suppressed due to Quiet Hours:", title);
      return;
    }

    const now = new Date();

    if (notificationSettings.inAppEnabled) {
      const newNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        body,
        type, // 'reminder' | 'completed' | 'missed' | 'generation' | 'system'
        unread: true,
        timestamp: now.toISOString(),
        taskInfo
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    if (notificationSettings.browserEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
        if (notificationSettings.soundsEnabled) {
          playNotificationSound();
        }
      } catch (err) {
        console.error("Browser notification failed:", err);
      }
    }
  };

  const markNotificationRead = (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, unread: false } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const deleteNotification = (notifId) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const snoozeTaskReminder = (taskId, minutes = 5) => {
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setSnoozedReminders(prev => ({
      ...prev,
      [taskId]: snoozeTime
    }));
    
    // Also remove the task from firedReminders list so it can fire again
    setFiredReminders(prev => prev.filter(id => id !== taskId && id !== `overdue_${taskId}`));
    
    triggerNotification("Reminder Snoozed", `Notification snoozed for ${minutes} minutes.`, 'system');
  };

  // Background check loop for task reminders & overdue alerts
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayStr = getLocalDateString(now);

      // Check tasks due today that are NOT completed and NOT missed
      const todayTasks = tasks.filter(t => t.dueDate === todayStr && !t.completed && !t.missed);

      todayTasks.forEach(task => {
        if (!task.dueTime || !task.reminderOffset || task.reminderOffset === 'none') return;

        const [dueHour, dueMin] = task.dueTime.split(':').map(Number);
        const taskDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), dueHour, dueMin, 0);

        const offsetMins = Number(task.reminderOffset);
        const triggerTime = new Date(taskDateTime.getTime() - offsetMins * 60 * 1000);

        // Check if snooze is active for this task
        const snoozeTimestamp = snoozedReminders[task.id];
        if (snoozeTimestamp) {
          const snoozeDate = new Date(snoozeTimestamp);
          if (now >= snoozeDate) {
            triggerNotification(
              `Reminder (Snoozed): ${task.title}`,
              `Task is due at ${task.dueTime} (${task.priority} priority)`,
              'reminder',
              { id: task.id, title: task.title, category: task.category, priority: task.priority, dueTime: task.dueTime }
            );
            // Clear snooze time
            setSnoozedReminders(prev => {
              const copy = { ...prev };
              delete copy[task.id];
              return copy;
            });
          }
          return;
        }

        // Standard reminder trigger
        if (now >= triggerTime && !firedReminders.includes(task.id)) {
          triggerNotification(
            `Upcoming Task: ${task.title}`,
            `Due in ${offsetMins > 0 ? `${offsetMins} minutes` : 'now'} (at ${task.dueTime})`,
            'reminder',
            { id: task.id, title: task.title, category: task.category, priority: task.priority, dueTime: task.dueTime }
          );
          setFiredReminders(prev => [...prev, task.id]);
        }
      });

      // Check overdue alerts
      tasks.forEach(task => {
        if (task.completed || task.missed) return;
        if (!task.dueDate) return;

        let isOverdue = false;
        if (task.dueDate < todayStr) {
          isOverdue = true;
        } else if (task.dueDate === todayStr && task.dueTime) {
          const [dueHour, dueMin] = task.dueTime.split(':').map(Number);
          const taskDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), dueHour, dueMin, 0);
          if (now > taskDateTime) {
            isOverdue = true;
          }
        }

        const alertKey = `overdue_${task.id}`;
        if (isOverdue && !firedReminders.includes(alertKey)) {
          triggerNotification(
            `Overdue Alert: ${task.title}`,
            `This task was due at ${task.dueTime || 'today'} and is incomplete!`,
            'system',
            { id: task.id, title: task.title, category: task.category, priority: task.priority }
          );
          setFiredReminders(prev => [...prev, alertKey]);
        }
      });
    };

    const intervalId = setInterval(checkReminders, 15000);
    checkReminders(); // check immediately on mount

    return () => clearInterval(intervalId);
  }, [tasks, firedReminders, snoozedReminders, notificationSettings]);

  // Theme Toggler
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Helper: Adds a recurring task template
  const addRecurringTask = (taskData) => {
    const todayStr = getLocalDateString();
    const newTemplate = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || '',
      category: taskData.category || 'personal',
      priority: taskData.priority || 'medium',
      frequency: taskData.frequency,
      repeatDays: taskData.repeatDays || [],
      repeatDate: taskData.repeatDate || null,
      customInterval: taskData.customInterval || null,
      isHabit: taskData.isHabit || false,
      icon: taskData.icon || null,
      color: taskData.color || null,
      dueTime: taskData.dueTime || '',
      reminderOffset: taskData.reminderOffset || 'none',
      createdAt: new Date().toISOString(),
      startDate: todayStr,
      endDate: null,
      isActive: true,
      isRecurring: true,
      tags: taskData.tags || [],
    };
    setRecurringTasks(prev => [...prev, newTemplate]);
  };

  const updateRecurringTask = (tplId, updatedData) => {
    const todayStr = getLocalDateString();
    
    // Update template config
    setRecurringTasks(prev =>
      prev.map(tpl =>
        tpl.id === tplId
          ? {
              ...tpl,
              title: updatedData.title?.trim() || tpl.title,
              description: updatedData.description?.trim() || tpl.description,
              category: updatedData.category || tpl.category,
              priority: updatedData.priority || tpl.priority,
              frequency: updatedData.frequency || tpl.frequency,
              repeatDays: updatedData.repeatDays || tpl.repeatDays,
              repeatDate: updatedData.repeatDate || tpl.repeatDate,
              customInterval: updatedData.customInterval || tpl.customInterval,
              icon: updatedData.icon || tpl.icon,
              color: updatedData.color || tpl.color,
              dueTime: updatedData.dueTime || tpl.dueTime,
              reminderOffset: updatedData.reminderOffset || tpl.reminderOffset,
              isActive: updatedData.isActive !== undefined ? updatedData.isActive : tpl.isActive,
              tags: updatedData.tags || tpl.tags,
            }
          : tpl
      )
    );

    // Update all generated future pending instances
    setTasks(prev =>
      prev.map(t =>
        t.recurringTaskId === tplId && t.dueDate >= todayStr && !t.completed
          ? {
              ...t,
              title: updatedData.title?.trim() || t.title,
              description: updatedData.description?.trim() || t.description,
              category: updatedData.category || t.category,
              priority: updatedData.priority || t.priority,
              icon: updatedData.icon || t.icon,
              color: updatedData.color || t.color,
              dueTime: updatedData.dueTime || t.dueTime,
              reminderOffset: updatedData.reminderOffset || t.reminderOffset,
              tags: updatedData.tags || t.tags,
              updatedDate: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const deleteRecurringTask = (tplId) => {
    // Delete template
    setRecurringTasks(prev => prev.filter(tpl => tpl.id !== tplId));
    // Delete all generated tasks from this template
    setTasks(prev => prev.filter(t => t.recurringTaskId !== tplId));
  };

  // Task Operations
  const addTask = (taskData) => {
    const todayStr = getLocalDateString();
    logActivity('created', taskData.title.trim());

    if (!taskData.frequency || taskData.frequency === 'one-time') {
      const newTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recurringTaskId: null,
        title: taskData.title.trim(),
        description: taskData.description?.trim() || '',
        category: taskData.category || 'personal',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || todayStr,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        completed: false,
        completionTime: null,
        missed: false,
        tags: taskData.tags || [],
      };
      setTasks(prev => [newTask, ...prev]);
    } else {
      addRecurringTask(taskData);
    }
  };

  const editTask = (taskId, updatedData, editMode = null) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const todayStr = getLocalDateString();
    
    // BUSINESS LOGIC FIX: Lock all historical tasks
    if (task.dueDate && task.dueDate < todayStr) {
      return;
    }

    // Case 1: Standalone task, or user requests changes to only this occurrence
    if (!task.recurringTaskId || editMode === 'single') {
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                ...updatedData,
                title: updatedData.title?.trim() || t.title,
                description: updatedData.description?.trim() || t.description,
                recurringTaskId: editMode === 'single' ? null : t.recurringTaskId, // Detach from template
                updatedDate: new Date().toISOString(),
              }
            : t
        )
      );
    } 
    // Case 2: User requests changes to apply to all future occurrences
    else if (editMode === 'future') {
      // Update template config
      setRecurringTasks(prev =>
        prev.map(tpl =>
          tpl.id === task.recurringTaskId
            ? {
                ...tpl,
                title: updatedData.title?.trim() || tpl.title,
                description: updatedData.description?.trim() || tpl.description,
                category: updatedData.category || tpl.category,
                priority: updatedData.priority || tpl.priority,
                frequency: updatedData.frequency || tpl.frequency,
                repeatDays: updatedData.repeatDays || tpl.repeatDays,
                repeatDate: updatedData.repeatDate || tpl.repeatDate,
                tags: updatedData.tags || tpl.tags,
              }
            : tpl
        )
      );

      // Update all generated future pending instances
      setTasks(prev =>
        prev.map(t =>
          t.recurringTaskId === task.recurringTaskId && t.dueDate >= todayStr && !t.completed
            ? {
                ...t,
                title: updatedData.title?.trim() || t.title,
                description: updatedData.description?.trim() || t.description,
                category: updatedData.category || t.category,
                priority: updatedData.priority || t.priority,
                tags: updatedData.tags || t.tags,
                updatedDate: new Date().toISOString(),
              }
            : t
        )
      );
    }
  };

  const deleteTask = (taskId, deleteMode = null) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    logActivity('deleted', task.title);
    const todayStr = getLocalDateString();

    // Standalone task, or only this occurrence
    if (!task.recurringTaskId || !deleteMode || deleteMode === 'single') {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } 
    // Delete this and future pending occurrences
    else if (deleteMode === 'future') {
      // Mark template inactive so no future instances generate
      setRecurringTasks(prev =>
        prev.map(tpl =>
          tpl.id === task.recurringTaskId
            ? { ...tpl, isActive: false, endDate: todayStr }
            : tpl
        )
      );
      // Remove this instance and all future pending instances of this template
      setTasks(prev =>
        prev.filter(t =>
          !(t.recurringTaskId === task.recurringTaskId && t.dueDate >= todayStr && !t.completed)
        )
      );
    } 
    // Delete entire template chain (including past instances)
    else if (deleteMode === 'all') {
      // Delete template
      setRecurringTasks(prev => prev.filter(tpl => tpl.id !== task.recurringTaskId));
      // Delete all generated tasks from this template
      setTasks(prev => prev.filter(t => t.recurringTaskId !== task.recurringTaskId));
    }
  };

  const toggleTaskCompletion = (taskId) => {
    const todayStr = getLocalDateString();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // BUSINESS LOGIC FIX: Lock all historical tasks
      if (task.dueDate && task.dueDate < todayStr) {
        return;
      }
      
      logActivity(task.completed ? 'uncompleted' : 'completed', task.title);
    }

    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const isNowCompleted = !t.completed;
          return {
            ...t,
            completed: isNowCompleted,
            completionTime: isNowCompleted ? new Date().toISOString() : null,
            // If completing an overdue/missed task, clear its missed flag. Otherwise reset it properly
            missed: isNowCompleted ? false : (t.dueDate && t.dueDate < todayStr),
            updatedDate: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  const duplicateTask = (taskId) => {
    const taskToCopy = tasks.find(t => t.id === taskId);
    if (!taskToCopy) return;

    const copiedTask = {
      ...taskToCopy,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recurringTaskId: null, // Duplicates are standalone copies
      title: `${taskToCopy.title} (Copy)`,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      completed: false,
      completionTime: null,
      missed: false,
    };

    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === taskId);
      const nextTasks = [...prev];
      nextTasks.splice(idx + 1, 0, copiedTask);
      return nextTasks;
    });
  };

  // Category Operations
  const addCategory = (name, icon, color) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const id = cleanName.toLowerCase().replace(/\s+/g, '-');
    
    if (categories.some(c => c.id === id)) return;

    const newCategory = { id, name: cleanName, icon, color };
    setCategories(prev => [...prev, newCategory]);
  };

  // Habit Record Toggler (Updates recurring progress per day)
  const toggleHabitRecord = (dateStr, habitId) => {
    setDailyRecords(prev => {
      const dayData = prev[dateStr] || {};
      const updatedDayData = {
        ...dayData,
        [habitId]: !dayData[habitId],
      };
      return {
        ...prev,
        [dateStr]: updatedDayData,
      };
    });
  };

  // Save Daily reflection notes/mood ratings (Feature 12)
  const saveDailyHistoryNotes = (dateStr, noteData) => {
    setDailyHistoryNotes(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        ...noteData
      }
    }));
  };

  // Save Focus Session (Feature 8 / Phase 2)
  const saveFocusSession = (sessionData) => {
    setFocusSessions(prev => [sessionData, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        categories,
        addCategory,
        tasks,
        recurringTasks,
        activities,
        logActivity,
        addTask,
        editTask,
        deleteTask,
        addRecurringTask,
        updateRecurringTask,
        deleteRecurringTask,
        toggleTaskCompletion,
        duplicateTask,
        habits,
        setHabits,
        dailyRecords,
        toggleHabitRecord,
        dailyHistoryNotes,
        saveDailyHistoryNotes,
        notifications,
        notificationSettings,
        setNotificationSettings,
        requestNotificationPermission,
        triggerNotification,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,
        snoozeTaskReminder,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        sortBy,
        setSortBy,
        getLocalDateString,
        focusSessions,
        setFocusSessions,
        saveFocusSession,
        runningFocusSession,
        setRunningFocusSession,
        focusDistractions,
        setFocusDistractions
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
