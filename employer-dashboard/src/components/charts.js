import Chart from 'chart.js/auto';
import { DIMENSIONS, formatValue, formatDepartment } from '../lib/labels.js';

/** Instancias activas para destruirlas antes de redibujar. */
let barChart = null;
let lineChart = null;
let driversChart = null;

// Dimensión seleccionada para las barras de riesgo y el desglose de drivers.
// Se conserva entre recargas (cambios de filtro).
let selectedDimension = 'department';

// Última respuesta de la API para poder redibujar al cambiar de dimensión sin
// volver a llamar al backend.
let lastData = null;
let mountEl = null;

function destroyCharts() {
  if (barChart) { barChart.destroy(); barChart = null; }
  if (lineChart) { lineChart.destroy(); lineChart = null; }
  if (driversChart) { driversChart.destroy(); driversChart = null; }
}

/**
 * Color CoPsoQ/istas21 según nivel de riesgo.
 * Verde #22c55e (<35) · Amarillo #eab308 (35-49) · Rojo #ef4444 (≥50)
 */
function riskColor(value, alpha = 1) {
  if (value >= 50) return `rgba(239,68,68,${alpha})`;
  if (value >= 35) return `rgba(234,179,8,${alpha})`;
  return `rgba(34,197,94,${alpha})`;
}

/** Paleta fija para los cuatro drivers del índice de riesgo. */
const DRIVER_META = [
  { key: 'pvt', label: 'Fatiga / Vigilancia', color: '#3b82f6' },
  { key: 'stroop', label: 'Control cognitivo', color: '#8b5cf6' },
  { key: 'cbi', label: 'Burnout (CBI)', color: '#ef4444' },
  { key: 'sleep', label: 'Déficit de sueño', color: '#f59e0b' },
];

const darkAxis = {
  ticks: { color: '#64748b', font: { size: 11 } },
  grid: { color: 'rgba(255,255,255,0.05)' },
};

/** Devuelve los grupos visibles (no suprimidos) de una dimensión. */
function visibleSegments(data, dimension) {
  const segs = data?.segments?.[dimension] || [];
  return segs.filter((g) => !g.kanon_protected && typeof g.avg_risk_index === 'number');
}

/** Cuenta grupos suprimidos por K-anonimidad en una dimensión. */
function suppressedSegments(data, dimension) {
  const segs = data?.segments?.[dimension] || [];
  return segs.filter((g) => g.kanon_protected).length;
}

/**
 * Renderiza el bloque de visualizaciones: selector de dimensión, barras de
 * riesgo por dimensión, desglose de drivers y tendencia temporal.
 */
export function renderCharts(container, data) {
  destroyCharts();
  mountEl = container;
  lastData = data;

  // Fallback: si no llega `segments` (backend antiguo), derivamos department
  // desde groups para no romper.
  if (data && !data.segments && Array.isArray(data.groups)) {
    data.segments = { department: data.groups.map((g) => ({ ...g, group: g.department })) };
  }

  const hasAnySegments =
    data?.segments && DIMENSIONS.some((d) => visibleSegments(data, d.key).length > 0);

  if (!data || !hasAnySegments) {
    container.innerHTML = '<p class="charts-empty">Sin datos suficientes para mostrar</p>';
    return;
  }

  // Si la dimensión seleccionada no tiene datos, cae a department.
  if (visibleSegments(data, selectedDimension).length === 0) {
    selectedDimension = 'department';
  }

  // Solo mostramos dimensiones que tengan al menos un grupo (visible o suprimido).
  const availableDims = DIMENSIONS.filter(
    (d) => (data.segments[d.key] || []).length > 0,
  );

  const selectorHtml = availableDims
    .map(
      (d) =>
        `<button type="button" class="dim-btn${d.key === selectedDimension ? ' dim-btn--active' : ''}" data-dim="${d.key}">
           <span class="dim-btn-icon">${d.icon}</span>${d.label}
         </button>`,
    )
    .join('');

  container.innerHTML = `
    <div class="dim-selector" role="tablist" aria-label="Segmentar por dimensión">
      <span class="dim-selector-label">Segmentar por:</span>
      ${selectorHtml}
    </div>
    <div id="dim-charts"></div>
    <div class="chart-wrapper" style="margin-top:1.25rem">
      <h3 class="chart-title">Tendencia temporal por departamento</h3>
      <canvas id="chart-line" aria-label="Línea: tendencia temporal del riesgo"></canvas>
    </div>
  `;

  // Listeners del selector.
  container.querySelectorAll('.dim-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedDimension = btn.dataset.dim;
      renderCharts(mountEl, lastData);
    });
  });

  renderDimensionCharts(container.querySelector('#dim-charts'), data, selectedDimension);
  renderTrendLine(container.querySelector('#chart-line'), data);
}

