// PulsePath — Controlador de generación de Informe de Impacto en PDF.
//
// Endpoint: GET /api/v1/dashboard/:orgId/report.pdf
//
// Flujo:
//   1. Verifica auth del empleador (mismo guard que getDashboard).
//   2. Obtiene los agregados K-anon de la DB con los mismos filtros opcionales
//      (department, shift, from, to) que el dashboard.
//   3. Llama a generateInsights() del motor de reglas.
//   4. Lee template.html + report.css e inyecta datos (reemplazo de placeholders).
//   5. Lanza Puppeteer: page.setContent(html) → page.pdf({ format: 'A4' }).
//   6. Responde con Content-Type application/pdf, Content-Disposition attachment.

import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { decryptNumber } from '../lib/crypto.js';
import { buildGroupsFromSessions, buildOrgTotal } from '../lib/kanon.js';
import { generateInsights } from './insights.js';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------

const round = (n) => (typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : null);

/** Escapa caracteres HTML para evitar inyección en el template. */
const esc = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Formatea una fecha ISO a 'dd de mes de yyyy' en español. */
function formatDate(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Construye HTML del rango de periodo para la portada. */
function buildPeriodText(from, to) {
  const f = formatDate(from);
  const t = formatDate(to);
  if (f && t) return `${f} — ${t}`;
  if (f) return `Desde ${f}`;
  if (t) return `Hasta ${t}`;
  return 'Periodo completo disponible';
}

/** Semáforo → etiqueta en español. */
const SEMAPHORE_LABEL = {
  green: 'Riesgo BAJO · Estado saludable',
  yellow: 'Riesgo MEDIO · Estado moderado',
  red: 'Riesgo ALTO · Requiere atención',
};

/** Semáforo → emoji. */
const SEMAPHORE_EMOJI = { green: '🟢', yellow: '🟡', red: '🔴' };

// ---------------------------------------------------------------------------
// Constructores de bloques HTML
// ---------------------------------------------------------------------------

function buildExecutiveSummaryHtml(paragraphs) {
  if (!paragraphs || paragraphs.length === 0) return '';
  return paragraphs.map((p) => `<p class="exec-para">${esc(p)}</p>`).join('\n');
}

function buildTrendText(trend) {
  if (!Array.isArray(trend) || trend.length < 2) return '—';
  const first = trend[0];
  const last = trend[trend.length - 1];
  const diff = last - first;
  if (diff > 2) return `↑ ${last} <span class="trend-up">(+${Math.round(diff)})</span>`;
  if (diff < -2) return `↓ ${last} <span class="trend-down">(${Math.round(diff)})</span>`;
  return `→ ${last} <span class="trend-stable">(estable)</span>`;
}

function buildDepartmentsTableHtml(groups) {
  if (!groups || groups.length === 0) {
    return '<p class="no-data">No hay datos de departamentos para este periodo.</p>';
  }

  const rows = groups
    .map((g) => {
      if (g.kanon_protected) {
        return `
          <tr class="kanon-row">
            <td class="dept-name">${esc(g.department)}</td>
            <td colspan="5" class="kanon-cell">
              <span class="badge-kanon">🔒 Protegido — K-anonimidad K=5 (grupo &lt; 5 personas)</span>
            </td>
          </tr>`;
      }

      const semColor =
        g.avg_risk_index >= 50 ? 'red' : g.avg_risk_index >= 35 ? 'yellow' : 'green';

      return `
        <tr>
          <td class="dept-name">${esc(g.department)}</td>
          <td class="text-center">${g.count_unique_users ?? '—'}</td>
          <td class="text-center">
            <span class="risk-pill risk-pill--${semColor}">${
              round(g.avg_risk_index) ?? '—'
            }</span>
          </td>
          <td class="text-center">${
            typeof g.pct_high_risk === 'number' ? round(g.pct_high_risk) + '%' : '—'
          }</td>
          <td class="text-center trend-cell">${buildTrendText(g.trend)}</td>
          <td class="text-center">${SEMAPHORE_EMOJI[semColor]}</td>
        </tr>`;
    })
    .join('');

  return `
    <table class="dept-table">
      <thead>
        <tr>
          <th>Departamento</th>
          <th>Personas únicas</th>
          <th>Índice de riesgo</th>
          <th>% Riesgo alto</th>
          <th>Tendencia</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildDriversHtml(drivers) {
  const items = [
    {
      key: 'pvt',
      label: 'Vigilancia / Fatiga PVT',
      pct: drivers.pvt,
      color: '#3b82f6',
      desc: 'Test de vigilancia psicomotora — mide lapses y tiempo de reacción',
    },
    {
      key: 'stroop',
      label: 'Control cognitivo Stroop',
      pct: drivers.stroop,
      color: '#8b5cf6',
      desc: 'Interferencia cognitiva — mide capacidad de inhibición y atención',
    },
    {
      key: 'cbi',
      label: 'Burnout acumulado CBI',
      pct: drivers.cbi,
      color: '#ef4444',
      desc: 'Copenhagen Burnout Inventory — mide agotamiento personal, laboral y de cliente',
    },
    {
      key: 'sleep',
      label: 'Déficit de sueño',
      pct: drivers.sleep,
      color: '#f59e0b',
      desc: 'Penalización por horas de sueño insuficientes (<7h)',
    },
  ].sort((a, b) => b.pct - a.pct);

  const rows = items.map(({ key, label, pct, color, desc }) => {
    const isDominant = key === drivers.dominant;
    return `
      <div class="driver-row${isDominant ? ' driver-row--dominant' : ''}">
        <div class="driver-label">
          ${isDominant ? '<span class="dominant-badge">Principal</span>' : ''}
          <strong>${esc(label)}</strong>
          <small>${esc(desc)}</small>
        </div>
        <div class="driver-bar-wrap">
          <div class="driver-bar" style="width:${Math.min(100, Math.max(0, pct))}%; background:${color}"></div>
          <span class="driver-pct">${typeof pct === 'number' ? Math.round(pct) : '—'}%</span>
        </div>
      </div>`;
  });

  return `<div class="drivers-chart">${rows.join('')}</div>`;
}

function buildTemporalHtml(groups) {
  const withTrend = (groups || []).filter(
    (g) => !g.kanon_protected && Array.isArray(g.trend) && g.trend.length >= 2,
  );

  if (withTrend.length === 0) {
    return `<p class="no-data">
      Se necesitan al menos dos periodos de datos por departamento para mostrar la evolución temporal.
      Los patrones por día de la semana y turno se habilitarán con el histórico acumulado del piloto.
    </p>`;
  }

  const rows = withTrend
    .map((g) => {
      const points = g.trend.map((v, i) => {
        const color = v >= 50 ? '#ef4444' : v >= 35 ? '#eab308' : '#22c55e';
        return `<span class="trend-point" style="background:${color}" title="Periodo ${i + 1}: ${v}">${v}</span>`;
      });
      return `
        <div class="trend-row">
          <span class="trend-dept">${esc(g.department)}</span>
          <div class="trend-points">${points.join('<span class="trend-arrow">→</span>')}</div>
        </div>`;
    })
    .join('');

  return `<div class="temporal-chart">${rows}</div>`;
}

function buildConclusionsHtml(conclusions) {
  if (!conclusions || conclusions.length === 0) {
    return '<p class="no-data">Sin conclusiones relevantes para este periodo.</p>';
  }
  const lis = conclusions.map((c) => `<li class="conclusion-item">${esc(c)}</li>`).join('');
  return `<ul class="conclusions-list">${lis}</ul>`;
}

function buildRecommendationsHtml(recommendations) {
  if (!recommendations || recommendations.length === 0) {
    return '<p class="no-data">Sin recomendaciones para este periodo.</p>';
  }

  // Último ítem = disclaimer obligatorio
  const mainRecs = recommendations.slice(0, -1);
  const disclaimer = recommendations[recommendations.length - 1];

  const listHtml =
    mainRecs.length > 0
      ? `<ol class="recommendations-list">${mainRecs.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>`
      : '';

  return `${listHtml}<div class="disclaimer-box">⚖️ ${esc(disclaimer)}</div>`;
}

// ---------------------------------------------------------------------------
// Inyector de datos en el template HTML
// ---------------------------------------------------------------------------

function buildHtml(template, css, ctx) {
  const {
    insights,
    groups,
    orgTotal,
    orgName,
    pilotRef,
    from,
    to,
    department,
    shift,
  } = ctx;

  const semColor = insights.semaphore || 'yellow';
  const semLabel = SEMAPHORE_LABEL[semColor];
  const semEmoji = SEMAPHORE_EMOJI[semColor];

  const avgRisk = round(insights.kpis.avg_risk);
  const pctHigh = round(insights.kpis.pct_high_risk);
  const adherence = round(insights.kpis.adherence_pct);

  const totalCount = orgTotal?.kanon_protected ? '—' : (orgTotal?.count ?? '—');
  const totalUsers = orgTotal?.kanon_protected ? '—' : (orgTotal?.count_unique_users ?? '—');

  const activeFilters = [
    department ? `Departamento: <strong>${esc(department)}</strong>` : null,
    shift ? `Turno: <strong>${esc(shift === 'morning' ? 'Mañana' : shift === 'afternoon' ? 'Tarde' : shift)}</strong>` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const now = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const data = {
    '{{INJECTED_CSS}}': `<style>\n${css}\n</style>`,
    '{{ORG_NAME}}': esc(orgName),
    '{{PILOT_REF}}': esc(pilotRef),
    '{{PERIODO}}': esc(buildPeriodText(from, to)),
    '{{FECHA_GENERACION}}': now,
    '{{SEMAPHORE_COLOR}}': semColor,
    '{{SEMAPHORE_LABEL}}': esc(semLabel),
    '{{SEMAPHORE_EMOJI}}': semEmoji,
    '{{HEADLINE}}': esc(insights.headline),
    '{{KPI_AVG_RISK}}': avgRisk !== null ? String(avgRisk) : '—',
    '{{KPI_PCT_HIGH}}': pctHigh !== null ? `${pctHigh}%` : '—',
    '{{KPI_ADHERENCE}}': adherence !== null ? `${adherence}%` : 'N/D',
    '{{TOTAL_SESSIONS}}': String(totalCount),
    '{{TOTAL_USERS}}': String(totalUsers),
    '{{ACTIVE_FILTERS}}': activeFilters || 'Sin filtros activos (todos los departamentos y turnos)',
    '{{DRIVER_PVT_PCT}}': String(typeof insights.drivers.pvt === 'number' ? Math.min(100, Math.max(0, insights.drivers.pvt)) : 0),
    '{{DRIVER_STROOP_PCT}}': String(typeof insights.drivers.stroop === 'number' ? Math.min(100, Math.max(0, insights.drivers.stroop)) : 0),
    '{{DRIVER_CBI_PCT}}': String(typeof insights.drivers.cbi === 'number' ? Math.min(100, Math.max(0, insights.drivers.cbi)) : 0),
    '{{DRIVER_SLEEP_PCT}}': String(typeof insights.drivers.sleep === 'number' ? Math.min(100, Math.max(0, insights.drivers.sleep)) : 0),
    '{{DRIVER_DOMINANT_LABEL}}': esc(
      { pvt: 'Vigilancia / Fatiga PVT', stroop: 'Control cognitivo Stroop', cbi: 'Burnout CBI', sleep: 'Déficit de sueño' }[
        insights.drivers.dominant
      ] || '—',
    ),
    '{{EXECUTIVE_SUMMARY_HTML}}': buildExecutiveSummaryHtml(insights.executive_summary),
    '{{DEPARTMENTS_TABLE_HTML}}': buildDepartmentsTableHtml(groups),
    '{{DRIVERS_HTML}}': buildDriversHtml(insights.drivers),
    '{{TEMPORAL_HTML}}': buildTemporalHtml(groups),
    '{{CONCLUSIONS_HTML}}': buildConclusionsHtml(insights.conclusions),
    '{{RECOMMENDATIONS_HTML}}': buildRecommendationsHtml(insights.recommendations),
  };

  let html = template;
  for (const [placeholder, value] of Object.entries(data)) {
    html = html.replaceAll(placeholder, value);
  }
  return html;
}

// ---------------------------------------------------------------------------
// Controlador principal
// ---------------------------------------------------------------------------

export async function generateReport(req, res) {
  const { orgId } = req.params;

  if (req.employer.orgId !== orgId) {
    return res.status(403).json({ error: 'Access denied: org mismatch.' });
  }

  const { department, shift, from, to } = req.query;

  // Build Prisma where clause (mirrors getDashboard)
  const where = { orgId };
  if (department) where.department = department;
  if (shift) where.shift = shift;

  if (from || to) {
    where.takenAt = {};
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ error: 'Invalid "from" date.' });
      }
      where.takenAt.gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid "to" date.' });
      }
      toDate.setUTCHours(23, 59, 59, 999);
      where.takenAt.lte = toDate;
    }
  }

  // Fetch sessions + org data
  let rawSessions;
  let orgName = 'Organización';
  let pilotRef = '2026_OVT_694068';

  try {
    rawSessions = await prisma.session.findMany({
      where,
      select: {
        codeHash: true,
        department: true,
        takenAt: true,
        riskIndexEnc: true,
        pvtIndexEnc: true,
        stroopIndexEnc: true,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Database error fetching sessions.' });
  }

  // Try to get org metadata — graceful fallback if model name differs
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, pilotRef: true },
    });
    if (org) {
      orgName = org.name || orgName;
      pilotRef = org.pilotRef || pilotRef;
    }
  } catch {
    // Prisma model name may differ in this project — use defaults
  }

  // Build aggregated dashboard data (same K-anon logic as getDashboard)
  const groups = buildGroupsFromSessions(rawSessions, decryptNumber);

  const allDecrypted = [];
  for (const s of rawSessions) {
    try {
      allDecrypted.push({
        codeHash: s.codeHash,
        takenAt: s.takenAt,
        _risk: decryptNumber(s.riskIndexEnc),
        _pvt: decryptNumber(s.pvtIndexEnc),
        _stroop: decryptNumber(s.stroopIndexEnc),
      });
    } catch {
      // Corrupted record — skip silently
    }
  }
  const org_total = buildOrgTotal(allDecrypted);
  const dashboardData = { groups, org_total };

  // Generate insights via rule engine
  const insights = generateInsights(dashboardData, {});

  // Read template and CSS
  let template;
  let css;
  try {
    template = readFileSync(join(__dirname, 'template.html'), 'utf8');
    css = readFileSync(join(__dirname, 'report.css'), 'utf8');
  } catch (err) {
    return res.status(500).json({ error: 'Report template files not found on server.' });
  }

  // Build the final HTML with all data injected
  const html = buildHtml(template, css, {
    insights,
    groups,
    orgTotal: org_total,
    orgName,
    pilotRef,
    from,
    to,
    department,
    shift,
  });

  // Launch Puppeteer — dynamic import so the server starts even if puppeteer is not yet installed
  let puppeteerMod;
  try {
    puppeteerMod = await import('puppeteer');
  } catch {
    return res.status(501).json({
      error:
        'Puppeteer no instalado. Ejecuta: cd backend && npm install   (puppeteer ya está en package.json)',
    });
  }

  const puppeteer = puppeteerMod.default;
  let browser;

  try {
    // En producción (Docker/Render) se usa el Chromium del sistema vía
    // PUPPETEER_EXECUTABLE_PATH. En local, si la variable no está definida,
    // Puppeteer usa el Chromium que descargó al instalarse.
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });

    await browser.close();
    browser = null;

    const filename = `pulsepath-informe-${orgId.slice(0, 8)}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-store');
    return res.end(pdfBuffer);
  } catch (err) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.error('[report.controller] Puppeteer error:', err?.message || err);
    return res.status(500).json({
      error: 'Error al generar el PDF con Puppeteer. Consulta los logs del servidor.',
      detail: err?.message,
    });
  }
}
