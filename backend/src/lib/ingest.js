import { prisma } from './prisma.js';


export async function logIngest({ orgId, codeHash, route, status, clientId }) {
  try {
    await prisma.ingestAuditLog.create({
      data: { orgId, codeHash: codeHash ?? null, route, status, clientId: clientId ?? null },
    });
  } catch {
    /* audit failure must not block ingest */
  }
}

export async function touchAccessCode(tx, codeHash, dateLocal) {
  const now = new Date();
  const accessCode = await tx.accessCode.findUnique({ where: { codeHash } });
  if (!accessCode) return;

  const updates = { lastSeenAt: now };
  if (!accessCode.activatedAt) updates.activatedAt = now;
  if (!accessCode.studyDay0) {
    updates.studyDay0 = new Date(dateLocal + 'T00:00:00.000Z');
  }

  await tx.accessCode.update({ where: { codeHash }, data: updates });
}
