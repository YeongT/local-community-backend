import { Router } from "express";
import { getClientIp } from "request-ip";
import { db_error } from "../../app";
import moment from "moment";
import responseFunction from "../coms/apiResponse";
import loadRegex from "../coms/loadRegex";
import authLog from "../../models/authlog";
import Token from "../../models/token";
import User from "../../models/user";

const router = Router();
router.get ("/", async (req,res) => {
    //#CHECK DATABASE AND WHETHER PROVIDED POST DATA IS VALID
    if (db_error !== null) return await responseFunction(res, 500, "ERR_DATABASE_NOT_CONNECTED");
    
    const { emailchk } = await loadRegex();
    const { email, token } = req.query;
    if (!(email && token)) return await responseFunction(res, 412, "ERR_DATA_NOT_PROVIDED");
    if (!(emailchk.test(email))) return await responseFunction(res, 412, "ERR_DATA_FORMAT_INVALID");

    //#FIND USER ON DATABASE USING EMAIL
    const _user = await User.findOne({"account.email" : email, "account.status" : "unknown"});
    if (_user === null || _user === undefined) return await responseFunction(res, 409, "ERR_USER_NOT_FOUND");

    //#CHECK WHETHER TOKEN IS VALID
    const _token = await Token.findOne({"owner" : email, "type" : "SIGNUP" , "token" : token });
    if (!_token) return await responseFunction(res, 409, "ERR_PROVIDED_TOKEN_INVALID");
    else if (Date.parse(_token.expired) < moment()) return await responseFunction(res, 409, "ERR_PROVIDED_TOKEN_INVALID");
    
    //#SAVE LOG FUNCTION
    const SAVE_LOG = async (_response) => {
        const createLog = new authLog ({
            timestamp : moment().format("YYYY-MM-DD HH:mm:ss"), 
            causedby : email,
            originip : getClientIp(req),
            category : "ACTIVATE",
            details : _token,
            result : _response
        });
        await createLog.save(async (err) => {
            if (err) console.error(err);
        });
    };  

    //#CHANGE USER ENABLE STATE
    const _verify = await User.updateOne({"account.email" : email , "account.status" : "unknown" }, {"enable" : "verified"});
    if (!_verify) return await SAVE_LOG(await responseFunction(res, 500, "ERR_USER_UPDATE_FAILED", null, _verify));
    
    //#ALL TASK FINISHED, DELETE TOKENS AND SHOW OUTPUT
    await Token.deleteOne({"owner" : email, "type" : "SIGNUP", "token" : token});
    return await SAVE_LOG(await responseFunction(res, 200, "SUCCEED_USER_ACTIVATED"));

    //handle HTML File

});


export default router;