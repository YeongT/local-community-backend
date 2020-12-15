import { Router } from 'express';
import responseFunction from '../coms/apiResponse';
import { getClientIp } from 'request-ip';
import jwtgetUser from '../jwtauth/jwtgetUser';
import jwtRefresh from '../jwtauth/jwtRefresh';
import { db_error } from '../../app';
import moment from 'moment';
import buildUserlist from '../group/updateUserlist';
import updateGrouplist from '../group/updateGrouplist';
import Community from '../../models/group/community.js';
import groupLog from '../../models/group/grouplog';
import User from '../../models/user';

const router = Router();
router.put('/', async (req, res) => {
    //#CHECK DATABASE STATE AND WHETHER PROVIDED POST DATA IS VALID
    const { target } = req.query;
    if (db_error !== null)
        return await responseFunction(
            res,
            500,
            'ERR_DATABASE_NOT_CONNECTED',
            null
        );
    if (!target)
        return await responseFunction(res, 412, 'ERR_DATA_NOT_PROVIDED', null);

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
        req.headers.authorization
    );
    if (jwterror !== null)
        return await responseFunction(res, 403, jwtbody, null, jwterror);
});

export default router;
