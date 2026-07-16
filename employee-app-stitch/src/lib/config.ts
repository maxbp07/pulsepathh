/**
 * PulsePath — Configuración tuneable (fuente única de verdad).
 * Pesos y umbrales agrupados para poder calibrar sin tocar la lógica.
 */

// ─── PVT-BA (Brief Assessment, parámetros Basner 2011) ────────────────────────
export const PVT = {
  durationMs: 180_000, // 3 min fijos (no nº de trials fijo)
  isiMinMs: 1000, // intervalo inter-estímulo mínimo
  isiMaxMs: 4000, // intervalo inter-estímulo máximo
  lapseThresholdMs: 355, // RT > 355ms = lapse (umbral estricto PVT-B)
  falseStartMinMs: 100, // RT < 100ms = anticipación implausible = false start
  feedbackMs: 1000, // tiempo de feedback entre ensayos
} as const;

// ─── Fatigue Risk Index — pesos (deben sumar 1) ──────────────────────────────
export const FRI_WEIGHTS = {
  lapses: 0.35, // tasa de lapses (señal primaria de fatiga)
  meanRt: 0.2, // tiempo de reacción medio
  meanRrt: 0.15, // 1/RT medio (robusto a outliers)
  kss: 0.3, // somnolencia subjetiva (Karolinska)
} as const;

// ─── Umbrales de normalización 0-100 (100 = fatiga máxima) ───────────────────
export const NORM = {
  meanRtLow: 250, // fresco
  meanRtHigh: 450, // muy fatigado
  lapseRateLow: 0, // 0 lapses/trial
  lapseRateHigh: 0.3, // 30% lapses/trial
  rrtHigh: 4.0, // 1/0.25 → fresco (rápido)
  rrtLow: 2.2, // 1/0.45 → fatigado (lento)
} as const;

// ─── Bandas del índice (sobre FRI 0-100) ─────────────────────────────────────
export const FRI_BANDS = {
  optimal: 30, // FRI < 30 → Optimal (Vitality ≥ 70)
  moderate: 60, // 30-60 → Moderate; > 60 → High risk
} as const;

export type FriBand = 'optimal' | 'moderate' | 'high';

// ─── Karolinska Sleepiness Scale (1-9) ───────────────────────────────────────
export const KSS_LABELS = [
  '1 — Extremely alert',
  '2 — Very alert',
  '3 — Alert',
  '4 — Rather alert',
  '5 — Neither alert nor sleepy',
  '6 — Some signs of sleepiness',
  '7 — Sleepy, but no effort to stay awake',
  '8 — Sleepy, some effort to stay awake',
  '9 — Extremely sleepy, fighting sleep',
] as const;

// ─── DASS-21 subescala de ESTRÉS (7 ítems), escala 0-3 ───────────────────────
// Ítems 1,6,8,11,12,14,18 del DASS-21 (libre, comercial OK).
export const DASS_STRESS_ITEMS = [
  'I found it hard to wind down',
  'I tended to over-react to situations',
  'I felt that I was using a lot of nervous energy',
  'I found myself getting agitated',
  'I found it difficult to relax',
  'I was intolerant of anything that kept me from getting on with what I was doing',
  'I felt that I was rather touchy',
] as const;

// ─── Single-Item Burnout (1-5) ───────────────────────────────────────────────
export const SIB_LABELS = [
  '1 — I enjoy my work, no burnout',
  '2 — Occasionally under stress',
  '3 — Definitely burning out',
  '4 — Severe burnout',
  '5 — Completely burned out',
] as const;
