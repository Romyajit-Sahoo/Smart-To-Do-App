/**
 * Utility functions for productivity score calculations, streaks, and timelines.
 */

// Helper to get local date string YYYY-MM-DD
const getLocalDateStr = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates statistics for today's tasks.
 * @param {Array} tasks List of all tasks
 * @returns {Object} { total, completed, pending, missed, overdue, rate }
 */
export const calculateTodayStats = (tasks) => {
  const todayStr = getLocalDateStr();
  const todayTasks = tasks.filter(t => t.dueDate === todayStr);

  const total = todayTasks.length;
  const completed = todayTasks.filter(t => t.completed).length;
  const pending = todayTasks.filter(t => !t.completed && !t.missed).length;
  const missed = todayTasks.filter(t => t.missed).length;

  // Overdue: tasks in history that are past due date and incomplete
  const overdue = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length;

  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending,
    missed,
    overdue,
    rate
  };
};

/**
 * Calculates overall productivity score and performance ranking.
 * @param {Array} tasks List of all tasks
 * @returns {Object} { total, completed, score, level }
 */
export const calculateProductivityScore = (tasks) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  let level = 'Needs Improvement';
  if (score >= 90) level = 'Excellent';
  else if (score >= 70) level = 'Good';
  else if (score >= 40) level = 'Average';

  return {
    total,
    completed,
    score,
    level
  };
};

/**
 * Evaluates streak histories (consecutive productive days).
 * A day is productive if tasks exist on it and completion rate is 100%.
 * Days with 0 tasks do not break a streak (they are skipped/preserved).
 * @param {Array} tasks List of all tasks
 * @returns {Object} { currentStreak, longestStreak }
 */
export const calculateStreaks = (tasks) => {
  if (tasks.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const todayStr = getLocalDateStr();

  // Find the earliest date in history
  const dueDates = tasks
    .map(t => t.dueDate)
    .filter(Boolean)
    .sort();

  if (dueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const earliestDateStr = dueDates[0];
  const start = new Date(earliestDateStr + 'T00:00:00');
  const end = new Date(todayStr + 'T00:00:00');

  // Generate list of all date strings from earliest to today
  const allDates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    allDates.push(getLocalDateStr(d));
  }

  // Determine status for each day: 'success' (100% complete), 'failed' (<100% complete), or 'empty' (0 tasks)
  const dayStatuses = {};
  allDates.forEach(dateStr => {
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    if (dayTasks.length === 0) {
      dayStatuses[dateStr] = 'empty';
    } else {
      const completedAll = dayTasks.every(t => t.completed);
      // For today, if some are incomplete, it's only a failure if a task is marked missed
      if (dateStr === todayStr) {
        const hasMissed = dayTasks.some(t => t.missed);
        dayStatuses[dateStr] = completedAll ? 'success' : hasMissed ? 'failed' : 'pending';
      } else {
        dayStatuses[dateStr] = completedAll ? 'success' : 'failed';
      }
    }
  });

  // Calculate current streak
  let currentStreak = 0;

  // We trace backwards from today
  const reversedDates = [...allDates].reverse();
  
  for (let i = 0; i < reversedDates.length; i++) {
    const dateStr = reversedDates[i];
    const status = dayStatuses[dateStr];

    if (status === 'success') {
      currentStreak++;
    } else if (status === 'empty' || status === 'pending') {
      // Empty or pending today does not break the streak, continue tracing
      continue;
    } else if (status === 'failed') {
      // Hit a failed day, current streak stops here
      break;
    }
  }

  // Calculate longest streak in history
  // For longest streak, we trace forward and treat 'empty' as preserving the streak,
  // counting runs of consecutive success days (with empty skipped).
  let longestStreak = 0;
  let activeStreak = 0;

  allDates.forEach(dateStr => {
    const status = dayStatuses[dateStr];
    if (status === 'success') {
      activeStreak++;
      if (activeStreak > longestStreak) {
        longestStreak = activeStreak;
      }
    } else if (status === 'failed') {
      activeStreak = 0; // Reset streak on failed day
    }
    // 'empty' and 'pending' preserve the run without resetting it or incrementing
  });

  return {
    currentStreak,
    longestStreak
  };
};

/**
 * Calculates quick statistics for additional dashboard metadata.
 * @param {Array} tasks List of all tasks
 * @param {Array} categories List of categories
 * @returns {Object} counters
 */
export const calculateQuickStats = (tasks, categories = []) => {
  const today = new Date();
  const todayStr = getLocalDateStr(today);

  // Time metrics
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfWeekStr = getLocalDateStr(startOfWeek);
  
  const monthPrefix = todayStr.substring(0, 7);

  const completedThisWeek = tasks.filter(t => t.completed && t.dueDate && t.dueDate >= startOfWeekStr).length;
  const completedThisMonth = tasks.filter(t => t.completed && t.dueDate && t.dueDate.startsWith(monthPrefix)).length;

  const totalCompleted = tasks.filter(t => t.completed).length;
  const totalMissed = tasks.filter(t => t.missed).length;
  const totalPending = tasks.filter(t => !t.completed && !t.missed).length;

  const recurringCount = tasks.filter(t => t.recurringTaskId).length;
  const oneTimeCount = tasks.filter(t => !t.recurringTaskId).length;

  // Category counts mapping
  const categoryCounts = {};
  tasks.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  let mostUsedCategory = 'None';
  let maxCatCount = 0;
  Object.keys(categoryCounts).forEach(catId => {
    if (categoryCounts[catId] > maxCatCount) {
      maxCatCount = categoryCounts[catId];
      const match = categories.find(c => c.id === catId);
      mostUsedCategory = match ? match.name : catId;
    }
  });

  // Priority count
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && !t.completed).length;

  return {
    completedThisWeek,
    completedThisMonth,
    totalCompleted,
    totalMissed,
    totalPending,
    recurringCount,
    oneTimeCount,
    mostUsedCategory,
    highPriorityCount
  };
};

