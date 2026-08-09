import type {
  BenchmarkItem,
  DashboardData,
  DepartmentGroup,
  Drivers,
  Forecast,
  Heatmap,
  Segment,
  SegmentDimension,
} from './types';
import type { DashboardFilters } from './api';

// ===========================================================================
// Modo DEMO del dashboard.
// ---------------------------------------------------------------------------
// Reproduce en el cliente la MISMA narrativa y la MISMA agregación que el
// backend: port de prisma/seed-demo.js (datos sintéticos del piloto Barcelona)
// + de src/lib/kanon.js (métricas + K-anonimidad K=5). Así el dashboard se ve
// poblado y premium aunque el backend no esté corriendo — ideal para una demo
// en vivo ante BHH / inversores. Cuando el backend responde, se usan sus datos
// reales (ver useDashboardData).
//
// Narrativa (igual que el seed):
//   · Atención Ciudadana → plantilla SANA que MEJORA con el tiempo.
//   · Informática → riesgo ELEVADO por burnout (CBI) que EMPEORA.
//   · Turno de NOCHE → el de mayor riesgo (fatiga + déficit de sueño).
// ===========================================================================

const K = 5;
const WEEKS = 8;
const ACCESS_CODE_COUNT = 49; // A001–A049 (A050 queda limpio para demo en vivo)
const W: Record<'pvt' | 'stroop' | 'cbi' | 'sleep', number> = { pvt: 0.4, stroop: 0.25, cbi: 0.25, sleep: 0.1 };

// PRNG determinista (mulberry32) → demo estable entre renders.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round1 = (n: number) => Math.round(n * 10) / 10;
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);

function sleepPenalty(hours: number): number {
  if (hours >= 7) return 0;
  if (hours >= 5) return 25;
  if (hours >= 4) return 50;
  return 75;
}

// --- Perfiles por departamento (port de seed-demo) -------------------------
const PROFILES = {
  atencion_ciudadana: { department: 'atencion_ciudadana', shift: 'morning', pvtBase: 26, stroopBase: 24, cbiBase: 28, sleepBase: 7.3, trendSign: -1 },
  informatica: { department: 'informatica', shift: 'afternoon', pvtBase: 48, stroopBase: 45, cbiBase: 63, sleepBase: 5.4, trendSign: 1 },
} as const;

const GENDERS = ['male', 'female'];
const AGE_BANDS = ['u30', '30_45', '45_60', 'o60'];
const TENURE_BANDS = ['u2', '2_5', '5_10', 'o10'];
const SHIFT_RISK: Record<string, { pvt: number; sleep: number }> = {
  morning: { pvt: 0, sleep: 0 },
  afternoon: { pvt: 3, sleep: -0.3 },
  night: { pvt: 12, sleep: -1.1 },
};
const AGE_CBI: Record<string, number> = { u30: 1, '30_45': 0, '45_60': 4, o60: 7 };

function deptShiftForIndex(index: number): { department: string; shift: string } {
  if (index <= 18) return { department: 'atencion_ciudadana', shift: 'morning' };
  if (index <= 25) return { department: 'atencion_ciudadana', shift: 'afternoon' };
  if (index <= 37) return { department: 'informatica', shift: 'afternoon' };
  return { department: 'informatica', shift: 'night' };
}

function dimensionsForIndex(index: number) {
  const { department, shift } = deptShiftForIndex(index);
  return {
    department,
    shift,
    gender: GENDERS[index % GENDERS.length],
    ageBand: AGE_BANDS[index % AGE_BANDS.length],
    tenureBand: TENURE_BANDS[(index + 2) % TENURE_BANDS.length],
  };
}

interface DemoSession {
  codeHash: string;
  department: string;
  shift: string;
  gender: string;
  ageBand: string;
  tenureBand: string;
  takenAt: Date;
  _risk: number;
  _pvt: number;
  _stroop: number;
  _cbi: number;
  _sleep: number;
}

