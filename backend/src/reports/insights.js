// PulsePath — Motor de conclusiones automáticas para el Informe de Impacto (PDF).
//
// Sistema de reglas determinista (NO IA generativa): convierte los datos
// agregados K-anónimos (los mismos que devuelve GET /dashboard/:orgId) en
// titulares ejecutivos, conclusiones por severidad, semáforos PRL (istas21) y
// recomendaciones accionables enmarcadas en la Ley 31/1995.
//
// Diseño (ver PLAN.md §"Informe de Impacto Periódico" y §"Motor de conclusiones
// automáticas"):
//   - Cada regla es `condición → frase`. Se evalúan TODAS y se ensamblan las
//     activadas, ordenadas por severidad (🔴 primero).
//   - Nunca se exponen datos individuales: solo se opera sobre los agregados ya
//     filtrados por K-anonimidad. Los grupos `kanon_protected` se ignoran en el
//     cálculo y se reflejan como "datos insuficientes" cuando procede.
//
// Fórmula de riesgo (pesos): PVT×0.40 + Stroop×0.25 + CBI×0.25 + Sleep×0.10.
// El desglose de drivers reparte el índice de riesgo medio según esos pesos.
// CBI y sueño no viajan en el agregado estándar del dashboard, así que se toman
// de campos/opciones explícitos si existen y, si no, se estiman a partir del
// residuo de la fórmula (garantizando que las contribuciones suman el riesgo).

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const RISK_GREEN_MAX = 35; // índice < 35 → saludable 🟢
const RISK_RED_MIN = 50; //   índice ≥ 50 → elevado 🔴
const TREND_DELTA = 8; //     ±8 pts vs periodo anterior → alerta / mejora
const DEPT_HIGH_RISK_PCT = 20; // pct_riesgo_alto > 20% → alerta departamento
const DEPT_ABOVE_MEAN = 15; //  ≥15 pts sobre la media org → destacado
const LOW_ADHERENCE_PCT = 60; // adherencia < 60% → interpretar con cautela
const SLEEP_LOW_HOURS = 6; //   < 6h se considera sueño bajo
const SLEEP_LOW_PENALTY = 50; // penalización de sueño ≥ 50 ≈ sueño bajo

// Pesos de la fórmula del índice de riesgo.
const W = { pvt: 0.4, stroop: 0.25, cbi: 0.25, sleep: 0.1 };

// Severidad → rango para ordenar conclusiones (🔴 primero).
const SEVERITY_RANK = { red: 3, yellow: 2, green: 1 };

const DISCLAIMER =
  'Las recomendaciones son orientativas y de apoyo a la gestión preventiva; ' +
  'no sustituyen la evaluación de riesgos psicosociales ni el criterio del ' +
  'Servicio de Prevención.';

// ---------------------------------------------------------------------------
// Utilidades numéricas
// ---------------------------------------------------------------------------

const round = (n, d = 0) => {
  const f = 10 ** d;
  return Math.round((Number(n) || 0) * f) / f;
};

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

/** Media ponderada por `count` de un campo numérico sobre una lista de grupos. */
function weightedAvg(groups, field) {
  let num = 0;
  let den = 0;
  for (const g of groups) {
    const v = g[field];
    const w = isNum(g.count) ? g.count : 1;
    if (isNum(v)) {
      num += v * w;
      den += w;
    }
  }
  return den > 0 ? num / den : null;
}

/**
 * Penalización de sueño (0-100) a partir de horas dormidas, según PLAN.md:
 *   ≥7h → 0 · 5-7h → 25 · 4-5h → 50 · <4h → 75
 */
function sleepPenaltyFromHours(hours) {
  if (!isNum(hours)) return null;
  if (hours >= 7) return 0;
  if (hours >= 5) return 25;
  if (hours >= 4) return 50;
  return 75;
}

// ---------------------------------------------------------------------------
// API pública: semáforo
// ---------------------------------------------------------------------------

