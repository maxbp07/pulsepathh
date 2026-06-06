import Chart from 'chart.js/auto';
import { formatDepartment } from '../lib/labels.js';

/** Instancias activas para destruirlas antes de redibujar. */
let barChart = null;
let lineChart = null;

function destroyCharts() {
  if (barChart) { barChart.destroy(); barChart = null; }
  if (lineChart) { lineChart.destroy(); lineChart = null; }
}

/**
 * Devuelve el color CoPsoQ/istas21 según nivel de riesgo.
 * Verde #22c55e (<35) · Amarillo #eab308 (35-49) · Rojo #ef4444 (≥50)
 */
function riskColor(value, alpha = 1) {
  if (value >= 50) return `rgba(239,68,68,${alpha})`;
  if (value >= 35) return `rgba(234,179,8,${alpha})`;
  return `rgba(34,197,94,${alpha})`;
}

/** Configuración compartida de ejes en modo oscuro. */
const darkAxis = {
  ticks: { color: '#64748b', font: { size: 11 } },
  grid: { color: 'rgba(255,255,255,0.05)' },
};

/**
 * Renderiza las gráficas del dashboard con datos reales de la API.
 *
 * - Barras horizontales: avg_risk_index por departamento (grupos visibles).
 * - Línea:  tendencia temporal del primer departamento con datos semanales.
 *
 * Los grupos kanon_protected no aparecen en el chart (se explican en la tabla).
 *
 * @param {HTMLElement} container
 * @param {object|null} data - Respuesta de /api/v1/dashboard/:orgId
 */
export function renderCharts(container, data) {
  destroyCharts();

  const visibleGroups = (data?.groups || []).filter(
    (g) => !g.kanon_protected && typeof g.avg_risk_index === 'number',
  );

  const suppressedCount = (data?.groups || []).filter((g) => g.kanon_protected).length;

  if (!data || visibleGroups.length === 0) {
    container.innerHTML = '<p class="charts-empty">Sin datos suficientes para mostrar</p>';
    return;
  }

  const kAnonNote =
    suppressedCount > 0
      ? `<p class="charts-kanon-note">
           🔒 ${suppressedCount} departamento${suppressedCount > 1 ? 's' : ''} suprimido${suppressedCount > 1 ? 's' : ''} por K-anonimidad — ver detalle en la tabla inferior.
         </p>`
      : '';

  container.innerHTML = `
    ${kAnonNote}
    <div class="charts-grid">
      <div class="chart-wrapper">
        <h3 class="chart-title">Índice de riesgo por departamento</h3>
        <canvas id="chart-bar" aria-label="Barras horizontales: riesgo por departamento"></canvas>
      </div>
      <div class="chart-wrapper">
        <h3 class="chart-title">Tendencia temporal</h3>
        <canvas id="chart-line" aria-label="Línea: tendencia temporal del riesgo"></canvas>
      </div>
    </div>
  `;

  /* ── Barras horizontales por departamento ── */
  barChart = new Chart(container.querySelector('#chart-bar'), {
    type: 'bar',
    data: {
      labels: visibleGroups.map((g) => formatDepartment(g.department)),
      datasets: [
        {
          label: 'Índice de riesgo medio',
          data: visibleGroups.map((g) => g.avg_risk_index),
          backgroundColor: visibleGroups.map((g) => riskColor(g.avg_risk_index, 0.75)),
          borderColor: visibleGroups.map((g) => riskColor(g.avg_risk_index, 1)),
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
            label: (ctx) => ` Riesgo: ${ctx.parsed.x} / 100`,
          },
        },
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          ...darkAxis,
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
        y: {
          ...darkAxis,
          grid: { display: false },
          ticks: {
            color: '#94a3b8',
            font: { size: 12, weight: '500' },
          },
        },
      },
    },
  });

  /* ── Gráfica de línea: tendencia temporal (todas las series) ── */
  const deptsWithTrend = visibleGroups.filter(
    (g) => Array.isArray(g.trend) && g.trend.length >= 2,
  );

  if (deptsWithTrend.length > 0) {
    // Número máximo de semanas entre todos los departamentos.
    const maxWeeks = deptsWithTrend.reduce((m, g) => Math.max(m, g.trend.length), 0);
    const labels = Array.from({ length: maxWeeks }, (_, i) => `Sem ${i + 1}`);

    const datasets = deptsWithTrend.map((g) => {
      const avgTrend = g.trend.reduce((a, b) => a + b, 0) / g.trend.length;
      const lineColor = riskColor(avgTrend, 1);
      return {
        label: formatDepartment(g.department),
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

    lineChart = new Chart(container.querySelector('#chart-line'), {
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
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} / 100`,
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ...darkAxis,
          },
          x: {
            ...darkAxis,
            grid: { display: false },
          },
        },
      },
    });
  } else {
    const lineCanvas = container.querySelector('#chart-line');
    if (lineCanvas) {
      lineCanvas.replaceWith(
        Object.assign(document.createElement('p'), {
          className: 'charts-empty',
          textContent: 'Sin datos de tendencia disponibles (mínimo 2 semanas)',
        }),
      );
    }
  }
}
