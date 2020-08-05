import { Router } from 'express';
import { pbkdf2Sync, randomBytes, createCipheriv} from 'crypto';
import { escape as urlencode } from 'querystring';
import { createTransport } from 'nodemailer';
import { getClientIp } from 'request-ip';
import { readFileSync } from 'fs';
import { db_error } from '../../app';
import Token from '../../models/token';
import authLog from '../../models/authlog';
import User from '../../models/user';

const router = Router();
router.post ('/', async (req,res) => {
    var _response = { "result" : "ERR_SERVER_FAILED_TEMPORARILY" };

    /**
     * CHECK DATABASE AND MAIL_SERVER STATE
     */
    if (!(db_error == null)) {
        _response.result = 'ERR_DATABASE_NOT_CONNECTED';
        res.status(500).json(_response);
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
    catch (err) {
        console.error(err);
        _response.result = 'ERR_MAIL_SERVER_NOT_CONNECTED';
        res.status(500).json(_response);
        return;
    }

    /**
     * CHECK WHETHER PROVIDED POST DATA IS VALID
     */
    const { email,password,name,gender,phone,areaString } = req.body;
    const email_chk = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i,
          password_chk = /^.*(?=^.{8,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/,
          phone_chk = /^(?:(010-?\d{4})|(01[1|6|7|8|9]-?\d{3,4}))-?\d{4}$/,
          name_chk = /^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-1 ]{2,10}/;
    
    if (!(email && password && name && gender && phone && areaString )) {
        _response.result = 'ERR_DATA_NOT_PROVIDED';
        res.status(412).json(_response);
        return;
    }
    if (!(email_chk.test(email) && password_chk.test(password) && name_chk.test(name) && phone_chk.test(phone))) { 
        _response.result = 'ERR_DATA_FORMAT_INVALID';
        res.status(400).json(_response);
        return;   
    }
    var area = "THIS IS DEFAULT AREA OBEJCT";
    try {
        area = JSON.parse(areaString);
        if (!(area.state && area.city && area.dong)) {
            _response.result = 'ERR_AREA_DATA_FORMAT_INVALID';
            res.status(400).json(_response);
            return;
        }
    }
    catch (err) {
        _response.result = 'ERR_AREA_DATA_FORMAT_INVALID';
        _response.error = err;
        res.status(400).json(_response);
        return;
    }

    /**
     * CHECK WHETHER EMAIL IS USED
     */
    
    const user = await User.findOne({"email" : email});
    if (user) {
        _response.result = 'ERR_EMAIL_DUPLICATION';
        res.status(409).json(_response);
        return;
    }

    /**
     * ENCRYPT USER PASSWORD WITH RANDOM SALT
     */
    const salt = randomBytes(32),iv = randomBytes(16);
    const encryptPassword = pbkdf2Sync(password, salt.toString('base64'), 100000, 64, 'SHA512');
    if (!encryptPassword) {
        _response.result = 'ERR_PASSWORD_ENCRYPT_FAILED';
        res.status(500).json(_response);
        return;
    }
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(salt), iv);
    const encryptPhone = Buffer.concat([cipher.update(phone), cipher.final()]);
    if (!encryptPhone) {
        _response.result = 'ERR_PHONE_ENCRYPT_FAILED';
        res.status(500).json(_response);
        return;
    }

    /**
     * SAVE USER ACCOUNT ON DATABASE
     */
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
    const SAVE_LOG = (_response) => {
        const createLog = new authLog ({
            timestamp : moment().format('YYYY-MM-DD HH:mm:ss'), 
            causedby : email,
            originip : getClientIp(req),
            category : 'SIGNUP',
            details : createUser,
            result : _response,
        });
        createLog.save((err) => {
            if (err) console.error(err);
        });
    }

    await createUser.save(async (err) => {
        //# HANDLE WHEN SAVE TASK FAILED
        if (err) {
            _response.result = 'ERR_USER_SAVE_FAILED';
            _response.error = err;
            res.status(500).json(_response);
            return;
        }
        
        //# GENERATE TOKEN AND SAVE ON DATABASE
        const token = randomBytes(30); 
        const newToken = new Token ({
            owner: email,
            type:'SIGNUP',
            token:`${token.toString('base64')}`,
            created: moment().format('YYYY-MM-DD HH:mm:ss'), 
            expired: moment().add(1,'d').format('YYYY-MM-DD HH:mm:ss'), 
        });
        try {
            const verify = await newToken.save();
            if (!verify) throw (verify);
        }
        catch (err) {
            console.error(err);
            _response.result = 'ERR_AUTH_TOKEN_SAVE_FAILED';
            _response.error = err;
            res.status(424).json(_response);
            SAVE_LOG(_response);
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

            const sendMail = await transporter.sendMail(mailOptions);
            if (sendMail) {
                _response.result = 'SUCCEED_USER_CREATED';
                res.status(200).json(_response);
                SAVE_LOG(_response);
            }
        }
        catch (err) {
            console.error(err); //SHOW ERROR FOR PM2 INSTANCE
            _response.result = 'ERR_VERIFY_EMAIL_SEND_FAILED';
            _response.error = err;
            res.status(424).json(_response);
            SAVE_LOG(_response);
        }
    });
});

export default router;