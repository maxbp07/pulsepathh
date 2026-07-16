/**
 * PulsePath — Fatigue Risk Index (FRI).
 * Fórmula ponderada EXPLICABLE: FRI = Σ wᵢ · componente_norm
 * donde cada componente se normaliza a 0-100 (100 = fatiga máxima).
 * Vitality (dashboard) = 100 − FRI.
 */
import { FRI_WEIGHTS, FRI_BANDS, NORM } from './config';
import type { FriBand } from './config';
import type { FriBreakdown, FriResult, PvtMetrics } from './types';
import { lapseRate } from './pvt';
import { kssToFatigue } from './kss';

/** Normaliza x entre low..high → 0..100 (mayor x = mayor fatiga). */
function normHigh(value: number, low: number, high: number): number {
  if (high <= low) return 0;
  return clamp01((value - low) / (high - low)) * 100;
}

/** Normaliza x entre low..high → 0..100 donde mayor x = MENOS fatiga (inverso). */
function normLow(value: number, low: number, high: number): number {
  if (high <= low) return 0;
  // value alta (cerca de high) → 0 fatiga; value baja (cerca de low) → 100 fatiga
  return clamp01((high - value) / (high - low)) * 100;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/**
 * Calcula el FRI a partir de métricas PVT + KSS subjetivo.
 */
export function calculateFri(pvt: PvtMetrics, kss: number): FriResult {
  const lapsesNorm = normHigh(lapseRate(pvt), NORM.lapseRateLow, NORM.lapseRateHigh);
  const meanRtNorm = normHigh(pvt.meanRt, NORM.meanRtLow, NORM.meanRtHigh);
  const meanRrtNorm = normLow(pvt.meanRrt, NORM.rrtLow, NORM.rrtHigh);
  const kssNorm = kssToFatigue(kss);

  const breakdown: FriBreakdown = {
    lapses: round1(lapsesNorm * FRI_WEIGHTS.lapses),
    meanRt: round1(meanRtNorm * FRI_WEIGHTS.meanRt),
    meanRrt: round1(meanRrtNorm * FRI_WEIGHTS.meanRrt),
    kss: round1(kssNorm * FRI_WEIGHTS.kss),
  };

  const fri = clampRound(
    breakdown.lapses + breakdown.meanRt + breakdown.meanRrt + breakdown.kss,
  );
  const vitality = clampRound(100 - fri);

  return {
    fri,
    vitality,
    band: friToBand(fri),
    breakdown,
  };
}

export function friToBand(fri: number): FriBand {
  if (fri < FRI_BANDS.optimal) return 'optimal';
  if (fri < FRI_BANDS.moderate) return 'moderate';
  return 'high';
}

/** Texto + color (clases tailwind) por banda, para el dashboard. */
export function bandMeta(band: FriBand): {
  label: string;
  emoji: string;
  chipClass: string;
  ringStroke: string;
} {
  switch (band) {
    case 'optimal':
      return {
        label: 'Optimal',
        emoji: '🟢',
        chipClass: 'bg-tertiary-container/10 text-tertiary border-tertiary/20',
        ringStroke: '#00855b',
      };
    case 'moderate':
      return {
        label: 'Moderate',
        emoji: '🟡',
        chipClass: 'bg-primary-container/10 text-primary border-primary/20',
        ringStroke: '#264dd9',
      };
    case 'high':
      return {
        label: 'High risk',
        emoji: '🔴',
        chipClass: 'bg-error-container/40 text-error border-error/30',
        ringStroke: '#ba1a1a',
      };
  }
}

function clampRound(v: number): number {
  return Math.round(Math.min(100, Math.max(0, v)));
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
