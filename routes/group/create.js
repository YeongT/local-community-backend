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
    const { groupname, groupimage, description, areaString } = req.body;
    var { tags } = req.body;
    if (db_error !== null)
        return await responseFunction(
            res,
            500,
            'ERR_DATABASE_NOT_CONNECTED',
            null
        );
    if (!(groupname && description && areaString && tags))
        return await responseFunction(res, 412, 'ERR_DATA_NOT_PROVIDED', null);

    //#CHANGE STRING OBJECT TO ARRAY OBJECT
    try {
        tags = await JSON.parse(tags);
    } catch (err) {
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
        req.headers.authorization
    );
    if (jwterror !== null)
        return await responseFunction(res, 403, jwtbody, null, jwterror);

    //#SAVE LOG FUNCTION
    const SAVE_LOG = async (_response, details) => {
        const createLog = new groupLog({
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
            causedby: jwtuser.account.email,
            originip: getClientIp(req),
            category: 'NEW_COMMUNITY',
            details,
            result: _response,
        });
        await createLog.save(async (err) => {
            if (err) console.error(err);
        });
    };

    const createCommunity = new Community({
        info: {
            created: moment().format('YYYY-MM-DD HH:mm:ss'),
            name: groupname,
            description,
            areaString,
            picture: groupimage,
            tags,
        },
    });

    //#GENERATE MEMBER OBJECT IN COMMUNITY AND PUBLISH NEW PREVILEGE
    const {
        privileges,
        userlist,
        listerror,
    } = await buildUserlist(createCommunity._id, null, jwtuser._id, [
        'owner',
        'admin',
        'member',
    ]);
    if (listerror !== null)
        return await SAVE_LOG(
            await responseFunction(
                res,
                500,
                'ERR_COMMUNITY_CREATE_FAILED',
                null,
                listerror
            )
        );
    createCommunity.userlist = userlist;

    //#UPDATE USER COMMUNITY LIST USING PREVIOUS QUERY
    const _update = await updateGrouplist(
        jwtuser._id,
        createCommunity._id,
        privileges
    );
    if (_update !== null)
        return await SAVE_LOG(
            await responseFunction(
                res,
                500,
                'ERR_COMMUNITY_UPDATE_FAILED',
                null,
                _update
            )
        );

    //#SAVE USER ACCOUNT TO DATABASE
    const _result = await createCommunity.save();
    if (!_result) {
        //#RESTORE USER COMMUNITY LIST FROM DATABASE USING JWTGETUSER RESULT
        await User.UpdateOne(
            { 'account.email': jwtuser.account.email },
            { 'service.community': jwtuser.service.community }
        );
        return await SAVE_LOG(
            await responseFunction(
                res,
                500,
                'ERR_COMMUNITY_UPDATE_FAILED',
                null,
                _result
            ),
            createCommunity
        );
    }
    return await SAVE_LOG(
        await responseFunction(
            res,
            200,
            'SUCCEED_COMMUNITY_CREATED',
            { community: createCommunity._id },
            null
        ),
        createCommunity
    );
});

export default router;