/**
 * Color de semáforo PRL (estilo CoPsoQ-istas21) para un índice de riesgo medio.
 * @param {number} avgRisk Índice de riesgo medio (0-100).
 * @returns {'green'|'yellow'|'red'}
 */
export function getSemaphoreColor(avgRisk) {
  if (!isNum(avgRisk)) return 'yellow';
  if (avgRisk < RISK_GREEN_MAX) return 'green';
  if (avgRisk < RISK_RED_MIN) return 'yellow';
  return 'red';
}

// ---------------------------------------------------------------------------
// Agregación interna
// ---------------------------------------------------------------------------

/**
 * Calcula los agregados de organización necesarios para las reglas, a partir de
 * { groups, org_total }. Ignora grupos protegidos por K-anonimidad. Acepta
 * `options` para inyectar datos no presentes en el agregado estándar (CBI,
 * sueño, adherencia, tendencia / periodo anterior).
 */
function computeAggregates(dashboardData = {}, options = {}) {
  const groups = Array.isArray(dashboardData.groups) ? dashboardData.groups : [];
  const orgTotal = dashboardData.org_total || {};

  const visible = groups.filter((g) => g && !g.kanon_protected);
  const protectedCount = groups.length - visible.length;

  // Índice de riesgo medio y % en riesgo alto: preferimos org_total; si falta o
  // está protegido, lo derivamos de los grupos visibles (ponderado por count).
  const avgRisk = isNum(orgTotal.avg_risk_index)
    ? orgTotal.avg_risk_index
    : weightedAvg(visible, 'avg_risk_index');
  const pctHighRisk = isNum(orgTotal.pct_high_risk)
    ? orgTotal.pct_high_risk
    : weightedAvg(visible, 'pct_high_risk');

  const totalCount = isNum(orgTotal.count)
    ? orgTotal.count
    : visible.reduce((a, g) => a + (isNum(g.count) ? g.count : 0), 0);

  const hasData = visible.length > 0 && isNum(avgRisk);

  // Tendencia: vs periodo anterior si se aporta; si no, primera→última semana
  // del trend agregado de los grupos visibles (ponderado por count).
  let trendDelta = null;
  if (isNum(options.previous_avg_risk) && isNum(avgRisk)) {
    trendDelta = avgRisk - options.previous_avg_risk;
  } else if (Array.isArray(options.trend) && options.trend.length >= 2) {
    trendDelta = options.trend[options.trend.length - 1] - options.trend[0];
  } else {
    const withTrend = visible.filter((g) => Array.isArray(g.trend) && g.trend.length >= 2);
    if (withTrend.length) {
      const first = weightedAvg(
        withTrend.map((g) => ({ count: g.count, v: g.trend[0] })),
        'v',
      );
      const last = weightedAvg(
        withTrend.map((g) => ({ count: g.count, v: g.trend[g.trend.length - 1] })),
        'v',
      );
      if (isNum(first) && isNum(last)) trendDelta = last - first;
    }
  }

  return {
    groups,
    visible,
    protectedCount,
    hasData,
    avgRisk: isNum(avgRisk) ? avgRisk : null,
    pctHighRisk: isNum(pctHighRisk) ? pctHighRisk : null,
    totalCount,
    trendDelta: isNum(trendDelta) ? trendDelta : null,
    drivers: computeDrivers(visible, avgRisk, options),
    adherencePct: isNum(options.adherence_pct) ? options.adherence_pct : null,
  };
}

/**
 * Desglose de drivers: reparte el índice de riesgo medio en las contribuciones
 * de PVT / Stroop / CBI / sueño según los pesos de la fórmula. Devuelve el
 * porcentaje de contribución de cada driver, el driver dominante y banderas de
 * apoyo (sueño bajo) usadas por las reglas.
 */
