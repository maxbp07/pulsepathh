import { useState } from 'react';
import { clearSession } from '@/lib/api';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdherencePage } from './pages/AdherencePage';
import { TooltipProvider } from '@/components/ui/tooltip';

type View = 'dashboard' | 'adherence';

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<View>('dashboard');

  const logout = () => {
    clearSession();
    setAuthed(false);
    setView('dashboard');
  };

  return (
    <TooltipProvider delayDuration={150}>
      {!authed ? (
        <LoginPage onLoggedIn={() => setAuthed(true)} />
      ) : view === 'adherence' ? (
        <AdherencePage onLogout={logout} onBack={() => setView('dashboard')} />
      ) : (
        <DashboardPage
          onLogout={logout}
          onOpenAdherence={() => setView('adherence')}
        />
      )}
    </TooltipProvider>
  );
}
