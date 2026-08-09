import { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Database,
  Gauge,
  Lightbulb,
  Layers,
  LineChart as LineChartIcon,
  Radio,
  Table as TableIcon,
  Users,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { FiltersBar } from '@/components/FiltersBar';
import { KpiCard, RiskGauge, SectionTitle } from '@/components/primitives';
import { DriversBreakdown } from '@/components/DriversBreakdown';
import { TrendChart } from '@/components/TrendChart';
import { RiskBars } from '@/components/DepartmentBars';
import { SegmentsTabs } from '@/components/SegmentsTabs';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { AlertsPanel } from '@/components/AlertsPanel';
import { InsightsPanel } from '@/components/InsightsPanel';
import { DepartmentTable } from '@/components/DepartmentTable';
import { PredictiveForecast } from '@/components/PredictiveForecast';
import { IndustryBenchmark } from '@/components/IndustryBenchmark';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { fmtInt } from '@/lib/utils';
import type { DashboardFilters } from '@/lib/api';
import { getOrgId } from '@/lib/api';
import { semaphoreColor } from '@/lib/semaphore';
import {
  DataMode,
  getDataMode,
  setDataMode,
  useDashboardData,
} from '@/hooks/useDashboardData';

/** Toggle de fuente de datos: demo (sintético) o en vivo (API real). */
function DataModeToggle({ mode, onChange, liveEnabled }: { mode: DataMode; onChange: (m: DataMode) => void; liveEnabled: boolean }) {
  const Btn = ({ active, disabled, onClick, icon, label }: { active: boolean; disabled?: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {icon}
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
      <Btn active={mode === 'demo'} onClick={() => onChange('demo')} icon={<Radio className="h-3.5 w-3.5" />} label="Demo" />
      <Btn active={mode === 'live'} disabled={!liveEnabled} onClick={() => onChange('live')} icon={<Database className="h-3.5 w-3.5" />} label="En vivo" />
    </div>
  );
}

export function DashboardPage({
  onLogout,
  onOpenAdherence,
}: {
  onLogout: () => void;
  onOpenAdherence?: () => void;
}) {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [mode, setMode] = useState<DataMode>(getDataMode());

  const orgId = getOrgId();
  const liveEnabled = Boolean(orgId && orgId !== 'demo-org');
  const { data, loading, error } = useDashboardData(filters, mode);

  const departments = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    (data.segments.department || []).forEach((s) => set.add(s.group));
    data.groups.forEach((g) => g.department && set.add(g.department));
    return [...set].sort();
  }, [data]);

  const orgTotal = data?.org_total;
  const orgKanon = orgTotal?.kanon_protected;
  const orgColor = semaphoreColor(orgTotal?.avg_risk_index ?? null);

  function changeMode(m: DataMode) {
    setDataMode(m);
    setMode(m);
  }

  return (
    <AppShell
      onLogout={onLogout}
      headerRight={
        <>
          {onOpenAdherence && (
            <Button variant="outline" size="sm" onClick={onOpenAdherence} className="hidden sm:inline-flex">
              Adherencia estudio
            </Button>
          )}
          {mode === 'live' && <Badge variant="muted" className="hidden sm:inline-flex"><Database className="mr-1 h-3 w-3" /> Datos en vivo</Badge>}
          {mode === 'demo' && <Badge variant="muted" className="hidden sm:inline-flex"><Radio className="mr-1 h-3 w-3" /> Datos demo</Badge>}
          <DataModeToggle mode={mode} onChange={changeMode} liveEnabled={liveEnabled} />
        </>
      }
    >
      {/* Filtros */}
      <Card className="p-4 sm:p-5">
        <FiltersBar value={filters} onChange={setFilters} departments={departments} />
      </Card>

      {loading && <DashboardSkeleton />}

      {!loading && error && (
        <Card className="border-destructive/30 bg-destructive/5 p-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">No se pudieron cargar los datos en vivo</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => changeMode('demo')}>
              Ver en modo demo
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Resumen de la organización */}
          {orgKanon ? (
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-risk-yellow" />
                <div>
                  <p className="font-semibold">Datos globales suprimidos por K-anonimidad</p>
                  <p className="text-sm text-muted-foreground">
                    El periodo seleccionado tiene menos de 5 personas únicas. Amplía el rango de fechas o quita filtros para ver agregados.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1.4fr]">
              <Card className="p-6">
                <SectionTitle
                  title="Índice de riesgo global"
                  description="CoPsoQ·istas21 · agregado K-anónimo"
                  icon={<Gauge className="h-5 w-5" />}
                />
                <div className="flex flex-col items-center gap-4">
                  <RiskGauge value={orgTotal?.avg_risk_index ?? null} />
                  <div className="w-full">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Factores del índice
                    </p>
                    <DriversBreakdown drivers={orgTotal?.drivers ?? null} />
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
                <KpiCard
                  label="Índice medio"
                  value={fmtInt(orgTotal?.avg_risk_index ?? null)}
                  unit="/ 100"
                  hint="Riesgo psicosocial agregado"
                  icon={<Gauge className="h-4 w-4" />}
                  tone={orgColor === 'green' ? 'green' : orgColor === 'red' ? 'red' : 'yellow'}
                />
                <KpiCard
                  label="En riesgo alto"
                  value={orgTotal?.pct_high_risk ?? '—'}
                  unit="%"
                  hint="Sesiones con índice ≥ 50"
                  icon={<Zap className="h-4 w-4" />}
                  tone={(orgTotal?.pct_high_risk ?? 0) > 20 ? 'red' : 'green'}
                />
                <KpiCard
                  label="Participantes"
                  value={fmtInt(orgTotal?.count_unique_users ?? null)}
                  hint="Personas únicas (≥ K=5)"
                  icon={<Users className="h-4 w-4" />}
                />
                <KpiCard
                  label="Sesiones"
                  value={fmtInt(orgTotal?.count ?? null)}
                  hint="Tests completados"
                  icon={<Activity className="h-4 w-4" />}
                />
              </div>
            </div>
          )}

          {/* Proyección de tendencia (Predictivo) */}
          <Card className="p-6">
            <PredictiveForecast groups={data.groups} />
          </Card>

          {/* Conclusiones + Alertas */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Card className="p-6">
              <SectionTitle
                title="Conclusiones automáticas"
                description="Qué pasa y qué hacer al respecto"
                icon={<Lightbulb className="h-5 w-5" />}
              />
              <InsightsPanel data={data} />
            </Card>
            <Card className="p-6">
              <SectionTitle
                title="Alertas por equipo"
                description="Grupos que requieren acción"
                icon={<AlertCircle className="h-5 w-5" />}
              />
              <AlertsPanel segments={data.segments} />
            </Card>
          </div>

          {/* Tendencia + Riesgo por departamento */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Card className="p-6">
              <SectionTitle
                title="Tendencia semanal"
                description="Evolución del índice por departamento"
                icon={<LineChartIcon className="h-5 w-5" />}
              />
              <TrendChart groups={data.groups} />
            </Card>
            <Card className="p-6">
              <SectionTitle
                title="Riesgo por departamento"
                description="Ordenado de mayor a menor"
                icon={<Layers className="h-5 w-5" />}
              />
              <RiskBars items={data.groups} asDepartment />
            </Card>
          </div>

          {/* Segmentación + Mapa de calor */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <SectionTitle
                title="Segmentación"
                description="Riesgo por turno, género, edad y antigüedad"
                icon={<Layers className="h-5 w-5" />}
              />
              <SegmentsTabs segments={data.segments} />
            </Card>
            <Card className="p-6">
              <SectionTitle
                title="Mapa de calor"
                description="Cruces multidimensionales · celdas K-anónimas"
                icon={<Layers className="h-5 w-5" />}
              />
              <HeatmapGrid heatmaps={data.heatmaps} />
            </Card>
          </div>

          {/* Tabla detallada */}
          <Card className="p-6">
            <SectionTitle
              title="Detalle por departamento"
              description="Métricas completas con factor dominante y tendencia"
              icon={<TableIcon className="h-5 w-5" />}
            />
            <DepartmentTable groups={data.groups} />
          </Card>

          {/* Comparativa sectorial (Benchmark) */}
          <Card className="p-6">
            <IndustryBenchmark benchmark={data.benchmark} />
          </Card>

          <p className="pb-4 text-center text-xs text-muted-foreground/60">
            PulsePath · metodología CoPsoQ·istas21 · K-anonimidad K=5 ·{' '}
            {mode === 'demo' ? 'datos sintéticos de demostración' : 'datos en vivo'}
          </p>
        </div>
      )}
    </AppShell>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <Skeleton className="h-80 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
