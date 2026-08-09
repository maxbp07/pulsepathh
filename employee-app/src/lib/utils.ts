import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge de clases Tailwind (estándar shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Número con 0-2 decemales, defensivo frente a null/NaN. */
export function fmtNum(n: number | null | undefined, decimals = 0): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const f = 10 ** decimals;
  return String(Math.round(n * f) / f);
}

/** Entero con separador de miles (es-ES). */
export function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('es-ES').format(Math.round(n));
}
