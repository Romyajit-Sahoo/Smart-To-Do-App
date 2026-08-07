// Static constants and settings config

export const DEFAULT_CATEGORIES = [
  { id: 'work', name: 'Work', icon: 'Briefcase', color: '#6366f1' },       // Indigo
  { id: 'coding', name: 'Coding', icon: 'Code', color: '#10b981' },        // Emerald
  { id: 'study', name: 'Study', icon: 'BookOpen', color: '#3b82f6' },      // Blue
  { id: 'fitness', name: 'Fitness', icon: 'Dumbbell', color: '#f59e0b' },  // Amber
  { id: 'health', name: 'Health', icon: 'Heart', color: '#ef4444' },        // Red
  { id: 'reading', name: 'Reading', icon: 'Book', color: '#ec4899' },       // Pink
  { id: 'personal', name: 'Personal', icon: 'User', color: '#8b5cf6' },    // Purple
];

export const PRIORITIES = {
  low: { id: 'low', name: 'Low', color: 'success', value: 1 },
  medium: { id: 'medium', name: 'Medium', color: 'warning', value: 2 },
  high: { id: 'high', name: 'High', color: 'danger', value: 3 }
};

export const TABS = {
  DASHBOARD: 'Dashboard',
  TASKS: 'Tasks',
  HABITS: 'Habits',
  DEEP_FOCUS: 'Deep Focus',
  FOCUS_SESSION: 'Focus Session',
  ANALYTICS: 'Analytics',
  CALENDAR: 'Calendar',
  GAMIFICATION: 'Gamification'
};

export const SORT_OPTIONS = {
  NEWEST: 'Newest',
  OLDEST: 'Oldest',
  PRIORITY: 'Priority',
  DUE_DATE: 'Due Date',
  ALPHABETICAL: 'Alphabetical',
  STATUS: 'Status (Completed First)'
};

export const FILTER_OPTIONS = {
  ALL: 'All',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  MISSED: 'Missed',
  OVERDUE: 'Overdue',
  TODAY: 'Today',
  TOMORROW: 'Tomorrow',
  WEEK: 'This Week',
  MONTH: 'This Month'
};
