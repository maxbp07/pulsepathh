import { Router } from 'express';
import { requireAnonymousAuth } from '../middleware/auth.js';
import { deleteMe } from '../controllers/me.controller.js';

const router = Router();

router.post('/delete', requireAnonymousAuth, deleteMe);

export default router;
