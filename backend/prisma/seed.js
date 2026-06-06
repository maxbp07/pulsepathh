import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ORG = {
  name: 'Ayuntamiento de Barcelona',
  slug: 'ayuntamiento_bcn',
  pilotRef: '2026_OVT_694068',
  retentionUntil: new Date('2027-12-31'),
};

const EMPLOYER_USER = {
  email: 'rrhh@bcn.cat',
  password: 'demo1234',
  role: 'admin',
};

const BCRYPT_ROUNDS = 10;
const ACCESS_CODE_COUNT = 50;

function hashCode(code) {
  return createHash('sha256').update(code, 'utf8').digest('hex');
}

function buildAccessCode(index) {
  return `BCN-2026-A${String(index).padStart(3, '0')}`;
}

function accessCodeMeta(index) {
  if (index <= 25) {
    return { department: 'atencion_ciudadana', shift: 'morning' };
  }
  return { department: 'informatica', shift: 'afternoon' };
}

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: ORG.slug },
    create: {
      name: ORG.name,
      slug: ORG.slug,
      pilotRef: ORG.pilotRef,
      retentionUntil: ORG.retentionUntil,
    },
    update: {
      name: ORG.name,
      pilotRef: ORG.pilotRef,
      retentionUntil: ORG.retentionUntil,
    },
  });

  let accessCodesCreated = 0;
  let accessCodesUpdated = 0;

  for (let i = 1; i <= ACCESS_CODE_COUNT; i += 1) {
    const plainCode = buildAccessCode(i);
    const codeHash = hashCode(plainCode);
    const { department, shift } = accessCodeMeta(i);

    const existing = await prisma.accessCode.findUnique({
      where: { codeHash },
      select: { id: true },
    });

    await prisma.accessCode.upsert({
      where: { codeHash },
      create: {
        orgId: organization.id,
        codeHash,
        department,
        shift,
        activatedAt: null,
        revoked: false,
      },
      update: {
        orgId: organization.id,
        department,
        shift,
        revoked: false,
      },
    });

    if (existing) {
      accessCodesUpdated += 1;
    } else {
      accessCodesCreated += 1;
    }
  }

  const passwordHash = await bcrypt.hash(EMPLOYER_USER.password, BCRYPT_ROUNDS);

  const employerUser = await prisma.employerUser.upsert({
    where: { email: EMPLOYER_USER.email },
    create: {
      orgId: organization.id,
      email: EMPLOYER_USER.email,
      passwordHash,
      role: EMPLOYER_USER.role,
    },
    update: {
      orgId: organization.id,
      passwordHash,
      role: EMPLOYER_USER.role,
    },
  });

  const totalAccessCodes = await prisma.accessCode.count({
    where: { orgId: organization.id },
  });

  console.log('--- PulsePath seed (piloto Barcelona) ---');
  console.log(`Organización: ${organization.name} (${organization.slug})`);
  console.log(`  id: ${organization.id}`);
  console.log(`  pilot_ref: ${organization.pilotRef}`);
  console.log(`  retention_until: ${organization.retentionUntil.toISOString().slice(0, 10)}`);
  console.log(`Access codes: ${totalAccessCodes} total (${accessCodesCreated} nuevos, ${accessCodesUpdated} actualizados)`);
  console.log('  A001–A025 → atencion_ciudadana / morning');
  console.log('  A026–A050 → informatica / afternoon');
  console.log(`Employer user: ${employerUser.email} (role: ${employerUser.role})`);
  console.log('Seed completado.');
}

main()
  .catch((error) => {
    console.error('Error en seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
