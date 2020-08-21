import { sign as _sign, verify as _verify } from "jsonwebtoken";

const jwtSign = (object) => {
    try {
        const signed = _sign(object.toJSON(), process.env.JWT_TOKEN_SECRETKEY, {expiresIn: "2h"});
        return signed;
    } catch (err) {
        return false;
    }
};
  
const jwtVerify = (token, secret) => {
    try {
        const verified = _verify(token, !secret ? process.env.JWT_TOKEN_SECRETKEY : secret);
        return verified;
    } catch (err) {
        return false;
    }
};

export { jwtVerify, jwtSign };