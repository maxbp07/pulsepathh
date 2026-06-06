/**
 * PulsePath — Copenhagen Burnout Inventory (CBI).
 *
 * 19 preguntes, check-in setmanal. Tres subescales:
 *   - Personal (P1-P6, 6 ítems)
 *   - Work-Related (W1-W7, 7 ítems)
 *   - Client-Related (C1-C6, 6 ítems)
 *
 * Escala (5 opcions): Always=100, Often=75, Sometimes=50, Seldom=25, Never=0.
 * W5 és l'ÚNIC ítem invertit (Always=0 … Never=100).
 *
 * Resultat: mitjana global 0-100, umbral de burnout ≥ 50.
 *
 * Mòdul AUTÒNOM: produeix puntuacions. risk_engine.calculateCbiScore és un stub.
 */

const SCALE = {
  always: 100,
  often: 75,
  sometimes: 50,
  seldom: 25,
  never: 0,
};

const SCALE_REVERSED = {
  always: 0,
  often: 25,
  sometimes: 50,
  seldom: 75,
  never: 100,
};

export const BURNOUT_THRESHOLD = 50;

/** Ordre d'opcions presentades a la UI (de major a menor freqüència). */
const SCALE_ORDER = ['always', 'often', 'sometimes', 'seldom', 'never'];

/**
 * Les 19 preguntes amb el seu identificador, subescala i textos (ca/es/en).
 * `reversed: true` només per a W5.
 */
export const CBI_QUESTIONS = [
  // ── Personal ──────────────────────────────────────────────────────────────
  {
    id: 'P1',
    subscale: 'personal',
    text: {
      ca: 'Et sents esgotat/da?',
      es: '¿Te sientes agotado/a?',
      en: 'Do you feel tired?',
    },
  },
  {
    id: 'P2',
    subscale: 'personal',
    text: {
      ca: 'Et sents físicament exhaust/a?',
      es: '¿Te sientes físicamente exhausto/a?',
      en: 'Are you physically exhausted?',
    },
  },
  {
    id: 'P3',
    subscale: 'personal',
    text: {
      ca: 'Et sents emocionalment esgotat/da?',
      es: '¿Te sientes emocionalmente agotado/a?',
      en: 'Are you emotionally exhausted?',
    },
  },
  {
    id: 'P4',
    subscale: 'personal',
    text: {
      ca: "Penses: «No puc més»?",
      es: '¿Piensas: «No puedo más»?',
      en: "Do you think: \u201cI can't take it anymore\u201d?",
    },
  },
  {
    id: 'P5',
    subscale: 'personal',
    text: {
      ca: 'Et sents desgastat/da?',
      es: '¿Te sientes desgastado/a?',
      en: 'Do you feel worn out?',
    },
  },
  {
    id: 'P6',
    subscale: 'personal',
    text: {
      ca: 'Et sents dèbil i susceptible a emmalaltir?',
      es: '¿Te sientes débil y susceptible a enfermar?',
      en: 'Do you feel weak and susceptible to illness?',
    },
  },
  // ── Work-Related ────────────────────────────────────────────────────────────
  {
    id: 'W1',
    subscale: 'work',
    text: {
      ca: 'És el teu treball emocionalment esgotador?',
      es: '¿Es tu trabajo emocionalmente agotador?',
      en: 'Is your work emotionally exhausting?',
    },
  },
  {
    id: 'W2',
    subscale: 'work',
    text: {
      ca: 'Et sents esgotat/da al final de la jornada laboral?',
      es: '¿Te sientes agotado/a al final de la jornada laboral?',
      en: 'Do you feel burnt out at the end of the working day?',
    },
  },
  {
    id: 'W3',
    subscale: 'work',
    text: {
      ca: 'Et sents esgotat/da al matí en pensar en un altre dia de feina?',
      es: '¿Te sientes agotado/a por la mañana al pensar en otro día de trabajo?',
      en: 'Are you exhausted in the morning at the thought of another day at work?',
    },
  },
  {
    id: 'W4',
    subscale: 'work',
    text: {
      ca: 'Sents que cada hora de treball és esgotadora?',
      es: '¿Sientes que cada hora de trabajo es agotadora?',
      en: 'Do you feel that every working hour is tiring for you?',
    },
  },
  {
    id: 'W5',
    subscale: 'work',
    reversed: true,
    text: {
      ca: 'Tens prou energia per a la família i els amics en el temps lliure?',
      es: '¿Tienes suficiente energía para la familia y los amigos en tu tiempo libre?',
      en: 'Do you have enough energy for family and friends during leisure time?',
    },
  },
  {
    id: 'W6',
    subscale: 'work',
    text: {
      ca: 'Et resulta frustrant el teu treball?',
      es: '¿Te resulta frustrante tu trabajo?',
      en: 'Is your work frustrating?',
    },
  },
  {
    id: 'W7',
    subscale: 'work',
    text: {
      ca: 'Et sents cremat/da pel treball?',
      es: '¿Te sientes quemado/a por el trabajo?',
      en: 'Do you feel burnt out because of your work?',
    },
  },
  // ── Client-Related ──────────────────────────────────────────────────────────
  {
    id: 'C1',
    subscale: 'client',
    text: {
      ca: 'Et resulta difícil treballar amb clients/usuaris?',
      es: '¿Te resulta difícil trabajar con clientes/usuarios?',
      en: 'Do you find it hard to work with clients/users?',
    },
  },
  {
    id: 'C2',
    subscale: 'client',
    text: {
      ca: "Treballar amb clients/usuaris t'esgota emocionalment?",
      es: '¿Trabajar con clientes/usuarios te agota emocionalmente?',
      en: 'Does working with clients/users drain your energy?',
    },
  },
  {
    id: 'C3',
    subscale: 'client',
    text: {
      ca: 'Et frustra treballar amb clients/usuaris?',
      es: '¿Te frustra trabajar con clientes/usuarios?',
      en: 'Do you find it frustrating to work with clients/users?',
    },
  },
  {
    id: 'C4',
    subscale: 'client',
    text: {
      ca: 'Sents que dones més del que reps treballant amb clients/usuaris?',
      es: '¿Sientes que das más de lo que recibes trabajando con clientes/usuarios?',
      en: 'Do you feel that you give more than you get back when working with clients/users?',
    },
  },
  {
    id: 'C5',
    subscale: 'client',
    text: {
      ca: "Estàs fart/a de treballar amb clients/usuaris?",
      es: '¿Estás harto/a de trabajar con clientes/usuarios?',
      en: 'Are you tired of working with clients/users?',
    },
  },
  {
    id: 'C6',
    subscale: 'client',
    text: {
      ca: 'Et preguntes quant de temps més podràs continuar treballant amb clients/usuaris?',
      es: '¿Te preguntas cuánto tiempo más podrás seguir trabajando con clientes/usuarios?',
      en: 'Do you wonder how long you will be able to continue working with clients/users?',
    },
  },
];

