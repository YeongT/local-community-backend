import { Router } from "express";
import { pbkdf2Sync, randomBytes, createCipheriv} from "crypto";
import { escape as urlencode } from "querystring";
import mailConnect from "../coms/mailconnect";
import loadRegex from "../coms/loadRegex";
import { getClientIp } from "request-ip";
import { readFileSync } from "fs";
import { db_error } from "../../app";
import { jwtSign } from "../jwtToken.js";
import moment from "moment";
import Token from "../../models/token";
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

    //#CHECK DATABASE AND MAIL_SERVER STATE && CHECK AUTHORIZATION HEADER USING BASIC AUTH
    const { transporter, mailerror } = await mailConnect();
    if (!(db_error === null)) return responseFunction(500, {"msg":"ERR_DATABASE_NOT_CONNECTED"}, null);
    if (!(mailerror === null)) return responseFunction(500, {"msg":"ERR_MAIL_SERVER_NOT_CONNECTED"}, null, mailerror);
    if (!(req.headers.authorization === `Basic ${process.env.ACCOUNT_BASIC_AUTH_KEY}`)) return responseFunction(403, {"msg":"ERR_NOT_AUTHORIZED_IDENTITY"}, null);

    //#CHECK WHETHER PROVIDED POST DATA IS VALID
    const { email, password, name, gender, phone, areaString } = req.body;
    const { emailchk, passwdchk, phonechk, namechk } = await loadRegex();
    if (!(email && password && name && gender && phone && areaString )) return responseFunction(412, {"msg":"ERR_DATA_NOT_PROVIDED"}, null);
    if (!(emailchk.test(email) && passwdchk.test(password) && phonechk.test(phone) && namechk.test(name))) return responseFunction(412, {"msg":"ERR_DATA_FORMAT_INVALID"}, null);

    //#CHECK WHETHER EMAIL IS USED
    const _user = await User.findOne({"email" : email});
    if (!(_user === null || _user === undefined)) return responseFunction(409, {"msg":"ERR_EMAIL_DUPLICATION"}, null);

    //#ENCRYPT USER PASSWORD WITH RANDOM SALT
    const salt = randomBytes(32),iv = randomBytes(16);
    const encryptPassword = pbkdf2Sync(password, salt.toString("base64"), 100000, 64, "SHA512");
    if (!encryptPassword) return responseFunction(500, {"msg":"ERR_PASSWORD_ENCRYPT_FAILED"}, null);

    const cipher = createCipheriv("aes-256-cbc", Buffer.from(salt), iv);
    const encryptPhone = Buffer.concat([cipher.update(phone), cipher.final()]);
    if (!encryptPhone) return responseFunction(500, {"msg":"ERR_PHONE_ENCRYPT_FAILED"}, null);

    //#SAVE USER ACCOUNT ON DATABASE
    const createUser = new User ({
        email,
        password: `${encryptPassword.toString("base64")}`,
        name,
        gender,
        phone: `${iv.toString("hex") + ":" + encryptPhone.toString("hex")}`,
        areaString,
        salt: `${salt.toString("base64")}`,
    });

    //#SAVE LOG FUNCTION
    const SAVE_LOG = (_response) => {
        const createLog = new authLog ({
            timestamp : moment().format("YYYY-MM-DD HH:mm:ss"), 
            causedby : email,
            originip : getClientIp(req),
            category : "SIGNUP",
            details : createUser,
            result : _response,
        });
        createLog.save((err) => {
            if (err) console.error(err);
        });
    };

    await createUser.save(async (save_error) => {
        //# HANDLE WHEN SAVE TASK FAILED
        if (save_error) responseFunction(500, {"msg":"ERR_USER_SAVE_FAILED"}, null, save_error);
        
        //# GENERATE TOKEN AND SAVE ON DATABASE
        const token = randomBytes(30); 
        const newToken = new Token ({
            owner: email,
            type:"SIGNUP",
            token:`${token.toString("base64")}`,
            created: moment().format("YYYY-MM-DD HH:mm:ss"), 
            expired: moment().add(1,"d").format("YYYY-MM-DD HH:mm:ss"), 
        });
        try {
            const verify = await newToken.save();
            if (!verify) throw(verify);
        }
        catch (error) {
            SAVE_LOG(_response);
            return responseFunction(424, {"msg":"ERR_AUTH_TOKEN_SAVE_FAILED"}, null, error);
        }

        //# SEND VERIFICATION MAIL
        try {
            const exampleEmail = readFileSync(__dirname + "/../../models/html/active.html").toString();
            const emailData = exampleEmail.replace("####INPUT-YOUR-LINK_HERE####", `https://api.hakbong.me/auth/active?email=${urlencode(email)}&&token=${urlencode(token.toString("base64"))}`);
            const mailOptions = {
                from: "Local-Community<no-reply@hakbong.me>",
                to: email, 
                subject: "[Local Comunity] Account Verification Email", 
                html: emailData
            };

            const sendMail = await transporter.sendMail(mailOptions);
            if (!sendMail) throw("UNKNOWN_MAIL_SEND_ERROR_ACCURED");
            createUser._id = undefined;
            createUser.password = undefined;
            createUser.salt = undefined;
            const { jwttoken, tokenerror } = await jwtSign(createUser);
            if (!(tokenerror === null)) {
                SAVE_LOG(_response);
                return responseFunction(500, {"msg":"ERR_JWT_GENERATE_FAILED"}, jwttoken, tokenerror);
            }
            SAVE_LOG(_response);
            return responseFunction(200, {"msg":"SUCCEED_USER_CREATED"}, jwttoken);
        }
        catch (error) {
            SAVE_LOG(_response);
            return responseFunction(424, {"msg":"ERR_VERIFY_EMAIL_SEND_FAILED"}, null, error);
        }
    });
});

export default router;