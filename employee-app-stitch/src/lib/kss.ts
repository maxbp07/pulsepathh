/**
 * Karolinska Sleepiness Scale (Åkerstedt & Gillberg 1990). Libre.
 * 1 = extremadamente alerta, 9 = extremadamente somnoliento.
 */

/** Normaliza KSS 1-9 a 0-100 donde 100 = somnolencia máxima (fatiga). */
export function kssToFatigue(kss: number): number {
  const clamped = clamp(kss, 1, 9);
  return Math.round(((clamped - 1) / (9 - 1)) * 100);
}

/** Etiqueta corta por valor KSS. */
export function kssShortLabel(kss: number): string {
  const labels: Record<number, string> = {
    1: 'Extremely alert',
    2: 'Very alert',
    3: 'Alert',
    4: 'Rather alert',
    5: 'Neither',
    6: 'Some sleepiness',
    7: 'Sleepy',
    8: 'Sleepy, effort',
    9: 'Fighting sleep',
  };
  return labels[clamp(Math.round(kss), 1, 9)] ?? '—';
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
