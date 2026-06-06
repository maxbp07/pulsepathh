import { Router } from 'express';
import { requireAnonymousAuth } from '../middleware/auth.js';
import { createSession } from '../controllers/session.controller.js';

const router = Router();

router.post('/', requireAnonymousAuth, createSession);

export default router;
