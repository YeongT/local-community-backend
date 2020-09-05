import { sign as _sign, verify as _verify } from "jsonwebtoken";

const jwtSign = (object) => {
    var _response = { "token" : null, "tokenerror" : true };
    try {
        const signed = _sign(object.toJSON(), process.env.JWT_TOKE1N_SECRETKEY, {expiresIn: "2h"});
        _response.token = signed;
        _response.tokenerror = null;
        return _response;
    } catch (err) {
        _response.token = null;
        _response.tokenerror = err;
        return _response;
    }
};
  
const jwtVerify = (token, secret) => {
    var _response = { "verified" : null, "tokenerror" : true };
    try {
        const verified = _verify(token, !secret ? process.env.JWT_TOKEN_SECRETKEY : secret);
        _response.verified = verified;
        _response.tokenerror = null;
        return _response;
    } catch (err) {
        _response.token = null;
        _response.tokenerror = err;
        return _response;
    }
};

export { jwtVerify, jwtSign };