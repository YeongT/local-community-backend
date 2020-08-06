import { Router } from 'express';

const router = Router();

import new_article from './new_article';

router.use('/new_article', new_article);

export default router;
