import { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { DepartmentGroup, Forecast } from '@/lib/types';
import { formatDepartment } from '@/lib/format';
import { SectionTitle } from '@/components/primitives';
import { semaphoreMeta } from '@/lib/semaphore';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Paleta alineada con TrendChart.tsx (dark "Clinical Intelligence").
const TEAL = '#2dd4bf';
const RED = 'hsl(349 89% 60%)';
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const HISTORICAL_WEEKS = 8; // W1–W8 históricas · W9–W12 proyectadas

interface Row {
  week: string;
  hist: number | null;
  proj: number | null;
  band: [number, number] | null; // [ciLower, ciUpper] solo en semanas proyectadas
}

function buildSeries(trend: number[], forecast: Forecast | null): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < HISTORICAL_WEEKS; i += 1) {
    rows.push({ week: `W${i + 1}`, hist: trend[i] ?? null, proj: null, band: null });
  }
  // Continuidad: la proyección arranca desde la última semana histórica (W8).
  const last = trend[trend.length - 1];
  if (rows.length) rows[HISTORICAL_WEEKS - 1].proj = typeof last === 'number' ? last : null;

  if (forecast) {
    forecast.predicted.forEach((p, k) => {
      const idx = HISTORICAL_WEEKS + k; // W9 → idx 8
      rows.push({
        week: `W${idx + 1}`,
        hist: null,
        proj: p,
        band: [forecast.ciLower[k], forecast.ciUpper[k]],
      });
    });
  }
  return rows;
}

/**
 * Proyección de tendencia (NO es un modelo predictivo).
 * Extrapolación lineal del histórico (8 sem) + cono de incertidumbre + umbral
 * de burnout. El banner de alerta se DERIVA de `forecast.crossWeek` (nada
 * hardcodeado). Lleva siempre chip de honestidad.
 */