function generateSessions(): DemoSession[] {
  const rand = mulberry32(20260629);
  // Ruido pseudo-gaussiano (suma de uniformes) en [-spread, +spread], igual que seed-demo.
  const noise = (spread: number) => ((rand() + rand() + rand()) / 3 - 0.5) * 2 * spread;
  const sessions: DemoSession[] = [];
  const now = new Date();

  for (let i = 1; i <= ACCESS_CODE_COUNT; i += 1) {
    const dims = dimensionsForIndex(i);
    const profile = PROFILES[dims.department as keyof typeof PROFILES];
    const codeHash = `demo-A${String(i).padStart(3, '0')}`;

    for (let week = 0; week < WEEKS; week += 1) {
      const sessionsThisWeek = 3 + Math.floor(rand() * 2); // 3-4
      for (let s = 0; s < sessionsThisWeek; s += 1) {
        const trend = profile.trendSign * (week - (WEEKS - 1) / 2) * 1.7;
        const shiftMod = SHIFT_RISK[dims.shift] || SHIFT_RISK.morning;
        const ageCbi = AGE_CBI[dims.ageBand] ?? 0;

        const pvtIdx = clamp(profile.pvtBase + trend + shiftMod.pvt + noise(9), 2, 98);
        const stroop = clamp(profile.stroopBase + trend + noise(9), 2, 98);
        const cbi = clamp(profile.cbiBase + trend + ageCbi + noise(8), 2, 98);
        const sleepHours = clamp(profile.sleepBase + shiftMod.sleep + noise(1.1), 3.2, 9);
        const risk = clamp(
          pvtIdx * W.pvt + stroop * W.stroop + cbi * W.cbi + sleepPenalty(sleepHours) * W.sleep,
          0,
          100,
        );

        // Fecha: día laborable de la semana `week` (hacia atrás desde hoy).
        const weeksAgo = WEEKS - 1 - week;
        const base = new Date(now);
        base.setDate(base.getDate() - weeksAgo * 7);
        const weekday = 1 + Math.floor(rand() * 5); // lun-vie
        const day = new Date(base);
        const delta = weekday - (day.getDay() || 7);
        day.setDate(day.getDate() + delta);
        day.setHours(9 + Math.floor(rand() * 8), Math.floor(rand() * 60), 0, 0);
        if (day > now) day.setDate(day.getDate() - 7);

        sessions.push({
          codeHash,
          department: dims.department,
          shift: dims.shift,
          gender: dims.gender,
          ageBand: dims.ageBand,
          tenureBand: dims.tenureBand,
          takenAt: day,
          _risk: Math.round(risk),
          _pvt: Math.round(pvtIdx),
          _stroop: Math.round(stroop),
          _cbi: Math.round(cbi),
          _sleep: Math.round(sleepHours * 10) / 10,
        });
      }
    }
  }
  return sessions;
}

