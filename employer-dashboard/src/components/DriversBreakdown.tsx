import type { Drivers, DriverKey } from '@/lib/types';
import { DRIVER_LABELS } from '@/lib/format';
import { cn } from '@/lib/utils';

const DRIVER_COLORS: Record<DriverKey, string> = {
  pvt: 'bg-brand-teal',
  stroop: 'bg-brand-indigo',
  cbi: 'bg-risk-red',
  sleep: 'bg-risk-yellow',
};

/** Desglose de los 4 drivers (PVT / Stroop / CBI / Sueño) como % de contribución. */
export function DriversBreakdown({ drivers }: { drivers: Drivers | null | undefined }) {
  if (!drivers) {
    return <p className="text-sm text-muted-foreground">Sin desglose de factores.</p>;
  }
  const keys: DriverKey[] = ['pvt', 'stroop', 'cbi', 'sleep'];
  return (
    <div className="space-y-3.5">
      {keys.map((k) => {
        const v = drivers[k] ?? 0;
        const isDom = drivers.dominant === k;
        return (
          <div key={k}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                {DRIVER_LABELS[k]}
                {isDom && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                    dominante
                  </span>
                )}
              </span>
              <span className="tabular-nums text-muted-foreground">{v}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn('h-full rounded-full', DRIVER_COLORS[k])}
                style={{ width: `${Math.max(2, v)}%`, transition: 'width 0.6s ease' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
