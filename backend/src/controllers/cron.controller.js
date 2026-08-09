/**
 * Cron interno: recordatorios Web Push.
 * Protegido por header Authorization: Bearer <CRON_SECRET>
 * o x-cron-secret: <CRON_SECRET>
 */
import { config } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { sendPushToSubscription, isPushConfigured } from '../lib/push.service.js';
import { logger } from '../lib/logger.js';

function localDateISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function studyDay(studyDay0, asOf) {
  if (!studyDay0) return null;
  const start = new Date(`${studyDay0.toISOString().slice(0, 10)}T00:00:00`);
  const end = new Date(`${asOf}T00:00:00`);
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function requireCronSecret(req, res) {
  if (!config.cronSecret) {
    res.status(503).json({ error: 'CRON_SECRET not configured' });
    return false;
  }
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const header = (req.headers['x-cron-secret'] || '').toString().trim();
  const provided = bearer || header;
  if (!provided || provided !== config.cronSecret) {
    res.status(401).json({ error: 'Unauthorized cron request' });
    return false;
  }
  return true;
}

export async function runPushReminders(req, res) {
  if (!requireCronSecret(req, res)) return;

  const orgSlug = (req.query.orgSlug || req.body?.orgSlug || 'study_mixed_2026').toString();
  const dryRun = String(req.query.dryRun || req.body?.dryRun || '0') === '1';

  if (!isPushConfigured()) {
    return res.json({ ok: true, skipped: true, reason: 'vapid_not_configured' });
  }

  try {
    const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) return res.status(404).json({ error: `Org not found: ${orgSlug}` });

    const today = localDateISO();
    const codes = await prisma.accessCode.findMany({
      where: { orgId: org.id, revoked: false, activatedAt: { not: null } },
      select: { codeHash: true, studyDay0: true },
    });

    const checkinsToday = await prisma.dailyCheckin.findMany({
      where: { orgId: org.id, dateLocal: new Date(`${today}T00:00:00.000Z`) },
      select: { codeHash: true },
    });
    const checkedIn = new Set(checkinsToday.map((c) => c.codeHash));
    const subs = await prisma.pushSubscription.findMany({ where: { orgId: org.id } });

    let sent = 0;
    let skipped = 0;

    for (const sub of subs) {
      const code = codes.find((c) => c.codeHash === sub.codeHash);
      if (!code) {
        skipped += 1;
        continue;
      }

      let payload;
      if (!checkedIn.has(sub.codeHash)) {
        payload = {
          title: 'PulsePath',
          body: 'Tu check-in diario te espera (~2 min).',
          tag: 'pulsepath-daily',
          url: '/',
        };
      } else {
        const day = studyDay(code.studyDay0, today);
        const tp = day !== null && day >= 14 ? 'D14' : day !== null && day >= 7 ? 'D7' : 'D0';
        const questionnaires = await prisma.questionnaireSubmission.findMany({
          where: { orgId: org.id, codeHash: sub.codeHash, timepoint: tp },
          select: { instrument: true },
        });
        const done = new Set(questionnaires.map((q) => q.instrument));
        const pending = ['DASS21_FULL', 'GAD7', 'CBI'].filter((i) => !done.has(i));
        if (pending.length === 0) {
          skipped += 1;
          continue;
        }
        payload = {
          title: 'PulsePath — evaluación pendiente',
          body: `Completa tus cuestionarios (${tp}). Pendiente: ${pending.join(', ')}.`,
          tag: `pulsepath-${tp}`,
          url: '/study',
        };
      }

      if (dryRun) {
        sent += 1;
        continue;
      }

      const result = await sendPushToSubscription(sub, payload);
      if (result.ok) sent += 1;
      else skipped += 1;
    }

    logger.info('cron_push_reminders', { orgSlug, sent, skipped, dryRun });
    return res.json({ ok: true, orgSlug, sent, skipped, dryRun });
  } catch (err) {
    logger.error('cron_push_reminders_failed', { message: err?.message });
    return res.status(500).json({ error: err?.message || 'cron failed' });
  }
}
