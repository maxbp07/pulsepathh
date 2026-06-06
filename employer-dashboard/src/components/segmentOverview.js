import { DIMENSIONS, formatValue } from '../lib/labels.js';

function riskBarColor(risk) {
  if (risk >= 50) return 'var(--risk-red)';
  if (risk >= 35) return 'var(--risk-yellow)';
  return 'var(--risk-green)';
}

function visibleGroups(segs) {
  return (segs || []).filter((g) => !g.kanon_protected && typeof g.avg_risk_index === 'number');
}

/**
 * Panel compacto: una tarjeta por dimensión con barras de riesgo relativas.
 * @param {HTMLElement} container
 * @param {object|null} data
 */
export function renderSegmentOverview(container, data) {
  if (!data?.segments) {
    container.innerHTML = '';
    return;
  }

  const cards = DIMENSIONS.map((dim) => {
    const groups = visibleGroups(data.segments[dim.key]);
    const suppressed = (data.segments[dim.key] || []).filter((g) => g.kanon_protected).length;

    if (groups.length === 0) {
      return `
        <div class="seg-card seg-card--empty">
          <div class="seg-card-head"><span>${dim.icon}</span> ${dim.label}</div>
          <p class="seg-empty">Sin grupos con K≥5${suppressed ? ` (${suppressed} ocultos)` : ''}</p>
        </div>`;
    }

    const sorted = [...groups].sort((a, b) => b.avg_risk_index - a.avg_risk_index);
    const maxRisk = Math.max(...sorted.map((g) => g.avg_risk_index), 1);
    const limit = dim.key === 'shift' || dim.key === 'gender' ? sorted.length : 6;
    const rows = sorted
      .slice(0, limit)
      .map((g) => {
        const pct = Math.round((g.avg_risk_index / 100) * 100);
        const width = Math.round((g.avg_risk_index / maxRisk) * 100);
        const driver = g.drivers?.dominant;
        const driverShort =
          driver === 'pvt'
            ? 'Fatiga'
            : driver === 'stroop'
              ? 'Cognitivo'
              : driver === 'cbi'
                ? 'Burnout'
                : driver === 'sleep'
                  ? 'Sueño'
                  : '';
        return `
          <div class="seg-row" title="${formatValue(dim.key, g.group)}: ${g.avg_risk_index} · ${g.pct_high_risk}% alto · ${g.count_unique_users}p">
            <span class="seg-label">${formatValue(dim.key, g.group)}</span>
            <div class="seg-bar-track">
              <div class="seg-bar-fill" style="width:${width}%;background:${riskBarColor(g.avg_risk_index)}"></div>
            </div>
            <span class="seg-value">${Math.round(g.avg_risk_index)}</span>
            ${driverShort ? `<span class="seg-driver">${driverShort}</span>` : ''}
          </div>`;
      })
      .join('');

    return `
      <div class="seg-card">
        <div class="seg-card-head"><span>${dim.icon}</span> ${dim.label}</div>
        <div class="seg-rows">${rows}</div>
        ${suppressed ? `<p class="seg-kanon">🔒 ${suppressed} grupo(s) ocultos</p>` : ''}
      </div>`;
  }).join('');

  container.innerHTML = `
    <section class="card segment-overview">
      <h2 class="card-title">Panorama por dimensiones</h2>
      <p class="segment-overview-help">Comparativa rápida: departamento, turno (mañana/tarde/noche), género, edad y antigüedad.</p>
      <div class="seg-grid">${cards}</div>
    </section>
  `;
}
