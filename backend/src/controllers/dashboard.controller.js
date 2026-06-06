import { PrismaClient } from '@prisma/client';
import { decryptNumber } from '../lib/crypto.js';
import { buildGroupsFromSessions, buildOrgTotal } from '../lib/kanon.js';

/** Escapa una celda CSV (rodea con comillas si contiene coma, comilla o salto de línea). */
function csvCell(value) {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Serializa un array de objetos a texto CSV dado un array de columnas [{key, header}]. */
function toCsv(rows, columns) {
  const header = columns.map((c) => csvCell(c.header)).join(',');
  const body = rows
    .map((row) => columns.map((c) => csvCell(row[c.key])).join(','))
    .join('\r\n');
  return `${header}\r\n${body}`;
}

const prisma = new PrismaClient();

/**
 * GET /api/v1/dashboard/:orgId
 *
 * Returns aggregated session metrics grouped by department, enforcing
 * K-anonymity (K = 5) via the kanon module: groups with fewer than 5 unique
 * people are suppressed and flagged with kanon_protected: true. Individual
 * session data and code_hash values are never included in the response.
 *
 * Query params (all optional):
 *   department  string   — filter to a single department
 *   shift       string   — filter to a single shift ("morning" | "afternoon")
 *   from        ISO date — sessions taken on or after this date (UTC midnight)
 *   to          ISO date — sessions taken on or before end of this date
 */
export async function getDashboard(req, res) {
  const { orgId } = req.params;

  // Verify the authenticated employer belongs to the requested org.
  if (req.employer.orgId !== orgId) {
    return res.status(403).json({ error: 'Access denied: org mismatch.' });
  }

  const { department, shift, from, to } = req.query;

  // Build Prisma where clause from optional filters.
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
      // Include the full final day regardless of time zone.
      toDate.setUTCHours(23, 59, 59, 999);
      where.takenAt.lte = toDate;
    }
  }

  let rawSessions;
  try {
    rawSessions = await prisma.session.findMany({
      where,
      select: {
        // codeHash is selected ONLY to count unique people for K-anonymity.
        // It is never included in the API response.
        codeHash: true,
        department: true,
        takenAt: true,
        riskIndexEnc: true,
        pvtIndexEnc: true,
        stroopIndexEnc: true,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Database error.' });
  }

  // Department groups with K-anonymity suppression applied internally.
  const groups = buildGroupsFromSessions(rawSessions, decryptNumber);

  // Org-wide totals: decrypt all (filtered) sessions, ignoring failures, then
  // apply the global K-anonymity check.
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
      // Corrupted record — skip silently.
    }
  }
  const org_total = buildOrgTotal(allDecrypted);

  return res.status(200).json({ groups, org_total });
}

/**
 * GET /api/v1/dashboard/:orgId/export.csv
 *
 * Descarga un CSV con métricas agregadas por departamento, aplicando K-anonimidad.
 * Solo contiene datos agregados, nunca individuales.
 *
 * Columnas: department, count_unique_users, avg_risk_index, pct_high_risk, kanon_protected
 *
 * Acepta los mismos query params de filtro que getDashboard (department, shift, from, to).
 */
export async function exportDashboardCsv(req, res) {
  const { orgId } = req.params;

  if (req.employer.orgId !== orgId) {
    return res.status(403).json({ error: 'Access denied: org mismatch.' });
  }

  const { department, shift, from, to } = req.query;

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

  let rawSessions;
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
    return res.status(500).json({ error: 'Database error.' });
  }

  const groups = buildGroupsFromSessions(rawSessions, decryptNumber);

  const CSV_COLUMNS = [
    { key: 'department',        header: 'department' },
    { key: 'count_unique_users', header: 'count_unique_users' },
    { key: 'avg_risk_index',    header: 'avg_risk_index' },
    { key: 'pct_high_risk',     header: 'pct_high_risk' },
    { key: 'kanon_protected',   header: 'kanon_protected' },
  ];

  // Para grupos suprimidos, las métricas quedan vacías (solo department + kanon_protected=true).
  const rows = groups.map((g) =>
    g.kanon_protected
      ? {
          department: g.department,
          count_unique_users: '',
          avg_risk_index: '',
          pct_high_risk: '',
          kanon_protected: true,
        }
      : {
          department: g.department,
          count_unique_users: g.count_unique_users,
          avg_risk_index: g.avg_risk_index,
          pct_high_risk: g.pct_high_risk,
          kanon_protected: false,
        },
  );

  const csvContent = toCsv(rows, CSV_COLUMNS);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `pulsepath-${orgId}-${today}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).send(csvContent);
}
