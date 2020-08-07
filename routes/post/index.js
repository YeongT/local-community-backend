import { Router } from 'express';

const router = Router();

import new_article from './new_article';

/**
 * RESTFUL API DOES NOT USE UNDERLINE IN URL
 */
router.use('/new-article', new_article);

export default router;