/** Barras de riesgo + desglose de drivers para la dimensión seleccionada. */
function renderDimensionCharts(host, data, dimension) {
  const groups = visibleSegments(data, dimension);
  const suppressed = suppressedSegments(data, dimension);
  const dimLabel = DIMENSIONS.find((d) => d.key === dimension)?.label || dimension;

  if (groups.length === 0) {
    host.innerHTML = `<p class="charts-empty">Sin grupos con suficientes personas (K=5) para «${dimLabel}».</p>`;
    return;
  }

  const kAnonNote =
    suppressed > 0
      ? `<p class="charts-kanon-note">🔒 ${suppressed} grupo${suppressed > 1 ? 's' : ''} de «${dimLabel}» suprimido${suppressed > 1 ? 's' : ''} por K-anonimidad (&lt; 5 personas).</p>`
      : '';

  host.innerHTML = `
    ${kAnonNote}
    <div class="charts-grid">
      <div class="chart-wrapper">
        <h3 class="chart-title">Índice de riesgo por ${dimLabel.toLowerCase()}</h3>
        <canvas id="chart-bar" aria-label="Barras: riesgo por ${dimLabel}"></canvas>
      </div>
      <div class="chart-wrapper">
        <h3 class="chart-title">¿De qué viene el riesgo? · ${dimLabel}</h3>
        <canvas id="chart-drivers" aria-label="Barras apiladas: desglose de drivers"></canvas>
      </div>
    </div>
  `;

  const labels = groups.map((g) => formatValue(dimension, g.group));

  /* ── Barras de riesgo ── */
  barChart = new Chart(host.querySelector('#chart-bar'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Índice de riesgo medio',
          data: groups.map((g) => g.avg_risk_index),
          backgroundColor: groups.map((g) => riskColor(g.avg_risk_index, 0.75)),
          borderColor: groups.map((g) => riskColor(g.avg_risk_index, 1)),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const g = groups[ctx.dataIndex];
              return [
                ` Riesgo: ${ctx.parsed.x} / 100`,
                ` ${g.pct_high_risk}% en riesgo alto · ${g.count_unique_users} personas`,
              ];
            },
          },
        },
      },
      scales: {
        x: { min: 0, max: 100, ...darkAxis, grid: { color: 'rgba(255,255,255,0.06)' } },
        y: {
          ...darkAxis,
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 12, weight: '500' } },
        },
      },
    },
  });

  /* ── Desglose de drivers (barras apiladas, % de contribución) ── */
  const driverDatasets = DRIVER_META.map((d) => ({
    label: d.label,
    data: groups.map((g) => (g.drivers ? g.drivers[d.key] : 0)),
    backgroundColor: d.color,
    borderWidth: 0,
    borderRadius: 2,
  }));

  driversChart = new Chart(host.querySelector('#chart-drivers'), {
    type: 'bar',
    data: { labels, datasets: driverDatasets },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#cbd5e1', font: { size: 11 }, usePointStyle: true, padding: 12 },
        },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.x}%` } },
      },
      scales: {
        x: {
          stacked: true,
          min: 0,
          max: 100,
          ...darkAxis,
          ticks: { color: '#64748b', font: { size: 11 }, callback: (v) => `${v}%` },
        },
        y: {
          stacked: true,
          ...darkAxis,
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 12, weight: '500' } },
        },
      },
    },
  });
}

/** Línea de tendencia temporal por departamento (igual que antes). */
function renderTrendLine(canvas, data) {
  if (!canvas) return;
  const deptSegs = (data?.segments?.department || []).filter(
    (g) => !g.kanon_protected && Array.isArray(g.trend) && g.trend.length >= 2,
  );

  if (deptSegs.length === 0) {
    canvas.replaceWith(
      Object.assign(document.createElement('p'), {
        className: 'charts-empty',
        textContent: 'Sin datos de tendencia disponibles (mínimo 2 semanas)',
      }),
    );
    return;
  }

  const maxWeeks = deptSegs.reduce((m, g) => Math.max(m, g.trend.length), 0);
  const labels = Array.from({ length: maxWeeks }, (_, i) => `Sem ${i + 1}`);

  const datasets = deptSegs.map((g) => {
    const avgTrend = g.trend.reduce((a, b) => a + b, 0) / g.trend.length;
    const lineColor = riskColor(avgTrend, 1);
    return {
      label: formatDepartment(g.group ?? g.department),
      data: g.trend,
      borderColor: lineColor,
      backgroundColor: riskColor(avgTrend, 0.08),
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: lineColor,
      pointBorderColor: 'rgba(7,9,15,0.6)',
      pointBorderWidth: 1.5,
      borderWidth: 2.5,
    };
  });

  lineChart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: '#cbd5e1',
            font: { size: 12, weight: '500' },
            usePointStyle: true,
            pointStyleWidth: 12,
            padding: 16,
          },
        },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} / 100` } },
      },
      scales: {
        y: { min: 0, max: 100, ...darkAxis },
        x: { ...darkAxis, grid: { display: false } },
      },
    },
  });
}
