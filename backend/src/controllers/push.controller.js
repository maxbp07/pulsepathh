import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function upsertPushSubscription(req, res) {
  const { endpoint, keys, timezone } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'endpoint and keys.p256dh/auth are required.' });
  }

  const { codeHash, orgId } = req.anonymous;

  try {
    const record = await prisma.pushSubscription.upsert({
      where: { codeHash_endpoint: { codeHash, endpoint } },
      create: {
        orgId,
        codeHash,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        timezone: timezone ?? null,
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        timezone: timezone ?? null,
      },
    });
    return res.status(200).json({ status: 'stored', id: record.id });
  } catch {
    return res.status(500).json({ error: 'Failed to store push subscription.' });
  }
}

export async function deletePushSubscription(req, res) {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint is required.' });

  const { codeHash } = req.anonymous;
  try {
    await prisma.pushSubscription.deleteMany({ where: { codeHash, endpoint } });
    return res.status(200).json({ status: 'deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete push subscription.' });
  }
}
