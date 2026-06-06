/**
 * PulsePath — PVT-B (Psychomotor Vigilance Task, brief).
 *
 * Test de vigilancia psicomotora de 30 ensayos. Mide la atención sostenida
 * y la fatiga a través del tiempo de reacción a un estímulo visual que aparece
 * tras un intervalo inter-estímulo (ISI) aleatorio.
 *
 * Especificaciones (PLAN.md · PVT-B):
 *   - 30 ensayos válidos.
 *   - ISI aleatorio entre 1000 ms y 4000 ms.
 *   - Umbral de lapse (fatiga): tiempo de reacción > 355 ms.
 *   - False start: el usuario toca antes de que aparezca el estímulo.
 *   - Medición con performance.now() (alta resolución, monótona).
 *
 * Módulo AUTÓNOMO: no depende de risk_engine.js. Solo produce métricas crudas.
 * risk_engine.calculatePvtIndex(metrics) las consume después.
 */

const TRIALS = 30;
const ISI_MIN_MS = 1000;
const ISI_MAX_MS = 4000;
const LAPSE_THRESHOLD_MS = 355;

// Tiempos de feedback entre estados (no afectan a la medición del RT).
const RT_FEEDBACK_MS = 650;
const FALSE_START_FEEDBACK_MS = 1300;

// Cualquier "reacción" por debajo de este umbral tras el estímulo se considera
// anticipación (no es una respuesta fisiológicamente posible) y se trata como
// false start. Evita que un toque ya en curso justo al aparecer el estímulo
// se registre como un RT artificialmente bajo.
const MIN_PLAUSIBLE_RT_MS = 100;

const STYLE_ID = 'pvt-inline-styles';

/**
 * Textos por defecto si no se pasa una función i18n `t`.
 * Se usan las mismas claves que el catálogo (sección `pvt`).
 */
const FALLBACK = {
  'pvt.instruction':
    'Cuando aparezca el círculo verde, toca la pantalla lo más rápido posible. No toques antes de que aparezca.',
  'pvt.wait': 'Espere…',
  'pvt.tap': '¡Toca ahora!',
  'pvt.progress': '{current} / {total}',
  'pvt.false_start': '¡Demasiado pronto! Espera la señal verde.',
  'pvt.done': 'Test PVT completado',
  'pvt.start': 'Comenzar',
  'pvt.lapse': 'Lento',
};

/**
 * Calcula las métricas crudas del PVT-B a partir de los tiempos de reacción.
 * Expuesta por separado para poder testearla de forma aislada.
 *
 * @param {number[]} times        Tiempos de reacción válidos en ms.
 * @param {number}   falseStarts  Número de respuestas anticipadas registradas.
 * @returns {{
 *   trials: number,
 *   lapses: number,
 *   falseStarts: number,
 *   meanRt: number,
 *   medianRt: number,
 *   sdRt: number,
 *   p10Slowest: number,
 *   times: number[]
 * }}
 */
export function calculatePvtMetrics(times = [], falseStarts = 0) {
  const valid = (Array.isArray(times) ? times : [])
    .map(Number)
    .filter((rt) => Number.isFinite(rt) && rt >= 0);

  const trials = valid.length;
  const fs = Number.isFinite(falseStarts) ? Math.max(0, Math.round(falseStarts)) : 0;

  if (trials === 0) {
    return {
      trials: 0,
      lapses: 0,
      falseStarts: fs,
      meanRt: 0,
      medianRt: 0,
      sdRt: 0,
      p10Slowest: 0,
      times: [],
    };
  }

  const lapses = valid.filter((rt) => rt > LAPSE_THRESHOLD_MS).length;

  const sum = valid.reduce((acc, rt) => acc + rt, 0);
  const meanRt = sum / trials;

  const sorted = [...valid].sort((a, b) => a - b);
  const medianRt = median(sorted);

  // Desviación estándar poblacional (n). Robusta para n >= 1.
  const variance =
    valid.reduce((acc, rt) => acc + (rt - meanRt) ** 2, 0) / trials;
  const sdRt = Math.sqrt(variance);

  // p10Slowest: media del 10% de ensayos más lentos (mínimo 1 ensayo).
  // Métrica clásica del PVT ("slowest 10% RT"), sensible a los lapses.
  const slowestCount = Math.max(1, Math.round(trials * 0.1));
  const slowest = sorted.slice(trials - slowestCount);
  const p10Slowest =
    slowest.reduce((acc, rt) => acc + rt, 0) / slowest.length;

  return {
    trials,
    lapses,
    falseStarts: fs,
    meanRt: round1(meanRt),
    medianRt: round1(medianRt),
    sdRt: round1(sdRt),
    p10Slowest: round1(p10Slowest),
    times: valid.map(round1),
  };
}