// --- Agregación (port de kanon.js) ----------------------------------------
function isoWeekKey(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${year}-${String(week).padStart(2, '0')}`;
}

function countUniqueUsers(sessions: DemoSession[]): number {
  return new Set(sessions.map((s) => s.codeHash)).size;
}

function computeDrivers(sessions: DemoSession[]): Drivers | null {
  if (!sessions.length) return null;
  const avgPvt = avg(sessions.map((s) => s._pvt));
  const avgStroop = avg(sessions.map((s) => s._stroop));
  const avgCbi = avg(sessions.map((s) => s._cbi));
  const avgSleepHours = avg(sessions.map((s) => s._sleep));
  const sleepPen = sleepPenalty(avgSleepHours);

  const cPvt = W.pvt * avgPvt;
  const cStroop = W.stroop * avgStroop;
  const cCbi = W.cbi * avgCbi;
  const cSleep = W.sleep * sleepPen;
  const total = cPvt + cStroop + cCbi + cSleep || 1;
  const contributions = { pvt: cPvt, stroop: cStroop, cbi: cCbi, sleep: cSleep };
  const dominant = (Object.keys(contributions) as Array<'pvt' | 'stroop' | 'cbi' | 'sleep'>).reduce(
    (a, b) => (contributions[b] > contributions[a] ? b : a),
  );
  return {
    pvt: Math.round((cPvt / total) * 100),
    stroop: Math.round((cStroop / total) * 100),
    cbi: Math.round((cCbi / total) * 100),
    sleep: Math.round((cSleep / total) * 100),
    dominant: dominant as Drivers['dominant'],
  };
}

// --- Proyección de tendencia (NO es un modelo predictivo; ver types.ts) ------
// Regresión lineal (mínimos cuadrados) sobre el trend histórico + cono de
// incertidumbre que crece con la varianza observada. Determinista (sin rand)
// para que la demo sea estable entre renders.
function computeForecast(trend: number[]): Forecast | null {
  const n = trend.length;
  if (n < 2) return null;

  const meanX = (n - 1) / 2;
  const meanY = avg(trend);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (i - meanX) * (trend[i] - meanY);
    den += (i - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  // Desviación típica de los residuos → incertidumbre base del cono.
  const residuals: number[] = [];
  for (let i = 0; i < n; i += 1) {
    residuals.push(trend[i] - (intercept + slope * i));
  }
  const residStd = Math.sqrt(avg(residuals.map((r) => r * r)));

  const HORIZON = 4; // semanas proyectadas (W9–W12)
  const predicted: number[] = [];
  const ciLower: number[] = [];
  const ciUpper: number[] = [];
  let crossWeek: number | null = null;

  for (let k = 1; k <= HORIZON; k += 1) {
    const x = n - 1 + k;
    const y = clamp(intercept + slope * x, 0, 100);
    predicted.push(round1(y));
    // El cono se ensancha con la raíz del horizonte (incertidumbre creciente).
    const spread = residStd * Math.sqrt(k);
    ciLower.push(round1(clamp(y - spread, 0, 100)));
    ciUpper.push(round1(clamp(y + spread, 0, 100)));
    if (crossWeek === null && y >= 50) crossWeek = x; // índice global 0-based
  }

  return { predicted, ciLower, ciUpper, crossWeek };
}

interface ComputedMetrics {
  count: number;
  count_unique_users: number;
  avg_risk_index: number;
  avg_pvt_index: number;
  avg_stroop_index: number;
  avg_cbi_score: number;
  avg_sleep_hours: number;
  pct_high_risk: number;
  drivers: Drivers | null;
  trend: number[];
  forecast: Forecast | null;
}

function computeMetrics(sessions: DemoSession[]): ComputedMetrics {
  const count = sessions.length;
  const riskVals = sessions.map((s) => s._risk);
  const weekBuckets = new Map<string, number[]>();
  for (const s of sessions) {
    const key = isoWeekKey(s.takenAt);
    if (!weekBuckets.has(key)) weekBuckets.set(key, []);
    weekBuckets.get(key)!.push(s._risk);
  }
  const trend = [...weekBuckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, vals]) => round1(avg(vals)));

  return {
    count,
    count_unique_users: countUniqueUsers(sessions),
    avg_risk_index: round1(avg(riskVals)),
    avg_pvt_index: round1(avg(sessions.map((s) => s._pvt))),
    avg_stroop_index: round1(avg(sessions.map((s) => s._stroop))),
    avg_cbi_score: round1(avg(sessions.map((s) => s._cbi))),
    avg_sleep_hours: round1(avg(sessions.map((s) => s._sleep))),
    pct_high_risk: Math.round((riskVals.filter((v) => v >= 50).length / count) * 100),
    drivers: computeDrivers(sessions),
    trend: trend.length >= 2 ? trend : [],
    forecast: computeForecast(trend),
  };
}

function buildGroups(all: DemoSession[]): DepartmentGroup[] {
  const map = new Map<string, DemoSession[]>();
  for (const s of all) {
    if (!map.has(s.department)) map.set(s.department, []);
    map.get(s.department)!.push(s);
  }
  const groups: DepartmentGroup[] = [...map.entries()].map(([department, sessions]) => {
    if (countUniqueUsers(sessions) < K) {
      return { department, kanon_protected: true, message: 'Protected (K-anonymity)' };
    }
    return { department, kanon_protected: false, ...computeMetrics(sessions) };
  });
  groups.sort((a, b) => a.department.localeCompare(b.department));
  return groups;
}

function buildSegments(all: DemoSession[], dimension: SegmentDimension): Segment[] {
  const map = new Map<string, DemoSession[]>();
  for (const s of all) {
    const value = s[dimension];
    if (value == null || value === '') continue;
    if (!map.has(value)) map.set(value, []);
    map.get(value)!.push(s);
  }
  const groups: Segment[] = [...map.entries()].map(([value, sessions]) => {
    if (countUniqueUsers(sessions) < K) {
      return { group: value, dimension, kanon_protected: true, message: 'Protected (K-anonymity)' };
    }
    return { group: value, dimension, kanon_protected: false, ...computeMetrics(sessions) };
  });
  groups.sort((a, b) => {
    if (a.kanon_protected && !b.kanon_protected) return 1;
    if (!a.kanon_protected && b.kanon_protected) return -1;
    if (a.kanon_protected && b.kanon_protected) return String(a.group).localeCompare(String(b.group));
    return (b.avg_risk_index ?? 0) - (a.avg_risk_index ?? 0);
  });
  return groups;
}

function buildHeatmap(all: DemoSession[], rowKey: SegmentDimension, colKey: SegmentDimension): Heatmap {
  const rowSet = new Set<string>();
  const colSet = new Set<string>();
  const cellMap = new Map<string, DemoSession[]>();
  for (const s of all) {
    const r = s[rowKey] as string;
    const c = s[colKey] as string;
    if (!r || !c) continue;
    rowSet.add(r);
    colSet.add(c);
    const key = `${r}|${c}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key)!.push(s);
  }
  const rows = [...rowSet].sort((a, b) => a.localeCompare(b));
  const cols = [...colSet].sort((a, b) => a.localeCompare(b));
  const cells = [];
  for (const r of rows) {
    for (const c of cols) {
      const sessions = cellMap.get(`${r}|${c}`) || [];
      if (sessions.length === 0) {
        cells.push({ row: r, col: c, empty: true });
        continue;
      }
      if (countUniqueUsers(sessions) < K) {
        cells.push({ row: r, col: c, kanon_protected: true });
        continue;
      }
      const m = computeMetrics(sessions);
      cells.push({
        row: r,
        col: c,
        kanon_protected: false,
        avg_risk_index: m.avg_risk_index,
        pct_high_risk: m.pct_high_risk,
        count_unique_users: m.count_unique_users,
      });
    }
  }
  return { rowKey, colKey, rows, cols, cells };
}

