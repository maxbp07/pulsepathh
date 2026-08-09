import { Router } from 'express';
import { requireAnonymousAuth, requireConsentedParticipant } from '../middleware/auth.js';
import { upsertPushSubscription, deletePushSubscription } from '../controllers/push.controller.js';

const router = Router();
router.post('/', requireAnonymousAuth, requireConsentedParticipant, upsertPushSubscription);
router.delete('/', requireAnonymousAuth, requireConsentedParticipant, deletePushSubscription);
export default router;
