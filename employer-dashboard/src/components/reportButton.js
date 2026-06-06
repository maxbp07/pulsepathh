import { getToken, clearToken } from '../api/client.js';

/**
 * Renderiza el botón "Generar Informe PDF" en el contenedor dado.
 *
 * @param {HTMLElement} container  — el elemento donde montar el botón (#export-area)
 * @param {{ orgId: string, getFilters: () => object }} options
 *   - orgId:      UUID de la organización del empleador autenticado
 *   - getFilters: función que devuelve los filtros activos en el momento de la descarga
 *                 (department, shift, from, to) — igual que los que usa loadData()
 */
export function renderReportButton(container, { orgId, getFilters = () => ({}) } = {}) {
  container.insertAdjacentHTML(
    'beforeend',
    `<button
       type="button"
       class="btn btn-primary"
       id="report-pdf-btn"
       title="Genera el Informe de Impacto en PDF con los filtros activos"
     >
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" aria-hidden="true">
         <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
         <polyline points="14 2 14 8 20 8"/>
         <line x1="16" y1="13" x2="8" y2="13"/>
         <line x1="16" y1="17" x2="8" y2="17"/>
         <polyline points="10 9 9 9 8 9"/>
       </svg>
       <span class="report-btn-label">Informe PDF</span>
     </button>`,
  );

  const btn = container.querySelector('#report-pdf-btn');
  const labelEl = btn.querySelector('.report-btn-label');

  /** Estados del botón */
  const STATES = {
    idle:    { label: 'Informe PDF',      disabled: false, title: 'Genera el Informe de Impacto PDF con los filtros activos' },
    loading: { label: 'Generando PDF…',  disabled: true,  title: 'El servidor está generando el PDF. Por favor espera.' },
    error:   { label: 'Error — reintentar', disabled: false, title: 'Error al generar el PDF. Haz clic para reintentar.' },
  };

  function setState(state) {
    const s = STATES[state];
    labelEl.textContent = s.label;
    btn.disabled = s.disabled;
    btn.title = s.title;
    btn.dataset.state = state;
  }

  function buildPdfUrl(filters) {
    const params = new URLSearchParams();
    if (filters.department) params.set('department', filters.department);
    if (filters.shift)      params.set('shift',      filters.shift);
    if (filters.from)       params.set('from',       filters.from);
    if (filters.to)         params.set('to',         filters.to);
    const qs = params.toString();
    return `/api/v1/dashboard/${orgId}/report.pdf${qs ? `?${qs}` : ''}`;
  }

  async function downloadReport() {
    if (!orgId) {
      alert('No se encontró la organización. Vuelve a iniciar sesión.');
      return;
    }

    setState('loading');

    const token = getToken();
    if (!token) {
      clearToken();
      window.location.reload();
      return;
    }

    const filters = getFilters();
    const url = buildPdfUrl(filters);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        clearToken();
        window.location.reload();
        return;
      }

      if (!response.ok) {
        // Try to extract JSON error message from the backend
        let message = `Error ${response.status}`;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await response.json().catch(() => null);
          message = json?.error || json?.message || message;
        }
        throw new Error(message);
      }

      // Stream the PDF blob and trigger browser download
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `pulsepath-informe-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();

      // Clean up
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);

      setState('idle');
    } catch (err) {
      console.error('[reportButton] Error al descargar el PDF:', err?.message || err);
      setState('error');

      // Auto-reset to idle after 5 s so the user can retry
      setTimeout(() => {
        if (btn.dataset.state === 'error') setState('idle');
      }, 5_000);

      // Show a non-blocking toast-style message (fallback: alert)
      const msg = err?.message || 'No se pudo generar el informe PDF.';
      showErrorToast(container, msg);
    }
  }

  btn.addEventListener('click', downloadReport);
}

/**
 * Muestra un mensaje de error inline debajo del botón durante 6 segundos.
 * No usa alert() para no bloquear la UI.
 * @param {HTMLElement} container
 * @param {string} message
 */
function showErrorToast(container, message) {
  const existing = container.querySelector('.report-error-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'report-error-toast';
  toast.textContent = `⚠️ ${message}`;
  toast.style.cssText =
    'font-size:0.78rem; color:#ef4444; margin-top:4px; max-width:260px; line-height:1.4;';

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 6_000);
}
