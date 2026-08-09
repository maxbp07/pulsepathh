/**
 * Seed synthetic dry-run data (3–N participants, D0+7 dailies+D7 labels) via Prisma.
 * Bypasses HTTP rate limits. For ML pipeline smoke tests only — not real humans.
 *
 *   node scripts/seed-synthetic-dry-run.js [--codes PP-2026-010,PP-2026-011,PP-2026-012]
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { encryptJson, hashCanonicalJson } from '../src/lib/crypto.js';

const prisma = new PrismaClient();
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORG_SLUG = 'study_mixed_2026';

function parseCodes() {
  const idx = process.argv.indexOf('--codes');
  const raw =
    idx >= 0
      ? process.argv[idx + 1]
      : process.env.PREFLIGHT_CODES || 'PP-2026-010,PP-2026-011,PP-2026-012';
  return raw
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

function hashCode(code) {
  return createHash('sha256').update(code.trim().toUpperCase(), 'utf8').digest('hex');
}

function dayOffset(base, n) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

function dassItems(stress) {
  const stressIdx = new Set([0, 5, 7, 10, 11, 13, 17]);
  return Array.from({ length: 21 }, (_, i) => ({
    id: `dass_${i + 1}`,
    value: stressIdx.has(i) ? stress : 1,
  }));
}

function gadItems(level) {
  return Array.from({ length: 7 }, (_, i) => ({ id: `gad${i + 1}`, value: level }));
}

function cbiItems(level) {
  const ids = [
    ...Array.from({ length: 6 }, (_, i) => `P${i + 1}`),
    ...Array.from({ length: 7 }, (_, i) => `W${i + 1}`),
    ...Array.from({ length: 6 }, (_, i) => `C${i + 1}`),
  ];
  return ids.map((id) => ({ id, value: level }));
}

async function seedOne(orgId, code, profile, baseDay) {
  const codeHash = hashCode(code);
  const access = await prisma.accessCode.findFirst({
    where: { orgId, codeHash },
  });
  if (!access) throw new Error(`Code not in seed: ${code}`);

  await prisma.accessCode.update({
    where: { id: access.id },
    data: {
      activatedAt: baseDay,
      studyDay0: baseDay,
      lastSeenAt: dayOffset(baseDay, 7),
    },
  });

  for (const [instrument, timepoint, items, dayN] of [
    ['DASS21_FULL', 'D0', dassItems(profile.stressD0), 0],
    ['GAD7', 'D0', gadItems(profile.gadD0), 0],
    ['CBI', 'D0', cbiItems(profile.cbiD0), 0],
    ['DASS21_FULL', 'D7', dassItems(profile.stressD7), 7],
    ['GAD7', 'D7', gadItems(profile.gadD7), 7],
    ['CBI', 'D7', cbiItems(profile.cbiD7), 7],
  ]) {
    const takenAt = dayOffset(baseDay, dayN);
    const payload = { schema: 'q-v1', items };
    await prisma.questionnaireSubmission.upsert({
      where: {
        codeHash_instrument_timepoint: { codeHash, instrument, timepoint },
      },
      create: {
        orgId,
        codeHash,
        instrument,
        timepoint,
        takenAt,
        clientRecordId: `${code}-${instrument}-${timepoint}`,
        responsesEnc: encryptJson(payload),
        responsesSha256: hashCanonicalJson(payload),
        schemaVersion: 'q-v1',
        appVersion: 'synthetic-dry-run',
      },
      update: {
        takenAt,
        responsesEnc: encryptJson(payload),
        responsesSha256: hashCanonicalJson(payload),
      },
    });
  }

  for (let i = 0; i <= 6; i += 1) {
    const d = dayOffset(baseDay, i);
    const payload = {
      schema: 'daily-v1',
      kss: 4 + (i % 3),
      context: { sleepHours: 7 - (i % 2) * 0.5, quality: 3, coffee: false },
      pvt: {
        times: Array.from({ length: 30 }, () => 250 + i * 5),
        falseStarts: 0,
        trials: 30,
        lapses: 1 + (i % 3),
        meanRt: 270 + i * 3,
        lpfs: 0,
      },
      derived: { fri: 35 + i * 2 },
    };
    await prisma.dailyCheckin.upsert({
      where: {
        codeHash_dateLocal: { codeHash, dateLocal: d },
      },
      create: {
        orgId,
        codeHash,
        dateLocal: d,
        tz: 'Europe/Madrid',
        takenAt: d,
        clientRecordId: `${code}-daily-${dateStr(d)}`,
        payloadEnc: encryptJson(payload),
        payloadSha256: hashCanonicalJson(payload),
        appVersion: 'synthetic-dry-run',
      },
      update: {
        payloadEnc: encryptJson(payload),
        payloadSha256: hashCanonicalJson(payload),
        takenAt: d,
      },
    });
  }

  console.log('seeded', code);
}

async function main() {
  const codes = parseCodes();
  if (codes.length < 3) throw new Error('Need ≥3 codes');

  const org = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
  if (!org) throw new Error(`Org missing: ${ORG_SLUG}. Run npm run seed:study first.`);

  const baseDay = new Date();
  baseDay.setUTCHours(0, 0, 0, 0);
  baseDay.setUTCDate(baseDay.getUTCDate() - 7); // so D7 = today

  const profiles = [
    { stressD0: 1, stressD7: 2, gadD0: 0, gadD7: 1, cbiD0: 'SELDOM', cbiD7: 'SOMETIMES' },
    { stressD0: 2, stressD7: 3, gadD0: 1, gadD7: 2, cbiD0: 'SOMETIMES', cbiD7: 'OFTEN' },
    { stressD0: 0, stressD7: 1, gadD0: 0, gadD7: 0, cbiD0: 'NEVER', cbiD7: 'SELDOM' },
    { stressD0: 3, stressD7: 3, gadD0: 2, gadD7: 2, cbiD0: 'OFTEN', cbiD7: 'ALWAYS' },
  ];

  for (let i = 0; i < codes.length; i += 1) {
    await seedOne(org.id, codes[i], profiles[i % profiles.length], baseDay);
  }

  const outDir = join(ROOT, 'backend', 'exports', 'synthetic-dry-run');
  mkdirSync(outDir, { recursive: true });
  const exportRes = spawnSync(
    process.execPath,
    ['scripts/ml-export.js', '--org-slug', ORG_SLUG, '--out', outDir, '--run-id', 'synthetic-dry-run'],
    { cwd: join(ROOT, 'backend'), encoding: 'utf8', env: process.env },
  );
  if (exportRes.status !== 0) {
    console.error(exportRes.stdout, exportRes.stderr);
    throw new Error('ml-export failed');
  }
  console.log(exportRes.stdout);

  for (const instrument of ['GAD7', 'DASS21_FULL', 'CBI']) {
    const train = spawnSync(
      'py',
      [
        '-3',
        join(ROOT, 'ml', 'train_baseline.py'),
        '--export-dir',
        outDir,
        '--instrument',
        instrument,
        '--out',
        join(outDir, `baseline_${instrument}.json`),
      ],
      { encoding: 'utf8', timeout: 180000 },
    );
    console.log('baseline', instrument, train.stdout || train.stderr);
    if (train.status !== 0) {
      throw new Error(`baseline ${instrument} failed`);
    }
  }

  console.log('SYNTHETIC DRY-RUN ML PIPELINE OK');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
