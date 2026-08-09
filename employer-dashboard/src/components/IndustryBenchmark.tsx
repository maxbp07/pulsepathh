import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GitCompare } from 'lucide-react';
import type { BenchmarkItem } from '@/lib/types';
import { SectionTitle } from '@/components/primitives';
import { cn } from '@/lib/utils';

// Paleta alineada con el resto del dashboard (dark Clinical Intelligence).
const TEAL = '#2dd4bf';
const MONO = "'JetBrains Mono', ui-monospace, monospace";

/**
 * Comparativa sectorial (Benchmark). Barras horizontales emparejadas: tu
 * organización (Teal) vs una referencia ILUSTRATIVA (gris rayado). En todas las
 * categorías, "más alto = peor". Lleva siempre la etiqueta de que la referencia
 * NO procede de un dataset real.
 */
export function IndustryBenchmark({ benchmark }: { benchmark?: BenchmarkItem[] }) {
  if (!benchmark || !benchmark.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin comparativa disponible.</p>;
  }

  // delta > 0 ⇒ peor que la referencia (todas las categorías escaladas así).
  const rows = benchmark.map((b) => ({ ...b, delta: b.ours - b.reference }));

  return (
    <div>
      <SectionTitle
        title="Comparativa sectorial"
        description="Tu organización vs referencia ilustrativa"
        icon={<GitCompare className="h-5 w-5" />}
      />

      {/* Chip de honestidad */}
      <div className="mb-3 flex justify-end">
        <span
          className="rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
          style={{ fontFamily: MONO }}
        >
          REFERENCIA ILUSTRATIVA · NO ES UN DATASET REAL
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          layout="vertical"
          data={rows}
          margin={{ top: 4, right: 24, bottom: 0, left: 8 }}
          barCategoryGap={20}
        >
          <defs>
            <pattern
              id="benchStripe"
              patternUnits="userSpaceOnUse"
              width="5"
              height="5"
              patternTransform="rotate(45)"
            >
              <rect width="5" height="5" fill="#94a3b8" fillOpacity="0.18" />
              <line x1="0" y1="0" x2="0" y2="5" stroke="#cbd5e1" strokeWidth="2.5" />
            </pattern>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 30% 22%)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: 'hsl(220 14% 64%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={128}
            tick={{ fill: 'hsl(228 33% 88%)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'hsl(225 30% 22% / 0.3)' }}
            contentStyle={{
              background: 'hsl(226 43% 9%)',
              border: '1px solid hsl(225 30% 24%)',
              borderRadius: 10,
              fontSize: 12,
              color: 'hsl(228 33% 93%)',
            }}
            labelStyle={{ color: 'hsl(220 14% 64%)' }}
          />
          <Bar dataKey="ours" name="Tu organización" fill={TEAL} radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
          <Bar dataKey="reference" name="Referencia" fill="url(#benchStripe)" radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3 rounded-sm" style={{ background: TEAL }} /> Tu organización
        </span>
        <span
          className="inline-flex h-2.5 w-3 items-center justify-center rounded-sm border border-muted-foreground/40"
          style={{ background: 'repeating-linear-gradient(45deg,#cbd5e1,#cbd5e1 2px,transparent 2px,transparent 4px)' }}
        />
        <span>Referencia</span>
        <span className="ml-auto" style={{ fontFamily: MONO }}>
          escala 0–100 · más alto = peor
        </span>
      </div>

      {/* Deltas vs referencia */}
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
        {rows.map((r) => (
          <div key={r.category} className="text-xs">
            <p className="truncate text-muted-foreground">{r.category}</p>
            <p className="tabular-nums">
              <span className="font-semibold text-foreground">{r.ours}</span>
              <span className="text-muted-foreground/60"> vs {r.reference}</span>{' '}
              <span className={cn('font-semibold', r.delta > 0 ? 'text-risk-red' : 'text-risk-green')}>
                {r.delta > 0 ? '↑' : '↓'}{Math.abs(r.delta)}
              </span>
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[10px] text-muted-foreground/60" style={{ fontFamily: MONO }}>
        Referencia ilustrativa · valores orientativos (no de un dataset real).
      </p>
    </div>
  );
}
