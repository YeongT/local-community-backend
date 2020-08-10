import { Router } from 'express';
import { getClientIp } from 'request-ip';
import { jwtgetUser } from '../jwtgetUser';
import { db_error } from '../../app';
import { genEditLog } from '../../models/post/recordlog'
import mongoose from 'mongoose';
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

    const { userjwt, title, text } = req.body;
    var { target, tags, picture, link } = req.body;
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
    catch (err) {
        console.error(err);
        _response.result = 'ERR_DATA_ARRAY_FORMAT_INVALID';
        _response.error = err.toString();
        res.status(412).json(_response);
        return;
    }

    /**
     * VERIFY JWT TOKEN && GET ARTICLE OBJECT
     */
    const jwtuser = await jwtgetUser(userjwt);
    if (!jwtuser.user) {
        _response.result = jwtuser.error;
        res.status(401).json(_response);
        return;
    }

    try {
        target = mongoose.Types.ObjectId(target);
    }
    catch (err) {
        console.error(err);
        _response.result = 'ERR_TARGET_ID_FORMAT_INVALID';
        _response.error = err.toString();
        res.status(412).json(_response);
        return;
    }
   
    const _article = await Article.findOne({
        "_id": target,
        "owner": jwtuser.user._id,
        "visible": true,
        "suecount": {
            "$lte": 5
        }
    });
    if (!_article) {
        _response.result = 'ERR_LOADING_TARGET_ARTICLE_FAILED';
        res.status(409).json(_response);
        return;
    }

    /**
     * SAVE LOG FUNCTION
     */
    require('moment-timezone');
    const moment = require('moment');
    moment.tz.setDefault("Asia/Seoul");
    const SAVE_LOG = (_response) => {
        const createLog = new postLog ({
            timestamp : moment().format('YYYY-MM-DD HH:mm:ss'), 
            causeby : jwtuser.user.email,
            originip : getClientIp(req),
            category : 'MOD_ARTICLE',
            details : _article.content
        });
        createLog.save((err) => {
            if (err) console.error(err);
        });
    }

    /**
     * UPDATE ARTICLE OBJECT USING PREVIOUS OBJECT
     */
    _article.modify.ismodified = true;
    _article.modify.history.unshift(genEditLog(_article.content));
    _article.content = {
        title,
        text,
        tags,
        attach : {
            picture,
            link
        }
    }

    /**
     * SAVE ARTICLE INFO ON DATABASE
     */
    await Article.updateOne({
        "_id": target
    }, {
        "modify": _article.modify,
        "content": _article.content,
        "timestamp" : moment().format('YYYY-MM-DD HH:mm:ss')
    }, async (err) => {
        if (err) {
            _response.result = 'ERR_EDIT_ARTICLE_FAILED';
            _response.error = err;
            res.status(500).json(_response);
            return;
        }

        _response.result = 'SUCCEED_ARTICLE_EDITED';
        res.status(200).json(_response);
        SAVE_LOG(_response);
    });
});


export default router;