import { Router } from 'express';
import { requireAnonymousAuth } from '../middleware/auth.js';
import { createQuestionnaire } from '../controllers/questionnaire.controller.js';

const router = Router();
router.post('/', requireAnonymousAuth, createQuestionnaire);
export default router;