const HEATMAP_PAIRS: [SegmentDimension, SegmentDimension][] = [
  ['department', 'shift'],
  ['department', 'gender'],
  ['shift', 'gender'],
  ['department', 'ageBand'],
  ['shift', 'ageBand'],
  ['department', 'tenureBand'],
  ['gender', 'ageBand'],
  ['shift', 'tenureBand'],
  ['gender', 'tenureBand'],
];

const SEGMENT_DIMENSIONS: SegmentDimension[] = ['department', 'shift', 'gender', 'ageBand', 'tenureBand'];

function applyFilters(all: DemoSession[], filters: DashboardFilters): DemoSession[] {
  return all.filter((s) => {
    if (filters.department && s.department !== filters.department) return false;
    if (filters.shift && s.shift !== filters.shift) return false;
    if (filters.from) {
      const from = new Date(filters.from);
      if (!isNaN(from.getTime()) && s.takenAt < from) return false;
    }
    if (filters.to) {
      const to = new Date(filters.to);
      if (!isNaN(to.getTime())) {
        to.setUTCHours(23, 59, 59, 999);
        if (s.takenAt > to) return false;
      }
    }
    return true;
  });
}

let cache: DemoSession[] | null = null;
function allSessions(): DemoSession[] {
  if (!cache) cache = generateSessions();
  return cache;
}

// Valores de referencia ILUSTRATIVOS (no proceden de un dataset real). Sirven
// solo como comparativa visual; deben llevar siempre la etiqueta "orientativos".
const BENCHMARK_REFERENCE: Record<string, number> = {
  fatiga: 35,
  cognitivo: 38,
  burnout: 42,
  sueno: 28,
};

/** Benchmark sectorial ilustrativo: métricas reales de la org vs referencia. */
function buildBenchmark(m: ComputedMetrics): BenchmarkItem[] {
  // Sueño → déficit 0-100 (8 h = 0, 3 h = 100): menos horas = peor.
  const sleepDeficit = clamp(((8 - m.avg_sleep_hours) / (8 - 3)) * 100, 0, 100);
  return [
    { category: 'Fatiga reactiva', ours: Math.round(m.avg_pvt_index), reference: BENCHMARK_REFERENCE.fatiga },
    { category: 'Control cognitivo', ours: Math.round(m.avg_stroop_index), reference: BENCHMARK_REFERENCE.cognitivo },
    { category: 'Burnout', ours: Math.round(m.avg_cbi_score), reference: BENCHMARK_REFERENCE.burnout },
    { category: 'Déficit de sueño', ours: Math.round(sleepDeficit), reference: BENCHMARK_REFERENCE.sueno },
  ];
}

/** Genera un DashboardData de demo (forma idéntica al backend) aplicando filtros. */
export function generateDemoDashboard(filters: DashboardFilters = {}): DashboardData {
  const all = applyFilters(allSessions(), filters);

  const groups = buildGroups(all);
  const segments = {} as Record<SegmentDimension, Segment[]>;
  for (const dim of SEGMENT_DIMENSIONS) {
    segments[dim] = buildSegments(all, dim);
  }
  const heatmaps = HEATMAP_PAIRS.map(([r, c]) => buildHeatmap(all, r, c));

  // org_total (port del controller): buildOrgTotal + drivers vía segmento virtual.
  let benchmark: BenchmarkItem[] = [];
  const orgTotal: DashboardData['org_total'] = countUniqueUsers(all) < K
    ? { kanon_protected: true, message: 'Protected (K-anonymity)' }
    : (() => {
        const m = computeMetrics(all);
        benchmark = buildBenchmark(m);
        return {
          count: m.count,
          count_unique_users: m.count_unique_users,
          avg_risk_index: m.avg_risk_index,
          pct_high_risk: m.pct_high_risk,
          drivers: m.drivers,
          forecast: m.forecast,
          kanon_protected: false,
        };
      })();

  return {
    groups,
    org_total: orgTotal,
    segments,
    heatmap: heatmaps[0],
    heatmaps,
    benchmark,
  };
}
