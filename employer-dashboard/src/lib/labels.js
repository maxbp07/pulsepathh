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
