import { Router } from 'express';

const router = Router();

import new_article from './new_article';
import new_comment from './new_comment';

/**
 * RESTFUL API DOES NOT USE UNDERLINE IN URL
 */
router.use('/new-article', new_article);
router.use('/new-comment', new_comment);

export default router;