/**
 * Generates dynamic motivation messages based on current completion rates.
 */
export const getMotivationalMessage = (todayStats) => {
  const { total, completed, missed, rate } = todayStats;
  
  if (total === 0) {
    return "No tasks scheduled for today. Add a task to kickstart your day!";
  }
  if (rate === 100) {
    return "Excellent work today. You're on fire! 🔥 Keep it up!";
  }
  if (missed > 0) {
    return `You have missed ${missed} task${missed > 1 ? 's' : ''} today. Let's make tomorrow better!`;
  }
  if (rate >= 75) {
    return "Almost there! Complete the remaining tasks to reach 100%!";
  }
  if (completed > 0) {
    return "Good start! Keep your momentum going and tick off a few more.";
  }
  
  return "You have pending tasks for today. Don't break your streak—get started now!";
};

/**
 * Calculates day performance stats and color category classes.
 */
export const calculateDayPerformance = (tasks, dateStr) => {
  const dayTasks = tasks.filter(t => t.dueDate === dateStr);
  const total = dayTasks.length;
  const completed = dayTasks.filter(t => t.completed).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  let colorClass = 'gray'; // Default if no tasks
  if (total > 0) {
    if (rate === 100) colorClass = 'green';
    else if (rate >= 80) colorClass = 'light-green';
    else if (rate >= 50) colorClass = 'yellow';
    else if (rate >= 20) colorClass = 'orange';
    else colorClass = 'red';
  }

  return {
    total,
    completed,
    rate,
    colorClass
  };
};

/**
 * Calculates comprehensive breakdowns for a specific selected day's card detail list.
 */
