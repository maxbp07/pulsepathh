import { getToken } from '../api/client.js';

/** Icono SVG de descarga. */
const downloadIcon = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>`;

/**
 * Renderiza el botón de exportación CSV.
 * Al hacer clic descarga datos agregados por departamento desde
 * GET /api/v1/dashboard/:orgId/export.csv
 *
 * El CSV solo contiene métricas agregadas (nunca datos individuales):
 * department, count_unique_users, avg_risk_index, pct_high_risk, kanon_protected
 *
 * @param {HTMLElement} container
 * @param {{ orgId?: string, role?: string }} options
 */
export function renderExportCsv(container, { orgId } = {}) {
  if (!orgId) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <button type="button" class="btn btn-accent" id="export-csv-btn" aria-label="Exportar datos agregados como CSV">
      ${downloadIcon}
      Exportar CSV
    </button>
  `;

  const btn = container.querySelector('#export-csv-btn');

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
           style="animation:spin 0.75s linear infinite">
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" opacity=".3"/>
        <path d="M12 3a9 9 0 0 1 9 9"/>
      </svg>
      Exportando…`;

    try {
      const token = getToken();
      const response = await fetch(`/api/v1/dashboard/${orgId}/export.csv`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.status === 401) {
        throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
      }
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Error ${response.status}${text ? ': ' + text : ''}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().slice(0, 10);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `pulsepath-${orgId}-${today}.csv`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Liberar memoria del blob URL tras un instante
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      // Error visible sin romper la UI
      const errorMsg = document.createElement('span');
      errorMsg.textContent = `⚠ ${err.message}`;
      errorMsg.style.cssText =
        'color:#fca5a5;font-size:0.82rem;margin-left:0.5rem;';
      btn.after(errorMsg);
      setTimeout(() => errorMsg.remove(), 6000);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${downloadIcon} Exportar CSV`;
    }
  });
}
