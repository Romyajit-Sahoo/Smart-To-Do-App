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
import { FocusSessionPage } from './pages/FocusSessionPage';
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
        {(activeTab === TABS.DEEP_FOCUS || activeTab === TABS.FOCUS_SESSION) && <FocusSessionPage />}
        {activeTab === TABS.CALENDAR && <CalendarPage />}
        {activeTab === TABS.ANALYTICS && <AnalyticsPage />}
        {activeTab === TABS.GAMIFICATION && <GamificationPage />}


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