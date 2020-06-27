import { Router } from 'express';

import auth from './auth';
import list from './list';

const router = Router();

router.use('/auth',auth);
router.use('/list',list);

router.get('/', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<title>Local Community API Server</title>');
    res.write('<link rel="icon" href="https://hakbong.me/common/icon.png">');
    res.end('Welcome!<br>This is API Server of Hakbong');
});

export default router;