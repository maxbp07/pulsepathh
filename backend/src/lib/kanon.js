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

  return {
    count,
    count_unique_users: countUniqueUsers(sessions),
    avg_risk_index: round1(avg(riskVals)),
    avg_pvt_index: round1(avg(pvtVals)),
    avg_stroop_index: round1(avg(stroopVals)),
    pct_high_risk: Math.round((riskVals.filter((v) => v >= 50).length / count) * 100),
    // A single data point carries no directional meaning.
    trend: trend.length >= 2 ? trend : [],
  };
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
