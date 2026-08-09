import { Router } from 'express';
import { requireAnonymousAuth, requireConsentedParticipant } from '../middleware/auth.js';
import { createSession } from '../controllers/session.controller.js';

const router = Router();

router.post('/', requireAnonymousAuth, requireConsentedParticipant, createSession);

export default router;
