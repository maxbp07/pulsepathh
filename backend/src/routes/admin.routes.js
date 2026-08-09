import { Router } from 'express';
import { requireAdminSecret } from '../middleware/adminAuth.js';
import { provisionCodes, getCodeStats } from '../controllers/admin.controller.js';

const router = Router();
router.post('/codes', requireAdminSecret, provisionCodes);
router.get('/codes/:orgId/stats', requireAdminSecret, getCodeStats);
export default router;
