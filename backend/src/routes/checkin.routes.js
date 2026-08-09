import { Router } from 'express';
import { requireAnonymousAuth } from '../middleware/auth.js';
import { createDailyCheckin } from '../controllers/checkin.controller.js';

const router = Router();
router.post('/daily', requireAnonymousAuth, createDailyCheckin);
export default router;
