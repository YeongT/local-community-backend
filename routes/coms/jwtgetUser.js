import { decode } from "jsonwebtoken";
import { jwtVerify } from "./jwtToken";
import User from "../../models/user";

const jwtgetUser = async (jwtToken, target) => {
    var _response = {"jwtbody": "ERR_SERVER_FAILED_TEMPORARILY", "jwtuser" : null, "jwterror" : "ERR_JWT_GET_USER_SYNTAX_FAILED"};
    const jwtUserResponse = (body, user, error) => {
        if (!(body && user !== undefined)) throw("ERR_JWT_GET_USER_SYNTAX_FAILED");
        if (!(error === undefined || error === null)) console.error(error);
        _response.jwtbody = body;
        _response.jwtuser = user;
        _response.jwterror = error;
        return _response;
    };

    //#VERIFY JWT TOKEN EFFECTIVENESS
    if (!(jwtToken && jwtVerify (jwtToken, process.env.JWT_TOKEN_SECRET_KEY))) return jwtUserResponse("ERR_JWT_TOKEN_VERIFY_FAILED", null);
    
    //#GET USER OBJECT
    const _decode = await decode(jwtToken) || null;
    if (_decode === null) return jwtUserResponse("ERR_JWT_TOKEN_DECODE_FAILED", null);
    const _user = await User.findOne({"email" : _decode.email});
    if (!_user) return jwtUserResponse("ERR_JWT_GET_USER_OBJECT_FAILED", null, _user);

    //#ADDITIONAL AUTHORIZE PROCESS
    if (target) {
        //SHOULD CHECK USER COULD ACCESS TO TARGET
    }
    return jwtUserResponse("SUCCEED_JWT_TOKEN_LOADED_USER", _user, null);
};

export { jwtgetUser };