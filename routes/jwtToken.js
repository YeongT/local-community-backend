import { sign as _sign, verify as _verify } from "jsonwebtoken";

const jwtSign = (object) => {
    var _response = { "jwttoken" : null, "tokenerror" : true };
    try {
        const signed = _sign(object.toJSON(), process.env.JWT_TOKEN_SECRETKEY, {expiresIn: "2h"});
        _response.jwttoken = signed;
        _response.tokenerror = null;
        return _response;
    } catch (err) {
        _response.tokenerror = err.toString();
        return _response;
    }
};
  
const jwtVerify = (token, secret) => {
    var _response = { "verified" : null, "tokenerror" : true };
    try {
        _response.verified = _verify(token, !secret ? process.env.JWT_TOKEN_SECRETKEY : secret);
        _response.tokenerror = null;
        return _response;
    } catch (err) {
        _response.tokenerror = err.toString();
        return _response;
    }
};

export { jwtVerify, jwtSign };