export const calculateDayDetailedStats = (dayTasks, categories = []) => {
  const total = dayTasks.length;
  const completed = dayTasks.filter(t => t.completed).length;
  const pending = dayTasks.filter(t => !t.completed && !t.missed).length;
  const missed = dayTasks.filter(t => t.missed).length;

  const recurringCount = dayTasks.filter(t => t.recurringTaskId).length;
  const oneTimeCount = dayTasks.filter(t => !t.recurringTaskId).length;

  // Category counts breakdown
  const catBreakdown = {};
  dayTasks.forEach(t => {
    if (!catBreakdown[t.category]) {
      const match = categories.find(c => c.id === t.category);
      catBreakdown[t.category] = {
        name: match ? match.name : t.category,
        color: match ? match.color : '#8b5cf6',
        total: 0,
        completed: 0
      };
    }
    catBreakdown[t.category].total++;
    if (t.completed) catBreakdown[t.category].completed++;
  });

  // Priority counts breakdown
  const prioBreakdown = { low: 0, medium: 0, high: 0 };
  dayTasks.forEach(t => {
    if (prioBreakdown[t.priority] !== undefined) {
      prioBreakdown[t.priority]++;
    }
  });

  // Most active category
  let mostActiveCategory = 'None';
  let maxCount = 0;
  Object.values(catBreakdown).forEach(c => {
    if (c.total > maxCount) {
      maxCount = c.total;
      mostActiveCategory = c.name;
    }
  });

  // Highest priority completed
  const completedTasks = dayTasks.filter(t => t.completed);
  let highestPriorityCompleted = 'None';
  if (completedTasks.some(t => t.priority === 'high')) {
    highestPriorityCompleted = 'High';
  } else if (completedTasks.some(t => t.priority === 'medium')) {
    highestPriorityCompleted = 'Medium';
  } else if (completedTasks.some(t => t.priority === 'low')) {
    highestPriorityCompleted = 'Low';
  }

  // Average completion time (completionTime - createdDate)
  let avgCompletionTimeText = 'None';
  const tasksWithTimes = completedTasks.filter(t => t.completionTime && t.createdDate);
  if (tasksWithTimes.length > 0) {
    let totalDiffMs = 0;
    tasksWithTimes.forEach(t => {
      totalDiffMs += new Date(t.completionTime).getTime() - new Date(t.createdDate).getTime();
    });
    const avgMs = totalDiffMs / tasksWithTimes.length;
    const avgMins = Math.round(avgMs / 60000);
    const avgHours = Math.round(avgMins / 60);

    if (avgMins < 1) {
      avgCompletionTimeText = 'under a minute';
    } else if (avgMins < 60) {
      avgCompletionTimeText = `${avgMins} min${avgMins > 1 ? 's' : ''}`;
    } else {
      const remainingMins = avgMins % 60;
      avgCompletionTimeText = `${avgHours} hr${avgHours > 1 ? 's' : ''} ${remainingMins > 0 ? `${remainingMins} min${remainingMins > 1 ? 's' : ''}` : ''}`;
    }
  }

  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending,
    missed,
    recurringCount,
    oneTimeCount,
    catBreakdown,
    prioBreakdown,
    mostActiveCategory,
    highestPriorityCompleted,
    avgCompletionTimeText,
    rate
  };
};

/**
 * Calculates productivity completion rates for the past N days.
 */
export const calculateTrendData = (tasks, daysLimit = 7) => {
  const today = new Date();
  const list = [];

  for (let i = daysLimit - 1; i >= 0; i--) {
    const temp = new Date(today);
    temp.setDate(today.getDate() - i);
    const dateStr = getLocalDateStr(temp);
    
    // Format label like "Aug 1"
    const label = temp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const total = dayTasks.length;
    const completed = dayTasks.filter(t => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    list.push({
      date: dateStr,
      label,
      rate,
      total,
      completed
    });
  }

  return list;
};

/**
 * Calculates average completion rate grouped by weekdays.
 */
export const calculateWeekdayPerformance = (tasks) => {
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const stats = weekdayNames.map(dayName => ({
    day: dayName,
    completed: 0,
    total: 0,
    rate: 0
  }));

  tasks.forEach(t => {
    if (!t.dueDate) return;
    const dateObj = new Date(t.dueDate + 'T00:00:00');
    const dayIndex = dateObj.getDay();
    const dayName = weekdayNames[dayIndex];
    const statItem = stats.find(s => s.day === dayName);
    
    if (statItem) {
      statItem.total++;
      if (t.completed) statItem.completed++;
    }
  });

  stats.forEach(s => {
    s.rate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
  });

  // Reorder to Monday -> Sunday
  const mondayFirst = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return mondayFirst.map(dayName => stats.find(s => s.day === dayName));
};

/**
 * Calculates milestone targets (Weekly, Monthly, Yearly completion targets).
 */
export const calculateWeeklyMonthlyMilestones = (tasks) => {
  const today = new Date();
  const todayStr = getLocalDateStr(today);

  // Gathers start of week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfWeekStr = getLocalDateStr(startOfWeek);

  // Month starts
  const monthPrefix = todayStr.substring(0, 7); // YYYY-MM
  const yearPrefix = todayStr.substring(0, 4); // YYYY

  const weekTasks = tasks.filter(t => t.dueDate && t.dueDate >= startOfWeekStr && t.dueDate <= todayStr);
  const monthTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(monthPrefix) && t.dueDate <= todayStr);
  const yearTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(yearPrefix) && t.dueDate <= todayStr);

  const getRate = (dayTasks) => {
    const total = dayTasks.length;
    const completed = dayTasks.filter(t => t.completed).length;
    return {
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total
    };
  };

  return {
    week: getRate(weekTasks),
    month: getRate(monthTasks),
    year: getRate(yearTasks)
  };
};

