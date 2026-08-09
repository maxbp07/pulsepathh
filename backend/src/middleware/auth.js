import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';

const prisma = new PrismaClient();

export function requireEmployerAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.type !== 'employer') {
      return res.status(401).json({ error: 'Invalid token type.' });
    }
    req.employer = {
      userId: payload.userId,
      orgId: payload.orgId,
      role: payload.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function requireAnonymousAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.type !== 'anonymous') {
      return res.status(401).json({ error: 'Invalid token type.' });
    }
    req.anonymous = {
      codeHash: payload.codeHash,
      orgId: payload.orgId,
      department: payload.department,
      shift: payload.shift,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * After JWT auth: block study data writes without a stored consent row
 * or when the access code has been revoked (e.g. after /me/delete).
 */
export async function requireConsentedParticipant(req, res, next) {
  const codeHash = req.anonymous?.codeHash;
  if (!codeHash) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  try {
    const accessCode = await prisma.accessCode.findUnique({
      where: { codeHash },
      include: { consent: true },
    });
    if (!accessCode || accessCode.revoked) {
      return res.status(403).json({ error: 'Access code revoked.' });
    }
    if (!accessCode.consent) {
      return res.status(403).json({ error: 'Consent required before submitting study data.' });
    }
    req.anonymous.policyVersion = accessCode.consent.policyVersion;
    next();
  } catch {
    return res.status(500).json({ error: 'Database error.' });
  }
}

