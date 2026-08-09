/**
 * PulsePath — Motor de riesgo determinista (0-100).
 */

const WEIGHTS = {
  pvt: 0.4,
  stroop: 0.25,
  cbi: 0.25,
  sleep: 0.1,
};

const CBI_SCALE: Record<string, number> = {
  always: 100,
  often: 75,
  sometimes: 50,
  seldom: 25,
  never: 0,
};

export function calculateSleepPenalty(sleepHours: number | string): number {
  const hours = Number(sleepHours);
  if (Number.isNaN(hours)) return 0;

  if (hours >= 7) return 0;
  if (hours >= 5) return 25;
  if (hours >= 4) return 50;
  return 75;
}

export function calculatePvtIndex(metrics: {
  lapses?: number;
  falseStarts?: number;
  trials?: number;
  meanRt?: number;
  sdRt?: number;
} = {}): number {
  const trials = Math.max(1, metrics.trials ?? 30);
  const lapses = metrics.lapses ?? 0;
  const falseStarts = metrics.falseStarts ?? 0;
  const meanRt = metrics.meanRt ?? 250;
  const sdRt = metrics.sdRt ?? 50;

  const lapseRate = lapses / trials;
  const falseStartRate = falseStarts / trials;

  const lapseComponent = Math.min(40, lapseRate * 200);
  const falseStartComponent = Math.min(20, falseStartRate * 100);
  const rtComponent = Math.min(25, Math.max(0, (meanRt - 200) / 4));
  const sdComponent = Math.min(15, Math.max(0, (sdRt - 30) / 3));

  const index = lapseComponent + falseStartComponent + rtComponent + sdComponent;
  return clampRound(index);
}

export function calculateStroopIndex(metrics: {
  errors?: number;
  trials?: number;
  meanRt?: number;
} = {}): number {
  const trials = Math.max(1, metrics.trials ?? 20);
  const errors = metrics.errors ?? 0;
  const meanRt = metrics.meanRt ?? 600;

  const errorRate = errors / trials;
  const errorComponent = Math.min(50, errorRate * 250);
  const rtComponent = Math.min(50, Math.max(0, (meanRt - 400) / 8));

  const index = errorComponent + rtComponent;
  return clampRound(index);
}

export function calculateCbiScore(answers: Array<number | string> = []): number {
  if (!Array.isArray(answers) || answers.length === 0) {
    return 50;
  }

  const scores = answers.map((answer) => {
    if (typeof answer === 'number' && !Number.isNaN(answer)) {
      return Math.min(100, Math.max(0, answer));
    }
    if (typeof answer === 'string') {
      return CBI_SCALE[answer.toLowerCase()] ?? 50;
    }
    return 50;
  });

  const sum = scores.reduce((acc, score) => acc + score, 0);
  return clampRound(sum / scores.length);
}

export interface RiskIndexResult {
  riskIndex: number;
  breakdown: {
    pvt: number;
    stroop: number;
    cbi: number;
    sleep: number;
  };
}

export function calculateRiskIndex({
  pvtIndex,
  stroopIndex,
  cbiScore,
  sleepHours,
}: {
  pvtIndex: number;
  stroopIndex: number;
  cbiScore: number;
  sleepHours: number;
}): RiskIndexResult {
  const pvt = Number(pvtIndex) || 0;
  const stroop = Number(stroopIndex) || 0;
  const cbi = Number(cbiScore) ?? 50;
  const sleepPenalty = calculateSleepPenalty(sleepHours);

  const breakdown = {
    pvt: round2(pvt * WEIGHTS.pvt),
    stroop: round2(stroop * WEIGHTS.stroop),
    cbi: round2(cbi * WEIGHTS.cbi),
    sleep: round2(sleepPenalty * WEIGHTS.sleep),
  };

  const raw = breakdown.pvt + breakdown.stroop + breakdown.cbi + breakdown.sleep;

  return {
    riskIndex: clampRound(raw),
    breakdown,
  };
}

function clampRound(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
