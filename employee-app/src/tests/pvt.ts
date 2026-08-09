/**
 * PulsePath — PVT-B (Psychomotor Vigilance Task, brief).
 */

const LAPSE_THRESHOLD_MS = 355;

export interface PvtMetrics {
  trials: number;
  lapses: number;
  falseStarts: number;
  meanRt: number;
  medianRt: number;
  sdRt: number;
  p10Slowest: number;
  times: number[];
}

/**
 * Calcula las métricas crudas del PVT-B a partir de los tiempos de reacción.
 */
export function calculatePvtMetrics(times: number[] = [], falseStarts = 0): PvtMetrics {
  const valid = (Array.isArray(times) ? times : [])
    .map(Number)
    .filter((rt) => Number.isFinite(rt) && rt >= 0);

  const trials = valid.length;
  const fs = Number.isFinite(falseStarts) ? Math.max(0, Math.round(falseStarts)) : 0;

  if (trials === 0) {
    return {
      trials: 0,
      lapses: 0,
      falseStarts: fs,
      meanRt: 0,
      medianRt: 0,
      sdRt: 0,
      p10Slowest: 0,
      times: [],
    };
  }

  const lapses = valid.filter((rt) => rt > LAPSE_THRESHOLD_MS).length;

  const sum = valid.reduce((acc, rt) => acc + rt, 0);
  const meanRt = sum / trials;

  const sorted = [...valid].sort((a, b) => a - b);
  const medianRt = median(sorted);

  const variance = valid.reduce((acc, rt) => acc + (rt - meanRt) ** 2, 0) / trials;
  const sdRt = Math.sqrt(variance);

  const slowestCount = Math.max(1, Math.round(trials * 0.1));
  const slowest = sorted.slice(trials - slowestCount);
  const p10Slowest = slowest.reduce((acc, rt) => acc + rt, 0) / slowest.length;

  return {
    trials,
    lapses,
    falseStarts: fs,
    meanRt: round1(meanRt),
    medianRt: round1(medianRt),
    sdRt: round1(sdRt),
    p10Slowest: round1(p10Slowest),
    times: valid.map(round1),
  };
}

function median(sortedAsc: number[]): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sortedAsc[mid - 1] + sortedAsc[mid]) / 2 : sortedAsc[mid];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
