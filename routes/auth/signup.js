import { Router } from 'express';
import { pbkdf2Sync, randomBytes, createCipheriv} from 'crypto';
import { escape as urlencode } from 'querystring';
import { createTransport } from 'nodemailer';
import { getClientIp } from 'request-ip';
import { readFileSync } from 'fs';
import { db_error } from '../../app.js';
import Token from '../../models/token';
import accessLog from '../../models/accesslog';
import User from '../../models/user';

const router = Router();
router.post ('/', async (req,res) => {
    /**
     * CHECK DATABASE AND MAIL_SERVER STATE
     */
    if (!(db_error == null)) {
        res.status(500).send('ERR_DATABASE_NOT_CONNECTED');
        return;
    }

    const transporter = createTransport({
        host: process.env.MAIL_AUTH_SMTP_HOST,
        port: process.env.MAIL_AUTH_SMTP_PORT,
        secure: true,
        auth: {
            user: "no-reply@hakbong.me",
            pass: process.env.MAIL_AUTH_PASSWORD
        }
    });

    try {
        const verify = await transporter.verify();
        if(!verify) throw (verify);
    }
    catch {
        res.status(500).send('ERR_MAIL_SERVER_NOT_CONNECTED');
        return;
    }

    /**
     * CHECK WHETHER PROVIDED POST DATA IS VALID
     */
    const { email,password,name,gender,phone,areaString } = req.body;
    const email_chk = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i,
          password_chk = /^.*(?=^.{8,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/,
          phone_chk = /^(?:(010-?\d{4})|(01[1|6|7|8|9]-?\d{3,4}))-?\d{4}$/,
          name_chk = /^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-1]{2,10}/;
    
    if (!(email && password && name && gender && phone && areaString )) {
        res.status(412).send('ERR_DATA_NOT_PROVIDED');
        return;
    }
    if (!(email_chk.test(email) && password_chk.test(password) && name_chk.test(name) && phone_chk.test(phone))) { 
        res.status(400).send('ERR_DATA_FORMAT_INVALID');
        return;   
    }
    const area = JSON.parse(areaString);
    if (!(area.state && area.city && area.dong)) {
        res.status(400).send('ERR_AREA_DATA_FORMAT_INVALID');
        return;
    }

    /**
     * CHECK WHETHER EMAIL IS USED
     */
    
    const user = await User.findOne({"email" : email});
    if (user) {
        res.status(409).send('ERR_EMAIL_DUPLICATION');
        return;
    }

    /**
     * ENCRYPT USER PASSWORD WITH RANDOM SALT
     */
    const salt = randomBytes(32),iv = randomBytes(16);
    const encryptPassword = pbkdf2Sync(password, salt.toString('base64'), 100000, 64, 'SHA512');
    if (!encryptPassword) {
      res.status(500).send('ERR_PASSWORD_ENCRYPT_FAILED');
      return;
    }
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(salt), iv);
    const encryptPhone = Buffer.concat([cipher.update(phone), cipher.final()]);
    if (!encryptPhone) {
        res.status(500).send('ERR_PHONE_ENCRYPT_FAILED');
        return;
    }

    /**
     * SAVE USER ACCOUNT ON DATABASE
     */
    var _result = 'ERR_SERVER_FAILED_TEMPORARILY';
    const createUser = new User ({
        email,
        password: `${encryptPassword.toString('base64')}`,
        name,
        gender,
        phone: `${iv.toString('hex') + ':' + encryptPhone.toString('hex')}`,
        area: {
            state : `${area.state}`,
            city : `${area.city}`,
            dong : `${area.dong}`
        },
        salt: `${salt.toString('base64')}`,
    });

    /**
     * SAVE LOG FUNCTION
     */
    require('moment-timezone');
    const moment = require('moment');
    moment.tz.setDefault("Asia/Seoul");
    const SAVE_LOG = (__result) => {
        const createLog = new accessLog ({
            timestamp : moment().format('YYYY-MM-DD HH:mm:ss'), 
            causedby : email,
            originip : getClientIp(req),
            category : 'SIGNUP',
            details : createUser,
            result : __result,
        });
        createLog.save((err) => {
            if (err) console.error(err);
        });
    }

    await createUser.save(async (err) => {
        //# HANDLE WHEN SAVE TASK FAILED
        if (err) {
            _result = 'ERR_USER_SAVE_FAILED';
            res.status(500).send(_result.toString());
            return;
        }
        
        //# GENERATE TOKEN AND SAVE ON DATABASE
        const token = randomBytes(30); 
        const newToken = new Token ({
            owner: email,
            type:'SIGNUP',
            token:`${token.toString('base64')}`,
            created: Date.now() + 9*60*60*1000,
            expired: Date.now() + 24*60*60*1000 + 9*60*60*1000
        });
        try {
            const verify = await newToken.save();
            if (!verify) throw (verify);
        }
        catch {
            _result = 'ERR_AUTH_TOKEN_SAVE_FAILED';
            res.status(424).send(_result.toString());
            SAVE_LOG(_result);
            return;
        }

        //# SEND VERIFICATION MAIL
        try {
            const exampleEmail = readFileSync(__dirname + '/../../models/html/active.html').toString();
            const emailData = exampleEmail.replace('####INPUT-YOUR-LINK_HERE####', `https://api.hakbong.me/auth/active?email=${urlencode(email)}&&token=${urlencode(token.toString('base64'))}`);
            const mailOptions = {
                from: 'Local-Community<no-reply@hakbong.me>',
                to: email, 
                subject: '[Local Comunity] Account Verification Email', 
                html: emailData
            };

            await transporter.sendMail(mailOptions, async (error, info) => {
                if (!error) {
                    _result = 'SUCCEED_USER_CREATED';
                    res.status(200).send(_result.toString());
                    SAVE_LOG(_result);
                }
            });
        }
        catch (err) {
            console.error(err); //SHOW ERROR FOR PM2 INSTANCE
            _result = 'ERR_VERIFY_EMAIL_SEND_FAILED';
            res.status(424).send(_result.toString());
            SAVE_LOG(_result);
        }
    });
});

export default router;