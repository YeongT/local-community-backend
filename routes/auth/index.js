import { Router } from 'express';
import signup from './signup';
import login from './login';
import active from './active';

const router = Router();

router.use('/signup', signup);
router.use('/active', active);
router.use('/login', login);

export default router;
