/**
 * Check-in — Fase 4 polish
 * Step indicator visible, semàfor gran en resultats, breakdown amb progress bars.
 * Tota la lògica CBI setmanal, saveSession i persistència intacta.
 */
import { t, getLanguage } from '../i18n/index.js';
import {
  calculateRiskIndex,
  calculatePvtIndex,
  calculateStroopIndex,
} from '../tests/risk_engine.js';
import { runPvtTest } from '../tests/pvt.js';
import { runStroopTest } from '../tests/stroop.js';
import { runCbiTest } from '../tests/cbi.js';
import { submitSession } from '../api/client.js';
import { initDb, saveSession, getConfig, setConfig } from '../storage/db.js';

const LAST_TEST_DATE_KEY = 'pulsepath_last_test_date';
const LAST_RISK_INDEX_KEY = 'pulsepath_last_risk_index';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function makeSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Clau «YYYY-Www» per a una data (setmana ISO 8601).
 */
function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * El CBI toca si és dilluns o no hi ha last_cbi_date de la setmana actual.
 */
async function isCbiDueThisWeek() {
  const now = new Date();
  if (now.getDay() === 1) return true;
  const lastDate = await getConfig('last_cbi_date');
  if (!lastDate) return true;
  return isoWeekKey(now) !== isoWeekKey(new Date(lastDate));
}

// ─── Helpers de color de risc ─────────────────────────────────────────────────

function riskColor(index) {
  if (index < 35) return '#4ade80';
  if (index < 60) return '#facc15';
  return '#f87171';
}

