/**
 * PulsePath — Test de Stroop (condició incongruent).
 *
 * 20 assajos, sempre incongruents: el color de la tinta MAI coincideix amb el
 * significat de la paraula. L'usuari ha de seleccionar el color de la TINTA.
 *
 * Especificacions:
 *   - 4 colors: vermell, blau, verd, groc (paraules segons getLanguage()).
 *   - Tinta ≠ significat sempre.
 *   - Sense més de 3 repeticions consecutives del mateix color de tinta.
 *   - Mesura del RT amb performance.now().
 *   - Mètriques: errors, trials, meanRt, sdRt, times[].
 *
 * Mòdul AUTÒNOM: no depèn de risk_engine.js. Només produeix mètriques crues.
 * risk_engine.calculateStroopIndex(metrics) les consumeix després.
 */

import { getLanguage } from '../i18n/index.js';

const TRIALS = 20;
const MAX_CONSECUTIVE_INK = 3;
const INTER_TRIAL_MS = 400;
const FEEDBACK_MS = 350;

const STYLE_ID = 'stroop-inline-styles';

/** Identificadors de color i el seu valor visual (tinta). */
const COLORS = [
  { id: 'red', hex: '#ef4444' },
  { id: 'blue', hex: '#3b82f6' },
  { id: 'green', hex: '#22c55e' },
  { id: 'yellow', hex: '#facc15' },
];

/** Paraules per idioma per a cada color. */
const COLOR_WORDS = {
  ca: { red: 'VERMELL', blue: 'BLAU', green: 'VERD', yellow: 'GROC' },
  es: { red: 'ROJO', blue: 'AZUL', green: 'VERDE', yellow: 'AMARILLO' },
  en: { red: 'RED', blue: 'BLUE', green: 'GREEN', yellow: 'YELLOW' },
};

