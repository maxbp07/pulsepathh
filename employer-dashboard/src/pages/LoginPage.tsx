import { useState, type FormEvent } from 'react';
import { Activity, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { login, setSession } from '@/lib/api';
import { setDataMode } from '@/hooks/useDashboardData';

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState('rrhh@bcn.cat');
  const [password, setPassword] = useState('demo1234');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email.trim(), password);
      setSession(res);
      setDataMode('demo'); // por defecto demo (se ve poblado); el usuario puede pasar a "En vivo"
      onLoggedIn();
    } catch {
      // Sin backend disponible: entrar en modo demo con la sesión demo.
      setSession({ token: 'demo-token', orgId: 'demo-org', role: 'admin' });
      setDataMode('demo');
      onLoggedIn();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-indigo shadow-xl shadow-brand-teal/25">
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PulsePath</h1>
          <p className="text-sm text-muted-foreground">
            Dashboard de bienestar laboral · Ajuntament de Barcelona
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo profesional</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rrhh@bcn.cat"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>

            <div className="mt-4 space-y-1.5 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-risk-green" />
                Acceso RRHH · solo datos agregados con K-anonimidad K=5.
              </p>
              <p>
                Demo:{' '}
                <code className="rounded bg-secondary px-1 py-0.5 text-foreground">rrhh@bcn.cat</code>{' '}
                /{' '}
                <code className="rounded bg-secondary px-1 py-0.5 text-foreground">demo1234</code>
              </p>
            </div>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          PulsePath mide fatiga, estrés y burnout con PVT, Stroop y CBI. Metodología CoPsoQ·istas21.
        </p>
      </div>
    </div>
  );
}
