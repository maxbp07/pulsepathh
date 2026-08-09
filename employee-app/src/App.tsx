import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppShell } from './components/AppShell';
import { OnboardingPage } from './screens/OnboardingPage';
import { HomePage } from './screens/HomePage';
import { HistoryPage } from './screens/HistoryPage';
import { CheckinWizard } from './screens/CheckinWizard';

type Tab = 'home' | 'history' | 'checkin';

const AppContent: React.FC = () => {
  const { authenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('home');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090f] text-[#f0f4fc]">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-[#8b9bb8] mt-3 font-semibold tracking-wider uppercase">Cargando...</span>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <AppShell currentTab="onboarding" onNavigate={() => {}}>
        <OnboardingPage />
      </AppShell>
    );
  }

  return (
    <AppShell currentTab={currentTab} onNavigate={(route) => setCurrentTab(route as Tab)}>
      {currentTab === 'home' && (
        <HomePage onStartTest={() => setCurrentTab('checkin')} />
      )}
      {currentTab === 'history' && (
        <HistoryPage onBack={() => setCurrentTab('home')} />
      )}
      {currentTab === 'checkin' && (
        <CheckinWizard onFinish={() => setCurrentTab('home')} />
      )}
    </AppShell>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
