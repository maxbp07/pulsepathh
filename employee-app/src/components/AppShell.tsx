import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Home, History } from 'lucide-react';
import { LangSwitcherCompact } from './LangSwitcherCompact';

interface AppShellProps {
  children: React.ReactNode;
  currentTab: 'home' | 'history' | 'checkin' | 'onboarding';
  onNavigate: (route: 'home' | 'history' | 'checkin' | 'onboarding') => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentTab, onNavigate }) => {
  const { authenticated } = useAuth();
  const { t } = useTranslation();

  const showNav = authenticated && (currentTab === 'home' || currentTab === 'history');

  return (
    <div className="flex flex-col min-h-screen max-w-[480px] mx-auto bg-[#07090f] text-[#f0f4fc] font-sans relative overflow-x-hidden antialiased
      bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.15),transparent),_radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(59,130,246,0.08),transparent),_radial-gradient(ellipse_50%_30%_at_0%_80%,rgba(99,102,241,0.06),transparent)] bg-fixed">
      
      {/* Header Fijo */}
      <header className="flex-shrink-0 px-5 pt-4 pb-2 border-b border-white/5 bg-[#07090f]/40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            {t('app.name')}
          </span>
          {/* Selector de idioma inline */}
          {authenticated && <LangSwitcherCompact />}
        </div>
      </header>

      {/* Vista de Contenido */}
      <main className={`flex-1 p-5 overflow-y-auto pb-24 ${!showNav ? 'pb-8' : ''}`}>
        {children}
      </main>

      {/* Bottom Nav bar */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto h-[4.25rem] bg-[#0e1424]/75 backdrop-blur-lg border-t border-white/10 flex items-center justify-around px-8 pb-[safe-area-inset-bottom]">
          <button
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              currentTab === 'home' ? 'text-[#22d3ee]' : 'text-[#8b9bb8] hover:text-[#f0f4fc]'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>{t('nav.home')}</span>
          </button>
          <button
            onClick={() => onNavigate('history')}
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              currentTab === 'history' ? 'text-[#22d3ee]' : 'text-[#8b9bb8] hover:text-[#f0f4fc]'
            }`}
          >
            <History className="w-5 h-5" />
            <span>{t('nav.history')}</span>
          </button>
        </nav>
      )}
    </div>
  );
};
