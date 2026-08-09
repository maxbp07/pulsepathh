import { config } from '../config/env.js';

export function requireAdminSecret(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!config.adminSecret) {
    return res.status(503).json({ error: 'Admin API not configured.' });
  }
  if (!secret || secret !== config.adminSecret) {
    return res.status(401).json({ error: 'Invalid admin secret.' });
  }
  next();
}
