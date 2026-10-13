import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateTodayStats,
  calculateProductivityScore,
  calculateStreaks,
  calculateQuickStats,
  getMotivationalMessage,
  formatTime,
  formatTimerDisplay,
  formatRelativeTime
} from './productivityUtils';

describe('productivityUtils - calculateTodayStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-13T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns zeroes when no tasks are provided', () => {
    const result = calculateTodayStats([]);
    expect(result).toEqual({
      total: 0,
      completed: 0,
      pending: 0,
      missed: 0,
      overdue: 0,
      rate: 0
    });
  });

  it('correctly aggregates today completed, pending, and missed tasks', () => {
    const todayStr = '2026-10-13';
    const tasks = [
      { id: '1', dueDate: todayStr, completed: true },
      { id: '2', dueDate: todayStr, completed: false, missed: false },
      { id: '3', dueDate: todayStr, completed: false, missed: true },
      { id: '4', dueDate: '2026-10-14', completed: false }
    ];

    const result = calculateTodayStats(tasks);

    expect(result.total).toBe(3);
    expect(result.completed).toBe(1);
    expect(result.pending).toBe(1);
    expect(result.missed).toBe(1);
    expect(result.rate).toBe(33);
  });

  it('accurately counts overdue tasks from past dates', () => {
    const todayStr = '2026-10-13';
    const tasks = [
      { id: '1', dueDate: todayStr, completed: false },
      { id: '2', dueDate: '2026-10-10', completed: false },
      { id: '3', dueDate: '2026-10-09', completed: true },
      { id: '4', dueDate: '2026-10-15', completed: false }
    ];

    const result = calculateTodayStats(tasks);
    expect(result.overdue).toBe(1);
  });
});

describe('productivityUtils - calculateProductivityScore', () => {
  it('handles empty task list gracefully with 0 score and Needs Improvement', () => {
    const result = calculateProductivityScore([]);
    expect(result).toEqual({
      total: 0,
      completed: 0,
      score: 0,
      level: 'Needs Improvement'
    });
  });

  it('categorizes score tiers accurately', () => {
    const excellentTasks = Array.from({ length: 20 }, (_, i) => ({ completed: i < 19 }));
    expect(calculateProductivityScore(excellentTasks).level).toBe('Excellent');
    expect(calculateProductivityScore(excellentTasks).score).toBe(95);

    const goodTasks = Array.from({ length: 4 }, (_, i) => ({ completed: i < 3 }));
    expect(calculateProductivityScore(goodTasks).level).toBe('Good');
    expect(calculateProductivityScore(goodTasks).score).toBe(75);

    const avgTasks = [{ completed: true }, { completed: false }];
    expect(calculateProductivityScore(avgTasks).level).toBe('Average');
    expect(calculateProductivityScore(avgTasks).score).toBe(50);

    const lowTasks = Array.from({ length: 5 }, (_, i) => ({ completed: i < 1 }));
    expect(calculateProductivityScore(lowTasks).level).toBe('Needs Improvement');
    expect(calculateProductivityScore(lowTasks).score).toBe(20);
  });
});

