import { Router } from 'express';
import { pbkdf2Sync } from 'crypto';
import { getClientIp } from 'request-ip';
import { db_error } from '../../app.js';
import { jwtSign } from '../jwtToken.js';
import accessLog from '../../models/accesslog';
import User from '../../models/user';

const router = Router();

router.post ('/', async (req,res) => {
    /**
     * CHECK DATABASE STATE
     */
    if (!(db_error == null)) {
        res.status(500).send('ERR_DATABASE_NOT_CONNECTED');
        return;
    }

    /**
     * CHECK WHETHER PROVIDED POST DATA IS VALID
     */
    const { email, password } = req.body;
    const email_chk = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i,
          password_chk = /^.*(?=^.{8,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/
    
    if (!(email && password && email_chk.test(email) && password_chk.test(password))) {
        res.status(412).send('ERR_DATA_FORMAT_INVALID');
        return;
    }  

    /**
     * GET USER OBJECT THROUGH EMAIL
     */
    const _user = await User.findOne({"email" : email});
    if (!_user) {
        res.status(409).send('ERR_USER_NOT_FOUND');
        return;
    }

    /**
     * SAVE ACCESS LOG ON DATABASE
     */
    require('moment-timezone');
    const moment = require('moment');
    moment.tz.setDefault("Asia/Seoul");
    const SAVE_LOG = (__result) => {
        const createLog = new accessLog ({
            timestamp : moment().format('YYYY-MM-DD HH:mm:ss'), 
            causedby : email,
            originip : getClientIp(req),
            category : 'LOGIN',
            details : req.body,
            result : `${_result}` 
        });
        
        createLog.save(async (err) => {
            //# HANDLE WHEN SAVE TASK FAILED
            if (err) console.log(err);
        });
    }

    /**
     * COMPARE DB_PASSWORD WITH PROVIDED PASSWORD
     */
    var _result = 'ERR_SERVER_FAILED_TEMPORARILY';
    const encryptPassword = pbkdf2Sync(password, _user.salt, 100000, 64, 'SHA512');
    if (encryptPassword.toString("base64") != _user.password) {
      _result = 'ERR_USER_AUTH_FAILED';
      res.status(500).send(_result);
      SAVE_LOG(_result);
      return;
    }

    /**
     * UPDATE LAST_LOGIN FIELD
     */
    _result = 'SUCCED_USER_LOGIN';
    const update = await User.updateOne({"email": email }, {"lastlogin" : moment().format('YYYY-MM-DD HH:mm:ss'), "__v" : undefined});
    if (!update) console.error(update);

    /**
     * GENERATE JWT TOKEN AND WRITE ON DOCUMENT
     */
    _user.password = undefined;
    _user.salt = undefined;
    _user.__v = undefined;
    const jwtresult = jwtSign(_user);
    if (!(jwtresult)) {
      _result = 'ERR_JWT_GENERATE_FAILED';
      res.status(500).send(_result);
      SAVE_LOG(_result);
      return;
    }
    res.status(200).send(jwtresult);
    SAVE_LOG(_result);
});


export default router;