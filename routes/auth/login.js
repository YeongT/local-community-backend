import { Router } from "express";
import { pbkdf2Sync } from "crypto";
import { getClientIp } from "request-ip";
import { db_error } from "../../app";
import { jwtSign } from "../jwtToken.js";
import moment from "moment";
import authLog from "../../models/authlog";
import User from "../../models/user";

const router = Router();

router.post ("/", async (req,res) => {
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
    const { email, password } = req.body;
    const email_chk = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i,
          password_chk = /^.*(?=^.{8,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/;
    
    if (!(email && password && email_chk.test(email) && password_chk.test(password))) {
        _response.result = "ERR_DATA_FORMAT_INVALID";
        res.status(412).json(_response);
        return;
    }  

    /**
     * GET USER OBJECT THROUGH EMAIL
     */
    const _user = await User.findOne({"email" : email});
    if (!_user) {
        _response.result = "ERR_USER_NOT_FOUND";
        res.status(409).json(_response);
        return;
    }

    /**
     * SAVE ACCESS LOG ON DATABASE
     */
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
            //# HANDLE WHEN SAVE TASK FAILED
            if (err) console.log(err);
        });
    };

    /**
     * COMPARE DB_PASSWORD WITH PROVIDED PASSWORD
     */
    const encryptPassword = pbkdf2Sync(password, _user.salt, 100000, 64, "SHA512");
    req.body.password = encryptPassword.toString("base64"); //HIDE INPUT_PW ON DATABASE
    if (encryptPassword.toString("base64") !== _user.password) {
      _response.result = "ERR_USER_AUTH_FAILED";
      res.status(409).json(_response);
      SAVE_LOG(_response);
      return;
    }

    /**
     * UPDATE LAST_LOGIN FIELD
     */
    _response.result = "SUCCEED_USER_LOGIN";
    const update = await User.updateOne({"email": email }, {"lastlogin" : moment().format("YYYY-MM-DD HH:mm:ss")});
    if (!update) console.error(update);

    /**
     * GENERATE JWT TOKEN AND WRITE ON DOCUMENT
     */
    _user.password = undefined;
    _user.salt = undefined;
    _user.__v = undefined;
    const jwtresult = jwtSign(_user);
    if (!jwtresult) {
      _response.result = "ERR_JWT_GENERATE_FAILED";
      res.status(500).json(_response);
      SAVE_LOG(_response);
      return;
    }
    _response.token = jwtresult;
    res.status(200).json(_response);
    SAVE_LOG(_response);
});


export default router;