function riskSemaphore(index) {
  if (index < 35) return '🟢';
  if (index < 60) return '🟡';
  return '🔴';
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export function render(container, { navigate }) {
  let microData = {};
  let pvtMetrics = {};
  let stroopMetrics = {};
  let cbiDue = false;
  let cbiScore = 50;

  container.innerHTML = `
    <section class="screen screen--checkin">
      <div class="glass-card" style="text-align:center;padding:2rem">
        <p style="margin:0;color:var(--text-muted)">${t('common.loading')}</p>
      </div>
    </section>
  `;

  (async () => {
    await initDb().catch(() => {});
    cbiDue = await isCbiDueThisWeek();
    const savedScore = await getConfig('last_cbi_score');
    if (savedScore !== null) cbiScore = Number(savedScore);
    renderStep1();
  })();

  function totalSteps() {
    return cbiDue ? 5 : 4;
  }

  /** Capçalera de pas reutilitzable */
  function stepHeaderHtml(title, current) {
    return `
      <div class="step-header">
        <h1 class="step-header__title">${title}</h1>
        <span class="step-indicator" aria-label="Pas ${current} de ${totalSteps()}">${current} / ${totalSteps()}</span>
      </div>
    `;
  }

  // ── Pas 1: Micro-check ──────────────────────────────────────────────────────
  function renderStep1() {
    const lang = getLanguage();
    const stressLabels = {
      ca: { low: 'Baix', medium: 'Mitjà', high: 'Alt' },
      es: { low: 'Bajo', medium: 'Medio', high: 'Alto' },
      en: { low: 'Low', medium: 'Medium', high: 'High' },
    }[lang] ?? { low: 'Low', medium: 'Medium', high: 'High' };

    const yesLabel = { ca: 'Sí', es: 'Sí', en: 'Yes' }[lang] ?? 'Sí';

    container.innerHTML = `
      <section class="screen screen--checkin">
        ${stepHeaderHtml('Check-in', 1)}

        <div class="glass-card" style="display:flex;flex-direction:column;gap:1.1rem">

          <div class="form-field">
            <label for="sleep-input" class="form-label">${t('checkin.sleep_label')}</label>
            <input
              type="number"
              id="sleep-input"
              class="form-input"
              min="0"
              max="12"
              step="0.5"
              placeholder="7"
            >
          </div>

          <div class="form-field">
            <label for="stress-select" class="form-label">${t('checkin.stress_label')}</label>
            <select id="stress-select" class="form-select">
              <option value="low">${stressLabels.low}</option>
              <option value="medium" selected>${stressLabels.medium}</option>
              <option value="high">${stressLabels.high}</option>
            </select>
          </div>

          <div class="form-field">
            <label for="stimulants-select" class="form-label">${t('checkin.stimulants_label')}</label>
            <select id="stimulants-select" class="form-select">
              <option value="no">No</option>
              <option value="yes">${yesLabel}</option>
            </select>
          </div>

          <button type="button" class="btn btn-block" id="btn-continue" style="margin-top:0.25rem">
            ${t('checkin.continue')}
          </button>

        </div>
      </section>
    `;

    container.querySelector('#btn-continue').addEventListener('click', () => {
      const rawSleep = parseFloat(container.querySelector('#sleep-input').value);
      microData = {
        sleepHours: Number.isNaN(rawSleep) ? 7 : Math.min(12, Math.max(0, rawSleep)),
        stress: container.querySelector('#stress-select').value,
        stimulants: container.querySelector('#stimulants-select').value,
      };
      renderStep2();
    });
  }

  // ── Pas 2: PVT-B ───────────────────────────────────────────────────────────
  function renderStep2() {
    container.innerHTML = `
      <section class="screen screen--checkin">
        ${stepHeaderHtml('PVT-B', 2)}
        <div class="glass-card" id="pvt-host"></div>
      </section>
    `;

    runPvtTest(container.querySelector('#pvt-host'), {
      onProgress: (_current, _total) => {},
      onComplete: (metrics) => {
        pvtMetrics = metrics;
        renderStep3();
      },
      t,
    });
  }

  // ── Pas 3: Stroop ──────────────────────────────────────────────────────────
  function renderStep3() {
    container.innerHTML = `
      <section class="screen screen--checkin">
        ${stepHeaderHtml('Stroop', 3)}
        <div class="glass-card" id="stroop-host"></div>
      </section>
    `;

    runStroopTest(container.querySelector('#stroop-host'), {
      onProgress: (_current, _total) => {},
      onComplete: (metrics) => {
        stroopMetrics = metrics;
        if (cbiDue) {
          renderStepCbi();
        } else {
          renderResults();
        }
      },
      t,
    });
  }

  // ── Pas 4 (opcional): CBI setmanal ─────────────────────────────────────────
  function renderStepCbi() {
    container.innerHTML = `
      <section class="screen screen--checkin">
        ${stepHeaderHtml(t('checkin.cbi_step'), 4)}
        <div class="glass-card" id="cbi-host"></div>
      </section>
    `;

    runCbiTest(container.querySelector('#cbi-host'), {
      onComplete: (result) => {
        cbiScore = result.globalScore;
        Promise.all([
          setConfig('last_cbi_date', getTodayKey()),
          setConfig('last_cbi_score', cbiScore),
        ])
          .catch(() => {})
          .then(() => renderResults());
      },
      t,
    });
  }

  // ── Pas final: Resultats ────────────────────────────────────────────────────
  function renderResults() {
    const step = totalSteps();
    const pvtIndex    = calculatePvtIndex(pvtMetrics);
    const stroopIndex = calculateStroopIndex(stroopMetrics);

    const { riskIndex, breakdown } = calculateRiskIndex({
      pvtIndex,
      stroopIndex,
      cbiScore,
      sleepHours: microData.sleepHours,
    });

    const takenAt = new Date().toISOString();

    localStorage.setItem(LAST_TEST_DATE_KEY, getTodayKey());
    localStorage.setItem(LAST_RISK_INDEX_KEY, String(riskIndex));

    saveSession({
      id: makeSessionId(),
      takenAt,
      riskIndex,
      pvtIndex,
      stroopIndex,
      cbiScore,
      sleepHours: microData.sleepHours,
      pvtMetrics,
      stroopMetrics,
    }).catch(() => {});

    submitSession({
      timestamp: takenAt,
      risk_index: riskIndex,
      pvt_index: pvtIndex,
      stroop_index: stroopIndex,
      cbi_score: cbiScore,
      sleep_hours: microData.sleepHours,
    }).catch(() => {});

    const color     = riskColor(riskIndex);
    const semaphore = riskSemaphore(riskIndex);

    // Mapeig component → pes i valor
    const components = [
      { label: 'PVT',    weight: '40%', value: breakdown.pvt,    raw: breakdown.pvt },
      { label: 'Stroop', weight: '25%', value: breakdown.stroop, raw: breakdown.stroop },
      { label: 'CBI',    weight: '25%', value: breakdown.cbi,    raw: breakdown.cbi },
      { label: '💤',     weight: '10%', value: breakdown.sleep,  raw: breakdown.sleep },
    ];

    const breakdownRowsHtml = components.map(({ label, weight, value, raw }) => `
      <div class="breakdown-row">
        <span class="breakdown-label">
          ${label}
          <span class="breakdown-label__weight">${weight}</span>
        </span>
        <div class="progress-bar">
          <div class="progress-bar__fill" style="width:${Math.min(raw, 100)}%"></div>
        </div>
        <span class="breakdown-value" style="color:${riskColor(raw)}">${value}</span>
      </div>
    `).join('');

    container.innerHTML = `
      <section class="screen screen--checkin">
        <div class="step-header">
          <h1 class="step-header__title">${t('results.title')}</h1>
          <span class="step-indicator">${step} / ${step}</span>
        </div>

        <div class="glass-card">
          <div class="risk-display">
            <span class="risk-display__semaphore" aria-hidden="true">${semaphore}</span>
            <p class="risk-display__label">${t('results.risk_index')}</p>
            <span class="risk-display__number" style="color:${color}">${riskIndex}</span>
            <span class="risk-display__denom">/100</span>
          </div>
        </div>

        <div class="glass-card">
          <h3 style="margin:0 0 0.85rem;font-size:0.8rem;font-weight:600;
                     color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em">
            ${t('results.breakdown')}
          </h3>
          ${breakdownRowsHtml}
          <div class="breakdown-total">
            <span>Total</span>
            <span style="color:${color}">${riskIndex} / 100</span>
          </div>
        </div>

        <button type="button" class="btn btn--ghost btn-block" id="btn-back-home">
          ${t('common.back')}
        </button>

      </section>
    `;

    container.querySelector('#btn-back-home').addEventListener('click', () => {
      navigate('home');
    });
  }
}
