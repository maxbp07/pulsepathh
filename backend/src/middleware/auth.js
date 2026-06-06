import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

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
