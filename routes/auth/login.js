import { Router } from "express";
import { pbkdf2Sync } from "crypto";
import { getClientIp } from "request-ip";
import { db_error } from "../../app";
import { jwtSign } from "../coms/jwtToken.js";
import loadRegex from "../coms/loadRegex";
import moment from "moment";
import authLog from "../../models/authlog";
import User from "../../models/user";

const router = Router();

router.post ("/", async (req,res) => {
    var _response = { "result" : { "statusCode" : 500, "body" : {"msg":"ERR_SERVER_FAILED_TEMPORARILY"}, "token" : null, "error" : "SERVER_RESPONSE_INVALID" }};
    const responseFunction = (statusCode, body, token, error) => {
        if (!(statusCode && body && token !== undefined)) throw("ERR_SERVER_BACKEND_SYNTAX_FAILED");
        if (!(error === undefined || error === null)) console.error(error);
        _response.result.statusCode = statusCode;
        _response.result.body = body;
        _response.result.token = token;
        _response.result.error = error;
        res.status(statusCode).json(_response);
        return true;
    };

    //#CHECK DATABASE AND CHECK AUTHORIZATION HEADER USING BASIC AUTH
    if (!(db_error === null)) return responseFunction(500, {"msg":"ERR_DATABASE_NOT_CONNECTED"}, null);
    if (!(req.headers.authorization === `Basic ${process.env.ACCOUNT_BASIC_AUTH_KEY}`)) return responseFunction(403, {"msg":"ERR_NOT_AUTHORIZED_IDENTITY"}, null);

    
    //#CHECK WHETHER PROVIDED POST DATA IS VALID
    const { email, password } = req.body;
    const { emailchk, passwdchk } = await loadRegex();
    if (!(email && password)) return responseFunction(412, {"msg":"ERR_DATA_NOT_PROVIDED"}, null);
    if (!(emailchk.test(email) && passwdchk.test(password))) return responseFunction(412, {"msg":"ERR_DATA_FORMAT_INVALID"}, null);

    //#GET USER OBJECT THROUGH EMAIL
    const _user = await User.findOne({"email" : email});
    if (_user === null || _user === undefined) return responseFunction(409, {"msg":"ERR_USER_NOT_FOUND"}, null);

    //#SAVE ACCESS LOG ON DATABASE
    const SAVE_LOG = (_response) => {
        const createLog = new authLog ({
            timestamp : moment().format("YYYY-MM-DD HH:mm:ss"), 
            causedby : email,
            originip : getClientIp(req),
            category : "LOGIN",
            details : req.body,
            result : _response 
        });
        
        createLog.save(async (err) => {
            if (err) console.log(err);
        });
    };

    //COMPARE DB_PASSWORD WITH PROVIDED PASSWORD
    const encryptPassword = pbkdf2Sync(password, _user.salt, 100000, 64, "SHA512");
    req.body.password = encryptPassword.toString("base64"); //HIDE INPUT_PW ON DATABASE
    if (!(encryptPassword.toString("base64") === _user.password)) return responseFunction(409, {"msg":"ERR_USER_AUTH_FAILED"}, null);

    //#UPDATE LAST_LOGIN FIELD
    const _update = await User.updateOne({"email": email }, {"lastlogin" : moment().format("YYYY-MM-DD HH:mm:ss")});
    if (!_update) {
        SAVE_LOG(_response);
        return responseFunction(500, {"msg":"ERR_USER_UPDATE_FAILED"}, null, _update);
    }
    
    //#GENERATE JWT TOKEN AND WRITE ON DOCUMENT
    _user.password = undefined;
    _user.salt = undefined;
    const { jwttoken, tokenerror } = await jwtSign(_user);
    if (!(tokenerror === null)) {
        SAVE_LOG(_response);
        return responseFunction(500, {"msg":"ERR_JWT_GENERATE_FAILED"}, jwttoken, tokenerror);
    }
    SAVE_LOG(_response);
    return responseFunction(200, {"msg":"SUCCEED_USER_LOGIN"}, jwttoken);
});


export default router;