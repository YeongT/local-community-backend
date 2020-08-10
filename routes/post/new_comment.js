import { Router } from 'express';
import { getClientIp } from 'request-ip';
import { jwtgetUser } from '../jwtgetUser';
import { db_error } from '../../app';
import moment from 'moment';
import Comment from '../../models/post/comment';
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

    const { userjwt, target, text } =  req.body;
    var { picture } = req.body;
    if (!(userjwt && target && text)) {
        _response.result = 'ERR_DATA_NOT_PROVIDED';
        res.status(412).json(_response);
        return;
    }

    /**
     * CHANGE STRING OBJECT TO ARRAY OBJECT
     */
    try {
        if (picture) picture = JSON.parse(picture);
    }
    catch (err) {
        console.error(err);
        _response.result = 'ERR_DATA_ARRAY_FORMAT_INVALID';
        _response.error = err.toString(); 
        res.status(412).json(_response);
        return;
    }

    /**
     * VERIFY JWT TOKEN && GET USER OBJECT
     */
    const jwtuser = await jwtgetUser(userjwt);
    if (!jwtuser.user) {
        _response.result = jwtuser.error;
        res.status(401).json(_response);
        return;
    }

    /**
     * GENERATE COMMENT OBJECT
     */
    const postComment = new Comment({
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        target,
        content: {
            text,
            picture
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
            category : 'NEW_COMMENT',
            details : postComment.content
        });
        createLog.save((err) => {
            if (err) console.error(err);
        });
    }

    /**
     * SAVE ARTICLE INFO ON DATABASE
     */
    await postComment.save(async (err) => {
        if (err) {
            _response.result = 'ERR_POST_COMMENT_FAILED';
            _response.error = err;
            res.status(500).json(_response);
            return;
        }

        _response.result = 'SUCCEED_COMMENT_POSTED';
        res.status(200).json(_response);
        SAVE_LOG(_response);
    });
});


export default router;