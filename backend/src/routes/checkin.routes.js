import { Router } from 'express';
import { requireAnonymousAuth, requireConsentedParticipant } from '../middleware/auth.js';
import { createDailyCheckin } from '../controllers/checkin.controller.js';

const router = Router();
router.post('/daily', requireAnonymousAuth, requireConsentedParticipant, createDailyCheckin);
export default router;
