import type { SemaphoreColor } from './types';

// Semáforo de riesgo CoPsoQ/istas21 (igual que el dashboard original y backend/insights.js).
export const RISK_GREEN_MAX = 35; // índice < 35 → saludable 🟢
export const RISK_RED_MIN = 50; // índice ≥ 50 → elevado 🔴
export const HIGH_RISK_THRESHOLD = 50; // pct_high_risk cuenta sesiones con risk ≥ 50

/** Color de semáforo para un índice de riesgo medio. */
export function semaphoreColor(avgRisk: number | null | undefined): SemaphoreColor {
  if (typeof avgRisk !== 'number' || !Number.isFinite(avgRisk)) return 'yellow';
  if (avgRisk < RISK_GREEN_MAX) return 'green';
  if (avgRisk < RISK_RED_MIN) return 'yellow';
  return 'red';
}

export interface SemaphoreMeta {
  label: string;
  short: string;
  emoji: string;
  /** Clase de texto Tailwind (color). */
  text: string;
  /** Clase de fondo suave (bg con opacidad). */
  soft: string;
  /** Color del relleno de barras/gauges. */
  fill: string;
  /** Hex para gráficos (Recharts). */
  hex: string;
}

export const SEMAPHORE_META: Record<SemaphoreColor, SemaphoreMeta> = {
  green: {
    label: 'Riesgo BAJO',
    short: 'Saludable',
    emoji: '🟢',
    text: 'text-risk-green',
    soft: 'bg-risk-green/10 border-risk-green/25',
    fill: 'bg-risk-green',
    hex: '#34d399',
  },
  yellow: {
    label: 'Riesgo MEDIO',
    short: 'Moderado',
    emoji: '🟡',
    text: 'text-risk-yellow',
    soft: 'bg-risk-yellow/10 border-risk-yellow/25',
    fill: 'bg-risk-yellow',
    hex: '#fbbf24',
  },
  red: {
    label: 'Riesgo ALTO',
    short: 'Crítico',
    emoji: '🔴',
    text: 'text-risk-red',
    soft: 'bg-risk-red/10 border-risk-red/25',
    fill: 'bg-risk-red',
    hex: '#f43f5e',
  },
};

export function semaphoreMeta(avgRisk: number | null | undefined): SemaphoreMeta {
  return SEMAPHORE_META[semaphoreColor(avgRisk)];
}
