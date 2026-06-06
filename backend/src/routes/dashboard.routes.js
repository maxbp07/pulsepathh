import { Router } from 'express';
import { requireEmployerAuth } from '../middleware/auth.js';
import { getDashboard, exportDashboardCsv } from '../controllers/dashboard.controller.js';
import { generateReport } from '../reports/report.controller.js';

const router = Router();

router.get('/:orgId', requireEmployerAuth, getDashboard);
router.get('/:orgId/export.csv', requireEmployerAuth, exportDashboardCsv);
router.get('/:orgId/report.pdf', requireEmployerAuth, generateReport);

export default router;