function computeDrivers(visible, avgRisk, options = {}) {
  const empty = { pvt: 0, stroop: 0, cbi: 0, sleep: 0, dominant: 'pvt', sleepLow: false };
  if (!visible.length || !isNum(avgRisk)) return empty;

  const avgPvt = weightedAvg(visible, 'avg_pvt_index');
  const avgStroop = weightedAvg(visible, 'avg_stroop_index');

  // CBI: campo explícito en grupos/opciones si existe.
  const avgCbi =
    weightedAvg(visible, 'avg_cbi_score') ??
    weightedAvg(visible, 'avg_cbi_index') ??
    (isNum(options.avg_cbi) ? options.avg_cbi : null);

  // Sueño: penalización directa, o derivada de horas medias, o de opciones.
  let sleepPenalty =
    weightedAvg(visible, 'avg_sleep_penalty') ??
    sleepPenaltyFromHours(weightedAvg(visible, 'avg_sleep_hours')) ??
    sleepPenaltyFromHours(options.avg_sleep_hours);
  const sleepHours = weightedAvg(visible, 'avg_sleep_hours') ?? options.avg_sleep_hours;

  // Contribuciones ponderadas (puntos del índice de riesgo).
  const cPvt = isNum(avgPvt) ? W.pvt * avgPvt : 0;
  const cStroop = isNum(avgStroop) ? W.stroop * avgStroop : 0;

  let cCbi = isNum(avgCbi) ? W.cbi * avgCbi : null;
  let cSleep = isNum(sleepPenalty) ? W.sleep * sleepPenalty : null;

  // Si CBI y/o sueño no están disponibles, se reparte el residuo del índice de
  // riesgo entre los drivers faltantes según el peso de la fórmula, de modo que
  // las contribuciones siempre sumen el riesgo medio.
  const residual = Math.max(0, avgRisk - cPvt - cStroop - (cCbi || 0) - (cSleep || 0));
  if (cCbi === null && cSleep === null) {
    const wSum = W.cbi + W.sleep;
    cCbi = residual * (W.cbi / wSum);
    cSleep = residual * (W.sleep / wSum);
  } else if (cCbi === null) {
    cCbi = residual;
  } else if (cSleep === null) {
    cSleep = residual;
  }

  const total = cPvt + cStroop + cCbi + cSleep || 1;
  const shares = {
    pvt: round((cPvt / total) * 100, 1),
    stroop: round((cStroop / total) * 100, 1),
    cbi: round((cCbi / total) * 100, 1),
    sleep: round((cSleep / total) * 100, 1),
  };

  const contributions = { pvt: cPvt, stroop: cStroop, cbi: cCbi, sleep: cSleep };
  const dominant = Object.keys(contributions).reduce((a, b) =>
    contributions[b] > contributions[a] ? b : a,
  );

  // Si no derivamos la penalización, inferimos sueño bajo desde la contribución.
  const inferredPenalty = isNum(sleepPenalty) ? sleepPenalty : cSleep / W.sleep;
  const sleepLow = isNum(sleepHours)
    ? sleepHours < SLEEP_LOW_HOURS
    : inferredPenalty >= SLEEP_LOW_PENALTY;

  return { ...shares, dominant, sleepLow };
}

// ---------------------------------------------------------------------------
// API pública: motor de reglas
// ---------------------------------------------------------------------------

/**
 * Evalúa todas las reglas `condición → frase` sobre los datos agregados y
 * devuelve las conclusiones activadas, ordenadas por severidad (🔴 primero).
 *
 * @param {{ groups: object[], org_total: object }} dashboardData
 * @param {object} [options] Datos extra opcionales (adherencia, periodo previo…).
 * @returns {{ severity: 'red'|'yellow'|'green', text: string }[]}
 */
