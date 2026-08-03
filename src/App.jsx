import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TABS } from './constants/constants';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { MobileNav } from './components/Layout/MobileNav';
import { TasksPage } from './pages/TasksPage';
import { Dashboard } from './pages/Dashboard';
import { CalendarPage } from './pages/CalendarPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { GamificationPage } from './pages/GamificationPage';
import { HabitsPage } from './pages/HabitsPage';
import { Star } from 'lucide-react';
import { GamificationProvider } from './context/GamificationContext';

const AppContent = () => {
  const { activeTab } = useApp();

  return (
    <div className="app-container">
      {/* Sidebar for Desktop / Large views */}
      <Sidebar />

      {/* Main Panel Viewport */}
      <div className="main-content">
        {/* Header containing title, search bar, theme toggler */}
        <Header />

        {/* View Switcher Routing */}
        {activeTab === TABS.DASHBOARD && <Dashboard />}
        {activeTab === TABS.TASKS && <TasksPage />}
        {activeTab === TABS.HABITS && <HabitsPage />}
        {activeTab === TABS.CALENDAR && <CalendarPage />}
        {activeTab === TABS.ANALYTICS && <AnalyticsPage />}
        {activeTab === TABS.GAMIFICATION && <GamificationPage />}

        {/* Placeholder pages for future features */}
        {activeTab !== TABS.DASHBOARD && activeTab !== TABS.TASKS && activeTab !== TABS.HABITS && activeTab !== TABS.CALENDAR && activeTab !== TABS.ANALYTICS && activeTab !== TABS.GAMIFICATION && (
          <div className="page-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', marginTop: '2rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                backgroundColor: 'var(--primary-light)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--primary)',
                marginBottom: '1.5rem'
              }}>
                <Star size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{activeTab} Page</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                The <strong>{activeTab}</strong> dashboard module will be implemented in the next sequence.
                All Task Management controls (creation, status tracking, filters, searches) are currently live!
              </p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                React SPA - FocusFlow v1.0.0
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation bar */}
        <MobileNav />
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <AppProvider>
      <GamificationProvider>
        <AppContent />
      </GamificationProvider>
    </AppProvider>
  );
};

export default App;