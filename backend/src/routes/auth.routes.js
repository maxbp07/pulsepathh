import { Router } from 'express';
import { loginEmployer, activateAnonymous } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', loginEmployer);
router.post('/anonymous', activateAnonymous);

export default router;
