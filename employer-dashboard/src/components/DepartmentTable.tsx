import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { DepartmentGroup } from '@/lib/types';
import { formatDepartment, DRIVER_LABELS_SHORT } from '@/lib/format';
import { RiskBadge, RiskDot } from './primitives';
import { fmtNum } from '@/lib/utils';

function TrendCell({ trend }: { trend?: number[] }) {
  if (!Array.isArray(trend) || trend.length < 2) {
    return <span className="text-muted-foreground/40">—</span>;
  }
  const first = trend[0];
  const last = trend[trend.length - 1];
  const delta = last - first;
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-risk-red">
        <TrendingUp className="h-3.5 w-3.5" /> ↑ {fmtNum(last, 0)}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-risk-green">
        <TrendingDown className="h-3.5 w-3.5" /> ↓ {fmtNum(last, 0)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Minus className="h-3.5 w-3.5" /> {fmtNum(last, 0)}
    </span>
  );
}

/** Tabla detallada por departamento con K-anonimidad y tendencia. */
export function DepartmentTable({ groups }: { groups: DepartmentGroup[] }) {
  const visible = groups
    .filter((g) => !g.kanon_protected)
    .sort((a, b) => (b.avg_risk_index ?? 0) - (a.avg_risk_index ?? 0));
  const protectedRows = groups.filter((g) => g.kanon_protected);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Departamento</th>
            <th className="py-2 pr-4 font-medium">Personas</th>
            <th className="py-2 pr-4 font-medium">Riesgo medio</th>
            <th className="py-2 pr-4 font-medium">% riesgo alto</th>
            <th className="py-2 pr-4 font-medium">Factor</th>
            <th className="py-2 font-medium">Tendencia</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((g) => (
            <tr key={g.department} className="border-b border-border/50 transition-colors hover:bg-secondary/40">
              <td className="py-3 pr-4">
                <span className="flex items-center gap-2 font-medium">
                  <RiskDot value={g.avg_risk_index} />
                  {formatDepartment(g.department)}
                </span>
              </td>
              <td className="py-3 pr-4 tabular-nums text-muted-foreground">{g.count_unique_users ?? '—'}</td>
              <td className="py-3 pr-4">
                <RiskBadge value={g.avg_risk_index} showValue />
              </td>
              <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                {typeof g.pct_high_risk === 'number' ? `${g.pct_high_risk}%` : '—'}
              </td>
              <td className="py-3 pr-4 text-muted-foreground">
                {g.drivers?.dominant ? DRIVER_LABELS_SHORT[g.drivers.dominant] : '—'}
              </td>
              <td className="py-3">
                <TrendCell trend={g.trend} />
              </td>
            </tr>
          ))}
          {protectedRows.map((g) => (
            <tr key={`${g.department}-p`} className="border-b border-border/50 text-muted-foreground/70">
              <td className="py-3 pr-4">{formatDepartment(g.department)}</td>
              <td colSpan={5} className="py-3 text-xs italic">
                🔒 Suprimido (K-anonimidad &lt; 5 personas únicas)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
