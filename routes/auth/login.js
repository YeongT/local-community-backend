import { Router } from "express";
import { pbkdf2Sync } from "crypto";
import { getClientIp } from "request-ip";
import { db_error } from "../../app";
import { jwtSign } from "../coms/jwtToken.js";
import responseFunction from "../coms/apiResponse";
import loadRegex from "../coms/loadRegex";
import moment from "moment";
import authLog from "../../models/authlog";
import User from "../../models/user";

const router = Router();

router.post ("/", async (req,res) => {
    //#CHECK DATABASE AND CHECK AUTHORIZATION HEADER USING BASIC AUTH
    if (db_error !== null) return await responseFunction(res, 500, "ERR_DATABASE_NOT_CONNECTED");
    if (req.headers.authorization !== `Basic ${process.env.ACCOUNT_BASIC_AUTH_KEY}`) return await responseFunction(res, 403, "ERR_NOT_AUTHORIZED_IDENTITY");
    
    //#CHECK WHETHER PROVIDED POST DATA IS VALID
    const { email, password } = req.body;
    const { emailchk, passwdchk } = await loadRegex();
    if (!(email && password)) return await responseFunction(res, 412, "ERR_DATA_NOT_PROVIDED");
    if (!(emailchk.test(email) && passwdchk.test(password))) return await responseFunction(res, 412, "ERR_DATA_FORMAT_INVALID");

    //#GET USER OBJECT THROUGH EMAIL
    const _user = await User.findOne({"account.email" : email}, {_id:0});
    if (_user === null || _user === undefined) return await responseFunction(res, 409, "ERR_USER_NOT_FOUND");
    else if (_user.account.status === "rejected") return await responseFunction(res, 423, "ERR_USER_ACCESS_DENIED");

    //#SAVE ACCESS LOG ON DATABASE
    const SAVE_LOG = async (_response) => {
        const createLog = new authLog ({
            timestamp : moment().format("YYYY-MM-DD HH:mm:ss"), 
            causedby : _user.account.email,
            originip : getClientIp(req),
            category : "LOGIN",
            details : req.body,
            result : _response
        });
        await createLog.save(async (err) => {
            if (err) console.log(err);
        });
    };

    //COMPARE DB_PASSWORD WITH PROVIDED PASSWORD
    const encryptPassword = pbkdf2Sync(password, _user.auth.salt, 100000, 64, "SHA512");
    req.body.password = encryptPassword.toString("base64"); //HIDE INPUT_PW ON DATABASE
    if (encryptPassword.toString("base64") !== _user.password) return await responseFunction(res, 409, "ERR_USER_AUTH_FAILED");

    //#UPDATE LAST_LOGIN FIELD
    const _update = await User.updateOne({"account.email": email }, {"auth.denied":0, "auth.history.lastlogin" : moment().format("YYYY-MM-DD HH:mm:ss")});
    if (!_update) return SAVE_LOG(await responseFunction(res, 500, "ERR_USER_UPDATE_FAILED", null, _update));
    
    //#GENERATE JWT TOKEN AND WRITE ON DOCUMENT
    _user.auth = undefined;
    const { jwttoken, tokenerror } = await jwtSign(_user);
    if (tokenerror !== null) return await SAVE_LOG(await responseFunction(res, 500, "ERR_JWT_GENERATE_FAILED", null, tokenerror));
    return await SAVE_LOG(await responseFunction(res, 200, "SUCCEED_USER_LOGIN", {"token":jwttoken}));
});


export default router;