/** Etiquetes dels botons per idioma. */
const BUTTON_LABELS = {
  ca: { red: 'Vermell', blue: 'Blau', green: 'Verd', yellow: 'Groc' },
  es: { red: 'Rojo', blue: 'Azul', green: 'Verde', yellow: 'Amarillo' },
  en: { red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow' },
};

/** Textos per defecte si no es passa una funció i18n `t`. */
const FALLBACK = {
  'stroop.instruction':
    'Selecciona el color de la tinta de la paraula, no el seu significat.',
  'stroop.progress': '{current} / {total}',
  'stroop.done': 'Test Stroop completat',
};

/**
 * Calcula les mètriques del test de Stroop.
 * Exposada per separat per poder testejar-la de forma aïllada.
 *
 * @param {number[]} times   Temps de reacció (ms) dels assajos respostos.
 * @param {number}   errors  Respostes incorrectes.
 * @param {number}   trials  Total d'assajos.
 * @returns {{ errors: number, trials: number, meanRt: number, sdRt: number, times: number[] }}
 */
export function calculateStroopMetrics(times = [], errors = 0, trials = TRIALS) {
  const valid = (Array.isArray(times) ? times : [])
    .map(Number)
    .filter((rt) => Number.isFinite(rt) && rt >= 0);

  const n = valid.length;
  const err = Number.isFinite(errors) ? Math.max(0, Math.round(errors)) : 0;
  const total = Number.isFinite(trials) ? Math.max(0, Math.round(trials)) : TRIALS;

  if (n === 0) {
    return { errors: err, trials: total, meanRt: 0, sdRt: 0, times: [] };
  }

  const mean = valid.reduce((acc, rt) => acc + rt, 0) / n;
  const variance = valid.reduce((acc, rt) => acc + (rt - mean) ** 2, 0) / n;

  return {
    errors: err,
    trials: total,
    meanRt: round1(mean),
    sdRt: round1(Math.sqrt(variance)),
    times: valid.map(round1),
  };
}

/**
 * Genera 20 assajos incongruents (tinta ≠ significat) sense més de
 * MAX_CONSECUTIVE_INK repeticions consecutives del mateix color de tinta.
 *
 * @returns {Array<{ wordColor: string, inkColor: string }>}
 */
function generateTrials() {
  const ids = COLORS.map((c) => c.id);
  const trials = [];
  let consecutive = 0;
  let lastInk = null;

  for (let i = 0; i < TRIALS; i += 1) {
    let ink = pick(ids);

    // Evita més de MAX_CONSECUTIVE_INK tintes iguals consecutives.
    if (ink === lastInk && consecutive >= MAX_CONSECUTIVE_INK) {
      const others = ids.filter((id) => id !== lastInk);
      ink = pick(others);
    }

    // Garanteix incongruència: la paraula no pot coincidir amb la tinta.
    const wordOptions = ids.filter((id) => id !== ink);
    const word = pick(wordOptions);

    if (ink === lastInk) {
      consecutive += 1;
    } else {
      consecutive = 1;
      lastInk = ink;
    }

    trials.push({ wordColor: word, inkColor: ink });
  }

  return trials;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Executa el test de Stroop complet dins d'un contenidor DOM.
 *
 * @param {HTMLElement} container
 * @param {object} [options]
 * @param {(current: number, total: number) => void} [options.onProgress]
 * @param {(metrics: object) => void} [options.onComplete]
 * @param {(key: string) => string} [options.t]
 * @returns {{ destroy: () => void }}
 */
export function runStroopTest(container, options = {}) {
  if (!container) {
    throw new Error('runStroopTest: es requereix un contenidor DOM.');
  }

  const { onProgress, onComplete, t } = options;

  const tr = (key, vars) => {
    const base = (typeof t === 'function' ? t(key) : null) || FALLBACK[key] || key;
    if (!vars) return base;
    return Object.keys(vars).reduce(
      (str, k) => str.replaceAll(`{${k}}`, String(vars[k])),
      base,
    );
  };

  const lang = getLanguage();
  const words = COLOR_WORDS[lang] ?? COLOR_WORDS.en;
  const labels = BUTTON_LABELS[lang] ?? BUTTON_LABELS.en;

  injectStyles();

  const trials = generateTrials();
  const times = [];
  let errors = 0;
  let index = 0;
  let stimulusAt = 0;
  let accepting = false;
  let destroyed = false;
  let timer = null;

  container.innerHTML = '';
  const root = document.createElement('section');
  root.className = 'stroop';
  root.innerHTML = `
    <header class="stroop__head">
      <p class="stroop__instruction">${tr('stroop.instruction')}</p>
      <div class="stroop__progress">
        <div class="stroop__progress-track">
          <div class="stroop__progress-fill" style="width:0%"></div>
        </div>
        <span class="stroop__progress-label">${tr('stroop.progress', {
          current: 0,
          total: TRIALS,
        })}</span>
      </div>
    </header>
    <div class="stroop__stage">
      <span class="stroop__word">&nbsp;</span>
    </div>
    <div class="stroop__buttons">
      ${COLORS.map(
        (c) =>
          `<button type="button" class="stroop__btn" data-color="${c.id}">${labels[c.id]}</button>`,
      ).join('')}
    </div>
  `;
  container.appendChild(root);

  const wordEl = root.querySelector('.stroop__word');
  const progressFill = root.querySelector('.stroop__progress-fill');
  const progressLabel = root.querySelector('.stroop__progress-label');
  const buttons = Array.from(root.querySelectorAll('.stroop__btn'));

  function updateProgress(done) {
    const pct = Math.round((done / TRIALS) * 100);
    progressFill.style.width = `${pct}%`;
    progressLabel.textContent = tr('stroop.progress', {
      current: done,
      total: TRIALS,
    });
    if (typeof onProgress === 'function') onProgress(done, TRIALS);
  }

  function showTrial() {
    if (destroyed) return;
    const trial = trials[index];
    const ink = COLORS.find((c) => c.id === trial.inkColor);
    wordEl.textContent = words[trial.wordColor];
    wordEl.style.color = ink.hex;
    wordEl.className = 'stroop__word';
    accepting = true;
    stimulusAt = performance.now();
  }

  function onAnswer(event) {
    if (!accepting || destroyed) return;
    const chosen = event.currentTarget.getAttribute('data-color');
    const rt = performance.now() - stimulusAt;
    const correct = chosen === trials[index].inkColor;

    accepting = false;
    times.push(rt);
    if (!correct) errors += 1;

    wordEl.classList.add(correct ? 'stroop__word--ok' : 'stroop__word--err');

    index += 1;
    updateProgress(index);

    timer = setTimeout(() => {
      if (destroyed) return;
      if (index >= TRIALS) {
        finish();
      } else {
        wordEl.textContent = '\u00a0';
        wordEl.className = 'stroop__word';
        timer = setTimeout(showTrial, INTER_TRIAL_MS);
      }
    }, FEEDBACK_MS);
  }

  function finish() {
    detach();
    const metrics = calculateStroopMetrics(times, errors, TRIALS);
    wordEl.textContent = tr('stroop.done');
    wordEl.style.color = 'var(--accent-cyan)';
    wordEl.classList.add('stroop__word--done');
    if (typeof onComplete === 'function') onComplete(metrics);
  }

  function attach() {
    buttons.forEach((b) => b.addEventListener('click', onAnswer));
  }

  function detach() {
    buttons.forEach((b) => b.removeEventListener('click', onAnswer));
  }

  attach();
  updateProgress(0);
  timer = setTimeout(showTrial, INTER_TRIAL_MS);

  return {
    destroy() {
      destroyed = true;
      if (timer !== null) clearTimeout(timer);
      detach();
    },
  };
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.stroop {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: #f0f4fc;
  font-family: 'Outfit', system-ui, -apple-system, sans-serif;
}
.stroop__head { display: flex; flex-direction: column; gap: 0.9rem; }
.stroop__instruction {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  text-align: center;
  color: #8b9bb8;
}
.stroop__progress { display: flex; flex-direction: column; gap: 0.4rem; }
.stroop__progress-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(120, 180, 255, 0.12);
  overflow: hidden;
}
.stroop__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 55%, #6366f1 100%);
  transition: width 0.3s ease;
}
.stroop__progress-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #8b9bb8;
  text-align: center;
}
.stroop__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border-radius: 1.25rem;
  background: #07090f;
  border: 1px solid rgba(120, 180, 255, 0.12);
  padding: 2rem 1.25rem;
}
.stroop__word {
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: transform 0.1s ease;
}
.stroop__word--ok { transform: scale(1.08); }
.stroop__word--err { transform: scale(0.92); }
.stroop__word--done { font-size: 1.3rem; font-weight: 600; }
.stroop__buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.stroop__btn {
  padding: 1rem 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  color: #f0f4fc;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(120, 180, 255, 0.18);
  border-radius: 0.75rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: transform 0.1s ease, background 0.2s ease;
}
.stroop__btn:active { transform: scale(0.96); background: rgba(34, 211, 238, 0.12); }
.stroop__btn[data-color='red']::before { content: '\\25cf '; color: #ef4444; }
.stroop__btn[data-color='blue']::before { content: '\\25cf '; color: #3b82f6; }
.stroop__btn[data-color='green']::before { content: '\\25cf '; color: #22c55e; }
.stroop__btn[data-color='yellow']::before { content: '\\25cf '; color: #facc15; }
`;
  document.head.appendChild(style);
}
