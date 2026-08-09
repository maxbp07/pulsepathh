import { prisma } from '../lib/prisma.js';


export async function deleteMe(req, res) {
  const { codeHash } = req.anonymous;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sessions = await tx.session.deleteMany({ where: { codeHash } });
      const daily = await tx.dailyCheckin.deleteMany({ where: { codeHash } });
      const questionnaires = await tx.questionnaireSubmission.deleteMany({ where: { codeHash } });
      const push = await tx.pushSubscription.deleteMany({ where: { codeHash } });
      await tx.consent.deleteMany({ where: { codeHash } });
      await tx.accessCode.update({ where: { codeHash }, data: { revoked: true } });
      return {
        deleted_sessions: sessions.count,
        deleted_daily_checkins: daily.count,
        deleted_questionnaires: questionnaires.count,
        deleted_push_subscriptions: push.count,
      };
    });

    return res.status(200).json(result);
  } catch {
    return res.status(500).json({ error: 'Database error.' });
  }
}
