import { Router } from 'express';
import { getClientIp } from 'request-ip';
import { jwtgetUser } from '../jwtgetUser';
import { db_error } from '../../app';
import Article from '../../models/post/article';
import postLog from '../../models/post/postlog';

const router = Router();
router.post ('/', async (req,res) => {
    var _response = { "result" : "ERR_SERVER_FAILED_TEMPORARILY" };

    /**
     * CHECK DATABASE
     */
    if (!(db_error == null)) {
        _response.result = 'ERR_DATABASE_NOT_CONNECTED';
        res.status(500).json(_response);
        return;
    }

    const { userjwt, target, title, text } = req.body;
    var { tags, picture, link } = req.body;
    if (!(userjwt && target && title && text && tags)) {
        _response.result = 'ERR_DATA_NOT_PROVIDED';
        res.status(412).json(_response);
        return;
    }

    /**
     * CHANGE STRING OBJECT TO ARRAY OBJECT
     */
    try {
        tags = JSON.parse(tags);
        if (picture) picture = JSON.parse(picture);
        if (link) link = JSON.parse(link);
    }
    catch (error) {
        console.error(error);
        _response.result = 'ERR_DATA_ARRAY_FORMAT_INVALID';
        res.status(412).json(_response);
        return;
    }

    /**
     * VERIFY JWT TOKEN && GET USER OBJECT
     */
    const jwtuser = await jwtgetUser(userjwt);
    if (!jwtuser.user) {
        _response.result = jwtuser.error;
        res.status(409).json(_response);
        return;
    }
    
    /**
     * GENERATE ARTICLE OBJECT
     */
    require('moment-timezone');
    const moment = require('moment');
    moment.tz.setDefault("Asia/Seoul");
    const postArticle = new Article({
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        target,
        content: {
            title,
            text,
            tags,
            attach: {
                picture,
                link
            }
        },
        owner: jwtuser.user._id
    });

    /**
     * SAVE LOG FUNCTION
     */
    const SAVE_LOG = (_response) => {
        const createLog = new postLog ({
            timestamp : moment().format('YYYY-MM-DD HH:mm:ss'), 
            causeby : jwtuser.user.email,
            originip : getClientIp(req),
            category : 'NEW_ARTICLE',
            details : postArticle.content
        });
        createLog.save((err) => {
            if (err) console.error(err);
        });
    }

    /**
     * SAVE ARTICLE INFO ON DATABASE
     */
    await postArticle.save(async (err) => {
        if (err) {
            _response.result = 'ERR_POST_ARTICLE_FAILED';
            _response.error = err;
            res.status(500).json(_response);
            return;
        }

        _response.result = 'SUCCEED_ARTICLE_POSTED';
        res.status(200).json(_response);
        SAVE_LOG(_response);
    });
});


export default router;