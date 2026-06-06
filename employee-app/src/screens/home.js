/**
 * Home — Fase 4 polish
 * Estat del dia: semàfor gran, número de risc destacat, badge CBI estilitzat.
 */
import { t } from '../i18n/index.js';
import { initDb, getConfig } from '../storage/db.js';

const LAST_TEST_DATE_KEY  = 'pulsepath_last_test_date';
const LAST_RISK_INDEX_KEY = 'pulsepath_last_risk_index';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Clau «YYYY-Www» per a una data (setmana ISO 8601). */
function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Comprova si el CBI és pendent aquesta setmana.
 * Retorna false en cas d'error (no bloquejar la UI).
 */
async function checkCbiDue() {
  try {
    await initDb();
    const now = new Date();
    if (now.getDay() === 1) return true;
    const lastDate = await getConfig('last_cbi_date');
    if (!lastDate) return true;
    return isoWeekKey(now) !== isoWeekKey(new Date(lastDate));
  } catch {
    return false;
  }
}

function getRiskClass(riskIndex) {
  if (riskIndex === null) return '';
  if (riskIndex < 35) return 'risk-badge--low';
  if (riskIndex < 60) return 'risk-badge--medium';
  return 'risk-badge--high';
}

function getRiskSemaphore(riskIndex) {
  if (riskIndex === null) return '⚪';
  if (riskIndex < 35) return '🟢';
  if (riskIndex < 60) return '🟡';
  return '🔴';
}

function getRiskColor(riskIndex) {
  if (riskIndex === null) return 'var(--text-muted)';
  if (riskIndex < 35) return '#4ade80';
  if (riskIndex < 60) return '#facc15';
  return '#f87171';
}

export function render(container, { navigate }) {
  const today        = getTodayKey();
  const lastDate     = localStorage.getItem(LAST_TEST_DATE_KEY);
  const doneToday    = lastDate === today;
  const lastRiskRaw  = localStorage.getItem(LAST_RISK_INDEX_KEY);
  const lastRisk     = lastRiskRaw !== null ? parseInt(lastRiskRaw, 10) : null;

  function renderContent(cbiPending) {
    const semaphore  = getRiskSemaphore(doneToday ? lastRisk : null);
    const riskColor  = getRiskColor(doneToday ? lastRisk : null);
    const riskClass  = getRiskClass(doneToday ? lastRisk : null);

    const cbiBadgeHtml = cbiPending
      ? `<div class="cbi-badge">
           <span class="cbi-badge__icon" aria-hidden="true">⚠️</span>
           <span>${t('home.cbi_pending')}</span>
         </div>`
      : '';

    const dayCardHtml = doneToday
      ? `<div class="day-status">
           <span class="day-status__semaphore" aria-hidden="true">${semaphore}</span>
           <span class="day-status__risk-label">${t('results.risk_index')}</span>
           ${lastRisk !== null
             ? `<span class="day-status__risk-num" style="color:${riskColor}">${lastRisk}</span>
                <span class="day-status__denom">/100</span>`
             : ''}
           <span class="day-status__done-label">✓ ${t('home.test_done')}</span>
           ${lastRisk !== null
             ? `<span class="risk-badge ${riskClass}" style="margin-top:0.5rem">
                  ${lastRisk < 35 ? t('home.risk_low') || 'Risc baix'
                    : lastRisk < 60 ? t('home.risk_medium') || 'Risc moderat'
                    : t('home.risk_high') || 'Risc alt'}
                </span>`
             : ''}
         </div>
         ${cbiBadgeHtml}
         ${cbiPending
           ? `<button type="button" class="btn btn-block" id="btn-start-test" style="margin-top:1rem">
                ${t('home.continue_weekly')}
              </button>`
           : ''}`
      : `<div class="day-status">
           <span class="day-status__semaphore" aria-hidden="true">⚪</span>
           <p style="margin:0.25rem 0 0.75rem;font-size:1rem;color:var(--text-muted);text-align:center">
             ${t('home.test_pending')}
           </p>
         </div>
         ${cbiBadgeHtml}
         <button type="button" class="btn btn-block" id="btn-start-test"
                 style="margin-top:${cbiPending ? '0.75rem' : '0.5rem'}">
           ${t('home.start_test')}
         </button>`;

    container.innerHTML = `
      <section class="screen screen--home">
        <h1 class="screen__title">${t('home.title')}</h1>

        <div class="glass-card">
          ${dayCardHtml}
        </div>

        ${!doneToday || cbiPending
          ? `<div class="alert-banner alert-banner--warning" style="margin-top:0.85rem" role="status">
               <span aria-hidden="true">💡</span>
               <span>${doneToday ? t('home.cbi_reminder') || t('home.cbi_pending') : t('home.daily_reminder') || t('home.test_pending')}</span>
             </div>`
          : ''}
      </section>
    `;

    container.querySelector('#btn-start-test')?.addEventListener('click', () => {
      navigate('checkin');
    });
  }

  renderContent(false);
  checkCbiDue().then((cbiPending) => {
    if (cbiPending) renderContent(true);
  });
}
