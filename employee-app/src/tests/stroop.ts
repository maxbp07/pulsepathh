/**
 * PulsePath — Test de Stroop (condició incongruent).
 */

const TRIALS = 20;

export interface StroopMetrics {
  errors: number;
  trials: number;
  meanRt: number;
  sdRt: number;
  times: number[];
}

/**
 * Calcula las métricas del test de Stroop.
 */
export function calculateStroopMetrics(times: number[] = [], errors = 0, trials = TRIALS): StroopMetrics {
  const valid = (Array.isArray(times) ? times : [])
    .map(Number)
    .filter((rt) => Number.isFinite(rt) && rt >= 0);

  const n = valid.length;
  const err = Number.isFinite(errors) ? Math.max(0, Math.round(errors)) : 0;
  const total = Number.isFinite(trials) ? Math.max(0, Math.round(trials)) : TRIALS;

  if (n === 0) {
    return { errors: err, trials: total, meanRt: 0, sdRt: 0, times: [] };
  }

  const mean = valid.reduce((acc, rt) => acc + rt, 0) / n;
  const variance = valid.reduce((acc, rt) => acc + (rt - mean) ** 2, 0) / n;

  return {
    errors: err,
    trials: total,
    meanRt: round1(mean),
    sdRt: round1(Math.sqrt(variance)),
    times: valid.map(round1),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
