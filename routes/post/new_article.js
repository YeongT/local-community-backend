import { Router } from "express";
import { getClientIp } from "request-ip";
import { jwtgetUser } from "../coms/jwtgetUser";
import { db_error } from "../../app";
import moment from "moment";
import Article from "../../models/post/article";
import postLog from "../../models/post/postlog";

const router = Router();
router.put ("/", async (req,res) => {
    var _response = { "result" : { "statusCode" : 500, "body" : {"msg":"ERR_SERVER_FAILED_TEMPORARILY"}, "output" : null, "error" : "SERVER_RESPONSE_INVALID" }};
    const responseFunction = (statusCode, body, output, error) => {
        if (!(statusCode && body && output !== undefined)) throw("ERR_SERVER_BACKEND_SYNTAX_FAILED");
        if (!(error === undefined || error === null)) console.error(error);
        _response.result.statusCode = statusCode;
        _response.result.body = body;
        _response.result.output = output;
        _response.result.error = error;
        res.status(statusCode).json(_response);
    };

    //#CHECK DATABASE STATE AND WHETHER PROVIDED POST DATA IS VALID
    const { target, title, text } = req.body;
    var { tags, picture, link } = req.body;
    if (!(db_error === null)) return await responseFunction(500, "ERR_DATABASE_NOT_CONNECTED", null);
    if (!(target && title && text && tags)) return await responseFunction(412, "ERR_DATA_NOT_PROVIDED", null);

    //#VALIDATE WHERE USER JWT TOKEN IS VALID AND ACCPETABLE TO TARGET
    const { jwtuser, jwtbody, jwterror } = await jwtgetUser(req.headers.authorization);
    if (!(jwterror === null)) return await responseFunction(403, {"msg":jwtbody}, null, jwterror);
    
    //#CHANGE STRING OBJECT TO ARRAY OBJECT
    try {
        tags = await JSON.parse(tags);
        if (picture) picture = await JSON.parse(picture);
        if (link) link = await JSON.parse(link);
    }
    catch (err) {
        return await responseFunction(412, {"msg":"ERR_DATA_ARRAY_FORMAT_INVALID"}, null, err.toString());
    }
    
    //#GENERATE ARTICLE OBJECT
    const postArticle = new Article({
        timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
        target,
        content: {
            title,
            text,
            tags,
            attach: {
                picture,
                link
            }
        },
        owner: jwtuser._id
    });

    //#SAVE LOG FUNCTION
    const SAVE_LOG = async (_response) => {
        const createLog = new postLog ({
            timestamp : moment().format("YYYY-MM-DD HH:mm:ss"), 
            causeby : jwtuser.email,
            originip : getClientIp(req),
            category : "NEW_ARTICLE",
            details : postArticle.content,
            result : _response.result
        });
        await createLog.save(async (err) => {
            if (err) console.error(err);
        });
    };

    //#SAVE ARTICLE INFO ON DATABASE
    await postArticle.save(async (save_error) => {
        if (save_error) return await responseFunction(500, {"msg":"ERR_POST_NEW_ARTICLE_FAIELD"}, null, save_error);
        await responseFunction(200, {"msg":"SUCCEED_NEW_ARTICLE_POSTED"}, null);
        return SAVE_LOG(_response);
    });
});

export default router;