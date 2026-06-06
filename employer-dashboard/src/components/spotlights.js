import { formatValue, formatDepartment } from '../lib/labels.js';

const SHIFT_ORDER = ['morning', 'afternoon', 'night'];
const SHIFT_META = {
  morning: { icon: '🌅', hint: 'Jornada diurna' },
  afternoon: { icon: '☀️', hint: 'Tarde / continuidad' },
  night: { icon: '🌙', hint: 'Nocturno · mayor fatiga' },
};

const DRIVER_SHORT = {
  pvt: 'Fatiga',
  stroop: 'Cognitivo',
  cbi: 'Burnout',
  sleep: 'Sueño',
};

function visible(segs) {
  return (segs || []).filter((g) => !g.kanon_protected && typeof g.avg_risk_index === 'number');
}

function riskClass(risk) {
  if (risk >= 50) return 'spot--red';
  if (risk >= 35) return 'spot--yellow';
  return 'spot--green';
}

function vsOrgDelta(risk, orgRisk) {
  if (typeof orgRisk !== 'number') return '';
  const d = Math.round(risk - orgRisk);
  if (d === 0) return '<span class="spot-delta spot-delta--neutral">= media org</span>';
  const cls = d > 0 ? 'spot-delta--up' : 'spot-delta--down';
  const sign = d > 0 ? '+' : '';
  return `<span class="spot-delta ${cls}">${sign}${d} vs org</span>`;
}

/**
 * Tarjetas destacadas: turnos (mañana/tarde/noche) y brecha de género.
 * Pensado para que RRHH vea de un vistazo dónde concentrar acción.
 */
