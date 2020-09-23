import { sign as _sign } from "jsonwebtoken";

const getNewSignedJWTPair = async (accessObject, expiresIn) => {
    var _response = { "jwttoken" : null, "signerror" : true };
    try {
        const refreshObject = {
            decodable: false,
            account: accessObject.account
        };
        const signedAccess = _sign(accessObject, process.env.JWT_TOKEN_SECRETKEY, {expiresIn});
        const signedRefresh = _sign(refreshObject, process.env.JWT_TOKEN_SECRETKEY, {expiresIn: "14d"});
        _response.jwttoken = {
            "access": signedAccess,
            "refresh": signedRefresh
        };
        _response.signerror = null;
        return _response;
    } catch (err) {
        _response.signerror = err.toString();
        return _response;
    }
};

const getNewSignedAccessJWTToken = async (accessObject, expiresIn) => {
    var _response = { "jwttoken" : null, "signerror" : true };
    try {
        const signedAccess = _sign(accessObject, process.env.JWT_TOKEN_SECRETKEY, {expiresIn});
        _response.jwttoken = signedAccess;
        _response.signerror = null;
        return _response;
    } catch (err) {
        _response.signerror = err.toString();
        return _response;
    }
};

export { getNewSignedJWTPair, getNewSignedAccessJWTToken };