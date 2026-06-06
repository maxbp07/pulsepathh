/**
 * Historial — Fase 4 polish
 * Sparkline en card dedicada, sessions com a cards, empty state amb SVG.
 * Tota la lògica de getSessions, weekAverage i bestWorstDays intacta.
 */
import { t, getLanguage } from '../i18n/index.js';
import { initDb, getSessions } from '../storage/db.js';

const LOCALE_MAP = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };

function riskColor(index) {
  if (index < 35) return '#4ade80';
  if (index < 60) return '#facc15';
  return '#f87171';
}

function getLocale() {
  return LOCALE_MAP[getLanguage()] ?? 'ca-ES';
}

function formatSessionDate(takenAt) {
  const d = new Date(takenAt);
  if (Number.isNaN(d.getTime())) return String(takenAt);
  return new Intl.DateTimeFormat(getLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatDayLabel(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return dayKey;
  return new Intl.DateTimeFormat(getLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function sortAsc(sessions) {
  return [...sessions].sort((a, b) =>
    String(a.takenAt).localeCompare(String(b.takenAt)),
  );
}

function getWeekSessions(sessions) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 6);
  return sessions.filter((s) => {
    const d = new Date(s.takenAt);
    return !Number.isNaN(d.getTime()) && d >= cutoff;
  });
}

function weekAverage(sessions) {
  const week = getWeekSessions(sessions);
  const values = week
    .map((s) => Number(s.riskIndex))
    .filter((v) => Number.isFinite(v));
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function dailyAverages(sessions) {
  const byDay = new Map();
  for (const s of sessions) {
    const risk = Number(s.riskIndex);
    if (!Number.isFinite(risk)) continue;
    const day = String(s.takenAt).slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(risk);
  }
  return [...byDay.entries()].map(([day, values]) => ({
    day,
    avg: values.reduce((a, b) => a + b, 0) / values.length,
  }));
}

function bestWorstDays(sessions) {
  const days = dailyAverages(sessions);
  if (days.length === 0) return { best: null, worst: null };
  let best = days[0];
  let worst = days[0];
  for (const entry of days) {
    if (entry.avg < best.avg) best = entry;
    if (entry.avg > worst.avg) worst = entry;
  }
  return { best, worst };
}

function buildSparkline(sessionsAsc) {
  const values = sessionsAsc
    .map((s) => Number(s.riskIndex))
    .filter((v) => Number.isFinite(v));
  if (values.length === 0) return '';

  const w = 280;
  const h = 72;
  const pad = { t: 10, r: 10, b: 10, l: 10 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const points = values.map((v, i) => {
    const x = values.length === 1
      ? pad.l + innerW / 2
      : pad.l + (i / (values.length - 1)) * innerW;
    const y = pad.t + innerH - (v / 100) * innerH;
    return { x, y, v };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const baseY = pad.t + innerH;
  const areaPoints = `${pad.l},${baseY} ${linePoints} ${points[points.length - 1].x},${baseY}`;

  const gridLines = [35, 60].map((level) => {
    const y = pad.t + innerH - (level / 100) * innerH;
    return `<line x1="${pad.l}" y1="${y}" x2="${w - pad.r}" y2="${y}"
      stroke="rgba(139,155,184,0.2)" stroke-width="1" stroke-dasharray="3 3"/>`;
  }).join('');

  const markers = points.map(
    (p) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${riskColor(p.v)}"
      stroke="rgba(7,9,15,0.6)" stroke-width="1.5"/>`,
  ).join('');

  const lineOrDot = values.length > 1
    ? `<polygon points="${areaPoints}" fill="url(#history-spark-fill)"/>
       <polyline points="${linePoints}" fill="none" stroke="#22d3ee"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<circle cx="${points[0].x}" cy="${points[0].y}" r="5" fill="#22d3ee"/>`;

  return `
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}"
      role="img" aria-label="${t('history.trend_title')}"
      style="display:block;margin-top:0.5rem">
      <defs>
        <linearGradient id="history-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(34,211,238,0.3)"/>
          <stop offset="100%" stop-color="rgba(34,211,238,0)"/>
        </linearGradient>
      </defs>
      ${gridLines}
      ${lineOrDot}
      ${markers}
    </svg>
  `;
}

/** SVG de línia de pols buida per a l'estat buit */
function emptyPulseSvg() {
  return `
    <svg class="empty-state__svg" width="200" height="56" viewBox="0 0 200 56"
         aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 28 H60 L72 8 L84 48 L96 20 L108 36 L120 28 H200"
        stroke="rgba(34,211,238,0.35)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;
}

function renderSessionCard(session) {
  const risk    = Number(session.riskIndex);
  const hasRisk = Number.isFinite(risk);
  const color   = hasRisk ? riskColor(risk) : 'var(--text-muted)';

  return `
    <div class="session-card">
      <span class="session-card__date">${formatSessionDate(session.takenAt)}</span>
      <div class="session-card__risk">
        <span class="session-card__risk-label">${t('history.risk_label')}</span>
        <span class="session-card__risk-value" style="color:${color}">
          ${hasRisk ? risk : '—'}
        </span>
      </div>
    </div>
  `;
}

function renderSummary(sessions) {
  const avg         = weekAverage(sessions);
  const showExtremes = sessions.length >= 3;
  const { best, worst } = showExtremes
    ? bestWorstDays(sessions)
    : { best: null, worst: null };

  if (avg === null && !showExtremes) return '';

  const statStyle  = 'display:flex;flex-direction:column;gap:0.15rem';
  const labelStyle = 'font-size:0.75rem;color:var(--text-muted)';
  const valueStyle = 'font-size:1.1rem;font-weight:600';

  return `
    <div class="glass-card">
      <h2 style="margin:0 0 0.85rem;font-size:0.95rem;font-weight:600;color:var(--text-primary)">
        ${t('history.summary_title')}
      </h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(5.5rem,1fr));gap:0.85rem">
        ${avg !== null ? `
          <div style="${statStyle}">
            <span style="${labelStyle}">${t('history.week_avg')}</span>
            <span style="${valueStyle};color:${riskColor(avg)}">${avg}</span>
          </div>
        ` : ''}
        ${best ? `
          <div style="${statStyle}">
            <span style="${labelStyle}">${t('history.best_day')}</span>
            <span style="${valueStyle};color:${riskColor(Math.round(best.avg))}">
              ${formatDayLabel(best.day)}
              <span style="font-size:0.8rem;font-weight:500;color:var(--text-muted)">
                (${Math.round(best.avg)})
              </span>
            </span>
          </div>
        ` : ''}
        ${worst ? `
          <div style="${statStyle}">
            <span style="${labelStyle}">${t('history.worst_day')}</span>
            <span style="${valueStyle};color:${riskColor(Math.round(worst.avg))}">
              ${formatDayLabel(worst.day)}
              <span style="font-size:0.8rem;font-weight:500;color:var(--text-muted)">
                (${Math.round(worst.avg)})
              </span>
            </span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderEmpty(navigate) {
  return `
    <section class="screen screen--history">
      <h1 class="screen__title">${t('history.title')}</h1>
      <p class="screen__subtitle">${t('history.subtitle')}</p>
      <div class="glass-card">
        <div class="empty-state">
          ${emptyPulseSvg()}
          <p class="empty-state__title">${t('history.empty_title')}</p>
          <p class="empty-state__body">${t('history.empty_body')}</p>
        </div>
      </div>
      ${typeof navigate === 'function' ? `
        <button type="button" class="btn btn--ghost btn-block" id="btn-history-back">
          ${t('common.back')}
        </button>
      ` : ''}
    </section>
  `;
}

function renderContent(sessions, navigate) {
  const asc         = sortAsc(sessions);
  const summaryHtml = renderSummary(sessions);
  const cardsHtml   = sessions.map(renderSessionCard).join('');

  return `
    <section class="screen screen--history">
      <h1 class="screen__title">${t('history.title')}</h1>
      <p class="screen__subtitle">${t('history.subtitle')}</p>

      <div class="glass-card">
        <h2 style="margin:0;font-size:0.95rem;font-weight:600;color:var(--text-primary)">
          ${t('history.trend_title')}
        </h2>
        ${buildSparkline(asc)}
        <div class="sparkline-legend">
          <span class="sparkline-legend__item">
            <span class="sparkline-legend__dot" style="background:#4ade80"></span>
            &lt;35
          </span>
          <span class="sparkline-legend__item">
            <span class="sparkline-legend__dot" style="background:#facc15"></span>
            &lt;60
          </span>
          <span class="sparkline-legend__item">
            <span class="sparkline-legend__dot" style="background:#f87171"></span>
            ≥60
          </span>
        </div>
      </div>

      ${summaryHtml}

      <div class="glass-card">
        <h2 style="margin:0 0 0.75rem;font-size:0.95rem;font-weight:600;color:var(--text-primary)">
          ${t('history.sessions_title')}
        </h2>
        <div>
          ${cardsHtml}
        </div>
      </div>

      ${typeof navigate === 'function' ? `
        <button type="button" class="btn btn--ghost btn-block" id="btn-history-back">
          ${t('common.back')}
        </button>
      ` : ''}
    </section>
  `;
}

function bindBackButton(container, navigate) {
  container.querySelector('#btn-history-back')?.addEventListener('click', () => {
    navigate('home');
  });
}

export function render(container, { navigate } = {}) {
  container.innerHTML = `
    <section class="screen screen--history">
      <h1 class="screen__title">${t('history.title')}</h1>
      <p class="screen__subtitle" style="margin-bottom:1rem">${t('common.loading')}</p>
      <div class="glass-card">
        <p style="margin:0;color:var(--text-muted);text-align:center">${t('common.loading')}</p>
      </div>
    </section>
  `;

  (async () => {
    try {
      await initDb();
      const sessions = await getSessions(30);

      if (!sessions.length) {
        container.innerHTML = renderEmpty(navigate);
      } else {
        container.innerHTML = renderContent(sessions, navigate);
      }

      bindBackButton(container, navigate);
    } catch {
      container.innerHTML = renderEmpty(navigate);
      bindBackButton(container, navigate);
    }
  })();
}
