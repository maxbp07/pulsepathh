import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { fmtNum, fmtInt } from '@/lib/utils';
import { semaphoreMeta } from '@/lib/semaphore';
import { Card } from '@/components/ui/card';

/** Píldora de semáforo (color + etiqueta) para un índice de riesgo. */
export function RiskBadge({
  value,
  showValue = false,
  className,
}: {
  value: number | null | undefined;
  showValue?: boolean;
  className?: string;
}) {
  const m = semaphoreMeta(value);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        m.soft,
        m.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', m.fill)} />
      {showValue ? `${fmtNum(value)} · ${m.short}` : m.label}
    </span>
  );
}

/** Punto de color de semáforo. */
export function RiskDot({ value, className }: { value: number | null | undefined; className?: string }) {
  const m = semaphoreMeta(value);
  return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', m.fill, className)} />;
}

/** Tarjeta KPI premium con valor grande. */
export function KpiCard({
  label,
  value,
  unit,
  hint,
  icon,
  tone = 'default',
  children,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'green' | 'yellow' | 'red';
  children?: ReactNode;
}) {
  const toneText = {
    default: 'text-foreground',
    green: 'text-risk-green',
    yellow: 'text-risk-yellow',
    red: 'text-risk-red',
  }[tone];
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground/80">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={cn('text-3xl font-bold tracking-tight tabular-nums', toneText)}>{value}</span>
        {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </Card>
  );
}

/** Gauge semicircular premium para el índice de riesgo global (0-100). */
export function RiskGauge({
  value,
  size = 220,
}: {
  value: number | null | undefined;
  size?: number;
}) {
  const v = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const m = semaphoreMeta(value);
  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r;
  const dash = (v / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 28 }}>
        <svg width={size} height={size / 2 + 28} className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={m.hex} stopOpacity="0.6" />
              <stop offset="100%" stopColor={m.hex} />
            </linearGradient>
          </defs>
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-5xl font-bold tracking-tight tabular-nums" style={{ color: m.hex }}>
            {fmtInt(value)}
          </span>
          <span className="text-xs text-muted-foreground">índice / 100</span>
        </div>
      </div>
      <div
        className={cn(
          'mt-1 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold',
          m.soft,
          m.text,
        )}
      >
        <span className={cn('h-2 w-2 rounded-full', m.fill)} />
        {m.label}
      </div>
    </div>
  );
}

/** Título de sección con icono y descripción opcional. */
export function SectionTitle({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        {icon && <span className="mt-0.5 text-primary">{icon}</span>}
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
