import { useEffect, useState } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchAdherence,
  fetchAdherenceSummary,
  getAdminSecret,
  getOrgId,
  setAdminSecret,
} from '@/lib/api';
import type { AdherenceParticipant, AdherenceSummary } from '@/lib/opsTypes';

export function AdherencePage({
  onLogout,
  onBack,
}: {
  onLogout: () => void;
  onBack?: () => void;
}) {
  const orgId = getOrgId();
  const [secret, setSecret] = useState(getAdminSecret() ?? '');
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<AdherenceSummary | null>(null);
  const [participants, setParticipants] = useState<AdherenceParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!orgId || !secret) {
      setError('Indica org ID (login) y admin secret.');
      return;
    }
    setLoading(true);
    setError(null);
    setAdminSecret(secret);
    try {
      const [s, p] = await Promise.all([
        fetchAdherenceSummary(orgId, secret, asOf),
        fetchAdherence(orgId, secret, asOf),
      ]);
      setSummary(s);
      setParticipants(p.participants);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando adherencia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId && getAdminSecret()) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell onLogout={onLogout} headerRight={
      <>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Dashboard
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </>
    }>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Adherencia del estudio</h2>
            <p className="text-sm text-muted-foreground">
              Solo códigos y cumplimiento — sin scores ni respuestas individuales.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acceso ops</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Org ID</Label>
              <Input value={orgId ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Admin secret</Label>
              <Input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="ADMIN_SECRET del backend"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha (as_of)</Label>
              <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
            </div>
            <Button onClick={load} disabled={loading} className="sm:col-span-3 w-fit">
              Cargar adherencia
            </Button>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Activados" value={`${summary.activated} / ${summary.codes_provisioned}`} />
            <Kpi label="Check-ins D7" value={pct(summary.adherence_daily_d7_pct)} />
            <Kpi label="Cuestionario D0" value={pct(summary.questionnaire_d0_pct)} />
            <Kpi label="Cuestionario D7" value={pct(summary.questionnaire_d7_pct)} />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participantes</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Slot</th>
                  <th className="py-2 pr-4">Hash</th>
                  <th className="py-2 pr-4">Día</th>
                  <th className="py-2 pr-4">Días check-in</th>
                  <th className="py-2 pr-4">D0</th>
                  <th className="py-2 pr-4">D7</th>
                  <th className="py-2 pr-4">D14</th>
                  <th className="py-2">Última sync</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={`${p.slot_label}-${p.code_hash_prefix}`} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono">{p.slot_label ?? '—'}</td>
                    <td className="py-2 pr-4 font-mono text-muted-foreground">{p.code_hash_prefix}…</td>
                    <td className="py-2 pr-4">{p.study_day ?? '—'}</td>
                    <td className="py-2 pr-4">{p.daily_days_completed}</td>
                    <td className="py-2 pr-4">{flag(p.questionnaires_done.D0)}</td>
                    <td className="py-2 pr-4">{flag(p.questionnaires_done.D7)}</td>
                    <td className="py-2 pr-4">{flag(p.questionnaires_done.D14)}</td>
                    <td className="py-2 text-muted-foreground text-xs">
                      {p.last_seen_at ? new Date(p.last_seen_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {participants.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">Sin participantes activados aún.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function pct(n: number | null): string {
  return n == null ? '—' : `${n}%`;
}

function flag(done: boolean): string {
  return done ? '✓' : '·';
}