export function renderSpotlights(container, data) {
  if (!data?.segments) {
    container.innerHTML = '';
    return;
  }

  const orgRisk = data.org_total?.avg_risk_index;
  const shifts = visible(data.segments.shift);
  const genders = visible(data.segments.gender);
  const depts = visible(data.segments.department);

  if (!shifts.length && !genders.length) {
    container.innerHTML = '';
    return;
  }

  const shiftCards = SHIFT_ORDER.map((key) => {
    const g = shifts.find((s) => s.group === key);
    const meta = SHIFT_META[key];
    if (!g) {
      return `
        <div class="spot-card spot-card--muted">
          <div class="spot-card-top"><span>${meta.icon}</span> ${formatValue('shift', key)}</div>
          <p class="spot-empty">🔒 Sin K≥5 o sin datos</p>
        </div>`;
    }
    const cls = riskClass(g.avg_risk_index);
    const driver = g.drivers?.dominant;
    return `
      <div class="spot-card ${cls}">
        <div class="spot-card-top">
          <span class="spot-icon">${meta.icon}</span>
          <div>
            <div class="spot-title">${formatValue('shift', key)}</div>
            <div class="spot-hint">${meta.hint}</div>
          </div>
        </div>
        <div class="spot-risk">${Math.round(g.avg_risk_index)}</div>
        <div class="spot-metrics">
          <span>${g.pct_high_risk}% riesgo alto</span>
          <span>${g.count_unique_users} personas</span>
        </div>
        ${driver ? `<div class="spot-driver">Principal: ${DRIVER_SHORT[driver] || driver}</div>` : ''}
        ${vsOrgDelta(g.avg_risk_index, orgRisk)}
      </div>`;
  }).join('');

  let genderHtml = '';
  if (genders.length >= 1) {
    const male = genders.find((g) => g.group === 'male');
    const female = genders.find((g) => g.group === 'female');
    const gap =
      male && female ? Math.round(Math.abs(male.avg_risk_index - female.avg_risk_index)) : null;

    const genderCol = (g, label) => {
      if (!g) return `<div class="gender-col gender-col--empty"><span>🔒 ${label}</span></div>`;
      const cls = riskClass(g.avg_risk_index);
      return `
        <div class="gender-col ${cls}">
          <div class="gender-label">${label}</div>
          <div class="gender-risk">${Math.round(g.avg_risk_index)}</div>
          <div class="gender-sub">${g.pct_high_risk}% alto · ${g.count_unique_users}p</div>
          ${g.drivers?.dominant ? `<div class="gender-driver">${DRIVER_SHORT[g.drivers.dominant]}</div>` : ''}
        </div>`;
    };

    genderHtml = `
      <div class="spot-gender-block">
        <h3 class="spot-section-title">⚧ Comparativa por género</h3>
        <div class="gender-compare">
          ${genderCol(male, 'Hombre')}
          ${gap != null && gap >= 5 ? `<div class="gender-gap" title="Diferencia de riesgo medio">Δ ${gap}</div>` : '<div class="gender-gap gender-gap--small">vs</div>'}
          ${genderCol(female, 'Mujer')}
        </div>
        ${gap != null && gap >= 8 ? `<p class="gender-gap-note">Brecha de ${gap} pts — revisar si responde a turnos o roles distintos.</p>` : ''}
      </div>`;
  }

  let deptShiftHtml = '';
  const hm = (data.heatmaps || []).find((h) => h.rowKey === 'department' && h.colKey === 'shift');
  if (hm?.cells?.length) {
    const hot = hm.cells
      .filter((c) => !c.kanon_protected && !c.empty)
      .sort((a, b) => b.avg_risk_index - a.avg_risk_index)
      .slice(0, 4);
    if (hot.length) {
      const chips = hot
        .map((c) => {
          const cls = riskClass(c.avg_risk_index);
          return `
            <div class="dept-shift-chip ${cls}" title="${c.count_unique_users} personas">
              <span class="dsc-dept">${formatDepartment(c.row)}</span>
              <span class="dsc-shift">${formatValue('shift', c.col)}</span>
              <span class="dsc-risk">${Math.round(c.avg_risk_index)}</span>
            </div>`;
        })
        .join('');
      deptShiftHtml = `
        <div class="spot-deptshift">
          <h3 class="spot-section-title">🎯 Cruces departamento × turno (top riesgo)</h3>
          <div class="dept-shift-chips">${chips}</div>
        </div>`;
    }
  }

  const deptBars =
    depts.length > 0
      ? depts
          .sort((a, b) => b.avg_risk_index - a.avg_risk_index)
          .map((d) => {
            const w = Math.round((d.avg_risk_index / 100) * 100);
            const color =
              d.avg_risk_index >= 50
                ? 'var(--risk-red)'
                : d.avg_risk_index >= 35
                  ? 'var(--risk-yellow)'
                  : 'var(--risk-green)';
            return `
              <div class="dept-bar-row" title="${d.pct_high_risk}% alto · ${d.count_unique_users}p">
                <span class="dept-bar-label">${formatDepartment(d.group)}</span>
                <div class="dept-bar-track"><div class="dept-bar-fill" style="width:${w}%;background:${color}"></div></div>
                <span class="dept-bar-val">${Math.round(d.avg_risk_index)}</span>
              </div>`;
          })
          .join('')
      : '';

  container.innerHTML = `
    <section class="card spotlights-panel">
      <h2 class="card-title">Vista ejecutiva · turnos y perfiles</h2>
      <p class="spotlights-help">Lo que un responsable de RRHH necesita ver primero: qué turno, qué género y qué combinación departamento-turno exige atención.</p>

      <h3 class="spot-section-title">🕒 Riesgo por turno (mañana · tarde · noche)</h3>
      <div class="spot-shift-grid">${shiftCards}</div>

      <div class="spotlights-lower">
        ${genderHtml}
        ${deptShiftHtml}
      </div>

      ${
        deptBars
          ? `<div class="spot-dept-bars">
               <h3 class="spot-section-title">🏢 Ranking departamental</h3>
               <div class="dept-bars">${deptBars}</div>
             </div>`
          : ''
      }
    </section>
  `;
}
