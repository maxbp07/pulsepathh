import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TIMEPOINTS = ['D0', 'D7', 'D14'];

function studyDay(studyDay0, asOf) {
  if (!studyDay0) return null;
  const start = new Date(studyDay0);
  const end = new Date(asOf + 'T00:00:00.000Z');
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function forbiddenScoreKeys(obj) {
  const banned = ['fri', 'times', 'items', 'score', 'responses', 'payload', 'vitality'];
  return banned.some((k) => k in obj);
}

export async function getAdherence(req, res) {
  const { orgId } = req.params;
  const asOf = req.query.as_of ?? new Date().toISOString().slice(0, 10);

  try {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const codes = await prisma.accessCode.findMany({
      where: { orgId, revoked: false },
      select: {
        codeHash: true,
        slotLabel: true,
        activatedAt: true,
        studyDay0: true,
        lastSeenAt: true,
      },
      orderBy: { slotLabel: 'asc' },
    });

    const daily = await prisma.dailyCheckin.findMany({
      where: { orgId, dateLocal: { lte: new Date(asOf + 'T00:00:00.000Z') } },
      select: { codeHash: true, dateLocal: true },
    });

    const questionnaires = await prisma.questionnaireSubmission.findMany({
      where: { orgId },
      select: { codeHash: true, timepoint: true },
    });

    const dailyByCode = new Map();
    for (const row of daily) {
      const key = row.codeHash;
      if (!dailyByCode.has(key)) dailyByCode.set(key, []);
      dailyByCode.get(key).push(row.dateLocal.toISOString().slice(0, 10));
    }

    const qByCode = new Map();
    for (const row of questionnaires) {
      const key = row.codeHash;
      if (!qByCode.has(key)) qByCode.set(key, new Set());
      qByCode.get(key).add(row.timepoint);
    }

    const participants = codes.map((code) => {
      const day = studyDay(code.studyDay0, asOf);
      const dailyDates = [...new Set(dailyByCode.get(code.codeHash) ?? [])].sort();
      const done = qByCode.get(code.codeHash) ?? new Set();
      const questionnairesDone = Object.fromEntries(TIMEPOINTS.map((tp) => [tp, done.has(tp)]));

      return {
        slot_label: code.slotLabel,
        code_hash_prefix: code.codeHash.slice(0, 6),
        activated: Boolean(code.activatedAt),
        study_day: day,
        last_seen_at: code.lastSeenAt?.toISOString() ?? null,
        daily_days_completed: dailyDates.length,
        daily_dates: dailyDates,
        questionnaires_done: questionnairesDone,
        eligible_d7: day === null ? false : day >= 7,
        eligible_d14: day === null ? false : day >= 14,
      };
    });

    for (const p of participants) {
      if (forbiddenScoreKeys(p)) throw new Error('Ops response leaked score fields.');
    }

    return res.status(200).json({ as_of: asOf, participants });
  } catch {
    return res.status(500).json({ error: 'Failed to load adherence.' });
  }
}

export async function getAdherenceSummary(req, res) {
  const { orgId } = req.params;
  const asOf = req.query.as_of ?? new Date().toISOString().slice(0, 10);

  try {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const [codesProvisioned, activated, dailyRows, qRows] = await Promise.all([
      prisma.accessCode.count({ where: { orgId } }),
      prisma.accessCode.count({ where: { orgId, activatedAt: { not: null }, revoked: false } }),
      prisma.dailyCheckin.findMany({ where: { orgId }, select: { codeHash: true, dateLocal: true } }),
      prisma.questionnaireSubmission.findMany({ where: { orgId }, select: { codeHash: true, timepoint: true } }),
    ]);

    const dailyByCode = new Map();
    for (const row of dailyRows) {
      if (!dailyByCode.has(row.codeHash)) dailyByCode.set(row.codeHash, new Set());
      dailyByCode.get(row.codeHash).add(row.dateLocal.toISOString().slice(0, 10));
    }

    const qByCode = new Map();
    for (const row of qRows) {
      if (!qByCode.has(row.codeHash)) qByCode.set(row.codeHash, new Set());
      qByCode.get(row.codeHash).add(row.timepoint);
    }

    const activatedCodes = await prisma.accessCode.findMany({
      where: { orgId, activatedAt: { not: null }, revoked: false },
      select: { codeHash: true, studyDay0: true },
    });

    let d7Eligible = 0;
    let d7DailyOk = 0;
    let d14Eligible = 0;
    let d14DailyOk = 0;

    for (const code of activatedCodes) {
      const day = studyDay(code.studyDay0, asOf);
      const dailyCount = dailyByCode.get(code.codeHash)?.size ?? 0;
      if (day !== null && day >= 7) {
        d7Eligible += 1;
        if (dailyCount >= 7) d7DailyOk += 1;
      }
      if (day !== null && day >= 14) {
        d14Eligible += 1;
        if (dailyCount >= 14) d14DailyOk += 1;
      }
    }

    const pct = (num, den) => (den === 0 ? null : Math.round((num / den) * 1000) / 10);

    const d0Done = activatedCodes.filter((c) => qByCode.get(c.codeHash)?.has('D0')).length;
    const d7Done = activatedCodes.filter((c) => qByCode.get(c.codeHash)?.has('D7')).length;
    const d14Done = activatedCodes.filter((c) => qByCode.get(c.codeHash)?.has('D14')).length;

    return res.status(200).json({
      as_of: asOf,
      target_n: org.targetN,
      codes_provisioned: codesProvisioned,
      activated,
      adherence_daily_d7_pct: pct(d7DailyOk, d7Eligible),
      adherence_daily_d14_pct: pct(d14DailyOk, d14Eligible),
      questionnaire_d0_pct: pct(d0Done, activated),
      questionnaire_d7_pct: pct(d7Done, activated),
      questionnaire_d14_pct: pct(d14Done, activated),
    });
  } catch {
    return res.status(500).json({ error: 'Failed to load adherence summary.' });
  }
}
