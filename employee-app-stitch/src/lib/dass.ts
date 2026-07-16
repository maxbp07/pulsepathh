/**
 * DASS-21 — subescala de ESTRÉS (7 ítems). Libre / uso comercial OK.
 * Cada ítem 0-3 sobre "la última semana". Raw 0-21.
 * Tabla de severidad Lovibond & Lovibond (1995) ×2 para la escala completa
 * (aquí solo subescala estrés, sin multiplicar, por brevedad clínica).
 */

export type DassSeverity = 'normal' | 'mild' | 'moderate' | 'severe' | 'extremely severe';

/** Raw 0-21 → severidad (umbrales subescala Estrés DASS-21). */
export function dassStressSeverity(raw: number): DassSeverity {
  if (raw <= 7) return 'normal';
  if (raw <= 9) return 'mild';
  if (raw <= 12) return 'moderate';
  if (raw <= 16) return 'severe';
  return 'extremely severe';
}

/** Raw 0-21 → índice 0-100 (mayor = más estrés). */
export function dassStressIndex(raw: number): number {
  return Math.round(clamp(raw, 0, 21) * (100 / 21));
}

/** Suma las respuestas 0-3. Ignora valores fuera de rango. */
export function scoreDassStress(answers: number[]): number {
  return answers
    .map((a) => clamp(Math.round(a), 0, 3))
    .reduce((acc, a) => acc + a, 0);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
