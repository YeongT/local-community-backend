import { Router } from 'express';
import { pbkdf2Sync, randomBytes } from 'crypto';
import User from '../../models/user';
import { db_error } from '../../app.js';

const router = Router();

router.post ('/', async (req,res) => {
    /**
     * CHECK DATABASE STATUS
     */
    if (!(db_error == null)) {
        res.status(500);
        res.send('ERR_DATABASE_NOT_CONNECTED');
        return;
    }

    const { email,passwd,name,gender,phone,areaString } = req.body;
    const email_chk = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i,
          passwd_chk = /^.*(?=^.{8,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/,
          phone_chk = /^\d{3}-\d{3,4}-\d{4}$/,
          name_chk = /^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-1]{2,10}/;

    /**
     * CHECK WHETHER PROVIDED POST DATA IS VALID
     */
    if (!(email && passwd && name && gender && phone && areaString )) {
        res.status(505);
        res.send('ERR_DATA_NOT_PROVIDED');
        return;
    }
    if (!(email_chk.test(email) && passwd_chk.test(passwd) && name_chk.test(name) && phone_chk.test(phone))) { 
        res.status(505);
        res.send('ERR_DATA_FORMAT_INVALID');
        return;   
    }
    const area = JSON.parse(areaString);
    if (!(area.state && area.city && area.dong)) {
        res.status(505);
        res.send('ERR_AREA_DATA_FORMAT_INVALID');
        return;
    }

    /**
     * CHECK WHETHER EMAIL IS USED
     */
    const user = await User.findOne({"email" : email});
    if (user) {
        res.status(409);
        res.send('ERR_EMAIL_DUPLICATION');
        return;
    }

    /**
     * ENCRYPT USER PASSWORD WITH RANDOM SALT
     */
    
    const salt = randomBytes(20).toString('base64');
    const encryptPassword = pbkdf2Sync(passwd, salt, 100000, 64, 'SHA512');
    if (!encryptPassword) {
      res.status(500);
      res.send('ERR_PW_ENCRYPT_FAILED');
      return;
    }

    /**
     * SAVE USER ACCOUNT ON DATABASE
     */
    const createUser = new User ({
        email,
        passwd: `${encryptPassword.toString('base64')}`,
        name,
        gender,
        phone,
        area : {
            state : `${area.state}`,
            city : `${area.city}`,
            dong : `${area.dong}`
        },
        salt
    });

    createUser.save(async (err) => {
        //# HANDLE WHEN SAVE TASL FAILED
        if (err) {
            res.status(500);
            res.send('ERR_UNKNOWN_SERVER_FAIL');
            return;
        }
        
        //# SEND VERIFICATION MAIL
        res.status(200);
        res.send('SUCCEED_USER_CREATED');

        /* NEED TO WRITE EMAIL_SEND_CODE */
    });
});


export default router;