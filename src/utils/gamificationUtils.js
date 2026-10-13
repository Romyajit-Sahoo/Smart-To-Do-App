// gamificationUtils.js
// Utility module for computing XP, Levels, Ranks, and evaluating achievements/challenges.

// -----------------------------------------
// 1. XP REWARD CONSTANTS
// -----------------------------------------
export const XP_AWARDS = {
  TASK_LOW: 10,
  TASK_MEDIUM: 20,
  TASK_HIGH: 40,
  HABIT_DAILY: 15,
  HABIT_WEEKLY: 30,
  HABIT_MONTHLY: 50,
  PERFECT_DAY: 100,
  STREAK_7: 150,
  STREAK_14: 250,
  STREAK_30: 500,
  PERFECT_WEEK: 300,
  PERFECT_MONTH: 1000,
  CHALLENGE_DAILY: 50,
  CHALLENGE_WEEKLY: 150,
  CHALLENGE_MONTHLY: 300
};

// -----------------------------------------
// 2. LEVEL & RANK ALGORITHMS
// -----------------------------------------

/**
 * Calculates total XP required to reach a specific level.
 * Progressive formula: XP(L) = 100 * ((L * (L + 1) / 2) - 1)
 * Level 1: 0
 * Level 2: 200
 * Level 3: 500
 * Level 4: 900
 * Level 5: 1400
 */
export const getXpForLevel = (level) => {
  if (level <= 1) return 0;
  return 100 * ((level * (level + 1)) / 2 - 1);
};

/**
 * Calculates current level and progress given a total XP amount.
 */
export const calculateLevelProgress = (totalXp) => {
  const safeXp = Math.max(0, Number(totalXp) || 0);
  let level = 1;
  while (safeXp >= getXpForLevel(level + 1)) {
    level++;
  }
  
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const xpInCurrentLevel = safeXp - currentLevelXp;
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const progressPercentage = (xpInCurrentLevel / xpNeededForNext) * 100;

  return {
    level,
    xpInCurrentLevel,
    xpNeededForNext,
    progressPercentage: Math.min(Math.max(progressPercentage, 0), 100),
    nextLevelXp,
    xpToNextLevel: nextLevelXp - safeXp
  };
};

/**
 * Maps a level to a rank title and color styling.
 */
