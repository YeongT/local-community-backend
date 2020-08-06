import { Router } from 'express';

const router = Router();

import auth from './auth';
import list from './list';
import post from './post';

router.use('/auth',auth);
router.use('/list',list);
router.use('/post',post);

const swaggerDefinition = require('./swagger.json');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const options = {
    swaggerDefinition,
    apis: ['./auth/index.js', './list/index.js', './index.js']
};
const swaggerSpec = swaggerJSDoc(options);

router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
router.get('/', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<title>Local Community API Server</title>');
    res.write('<link rel="icon" href="https://hakbong.me/common/icon.png">');
    res.write('Welcome!<br>This is API Server of Hakbong<br><br>')
    res.end('API Document is <a href="https://api.hakbong.me/docs">HERE</a> ');
});

export default router;