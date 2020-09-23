import jwtVerify from "./jwtVerify";
import { getClientIp } from "request-ip";
import User from "../../models/user";
import authLog from "../../models/authlog";
import moment from "moment";

const jwtVerifyAccess = async (type, target, objectID) => {
    if (type && target && objectID) {
        
        return null;
    }
    return "ERR_JWT_VERIFY_USER_SYNTAX_FAILED";
};

const jwtgetUser = async (req, jwtToken, options) => {
    var _response = {"jwtbody": "ERR_SERVER_FAILED_TEMPORARILY", "jwtuser" : null, "jwterror" : "ERR_JWT_GET_USER_SYNTAX_FAILED"};
    const jwtUserResponse = (body, user, error) => {
        if (!(body && user !== undefined)) throw("ERR_JWT_GET_USER_SYNTAX_FAILED");
        _response.jwtbody = body;
        _response.jwtuser = user;
        _response.jwterror = error;
        return _response;
    };

    //#VERIFY ACCESS TOKEN IS VALID
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

    //#HANDLE THIS NODE MORE WHEN OPTIONS ARE EXIST
    if (!(objectID === undefined || objectID === null)) {
        const verify_error = await jwtVerifyAccess(options.type, options.target, options.objectID);
        if(verify_error !== null) return await SAVE_LOG(jwtUserResponse("ERR_JWT_AUTHENTICATION_FAILED", null, verify_error));
    } 
    return await SAVE_LOG(jwtUserResponse("SUCCEED_JWT_AUTH_GRANTED", jwtdecode, null));
};

export { jwtgetUser };