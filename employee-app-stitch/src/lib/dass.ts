/**
 * DASS-21 completo — depresión, ansiedad y estrés (21 ítems, 0-3 cada uno).
 * Subescalas raw 0-21; severidad según Lovibond & Lovibond (1995).
 */

export type DassSeverity = 'normal' | 'mild' | 'moderate' | 'severe' | 'extremely severe';
export type DassSubscale = 'depression' | 'anxiety' | 'stress';

/** Índices 0-based de cada subescala en el orden estándar DASS-21. */
export const DASS_SUBSCALE_ITEMS: Record<DassSubscale, number[]> = {
  stress: [0, 5, 7, 10, 11, 13, 17],
  anxiety: [1, 3, 6, 8, 14, 18, 19],
  depression: [2, 4, 9, 12, 15, 16, 20],
};

const SEVERITY_THRESHOLDS: Record<DassSubscale, [number, number, number, number]> = {
  depression: [9, 13, 20, 27],
  anxiety: [7, 9, 14, 19],
  stress: [14, 18, 25, 33],
};

export interface DassFullScores {
  depression: number;
  anxiety: number;
  stress: number;
  total: number;
}

export function dassSubscaleSeverity(subscale: DassSubscale, raw: number): DassSeverity {
  const [mild, moderate, severe, extreme] = SEVERITY_THRESHOLDS[subscale];
  if (raw <= mild) return 'normal';
  if (raw <= moderate) return 'mild';
  if (raw <= severe) return 'moderate';
  if (raw <= extreme) return 'severe';
  return 'extremely severe';
}

/** Raw 0-21 → índice 0-100 (mayor = peor). */
export function dassSubscaleIndex(raw: number): number {
  return Math.round(clamp(raw, 0, 21) * (100 / 21));
}

export function scoreDassSubscale(answers: number[], indices: number[]): number {
  return indices
    .map((i) => clamp(Math.round(answers[i] ?? 0), 0, 3))
    .reduce((acc, a) => acc + a, 0);
}

export function scoreDassFull(answers: number[]): DassFullScores {
  const depression = scoreDassSubscale(answers, DASS_SUBSCALE_ITEMS.depression);
  const anxiety = scoreDassSubscale(answers, DASS_SUBSCALE_ITEMS.anxiety);
  const stress = scoreDassSubscale(answers, DASS_SUBSCALE_ITEMS.stress);
  return { depression, anxiety, stress, total: depression + anxiety + stress };
}

/** @deprecated use scoreDassFull */
export function scoreDassStress(answers: number[]): number {
  return scoreDassSubscale(answers, DASS_SUBSCALE_ITEMS.stress);
}

/** @deprecated use dassSubscaleSeverity('stress', raw) */
export function dassStressSeverity(raw: number): DassSeverity {
  return dassSubscaleSeverity('stress', raw);
}

/** @deprecated use dassSubscaleIndex */
export function dassStressIndex(raw: number): number {
  return dassSubscaleIndex(raw);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
