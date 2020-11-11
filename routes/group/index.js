import { Router } from 'express';
import create from './create';

const router = Router();
router.use('/create', create);

export default router;
