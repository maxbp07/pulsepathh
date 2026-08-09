/**
 * Local preflight: activate PP-2026-001, D0 instruments, 7 daily check-ins,
 * D7 instruments → export + baseline smoke.
 *
 *   node scripts/preflight-study-flow.js
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.PREFLIGHT_API || 'http://localhost:3000/api/v1';
const ORG = 'study_mixed_2026';
/** Comma-separated codes. Need ≥3 activated for LOPO baseline. */
const CODES = (process.env.PREFLIGHT_CODES || 'PP-2026-002,PP-2026-003,PP-2026-004')
  .split(',')
  .map((c) => c.trim().toUpperCase())
  .filter(Boolean);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  // Soft retry on rate limit (preflight floods sessionLimiter)
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (!res.ok) {
      throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
    }
    return json;
  }
  throw new Error(`${method} ${path} → rate limited after retries`);
}

function sha256(s) {
  return createHash('sha256').update(String(s).trim().toUpperCase(), 'utf8').digest('hex');
}

function isoDay(offset) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function dassItems(stress = 2) {
  const stressIdx = new Set([0, 5, 7, 10, 11, 13, 17]);
  return Array.from({ length: 21 }, (_, i) => ({
    id: `dass_${i + 1}`,
    value: stressIdx.has(i) ? stress : 1,
  }));
}

function gadItems(level = 1) {
  return Array.from({ length: 7 }, (_, i) => ({ id: `gad${i + 1}`, value: level }));
}

function cbiItems(level = 'SOMETIMES') {
  const ids = [
    ...Array.from({ length: 6 }, (_, i) => `P${i + 1}`),
    ...Array.from({ length: 7 }, (_, i) => `W${i + 1}`),
    ...Array.from({ length: 6 }, (_, i) => `C${i + 1}`),
  ];
  return ids.map((id) => ({ id, value: level }));
}

async function postQuestionnaire(token, instrument, timepoint, items, dayOffset = 0) {
  const day = isoDay(dayOffset);
  return req(
    'POST',
    '/checkins/questionnaire',
    {
      client_record_id: `${instrument}-${timepoint}-${day}`,
      instrument,
      timepoint,
      timestamp: `${day}T12:00:00.000Z`,
      items,
      app_version: 'preflight-1.0.0',
    },
    token,
  );
}

async function postDaily(token, dayOffset, kss) {
  const day = isoDay(dayOffset);
  return req(
    'POST',
    '/checkins/daily',
    {
      client_record_id: `daily-${day}`,
      date_local: day,
      tz: 'Europe/Madrid',
      timestamp: `${day}T08:30:00.000Z`,
      kss,
      context: { sleepHours: 7, quality: 3, coffee: false },
      pvt: {
        times: Array.from({ length: 30 }, () => 250 + Math.round(Math.random() * 80)),
        falseStarts: 0,
        trials: 30,
        lapses: 2,
        meanRt: 280,
        lpfs: 0,
      },
      derived: { fri: 40 + kss },
      app_version: 'preflight-1.0.0',
    },
    token,
  );
}

async function runParticipant(code, stressD0, stressD7, gadD0, gadD7, cbiD0, cbiD7) {
  const auth = await req('POST', '/auth/anonymous', {
    org_slug: ORG,
    code_hash: sha256(code),
    consent: true,
    policy_version: '2026-07-17',
  });
  const token = auth.token;
  console.log('activated', code);

  for (const [inst, items] of [
    ['DASS21_FULL', dassItems(stressD0)],
    ['GAD7', gadItems(gadD0)],
    ['CBI', cbiItems(cbiD0)],
  ]) {
    const r = await postQuestionnaire(token, inst, 'D0', items, 0);
    console.log(code, 'D0', inst, r.status);
  }

  for (let i = 0; i <= 6; i += 1) {
    const r = await postDaily(token, i, 4 + (i % 3));
    console.log(code, 'daily', isoDay(i), r.status);
  }

  for (const [inst, items] of [
    ['DASS21_FULL', dassItems(stressD7)],
    ['GAD7', gadItems(gadD7)],
    ['CBI', cbiItems(cbiD7)],
  ]) {
    const r = await postQuestionnaire(token, inst, 'D7', items, 7);
    console.log(code, 'D7', inst, r.status);
  }
}

async function main() {
  const health = await fetch(BASE.replace('/api/v1', '/health'));
  if (!health.ok) throw new Error('health failed');
  console.log('health OK', await health.json());

  if (CODES.length < 3) throw new Error('Need ≥3 PREFLIGHT_CODES for LOPO');

  const profiles = [
    { stressD0: 1, stressD7: 2, gadD0: 0, gadD7: 1, cbiD0: 'SELDOM', cbiD7: 'SOMETIMES' },
    { stressD0: 2, stressD7: 3, gadD0: 1, gadD7: 2, cbiD0: 'SOMETIMES', cbiD7: 'OFTEN' },
    { stressD0: 0, stressD7: 1, gadD0: 0, gadD7: 0, cbiD0: 'NEVER', cbiD7: 'SELDOM' },
    { stressD0: 3, stressD7: 3, gadD0: 2, gadD7: 2, cbiD0: 'OFTEN', cbiD7: 'ALWAYS' },
  ];

  for (let i = 0; i < CODES.length; i += 1) {
    const p = profiles[i % profiles.length];
    await runParticipant(
      CODES[i],
      p.stressD0,
      p.stressD7,
      p.gadD0,
      p.gadD7,
      p.cbiD0,
      p.cbiD7,
    );
  }

  const outDir = join(ROOT, 'backend', 'exports', 'preflight-local');
  mkdirSync(outDir, { recursive: true });
  const exportRes = spawnSync(
    process.execPath,
    ['scripts/ml-export.js', '--org-slug', ORG, '--out', outDir],
    { cwd: join(ROOT, 'backend'), encoding: 'utf8', env: process.env },
  );
  if (exportRes.status !== 0) {
    console.error(exportRes.stdout, exportRes.stderr);
    throw new Error('ml-export failed');
  }
  console.log(exportRes.stdout);

  const pythonCandidates = [
    process.env.PYTHON,
    'py',
  ].filter(Boolean);

  for (const instrument of ['GAD7', 'DASS21_FULL', 'CBI']) {
    let ok = false;
    let lastErr = '';
    for (const py of pythonCandidates) {
      const args =
        py === 'py'
          ? ['-3', join(ROOT, 'ml', 'train_baseline.py'), '--export-dir', outDir, '--instrument', instrument, '--out', join(outDir, `baseline_${instrument}.json`)]
          : [join(ROOT, 'ml', 'train_baseline.py'), '--export-dir', outDir, '--instrument', instrument, '--out', join(outDir, `baseline_${instrument}.json`)];
      const train = spawnSync(py, args, { encoding: 'utf8', timeout: 120000 });
      if (train.status === 0) {
        console.log('baseline', instrument, train.stdout);
        ok = true;
        break;
      }
      lastErr = train.stderr || train.stdout || `status ${train.status}`;
    }
    if (!ok) throw new Error(`baseline ${instrument} failed: ${lastErr}`);
  }

  console.log('PREFLIGHT OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
