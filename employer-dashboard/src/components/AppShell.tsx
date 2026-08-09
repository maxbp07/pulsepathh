import type { ReactNode } from 'react';
import { Activity, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppShell({
  headerRight,
  onLogout,
  children,
}: {
  headerRight?: ReactNode;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <div className="grid-bg flex min-h-screen">
      {/* Sidebar */}
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/60 lg:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-teal to-brand-indigo shadow-lg shadow-brand-teal/25">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none tracking-tight">PulsePath</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Bienestar laboral</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <span className="flex cursor-default items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-foreground">
            <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
          </span>
        </nav>

        <div className="space-y-3 border-t border-border/60 p-4">
          <div className="flex items-start gap-2 rounded-lg border border-risk-green/20 bg-risk-green/5 px-3 py-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-risk-green" />
            <div className="text-[11px] leading-tight">
              <p className="font-semibold text-risk-green">K-anonimidad K=5</p>
              <p className="text-muted-foreground">Grupos &lt; 5 personas se suprimen. Nadie es identificable.</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:pl-64">
        <header className="glass sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border/60 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-teal to-brand-indigo">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">PulsePath</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold tracking-tight">Dashboard de salud organizacional</h1>
            <p className="text-xs text-muted-foreground">Prevención de fatiga, estrés y burnout · piloto Ajuntament de Barcelona</p>
          </div>
          <div className="flex items-center gap-2">{headerRight}</div>
        </header>
        <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
