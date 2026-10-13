import { describe, it, expect } from 'vitest';
import {
  XP_AWARDS,
  getXpForLevel,
  calculateLevelProgress,
  getRankForLevel,
  ACHIEVEMENTS,
  evaluateAchievements,
  BADGES,
  evaluateBadges,
  generateMotivationMessage
} from './gamificationUtils';

describe('gamificationUtils - constants and dictionaries', () => {
  it('defines positive numeric XP award constants', () => {
    expect(XP_AWARDS.TASK_LOW).toBeGreaterThan(0);
    expect(XP_AWARDS.TASK_HIGH).toBeGreaterThan(XP_AWARDS.TASK_LOW);
  });

  it('contains valid achievement and badge definitions', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
    expect(ACHIEVEMENTS.every(a => a.id && a.title && a.target)).toBe(true);

    expect(BADGES.length).toBeGreaterThan(0);
    expect(BADGES.every(b => b.id && b.name && b.tier)).toBe(true);
  });
});

describe('gamificationUtils - getXpForLevel', () => {
  it('returns 0 XP for level 1 and below', () => {
    expect(getXpForLevel(1)).toBe(0);
    expect(getXpForLevel(0)).toBe(0);
    expect(getXpForLevel(-5)).toBe(0);
  });

  it('calculates correct milestone thresholds for higher levels', () => {
    expect(getXpForLevel(2)).toBe(200);
    expect(getXpForLevel(3)).toBe(500);
    expect(getXpForLevel(4)).toBe(900);
    expect(getXpForLevel(5)).toBe(1400);
  });
});

describe('gamificationUtils - calculateLevelProgress', () => {
  it('handles 0 XP at Level 1 with 0% progress', () => {
    const progress = calculateLevelProgress(0);
    expect(progress.level).toBe(1);
    expect(progress.xpInCurrentLevel).toBe(0);
    expect(progress.xpNeededForNext).toBe(200);
    expect(progress.progressPercentage).toBe(0);
    expect(progress.xpToNextLevel).toBe(200);
  });

  it('calculates mid-level progress accurately', () => {
    // Level 1 goes from 0 to 200. At 100 XP, it should be 50%
    const progress = calculateLevelProgress(100);
    expect(progress.level).toBe(1);
    expect(progress.xpInCurrentLevel).toBe(100);
    expect(progress.progressPercentage).toBe(50);
    expect(progress.xpToNextLevel).toBe(100);
  });

  it('correctly shifts to level 2 at 200 XP', () => {
    const progress = calculateLevelProgress(200);
    expect(progress.level).toBe(2);
    expect(progress.xpInCurrentLevel).toBe(0);
    expect(progress.progressPercentage).toBe(0);
  });

  it('safely handles negative or invalid XP inputs', () => {
    const progress = calculateLevelProgress(-50);
    expect(progress.level).toBe(1);
    expect(progress.xpInCurrentLevel).toBe(0);
    expect(progress.progressPercentage).toBe(0);
  });
});

describe('gamificationUtils - getRankForLevel', () => {
  it('maps levels to appropriate title and color scheme', () => {
    expect(getRankForLevel(1).title).toBe('Beginner');
    expect(getRankForLevel(4).title).toBe('Learner');
    expect(getRankForLevel(10).title).toBe('Explorer');
    expect(getRankForLevel(20).title).toBe('Achiever');
    expect(getRankForLevel(30).title).toBe('Performer');
    expect(getRankForLevel(40).title).toBe('Expert');
    expect(getRankForLevel(50).title).toBe('Master');
    expect(getRankForLevel(70).title).toBe('Grandmaster');
    expect(getRankForLevel(100).title).toBe('Legend');
  });
});

describe('gamificationUtils - evaluateAchievements', () => {
  it('unlocks achievements when targets are met', () => {
    const stats = {
      totalTasksCompleted: 10,
      longestStreak: 3,
      highPriorityCompleted: 0,
      totalHabitsCompleted: 0
    };
    const unlocked = evaluateAchievements(stats, []);
    const unlockedIds = unlocked.map(a => a.id);

    expect(unlockedIds).toContain('tasks_1');
    expect(unlockedIds).toContain('tasks_10');
    expect(unlockedIds).toContain('streak_3');
    expect(unlockedIds).not.toContain('tasks_100');
  });

  it('does not re-unlock already unlocked achievements', () => {
    const stats = { totalTasksCompleted: 10 };
    const unlocked = evaluateAchievements(stats, ['tasks_1']);
    const unlockedIds = unlocked.map(a => a.id);

    expect(unlockedIds).not.toContain('tasks_1');
    expect(unlockedIds).toContain('tasks_10');
  });

  it('handles null or undefined stats without throwing error', () => {
    expect(() => evaluateAchievements(null, [])).not.toThrow();
    expect(evaluateAchievements(null, [])).toEqual([]);

    expect(() => evaluateAchievements(undefined, [])).not.toThrow();
    expect(evaluateAchievements(undefined, [])).toEqual([]);
  });
});

describe('gamificationUtils - evaluateBadges', () => {
  it('awards badges when conditions are fulfilled', () => {
    const stats = { totalTasksCompleted: 5, longestStreak: 7 };
    const unlocked = evaluateBadges(stats, 5, []);
    const badgeIds = unlocked.map(b => b.id);

    expect(badgeIds).toContain('badge_first_blood');
    expect(badgeIds).toContain('badge_dedicated');
    expect(badgeIds).toContain('badge_golden_week');
  });

  it('handles null, undefined or empty stats safely without throwing', () => {
    expect(() => evaluateBadges(null, 1, [])).not.toThrow();
    expect(evaluateBadges(null, 1, [])).toEqual([]);

    expect(() => evaluateBadges(undefined, 1, undefined)).not.toThrow();
    expect(evaluateBadges(undefined, 1, undefined)).toEqual([]);
  });
});

describe('gamificationUtils - generateMotivationMessage', () => {
  it('returns close-to-level-up message when xpToNextLevel is under 100', () => {
    const levelProgress = { level: 2, xpToNextLevel: 45 };
    const stats = { currentStreak: 0, totalTasksCompleted: 5 };
    const msg = generateMotivationMessage(levelProgress, stats);
    expect(msg).toContain('45 XP');
  });

  it('returns welcome message when no tasks are completed yet', () => {
    const levelProgress = { level: 1, xpToNextLevel: 200 };
    const stats = { currentStreak: 0, totalTasksCompleted: 0 };
    const msg = generateMotivationMessage(levelProgress, stats);
    expect(msg).toContain('Welcome');
  });

  it('safely returns fallback when empty arguments are passed', () => {
    expect(() => generateMotivationMessage(null, null)).not.toThrow();
    const msg = generateMotivationMessage(null, null);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});
