import { createHash, randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';


function hashCode(code) {
  return createHash('sha256').update(code.trim().toUpperCase(), 'utf8').digest('hex');
}

export async function provisionCodes(req, res) {
  const { org_slug, count = 120, prefix = 'PP-2026' } = req.body;
  if (!org_slug) return res.status(400).json({ error: 'org_slug is required.' });
  if (!Number.isInteger(count) || count < 1 || count > 500) {
    return res.status(400).json({ error: 'count must be an integer 1-500.' });
  }

  try {
    const org = await prisma.organization.findUnique({ where: { slug: org_slug } });
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const existing = await prisma.accessCode.count({ where: { orgId: org.id } });
    const codes = [];

    for (let i = 1; i <= count; i += 1) {
      const slot = String(existing + i).padStart(3, '0');
      const plain = `${prefix}-${slot}`;
      const codeHash = hashCode(plain);
      await prisma.accessCode.upsert({
        where: { codeHash },
        create: {
          id: randomUUID(),
          orgId: org.id,
          codeHash,
          slotLabel: `PP-${slot}`,
          revoked: false,
        },
        update: {
          orgId: org.id,
          slotLabel: `PP-${slot}`,
          revoked: false,
        },
      });
      codes.push(plain);
    }

    return res.status(201).json({
      codes,
      count: codes.length,
      org_slug,
      retention_until: org.retentionUntil.toISOString().slice(0, 10),
      warning: 'Plaintext codes are returned once. Store them in the external WhatsApp sheet only.',
    });
  } catch {
    return res.status(500).json({ error: 'Failed to provision codes.' });
  }
}

export async function getCodeStats(req, res) {
  const { orgId } = req.params;
  try {
    const [total, activated, revoked] = await Promise.all([
      prisma.accessCode.count({ where: { orgId } }),
      prisma.accessCode.count({ where: { orgId, activatedAt: { not: null }, revoked: false } }),
      prisma.accessCode.count({ where: { orgId, revoked: true } }),
    ]);
    return res.status(200).json({ total, activated, revoked });
  } catch {
    return res.status(500).json({ error: 'Failed to load code stats.' });
  }
}
