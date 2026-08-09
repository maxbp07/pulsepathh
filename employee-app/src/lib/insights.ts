import type { DashboardData, DepartmentGroup, DriverKey, Segment } from './types';
import { semaphoreColor } from './semaphore';
import { formatDepartment } from './format';

// Port fiel de backend/src/reports/insights.js a TypeScript.
// Motor determinista (NO IA) que convierte los agregados K-anónimos en titulares,
// conclusiones por severidad y recomendaciones accionables (Ley 31/1995).

const TREND_DELTA = 8;
const DEPT_HIGH_RISK_PCT = 20;
const DEPT_ABOVE_MEAN = 15;
const LOW_ADHERENCE_PCT = 60;
const SLEEP_LOW_HOURS = 6;
const SLEEP_LOW_PENALTY = 50;

const W: Record<DriverKey, number> = { pvt: 0.4, stroop: 0.25, cbi: 0.25, sleep: 0.1 };
const SEVERITY_RANK: Record<Severity, number> = { red: 3, yellow: 2, green: 1 };

const DISCLAIMER =
  'Las recomendaciones son orientativas y de apoyo a la gestión preventiva; ' +
  'no sustituyen la evaluación de riesgos psicosociales ni el criterio del ' +
  'Servicio de Prevención.';

type Severity = 'red' | 'yellow' | 'green';
export interface RuleResult {
  severity: Severity;
  text: string;
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const round = (n: number, d = 0) => {
  const f = 10 ** d;
  return Math.round((Number(n) || 0) * f) / f;
};

interface GroupLike extends DepartmentGroup {}

function weightedAvg(groups: GroupLike[], field: string): number | null {
  let num = 0;
  let den = 0;
  for (const g of groups) {
    const v = (g as unknown as Record<string, unknown>)[field];
    const w = isNum(g.count) ? g.count : 1;
    if (isNum(v)) {
      num += v * w;
      den += w;
    }
  }
  return den > 0 ? num / den : null;
}

function sleepPenaltyFromHours(hours: number | null): number | null {
  if (!isNum(hours)) return null;
  if (hours >= 7) return 0;
  if (hours >= 5) return 25;
  if (hours >= 4) return 50;
  return 75;
}

interface DriversResult {
  pvt: number;
  stroop: number;
  cbi: number;
  sleep: number;
  dominant: DriverKey;
  sleepLow: boolean;
}

function computeDrivers(visible: GroupLike[], avgRisk: number | null): DriversResult {
  const empty: DriversResult = { pvt: 0, stroop: 0, cbi: 0, sleep: 0, dominant: 'pvt', sleepLow: false };
  if (!visible.length || !isNum(avgRisk)) return empty;

  const avgPvt = weightedAvg(visible, 'avg_pvt_index');
  const avgStroop = weightedAvg(visible, 'avg_stroop_index');
  const avgCbi =
    weightedAvg(visible, 'avg_cbi_score') ?? weightedAvg(visible, 'avg_cbi_index');
  let sleepPenalty =
    weightedAvg(visible, 'avg_sleep_penalty') ??
    sleepPenaltyFromHours(weightedAvg(visible, 'avg_sleep_hours'));
  const sleepHours = weightedAvg(visible, 'avg_sleep_hours');

  const cPvt = isNum(avgPvt) ? W.pvt * avgPvt : 0;
  const cStroop = isNum(avgStroop) ? W.stroop * avgStroop : 0;
  let cCbi: number | null = isNum(avgCbi) ? W.cbi * avgCbi : null;
  let cSleep: number | null = isNum(sleepPenalty) ? W.sleep * sleepPenalty : null;

  const residual = Math.max(0, (avgRisk ?? 0) - cPvt - cStroop - (cCbi || 0) - (cSleep || 0));
  if (cCbi === null && cSleep === null) {
    const wSum = W.cbi + W.sleep;
    cCbi = residual * (W.cbi / wSum);
    cSleep = residual * (W.sleep / wSum);
  } else if (cCbi === null) {
    cCbi = residual;
  } else if (cSleep === null) {
    cSleep = residual;
  }

  const total = cPvt + cStroop + (cCbi || 0) + (cSleep || 0) || 1;
  const shares = {
    pvt: round((cPvt / total) * 100, 1),
    stroop: round((cStroop / total) * 100, 1),
    cbi: round(((cCbi || 0) / total) * 100, 1),
    sleep: round(((cSleep || 0) / total) * 100, 1),
  };
  const contributions = { pvt: cPvt, stroop: cStroop, cbi: cCbi || 0, sleep: cSleep || 0 };
  const dominant = (Object.keys(contributions) as DriverKey[]).reduce((a, b) =>
    contributions[b] > contributions[a] ? b : a,
  );

  const inferredPenalty = isNum(sleepPenalty) ? sleepPenalty : (cSleep || 0) / W.sleep;
  const sleepLow = isNum(sleepHours) ? sleepHours < SLEEP_LOW_HOURS : inferredPenalty >= SLEEP_LOW_PENALTY;

  return { ...shares, dominant, sleepLow };
}

interface Aggregates {
  groups: DepartmentGroup[];
  visible: DepartmentGroup[];
  protectedCount: number;
  hasData: boolean;
  avgRisk: number | null;
  pctHighRisk: number | null;
  totalCount: number;
  trendDelta: number | null;
  drivers: DriversResult;
  adherencePct: number | null;
}

function computeAggregates(
  dashboardData: DashboardData,
  trendSeries?: number[],
  previousAvgRisk?: number,
  adherencePct?: number,
): Aggregates {
  const groups = Array.isArray(dashboardData.groups) ? dashboardData.groups : [];
  const orgTotal = dashboardData.org_total || {};

  const visible = groups.filter((g) => g && !g.kanon_protected);
  const protectedCount = groups.length - visible.length;

  const avgRisk = isNum(orgTotal.avg_risk_index)
    ? orgTotal.avg_risk_index
    : weightedAvg(visible, 'avg_risk_index');
  const pctHighRisk = isNum(orgTotal.pct_high_risk)
    ? orgTotal.pct_high_risk
    : weightedAvg(visible, 'pct_high_risk');
  const totalCount = isNum(orgTotal.count)
    ? orgTotal.count
    : visible.reduce((a, g) => a + (isNum(g.count) ? g.count : 0), 0);
  const hasData = visible.length > 0 && isNum(avgRisk);

  let trendDelta: number | null = null;
  if (isNum(previousAvgRisk) && isNum(avgRisk)) {
    trendDelta = avgRisk - previousAvgRisk;
  } else if (Array.isArray(trendSeries) && trendSeries.length >= 2) {
    trendDelta = trendSeries[trendSeries.length - 1] - trendSeries[0];
  } else {
    const withTrend = visible.filter((g) => Array.isArray(g.trend) && g.trend.length >= 2);
    if (withTrend.length) {
      const first = weightedAvg(
        withTrend.map((g) => ({ count: g.count ?? 1, avg_risk_index: g.trend![0] } as unknown as DepartmentGroup)),
        'avg_risk_index',
      );
      const last = weightedAvg(
        withTrend.map((g) => ({ count: g.count ?? 1, avg_risk_index: g.trend![g.trend!.length - 1] } as unknown as DepartmentGroup)),
        'avg_risk_index',
      );
      if (isNum(first) && isNum(last)) trendDelta = last - first;
    }
  }

  return {
    groups,
    visible,
    protectedCount,
    hasData,
    avgRisk: isNum(avgRisk) ? avgRisk : null,
    pctHighRisk: isNum(pctHighRisk) ? pctHighRisk : null,
    totalCount,
    trendDelta: isNum(trendDelta) ? trendDelta : null,
    drivers: computeDrivers(visible, avgRisk),
    adherencePct: isNum(adherencePct) ? adherencePct : null,
  };
}

export function evaluateRules(
  dashboardData: DashboardData,
  opts: { trend?: number[]; previousAvgRisk?: number; adherencePct?: number } = {},
): RuleResult[] {
  const agg = computeAggregates(dashboardData, opts.trend, opts.previousAvgRisk, opts.adherencePct);
  const rules: RuleResult[] = [];

  if (!agg.hasData) {
    rules.push({
      severity: 'yellow',
      text:
        '🟡 Datos insuficientes para informar en este periodo: todos los grupos quedan por debajo del umbral de K-anonimidad (K=5) o no hay sesiones.',
    });
    return sortBySeverity(rules);
  }

  const color = semaphoreColor(agg.avgRisk);
  if (color === 'green') {
    rules.push({ severity: 'green', text: '🟢 El bienestar cognitivo de la plantilla es saludable este periodo.' });
  } else if (color === 'yellow') {
    rules.push({ severity: 'yellow', text: '🟡 El bienestar cognitivo es moderado; conviene vigilar la evolución.' });
  } else {
    rules.push({ severity: 'red', text: '🔴 El nivel de riesgo cognitivo es elevado y requiere atención.' });
  }

  if (isNum(agg.trendDelta)) {
    if (agg.trendDelta >= TREND_DELTA) {
      rules.push({ severity: 'red', text: `⚠️ El riesgo ha aumentado respecto al periodo anterior (+${round(agg.trendDelta)} puntos).` });
    } else if (agg.trendDelta <= -TREND_DELTA) {
      rules.push({ severity: 'green', text: `✅ El riesgo ha mejorado respecto al periodo anterior (−${round(Math.abs(agg.trendDelta))} puntos).` });
    }
  }

  for (const g of agg.visible) {
    if (isNum(g.pct_high_risk) && g.pct_high_risk > DEPT_HIGH_RISK_PCT) {
      rules.push({ severity: 'red', text: `🔴 ${formatDepartment(g.department)} supera el umbral de alerta (${round(g.pct_high_risk)}% en riesgo alto).` });
    }
    if (isNum(g.avg_risk_index) && isNum(agg.avgRisk) && g.avg_risk_index >= agg.avgRisk + DEPT_ABOVE_MEAN) {
      rules.push({ severity: 'yellow', text: `🟡 ${formatDepartment(g.department)} está notablemente por encima de la media (${round(g.avg_risk_index)} vs ${round(agg.avgRisk as number)}).` });
    }
  }

  const d = agg.drivers;
  if (d.dominant === 'cbi') {
    rules.push({ severity: 'red', text: 'El principal factor es el burnout acumulado (no fatiga puntual): el problema es estructural.' });
  } else if (d.dominant === 'pvt' && d.sleepLow) {
    rules.push({ severity: 'yellow', text: 'El principal factor es la fatiga aguda asociada a falta de sueño: probablemente reversible con descanso.' });
  } else if (d.dominant === 'stroop') {
    rules.push({ severity: 'yellow', text: 'Destaca la pérdida de control cognitivo/atencional, asociada a sobrecarga mental.' });
  }

  if (isNum(agg.adherencePct) && agg.adherencePct < LOW_ADHERENCE_PCT) {
    rules.push({ severity: 'yellow', text: `⚠️ La participación es baja (${round(agg.adherencePct)}%); interpreta los resultados con cautela.` });
  }

  return sortBySeverity(rules);
}

function sortBySeverity(rules: RuleResult[]): RuleResult[] {
  return [...rules].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

function buildRecommendations(agg: Aggregates): string[] {
  const recs: string[] = [];
  const add = (t: string) => {
    if (!recs.includes(t)) recs.push(t);
  };
  const d = agg.drivers;

  for (const g of agg.visible) {
    if (isNum(g.pct_high_risk) && g.pct_high_risk > DEPT_HIGH_RISK_PCT) {
      add(`Convocar a ${formatDepartment(g.department)} para una sesión de evaluación de carga de trabajo conforme a la evaluación de riesgos psicosociales.`);
    }
  }
  if (d.dominant === 'cbi') {
    add('Valorar medidas organizativas: redistribución de tareas, refuerzo de plantilla en picos y revisión de objetivos.');
  }
  if (d.dominant === 'pvt' && d.sleepLow) {
    add('Revisar turnos y descansos; considerar formación en higiene del sueño.');
  }
  if (d.dominant === 'stroop') {
    add('Reducir la sobrecarga cognitiva: priorizar tareas, limitar interrupciones y multitarea en los picos.');
  }
  if (isNum(agg.trendDelta) && agg.trendDelta <= -TREND_DELTA) {
    add('Mantener las medidas actuales; documentar como buena práctica para otros departamentos.');
  }
  if (isNum(agg.trendDelta) && agg.trendDelta >= TREND_DELTA) {
    add('Investigar las causas del repunte del periodo y reforzar el seguimiento en las próximas semanas.');
  }
  if (recs.length === 0 && agg.hasData) {
    const color = semaphoreColor(agg.avgRisk);
    add(color === 'green' ? 'Mantener las condiciones actuales y continuar el seguimiento preventivo periódico.' : 'Continuar el seguimiento periódico y reevaluar en el próximo informe.');
  }
  recs.push(DISCLAIMER);
  return recs;
}

export interface Insights {
  headline: string;
  executiveSummary: string[];
  conclusions: string[];
  recommendations: string[];
  drivers: DriversResult;
  semaphore: Severity;
  kpis: { avgRisk: number | null; pctHighRisk: number | null; adherencePct: number | null };
}

export function generateInsights(
  dashboardData: DashboardData,
  opts: { trend?: number[]; previousAvgRisk?: number; adherencePct?: number } = {},
): Insights {
  const agg = computeAggregates(dashboardData, opts.trend, opts.previousAvgRisk, opts.adherencePct);
  const ruleResults = evaluateRules(dashboardData, opts);
  const conclusions = ruleResults.map((r) => r.text);
  const semaphore: Severity = agg.hasData ? semaphoreColor(agg.avgRisk) : 'yellow';

  const headline = buildHeadline(agg, semaphore);
  const executiveSummary = buildExecutiveSummary(agg, semaphore);
  const recommendations = buildRecommendations(agg);

  return {
    headline,
    executiveSummary,
    conclusions,
    recommendations,
    drivers: agg.drivers,
    semaphore,
    kpis: { avgRisk: agg.avgRisk, pctHighRisk: agg.pctHighRisk, adherencePct: agg.adherencePct },
  };
}

function buildHeadline(agg: Aggregates, semaphore: Severity): string {
  if (!agg.hasData) return 'Datos insuficientes para informar (K-anonimidad).';
  const stateText: Record<Severity, string> = {
    green: 'Bienestar cognitivo saludable 🟢',
    yellow: 'Riesgo cognitivo moderado 🟡',
    red: 'Riesgo cognitivo elevado 🔴',
  };
  let trendText = '';
  if (isNum(agg.trendDelta)) {
    if (agg.trendDelta >= TREND_DELTA) trendText = ` — empeora (+${round(agg.trendDelta)} pts)`;
    else if (agg.trendDelta <= -TREND_DELTA) trendText = ` — mejora (−${round(Math.abs(agg.trendDelta))} pts)`;
    else trendText = ' — estable';
  }
  return `${stateText[semaphore]} (índice medio ${round(agg.avgRisk as number)})${trendText}.`;
}

function buildExecutiveSummary(agg: Aggregates, semaphore: Severity): string[] {
  if (!agg.hasData) {
    return [
      'No hay suficientes datos para emitir conclusiones en este periodo.',
      'Todos los grupos quedan por debajo del umbral de K-anonimidad (K=5) o no se han registrado sesiones.',
    ];
  }
  const summary: string[] = [];
  const stateSentence: Record<Severity, string> = {
    green: 'El bienestar cognitivo de la plantilla se sitúa en niveles saludables durante el periodo analizado.',
    yellow: 'El bienestar cognitivo de la plantilla se sitúa en niveles moderados; conviene vigilar la evolución.',
    red: 'El nivel de riesgo cognitivo de la plantilla es elevado y requiere atención preventiva.',
  };
  summary.push(stateSentence[semaphore]);

  const kpiParts = [`índice de riesgo medio de ${round(agg.avgRisk as number)}/100`];
  if (isNum(agg.pctHighRisk)) kpiParts.push(`${round(agg.pctHighRisk)}% de la plantilla en riesgo alto`);
  if (isNum(agg.adherencePct)) kpiParts.push(`adherencia del ${round(agg.adherencePct)}%`);
  summary.push(`Indicadores clave: ${kpiParts.join(', ')}.`);

  if (isNum(agg.trendDelta)) {
    if (agg.trendDelta >= TREND_DELTA) summary.push(`La tendencia empeora respecto al periodo anterior (+${round(agg.trendDelta)} puntos).`);
    else if (agg.trendDelta <= -TREND_DELTA) summary.push(`La tendencia mejora respecto al periodo anterior (−${round(Math.abs(agg.trendDelta))} puntos).`);
    else summary.push('La tendencia se mantiene estable respecto al periodo anterior.');
  }

  const d = agg.drivers;
  const driverSentence: Record<DriverKey, string | undefined> = {
    cbi: 'El factor predominante es el burnout acumulado, lo que apunta a un problema de carácter estructural.',
    pvt: d.sleepLow
      ? 'El factor predominante es la fatiga aguda asociada a la falta de sueño, probablemente reversible con descanso.'
      : 'El factor predominante es la fatiga atencional medida por el test de vigilancia psicomotora (PVT).',
    stroop: 'El factor predominante es la pérdida de control cognitivo, asociada a sobrecarga mental.',
    sleep: 'El factor predominante es el déficit de sueño de la plantilla.',
  };
  if (driverSentence[d.dominant]) summary.push(driverSentence[d.dominant]!);

  return summary.slice(0, 4);
}

// Segment helpers exportados para el frontend (tarjetas por dimensión).
export function visibleSegments(segments: Segment[] | undefined): Segment[] {
  return (segments || []).filter((s) => !s.kanon_protected);
}
