import { Router } from 'express';
import { getVapidPublicKey } from '../lib/push.service.js';

const router = Router();

router.get('/vapid-public-key', (_req, res) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return res.status(503).json({ error: 'Push notifications not configured.' });
  }
  return res.json({ publicKey });
});

export default router;
