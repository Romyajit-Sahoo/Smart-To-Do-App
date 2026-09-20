import { useMemo } from 'react';
import { useGamification } from '../context/GamificationContext';
import { ACHIEVEMENTS, BADGES, BADGE_TIERS, generateMotivationMessage } from '../utils/gamificationUtils';
import { Medal, Target, Award, BarChart2, History, Star, Circle } from 'lucide-react';
import { APP_ICONS } from '../constants/constants';
import './GamificationPage.css';

export const GamificationPage = () => {
  const { 
    xp, 
    levelProgress, 
    currentRank, 
    unlockedAchievements, 
    unlockedBadges, 
    stats, 
    rewardHistory 
  } = useGamification();

  const motivationMsg = useMemo(() => generateMotivationMessage(levelProgress, stats), [levelProgress, stats]);

  // SVG Ring calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (levelProgress.progressPercentage / 100) * circumference;

  return (
    <div className="gamification-page">
      
      {/* 1. HERO SECTION */}
      <section className="hero-card" style={{ background: currentRank.gradient }}>
        <div className="hero-bg-overlay"></div>
        <div className="hero-content">
          <div className="hero-rank">{currentRank.title}</div>
          <h2 className="hero-title">Level {levelProgress.level}</h2>
          <div className="motivation-text">"{motivationMsg}"</div>
        </div>
        
        <div className="hero-stats">
          <div className="level-ring">
            <svg>
              <circle className="bg" cx="50" cy="50" r={radius} />
              <circle 
                className="progress" 
                cx="50" cy="50" r={radius} 
                strokeDashoffset={offset}
              />
            </svg>
            <div className="level-number">
              <span>Level</span>
              <strong>{levelProgress.level}</strong>
            </div>
          </div>
          
          <div className="xp-details">
            <div className="xp-total">{xp.toLocaleString()} XP Total</div>
            <div className="xp-next">
              {levelProgress.xpInCurrentLevel.toLocaleString()} / {(levelProgress.xpInCurrentLevel + levelProgress.xpNeededForNext).toLocaleString()} XP
            </div>
            <div className="xp-next">{levelProgress.xpToNextLevel.toLocaleString()} XP to Level {levelProgress.level + 1}</div>
          </div>
        </div>
      </section>

      <div className="gamification-grid">
        
        {/* LEFT COLUMN: Badges & Achievements */}
        <div className="gamification-main">
          
          <div className="section-header">
            <Medal size={24} />
            <h3>Badge Collection</h3>
          </div>
          
          <div className="badges-grid" style={{ marginBottom: '3rem' }}>
            {BADGES.map((badge) => {
              const isUnlocked = unlockedBadges.includes(badge.id);
              const tierData = BADGE_TIERS[badge.tier];
              const Icon = APP_ICONS[badge.icon] || Circle;
              
              return (
                <div key={badge.id} className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`} title={badge.conditionDesc}>
                  <div 
                    className="badge-icon-wrapper" 
                    style={{ 
                      background: isUnlocked ? tierData.color : 'var(--text-tertiary)',
                      boxShadow: isUnlocked ? `0 0 15px ${tierData.shadow}` : 'none'
                    }}
                  >
                    <Icon size={28} />
                  </div>
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-desc">{badge.tier}</div>
                </div>
              );
            })}
          </div>

          <div className="section-header">
            <Target size={24} />
            <h3>Achievements</h3>
          </div>

          <div className="achievements-list">
            {ACHIEVEMENTS.map(ach => {
              const isUnlocked = unlockedAchievements.includes(ach.id);
              const Icon = APP_ICONS[ach.icon] || Award;
              
              let currentProgress = 0;
              if (ach.type === 'tasks') currentProgress = stats.totalTasksCompleted || 0;
              if (ach.type === 'streak') currentProgress = stats.longestStreak || 0;
              if (ach.type === 'high_priority') currentProgress = stats.highPriorityCompleted || 0;
              if (ach.type === 'habits') currentProgress = stats.totalHabitsCompleted || 0;
              
              const cappedProgress = Math.min(currentProgress, ach.target);
              const progressPct = (cappedProgress / ach.target) * 100;

              return (
                <div key={ach.id} className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon">
                    <Icon size={24} />
                  </div>
                  <div className="achievement-info">
                    <div className="achievement-title">
                      {ach.title}
                      <span className="achievement-xp">+{ach.xpReward} XP</span>
                    </div>
                    <div className="achievement-desc">{ach.description}</div>
                    
                    {!isUnlocked && (
                      <div className="achievement-progress-bar">
                        <div className="achievement-progress-fill" style={{ width: `${progressPct}%` }}></div>
                      </div>
                    )}
                    {!isUnlocked && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-tertiary)', textAlign: 'right' }}>
                        {cappedProgress} / {ach.target}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
        </div>

        {/* RIGHT COLUMN: Stats & Timeline */}
        <div className="gamification-sidebar">
          
          <div className="section-header">
            <BarChart2 size={24} />
            <h3>Career Stats</h3>
          </div>
          
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Tasks</span>
              <strong>{stats.totalTasksCompleted}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>High Priority Tasks</span>
              <strong>{stats.highPriorityCompleted}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Habits Completed</span>
              <strong>{stats.totalHabitsCompleted}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Longest Streak</span>
              <strong>{stats.longestStreak} Days</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Streak</span>
              <strong style={{ color: 'var(--primary)' }}>{stats.currentStreak} Days</strong>
            </div>
          </div>

          <div className="section-header">
            <History size={24} />
            <h3>Recent Rewards</h3>
          </div>
          
          <div className="reward-timeline glass-panel" style={{ padding: '1.5rem' }}>
            {rewardHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '1rem' }}>
                Complete tasks and habits to earn XP!
              </div>
            ) : (
              rewardHistory.map(log => (
                <div key={log.id} className="reward-item">
                  <div className="reward-info">
                    <div className="reward-icon"><Star size={16} /></div>
                    <div>
                      <div className="reward-title">{log.title}</div>
                      <div className="reward-date">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="reward-xp">+{log.amount}</div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