const SUBSCALE_COUNTS = { personal: 6, work: 7, client: 6 };

/**
 * Puntuació d'un ítem segons la clau d'escala, aplicant inversió si cal.
 * @param {string} key       Clau d'escala (always/often/...).
 * @param {boolean} reversed Si l'ítem és invertit (W5).
 * @returns {number} 0-100
 */
function scoreItem(key, reversed) {
  const table = reversed ? SCALE_REVERSED : SCALE;
  return table[String(key).toLowerCase()] ?? 50;
}

/**
 * Calcula les puntuacions del CBI a partir de les respostes.
 *
 * Accepta `answers` com:
 *   - Objecte { P1: 'often', W5: 'never', ... } (claus d'escala), o
 *   - Array de 19 claus en l'ordre de CBI_QUESTIONS.
 *
 * Aplica automàticament la inversió de W5.
 *
 * @param {Object<string,string>|string[]} answers
 * @returns {{
 *   personalScore: number,
 *   workScore: number,
 *   clientScore: number,
 *   globalScore: number,
 *   burnout: boolean,
 *   subscales: { personal: number, work: number, client: number }
 * }}
 */
export function calculateCbiScore(answers = {}) {
  const byId = Array.isArray(answers)
    ? CBI_QUESTIONS.reduce((acc, q, i) => {
        acc[q.id] = answers[i];
        return acc;
      }, {})
    : answers || {};

  const sums = { personal: 0, work: 0, client: 0 };

  for (const q of CBI_QUESTIONS) {
    const raw = byId[q.id];
    const value = raw == null ? 50 : scoreItem(raw, q.reversed === true);
    sums[q.subscale] += value;
  }

  const personalScore = clampRound(sums.personal / SUBSCALE_COUNTS.personal);
  const workScore = clampRound(sums.work / SUBSCALE_COUNTS.work);
  const clientScore = clampRound(sums.client / SUBSCALE_COUNTS.client);

  const totalItems =
    SUBSCALE_COUNTS.personal + SUBSCALE_COUNTS.work + SUBSCALE_COUNTS.client;
  const globalScore = clampRound(
    (sums.personal + sums.work + sums.client) / totalItems,
  );

  return {
    personalScore,
    workScore,
    clientScore,
    globalScore,
    burnout: globalScore >= BURNOUT_THRESHOLD,
    subscales: { personal: personalScore, work: workScore, client: clientScore },
  };
}

const STYLE_ID = 'cbi-inline-styles';

const FALLBACK = {
  'cbi.instruction':
    'Indica amb quina freqüència t\u2019ha passat el següent durant les darreres setmanes.',
  'cbi.progress': '{current} / {total}',
  'cbi.done': 'Qüestionari CBI completat',
  'cbi.scale_always': 'Sempre',
  'cbi.scale_often': 'Sovint',
  'cbi.scale_sometimes': 'De vegades',
  'cbi.scale_seldom': 'Rarament',
  'cbi.scale_never': 'Mai',
};

