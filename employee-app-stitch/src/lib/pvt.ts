/**
 * PulsePath — PVT-BA. Lógica PURA de métricas (sin DOM).
 * Adaptado y extendido desde employee-app/src/tests/pvt.ts (reutilizado).
 * Timing con performance.now() se orquesta en el componente <PVTTest/>.
 */
import { PVT } from './config';
import type { PvtMetrics } from './types';

/**
 * Calcula las métricas de una sesión PVT-BA a partir de los RTs válidos.
 * Set completo Basner: lapses, mean/median/sd RT, fastest10, slowest10, meanRrt.
 *
 * @param times        RTs válidos en ms (performance.now diff).
 * @param falseStarts  número de salidas en falso / anticipaciones.
 * @param durationMs   duración real de la sesión (para el registro).
 */
export function calculatePvtMetrics(
  times: number[] = [],
  falseStarts = 0,
  durationMs = 0,
): PvtMetrics {
  const valid = (Array.isArray(times) ? times : [])
    .map(Number)
    .filter((rt) => Number.isFinite(rt) && rt >= 0);

  const trials = valid.length;
  const fs = Number.isFinite(falseStarts) ? Math.max(0, Math.round(falseStarts)) : 0;

  if (trials === 0) {
    return zeroMetrics(fs, durationMs);
  }

  const lapses = valid.filter((rt) => rt > PVT.lapseThresholdMs).length;
  const meanRt = valid.reduce((a, b) => a + b, 0) / trials;
  const sorted = [...valid].sort((a, b) => a - b);
  const medianRt = median(sorted);
  const variance = valid.reduce((a, rt) => a + (rt - meanRt) ** 2, 0) / trials;
  const sdRt = Math.sqrt(variance);

  const n10 = Math.max(1, Math.round(trials * 0.1));
  const fastest = sorted.slice(0, n10);
  const slowest = sorted.slice(trials - n10);
  const fastest10 = fastAvg(fastest);
  const slowest10 = fastAvg(slowest);

  // Reciprocal mean RT (1/RT en 1/s): más alto = más rápido = menos fatiga.
  // Robusto a lapses puntuales (outliers altos apenas influyen al invertir).
  const meanRrt = valid.reduce((a, rt) => a + 1000 / rt, 0) / trials;

  return {
    trials,
    lapses,
    falseStarts: fs,
    meanRt: round1(meanRt),
    medianRt: round1(medianRt),
    sdRt: round1(sdRt),
    fastest10: round1(fastest10),
    slowest10: round1(slowest10),
    meanRrt: round2(meanRrt),
    durationMs: Math.round(durationMs),
    times: valid.map(round1),
    lpfs: lapses + fs,
    category: 'MEDIUM', // default; el componente lo sobrescribe con el resultado adaptativo real
    stoppedEarly: false,
  };
}

/** Lapse rate (lapses / ensayos válidos). 0 si sin ensayos. */
export function lapseRate(m: PvtMetrics): number {
  return m.trials > 0 ? m.lapses / m.trials : 0;
}

function zeroMetrics(falseStarts: number, durationMs: number): PvtMetrics {
  return {
    trials: 0,
    lapses: 0,
    falseStarts,
    meanRt: 0,
    medianRt: 0,
    sdRt: 0,
    fastest10: 0,
    slowest10: 0,
    meanRrt: 0,
    durationMs: Math.round(durationMs),
    times: [],
    lpfs: falseStarts,
    category: 'MEDIUM',
    stoppedEarly: false,
  };
}

function median(sortedAsc: number[]): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sortedAsc[mid - 1] + sortedAsc[mid]) / 2 : sortedAsc[mid];
}

function fastAvg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
