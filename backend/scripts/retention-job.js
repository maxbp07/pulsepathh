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
    console.log('Retention job: 0 sessions deleted (no organizations past retention_until).');
    return;
  }

  const orgIds = expiredOrgs.map((org) => org.id);

  const { count } = await prisma.session.deleteMany({
    where: { orgId: { in: orgIds } },
  });

  const slugs = expiredOrgs.map((org) => org.slug).join(', ');
  console.log(
    `Retention job: ${count} session(s) deleted for ${expiredOrgs.length} organization(s) past retention_until (${slugs}).`,
  );
}

runRetentionJob()
  .catch((err) => {
    console.error('Retention job failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