export function evaluateRules(dashboardData, options = {}) {
  const agg = computeAggregates(dashboardData, options);
  const rules = [];

  if (!agg.hasData) {
    rules.push({
      severity: 'yellow',
      text:
        '🟡 Datos insuficientes para informar en este periodo: todos los grupos ' +
        'quedan por debajo del umbral de K-anonimidad (K=5) o no hay sesiones.',
    });
    return rules;
  }

  // --- Titulares globales (semáforo) ---
  const color = getSemaphoreColor(agg.avgRisk);
  if (color === 'green') {
    rules.push({
      severity: 'green',
      text: '🟢 El nivel de bienestar cognitivo de la plantilla es saludable este periodo.',
    });
  } else if (color === 'yellow') {
    rules.push({
      severity: 'yellow',
      text: '🟡 El nivel de bienestar cognitivo es moderado; conviene vigilar la evolución.',
    });
  } else {
    rules.push({
      severity: 'red',
      text: '🔴 El nivel de riesgo cognitivo es elevado y requiere atención.',
    });
  }

  // --- Tendencia vs periodo anterior ---
  if (isNum(agg.trendDelta)) {
    if (agg.trendDelta >= TREND_DELTA) {
      rules.push({
        severity: 'red',
        text: `⚠️ El riesgo ha aumentado respecto al periodo anterior (+${round(agg.trendDelta)} puntos).`,
      });
    } else if (agg.trendDelta <= -TREND_DELTA) {
      rules.push({
        severity: 'green',
        text: `✅ El riesgo ha mejorado respecto al periodo anterior (−${round(Math.abs(agg.trendDelta))} puntos).`,
      });
    }
  }

  // --- Por departamento (solo grupos visibles ≥ K=5) ---
  for (const g of agg.visible) {
    if (isNum(g.pct_high_risk) && g.pct_high_risk > DEPT_HIGH_RISK_PCT) {
      rules.push({
        severity: 'red',
        text: `🔴 El departamento ${g.department} supera el umbral de alerta (${round(g.pct_high_risk)}% en riesgo alto).`,
      });
    }
    if (
      isNum(g.avg_risk_index) &&
      isNum(agg.avgRisk) &&
      g.avg_risk_index >= agg.avgRisk + DEPT_ABOVE_MEAN
    ) {
      rules.push({
        severity: 'yellow',
        text: `🟡 El departamento ${g.department} está notablemente por encima de la media de la organización (${round(g.avg_risk_index)} vs ${round(agg.avgRisk)}).`,
      });
    }
  }

  // --- Drivers (causa raíz) ---
  const d = agg.drivers;
  if (d.dominant === 'cbi') {
    rules.push({
      severity: 'red',
      text: 'El principal factor es el burnout acumulado (no fatiga puntual): el problema es estructural.',
    });
  } else if (d.dominant === 'pvt' && d.sleepLow) {
    rules.push({
      severity: 'yellow',
      text: 'El principal factor es la fatiga aguda asociada a falta de sueño: probablemente reversible con descanso.',
    });
  } else if (d.dominant === 'stroop') {
    rules.push({
      severity: 'yellow',
      text: 'Destaca la pérdida de control cognitivo/atencional, asociada a sobrecarga mental.',
    });
  }

  // --- Adherencia (calidad del dato) ---
  if (isNum(agg.adherencePct) && agg.adherencePct < LOW_ADHERENCE_PCT) {
    rules.push({
      severity: 'yellow',
      text: `⚠️ La participación es baja (${round(agg.adherencePct)}%); los resultados deben interpretarse con cautela.`,
    });
  }

  return sortBySeverity(rules);
}

