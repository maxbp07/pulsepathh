import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/v1/me/delete
 *
 * RGPD right to erasure (Art. 17). Removes all data tied to the authenticated
 * anonymous code_hash:
 *   1) deletes every Session for that code_hash,
 *   2) deletes the associated Consent (if any),
 *   3) revokes the AccessCode (kept, but marked revoked = true) so it cannot be
 *      reused.
 *
 * Requires requireAnonymousAuth (req.anonymous.codeHash).
 * Responds 200 { deleted_sessions: N }, or 500 on any DB failure.
 */
export async function deleteMe(req, res) {
  const { codeHash } = req.anonymous;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { count } = await tx.session.deleteMany({ where: { codeHash } });

      await tx.consent.deleteMany({ where: { codeHash } });

      await tx.accessCode.update({
        where: { codeHash },
        data: { revoked: true },
      });

      return count;
    });

    return res.status(200).json({ deleted_sessions: result });
  } catch {
    return res.status(500).json({ error: 'Database error.' });
  }
}
