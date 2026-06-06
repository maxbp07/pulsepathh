import { PrismaClient } from '@prisma/client';
import { encryptNumber } from '../lib/crypto.js';

const prisma = new PrismaClient();

const ALLOWED_FIELDS = new Set([
  'timestamp',
  'risk_index',
  'pvt_index',
  'stroop_index',
  'cbi_score',
  'sleep_hours',
]);

function isInRange(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export async function createSession(req, res) {
  const body = req.body;

  // Reject any field not in the whitelist
  const extraFields = Object.keys(body).filter((k) => !ALLOWED_FIELDS.has(k));
  if (extraFields.length > 0) {
    return res.status(400).json({
      error: 'Request contains disallowed fields.',
      fields: extraFields,
    });
  }

  const { timestamp, risk_index, pvt_index, stroop_index, cbi_score, sleep_hours } = body;

  // Required fields must be present
  if (
    timestamp === undefined ||
    risk_index === undefined ||
    pvt_index === undefined ||
    stroop_index === undefined ||
    sleep_hours === undefined
  ) {
    return res.status(400).json({ error: 'Missing required fields: timestamp, risk_index, pvt_index, stroop_index, sleep_hours.' });
  }

  // Validate timestamp
  const takenAt = new Date(timestamp);
  if (isNaN(takenAt.getTime())) {
    return res.status(400).json({ error: 'Invalid timestamp: must be a valid ISO 8601 date string.' });
  }

  // Validate numeric ranges
  if (!isInRange(risk_index, 0, 100)) {
    return res.status(400).json({ error: 'risk_index must be a number between 0 and 100.' });
  }
  if (!isInRange(pvt_index, 0, 100)) {
    return res.status(400).json({ error: 'pvt_index must be a number between 0 and 100.' });
  }
  if (!isInRange(stroop_index, 0, 100)) {
    return res.status(400).json({ error: 'stroop_index must be a number between 0 and 100.' });
  }
  if (!isInRange(sleep_hours, 0, 24)) {
    return res.status(400).json({ error: 'sleep_hours must be a number between 0 and 24.' });
  }

  // cbi_score is optional but must be valid if provided
  if (cbi_score !== undefined && !isInRange(cbi_score, 0, 100)) {
    return res.status(400).json({ error: 'cbi_score must be a number between 0 and 100.' });
  }

  const { codeHash, orgId, department, shift } = req.anonymous;

  try {
    await prisma.session.create({
      data: {
        orgId,
        codeHash,
        department,
        shift: shift ?? null,
        takenAt,
        riskIndexEnc: encryptNumber(risk_index),
        pvtIndexEnc: encryptNumber(pvt_index),
        stroopIndexEnc: encryptNumber(stroop_index),
        cbiScoreEnc: cbi_score !== undefined ? encryptNumber(cbi_score) : null,
        sleepHoursEnc: encryptNumber(sleep_hours),
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to store session.' });
  }

  return res.status(201).json({ status: 'stored' });
}
