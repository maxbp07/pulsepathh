import { Router } from 'express';
import { requireAnonymousAuth, requireConsentedParticipant } from '../middleware/auth.js';
import { createQuestionnaire } from '../controllers/questionnaire.controller.js';

const router = Router();
router.post('/', requireAnonymousAuth, requireConsentedParticipant, createQuestionnaire);
export default router;