export function PredictiveForecast({ groups }: { groups: DepartmentGroup[] }) {
  const usable = useMemo(
    () =>
      groups
        .filter((g) => !g.kanon_protected && Array.isArray(g.trend) && g.trend.length >= 2 && g.forecast)
        .sort((a, b) => (b.avg_risk_index ?? 0) - (a.avg_risk_index ?? 0)),
    [groups],
  );

  const [selected, setSelected] = useState<string | null>(null);
  const current = useMemo(() => {
    if (!usable.length) return null;
    const dept = selected ?? usable[0].department;
    return usable.find((g) => g.department === dept) ?? usable[0];
  }, [usable, selected]);

  if (!current || !current.trend || !current.forecast) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin proyección disponible (necesita al menos 2 semanas de datos).
      </p>
    );
  }

  const data = buildSeries(current.trend, current.forecast);
  const crossWeek = current.forecast.crossWeek;
  const daysAhead = crossWeek !== null ? (crossWeek - (HISTORICAL_WEEKS - 1)) * 7 : null;
  const m = semaphoreMeta(current.avg_risk_index ?? null);

  // Banner HONESTO: distingue "ya está en burnout" de "cruzará en el futuro".
  // Nunca afirma un cruce futuro si el departamento ya supera el umbral.
  const lastHist = current.trend.length ? current.trend[current.trend.length - 1] : null;
  let banner: { prefix: string; text: string; tone: 'red' | 'yellow' } | null = null;
  if (typeof lastHist === 'number' && lastHist >= 50) {
    banner = {
      prefix: '⚠️ Alerta:',
      tone: 'red',
      text: `${formatDepartment(current.department)} ya está en zona de burnout (índice ${lastHist.toFixed(
        1,
      )}). La proyección indica que se mantiene por encima del umbral en las próximas 4 semanas.`,
    };
  } else if (crossWeek !== null && daysAhead !== null) {
    banner = {
      prefix: '⚠️ Proyección:',
      tone: 'red',
      text: `si la tendencia actual continúa, ${formatDepartment(
        current.department,
      )} cruza el umbral de burnout en ~W${crossWeek + 1} (≈ ${daysAhead} días).`,
    };
  }

  return (
    <div>
      <SectionTitle
        title="Proyección de tendencia"
        description="Extrapolación lineal del histórico · NO es un modelo predictivo"
        icon={<TrendingUp className="h-5 w-5" />}
        action={
          <Select value={current.department} onValueChange={setSelected}>
            <SelectTrigger className="w-[210px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {usable.map((g) => (
                <SelectItem key={g.department} value={g.department}>
                  {formatDepartment(g.department)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Chip de honestidad */}
      <div className="mb-3 flex justify-end">
        <span
          className="rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
          style={{ fontFamily: MONO }}
        >
          PROYECCIÓN · NO MODELO PREDICTIVO · datos demo
        </span>
      </div>

      {/* Banner HONESTO: "ya en burnout" o "cruza en el futuro" (nunca ambos) */}
      {banner && (
        <div
          className={cn(
            'mb-3 rounded-lg border px-4 py-2.5 text-sm',
            banner.tone === 'red'
              ? 'border-risk-red/30 bg-risk-red/10'
              : 'border-risk-yellow/30 bg-risk-yellow/10',
          )}
        >
          <span
            className={cn(
              'font-semibold',
              banner.tone === 'red' ? 'text-risk-red' : 'text-risk-yellow',
            )}
          >
            {banner.prefix}
          </span>{' '}
          <span className="text-foreground">{banner.text}</span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="coneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEAL} stopOpacity={0.22} />
              <stop offset="100%" stopColor={TEAL} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 30% 22%)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: 'hsl(220 14% 64%)', fontSize: 11 }}
            axisLine={{ stroke: 'hsl(225 30% 22%)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'hsl(220 14% 64%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(226 43% 9%)',
              border: '1px solid hsl(225 30% 24%)',
              borderRadius: 10,
              fontSize: 12,
              color: 'hsl(228 33% 93%)',
            }}
            labelStyle={{ color: 'hsl(220 14% 64%)' }}
            formatter={(value, name) => {
              if (name === 'Incertidumbre') return null as unknown as [string, string];
              const v = Array.isArray(value) ? value : (value as number);
              return [typeof v === 'number' ? v.toFixed(1) : v, name];
            }}
          />
          {/* Cono de incertidumbre (solo W9–W12) */}
          <Area dataKey="band" name="Incertidumbre" stroke="none" fill="url(#coneGrad)" connectNulls={false} />
          {/* Umbral de burnout CoPsoQ */}
          <ReferenceLine
            y={50}
            stroke={RED}
            strokeDasharray="5 4"
            strokeOpacity={0.5}
            label={{ value: 'Burnout (50)', fill: RED, fontSize: 10, position: 'insideTopRight' }}
          />
          {/* Histórico W1–W8 (sólido) */}
          <Line
            dataKey="hist"
            name="Histórico"
            stroke={TEAL}
            strokeWidth={2.5}
            dot={{ r: 2.5, strokeWidth: 0, fill: TEAL }}
            connectNulls={false}
            isAnimationActive={false}
          />
          {/* Proyección W8–W12 (discontinua) */}
          <Line
            dataKey="proj"
            name="Proyección"
            stroke={TEAL}
            strokeWidth={2.5}
            strokeDasharray="6 5"
            dot={{ r: 2.5, strokeWidth: 0, fill: TEAL }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: TEAL }} /> Histórico (8 sem)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed" style={{ borderColor: TEAL }} />
          Proyección
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3 rounded-sm" style={{ background: `${TEAL}33` }} /> Incertidumbre
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: RED }} /> Umbral burnout
        </span>
        <span className="ml-auto" style={{ fontFamily: MONO }}>
          {formatDepartment(current.department)} · índice {current.avg_risk_index ?? '—'} ·{' '}
          {m.short.toLowerCase()}
        </span>
      </div>
    </div>
  );
}
