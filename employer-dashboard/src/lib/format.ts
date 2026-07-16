import type { DriverKey, SegmentDimension } from './types';

// Port de src/lib/labels.js del dashboard original — etiquetas legibles para los
// slugs que llegan de la API. Si un slug no está mapeado, se formatea solo.

const DEPARTMENT_LABELS: Record<string, string> = {
  atencion_ciudadana: 'Atención Ciudadana',
  informatica: 'Informática',
  rrhh: 'Recursos Humanos',
  administracion: 'Administración',
  servicios_sociales: 'Servicios Sociales',
  urbanismo: 'Urbanismo',
  policia_local: 'Policía Local',
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
  shift: { morning: 'Mañana', afternoon: 'Tarde', night: 'Noche' },
  gender: { male: 'Hombre', female: 'Mujer', other: 'Otro' },
  ageBand: {
    u30: '< 30 años',
    '30_45': '30–45 años',
    '45_60': '45–60 años',
    o60: '> 60 años',
  },
  tenureBand: {
    u2: '< 2 años',
    '2_5': '2–5 años',
    '5_10': '5–10 años',
    o10: '> 10 años',
  },
};

function titleCase(slug: string): string {
  return String(slug)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDepartment(slug: string | null | undefined): string {
  if (!slug) return '—';
  return DEPARTMENT_LABELS[slug] ?? titleCase(slug);
}

export function formatValue(
  dimension: SegmentDimension | string,
  value: string | null | undefined,
): string {
  if (dimension === 'department') return formatDepartment(value);
  const map = VALUE_LABELS[dimension];
  if (map && value && map[value]) return map[value];
  if (!value) return '—';
  return titleCase(value);
}

export const DIMENSION_LABELS: Record<SegmentDimension, string> = {
  department: 'Departamento',
  shift: 'Turno',
  gender: 'Género',
  ageBand: 'Edad',
  tenureBand: 'Antigüedad',
};

export function formatDimension(key: SegmentDimension | string): string {
  return DIMENSION_LABELS[key as SegmentDimension] ?? titleCase(key);
}

export const DRIVER_LABELS: Record<DriverKey, string> = {
  pvt: 'Fatiga / vigilancia (PVT)',
  stroop: 'Somnolencia (KSS)',
  cbi: 'Estrés / burnout',
  sleep: 'Déficit de sueño',
};

export const DRIVER_LABELS_SHORT: Record<DriverKey, string> = {
  pvt: 'Fatiga',
  stroop: 'Somnolencia',
  cbi: 'Burnout',
  sleep: 'Sueño',
};

/** Etiquetas de los cruces de mapa de calor, legibles. */
export function formatHeatmapTitle(rowKey: string, colKey: string): string {
  return `${formatDimension(rowKey)} × ${formatDimension(colKey)}`;
}
