import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Segment, SegmentDimension } from '@/lib/types';
import { formatValue } from '@/lib/format';
import { RiskBadge } from './primitives';

interface AlertItem {
  dimension: SegmentDimension;
  group: string;
  risk: number;
  pctHigh: number;
}

function collectAlerts(segments: Record<SegmentDimension, Segment[]>): AlertItem[] {
  const out: AlertItem[] = [];
  (['department', 'shift'] as SegmentDimension[]).forEach((dim) => {
    for (const s of segments[dim] || []) {
      if (s.kanon_protected) continue;
      const risk = s.avg_risk_index ?? 0;
      const pct = s.pct_high_risk ?? 0;
      if (risk >= 50 || pct > 20) {
        out.push({ dimension: dim, group: s.group, risk, pctHigh: pct });
      }
    }
  });
  return out.sort((a, b) => b.risk - a.risk);
}

/** Equipos / turnos que superan el umbral de riesgo alto (≥50) o 20% en riesgo. */
export function AlertsPanel({ segments }: { segments: Record<SegmentDimension, Segment[]> }) {
  const alerts = collectAlerts(segments);

  if (!alerts.length) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-risk-green/25 bg-risk-green/5 px-4 py-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-risk-green" />
        <div>
          <p className="text-sm font-semibold text-risk-green">Sin alertas activas</p>
          <p className="text-xs text-muted-foreground">
            Ningún grupo visible supera el umbral de riesgo alto (≥50) ni el 20% de plantilla en riesgo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((a) => (
        <div
          key={`${a.dimension}-${a.group}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-risk-red/25 bg-risk-red/5 px-4 py-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-red" />
            <div>
              <p className="text-sm font-semibold">{formatValue(a.dimension, a.group)}</p>
              <p className="text-xs text-muted-foreground">
                {a.pctHigh}% de la plantilla en riesgo alto · índice {Math.round(a.risk)}/100
              </p>
            </div>
          </div>
          <RiskBadge value={a.risk} />
        </div>
      ))}
    </div>
  );
}
