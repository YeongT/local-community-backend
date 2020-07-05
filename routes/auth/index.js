import { Router } from 'express';
import signup from './signup';
import active from './active';

const router = Router();

router.use('/signup',signup);
router.use('/active',active);

export default router;