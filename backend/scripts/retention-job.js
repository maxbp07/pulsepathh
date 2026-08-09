import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runRetentionJob() {
  const now = new Date();
  const expiredOrgs = await prisma.organization.findMany({
    where: { retentionUntil: { lt: now } },
    select: { id: true, slug: true },
  });

  if (expiredOrgs.length === 0) {
    console.log('Retention job: 0 rows deleted (no organizations past retention_until).');
    return;
  }

  const orgIds = expiredOrgs.map((org) => org.id);
  const codeHashes = (await prisma.accessCode.findMany({
    where: { orgId: { in: orgIds } },
    select: { codeHash: true },
  })).map((c) => c.codeHash);

  const [sessions, daily, questionnaires, audit, consents, pushSubs, codes] = await prisma.$transaction([
    prisma.session.deleteMany({ where: { orgId: { in: orgIds } } }),
    prisma.dailyCheckin.deleteMany({ where: { orgId: { in: orgIds } } }),
    prisma.questionnaireSubmission.deleteMany({ where: { orgId: { in: orgIds } } }),
    prisma.ingestAuditLog.deleteMany({ where: { orgId: { in: orgIds } } }),
    prisma.consent.deleteMany({ where: { codeHash: { in: codeHashes } } }),
    prisma.pushSubscription.deleteMany({ where: { orgId: { in: orgIds } } }),
    prisma.accessCode.updateMany({ where: { orgId: { in: orgIds } }, data: { revoked: true } }),
  ]);

  const slugs = expiredOrgs.map((org) => org.slug).join(', ');
  console.log(`Retention job: sessions=${sessions.count}, daily=${daily.count}, questionnaires=${questionnaires.count}, audit=${audit.count}, consents=${consents.count}, push=${pushSubs.count}, codes_revoked=${codes.count} for ${expiredOrgs.length} org(s) (${slugs}).`);
}

runRetentionJob()
  .catch((err) => {
    console.error('Retention job failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
