import { verify as _verify } from 'jsonwebtoken';
import moment from 'moment';
import { getClientIp } from 'request-ip';
import jwtVerify from './jwtVerify';
import jwtBlock from './jwtBlock';
import { getNewSignedAccessJWTToken as jwtSign } from './jwtSign';
import authLog from '../../models/authlog';
import User from '../../models/user';

const jwtRefresh = async (req, accesstoken, refreshtoken) => {
    var _response = {
        newtoken: null,
        tokenerror: { refresherror: true, errordetail: true },
    };

    //#CHECK PARAMETERS ARE NOT UNDEFINED
    if (req && accesstoken && refreshtoken) return _response;

    //#CHECK WHETHER REFRESH TOKEN IS VALID
    const _refreshtoken = await jwtVerify(refreshtoken);
    if (_refreshtoken.tokenerror !== null) {
        _response.tokenerror.refresherror = 'JWT_REFRESH_TOKEN_INVALID';
        _response.tokenerror.errordetail = _refreshtoken.tokenerror;
        return _response;
    }

    //#BLOCK PREVIOUS JWT ACCESS TOKEN
    const { blockerror } = await jwtBlock(accesstoken);
    if (blockerror !== null) {
        _response.tokenerror.refresherror = 'JWT_ACCESS_TOKEN_BLOCK';
        _response.tokenerror.errordetail = blockerror;
        return _response;
    }

    //#REGENERATE ACCESS TOKEN WITH REFRESHTOKEN
    const _user = User.findOne(
        {
            'account.email': _refreshtoken.jwtdecode.account.email,
            'account.status': { $ne: 'rejected' },
        },
        { auth: 0, _id: 0 }
    );
    if (_user === null || _user === undefined || !_user) {
        _response.tokenerror.refresherror = 'JWT_USER_ACCOUNT_NOT_ACCESSIBLE';
        _response.tokenerror.errordetail = _user || null;
        return _response;
    }

    //#SAVE LOG FUNCTION
    const SAVE_LOG = async (_response) => {
        const createLog = new authLog({
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
            causedby: _user.account.email,
            originip: getClientIp(req),
            category: 'JWTREFRESH',
            details: {
                accesstoken: accesstoken,
                refreshtoken: refreshtoken,
            },
            response: _response,
        });
        await createLog.save(async (err) => {
            if (err) console.error(err);
        });
        return _response;
    };

    //#GENERATE JWT TOKEN AND WRITE ON DOCUMENT
    const { jwttoken, signerror } = await jwtSign(_user.toJSON(), '5d');
    if (signerror !== null) {
        _response.tokenerror.refresherror = 'ERR_JWT_TOKEN_GENERATE_FAILED';
        _response.tokenerror.errordetail = signerror;
        return await SAVE_LOG(_response);
    }
    _refreshtoken.newtoken = jwttoken;
    _refreshtoken.tokenerror = null;
    return await SAVE_LOG(_response);
};

export default jwtRefresh;
