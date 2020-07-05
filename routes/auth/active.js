import { Router } from 'express';
import { getClientIp } from 'request-ip';
import { db_error } from '../../app.js';
import accessLog from '../../models/accesslog';
import Token from '../../models/token';
import User from '../../models/user';

const router = Router();
router.get ('/', async (req,res) => {
    /**
     * CHECK DATABASE STATE
     */
    if (!(db_error == null)) {
        res.status(500);
        res.send('ERR_DATABASE_NOT_CONNECTED');
        return;
    }

    /**
     * CHECK WHETHER PROVIDED POST DATA IS VALID
     */
    const { email, token} = req.query;
    const email_chk = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
    if (!(email && email_chk.test(email) && token)) {
        res.status(412);
        res.send('ERR_DATA_FORMAT_INVALID');
        return;
    }

    /**
     * FIND USER ON DATABASE USING EMAIL
     */
    const user = await User.findOne({"email" : email, "enable" : false});
    if (!user) {
        res.status(409).send('ERR_USER_NOT_FOUND');
        return;
    }

    /**
     * SAVE LOG FUNCTION
     */
    const SAVE_LOG = (__result) => {
        require('moment-timezone');
        const moment = require('moment');
        moment.tz.setDefault("Asia/Seoul");
        const createLog = new accessLog ({
            timestamp : moment().format('YYYY-MM-DD HH:mm:ss'), 
            causedby : email,
            originip : getClientIp(req),
            category : 'ACTIVATE',
            details : `${"provided token : " + token}`,
            result : `${__result}`
        });
        
        createLog.save(async (err) => {
            if (err) console.error(err);
        });
    };  

    /**
     * CHECK WHETHER TOKEN IS VALID
     */
    const _token = await Token.findOne({"owner" : email, "type" : "SIGNUP" , "token" : token, "expired" : {$gte : new Date()} });
    if (!_token) {
        res.status(409).send('ERR_PROVIDED_TOKEN_INVALID');
        return;
    }
    
    /**
     * CHANGE USER ENABLE STATE
     */
    var _result = 'ERR_SERVER_FAILED_TEMPORARILY';
    const verify = await User.updateOne( {"email" : email , "enable" : false }, {"enable" :  true} );
    if (!verify) {
        _result = 'ERR_USER_UPDATE_FAILED'
        res.status(500).send(_result);
        SAVE_LOG(_result);
        return;
    }

    /**
     * ALL TASK FINISHED, DELETE TOKENS AND SHOW OUTPUT
     */
    await Token.deleteOne({"owner" : email, "type" : "SIGNUP", "token" : token});
    _result = 'SUCCEED_USER_ACTIVATED';
    res.status(200).send(_result);
    SAVE_LOG(_result);

    //handle HTML File

});


export default router;