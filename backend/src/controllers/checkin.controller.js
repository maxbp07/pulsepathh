import { PrismaClient } from '@prisma/client';
import { encryptJson, hashCanonicalJson } from '../lib/crypto.js';
import { validateDailyPayload } from '../lib/validators/studyValidators.js';
import { logIngest, touchAccessCode } from '../lib/ingest.js';

const prisma = new PrismaClient();

export async function createDailyCheckin(req, res) {
  const validation = validateDailyPayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error, fields: validation.fields });
  }

  const { codeHash, orgId } = req.anonymous;
  const { clientRecordId, dateLocal, tz, takenAt, appVersion, payload } = validation.value;
  const payloadSha256 = hashCanonicalJson(payload);
  const dateLocalDate = new Date(dateLocal + 'T00:00:00.000Z');

  try {
    const existingByDate = await prisma.dailyCheckin.findUnique({
      where: { codeHash_dateLocal: { codeHash, dateLocal: dateLocalDate } },
    });

    if (existingByDate) {
      if (existingByDate.payloadSha256 === payloadSha256) {
        await logIngest({ orgId, codeHash, route: 'checkins/daily', status: 200, clientId: clientRecordId });
        return res.status(200).json({ status: 'duplicate', id: existingByDate.id });
      }
      await logIngest({ orgId, codeHash, route: 'checkins/daily', status: 409, clientId: clientRecordId });
      return res.status(409).json({ error: 'payload_conflict' });
    }

    const existingByClient = await prisma.dailyCheckin.findUnique({
      where: { codeHash_clientRecordId: { codeHash, clientRecordId } },
    });

    if (existingByClient) {
      if (existingByClient.payloadSha256 === payloadSha256) {
        await logIngest({ orgId, codeHash, route: 'checkins/daily', status: 200, clientId: clientRecordId });
        return res.status(200).json({ status: 'duplicate', id: existingByClient.id });
      }
      await logIngest({ orgId, codeHash, route: 'checkins/daily', status: 409, clientId: clientRecordId });
      return res.status(409).json({ error: 'payload_conflict' });
    }

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.dailyCheckin.create({
        data: {
          orgId,
          codeHash,
          dateLocal: dateLocalDate,
          tz,
          takenAt,
          clientRecordId,
          payloadEnc: encryptJson(payload),
          payloadSha256,
          appVersion,
        },
      });
      await touchAccessCode(tx, codeHash, dateLocal);
      return created;
    });

    await logIngest({ orgId, codeHash, route: 'checkins/daily', status: 201, clientId: clientRecordId });
    return res.status(201).json({ status: 'stored', id: record.id });
  } catch {
    await logIngest({ orgId, codeHash, route: 'checkins/daily', status: 500, clientId: clientRecordId });
    return res.status(500).json({ error: 'Failed to store daily checkin.' });
  }
}
