import { Router } from "express";
import { pbkdf2Sync, randomBytes, createCipheriv} from "crypto";
import { escape as urlencode } from "querystring";
import mailConnect from "../coms/mailconnect";
import loadRegex from "../coms/loadRegex";
import responseFunction from "../coms/apiResponse";
import { getClientIp } from "request-ip";
import { readFileSync } from "fs";
import { db_error } from "../../app";
import { jwtSign } from "../coms/jwtToken.js";
import moment from "moment";
import Token from "../../models/token";
import authLog from "../../models/authlog";
import User from "../../models/user";

const router = Router();
router.post ("/", async (req,res) => {
    //#CHECK DATABASE AND MAIL_SERVER STATE AND CHECK AUTHORIZATION HEADER USING BASIC AUTH
    const { transporter, mailerror } = await mailConnect();
    if (!(db_error === null)) return await responseFunction(res, 500, "ERR_DATABASE_NOT_CONNECTED");
    if (!(mailerror === null)) return await responseFunction(res, 500, "ERR_MAIL_SERVER_NOT_CONNECTED", null, mailerror);
    if (!(req.headers.authorization === `Basic ${process.env.ACCOUNT_BASIC_AUTH_KEY}`)) return await responseFunction(res, 403, "ERR_NOT_AUTHORIZED_IDENTITY");

    //#CHECK WHETHER PROVIDED POST DATA IS VALID
    const { email, password, name, gender, phone, areaString } = req.body;
    const { emailchk, passwdchk, phonechk, namechk } = await loadRegex();
    if (!(email && password && name && gender && phone && areaString)) return await responseFunction(res, 412, "ERR_DATA_NOT_PROVIDED");
    if (!(emailchk.test(email) && passwdchk.test(password) && phonechk.test(phone) && namechk.test(name))) return await responseFunction(res, 412, "ERR_DATA_FORMAT_INVALID");

    //#CHECK WHETHER EMAIL IS USED
    const _user = await User.findOne({"email" : email});
    if (!(_user === null || _user === undefined)) return await responseFunction(res, 409, "ERR_EMAIL_DUPLICATION");

    //#ENCRYPT USER PASSWORD WITH RANDOM SALT
    const salt = await randomBytes(32), iv = await randomBytes(16);
    const encryptPassword = await pbkdf2Sync(password, salt.toString("base64"), 100000, 64, "SHA512");
    if (!encryptPassword) return await responseFunction(res, 500, "ERR_PASSWORD_ENCRYPT_FAILED");

    const cipher = await createCipheriv("aes-256-cbc", Buffer.from(salt), iv);
    const encryptPhone = await Buffer.concat([cipher.update(phone), cipher.final()]);
    if (!encryptPhone) return await responseFunction(res, 500, "ERR_PHONE_ENCRYPT_FAILED");

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
    const SAVE_LOG = async (_response) => {
        const createLog = new authLog ({
            timestamp : moment().format("YYYY-MM-DD HH:mm:ss"), 
            causedby : email,
            originip : getClientIp(req),
            category : "SIGNUP",
            details : createUser,
            result : _response.result,
        });
        await createLog.save(async (err) => {
            if (err) console.error(err);
        });
    };

    await createUser.save(async (save_error) => {
        //# HANDLE WHEN SAVE TASK FAILED
        if (save_error) return await responseFunction(res, 500, "ERR_USER_SAVE_FAILED", null, save_error);
        
        //# GENERATE TOKEN AND SAVE ON DATABASE
        const token = await randomBytes(30); 
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
            return await SAVE_LOG(await responseFunction(res, 424, "ERR_AUTH_TOKEN_SAVE_FAILED", null, error));
        }

        //# SEND VERIFICATION MAIL
        try {
            const exampleEmail = await readFileSync(__dirname + "/../../models/html/active.html").toString();
            const emailData = await exampleEmail.replace("####INPUT-YOUR-LINK_HERE####", `https://api.hakbong.me/auth/active?email=${urlencode(email)}&&token=${urlencode(token.toString("base64"))}`);
            const mailOptions = {
                from: "Local-Community<no-reply@hakbong.me>",
                to: email, 
                subject: "[Local Community] Account Verification Email", 
                html: emailData
            };

            createUser._id = undefined;
            createUser.password = undefined;
            createUser.salt = undefined;
            const { jwttoken, tokenerror } = await jwtSign(createUser);
            if (!(tokenerror === null)) return await SAVE_LOG(await responseFunction(res, 500, "ERR_JWT_GENERATE_FAILED", null, tokenerror));
            const sendMail = await transporter.sendMail(mailOptions);
            if (!sendMail) throw("UNKNOWN_MAIL_SEND_ERROR_ACCURED");
            return await SAVE_LOG(await responseFunction(res, 200, "SUCCEED_USER_CREATED", {"token":jwttoken}));
        }
        catch (error) {
            return await SAVE_LOG(await responseFunction(res, 424, "ERR_VERIFY_EMAIL_SEND_FAILED", null, error));
        }
    });
});

export default router;