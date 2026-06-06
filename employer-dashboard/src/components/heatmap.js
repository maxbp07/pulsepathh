import { formatValue, formatDimension } from '../lib/labels.js';

/** Mapas de calor disponibles: etiqueta corta para el selector. */
const HEATMAP_TABS = [
  { rowKey: 'department', colKey: 'shift', label: 'Depto × Turno', icon: '🏢🕒' },
  { rowKey: 'department', colKey: 'gender', label: 'Depto × Género', icon: '🏢⚧' },
  { rowKey: 'shift', colKey: 'gender', label: 'Turno × Género', icon: '🕒⚧' },
  { rowKey: 'department', colKey: 'ageBand', label: 'Depto × Edad', icon: '🏢🎂' },
  { rowKey: 'shift', colKey: 'ageBand', label: 'Turno × Edad', icon: '🕒🎂' },
  { rowKey: 'department', colKey: 'tenureBand', label: 'Depto × Antigüedad', icon: '🏢📅' },
];

let selectedHeatmapIdx = 0;
let lastHeatmaps = [];
let heatmapMount = null;

/** Color de fondo de celda según índice de riesgo (escala semáforo continua). */
function cellColor(risk) {
  if (risk >= 50) return 'rgba(239,68,68,0.85)';
  if (risk >= 42) return 'rgba(244,114,60,0.82)';
  if (risk >= 35) return 'rgba(234,179,8,0.82)';
  if (risk >= 28) return 'rgba(132,204,22,0.75)';
  return 'rgba(34,197,94,0.78)';
}

/** Texto en blanco o negro según contraste con el fondo. */
function cellText(risk) {
  return risk >= 35 && risk < 50 ? '#1a1205' : '#fff';
}

function resolveHeatmaps(data) {
  if (data?.heatmaps?.length) return data.heatmaps;
  if (data?.heatmap?.rows?.length) return [data.heatmap];
  return [];
}

function tabIndexForHeatmap(hm) {
  const idx = HEATMAP_TABS.findIndex(
    (t) => t.rowKey === hm.rowKey && t.colKey === hm.colKey,
  );
  return idx >= 0 ? idx : -1;
}

function renderHeatmapTable(hm) {
  const cellAt = (r, c) => hm.cells.find((x) => x.row === r && x.col === c) || { empty: true };

  const headerCells = hm.cols
    .map((c) => `<th scope="col">${formatValue(hm.colKey, c)}</th>`)
    .join('');

  const bodyRows = hm.rows
    .map((r) => {
      const tds = hm.cols
        .map((c) => {
          const cell = cellAt(r, c);
          if (cell.empty) {
            return `<td class="hm-cell hm-cell--empty" title="Sin personas en este grupo">·</td>`;
          }
          if (cell.kanon_protected) {
            return `<td class="hm-cell hm-cell--kanon" title="Protegido por K-anonimidad (menos de 5 personas)">🔒</td>`;
          }
          const risk = cell.avg_risk_index;
          return `
            <td class="hm-cell" style="background:${cellColor(risk)};color:${cellText(risk)}"
                title="${formatValue(hm.rowKey, r)} · ${formatValue(hm.colKey, c)}: riesgo ${risk}, ${cell.pct_high_risk}% en riesgo alto, ${cell.count_unique_users} personas">
              <span class="hm-risk">${Math.round(risk)}</span>
              <span class="hm-sub">${cell.count_unique_users}p</span>
            </td>`;
        })
        .join('');
      return `<tr><th scope="row" class="hm-rowlabel">${formatValue(hm.rowKey, r)}</th>${tds}</tr>`;
    })
    .join('');

  return `
    <div class="heatmap-wrapper">
      <table class="heatmap" aria-label="Mapa de calor de riesgo">
        <thead><tr><th></th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
    <div class="heatmap-legend">
      <span class="hm-leg"><i style="background:rgba(34,197,94,0.78)"></i> Bajo</span>
      <span class="hm-leg"><i style="background:rgba(234,179,8,0.82)"></i> Medio</span>
      <span class="hm-leg"><i style="background:rgba(239,68,68,0.85)"></i> Alto</span>
      <span class="hm-leg"><i class="hm-leg-kanon">🔒</i> Protegido (K=5)</span>
    </div>`;
}

function paintHeatmapContent(host, hm) {
  if (!hm || !hm.rows?.length || !hm.cols?.length) {
    host.innerHTML = '<p class="charts-empty">Sin datos para este cruce.</p>';
    return;
  }
  host.innerHTML = renderHeatmapTable(hm);
}

/**
 * Renderiza mapas de calor multidimensionales con selector de cruce.
 * @param {HTMLElement} container
 * @param {object|null} data Respuesta de /api/v1/dashboard/:orgId
 */
export function renderHeatmap(container, data) {
  heatmapMount = container;
  lastHeatmaps = resolveHeatmaps(data);

  if (!lastHeatmaps.length) {
    container.innerHTML = '';
    return;
  }

  // Tabs visibles: los que tienen datos en la API + orden fijo de HEATMAP_TABS
  const available = HEATMAP_TABS.map((tab, i) => {
    const hm = lastHeatmaps.find((h) => h.rowKey === tab.rowKey && h.colKey === tab.colKey);
    return hm ? { tab, hm, order: i } : null;
  }).filter(Boolean);

  if (!available.length) {
    container.innerHTML = '';
    return;
  }

  if (selectedHeatmapIdx >= available.length) selectedHeatmapIdx = 0;
  const current = available[selectedHeatmapIdx];
  const hm = current.hm;

  const tabsHtml = available
    .map((a, i) => {
      const active = i === selectedHeatmapIdx ? ' hm-tab--active' : '';
      return `<button type="button" class="hm-tab${active}" data-hm-idx="${i}">
        <span aria-hidden="true">${a.tab.icon}</span> ${a.tab.label}
      </button>`;
    })
    .join('');

  container.innerHTML = `
    <section class="card" style="margin-top:1.25rem">
      <h2 class="card-title">Mapas de calor · cruces de riesgo</h2>
      <p class="heatmap-help">Cada celda = riesgo medio de un cruce (ej. Informática + Noche). Ideal para ver dónde actuar sin datos personales.</p>
      <div class="hm-tabs" role="tablist" aria-label="Seleccionar cruce de mapa de calor">${tabsHtml}</div>
      <h3 class="hm-subtitle">${formatDimension(hm.rowKey)} × ${formatDimension(hm.colKey)}</h3>
      <div id="hm-content"></div>
    </section>
  `;

  paintHeatmapContent(container.querySelector('#hm-content'), hm);

  container.querySelectorAll('.hm-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedHeatmapIdx = Number(btn.dataset.hmIdx);
      renderHeatmap(heatmapMount, { heatmaps: lastHeatmaps });
    });
  });
}
