import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';

const prisma = new PrismaClient();

export async function loginEmployer(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  let user;
  try {
    user = await prisma.employerUser.findUnique({ where: { email } });
  } catch {
    return res.status(500).json({ error: 'Database error.' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { type: 'employer', userId: user.id, orgId: user.orgId, role: user.role },
    config.jwtSecret,
    { expiresIn: '8h' }
  );

  return res.status(200).json({ token, org_id: user.orgId, role: user.role });
}

export async function activateAnonymous(req, res) {
  const { org_slug, code_hash, consent, policy_version } = req.body;

  if (!org_slug || !code_hash || !policy_version) {
    return res.status(400).json({ error: 'org_slug, code_hash and policy_version are required.' });
  }

  if (consent !== true) {
    return res.status(400).json({ error: 'consent must be true to activate.' });
  }

  let org;
  try {
    org = await prisma.organization.findUnique({ where: { slug: org_slug } });
  } catch {
    return res.status(500).json({ error: 'Database error.' });
  }

  if (!org) {
    return res.status(404).json({ error: 'Organization not found.' });
  }

  let accessCode;
  try {
    accessCode = await prisma.accessCode.findUnique({ where: { codeHash: code_hash } });
  } catch {
    return res.status(500).json({ error: 'Database error.' });
  }

  if (!accessCode || accessCode.orgId !== org.id) {
    return res.status(404).json({ error: 'Access code not found.' });
  }

  if (accessCode.revoked) {
    return res.status(409).json({ error: 'Access code has been revoked.' });
  }

  try {
    await prisma.consent.upsert({
      where: { codeHash: code_hash },
      update: { consentedAt: new Date(), policyVersion: policy_version },
      create: { codeHash: code_hash, consentedAt: new Date(), policyVersion: policy_version },
    });

    if (!accessCode.activatedAt) {
      await prisma.accessCode.update({
        where: { codeHash: code_hash },
        data: { activatedAt: new Date() },
      });
    }
  } catch {
    return res.status(500).json({ error: 'Database error.' });
  }

  const token = jwt.sign(
    {
      type: 'anonymous',
      codeHash: code_hash,
      orgId: org.id,
      department: accessCode.department,
      shift: accessCode.shift,
    },
    config.jwtSecret,
    { expiresIn: '30d' }
  );

  return res.status(200).json({
    token,
    department: accessCode.department,
    shift: accessCode.shift,
  });
}
