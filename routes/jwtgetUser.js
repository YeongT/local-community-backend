import { decode } from "jsonwebtoken";
import { jwtVerify } from "./jwtToken";
import User from "../models/user";

const jwtgetUser = async (jwtToken) => {
    var _response = { "error" : "ERR_SERVER_FAILED_TEMPORARILY" };

    /**
     * VERIFY JWT TOKEN EFFECTIVENESS
     */
    if (!(jwtToken && jwtVerify (jwtToken, process.env.JWT_TOKEN_SECRET_KEY))) {
        _response.error = "ERR_JWT_TOKEN_VERIFY_FAILED";
        return _response;
    }

    /**
     * GET USER OBJECT
     */
    const _decode = decode(jwtToken);
    if (!_decode) {
        _response.error = "ERR_JWT_TOKEN_DECODE_FAILED";
        return _response;
    }

    const user = await User.findOne({"email" : _decode.email});
    if (!user) {
        _response.error = "ERR_JWT_RESULT_GET_USER_FAILED";
        return _response;
    }
    _response.user = user;
    _response.error = null;
    return _response;
};

export default jwtgetUser;