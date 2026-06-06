import { apiFetch, clearToken, getOrgId, getRole } from '../api/client.js';
import { renderFilters } from '../components/filters.js';
import { renderCharts } from '../components/charts.js';
import { renderHeatmap } from '../components/heatmap.js';
import { renderInsights } from '../components/insights.js';
import { renderSegmentOverview } from '../components/segmentOverview.js';
import { renderAlerts } from '../components/alerts.js';
import { renderExportCsv } from '../components/exportCsv.js';
import { renderReportButton } from '../components/reportButton.js';
import { formatDepartment } from '../lib/labels.js';

/**
 * Construye la URL con query params opcionales, omitiendo valores vacíos.
 */
function buildApiUrl(orgId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.department) params.set('department', filters.department);
  if (filters.shift) params.set('shift', filters.shift);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const qs = params.toString();
  return `/api/v1/dashboard/${orgId}${qs ? `?${qs}` : ''}`;
}

/**
 * Determina el nivel semáforo CoPsoQ/istas21 a partir del avg_risk_index.
 * Verde <35 | Amarillo 35-49 | Rojo ≥50
 */
function semaphoreLevel(avgRisk) {
  if (avgRisk >= 50) return { cls: 'red', label: 'Riesgo ALTO', emoji: '🔴' };
  if (avgRisk >= 35) return { cls: 'yellow', label: 'Riesgo MEDIO', emoji: '🟡' };
  return { cls: 'green', label: 'Riesgo BAJO', emoji: '🟢' };
}

/**
 * Clase KPI de riesgo basada en avg_risk_index.
 */
function riskKpiClass(value) {
  if (value >= 50) return 'kpi-card--red';
  if (value >= 35) return 'kpi-card--yellow';
  return 'kpi-card--green';
}

/**
 * Clase KPI para pct_high_risk (umbral >20%).
 */
function highRiskKpiClass(pct) {
  return pct > 20 ? 'kpi-card--red' : 'kpi-card--green';
}

/**
 * Renderiza el bloque org_total: semáforo grande + KPI cards.
 */
