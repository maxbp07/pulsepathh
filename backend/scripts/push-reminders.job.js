/**
 * Recordatorios Web Push — check-in diario y cuestionarios D0/D7/D14.
 *
 *   node scripts/push-reminders.job.js --org-slug study_mixed_2026
 *   node scripts/push-reminders.job.js --dry-run
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { sendPushToSubscription, isPushConfigured } from '../src/lib/push.service.js';

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { orgSlug: 'study_mixed_2026', dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--org-slug') out.orgSlug = args[i + 1];
    if (args[i] === '--dry-run') out.dryRun = true;
  }
  return out;
}

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

async function main() {
  const { orgSlug, dryRun } = parseArgs();
  if (!isPushConfigured()) {
    console.log('Push reminders skipped: VAPID not configured.');
    return;
  }

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) throw new Error(`Org not found: ${orgSlug}`);

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
      console.log(`[dry-run] ${sub.codeHash.slice(0, 8)}… → ${payload.body}`);
      sent += 1;
      continue;
    }

    const result = await sendPushToSubscription(sub, payload);
    if (result.ok) sent += 1;
    else skipped += 1;
  }

  console.log(`Push reminders: sent=${sent}, skipped=${skipped}, dryRun=${dryRun}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
