import { Router } from 'express';
import { requireAnonymousAuth } from '../middleware/auth.js';
import { upsertPushSubscription, deletePushSubscription } from '../controllers/push.controller.js';

const router = Router();
router.post('/', requireAnonymousAuth, upsertPushSubscription);
router.delete('/', requireAnonymousAuth, deletePushSubscription);
export default router;
