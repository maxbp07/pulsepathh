// K-anonymity module (K = 5) for PulsePath aggregated dashboard metrics.
//
// Privacy rules (do NOT simplify):
//   - A group is only exposed when it contains at least K UNIQUE PEOPLE
//     (distinct code_hash values). One person with 10 tests counts as 1.
//   - Groups with fewer than K unique people are suppressed entirely and
//     replaced by { department, kanon_protected: true, message }.
//   - code_hash values are NEVER included in any output.

const DEFAULT_K = 5;
const PROTECTED_MESSAGE = 'Protected (K-anonymity)';

/**
 * ISO year-week key for a Date, e.g. "2026-42". Used to bucket sessions into
 * calendar weeks for the weekly trend array.
 * @param {Date|string|number} date
 * @returns {string}
 */
function isoWeekKey(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  // Shift to Thursday of the same ISO week (ISO 8601 defines week by Thursday).
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${year}-${String(week).padStart(2, '0')}`;
}

const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const avg = (arr) => (arr.length ? sum(arr) / arr.length : 0);
const round1 = (n) => Math.round(n * 10) / 10;

// Pesos del índice de riesgo (idénticos a risk_engine / insights / seed).
const RISK_W = { pvt: 0.4, stroop: 0.25, cbi: 0.25, sleep: 0.1 };

/** Penalización (0-100) por horas de sueño: ≥7→0 · 5-7→25 · 4-5→50 · <4→75. */
function sleepPenaltyFromHours(hours) {
  if (typeof hours !== 'number' || !Number.isFinite(hours)) return null;
  if (hours >= 7) return 0;
  if (hours >= 5) return 25;
  if (hours >= 4) return 50;
  return 75;
}

/**
 * Desglose EXACTO de drivers para una lista de sesiones descifradas: reparte
 * el índice de riesgo medio en las contribuciones de PVT / Stroop / CBI / sueño
 * según los pesos de la fórmula. Devuelve porcentajes de contribución (0-100),
 * el driver dominante y los promedios crudos. Si faltan CBI/sueño, se omiten.
 *
 * @param {{ _risk:number,_pvt:number,_stroop:number,_cbi:?number,_sleep:?number }[]} sessions
 */
function computeDrivers(sessions) {
  if (!sessions.length) return null;

  const avgPvt = avg(sessions.map((s) => s._pvt));
  const avgStroop = avg(sessions.map((s) => s._stroop));

  const cbiVals = sessions.map((s) => s._cbi).filter((v) => typeof v === 'number');
  const sleepVals = sessions.map((s) => s._sleep).filter((v) => typeof v === 'number');
  const avgCbi = cbiVals.length ? avg(cbiVals) : null;
  const avgSleepHours = sleepVals.length ? avg(sleepVals) : null;
  const sleepPenalty = avgSleepHours != null ? sleepPenaltyFromHours(avgSleepHours) : null;

  const cPvt = RISK_W.pvt * avgPvt;
  const cStroop = RISK_W.stroop * avgStroop;
  const cCbi = avgCbi != null ? RISK_W.cbi * avgCbi : 0;
  const cSleep = sleepPenalty != null ? RISK_W.sleep * sleepPenalty : 0;

  const total = cPvt + cStroop + cCbi + cSleep || 1;
  const contributions = { pvt: cPvt, stroop: cStroop, cbi: cCbi, sleep: cSleep };
  const dominant = Object.keys(contributions).reduce((a, b) =>
    contributions[b] > contributions[a] ? b : a,
  );

  return {
    pvt: Math.round((cPvt / total) * 100),
    stroop: Math.round((cStroop / total) * 100),
    cbi: Math.round((cCbi / total) * 100),
    sleep: Math.round((cSleep / total) * 100),
    dominant,
  };
}

/**
 * Number of distinct people (code_hash values) within a list of sessions.
 * @param {{ codeHash: string }[]} sessions
 * @returns {number}
 */
function countUniqueUsers(sessions) {
  const seen = new Set();
  for (const s of sessions) seen.add(s.codeHash);
  return seen.size;
}

/**
 * Computes aggregated metrics for a list of decrypted sessions.
 * @param {{ codeHash: string, _risk: number, _pvt: number, _stroop: number, takenAt: Date }[]} sessions
 */
function computeMetrics(sessions) {
  const count = sessions.length;
  const riskVals = sessions.map((s) => s._risk);
  const pvtVals = sessions.map((s) => s._pvt);
  const stroopVals = sessions.map((s) => s._stroop);

  // Weekly trend: mean risk_index per ISO week, ordered chronologically.
  const weekBuckets = new Map();
  for (const s of sessions) {
    const key = isoWeekKey(s.takenAt);
    if (!weekBuckets.has(key)) weekBuckets.set(key, []);
    weekBuckets.get(key).push(s._risk);
  }
  const trend = [...weekBuckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, vals]) => round1(avg(vals)));

  const cbiVals = sessions.map((s) => s._cbi).filter((v) => typeof v === 'number');
  const sleepVals = sessions.map((s) => s._sleep).filter((v) => typeof v === 'number');

  return {
    count,
    count_unique_users: countUniqueUsers(sessions),
    avg_risk_index: round1(avg(riskVals)),
    avg_pvt_index: round1(avg(pvtVals)),
    avg_stroop_index: round1(avg(stroopVals)),
    avg_cbi_score: cbiVals.length ? round1(avg(cbiVals)) : null,
    avg_sleep_hours: sleepVals.length ? round1(avg(sleepVals)) : null,
    pct_high_risk: Math.round((riskVals.filter((v) => v >= 50).length / count) * 100),
    drivers: computeDrivers(sessions),
    // A single data point carries no directional meaning.
    trend: trend.length >= 2 ? trend : [],
  };
}

/**
 * Descifra una lista de sesiones Prisma a un formato normalizado con todas las
 * dimensiones y métricas. Los registros que fallan al descifrar se omiten.
 *
 * @param {Array<object>} rawSessions
 * @param {(buf: Buffer) => number} decryptFn
 * @returns {object[]}
 */
export function decryptSessions(rawSessions, decryptFn) {
  const out = [];
  for (const s of rawSessions) {
    try {
      out.push({
        codeHash: s.codeHash,
        department: s.department ?? null,
        shift: s.shift ?? null,
        gender: s.gender ?? null,
        ageBand: s.ageBand ?? null,
        tenureBand: s.tenureBand ?? null,
        takenAt: s.takenAt,
        _risk: decryptFn(s.riskIndexEnc),
        _pvt: decryptFn(s.pvtIndexEnc),
        _stroop: decryptFn(s.stroopIndexEnc),
        _cbi: s.cbiScoreEnc != null ? decryptFn(s.cbiScoreEnc) : null,
        _sleep: s.sleepHoursEnc != null ? decryptFn(s.sleepHoursEnc) : null,
      });
    } catch {
      // Corrupted / undecryptable record — skip silently.
    }
  }
  return out;
}

/**
 * Applies K-anonymity suppression to a list of department groups.
 *
 * @param {{ department: string, sessions: { codeHash: string, _risk: number, _pvt: number, _stroop: number, takenAt: Date }[] }[]} groups
 * @param {number} [K=5]
 * @returns {object[]} Processed groups; those with < K unique people suppressed.
 */
export function applyKAnonymity(groups, K = DEFAULT_K) {
  const out = [];
  for (const group of groups) {
    const sessions = group.sessions || [];
    const uniqueUsers = countUniqueUsers(sessions);

    if (uniqueUsers < K) {
      out.push({
        department: group.department,
        kanon_protected: true,
        message: PROTECTED_MESSAGE,
      });
      continue;
    }

    out.push({
      department: group.department,
      ...computeMetrics(sessions),
      kanon_protected: false,
    });
  }
  return out;
}

/**
 * Builds the final department-grouped API array from raw Prisma sessions.
 * Decrypts encrypted fields, groups by department, computes metrics and
 * applies K-anonymity. Records that fail decryption are silently ignored.
 *
 * @param {Array<object>} rawSessions Prisma sessions (encrypted Bytes fields + codeHash + department + takenAt).
 * @param {(buf: Buffer) => number} decryptFn e.g. decryptNumber.
 * @param {number} [K=5]
 * @returns {object[]} Final array for the API (code_hash never exposed).
 */
export function buildGroupsFromSessions(rawSessions, decryptFn, K = DEFAULT_K) {
  const deptMap = new Map();

  for (const s of rawSessions) {
    let decrypted;
    try {
      decrypted = {
        codeHash: s.codeHash,
        department: s.department,
        takenAt: s.takenAt,
        _risk: decryptFn(s.riskIndexEnc),
        _pvt: decryptFn(s.pvtIndexEnc),
        _stroop: decryptFn(s.stroopIndexEnc),
      };
    } catch {
      // Corrupted / undecryptable record — skip silently.
      continue;
    }

    if (!deptMap.has(decrypted.department)) deptMap.set(decrypted.department, []);
    deptMap.get(decrypted.department).push(decrypted);
  }

  const groups = [...deptMap.entries()].map(([department, sessions]) => ({
    department,
    sessions,
  }));

  const result = applyKAnonymity(groups, K);
  result.sort((a, b) => a.department.localeCompare(b.department));
  return result;
}

/**
 * Builds the org-wide total metrics (no department breakdown). Applies a
 * global K-anonymity check: if the org has fewer than K unique people, the
 * total is suppressed.
 *
 * @param {{ codeHash: string, _risk: number, _pvt: number, _stroop: number, takenAt: Date }[]} allDecryptedSessions
 * @param {number} [K=5]
 * @returns {object} org_total object.
 */
/**
 * Agrupa sesiones YA descifradas por cualquier dimensión (department, shift,
 * gender, ageBand, tenureBand) y aplica K-anonimidad. Devuelve un array de
 * grupos { group, dimension, ...metrics } ordenado por riesgo descendente; los
 * grupos con < K personas únicas se suprimen (kanon_protected: true).
 *
 * @param {object[]} decryptedSessions Salida de decryptSessions().
 * @param {string} dimension Clave: 'department'|'shift'|'gender'|'ageBand'|'tenureBand'.
 * @param {number} [K=5]
 */
export function buildSegments(decryptedSessions, dimension, K = DEFAULT_K) {
  const map = new Map();
  for (const s of decryptedSessions) {
    const value = s[dimension];
    if (value == null || value === '') continue; // sin etiqueta → no se agrupa
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(s);
  }

  const groups = [...map.entries()].map(([value, sessions]) => {
    const uniqueUsers = countUniqueUsers(sessions);
    if (uniqueUsers < K) {
      return { group: value, dimension, kanon_protected: true, message: PROTECTED_MESSAGE };
    }
    return { group: value, dimension, ...computeMetrics(sessions), kanon_protected: false };
  });

  // Visibles primero, ordenados por riesgo descendente; protegidos al final.
  groups.sort((a, b) => {
    if (a.kanon_protected && !b.kanon_protected) return 1;
    if (!a.kanon_protected && b.kanon_protected) return -1;
    if (a.kanon_protected && b.kanon_protected) return String(a.group).localeCompare(b.group);
    return (b.avg_risk_index ?? 0) - (a.avg_risk_index ?? 0);
  });
  return groups;
}

/**
 * Construye un mapa de calor (matriz) de dos dimensiones, p. ej. department ×
 * shift. Cada celda lleva su propio chequeo de K-anonimidad: las celdas con
 * < K personas se marcan kanon_protected y no exponen métricas.
 *
 * @param {object[]} decryptedSessions Salida de decryptSessions().
 * @param {string} rowKey Dimensión de filas (p. ej. 'department').
 * @param {string} colKey Dimensión de columnas (p. ej. 'shift').
 * @param {number} [K=5]
 * @returns {{ rowKey:string, colKey:string, rows:string[], cols:string[], cells:object[] }}
 */
export function buildHeatmap(decryptedSessions, rowKey, colKey, K = DEFAULT_K) {
  const rowSet = new Set();
  const colSet = new Set();
  const cellMap = new Map(); // `${row}|${col}` → sessions[]

  for (const s of decryptedSessions) {
    const r = s[rowKey];
    const c = s[colKey];
    if (r == null || r === '' || c == null || c === '') continue;
    rowSet.add(r);
    colSet.add(c);
    const key = `${r}|${c}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key).push(s);
  }

  const rows = [...rowSet].sort((a, b) => String(a).localeCompare(b));
  const cols = [...colSet].sort((a, b) => String(a).localeCompare(b));
  const cells = [];

  for (const r of rows) {
    for (const c of cols) {
      const sessions = cellMap.get(`${r}|${c}`) || [];
      if (sessions.length === 0) {
        cells.push({ row: r, col: c, empty: true });
        continue;
      }
      const uniqueUsers = countUniqueUsers(sessions);
      if (uniqueUsers < K) {
        cells.push({ row: r, col: c, kanon_protected: true });
        continue;
      }
      const m = computeMetrics(sessions);
      cells.push({
        row: r,
        col: c,
        kanon_protected: false,
        avg_risk_index: m.avg_risk_index,
        pct_high_risk: m.pct_high_risk,
        count_unique_users: m.count_unique_users,
      });
    }
  }

  return { rowKey, colKey, rows, cols, cells };
}

export function buildOrgTotal(allDecryptedSessions, K = DEFAULT_K) {
  const sessions = allDecryptedSessions || [];
  const uniqueUsers = countUniqueUsers(sessions);

  if (uniqueUsers < K) {
    return { kanon_protected: true, message: PROTECTED_MESSAGE };
  }

  const metrics = computeMetrics(sessions);
  return {
    count: metrics.count,
    count_unique_users: metrics.count_unique_users,
    avg_risk_index: metrics.avg_risk_index,
    pct_high_risk: metrics.pct_high_risk,
    kanon_protected: false,
  };
}