/**
 * Ejecuta el test PVT-B completo dentro de un contenedor DOM.
 *
 * @param {HTMLElement} container  Elemento donde renderizar el test.
 * @param {object} [options]
 * @param {(current: number, total: number) => void} [options.onProgress]  Indicador de progreso "12/30".
 * @param {(metrics: object) => void} [options.onComplete]   Llamado al terminar los 30 ensayos.
 * @param {() => void} [options.onFalseStart]                Llamado en cada false start.
 * @param {(key: string) => string} [options.t]              Función i18n opcional.
 * @returns {{ destroy: () => void }}  Controlador para cancelar/limpiar el test.
 */
export function runPvtTest(container, options = {}) {
  if (!container) {
    throw new Error('runPvtTest: se requiere un contenedor DOM.');
  }

  const { onProgress, onComplete, onFalseStart, t } = options;

  const tr = (key, vars) => {
    const base =
      (typeof t === 'function' ? t(key) : null) || FALLBACK[key] || key;
    if (!vars) return base;
    return Object.keys(vars).reduce(
      (str, k) => str.replaceAll(`{${k}}`, String(vars[k])),
      base,
    );
  };

  injectStyles();

  // --- Estado interno del test ---
  const times = [];
  let falseStarts = 0;
  let trialIndex = 0; // ensayos completados (0..TRIALS)
  let phase = 'ready'; // 'ready' | 'waiting' | 'stimulus' | 'feedback' | 'done'
  let stimulusAt = 0; // performance.now() del momento de aparición
  let isiTimer = null;
  let feedbackTimer = null;
  let destroyed = false;

  // --- Render del esqueleto ---
  container.innerHTML = '';
  const root = document.createElement('section');
  root.className = 'pvt';
  root.innerHTML = `
    <header class="pvt__head">
      <div class="pvt__progress" role="progressbar"
           aria-valuemin="0" aria-valuemax="${TRIALS}" aria-valuenow="0">
        <div class="pvt__progress-track">
          <div class="pvt__progress-fill" style="width:0%"></div>
        </div>
        <span class="pvt__progress-label">${tr('pvt.progress', {
          current: 0,
          total: TRIALS,
        })}</span>
      </div>
    </header>
    <div class="pvt__stage" data-phase="ready" tabindex="0"
         role="button" aria-live="polite">
      <div class="pvt__stimulus" aria-hidden="true"></div>
      <p class="pvt__message">${tr('pvt.instruction')}</p>
      <p class="pvt__rt" aria-hidden="true"></p>
      <button type="button" class="pvt__start">${tr('pvt.start')}</button>
    </div>
  `;
  container.appendChild(root);

  const stage = root.querySelector('.pvt__stage');
  const stimulus = root.querySelector('.pvt__stimulus');
  const message = root.querySelector('.pvt__message');
  const rtLabel = root.querySelector('.pvt__rt');
  const startBtn = root.querySelector('.pvt__start');
  const progressEl = root.querySelector('.pvt__progress');
  const progressFill = root.querySelector('.pvt__progress-fill');
  const progressLabel = root.querySelector('.pvt__progress-label');

  // --- Helpers de UI ---
  function setPhase(next) {
    phase = next;
    stage.setAttribute('data-phase', next);
  }

  function updateProgress() {
    const current = Math.min(trialIndex + (phase === 'done' ? 0 : 1), TRIALS);
    const pct = Math.round((trialIndex / TRIALS) * 100);
    progressFill.style.width = `${pct}%`;
    progressLabel.textContent = tr('pvt.progress', {
      current: phase === 'done' ? TRIALS : current,
      total: TRIALS,
    });
    progressEl.setAttribute('aria-valuenow', String(trialIndex));
    if (typeof onProgress === 'function') {
      onProgress(phase === 'done' ? TRIALS : current, TRIALS);
    }
  }

  function clearTimers() {
    if (isiTimer !== null) {
      clearTimeout(isiTimer);
      isiTimer = null;
    }
    if (feedbackTimer !== null) {
      clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }
  }

  // --- Máquina de estados del ensayo ---
  function beginTrial() {
    if (destroyed) return;
    clearTimers();
    setPhase('waiting');
    stimulus.classList.remove('pvt__stimulus--on');
    message.textContent = tr('pvt.wait');
    rtLabel.textContent = '';
    rtLabel.className = 'pvt__rt';
    updateProgress();

    const isi = ISI_MIN_MS + Math.random() * (ISI_MAX_MS - ISI_MIN_MS);
    isiTimer = setTimeout(showStimulus, isi);
  }

  function showStimulus() {
    if (destroyed) return;
    isiTimer = null;
    setPhase('stimulus');
    stimulus.classList.add('pvt__stimulus--on');
    message.textContent = tr('pvt.tap');
    stimulusAt = performance.now();
  }

  function handleResponse() {
    if (destroyed) return;

    if (phase === 'waiting') {
      registerFalseStart();
      return;
    }

    if (phase !== 'stimulus') return;

    const rt = performance.now() - stimulusAt;

    // Un "RT" implausiblemente bajo es en realidad una anticipación.
    if (rt < MIN_PLAUSIBLE_RT_MS) {
      registerFalseStart();
      return;
    }

    times.push(rt);
    trialIndex += 1;
    showRtFeedback(rt);
  }

  function registerFalseStart() {
    clearTimers();
    falseStarts += 1;
    setPhase('feedback');
    stimulus.classList.remove('pvt__stimulus--on');
    message.textContent = tr('pvt.false_start');
    message.classList.add('pvt__message--error');
    rtLabel.textContent = '';
    rtLabel.className = 'pvt__rt';

    if (typeof onFalseStart === 'function') {
      onFalseStart();
    }

    // Estándar PVT-B: el false start no consume un ensayo válido.
    // Se penaliza (queda registrado) y se repite el mismo ensayo.
    feedbackTimer = setTimeout(() => {
      feedbackTimer = null;
      message.classList.remove('pvt__message--error');
      beginTrial();
    }, FALSE_START_FEEDBACK_MS);
  }

  function showRtFeedback(rt) {
    setPhase('feedback');
    stimulus.classList.remove('pvt__stimulus--on');
    const isLapse = rt > LAPSE_THRESHOLD_MS;
    message.textContent = `${Math.round(rt)} ms`;
    rtLabel.textContent = isLapse ? tr('pvt.lapse') : '';
    rtLabel.className = isLapse ? 'pvt__rt pvt__rt--lapse' : 'pvt__rt';
    updateProgress();

    feedbackTimer = setTimeout(() => {
      feedbackTimer = null;
      if (trialIndex >= TRIALS) {
        finish();
      } else {
        beginTrial();
      }
    }, RT_FEEDBACK_MS);
  }

  function finish() {
    clearTimers();
    setPhase('done');
    stimulus.classList.remove('pvt__stimulus--on');
    message.textContent = tr('pvt.done');
    message.classList.remove('pvt__message--error');
    rtLabel.textContent = '';
    updateProgress();
    detachInput();

    const metrics = calculatePvtMetrics(times, falseStarts);
    if (typeof onComplete === 'function') {
      onComplete(metrics);
    }
  }

  // --- Entrada del usuario ---
  function onPointerDown(event) {
    // Solo cuenta la zona del escenario, no el botón de inicio.
    if (event.target === startBtn) return;
    event.preventDefault();
    handleResponse();
  }

  function onKeyDown(event) {
    if (event.code === 'Space' || event.code === 'Enter') {
      if (phase === 'waiting' || phase === 'stimulus') {
        event.preventDefault();
        handleResponse();
      }
    }
  }

  function attachInput() {
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('keydown', onKeyDown);
  }

  function detachInput() {
    stage.removeEventListener('pointerdown', onPointerDown);
    stage.removeEventListener('keydown', onKeyDown);
  }

  function start() {
    startBtn.remove();
    attachInput();
    stage.focus({ preventScroll: true });
    beginTrial();
  }

  startBtn.addEventListener('click', start, { once: true });

  // --- Controlador público ---
  return {
    destroy() {
      destroyed = true;
      clearTimers();
      detachInput();
    },
  };
}

