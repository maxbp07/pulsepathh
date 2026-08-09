import type { DepartmentGroup, Segment } from '@/lib/types';
import { formatDepartment, formatValue } from '@/lib/format';
import { semaphoreMeta } from '@/lib/semaphore';
import { fmtNum } from '@/lib/utils';
import { cn } from '@/lib/utils';

/** Barras horizontales de riesgo (0-100) con color de semáforo. */
export function RiskBars({
  items,
  dimension,
  asDepartment = false,
}: {
  items: (DepartmentGroup | Segment)[];
  dimension?: string;
  asDepartment?: boolean;
}) {
  const visible = items
    .filter((g) => !g.kanon_protected && typeof g.avg_risk_index === 'number')
    .sort((a, b) => (b.avg_risk_index ?? 0) - (a.avg_risk_index ?? 0));

  if (!visible.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sin datos visibles (K-anonimidad).</p>;
  }

  return (
    <div className="space-y-4">
      {visible.map((g) => {
        const risk = g.avg_risk_index ?? 0;
        const m = semaphoreMeta(risk);
        const label = asDepartment
          ? formatDepartment((g as DepartmentGroup).department)
          : formatValue(dimension ?? '', (g as Segment).group);
        return (
          <div key={label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">{label}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{g.count_unique_users ?? 0} pers.</span>
                <span className={cn('font-semibold tabular-nums', m.text)}>{fmtNum(risk, 1)}</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn('h-full rounded-full', m.fill)}
                style={{ width: `${risk}%`, transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
