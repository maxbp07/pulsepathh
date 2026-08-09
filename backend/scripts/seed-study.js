import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ORG = {
  name: 'PulsePath Mixed Study 2026',
  slug: 'study_mixed_2026',
  kind: 'study',
  pilotRef: 'ML_STUDY_100',
  studyStartsAt: new Date('2026-07-20'),
  studyEndsAt: new Date('2026-08-03'),
  retentionUntil: new Date('2027-02-03'),
  targetN: 100,
  codePoolSize: 120,
  protocolVersion: 'd0-d7-d14-v1',
};

const CODE_COUNT = 120;
const PREFIX = 'PP-2026';

function hashCode(code) {
  return createHash('sha256').update(code.trim().toUpperCase(), 'utf8').digest('hex');
}

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: ORG.slug },
    create: {
      name: ORG.name,
      slug: ORG.slug,
      pilotRef: ORG.pilotRef,
      kind: ORG.kind,
      studyStartsAt: ORG.studyStartsAt,
      studyEndsAt: ORG.studyEndsAt,
      retentionUntil: ORG.retentionUntil,
      targetN: ORG.targetN,
      codePoolSize: ORG.codePoolSize,
      protocolVersion: ORG.protocolVersion,
    },
    update: {
      name: ORG.name,
      pilotRef: ORG.pilotRef,
      kind: ORG.kind,
      studyStartsAt: ORG.studyStartsAt,
      studyEndsAt: ORG.studyEndsAt,
      retentionUntil: ORG.retentionUntil,
      targetN: ORG.targetN,
      codePoolSize: ORG.codePoolSize,
      protocolVersion: ORG.protocolVersion,
    },
  });

  const plainCodes = [];
  for (let i = 1; i <= CODE_COUNT; i += 1) {
    const slot = String(i).padStart(3, '0');
    const plain = `${PREFIX}-${slot}`;
    const codeHash = hashCode(plain);
    await prisma.accessCode.upsert({
      where: { codeHash },
      create: {
        orgId: organization.id,
        codeHash,
        slotLabel: `PP-${slot}`,
        revoked: false,
      },
      update: {
        orgId: organization.id,
        slotLabel: `PP-${slot}`,
        revoked: false,
      },
    });
    plainCodes.push(plain);
  }

  console.log('--- PulsePath study seed ---');
  console.log(`Organización: ${organization.name} (${organization.slug})`);
  console.log(`  id: ${organization.id}`);
  console.log(`  retention_until: ${organization.retentionUntil.toISOString().slice(0, 10)}`);
  console.log(`Access codes: ${CODE_COUNT}`);
  console.log('Primeros 5 códigos (guardar en hoja externa, no en servidor):');
  plainCodes.slice(0, 5).forEach((c) => console.log(`  ${c}`));

  const passwordHash = await bcrypt.hash('studyops2026', 10);
  const employerUser = await prisma.employerUser.upsert({
    where: { email: 'ops@study.pulsepath.local' },
    create: {
      orgId: organization.id,
      email: 'ops@study.pulsepath.local',
      passwordHash,
      role: 'admin',
    },
    update: { orgId: organization.id, passwordHash, role: 'admin' },
  });
  console.log(`Employer ops: ${employerUser.email} / studyops2026`);
  console.log('Seed estudio completado.');
}

main()
  .catch((error) => {
    console.error('Error en seed estudio:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
