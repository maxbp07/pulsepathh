/**
 * Provision access codes for the PulsePath study pilot.
 *
 * Canonical format: PP-YYYY-NNN (e.g. PP-2026-001)
 * Canonical org slug: study_mixed_2026
 *
 * Seed 120 codes (default):
 *   node scripts/provision-codes.js
 *   node scripts/provision-codes.js --org-slug study_mixed_2026 --count 120 --prefix PP-2026
 *
 * Output: provision-YYYY-MM-DD.csv with columns slot_label,plain_code
 * Do NOT run against production without an explicit ops decision.
 *
 * First create the org with: node scripts/seed-study.js
 */
import 'dotenv/config';
import { createHash, randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function hashCode(code) {
  return createHash('sha256').update(code.trim().toUpperCase(), 'utf8').digest('hex');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { orgSlug: 'study_mixed_2026', count: 120, prefix: 'PP-2026' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--org-slug') out.orgSlug = args[i + 1];
    if (args[i] === '--count') out.count = Number(args[i + 1]);
    if (args[i] === '--prefix') out.prefix = args[i + 1];
  }
  return out;
}

async function main() {
  const { orgSlug, count, prefix } = parseArgs();
  if (!/^PP-\d{4}$/.test(prefix)) {
    throw new Error(`prefix must match PP-YYYY (got ${prefix}); plain codes are ${prefix}-NNN`);
  }
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) throw new Error(`Organization not found: ${orgSlug}`);

  const existing = await prisma.accessCode.count({ where: { orgId: org.id } });
  const rows = ['slot_label,plain_code'];

  for (let i = 1; i <= count; i += 1) {
    const slot = String(existing + i).padStart(3, '0');
    const plain = `${prefix}-${slot}`;
    const codeHash = hashCode(plain);
    await prisma.accessCode.upsert({
      where: { codeHash },
      create: {
        id: randomUUID(),
        orgId: org.id,
        codeHash,
        slotLabel: `PP-${slot}`,
        revoked: false,
      },
      update: {
        orgId: org.id,
        slotLabel: `PP-${slot}`,
        revoked: false,
      },
    });
    rows.push(`PP-${slot},${plain}`);
  }

  const filename = `provision-${new Date().toISOString().slice(0, 10)}.csv`;
  writeFileSync(filename, rows.join('\n'), 'utf8');
  console.log(`Provisioned ${count} codes for ${orgSlug}. CSV: ${filename}`);
  console.log(`Format: ${prefix}-NNN (e.g. ${prefix}-001). App validates /^PP-\\d{4}-\\d{3}$/.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
