import React from 'react';
import { LiveClock } from './LiveClock';
import { GreetingCard } from './GreetingCard';
import { FocusGoalCard } from './FocusGoalCard';
import { QuickStats } from './QuickStats';
import { QuickActions } from './QuickActions';
import './DeepFocusHero.css';

export const DeepFocusHero = () => {
  return (
    <div className="deep-focus-hero-layout animate-fade-in">
      
      {/* HEADER ROW */}
      <header className="hero-header-row">
        <div className="hero-titles">
          <GreetingCard />
          <h1 className="hero-main-title">Deep Focus</h1>
          <p className="hero-subtitle">
            Distraction-free workspace designed for deep work and maximum productivity.
          </p>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="hero-main-grid">
        
        {/* LEFT COLUMN (Clock) */}
        <div className="hero-col-left">
          <LiveClock />
        </div>

        {/* RIGHT COLUMN (Stats & Goals & Actions) */}
        <div className="hero-col-right">
          <div className="hero-right-top">
            <FocusGoalCard />
            <QuickActions />
          </div>
          
          <div className="hero-right-bottom">
            <QuickStats />
          </div>
        </div>
        
      </div>
    </div>
  );
};
