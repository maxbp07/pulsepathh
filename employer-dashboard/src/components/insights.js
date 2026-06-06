import { DIMENSIONS, formatValue, formatDepartment } from '../lib/labels.js';

const DRIVER_LABELS = {
  pvt: 'Fatiga / vigilancia',
  stroop: 'Control cognitivo',
  cbi: 'Burnout (CBI)',
  sleep: 'Déficit de sueño',
};

function visible(segs) {
  return (segs || []).filter((g) => !g.kanon_protected && typeof g.avg_risk_index === 'number');
}

function riskSeverity(risk) {
  if (risk >= 50) return 'high';
  if (risk >= 35) return 'medium';
  return 'low';
}

function severityIcon(sev) {
  if (sev === 'high') return '🔴';
  if (sev === 'medium') return '🟡';
  return '🟢';
}

/**
 * Genera hallazgos accionables a partir de segments y heatmaps (solo datos K≥5).
 * @param {object|null} data
 * @returns {{ severity:string, icon:string, title:string, body:string, action?:string }[]}
 */
export function buildInsights(data) {
  if (!data?.segments) return [];

  const insights = [];
  const orgRisk = data.org_total?.avg_risk_index;
  const segs = data.segments;

  // ── Turnos: noche vs mañana ──
  const shifts = visible(segs.shift);
  const night = shifts.find((s) => s.group === 'night');
  const morning = shifts.find((s) => s.group === 'morning');
  const afternoon = shifts.find((s) => s.group === 'afternoon');

  if (night && morning && night.avg_risk_index >= morning.avg_risk_index + 8) {
    const delta = Math.round(night.avg_risk_index - morning.avg_risk_index);
    insights.push({
      severity: riskSeverity(night.avg_risk_index),
      icon: '🌙',
      title: 'El turno de noche concentra más riesgo',
      body: `Noche (${Math.round(night.avg_risk_index)}) supera a mañana (${Math.round(morning.avg_risk_index)}) en +${delta} pts. ${night.pct_high_risk}% en riesgo alto.`,
      action: 'Revisar turnos, descansos entre jornadas y carga en franjas nocturnas.',
    });
  }

  if (shifts.length >= 2) {
    const top = [...shifts].sort((a, b) => b.avg_risk_index - a.avg_risk_index)[0];
    const bottom = [...shifts].sort((a, b) => a.avg_risk_index - b.avg_risk_index)[0];
    if (top.group !== bottom.group && top.avg_risk_index - bottom.avg_risk_index >= 12) {
      insights.push({
        severity: riskSeverity(top.avg_risk_index),
        icon: '🕒',
        title: `Mayor riesgo en turno ${formatValue('shift', top.group).toLowerCase()}`,
        body: `${formatValue('shift', top.group)} (${Math.round(top.avg_risk_index)}) vs ${formatValue('shift', bottom.group)} (${Math.round(bottom.avg_risk_index)}).`,
        action: 'Comparar condiciones de trabajo entre turnos (carga, interrupciones, supervisión).',
      });
    }
  }

  // ── Género: brecha si ambos visibles ──
  const genders = visible(segs.gender);
  const male = genders.find((s) => s.group === 'male');
  const female = genders.find((s) => s.group === 'female');
  if (male && female) {
    const gap = Math.abs(male.avg_risk_index - female.avg_risk_index);
    if (gap >= 8) {
      const higher = male.avg_risk_index > female.avg_risk_index ? male : female;
      const lower = higher === male ? female : male;
      insights.push({
        severity: riskSeverity(higher.avg_risk_index),
        icon: '⚧',
        title: 'Brecha de riesgo por género',
        body: `${formatValue('gender', higher.group)} (${Math.round(higher.avg_risk_index)}) vs ${formatValue('gender', lower.group)} (${Math.round(lower.avg_risk_index)}): diferencia de ${Math.round(gap)} pts.`,
        action: 'Analizar si la brecha responde a roles, turnos o condiciones distintas (no solo demografía).',
      });
    }
  }

  // ── Edad y antigüedad ──
  for (const [dim, icon, actionHint] of [
    ['ageBand', '🎂', 'Valorar carga, formación y acompañamiento según etapa vital.'],
    ['tenureBand', '📅', 'Revisar onboarding, acumulación de tareas y rotación en perfiles recientes.'],
  ]) {
    const groups = visible(segs[dim]);
    if (groups.length >= 2) {
      const top = groups[0];
      if (top.avg_risk_index >= 40 && (orgRisk == null || top.avg_risk_index >= orgRisk + 6)) {
        insights.push({
          severity: riskSeverity(top.avg_risk_index),
          icon,
          title: `${DIMENSIONS.find((d) => d.key === dim)?.label || dim}: grupo más expuesto`,
          body: `${formatValue(dim, top.group)} — riesgo ${Math.round(top.avg_risk_index)}, ${top.pct_high_risk}% en riesgo alto (${top.count_unique_users} personas).`,
          action: actionHint,
        });
      }
    }
  }

  // ── Departamento destacado ──
  const depts = visible(segs.department);
  if (depts.length && typeof orgRisk === 'number') {
    const hot = depts.find((d) => d.avg_risk_index >= orgRisk + 12);
    if (hot) {
      const driver = hot.drivers?.dominant;
      insights.push({
        severity: riskSeverity(hot.avg_risk_index),
        icon: '🏢',
        title: `${formatDepartment(hot.group)} por encima de la media`,
        body: `Riesgo ${Math.round(hot.avg_risk_index)} vs media org ${Math.round(orgRisk)}. Driver principal: ${DRIVER_LABELS[driver] || driver || '—'}.`,
        action: 'Priorizar conversación con responsables del área y medidas preventivas focalizadas.',
      });
    }
  }

  // ── Cruces del mapa de calor (dept × turno) ──
  const hmList = data.heatmaps?.length ? data.heatmaps : data.heatmap ? [data.heatmap] : [];
  const deptShift = hmList.find((h) => h.rowKey === 'department' && h.colKey === 'shift');
  if (deptShift) {
    const hotCells = deptShift.cells
      .filter((c) => !c.kanon_protected && !c.empty && c.avg_risk_index >= 45)
      .sort((a, b) => b.avg_risk_index - a.avg_risk_index);
    if (hotCells.length) {
      const c = hotCells[0];
      insights.push({
        severity: riskSeverity(c.avg_risk_index),
        icon: '🎯',
        title: 'Cruce crítico departamento × turno',
        body: `${formatValue('department', c.row)} en ${formatValue('shift', c.col).toLowerCase()}: riesgo ${Math.round(c.avg_risk_index)} (${c.count_unique_users} personas).`,
        action: 'Intervención quirúrgica en esa combinación antes de medidas genéricas.',
      });
    }
  }

  // ── Driver dominante global ──
  const dom = data.org_total?.drivers?.dominant;
  if (dom && typeof orgRisk === 'number') {
    insights.push({
      severity: riskSeverity(orgRisk),
      icon: '🧠',
      title: `Causa principal del riesgo: ${DRIVER_LABELS[dom] || dom}`,
      body: `El índice global (${Math.round(orgRisk)}) se explica sobre todo por ${(DRIVER_LABELS[dom] || dom).toLowerCase()}.`,
      action:
        dom === 'cbi'
          ? 'Medidas estructurales: carga, plantilla, objetivos.'
          : dom === 'sleep' || dom === 'pvt'
            ? 'Higiene del sueño, turnos y pausas recuperadoras.'
            : 'Reducir sobrecarga cognitiva e interrupciones.',
    });
  }

  // Ordenar por severidad
  const rank = { high: 3, medium: 2, low: 1 };
  insights.sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));

  // Evitar duplicados semánticos: máximo 6
  return insights.slice(0, 6);
}

/**
 * Renderiza tarjetas de hallazgos para el empleador.
 * @param {HTMLElement} container
 * @param {object|null} data
 */
export function renderInsights(container, data) {
  const items = buildInsights(data);
  if (!items.length) {
    container.innerHTML = '';
    return;
  }

  const cards = items
    .map(
      (it) => `
      <article class="insight-card insight-card--${it.severity}">
        <div class="insight-card-head">
          <span class="insight-icon" aria-hidden="true">${it.icon}</span>
          <h3 class="insight-title">${severityIcon(it.severity)} ${it.title}</h3>
        </div>
        <p class="insight-body">${it.body}</p>
        ${it.action ? `<p class="insight-action"><strong>Acción sugerida:</strong> ${it.action}</p>` : ''}
      </article>`,
    )
    .join('');

  container.innerHTML = `
    <section class="card insights-panel">
      <h2 class="card-title">Hallazgos para RRHH</h2>
      <p class="insights-help">Conclusiones automáticas a partir de datos agregados (K=5). Sin datos individuales.</p>
      <div class="insights-grid">${cards}</div>
    </section>
  `;
}
