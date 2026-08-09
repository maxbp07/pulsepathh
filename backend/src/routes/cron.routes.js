import { Router } from 'express';
import { runPushReminders } from '../controllers/cron.controller.js';

const router = Router();
router.get('/push-reminders', runPushReminders);
router.post('/push-reminders', runPushReminders);
export default router;
