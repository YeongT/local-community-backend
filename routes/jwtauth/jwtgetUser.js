import jwtVerify from "./jwtVerify";
import { getClientIp } from "request-ip";
import User from "../../models/user";
import authLog from "../../models/authlog";
import jwtVerifyAccess from "./jwtVerifyAccess";
import moment from "moment";

const jwtgetUser = async (req, jwtToken, options) => {
    var _response = {"jwtbody": "ERR_SERVER_FAILED_TEMPORARILY", "jwtuser" : null, "jwterror" : "ERR_JWT_GET_USER_SYNTAX_FAILED"};
    const jwtUserResponse = (body, user, error) => {
        if (!(body && user !== undefined)) throw("ERR_JWT_GET_USER_SYNTAX_FAILED");
        _response.jwtbody = body; 
        _response.jwtuser = user;
        _response.jwterror = error;
        return _response;
    };

    //#VERIFY ACCESS TOKEN && HANDLE BLOCKED USER DEPENDING ON OPTIONS VARIABLE
    const { jwtdecode, tokenerror } = await jwtVerify(jwtToken);
    if (tokenerror !== null) return jwtUserResponse("ERR_JWT_AUTHENTICATION_FAILED", null, tokenerror);
    if (jwtdecode.decodable) return jwtUserResponse("ERR_JWT_AUTHENTICATION_FAILED", null, "JWT_REFRESH_TOKEN_ACCESS_DENIED");

    //#SAVE LOG FUNCTION
    const SAVE_LOG = async (_response) => {
        const createLog = new authLog ({
            timestamp : moment().format("YYYY-MM-DD HH:mm:ss"), 
            causedby : jwtdecode.account.email,
            originip : getClientIp(req),
            category : "JWTLOGIN",
            details : jwtToken,
            result : _response,
        });
        await createLog.save(async (err) => {
            if (err) console.error(err);
        });
        return _response;
    };

    //#GET USER OBJECT FROM DATABASE EXCEPT AUTH FIELD
    const _user = await User.findOne({"account.email" : _response.jwtdecode.account.email, "account.status": { $ne : "rejected"}}, {"auth":0});
    if (_user === null || _user === undefined) return jwtUserResponse("ERR_JWT_AUTHENTIFCATION_FAILED", null, "JWT_USER_ACCOUNT_NOT_ACCESSIBLE");
    if (!_user) return jwtUserResponse("ERR_JWT_AUTHENTIFCATION_FAILED", null, _user);
    
    //#VALIDATE USER COMMUNITY PRIVILEGE WHEN OPTIONS WERE PROVIDED
    if (!(options === undefined || options === null)) {
        const { permissions , verify_error } = await jwtVerifyAccess(jwtdecode.account._id ,options.type, options.target);
        if(verify_error !== null) return await SAVE_LOG(jwtUserResponse("ERR_JWT_AUTHENTICATION_FAILED", null, verify_error));
        _user.permissions = permissions;
    } 
    return await SAVE_LOG(jwtUserResponse("SUCCEED_JWT_AUTH_GRANTED", _user, null));
};

export default jwtgetUser;
