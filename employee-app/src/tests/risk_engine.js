/**
 * PulsePath — Motor de riesgo determinista (0-100).
 * Módulo puro, sin dependencias externas. Reemplazable por un modelo ML en el futuro.
 *
 * Fórmula:
 *   riskIndex = (pvt × 0.40) + (stroop × 0.25) + (cbi × 0.25) + (sleepPenalty × 0.10)
 */

const WEIGHTS = {
  pvt: 0.4,
  stroop: 0.25,
  cbi: 0.25,
  sleep: 0.1,
};

/** Escala CBI: respostes textuals → puntuació 0-100 per ítem. */
const CBI_SCALE = {
  always: 100,
  often: 75,
  sometimes: 50,
  seldom: 25,
  never: 0,
};

/**
 * Penalització per hores de son declarades.
 * @param {number} sleepHours
 * @returns {number} 0 | 25 | 50 | 75
 */
export function calculateSleepPenalty(sleepHours) {
  const hours = Number(sleepHours);
  if (Number.isNaN(hours)) return 0;

  if (hours >= 7) return 0;
  if (hours >= 5) return 25;
  if (hours >= 4) return 50;
  return 75;
}

/**
 * Índex PVT (0-100) a partir de mètriques del test.
 * Stub amb lògica bàsica documentada — la versió completa viu a pvt.js.
 *
 * Combina: taxa de lapses (>355 ms), false starts, mitjana RT i variabilitat (SD).
 * A més lapses, més false starts i major RT → índex més alt (més fatiga).
 *
 * @param {object} metrics
 * @param {number} [metrics.lapses=0]      Ensayos amb RT > 355 ms
 * @param {number} [metrics.falseStarts=0]  Respostes anticipades
 * @param {number} [metrics.trials=30]      Total d'ensayos vàlids
 * @param {number} [metrics.meanRt=250]     Temps de reacció mitjà (ms)
 * @param {number} [metrics.sdRt=50]        Desviació estàndard de RT (ms)
 * @returns {number} 0-100
 */
export function calculatePvtIndex(metrics = {}) {
  const trials = Math.max(1, metrics.trials ?? 30);
  const lapses = metrics.lapses ?? 0;
  const falseStarts = metrics.falseStarts ?? 0;
  const meanRt = metrics.meanRt ?? 250;
  const sdRt = metrics.sdRt ?? 50;

  const lapseRate = lapses / trials;
  const falseStartRate = falseStarts / trials;

  const lapseComponent = Math.min(40, lapseRate * 200);
  const falseStartComponent = Math.min(20, falseStartRate * 100);
  const rtComponent = Math.min(25, Math.max(0, (meanRt - 200) / 4));
  const sdComponent = Math.min(15, Math.max(0, (sdRt - 30) / 3));

  const index = lapseComponent + falseStartComponent + rtComponent + sdComponent;
  return clampRound(index);
}

/**
 * Índex Stroop (0-100) a partir de mètriques del test.
 * Stub amb lògica bàsica documentada — la versió completa viu a stroop.js.
 *
 * Combina: taxa d'errors en condició incongruent i temps de reacció mitjà.
 * A més errors i major RT → índex més alt (menor control cognitiu).
 *
 * @param {object} metrics
 * @param {number} [metrics.errors=0]   Respostes incorrectes
 * @param {number} [metrics.trials=20]  Total d'ensayos
 * @param {number} [metrics.meanRt=600] RT mitjà en trials incongruents (ms)
 * @returns {number} 0-100
 */
export function calculateStroopIndex(metrics = {}) {
  const trials = Math.max(1, metrics.trials ?? 20);
  const errors = metrics.errors ?? 0;
  const meanRt = metrics.meanRt ?? 600;

  const errorRate = errors / trials;
  const errorComponent = Math.min(50, errorRate * 250);
  const rtComponent = Math.min(50, Math.max(0, (meanRt - 400) / 8));

  const index = errorComponent + rtComponent;
  return clampRound(index);
}

/**
 * Puntuació CBI global (0-100) a partir de les respostes als 19 ítems.
 * Stub amb lògica bàsica documentada — la versió completa viu a cbi.js.
 *
 * Cada resposta es mapeja a: sempre=100, sovint=75, de vegades=50, rarament=25, mai=0.
 * Es calcula la mitjana de tots els ítems (subescales Personal, Treball, Client).
 * Umbral clínic de burnout: ≥ 50.
 *
 * @param {Array<number|string>} answers  Valors numèrics 0-100 o claus de l'escala CBI
 * @returns {number} 0-100 (50 si no hi ha respostes — valor neutre de primer ús)
 */
export function calculateCbiScore(answers = []) {
  if (!Array.isArray(answers) || answers.length === 0) {
    return 50;
  }

  const scores = answers.map((answer) => {
    if (typeof answer === 'number' && !Number.isNaN(answer)) {
      return Math.min(100, Math.max(0, answer));
    }
    if (typeof answer === 'string') {
      return CBI_SCALE[answer.toLowerCase()] ?? 50;
    }
    return 50;
  });

  const sum = scores.reduce((acc, score) => acc + score, 0);
  return clampRound(sum / scores.length);
}

/**
 * Calcula l'índex de risc global combinant tots els components.
 *
 * @param {object} params
 * @param {number} params.pvtIndex     Índex PVT (0-100)
 * @param {number} params.stroopIndex  Índex Stroop (0-100)
 * @param {number} params.cbiScore     Puntuació CBI (0-100)
 * @param {number} params.sleepHours   Hores de son declarades
 * @returns {{ riskIndex: number, breakdown: { pvt: number, stroop: number, cbi: number, sleep: number } }}
 */
export function calculateRiskIndex({ pvtIndex, stroopIndex, cbiScore, sleepHours }) {
  const pvt = Number(pvtIndex) || 0;
  const stroop = Number(stroopIndex) || 0;
  const cbi = Number(cbiScore) ?? 50;
  const sleepPenalty = calculateSleepPenalty(sleepHours);

  const breakdown = {
    pvt: round2(pvt * WEIGHTS.pvt),
    stroop: round2(stroop * WEIGHTS.stroop),
    cbi: round2(cbi * WEIGHTS.cbi),
    sleep: round2(sleepPenalty * WEIGHTS.sleep),
  };

  const raw =
    breakdown.pvt + breakdown.stroop + breakdown.cbi + breakdown.sleep;

  return {
    riskIndex: clampRound(raw),
    breakdown,
  };
}

function clampRound(value) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
