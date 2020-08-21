import { Router } from "express";
import { getClientIp } from "request-ip";
import { db_error } from "../../app";
import moment from "moment";
import authLog from "../../models/authlog";
import Token from "../../models/token";
import User from "../../models/user";

const router = Router();
router.get ("/", async (req,res) => {
    var _response = { "result" : "ERR_SERVER_FAILED_TEMPORARILY" };

    /**
     * CHECK DATABASE STATE
     */
    if (!(db_error === null)) {
        _response.result = "ERR_DATABASE_NOT_CONNECTED";
        res.status(500).json(_response);
        return;
    }

    /**
     * CHECK WHETHER PROVIDED POST DATA IS VALID
     */
    const { email, token} = req.query;
    const email_chk = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
    if (!(email && email_chk.test(email) && token)) {
        _response.result = "ERR_DATA_FORMAT_INVALID";
        res.status(412).json(_response);
        return;
    }

    /**
     * FIND USER ON DATABASE USING EMAIL
     */
    const user = await User.findOne({"email" : email, "enable" : false});
    if (!user) {
        _response.result = "ERR_USER_NOT_FOUND";
        res.status(409).json(_response);
        return;
    }

    /**
     * CHECK WHETHER TOKEN IS VALID
     */
    const _token = await Token.findOne({"owner" : email, "type" : "SIGNUP" , "token" : token });
    if (!_token) {
        _response.result = "ERR_PROVIDED_TOKEN_INVALID";
        res.status(409).json(_response);
        return;
    }
    else if (Date.parse(_token.expired) < moment()) {
        _response.result = "ERR_PROVIDED_TOKEN_INVALID";
        res.status(409).json(_response);
        return;
    }
    
    /**
     * SAVE LOG FUNCTION
     */
    const SAVE_LOG = (_result) => {
        const createLog = new authLog ({
            timestamp : moment().format("YYYY-MM-DD HH:mm:ss"), 
            causedby : email,
            originip : getClientIp(req),
            category : "ACTIVATE",
            details : _token,
            result : _result
        });
        
        createLog.save(async (err) => {
            if (err) console.error(err);
        });
    };  

    /**
     * CHANGE USER ENABLE STATE
     */
    const verify = await User.updateOne( {"email" : email , "enable" : false }, {"enable" :  true} );
    if (!verify) {
        _response.result = "ERR_USER_UPDATE_FAILED";
        res.status(500).json(_response);
        SAVE_LOG(_response);
        return;
    }

    /**
     * ALL TASK FINISHED, DELETE TOKENS AND SHOW OUTPUT
     */
    await Token.deleteOne({"owner" : email, "type" : "SIGNUP", "token" : token});
    _response.result = "SUCCEED_USER_ACTIVATED";
    res.status(200).json(_response);
    SAVE_LOG(_response);

    //handle HTML File

});


export default router;