function updateOrgTotal(statsEl, orgTotal) {
  if (!orgTotal) {
    statsEl.innerHTML = '<p class="stats-empty">Sin datos globales disponibles.</p>';
    return;
  }

  if (orgTotal.kanon_protected) {
    statsEl.innerHTML = `
      <p class="stats-kanon">
        <span style="font-size:1.1rem">🔒</span>
        Datos globales suprimidos por K-anonimidad (menos de 5 personas únicas en el período).
      </p>`;
    return;
  }

  const { avg_risk_index, pct_high_risk, count_unique_users, count, drivers } = orgTotal;
  const sem = semaphoreLevel(avg_risk_index ?? 0);
  const riskClass = riskKpiClass(avg_risk_index ?? 0);
  const highRiskClass = highRiskKpiClass(pct_high_risk ?? 0);

  const pctTrendClass = (pct_high_risk ?? 0) > 20 ? 'kpi-trend--up' : 'kpi-trend--down';
  const pctTrendLabel = (pct_high_risk ?? 0) > 20 ? '↑ Alerta' : '↓ OK';

  const driverLabels = {
    pvt: 'Fatiga / vigilancia',
    stroop: 'Control cognitivo',
    cbi: 'Burnout',
    sleep: 'Déficit de sueño',
  };
  const driverBadge =
    drivers?.dominant
      ? `<span class="driver-badge" title="Principal factor del índice de riesgo">🧠 ${driverLabels[drivers.dominant] || drivers.dominant}</span>`
      : '';

  statsEl.innerHTML = `
    <div class="semaphore-block">
      <div class="semaphore semaphore--${sem.cls}" aria-label="Nivel de riesgo: ${sem.label}">
        ${Math.round(avg_risk_index ?? 0)}
      </div>
      <div class="semaphore-info">
        <span class="semaphore-label">Índice de riesgo global</span>
        <span class="semaphore-level">${sem.emoji} ${sem.label}</span>
        <span class="semaphore-desc">Metodología CoPsoQ·istas21 · K-anonimidad K=5 ${driverBadge}</span>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card ${riskClass}">
        <div class="kpi-label">Índice de riesgo medio</div>
        <div class="kpi-value-row">
          <span class="kpi-number">${avg_risk_index ?? '—'}</span>
          <span class="kpi-unit">/ 100</span>
        </div>
      </div>

      <div class="kpi-card ${highRiskClass}">
        <div class="kpi-label">En riesgo alto</div>
        <div class="kpi-value-row">
          <span class="kpi-number">${pct_high_risk ?? '—'}</span>
          <span class="kpi-unit">%</span>
          <span class="kpi-trend ${pctTrendClass}">${pctTrendLabel}</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Participantes únicos</div>
        <div class="kpi-value-row">
          <span class="kpi-number">${count_unique_users ?? '—'}</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Sesiones totales</div>
        <div class="kpi-value-row">
          <span class="kpi-number">${count ?? '—'}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza la tabla de departamentos debajo de los charts.
 * Columnas: Departamento | Usuarios | Riesgo medio | % Riesgo alto | Tendencia | Estado
 * Grupos con kanon_protected muestran fila con badge en lugar de métricas.
 */
function renderDeptTable(container, data) {
  const deptSegs = data?.segments?.department;
  const groups = deptSegs?.length
    ? deptSegs.map((g) => ({ ...g, department: g.group ?? g.department }))
    : data?.groups;

  if (!groups || groups.length === 0) {
    container.innerHTML = '';
    return;
  }

  const hasDrivers = groups.some((g) => g.drivers?.dominant);
  const driverLabels = {
    pvt: 'Fatiga',
    stroop: 'Cognitivo',
    cbi: 'Burnout',
    sleep: 'Sueño',
  };

  const rows = groups
    .map((g) => {
      if (g.kanon_protected) {
        return `
          <tr>
            <td class="dept-name">${escapeHtml(formatDepartment(g.department))}</td>
            <td colspan="${hasDrivers ? 5 : 4}" style="text-align:left; padding-left:1rem">
              <span class="badge-kanon">Protegido (K-anonimidad)</span>
            </td>
          </tr>`;
      }

      const riskPillClass =
        g.avg_risk_index >= 50
          ? 'risk-pill--red'
          : g.avg_risk_index >= 35
            ? 'risk-pill--yellow'
            : 'risk-pill--green';

      const dotColor =
        g.avg_risk_index >= 50
          ? 'var(--risk-red)'
          : g.avg_risk_index >= 35
            ? 'var(--risk-yellow)'
            : 'var(--risk-green)';

      const trendHtml = buildTrendHtml(g.trend);
      const driverHtml = hasDrivers
        ? `<td><span class="driver-pill">${driverLabels[g.drivers?.dominant] || '—'}</span></td>`
        : '';

      return `
        <tr>
          <td class="dept-name">
            <span class="dept-dot" style="background:${dotColor}"></span>
            ${escapeHtml(formatDepartment(g.department))}</td>
          <td>${g.count_unique_users ?? '—'}</td>
          <td>
            <span class="risk-pill ${riskPillClass}">
              ${g.avg_risk_index ?? '—'}
            </span>
          </td>
          <td>${typeof g.pct_high_risk === 'number' ? g.pct_high_risk + '%' : '—'}</td>
          ${driverHtml}
          <td>${trendHtml}</td>
        </tr>`;
    })
    .join('');

  container.innerHTML = `
    <section class="card" style="margin-top:1.25rem">
      <h2 class="card-title">Detalle por departamento</h2>
      <div class="dept-table-wrapper">
        <table class="dept-table" aria-label="Métricas por departamento">
          <thead>
            <tr>
              <th>Departamento</th>
              <th>Usuarios únicos</th>
              <th>Riesgo medio</th>
              <th>% Riesgo alto</th>
              ${hasDrivers ? '<th>Factor principal</th>' : ''}
              <th>Tendencia</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Genera HTML de flecha de tendencia a partir del array trend del grupo.
 * Compara primer vs último valor. Sin datos → neutral.
 */
function buildTrendHtml(trend) {
  if (!Array.isArray(trend) || trend.length < 2) {
    return '<span class="trend-neutral">—</span>';
  }
  const first = trend[0];
  const last = trend[trend.length - 1];
  if (last > first) return `<span class="trend-up" title="Tendencia ascendente">↑ ${last}</span>`;
  if (last < first) return `<span class="trend-down" title="Tendencia descendente">↓ ${last}</span>`;
  return `<span class="trend-neutral">→ ${last}</span>`;
}

/** Escapa caracteres HTML para evitar XSS en nombres de departamento. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Muestra/oculta el estado de carga sobre el área de datos. */
function setLoading(loadingEl, statsEl, visible) {
  loadingEl.hidden = !visible;
  if (visible) {
    statsEl.innerHTML = `
      <div class="kpi-grid">
        ${Array(4).fill('<div class="skeleton-card"></div>').join('')}
      </div>`;
  }
}

/** Muestra un mensaje de error o lo limpia. */
function setError(errorEl, message) {
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

export function renderDashboard(container) {
  const orgId = getOrgId();
  const role = getRole() || 'viewer';

  // Track active filters so reportButton can read them at download time
  let currentFilters = {};

  container.innerHTML = `
    <div class="dashboard">
      <aside class="dashboard-sidebar">
        <div class="sidebar-brand">
          PulsePath
          <span>Piloto · Ajuntament BCN</span>
        </div>
        <nav class="sidebar-nav">
          <a href="#" class="active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </a>
        </nav>
        <div class="sidebar-footer">
          <button type="button" class="btn btn-ghost" id="logout-btn" style="width:100%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main class="dashboard-main">
        <header class="dashboard-header">
          <div>
            <h1>Dashboard de salud</h1>
            <p class="subtitle">
              Métricas agregadas · 
              <span class="subtitle-badge">🔒 K-anonimidad K=5</span>
            </p>
          </div>
          <div class="dashboard-actions" id="export-area"></div>
        </header>

        <div class="loading-bar" id="loading-bar" hidden aria-live="polite" aria-label="Cargando datos">
          <span class="loading-spinner"></span>
          Cargando datos…
        </div>
        <div class="error-banner" id="error-banner" hidden role="alert"></div>

        <section class="card" id="org-total-area" style="margin-bottom:1.25rem">
          <h2 class="card-title">Resumen de la organización</h2>
          <div id="org-stats"></div>
        </section>

        <div id="insights-area"></div>

        <div class="dashboard-grid">
          <section class="card" id="filters-area"></section>
          <section id="alerts-area"></section>
          <div id="segment-overview-area"></div>
          <section class="card" id="charts-area">
            <h2 class="card-title">Visualizaciones</h2>
            <div id="charts-mount"></div>
          </section>
          <div id="heatmap-area"></div>
          <div id="dept-table-area"></div>
        </div>
      </main>
    </div>
  `;

  container.querySelector('#logout-btn').addEventListener('click', () => {
    clearToken();
    window.location.reload();
  });

  const loadingEl = container.querySelector('#loading-bar');
  const errorEl = container.querySelector('#error-banner');
  const statsEl = container.querySelector('#org-stats');
  const alertsEl = container.querySelector('#alerts-area');
  const insightsEl = container.querySelector('#insights-area');
  const segmentOverviewEl = container.querySelector('#segment-overview-area');
  const chartsMount = container.querySelector('#charts-mount');
  const heatmapEl = container.querySelector('#heatmap-area');
  const deptTableEl = container.querySelector('#dept-table-area');

  /**
   * Carga los datos del dashboard desde la API y actualiza todos los componentes.
   */
  async function loadData(filters = {}) {
    if (!orgId) {
      setError(errorEl, 'No se encontró la organización. Vuelve a iniciar sesión.');
      return;
    }

    setLoading(loadingEl, statsEl, true);
    setError(errorEl, null);

    try {
      const data = await apiFetch(buildApiUrl(orgId, filters));

      updateOrgTotal(statsEl, data.org_total ?? null);
      renderInsights(insightsEl, data);
      renderAlerts(alertsEl, data);
      renderSegmentOverview(segmentOverviewEl, data);
      renderCharts(chartsMount, data);
      renderHeatmap(heatmapEl, data);
      renderDeptTable(deptTableEl, data);
    } catch (err) {
      updateOrgTotal(statsEl, null);
      renderInsights(insightsEl, null);
      renderAlerts(alertsEl, null);
      renderSegmentOverview(segmentOverviewEl, null);
      renderCharts(chartsMount, null);
      heatmapEl.innerHTML = '';
      deptTableEl.innerHTML = '';
      setError(errorEl, err.message || 'No se pudieron cargar los datos.');
    } finally {
      setLoading(loadingEl, statsEl, false);
    }
  }

  renderFilters(container.querySelector('#filters-area'), {
    orgId,
    onFilterChange: (filters) => {
      currentFilters = filters;
      loadData(filters);
    },
  });

  const exportArea = container.querySelector('#export-area');
  renderExportCsv(exportArea, { orgId, role });
  renderReportButton(exportArea, { orgId, getFilters: () => currentFilters });

  // Carga inicial de datos
  loadData();
}
