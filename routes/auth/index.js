import { Router } from 'express';
import signup from './signup';

const router = Router();

router.use('/signup',signup);

export default router;