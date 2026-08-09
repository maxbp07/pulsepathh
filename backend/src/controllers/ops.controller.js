import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TIMEPOINTS = ['D0', 'D7', 'D14'];
/** Sin check-in en este umbral (días) → abandono operativo. */
const ABANDON_IDLE_DAYS = 3;
/** Visto en las últimas N horas → participante activo. */
const ACTIVE_HOURS = 48;

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

function ymd(date) {
  return date.toISOString().slice(0, 10);
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
      dailyByCode.get(key).push(ymd(row.dateLocal));
    }

    const qByCode = new Map();
    for (const row of questionnaires) {
      const key = row.codeHash;
      if (!qByCode.has(key)) qByCode.set(key, new Set());
      qByCode.get(key).add(row.timepoint);
    }

    const asOfMs = new Date(asOf + 'T23:59:59.999Z').getTime();
    const activeCutoff = asOfMs - ACTIVE_HOURS * 60 * 60 * 1000;

    const participants = codes.map((code) => {
      const day = studyDay(code.studyDay0, asOf);
      const dailyDates = [...new Set(dailyByCode.get(code.codeHash) ?? [])].sort();
      const done = qByCode.get(code.codeHash) ?? new Set();
      const questionnairesDone = Object.fromEntries(TIMEPOINTS.map((tp) => [tp, done.has(tp)]));
      const lastDaily = dailyDates.length ? dailyDates[dailyDates.length - 1] : null;
      const daysSinceLastDaily =
        lastDaily == null
          ? day
          : Math.floor(
              (new Date(asOf + 'T00:00:00.000Z').getTime() -
                new Date(lastDaily + 'T00:00:00.000Z').getTime()) /
                (24 * 60 * 60 * 1000),
            );
      const lastSeenMs = code.lastSeenAt ? code.lastSeenAt.getTime() : null;
      const active = Boolean(lastSeenMs && lastSeenMs >= activeCutoff);
      const abandoned =
        Boolean(code.activatedAt) &&
        day !== null &&
        day >= ABANDON_IDLE_DAYS &&
        (daysSinceLastDaily === null || daysSinceLastDaily >= ABANDON_IDLE_DAYS);

      return {
        slot_label: code.slotLabel,
        code_hash_prefix: code.codeHash.slice(0, 6),
        activated: Boolean(code.activatedAt),
        study_day: day,
        last_seen_at: code.lastSeenAt?.toISOString() ?? null,
        last_daily_date: lastDaily,
        days_since_last_daily: daysSinceLastDaily,
        active,
        abandoned,
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
      prisma.dailyCheckin.findMany({
        where: { orgId },
        select: { codeHash: true, dateLocal: true },
      }),
      prisma.questionnaireSubmission.findMany({
        where: { orgId },
        select: { codeHash: true, timepoint: true },
      }),
    ]);

    const dailyByCode = new Map();
    const checkinsByDay = {};
    for (const row of dailyRows) {
      const dayKey = ymd(row.dateLocal);
      if (!dailyByCode.has(row.codeHash)) dailyByCode.set(row.codeHash, new Set());
      dailyByCode.get(row.codeHash).add(dayKey);
      checkinsByDay[dayKey] = (checkinsByDay[dayKey] ?? 0) + 1;
    }

    const qByCode = new Map();
    for (const row of qRows) {
      if (!qByCode.has(row.codeHash)) qByCode.set(row.codeHash, new Set());
      qByCode.get(row.codeHash).add(row.timepoint);
    }

    const activatedCodes = await prisma.accessCode.findMany({
      where: { orgId, activatedAt: { not: null }, revoked: false },
      select: { codeHash: true, studyDay0: true, lastSeenAt: true },
    });

    let d7Eligible = 0;
    let d7DailyOk = 0;
    let d14Eligible = 0;
    let d14DailyOk = 0;
    let abandoned = 0;
    let activeParticipants = 0;

    const asOfMs = new Date(asOf + 'T23:59:59.999Z').getTime();
    const activeCutoff = asOfMs - ACTIVE_HOURS * 60 * 60 * 1000;
    const asOfDate = new Date(asOf + 'T00:00:00.000Z');

    for (const code of activatedCodes) {
      const day = studyDay(code.studyDay0, asOf);
      const dates = dailyByCode.get(code.codeHash) ?? new Set();
      const dailyCount = dates.size;
      const lastDaily = dates.size
        ? [...dates].sort().at(-1)
        : null;
      const daysSinceLastDaily =
        lastDaily == null
          ? day
          : Math.floor(
              (asOfDate.getTime() - new Date(lastDaily + 'T00:00:00.000Z').getTime()) /
                (24 * 60 * 60 * 1000),
            );

      if (code.lastSeenAt && code.lastSeenAt.getTime() >= activeCutoff) {
        activeParticipants += 1;
      }

      if (
        day !== null &&
        day >= ABANDON_IDLE_DAYS &&
        (daysSinceLastDaily === null || daysSinceLastDaily >= ABANDON_IDLE_DAYS)
      ) {
        abandoned += 1;
      }

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

    // Adherencia diaria "hoy" (as_of): % de activados con check-in ese día.
    const checkinsOnAsOf = checkinsByDay[asOf] ?? 0;
    const adherenceTodayPct = pct(checkinsOnAsOf, activated);

    const sortedDays = Object.keys(checkinsByDay).sort();
    const checkinsByDaySorted = Object.fromEntries(sortedDays.map((d) => [d, checkinsByDay[d]]));

    return res.status(200).json({
      as_of: asOf,
      target_n: org.targetN,
      codes_provisioned: codesProvisioned,
      activated,
      active_participants: activeParticipants,
      abandoned,
      abandonment_pct: pct(abandoned, activated),
      checkins_today: checkinsOnAsOf,
      adherence_today_pct: adherenceTodayPct,
      checkins_by_day: checkinsByDaySorted,
      adherence_daily_d7_pct: pct(d7DailyOk, d7Eligible),
      adherence_daily_d14_pct: pct(d14DailyOk, d14Eligible),
      d7_eligible: d7Eligible,
      d14_eligible: d14Eligible,
      questionnaire_d0_pct: pct(d0Done, activated),
      questionnaire_d7_pct: pct(d7Done, activated),
      questionnaire_d14_pct: pct(d14Done, activated),
      gates: {
        adherence_d14_min_pct: 60,
        abandon_idle_days: ABANDON_IDLE_DAYS,
        active_window_hours: ACTIVE_HOURS,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to load adherence summary.' });
  }
}