/**
 * Calculates performance rates by categories.
 */
export const calculateCategoryPerformance = (tasks, categories = []) => {
  const catStats = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    completed: 0,
    total: 0,
    rate: 0
  }));

  tasks.forEach(t => {
    const statItem = catStats.find(c => c.id === t.category);
    if (statItem) {
      statItem.total++;
      if (t.completed) statItem.completed++;
    }
  });

  catStats.forEach(c => {
    c.rate = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
  });

  // Sort by rate descending to identify most and least completed
  const sorted = [...catStats].filter(c => c.total > 0).sort((a, b) => b.rate - a.rate);

  return {
    categoriesList: catStats,
    mostCompletedCategory: sorted.length > 0 ? sorted[0].name : 'None',
    leastCompletedCategory: sorted.length > 0 ? sorted[sorted.length - 1].name : 'None'
  };
};

/**
 * Calculates performance breakdown by priority levels.
 */
export const calculatePriorityBreakdown = (tasks) => {
  const priorities = ['high', 'medium', 'low'];
  const result = {};

  priorities.forEach(prio => {
    const prioTasks = tasks.filter(t => t.priority === prio);
    const total = prioTasks.length;
    const completed = prioTasks.filter(t => t.completed).length;
    const missed = prioTasks.filter(t => t.missed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const missRate = total > 0 ? Math.round((missed / total) * 100) : 0;

    // Avg completion time
    let totalDiffMs = 0;
    let timedCount = 0;
    prioTasks.filter(t => t.completed && t.completionTime && t.createdDate).forEach(t => {
      totalDiffMs += new Date(t.completionTime).getTime() - new Date(t.createdDate).getTime();
      timedCount++;
    });

    let avgTimeText = 'None';
    if (timedCount > 0) {
      const avgMins = Math.round((totalDiffMs / timedCount) / 60000);
      if (avgMins < 60) {
        avgTimeText = `${avgMins}m`;
      } else {
        avgTimeText = `${Math.round(avgMins / 60)}h`;
      }
    }

    result[prio] = {
      total,
      completed,
      missed,
      rate,
      missRate,
      avgTimeText
    };
  });

  return result;
};

/**
 * Evaluates recurring habit templates consistency.
 */
export const calculateHabitConsistency = (tasks) => {
  // Group tasks that have recurringTaskId
  const recurringTasksMap = {};

  tasks.filter(t => t.recurringTaskId).forEach(t => {
    if (!recurringTasksMap[t.recurringTaskId]) {
      recurringTasksMap[t.recurringTaskId] = {
        title: t.title,
        completed: 0,
        total: 0,
        missed: 0,
        instances: []
      };
    }
    recurringTasksMap[t.recurringTaskId].total++;
    if (t.completed) recurringTasksMap[t.recurringTaskId].completed++;
    if (t.missed) recurringTasksMap[t.recurringTaskId].missed++;
    recurringTasksMap[t.recurringTaskId].instances.push(t);
  });

  const list = Object.keys(recurringTasksMap).map(id => {
    const item = recurringTasksMap[id];
    const rate = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;

    // Calculate streaks for this specific habit
    const sorted = [...item.instances].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    let currentStreak = 0;
    let longestStreak = 0;

    sorted.forEach(t => {
      if (t.completed) {
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else if (t.missed) {
        currentStreak = 0;
      }
    });

    return {
      id,
      title: item.title,
      total: item.total,
      completed: item.completed,
      missed: item.missed,
      rate,
      streak: longestStreak
    };
  });

  const sortedList = [...list].sort((a, b) => b.rate - a.rate);

  return {
    list,
    mostConsistent: sortedList.length > 0 ? sortedList[0].title : 'None',
    leastConsistent: sortedList.length > 0 ? sortedList[sortedList.length - 1].title : 'None'
  };
};

/**
 * Generates smart insights dynamically.
 */
export const generateSmartInsights = (tasks, categories = [], streakStats = {}) => {
  const insights = [];
  if (tasks.length === 0) {
    return [{ text: "Add and complete tasks to unlock your dynamic productivity insights!", type: 'info' }];
  }

  // 1. Weekday Insight
  const weekdayData = calculateWeekdayPerformance(tasks);
  const sortedWeekdays = [...weekdayData].sort((a, b) => b.rate - a.rate);
  if (sortedWeekdays.length > 0 && sortedWeekdays[0].total > 0 && sortedWeekdays[0].rate > 50) {
    insights.push({
      text: `You are most productive on ${sortedWeekdays[0].day}s with a ${sortedWeekdays[0].rate}% completion rate.`,
      type: 'success'
    });
  }

  // 2. Category Insight
  const catPerformance = calculateCategoryPerformance(tasks, categories);
  const activeCats = catPerformance.categoriesList.filter(c => c.total > 0).sort((a, b) => b.rate - a.rate);
  
  if (activeCats.length > 0) {
    const topCat = activeCats[0];
    if (topCat.rate >= 80) {
      insights.push({
        text: `Your "${topCat.name}" category has an outstanding ${topCat.rate}% completion rate. Excellent focus!`,
        type: 'success'
      });
    }

    const bottomCat = activeCats[activeCats.length - 1];
    if (bottomCat.rate < 50 && bottomCat !== topCat) {
      insights.push({
        text: `You tend to miss tasks in "${bottomCat.name}" (${bottomCat.rate}% completed). Consider breaking them down into smaller steps.`,
        type: 'warning'
      });
    }
  }

  // 3. Streak Insight
  if (streakStats.currentStreak > 0) {
    insights.push({
      text: `You are currently on a ${streakStats.currentStreak}-day productive streak! Keep the flame burning.`,
      type: 'success'
    });
  }

  // 4. Overdue tasks insight
  const overdueCount = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < getLocalDateStr()).length;
  if (overdueCount > 2) {
    insights.push({
      text: `You have ${overdueCount} overdue incomplete tasks. Consider rescheduling them to declutter your list.`,
      type: 'info'
    });
  }

  // 5. Completion rates improving insight
  // Compare last 7 days average rate vs previous 7 days average rate
  const last7Days = calculateTrendData(tasks, 7);
  const prev7Days = [];
  const today = new Date();
  
  for (let i = 13; i >= 7; i--) {
    const temp = new Date(today);
    temp.setDate(today.getDate() - i);
    const dateStr = getLocalDateStr(temp);
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const total = dayTasks.length;
    const completed = dayTasks.filter(t => t.completed).length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    if (total > 0) prev7Days.push(rate);
  }

  const avgLast7 = last7Days.filter(d => d.total > 0).map(d => d.rate);
  const avgRateLast = avgLast7.length > 0 ? avgLast7.reduce((a, b) => a + b, 0) / avgLast7.length : 0;
  const avgRatePrev = prev7Days.length > 0 ? prev7Days.reduce((a, b) => a + b, 0) / prev7Days.length : 0;

  if (avgRateLast > avgRatePrev && avgRatePrev > 0) {
    const diff = Math.round(avgRateLast - avgRatePrev);
    insights.push({
      text: `Your average productivity has improved by ${diff}% compared to the previous week!`,
      type: 'success'
    });
  }

  // Fallback default insight
  if (insights.length === 0) {
    insights.push({
      text: "You are making steady progress. Keep building daily habits!",
      type: 'info'
    });
  }

  return insights;
};

/**
 * Formats duration in seconds to "Xh Ym" or "Ym".
 * @param {number} seconds Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatTime = (seconds) => {
  const s = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/**
 * Formats timestamp string to human-readable relative time.
 * @param {string} timestampStr ISO timestamp
 * @param {number} [nowMs] Optional current epoch ms
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestampStr, nowMs = Date.now()) => {
  if (!timestampStr) return '';
  try {
    const diffMs = nowMs - new Date(timestampStr).getTime();
    if (diffMs < 0) return 'just now';
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(timestampStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