/**
 * Executa el qüestionari CBI dins d'un contenidor DOM, una pregunta cada cop.
 *
 * @param {HTMLElement} container
 * @param {object} [options]
 * @param {(result: object) => void} [options.onComplete]
 * @param {(key: string) => string} [options.t]
 * @param {string} [options.lang]
 * @returns {{ destroy: () => void }}
 */
export function runCbiTest(container, options = {}) {
  if (!container) {
    throw new Error('runCbiTest: es requereix un contenidor DOM.');
  }

  const { onComplete, t } = options;
  const lang = options.lang || detectLang(t);

  const tr = (key, vars) => {
    const base = (typeof t === 'function' ? t(key) : null) || FALLBACK[key] || key;
    if (!vars) return base;
    return Object.keys(vars).reduce(
      (str, k) => str.replaceAll(`{${k}}`, String(vars[k])),
      base,
    );
  };

  injectStyles();

  const answers = {};
  let index = 0;
  let destroyed = false;

  container.innerHTML = '';
  const root = document.createElement('section');
  root.className = 'cbi';
  container.appendChild(root);

  function render() {
    if (destroyed) return;
    const q = CBI_QUESTIONS[index];
    const text = q.text[lang] || q.text.en;

    root.innerHTML = `
      <header class="cbi__head">
        <p class="cbi__instruction">${tr('cbi.instruction')}</p>
        <div class="cbi__progress">
          <div class="cbi__progress-track">
            <div class="cbi__progress-fill" style="width:${Math.round(
              (index / CBI_QUESTIONS.length) * 100,
            )}%"></div>
          </div>
          <span class="cbi__progress-label">${tr('cbi.progress', {
            current: index + 1,
            total: CBI_QUESTIONS.length,
          })}</span>
        </div>
      </header>
      <div class="cbi__question">
        <span class="cbi__qid">${q.id}</span>
        <p class="cbi__qtext">${text}</p>
      </div>
      <div class="cbi__options">
        ${SCALE_ORDER.map(
          (key) =>
            `<button type="button" class="cbi__option" data-key="${key}">${tr(
              `cbi.scale_${key}`,
            )}</button>`,
        ).join('')}
      </div>
    `;

    root.querySelectorAll('.cbi__option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (destroyed) return;
        answers[q.id] = btn.getAttribute('data-key');
        index += 1;
        if (index >= CBI_QUESTIONS.length) {
          finish();
        } else {
          render();
        }
      });
    });
  }

  function finish() {
    const result = calculateCbiScore(answers);
    root.innerHTML = `
      <div class="cbi__done">
        <p class="cbi__done-text">${tr('cbi.done')}</p>
      </div>
    `;
    if (typeof onComplete === 'function') onComplete(result);
  }

  render();

  return {
    destroy() {
      destroyed = true;
    },
  };
}

function detectLang(t) {
  // Heurística senzilla per escollir l'idioma dels textos de les preguntes.
  if (typeof t === 'function') {
    const sample = t('cbi.scale_always');
    if (sample === 'Always') return 'en';
    if (sample === 'Siempre') return 'es';
    if (sample === 'Sempre') return 'ca';
  }
  return 'ca';
}

function clampRound(value) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.cbi {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: #f0f4fc;
  font-family: 'Outfit', system-ui, -apple-system, sans-serif;
}
.cbi__head { display: flex; flex-direction: column; gap: 0.9rem; }
.cbi__instruction {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  text-align: center;
  color: #8b9bb8;
}
.cbi__progress { display: flex; flex-direction: column; gap: 0.4rem; }
.cbi__progress-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(120, 180, 255, 0.12);
  overflow: hidden;
}
.cbi__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 55%, #6366f1 100%);
  transition: width 0.3s ease;
}
.cbi__progress-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #8b9bb8;
  text-align: center;
}
.cbi__question {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 130px;
  border-radius: 1.25rem;
  background: #07090f;
  border: 1px solid rgba(120, 180, 255, 0.12);
  padding: 1.5rem 1.25rem;
  text-align: center;
}
.cbi__qid {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #22d3ee;
}
.cbi__qtext {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.4;
  max-width: 26ch;
}
.cbi__options { display: flex; flex-direction: column; gap: 0.6rem; }
.cbi__option {
  padding: 0.85rem 1rem;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  color: #f0f4fc;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(120, 180, 255, 0.18);
  border-radius: 0.75rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: transform 0.1s ease, background 0.2s ease;
}
.cbi__option:active { transform: scale(0.98); background: rgba(34, 211, 238, 0.12); }
.cbi__done {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}
.cbi__done-text { margin: 0; font-size: 1.2rem; font-weight: 600; color: #22d3ee; }
`;
  document.head.appendChild(style);
}
