/**
 * Etiquetas legibles para los slugs de departamento que llegan de la API.
 * Si un slug no está mapeado, se formatea automáticamente (snake_case → Título).
 */
const DEPARTMENT_LABELS = {
  atencion_ciudadana: 'Atención Ciudadana',
  informatica: 'Informática',
  rrhh: 'Recursos Humanos',
  administracion: 'Administración',
  servicios_sociales: 'Servicios Sociales',
  urbanismo: 'Urbanismo',
  policia_local: 'Policía Local',
};

/**
 * Convierte un slug de departamento en un nombre legible.
 * @param {string} slug
 * @returns {string}
 */
export function formatDepartment(slug) {
  if (!slug) return '—';
  if (DEPARTMENT_LABELS[slug]) return DEPARTMENT_LABELS[slug];
  return String(slug)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Etiquetas legibles para los valores de cada dimensión de segmentación. */
const VALUE_LABELS = {
  shift: { morning: 'Mañana', afternoon: 'Tarde', night: 'Noche' },
  gender: { male: 'Hombre', female: 'Mujer', other: 'Otro' },
  ageBand: { u30: '< 30 años', '30_45': '30–45 años', '45_60': '45–60 años', o60: '> 60 años' },
  tenureBand: { u2: '< 2 años', '2_5': '2–5 años', '5_10': '5–10 años', o10: '> 10 años' },
};

/** Metadatos de cada dimensión: clave de API, etiqueta del selector e icono. */
export const DIMENSIONS = [
  { key: 'department', label: 'Departamento', icon: '🏢' },
  { key: 'shift', label: 'Turno', icon: '🕒' },
  { key: 'gender', label: 'Género', icon: '⚧' },
  { key: 'ageBand', label: 'Edad', icon: '🎂' },
  { key: 'tenureBand', label: 'Antigüedad', icon: '📅' },
];

/**
 * Devuelve la etiqueta legible de un valor dentro de una dimensión.
 * @param {string} dimension department|shift|gender|ageBand|tenureBand
 * @param {string} value
 */
export function formatValue(dimension, value) {
  if (dimension === 'department') return formatDepartment(value);
  const map = VALUE_LABELS[dimension];
  if (map && map[value]) return map[value];
  if (!value) return '—';
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Etiqueta legible de una dimensión por su clave. */
export function formatDimension(key) {
  const d = DIMENSIONS.find((x) => x.key === key);
  return d ? d.label : key;
}
