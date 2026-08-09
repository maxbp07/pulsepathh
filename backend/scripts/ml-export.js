/**
 * Export offline para entrenamiento ML (ejecutar en máquina segura con ENCRYPTION_KEY).
 *
 *   node scripts/ml-export.js --org-slug study_mixed_2026 --out ./exports/run-1
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { decryptJson } from '../src/lib/crypto.js';

const prisma = new PrismaClient();
const PROTOCOL_VERSION = 'd0-d7-d14-v1';
const WINDOW_DAYS = 7;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { orgSlug: 'study_mixed_2026', outDir: './exports/ml-run', runId: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--org-slug') out.orgSlug = args[i + 1];
    if (args[i] === '--out') out.outDir = args[i + 1];
    if (args[i] === '--run-id') out.runId = args[i + 1];
  }
  return out;
}

function daysBetween(a, b) {
  const start = new Date(a);
  const end = new Date(b);
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function writeJsonl(path, rows) {
  const content = rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '');
  writeFileSync(path, content, 'utf8');
  return createHash('sha256').update(content).digest('hex');
}

function fileSha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

async function main() {
  const { orgSlug, outDir, runId } = parseArgs();
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) throw new Error(`Org not found: ${orgSlug}`);

  mkdirSync(outDir, { recursive: true });
  const exportRunId = runId ?? `run-${new Date().toISOString().replace(/[:.]/g, '-')}`;

  const codes = await prisma.accessCode.findMany({
    where: { orgId: org.id },
    select: {
      codeHash: true,
      slotLabel: true,
      studyDay0: true,
      activatedAt: true,
    },
  });

  const daily = await prisma.dailyCheckin.findMany({ where: { orgId: org.id } });
  const questionnaires = await prisma.questionnaireSubmission.findMany({ where: { orgId: org.id } });

  const participants = codes.map((c) => ({
    code_hash: c.codeHash,
    slot_label: c.slotLabel,
    study_day0: c.studyDay0?.toISOString().slice(0, 10) ?? null,
    activated_at: c.activatedAt?.toISOString() ?? null,
  }));

  const dailyFeatures = daily.map((row) => {
    const payload = decryptJson(row.payloadEnc);
    const studyDay0 = codes.find((c) => c.codeHash === row.codeHash)?.studyDay0;
    const dateStr = row.dateLocal.toISOString().slice(0, 10);
    return {
      code_hash: row.codeHash,
      date_local: dateStr,
      study_day: studyDay0 ? daysBetween(studyDay0, row.dateLocal) : null,
      kss: payload.kss,
      context: payload.context,
      pvt_summary: {
        trials: payload.pvt?.trials,
        lapses: payload.pvt?.lapses,
        meanRt: payload.pvt?.meanRt,
        lpfs: payload.pvt?.lpfs,
      },
      derived: payload.derived,
    };
  });

  const labels = questionnaires.map((row) => {
    const responses = decryptJson(row.responsesEnc);
    return {
      code_hash: row.codeHash,
      instrument: row.instrument,
      timepoint: row.timepoint,
      taken_at: row.takenAt.toISOString(),
      items: responses.items,
    };
  });

  const windows = [];
  for (const label of labels) {
    const labelDate = label.taken_at.slice(0, 10);
    const codeDaily = dailyFeatures
      .filter((d) => d.code_hash === label.code_hash)
      .filter((d) => d.date_local < labelDate)
      .sort((a, b) => a.date_local.localeCompare(b.date_local))
      .slice(-WINDOW_DAYS);

    windows.push({
      code_hash: label.code_hash,
      instrument: label.instrument,
      timepoint: label.timepoint,
      label_date: labelDate,
      feature_days: codeDaily.map((d) => d.date_local),
      features: codeDaily,
      label_items: label.items,
    });
  }

  const files = {
    participants: join(outDir, 'participants.jsonl'),
    daily_features: join(outDir, 'daily_features.jsonl'),
    labels: join(outDir, 'labels.jsonl'),
    training_windows: join(outDir, 'training_windows.jsonl'),
  };

  const checksums = {
    participants: writeJsonl(files.participants, participants),
    daily_features: writeJsonl(files.daily_features, dailyFeatures),
    labels: writeJsonl(files.labels, labels),
    training_windows: writeJsonl(files.training_windows, windows),
  };

  const manifest = {
    export_run_id: exportRunId,
    generated_at: new Date().toISOString(),
    org_slug: orgSlug,
    protocol_version: org.protocolVersion ?? PROTOCOL_VERSION,
    window_days: WINDOW_DAYS,
    git_sha: process.env.GIT_SHA ?? 'dev',
    counts: {
      participants: participants.length,
      daily_features: dailyFeatures.length,
      labels: labels.length,
      training_windows: windows.length,
      activated_participants: participants.filter((p) => p.activated_at).length,
    },
    checksums_sha256: checksums,
    notes: 'No reversible identifiers exported. code_hash is one-way.',
  };

  const manifestPath = join(outDir, 'export_manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  manifest.manifest_sha256 = fileSha256(manifestPath);

  console.log(`ML export written to ${outDir}`);
  console.log(JSON.stringify(manifest.counts, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