describe('productivityUtils - calculateStreaks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-13T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 streaks for empty tasks', () => {
    const result = calculateStreaks([]);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('calculates consecutive completed days correctly', () => {
    const tasks = [
      { id: '1', dueDate: '2026-10-11', completed: true },
      { id: '2', dueDate: '2026-10-12', completed: true },
      { id: '3', dueDate: '2026-10-13', completed: true }
    ];

    const result = calculateStreaks(tasks);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('breaks streak on failed day in history', () => {
    const tasks = [
      { id: '1', dueDate: '2026-10-10', completed: true },
      { id: '2', dueDate: '2026-10-11', completed: false, missed: true },
      { id: '3', dueDate: '2026-10-12', completed: true },
      { id: '4', dueDate: '2026-10-13', completed: true }
    ];

    const result = calculateStreaks(tasks);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });
});

describe('productivityUtils - calculateQuickStats', () => {
  it('correctly calculates counts across recurring, one-time, and priority tasks', () => {
    const tasks = [
      { id: '1', category: 'work', priority: 'high', completed: false, missed: false, recurringTaskId: 'rec-1', dueDate: '2026-10-13' },
      { id: '2', category: 'work', priority: 'medium', completed: true, missed: false, recurringTaskId: null, dueDate: '2026-10-13' },
      { id: '3', category: 'personal', priority: 'low', completed: false, missed: true, recurringTaskId: null, dueDate: '2026-10-12' }
    ];
    const categories = [{ id: 'work', name: 'Work' }, { id: 'personal', name: 'Personal' }];

    const stats = calculateQuickStats(tasks, categories);

    expect(stats.totalCompleted).toBe(1);
    expect(stats.totalMissed).toBe(1);
    expect(stats.totalPending).toBe(1);
    expect(stats.recurringCount).toBe(1);
    expect(stats.oneTimeCount).toBe(2);
    expect(stats.highPriorityCount).toBe(1);
    expect(stats.mostUsedCategory).toBe('Work');
  });
});

describe('productivityUtils - formatTime (duration summary)', () => {
  it('formats minutes into "Ym"', () => {
    expect(formatTime(0)).toBe('0m');
    expect(formatTime(65)).toBe('1m');
    expect(formatTime(300)).toBe('5m');
  });

  it('formats hours and minutes into "Xh Ym"', () => {
    expect(formatTime(3600)).toBe('1h 0m');
    expect(formatTime(3665)).toBe('1h 1m');
    expect(formatTime(7200)).toBe('2h 0m');
  });

  it('handles negative or invalid seconds safely', () => {
    expect(formatTime(-10)).toBe('0m');
    expect(formatTime(null)).toBe('0m');
    expect(formatTime(undefined)).toBe('0m');
  });
});

describe('productivityUtils - formatTimerDisplay (stopwatch/countdown)', () => {
  it('formats seconds into MM:SS format when under 1 hour', () => {
    expect(formatTimerDisplay(0)).toBe('00:00');
    expect(formatTimerDisplay(65)).toBe('01:05');
    expect(formatTimerDisplay(599)).toBe('09:59');
  });

  it('formats seconds into HH:MM:SS format when 1 hour or more', () => {
    expect(formatTimerDisplay(3600)).toBe('01:00:00');
    expect(formatTimerDisplay(3665)).toBe('01:01:05');
  });

  it('handles null, undefined or negative numbers cleanly', () => {
    expect(formatTimerDisplay(-15)).toBe('00:00');
    expect(formatTimerDisplay(null)).toBe('00:00');
    expect(formatTimerDisplay(undefined)).toBe('00:00');
  });
});

describe('productivityUtils - formatRelativeTime', () => {
  const fixedNow = new Date('2026-10-13T12:00:00Z').getTime();

  it('returns "just now" for events within the minute', () => {
    const recent = new Date(fixedNow - 30 * 1000).toISOString();
    expect(formatRelativeTime(recent, fixedNow)).toBe('just now');
  });

  it('returns "Xm ago" for minutes past', () => {
    const pastMinutes = new Date(fixedNow - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(pastMinutes, fixedNow)).toBe('5m ago');
  });

  it('returns "Xh ago" for hours past', () => {
    const pastHours = new Date(fixedNow - 3 * 3600 * 1000).toISOString();
    expect(formatRelativeTime(pastHours, fixedNow)).toBe('3h ago');
  });

  it('returns "Yesterday" for 1 day past', () => {
    const yesterday = new Date(fixedNow - 24 * 3600 * 1000).toISOString();
    expect(formatRelativeTime(yesterday, fixedNow)).toBe('Yesterday');
  });

  it('returns "X days ago" for 2 to 6 days past', () => {
    const pastDays = new Date(fixedNow - 2 * 86400 * 1000).toISOString();
    expect(formatRelativeTime(pastDays, fixedNow)).toBe('2 days ago');
  });

  it('handles invalid timestamp gracefully by returning empty string', () => {
    expect(formatRelativeTime(null, fixedNow)).toBe('');
    expect(formatRelativeTime(undefined, fixedNow)).toBe('');
    expect(formatRelativeTime('invalid-date', fixedNow)).toBe('');
  });
});

describe('productivityUtils - getMotivationalMessage', () => {
  it('returns prompt to start day when total is 0', () => {
    const msg = getMotivationalMessage({ total: 0, completed: 0, missed: 0, rate: 0 });
    expect(msg).toContain('kickstart');
  });

  it('returns high praise when 100% completed', () => {
    const msg = getMotivationalMessage({ total: 5, completed: 5, missed: 0, rate: 100 });
    expect(msg).toContain('fire');
  });

  it('acknowledges missed tasks appropriately', () => {
    const msg = getMotivationalMessage({ total: 5, completed: 2, missed: 1, rate: 40 });
    expect(msg).toContain('missed 1 task');
  });
});
