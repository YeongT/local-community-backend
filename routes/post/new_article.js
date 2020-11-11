import { Router } from 'express';
import { getClientIp } from 'request-ip';
import jwtgetUser from '../jwtauth/jwtgetUser';
import jwtRefresh from '../jwtauth/jwtRefresh';
import { db_error } from '../../app';
import responseFunction from '../coms/apiResponse';
import mongoose from 'mongoose';
import moment from 'moment';
import Article from '../../models/post/article';
import postLog from '../../models/post/postlog';

const router = Router();
router.put('/', async (req, res) => {
    //#CHECK DATABASE STATE AND WHETHER PROVIDED POST DATA IS VALID
    const { title, text } = req.body;
    var { target, tags, picture, link } = req.body;
    if (db_error !== null)
        return await responseFunction(
            res,
            500,
            'ERR_DATABASE_NOT_CONNECTED',
            null
        );
    if (!(target && title && text && tags))
        return await responseFunction(res, 412, 'ERR_DATA_NOT_PROVIDED', null);

    //#CHANGE STRING OBJECT TO ARRAY OBJECT
    try {
        target = mongoose.Types.ObjectId(target);
        tags = await JSON.parse(tags);
        if (picture) picture = await JSON.parse(picture);
        if (link) link = await JSON.parse(link);
    } catch (err) {
        if (
            err.toString() ===
            'Error: Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
        )
            return await responseFunction(
                res,
                412,
                'ERR_TARGET_FORMAT_INVALID',
                null,
                err
            );
        return await responseFunction(
            res,
            412,
            'ERR_DATA_ARRAY_FORMAT_INVALID',
            null,
            err
        );
    }

    //#REFRESH ACCESS TOKEN USING REFRESH TOKEN WHEN REFRESH TOKEN PROVIDED
    if (req.headers.refreshToken) {
        const { newtoken, tokenerror } = await jwtRefresh(
            req,
            req.headers.authorization,
            req.headers.refreshToken
        );
        if (tokenerror !== null)
            return await responseFunction(
                res,
                403,
                'ERR_JWT_AUTHENTIFCATION_FAILED',
                null,
                tokenerror
            );
        else req.headers.authorization = newtoken;
    }

    //#VALIDATE WHERE USER JWT TOKEN IS VALID AND ACCPETABLE TO TARGET
    const { jwtuser, jwtbody, jwterror } = await jwtgetUser(
        req,
        req.headers.authorization,
        { type: 'community', target }
    );
    if (jwterror !== null)
        return await responseFunction(res, 403, jwtbody, null, jwterror);

    //#GENERATE ARTICLE OBJECT
    const postArticle = new Article({
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        target: {
            community: target,
        },
        content: {
            title,
            text,
            tags,
            attach: {
                picture,
                link,
            },
        },
        owner: jwtuser._id,
    });

    //#SAVE LOG FUNCTION
    const SAVE_LOG = async (_response) => {
        const createLog = new postLog({
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
            causeby: jwtuser.email,
            originip: getClientIp(req),
            category: 'NEW_ARTICLE',
            details: postArticle.content,
            result: _response,
        });
        await createLog.save(async (err) => {
            if (err) console.error(err);
        });
    };

    //#SAVE ARTICLE INFO ON DATABASE
    await postArticle.save(async (save_error) => {
        if (save_error)
            return await responseFunction(
                res,
                500,
                'ERR_POST_NEW_ARTICLE_FAIELD',
                null,
                save_error
            );
        return await SAVE_LOG(
            await responseFunction(res, 200, 'SUCCEED_NEW_ARTICLE_POSTED')
        );
    });
});

export default router;
