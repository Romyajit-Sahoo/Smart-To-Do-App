import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  XP_AWARDS, 
  calculateLevelProgress, 
  getRankForLevel, 
  evaluateAchievements, 
  evaluateBadges 
} from '../utils/gamificationUtils';

const GamificationContext = createContext();

export const GamificationProvider = ({ children }) => {
  const { tasks, dailyRecords, getLocalDateString, triggerNotification } = useApp();

  // --- PERSISTENT GAMIFICATION STATES ---
  const [xp, setXp] = useLocalStorage('gamification_xp', 0);
  const [rewardHistory, setRewardHistory] = useLocalStorage('gamification_history', []);
  const [unlockedAchievements, setUnlockedAchievements] = useLocalStorage('gamification_achievements', []);
  const [unlockedBadges, setUnlockedBadges] = useLocalStorage('gamification_badges', []);
  const [stats, setStats] = useLocalStorage('gamification_stats', {
    totalTasksCompleted: 0,
    highPriorityCompleted: 0,
    totalHabitsCompleted: 0,
    longestStreak: 0,
    currentStreak: 0,
    perfectDays: 0
  });

  // Calculate dynamic level progress and ranks
  const levelProgress = calculateLevelProgress(xp);
  const currentRank = getRankForLevel(levelProgress.level);

  // --- REWARD LOGIC ---
  const awardXP = (amount, title, sourceId) => {
    setXp(prev => prev + amount);
    
    const rewardLog = {
      id: `rew_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      title,
      sourceId,
      timestamp: new Date().toISOString()
    };
    
    setRewardHistory(prev => [rewardLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const revokeXP = (sourceId) => {
    // Find how much XP was awarded for this source
    const log = rewardHistory.find(r => r.sourceId === sourceId);
    if (log) {
      setXp(prev => Math.max(0, prev - log.amount)); // Don't go below 0
      setRewardHistory(prev => prev.filter(r => r.sourceId !== sourceId));
    }
  };

  // --- OBSERVATION ENGINE ---
  const prevTasksRef = useRef(null);
  const prevDailyRecordsRef = useRef(null);
  const currentLevelRef = useRef(levelProgress.level);

  // Level Up Listener
  useEffect(() => {
    if (levelProgress.level > currentLevelRef.current) {
      triggerNotification("Level Up!", `Congratulations! You reached Level ${levelProgress.level}.`, "system");
      currentLevelRef.current = levelProgress.level;
    }
  }, [levelProgress.level, triggerNotification]);

  // Achievement & Badge Unlock Listener
  useEffect(() => {
    const newAchievements = evaluateAchievements(stats, unlockedAchievements);
    if (newAchievements.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newAchievements.map(a => a.id)]);
      newAchievements.forEach(ach => {
        triggerNotification("Achievement Unlocked!", ach.title, "completed");
        awardXP(ach.xpReward, `Achievement: ${ach.title}`, `ach_${ach.id}`);
      });
    }

    const newBadges = evaluateBadges(stats, levelProgress.level, unlockedBadges);
    if (newBadges.length > 0) {
      setUnlockedBadges(prev => [...prev, ...newBadges.map(b => b.id)]);
      newBadges.forEach(badge => {
        triggerNotification("Badge Earned!", `You earned the ${badge.name} badge!`, "completed");
      });
    }
  }, [stats, xp]);

  // Tasks Observer
  useEffect(() => {
    if (!prevTasksRef.current) {
      prevTasksRef.current = tasks;
      return;
    }

    const prevTasks = prevTasksRef.current;
    
    // Evaluate completions and un-completions
    const newlyCompleted = tasks.filter(t => t.completed && !prevTasks.find(pt => pt.id === t.id && pt.completed));
    const newlyUncompleted = prevTasks.filter(pt => pt.completed && !tasks.find(t => t.id === pt.id && t.completed));

    if (newlyCompleted.length > 0) {
      newlyCompleted.forEach(task => {
        let xpAmount = XP_AWARDS.TASK_MEDIUM;
        if (task.priority === 'high') xpAmount = XP_AWARDS.TASK_HIGH;
        if (task.priority === 'low') xpAmount = XP_AWARDS.TASK_LOW;

        awardXP(xpAmount, `Completed: ${task.title}`, task.id);
        
        setStats(prev => ({
          ...prev,
          totalTasksCompleted: prev.totalTasksCompleted + 1,
          highPriorityCompleted: task.priority === 'high' ? prev.highPriorityCompleted + 1 : prev.highPriorityCompleted,
        }));
      });
    }

    if (newlyUncompleted.length > 0) {
      newlyUncompleted.forEach(task => {
        revokeXP(task.id);
        
        setStats(prev => ({
          ...prev,
          totalTasksCompleted: Math.max(0, prev.totalTasksCompleted - 1),
          highPriorityCompleted: task.priority === 'high' ? Math.max(0, prev.highPriorityCompleted - 1) : prev.highPriorityCompleted,
        }));
      });
    }

    prevTasksRef.current = tasks;
  }, [tasks]);

  // Habits Observer
  useEffect(() => {
    if (!prevDailyRecordsRef.current) {
      prevDailyRecordsRef.current = dailyRecords;
      return;
    }

    const todayStr = getLocalDateString();
    const todayRecords = dailyRecords[todayStr] || {};
    const prevTodayRecords = prevDailyRecordsRef.current[todayStr] || {};

    const habitIds = Object.keys(todayRecords);
    
    habitIds.forEach(habitId => {
      const isCompleted = todayRecords[habitId];
      const wasCompleted = prevTodayRecords[habitId];

      if (isCompleted && !wasCompleted) {
        awardXP(XP_AWARDS.HABIT_DAILY, 'Completed a habit', `habit_${todayStr}_${habitId}`);
        setStats(prev => ({
          ...prev,
          totalHabitsCompleted: prev.totalHabitsCompleted + 1
        }));
      } else if (!isCompleted && wasCompleted) {
        revokeXP(`habit_${todayStr}_${habitId}`);
        setStats(prev => ({
          ...prev,
          totalHabitsCompleted: Math.max(0, prev.totalHabitsCompleted - 1)
        }));
      }
    });

    prevDailyRecordsRef.current = dailyRecords;
  }, [dailyRecords, getLocalDateString]);

  // Context value definition
  const value = {
    xp,
    levelProgress,
    currentRank,
    rewardHistory,
    unlockedAchievements,
    unlockedBadges,
    stats,
    setStats, // Manual stats trigger if needed for external tests
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
