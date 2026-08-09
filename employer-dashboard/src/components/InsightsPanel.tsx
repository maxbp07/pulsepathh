import { Lightbulb } from 'lucide-react';
import { generateInsights } from '@/lib/insights';
import type { DashboardData } from '@/lib/types';

/** Conclusiones y recomendaciones automáticas (motor determinista, no IA). */
export function InsightsPanel({ data }: { data: DashboardData }) {
  const ins = generateInsights(data);

  return (
    <div className="space-y-5">
      <p className="text-lg font-semibold leading-snug tracking-tight">{ins.headline}</p>

      <div className="space-y-1.5">
        {ins.executiveSummary.map((s, i) => (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            {s}
          </p>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Conclusiones
        </p>
        <ul className="space-y-1.5">
          {ins.conclusions.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed">
              <span className="mt-0.5 text-primary">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5 text-risk-yellow" />
          Recomendaciones accionables
        </p>
        <ol className="space-y-1.5">
          {ins.recommendations.map((r, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
              <span className="font-semibold text-primary">{i + 1}.</span>
              <span className={i === ins.recommendations.length - 1 ? 'text-xs italic text-muted-foreground/80' : 'text-muted-foreground'}>
                {r}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
