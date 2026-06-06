/**
 * Icono SVG de advertencia (triángulo). Sin dependencias externas.
 */
const warnIcon = `
  <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`;

/**
 * Muestra un banner de alerta por cada grupo con pct_high_risk > 20%.
 * Grupos suprimidos por K-anonimidad se omiten (no hay datos visibles).
 * Si no hay alertas, limpia el contenedor.
 *
 * @param {HTMLElement} container
 * @param {object|null} data - Respuesta de /api/v1/dashboard/:orgId
 */
export function renderAlerts(container, data) {
  if (!data) {
    container.innerHTML = '';
    return;
  }

  const highRiskGroups = (data.groups || []).filter(
    (g) => !g.kanon_protected && typeof g.pct_high_risk === 'number' && g.pct_high_risk > 20,
  );

  if (highRiskGroups.length === 0) {
    container.innerHTML = '';
    return;
  }

  const items = highRiskGroups
    .map(
      (g) => `
        <div class="alert-item alert-danger" role="alert">
          ${warnIcon}
          <span>
            <strong>${escapeHtml(g.department)}</strong> —
            ${g.pct_high_risk}% de trabajadores en riesgo alto
            <span style="font-size:0.8rem; color:#fca5a5; margin-left:0.4rem">(umbral &gt;20%)</span>
          </span>
        </div>`,
    )
    .join('');

  container.innerHTML = `
    <div class="alerts-banner" aria-live="polite" aria-label="Alertas de riesgo">
      ${items}
    </div>`;
}

/** Escapa caracteres HTML para evitar XSS. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