function sortBySeverity(rules) {
  return [...rules].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

// ---------------------------------------------------------------------------
// Recomendaciones (catálogo enlazado a conclusiones activas)
// ---------------------------------------------------------------------------

/**
 * Construye la lista priorizada de recomendaciones a partir de las conclusiones
 * activas y los agregados. Cada conclusión enciende una medida del catálogo.
 * El disclaimer PRL se añade SIEMPRE al final.
 */
function buildRecommendations(agg, conclusions) {
  const recs = [];
  const add = (text) => {
    if (!recs.includes(text)) recs.push(text);
  };

  const d = agg.drivers;

  // Departamentos por encima del umbral de riesgo alto.
  for (const g of agg.visible) {
    if (isNum(g.pct_high_risk) && g.pct_high_risk > DEPT_HIGH_RISK_PCT) {
      add(
        `Convocar al departamento ${g.department} para una sesión de evaluación de carga de trabajo conforme a la evaluación de riesgos psicosociales.`,
      );
    }
  }

  // Drivers.
  if (d.dominant === 'cbi') {
    add(
      'Valorar medidas organizativas: redistribución de tareas, refuerzo de plantilla en picos y revisión de objetivos.',
    );
  }
  if (d.dominant === 'pvt' && d.sleepLow) {
    add('Revisar turnos y descansos; considerar formación en higiene del sueño.');
  }
  if (d.dominant === 'stroop') {
    add(
      'Reducir la sobrecarga cognitiva: priorizar tareas, limitar interrupciones y multitarea en los picos de actividad.',
    );
  }

  // Tendencia.
  if (isNum(agg.trendDelta) && agg.trendDelta <= -TREND_DELTA) {
    add('Mantener las medidas actuales; documentar como buena práctica para otros departamentos.');
  }
  if (isNum(agg.trendDelta) && agg.trendDelta >= TREND_DELTA) {
    add('Investigar las causas del repunte del periodo y reforzar el seguimiento en las próximas semanas.');
  }

  // Adherencia baja.
  if (isNum(agg.adherencePct) && agg.adherencePct < LOW_ADHERENCE_PCT) {
    add(
      'Reforzar la comunicación interna para mejorar la participación antes de tomar decisiones basadas en estos datos.',
    );
  }

  // Si no se ha activado ninguna medida específica pero hay datos.
  if (recs.length === 0 && agg.hasData) {
    const color = getSemaphoreColor(agg.avgRisk);
    if (color === 'green') {
      add('Mantener las condiciones actuales y continuar el seguimiento preventivo periódico.');
    } else {
      add('Continuar el seguimiento periódico y reevaluar en el próximo informe.');
    }
  }

  // Disclaimer obligatorio SIEMPRE al final.
  recs.push(DISCLAIMER);
  return recs;
}

// ---------------------------------------------------------------------------
// API pública: generador principal
// ---------------------------------------------------------------------------

/**
 * Genera el bloque completo de insights para el Informe de Impacto.
 *
 * @param {{ groups: object[], org_total: object }} dashboardData Igual que GET /dashboard/:orgId.
 * @param {object} [options]
 * @param {number} [options.adherence_pct]    % de tests completados (calidad del dato).
 * @param {number} [options.previous_avg_risk] Índice medio del periodo anterior (tendencia).
 * @param {number[]} [options.trend]            Serie temporal del índice (alternativa a previous_avg_risk).
 * @param {number} [options.avg_cbi]           CBI medio org si no viaja en groups.
 * @param {number} [options.avg_sleep_hours]   Horas de sueño medias si no viajan en groups.
 * @returns {{
 *   headline: string,
 *   executive_summary: string[],
 *   conclusions: string[],
 *   recommendations: string[],
 *   drivers: { pvt: number, stroop: number, cbi: number, sleep: number, dominant: 'pvt'|'stroop'|'cbi'|'sleep' },
 *   semaphore: 'green'|'yellow'|'red',
 *   kpis: { avg_risk: number|null, pct_high_risk: number|null, adherence_pct: number|null }
 * }}
 */
export function generateInsights(dashboardData = {}, options = {}) {
  const agg = computeAggregates(dashboardData, options);
  const ruleResults = evaluateRules(dashboardData, options);
  const conclusions = ruleResults.map((r) => r.text);

  const semaphore = agg.hasData ? getSemaphoreColor(agg.avgRisk) : 'yellow';
  const headline = buildHeadline(agg, semaphore);
  const executive_summary = buildExecutiveSummary(agg, semaphore);
  const recommendations = buildRecommendations(agg, conclusions);

  return {
    headline,
    executive_summary,
    conclusions,
    recommendations,
    drivers: {
      pvt: agg.drivers.pvt,
      stroop: agg.drivers.stroop,
      cbi: agg.drivers.cbi,
      sleep: agg.drivers.sleep,
      dominant: agg.drivers.dominant,
    },
    semaphore,
    kpis: {
      avg_risk: agg.avgRisk,
      pct_high_risk: agg.pctHighRisk,
      adherence_pct: agg.adherencePct,
    },
  };
}

/** Titular de una línea: estado del semáforo + dirección de la tendencia. */
function buildHeadline(agg, semaphore) {
  if (!agg.hasData) {
    return 'Datos insuficientes para informar (K-anonimidad).';
  }

  const stateText = {
    green: 'Bienestar cognitivo saludable 🟢',
    yellow: 'Riesgo cognitivo moderado 🟡',
    red: 'Riesgo cognitivo elevado 🔴',
  }[semaphore];

  let trendText = '';
  if (isNum(agg.trendDelta)) {
    if (agg.trendDelta >= TREND_DELTA) {
      trendText = ` — empeora (+${round(agg.trendDelta)} pts)`;
    } else if (agg.trendDelta <= -TREND_DELTA) {
      trendText = ` — mejora (−${round(Math.abs(agg.trendDelta))} pts)`;
    } else {
      trendText = ' — estable';
    }
  }

  return `${stateText} (índice medio ${round(agg.avgRisk)})${trendText}.`;
}

/** Resumen ejecutivo: 3-4 frases para el lector de la primera página. */
function buildExecutiveSummary(agg, semaphore) {
  if (!agg.hasData) {
    return [
      'No hay suficientes datos para emitir conclusiones en este periodo.',
      'Todos los grupos quedan por debajo del umbral de K-anonimidad (K=5) o no se han registrado sesiones.',
      'El informe se genera igualmente para dejar constancia del periodo, sin exponer datos individuales.',
    ];
  }

  const summary = [];

  const stateSentence = {
    green: 'El bienestar cognitivo de la plantilla se sitúa en niveles saludables durante el periodo analizado.',
    yellow:
      'El bienestar cognitivo de la plantilla se sitúa en niveles moderados; conviene vigilar la evolución.',
    red: 'El nivel de riesgo cognitivo de la plantilla es elevado y requiere atención preventiva.',
  }[semaphore];
  summary.push(stateSentence);

  const kpiParts = [`índice de riesgo medio de ${round(agg.avgRisk)}/100`];
  if (isNum(agg.pctHighRisk)) kpiParts.push(`${round(agg.pctHighRisk)}% de la plantilla en riesgo alto`);
  if (isNum(agg.adherencePct)) kpiParts.push(`adherencia del ${round(agg.adherencePct)}%`);
  summary.push(`Indicadores clave: ${kpiParts.join(', ')}.`);

  if (isNum(agg.trendDelta)) {
    if (agg.trendDelta >= TREND_DELTA) {
      summary.push(`La tendencia empeora respecto al periodo anterior (+${round(agg.trendDelta)} puntos).`);
    } else if (agg.trendDelta <= -TREND_DELTA) {
      summary.push(`La tendencia mejora respecto al periodo anterior (−${round(Math.abs(agg.trendDelta))} puntos).`);
    } else {
      summary.push('La tendencia se mantiene estable respecto al periodo anterior.');
    }
  }

  const driverSentence = {
    cbi: 'El factor predominante es el burnout acumulado, lo que apunta a un problema de carácter estructural.',
    pvt: agg.drivers.sleepLow
      ? 'El factor predominante es la fatiga aguda asociada a la falta de sueño, probablemente reversible con descanso.'
      : 'El factor predominante es la fatiga atencional medida por el test de vigilancia psicomotora (PVT).',
    stroop: 'El factor predominante es la pérdida de control cognitivo, asociada a sobrecarga mental.',
    sleep: 'El factor predominante es el déficit de sueño de la plantilla.',
  }[agg.drivers.dominant];
  if (driverSentence) summary.push(driverSentence);

  if (isNum(agg.adherencePct) && agg.adherencePct < LOW_ADHERENCE_PCT) {
    summary.push(
      'La participación es baja en este periodo, por lo que las conclusiones deben interpretarse con cautela.',
    );
  }

  // 3-4 frases: limitamos a 4.
  return summary.slice(0, 4);
}

export default generateInsights;
