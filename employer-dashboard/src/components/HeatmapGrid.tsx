import { useState } from 'react';
import { Lock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Heatmap } from '@/lib/types';
import { formatHeatmapTitle, formatValue } from '@/lib/format';
import { fmtNum } from '@/lib/utils';
import { cn } from '@/lib/utils';

/** Color de celda por índice de riesgo (gradiente verde→amarillo→rojo). */
function cellStyle(avgRisk: number | null | undefined): React.CSSProperties {
  if (typeof avgRisk !== 'number' || !Number.isFinite(avgRisk)) {
    return { background: 'hsl(var(--muted))' };
  }
  // Verde (152) → Amarillo (43) → Rojo (349): interpolación simple por umbrales.
  const v = Math.max(0, Math.min(100, avgRisk));
  let h: number, s: number, l: number;
  if (v < 35) {
    h = 152; s = 69; l = 28 + (v / 35) * 18;
  } else if (v < 50) {
    const t = (v - 35) / 15;
    h = 152 - t * 109; s = 69 + t * 27; l = 46;
  } else {
    const t = Math.min(1, (v - 50) / 50);
    h = 43 - t * 6; s = 96; l = 46 - t * 8;
  }
  const opacity = 0.35 + (v / 100) * 0.55;
  return { background: `hsla(${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}% / ${opacity.toFixed(2)})` };
}

export function HeatmapGrid({ heatmaps }: { heatmaps: Heatmap[] }) {
  const [idx, setIdx] = useState(0);
  if (!heatmaps || !heatmaps.length) {
    return <p className="text-sm text-muted-foreground">Sin mapas de calor.</p>;
  }
  const hm = heatmaps[Math.min(idx, heatmaps.length - 1)];

  return (
    <div>
      <Select value={String(idx)} onValueChange={(v) => setIdx(Number(v))}>
        <SelectTrigger className="mb-4 w-[260px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {heatmaps.map((h, i) => (
            <SelectItem key={`${h.rowKey}-${h.colKey}`} value={String(i)}>
              {formatHeatmapTitle(h.rowKey, h.colKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: '3px' }}>
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-medium text-muted-foreground">
                {formatValue(hm.rowKey, hm.rowKey)} ↓ / {formatValue(hm.colKey, hm.colKey)} →
              </th>
              {hm.cols.map((c) => (
                <th key={c} className="p-2 text-center text-xs font-medium text-muted-foreground">
                  {formatValue(hm.colKey, c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hm.rows.map((r) => (
              <tr key={r}>
                <td className="p-2 text-right text-xs font-medium text-muted-foreground">
                  {formatValue(hm.rowKey, r)}
                </td>
                {hm.cols.map((c) => {
                  const cell = hm.cells.find((x) => x.row === r && x.col === c);
                  if (!cell || cell.empty) {
                    return (
                      <td key={c} className="h-14 w-20 rounded-md bg-muted/30 text-center text-muted-foreground/40">
                        ·
                      </td>
                    );
                  }
                  if (cell.kanon_protected) {
                    return (
                      <TooltipProvider key={c} delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <td className="flex h-14 w-20 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                              <Lock className="h-3.5 w-3.5" />
                            </td>
                          </TooltipTrigger>
                          <TooltipContent>Suprimido (K-anonimidad &lt; 5)</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }
                  return (
                    <TooltipProvider key={c} delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <td
                            className={cn(
                              'flex h-14 w-20 cursor-default flex-col items-center justify-center rounded-md text-center',
                            )}
                            style={cellStyle(cell.avg_risk_index)}
                          >
                            <span className="text-sm font-bold tabular-nums text-white drop-shadow">
                              {fmtNum(cell.avg_risk_index, 0)}
                            </span>
                            <span className="text-[10px] text-white/80">{cell.count_unique_users}p</span>
                          </td>
                        </TooltipTrigger>
                        <TooltipContent>
                          {formatValue(hm.rowKey, r)} × {formatValue(hm.colKey, c)} ·{' '}
                          {fmtNum(cell.avg_risk_index, 0)} riesgo · {cell.pct_high_risk ?? 0}% alto
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