export const getRankForLevel = (level) => {
  if (level >= 100) return { title: 'Legend', color: '#facc15', gradient: 'linear-gradient(135deg, #fef08a, #eab308)' }; // Gold
  if (level >= 70) return { title: 'Grandmaster', color: '#c084fc', gradient: 'linear-gradient(135deg, #e9d5ff, #a855f7)' }; // Purple
  if (level >= 50) return { title: 'Master', color: '#f43f5e', gradient: 'linear-gradient(135deg, #fecdd3, #e11d48)' }; // Rose
  if (level >= 40) return { title: 'Expert', color: '#3b82f6', gradient: 'linear-gradient(135deg, #bfdbfe, #2563eb)' }; // Blue
  if (level >= 30) return { title: 'Performer', color: '#10b981', gradient: 'linear-gradient(135deg, #a7f3d0, #059669)' }; // Emerald
  if (level >= 20) return { title: 'Achiever', color: '#06b6d4', gradient: 'linear-gradient(135deg, #a5f3fc, #0891b2)' }; // Cyan
  if (level >= 10) return { title: 'Explorer', color: '#f97316', gradient: 'linear-gradient(135deg, #ffedd5, #ea580c)' }; // Orange
  if (level >= 4) return { title: 'Learner', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #ddd6fe, #7c3aed)' }; // Violet
  return { title: 'Beginner', color: '#64748b', gradient: 'linear-gradient(135deg, #e2e8f0, #475569)' }; // Slate
};

// -----------------------------------------
// 3. ACHIEVEMENTS DICTIONARY
// -----------------------------------------

export const ACHIEVEMENTS = [
  // Task Volume
  { id: 'tasks_1', title: 'First Steps', description: 'Complete your first task', icon: 'Check', target: 1, type: 'tasks', xpReward: 50 },
  { id: 'tasks_10', title: 'Getting Things Done', description: 'Complete 10 tasks', icon: 'Layers', target: 10, type: 'tasks', xpReward: 100 },
  { id: 'tasks_100', title: 'Task Machine', description: 'Complete 100 tasks', icon: 'Target', target: 100, type: 'tasks', xpReward: 500 },
  { id: 'tasks_500', title: 'Productivity Ninja', description: 'Complete 500 tasks', icon: 'Zap', target: 500, type: 'tasks', xpReward: 1000 },
  { id: 'tasks_1000', title: 'Legendary Finisher', description: 'Complete 1000 tasks', icon: 'Award', target: 1000, type: 'tasks', xpReward: 2500 },
  
  // Streaks
  { id: 'streak_3', title: 'Warming Up', description: 'Achieve a 3-day perfect streak', icon: 'Flame', target: 3, type: 'streak', xpReward: 50 },
  { id: 'streak_7', title: 'On Fire', description: 'Achieve a 7-day perfect streak', icon: 'Flame', target: 7, type: 'streak', xpReward: 200 },
  { id: 'streak_14', title: 'Unstoppable', description: 'Achieve a 14-day perfect streak', icon: 'Flame', target: 14, type: 'streak', xpReward: 500 },
  { id: 'streak_30', title: 'Consistency Hero', description: 'Achieve a 30-day perfect streak', icon: 'Star', target: 30, type: 'streak', xpReward: 1000 },
  { id: 'streak_100', title: 'Century Mark', description: 'Achieve a 100-day perfect streak', icon: 'Crown', target: 100, type: 'streak', xpReward: 5000 },
  
  // High Priority
  { id: 'high_priority_10', title: 'Priority Manager', description: 'Complete 10 High Priority tasks', icon: 'AlertCircle', target: 10, type: 'high_priority', xpReward: 100 },
  { id: 'high_priority_100', title: 'Crisis Averted', description: 'Complete 100 High Priority tasks', icon: 'Shield', target: 100, type: 'high_priority', xpReward: 500 },
  
  // Habits
  { id: 'habit_1', title: 'Habit Starter', description: 'Complete a recurring habit', icon: 'RefreshCw', target: 1, type: 'habits', xpReward: 50 },
  { id: 'habit_100', title: 'Routine Master', description: 'Complete 100 recurring habits', icon: 'Repeat', target: 100, type: 'habits', xpReward: 500 },
];

/**
 * Checks which achievements the user has unlocked based on current stats.
 * Returns array of newly unlocked achievement IDs.
 */
export const evaluateAchievements = (stats = {}, currentUnlockedIds = []) => {
  const newUnlocks = [];
  const safeStats = stats || {};
  const safeUnlockedIds = Array.isArray(currentUnlockedIds) ? currentUnlockedIds : [];
  
  ACHIEVEMENTS.forEach(achievement => {
    if (safeUnlockedIds.includes(achievement.id)) return; // Already unlocked
    
    let progress = 0;
    if (achievement.type === 'tasks') progress = safeStats.totalTasksCompleted || 0;
    if (achievement.type === 'streak') progress = safeStats.longestStreak || 0;
    if (achievement.type === 'high_priority') progress = safeStats.highPriorityCompleted || 0;
    if (achievement.type === 'habits') progress = safeStats.totalHabitsCompleted || 0;

    if (progress >= achievement.target) {
      newUnlocks.push(achievement);
    }
  });
  
  return newUnlocks;
};

// -----------------------------------------
// 4. BADGE DICTIONARY
// -----------------------------------------
export const BADGE_TIERS = {
  BRONZE: { name: 'Bronze', color: '#cd7f32', shadow: 'rgba(205, 127, 50, 0.4)' },
  SILVER: { name: 'Silver', color: '#c0c0c0', shadow: 'rgba(192, 192, 192, 0.4)' },
  GOLD: { name: 'Gold', color: '#ffd700', shadow: 'rgba(255, 215, 0, 0.4)' },
  DIAMOND: { name: 'Diamond', color: '#00ffff', shadow: 'rgba(0, 255, 255, 0.4)' },
  PLATINUM: { name: 'Platinum', color: '#e5e4e2', shadow: 'rgba(229, 228, 226, 0.4)' },
  LEGENDARY: { name: 'Legendary', color: '#ff00ff', shadow: 'rgba(255, 0, 255, 0.4)' },
};

// Badges are unlocked mostly through cumulative tasks or hitting specific massive milestones
export const BADGES = [
  { id: 'badge_first_blood', name: 'Initiator', tier: 'BRONZE', icon: 'Play', conditionDesc: 'Complete 5 Tasks' },
  { id: 'badge_dedicated', name: 'Dedicated', tier: 'SILVER', icon: 'Activity', conditionDesc: 'Reach Level 5' },
  { id: 'badge_golden_week', name: 'Golden Week', tier: 'GOLD', icon: 'Sun', conditionDesc: '7-Day Streak' },
  { id: 'badge_diamond_month', name: 'Diamond Month', tier: 'DIAMOND', icon: 'Gem', conditionDesc: '30-Day Streak' },
  { id: 'badge_centurion', name: 'Centurion', tier: 'PLATINUM', icon: 'Shield', conditionDesc: 'Complete 100 Tasks' },
  { id: 'badge_grandmaster', name: 'Ascended', tier: 'LEGENDARY', icon: 'Crown', conditionDesc: 'Reach Rank Grandmaster' }
];

export const evaluateBadges = (stats = {}, level = 1, currentBadgeIds = []) => {
  const newBadges = [];
  const safeStats = stats || {};
  const safeBadgeIds = Array.isArray(currentBadgeIds) ? currentBadgeIds : [];
  const safeLevel = Number(level) || 1;

  BADGES.forEach(b => {
    if (safeBadgeIds.includes(b.id)) return;
    
    let unlocked = false;
    if (b.id === 'badge_first_blood' && (safeStats.totalTasksCompleted || 0) >= 5) unlocked = true;
    if (b.id === 'badge_dedicated' && safeLevel >= 5) unlocked = true;
    if (b.id === 'badge_golden_week' && (safeStats.longestStreak || 0) >= 7) unlocked = true;
    if (b.id === 'badge_diamond_month' && (safeStats.longestStreak || 0) >= 30) unlocked = true;
    if (b.id === 'badge_centurion' && (safeStats.totalTasksCompleted || 0) >= 100) unlocked = true;
    if (b.id === 'badge_grandmaster' && safeLevel >= 70) unlocked = true;

    if (unlocked) newBadges.push(b);
  });
  return newBadges;
};

// -----------------------------------------
// 5. MOTIVATION ENGINE
// -----------------------------------------
export const generateMotivationMessage = (levelProgress, stats) => {
  const safeProgress = levelProgress || {};
  const safeStats = stats || {};

  if (safeProgress.xpToNextLevel !== undefined && safeProgress.xpToNextLevel < 100 && safeProgress.xpToNextLevel > 0) {
    return `You are only ${safeProgress.xpToNextLevel} XP away from Level ${(safeProgress.level || 1) + 1}!`;
  }
  
  if (safeStats.currentStreak > 1) {
    return `You're on a ${safeStats.currentStreak}-day streak! Keep the fire burning.`;
  }
  
  if (safeStats.totalTasksCompleted === 0) {
    return "Welcome! Complete your first task to start earning XP.";
  }

  if (safeStats.currentStreak === 0 && (safeStats.totalTasksCompleted || 0) > 0) {
    return "Every master was once a beginner. Start a new streak today!";
  }

  return "Stay focused and conquer your day!";
};
