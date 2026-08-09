import { Router } from 'express';
import { requireAdminSecret } from '../middleware/adminAuth.js';
import { getAdherence, getAdherenceSummary } from '../controllers/ops.controller.js';

const router = Router();
router.get('/:orgId/adherence', requireAdminSecret, getAdherence);
router.get('/:orgId/adherence/summary', requireAdminSecret, getAdherenceSummary);
export default router;