// --- Utilidades estadísticas ---

function median(sortedAsc) {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sortedAsc[mid - 1] + sortedAsc[mid]) / 2 : sortedAsc[mid];
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

// --- Estilos embebidos (coherentes con styles.css: #07090F, cyan/azul) ---

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.pvt {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  min-height: 70vh;
  color: #f0f4fc;
  font-family: 'Outfit', system-ui, -apple-system, sans-serif;
}
.pvt__head { flex-shrink: 0; }
.pvt__progress { display: flex; flex-direction: column; gap: 0.4rem; }
.pvt__progress-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(120, 180, 255, 0.12);
  overflow: hidden;
}
.pvt__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 55%, #6366f1 100%);
  transition: width 0.3s ease;
}
.pvt__progress-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #8b9bb8;
  text-align: center;
}
.pvt__stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  border-radius: 1.25rem;
  background: #07090f;
  border: 1px solid rgba(120, 180, 255, 0.12);
  padding: 2rem 1.25rem;
  text-align: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  outline: none;
  transition: background 0.2s ease;
}
.pvt__stage[data-phase='stimulus'] { background: #0a1410; }
.pvt__stage[data-phase='waiting'] { background: #05060b; }
.pvt__stage:focus-visible { border-color: rgba(34, 211, 238, 0.4); }
.pvt__stimulus {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgba(120, 180, 255, 0.05);
  border: 2px dashed rgba(120, 180, 255, 0.15);
  transform: scale(0.7);
  opacity: 0;
  transition: opacity 0.08s ease, transform 0.08s ease;
}
.pvt__stimulus--on {
  background: radial-gradient(circle at 35% 30%, #4ade80, #16a34a 70%);
  border: none;
  opacity: 1;
  transform: scale(1);
  box-shadow: 0 0 50px rgba(74, 222, 128, 0.55), 0 0 90px rgba(34, 197, 94, 0.25);
}
.pvt__message {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.4;
  max-width: 22ch;
}
.pvt__stage[data-phase='ready'] .pvt__message {
  font-size: 1rem;
  font-weight: 400;
  color: #8b9bb8;
}
.pvt__message--error { color: #fb7185; }
.pvt__rt { margin: 0; min-height: 1.1rem; font-size: 0.85rem; color: #8b9bb8; }
.pvt__rt--lapse { color: #fbbf24; font-weight: 600; }
.pvt__start {
  margin-top: 0.5rem;
  padding: 0.85rem 2rem;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  color: #07090f;
  background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 55%, #6366f1 100%);
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(34, 211, 238, 0.25);
}
.pvt__start:active { transform: scale(0.98); }
`;
  document.head.appendChild(style);
}
