/** GAD-7 — Generalized Anxiety Disorder 7-item scale (0-3 per item, raw 0-21). */

export type Gad7Severity = 'minimal' | 'mild' | 'moderate' | 'severe';

export const GAD7_ITEM_COUNT = 7;

export function scoreGad7(answers: number[]): number {
  return answers
    .slice(0, GAD7_ITEM_COUNT)
    .map((a) => Math.min(3, Math.max(0, Math.round(a))))
    .reduce((sum, a) => sum + a, 0);
}

export function gad7Severity(raw: number): Gad7Severity {
  if (raw <= 4) return 'minimal';
  if (raw <= 9) return 'mild';
  if (raw <= 14) return 'moderate';
  return 'severe';
}

export function gad7Index(raw: number): number {
  return Math.round((Math.min(21, Math.max(0, raw)) / 21) * 100);
}
