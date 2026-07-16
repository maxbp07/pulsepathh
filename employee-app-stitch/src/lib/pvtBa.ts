/**
 * PulsePath — PVT-BA (PVT-B Adaptive) engine.
 * Implementación fiel del algoritmo de Basner (2022), "Ultra-short objective
 * alertness assessment: an adaptive duration version of the 3 minute PVT
 * (PVT-BA)", Sleep Advances 3(1):zpac038. PMC10104405. doi:10.1093/sleepadvances/zpac038
 *
 * Idea: tras cada respuesta se actualizan (Bayes) las probabilidades de que el
 * test completo de 3 min sería HIGH / MEDIUM / LOW rendimiento. Cuando una
 * supera 99,619 %, el test se detiene (de ahí la duración media ~1:43, mín 16,4 s).
 *
 * NOTA de calibrado honesta: los LR exactos por bin de tiempo están en la Fig.1
 * del paper (imagen). Aquí se usan los rangos numéricos publicados en el texto:
 *   • lapse/false start:  LOW ×3–5 (mid 4,0); HIGH −75–85 % (LR mid 0,20)
 *   • respuesta limpia:   LOW −22–43 % (LR mid 0,67); HIGH +22–40 % (LR mid 1,31)
 *   • primeros 30 s:      LR atenuados hacia 1 (menos informativos).
 * Pendiente: calibrar contra la tabla exacta de la Fig.1 y la corrección
 * Sleep Adv 2023;4(1):zpad022.
 */

export type PerfCategory = 'HIGH' | 'MEDIUM' | 'LOW';

/** LpFS = lapses + false starts. Umbrales de categoría del PVT-BA. */
export const LPFS_HIGH_MAX = 6; // ≤6 → HIGH
export const LPFS_LOW_MIN = 17; // ≥17 → LOW  (i.e. >16)
export const DECISION_THRESHOLD = 0.99619;

/** Likelihood ratios (de los rangos del texto de Basner 2022). */
const LR = {
  highLapseFs: 0.2, // HIGH si lapse/FS (−75..85 %)
  highClean: 1.31, // HIGH si respuesta limpia (+22..40 %)
  lowLapseFs: 4.0, // LOW si lapse/FS (×3..5)
  lowClean: 0.67, // LOW si respuesta limpia (−22..43 %)
} as const;

const FIRST_INFORMATIVE_SEC = 30; // los primeros 30 s los LR se atenuan hacia 1

export interface PvtBaState {
  pHigh: number;
  pMed: number;
  pLow: number;
  lpfs: number; // lapses + false starts acumulados
  responses: number;
  stopped: boolean;
  category: PerfCategory | null;
  stopReason: 'threshold' | 'lpfs_low' | 'timeout' | null;
}

export function createPvtBaState(): PvtBaState {
  return {
    pHigh: 1 / 3,
    pMed: 1 / 3,
    pLow: 1 / 3,
    lpfs: 0,
    responses: 0,
    stopped: false,
    category: null,
    stopReason: null,
  };
}

/** Atenua un LR hacia 1 durante los primeros 30 s (menos informativos). */
function dampen(lr: number, elapsedSec: number): number {
  if (elapsedSec >= FIRST_INFORMATIVE_SEC) return lr;
  const f = Math.max(0, elapsedSec) / FIRST_INFORMATIVE_SEC;
  return 1 + (lr - 1) * f;
}

function oddsFromProb(p: number): number {
  const pp = clamp(p, 1e-9, 1 - 1e-9);
  return pp / (1 - pp);
}
function probFromOdds(o: number): number {
  return o / (1 + o);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Actualiza el estado tras una respuesta.
 * @param isLapseOrFs  true si la respuesta fue un lapse (RT≥355ms) o false start.
 * @param elapsedSec   tiempo-on-task (s) desde el inicio del test.
 * @param isFalseStart true si fue false start (cuenta como LpFS pero no como trial válido).
 */
export function updatePvtBa(
  prev: PvtBaState,
  isLapseOrFs: boolean,
  elapsedSec: number,
  isFalseStart = false,
): PvtBaState {
  if (prev.stopped) return prev;

  const lpfs = prev.lpfs + (isLapseOrFs ? 1 : 0);
  let responses = prev.responses + 1;

  // LR para esta respuesta
  const lrHigh = dampen(isLapseOrFs ? LR.highLapseFs : LR.highClean, elapsedSec);
  const lrLow = dampen(isLapseOrFs ? LR.lowLapseFs : LR.lowClean, elapsedSec);

  // Actualización bayesiana independiente de HIGH y LOW (sobre odds)
  const oHigh = oddsFromProb(prev.pHigh) * lrHigh;
  const oLow = oddsFromProb(prev.pLow) * lrLow;
  let pHigh = probFromOdds(oHigh);
  let pLow = probFromOdds(oLow);
  let pMed = clamp(1 - pHigh - pLow, 0, 1);

  // Regla dura: si LpFS > 6, no puede ser HIGH → PHIGH=0 y renormaliza MEDIUM/LOW
  if (lpfs > LPFS_HIGH_MAX) {
    pHigh = 0;
    const sum = pMed + pLow;
    if (sum > 0) {
      pMed /= sum;
      pLow /= sum;
    }
  }

  let stopped = false;
  let category: PerfCategory | null = null;
  let stopReason: PvtBaState['stopReason'] = null;

  // Regla dura: LpFS ≥ 17 → LOW y para
  if (lpfs >= LPFS_LOW_MIN) {
    stopped = true;
    category = 'LOW';
    stopReason = 'lpfs_low';
  } else if (pHigh >= DECISION_THRESHOLD) {
    stopped = true;
    category = 'HIGH';
    stopReason = 'threshold';
  } else if (pLow >= DECISION_THRESHOLD) {
    stopped = true;
    category = 'LOW';
    stopReason = 'threshold';
  } else if (pMed >= DECISION_THRESHOLD) {
    stopped = true;
    category = 'MEDIUM';
    stopReason = 'threshold';
  }

  return { pHigh, pMed, pLow, lpfs, responses, stopped, category, stopReason };
}

/** Clasificación por defecto a los 3 min (si no se alcanzó umbral): por LpFS real. */
export function classifyByLpfs(lpfs: number): PerfCategory {
  if (lpfs <= LPFS_HIGH_MAX) return 'HIGH';
  if (lpfs < LPFS_LOW_MIN) return 'MEDIUM';
  return 'LOW';
}

/** Mapa categoría → etiqueta fatigue para mostrar/UI. */
export function categoryMeta(c: PerfCategory): {
  label: string;
  friHint: number; // contribución orientativa 0-100 (mayor = más fatiga)
} {
  switch (c) {
    case 'HIGH':
      return { label: 'High performance', friHint: 12 };
    case 'MEDIUM':
      return { label: 'Medium performance', friHint: 50 };
    case 'LOW':
      return { label: 'Low performance', friHint: 90 };
  }
}
