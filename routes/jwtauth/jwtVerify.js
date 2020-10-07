import { verify as _verify } from "jsonwebtoken";
import jwtBlock from "../../models/jwtblock";
import User from "../../models/user";
  
const jwtVerify = async (token, ignoreblock) => {
    var _response = { "jwtdecode" : null, "tokenerror" : true };
    try {
        //#CHECK WHETHER JWTTOKEN IS NOT EXIST IN BLACKLIST
        if (ignoreblock) {
            const _isblock = await jwtBlock.findOne({"blocktoken": token});
            if (_isblock) {
                _response.tokenerror = "JWT_TOKEN_ACCESS_BLOCKED";
                return _response;
            }
        }
        _response.jwtdecode = _verify(token, process.env.JWT_TOKEN_SECRETKEY);
        _response.tokenerror = null;

        //#CHECK WHETHERE JWTTOKEN OWNER IS NOT REJECTED
        const _user = await User.findOne({"account.email" : _response.jwtdecode.account.email, "account.status": { $ne : "rejected"}}, {"auth":0, "profile":0,"service":0});
        if (_user === null || _user === undefined) _response.tokenerror = "JWT_USER_ACCOUNT_NOT_ACCESSABLE";
        if (!_user) _response.tokenerror = _user;
    } catch (err) {
        _response.tokenerror = err.toString();
    }
    return _response;
};

export default jwtVerify;