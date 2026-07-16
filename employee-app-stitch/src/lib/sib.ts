/**
 * Single-Item Burnout measure (Rohland et al. 2009). Libre.
 * "Overall, based on your definition of burnout, how would you rate your
 *  level of burnout?" → 1 (sin burnout) a 5 (completamente quemado).
 */

export type SibLevel = 'none' | 'low' | 'moderate' | 'high' | 'severe';

/** 1-5 → nivel cualitativo. */
export function sibLevel(value: number): SibLevel {
  const v = clamp(Math.round(value), 1, 5);
  return (['none', 'low', 'moderate', 'high', 'severe'] as SibLevel[])[v - 1];
}

/** 1-5 → índice 0-100 (mayor = más burnout). */
export function sibIndex(value: number): number {
  const v = clamp(value, 1, 5);
  return Math.round(((v - 1) / (5 - 1)) * 100);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
