import { prisma } from '../lib/prisma.js';
import { encryptJson, hashCanonicalJson } from '../lib/crypto.js';
import { validateQuestionnairePayload, validateTimepointEligibility } from '../lib/validators/studyValidators.js';
import { logIngest, touchAccessCode } from '../lib/ingest.js';


export async function createQuestionnaire(req, res) {
  const validation = validateQuestionnairePayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error, fields: validation.fields });
  }

  const { codeHash, orgId } = req.anonymous;
  const { clientRecordId, instrument, timepoint, takenAt, appVersion, payload } = validation.value;
  const responsesSha256 = hashCanonicalJson(payload);

  try {
    const accessCode = await prisma.accessCode.findUnique({ where: { codeHash } });
    const dateLocal = takenAt.toISOString().slice(0, 10);
    const eligibility = validateTimepointEligibility(timepoint, accessCode?.studyDay0, dateLocal);
    if (!eligibility.ok) {
      return res.status(422).json({
        error: eligibility.error,
        study_day: eligibility.study_day,
        required_day: eligibility.required_day,
      });
    }

    const existing = await prisma.questionnaireSubmission.findUnique({
      where: {
        codeHash_instrument_timepoint: { codeHash, instrument, timepoint },
      },
    });

    if (existing) {
      if (existing.responsesSha256 === responsesSha256) {
        await logIngest({ orgId, codeHash, route: 'checkins/questionnaire', status: 200, clientId: clientRecordId });
        return res.status(200).json({ status: 'duplicate', id: existing.id });
      }
      await logIngest({ orgId, codeHash, route: 'checkins/questionnaire', status: 409, clientId: clientRecordId });
      return res.status(409).json({ error: 'payload_conflict' });
    }

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.questionnaireSubmission.create({
        data: {
          orgId,
          codeHash,
          instrument,
          timepoint,
          takenAt,
          clientRecordId,
          responsesEnc: encryptJson(payload),
          responsesSha256,
          schemaVersion: 'q-v1',
          appVersion,
        },
      });
      await touchAccessCode(tx, codeHash, dateLocal);
      return created;
    });

    await logIngest({ orgId, codeHash, route: 'checkins/questionnaire', status: 201, clientId: clientRecordId });
    return res.status(201).json({ status: 'stored', id: record.id });
  } catch {
    await logIngest({ orgId, codeHash, route: 'checkins/questionnaire', status: 500, clientId: clientRecordId });
    return res.status(500).json({ error: 'Failed to store questionnaire.' });
  }
}
