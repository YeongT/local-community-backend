import { Router } from "express";
import { jwtgetUser } from "../coms/jwtgetUser";
import { db_error } from "../../app";
import mongoose from "mongoose";
import Article from "../../models/post/article";

const router = Router();
router.get ("/:target", async (req,res) => {
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
    var { target } = req.params;
    if (!(db_error === null)) return await responseFunction(500, "ERR_DATABASE_NOT_CONNECTED", null);
    if (!(target)) return await responseFunction(412, "ERR_DATA_NOT_PROVIDED", null);

    //#VALIDATE WHERE USER JWT TOKEN IS VALID AND ACCPETABLE TO TARGET
    const { jwtbody, jwterror } = await jwtgetUser(req.headers.authorization);
    if (!(jwterror === null)) return await responseFunction(403, {"msg":jwtbody}, null, jwterror);
    
    //#GENERATE RESPONSE OUTPUT OBJECT
    try {
        target = await mongoose.Types.ObjectId(target);
    }
    catch (parseerr) 
    {
       return await responseFunction(412, {"msg":"ERR_TARGET_ID_FORMAT_INVALID"}, null, parseerr.toString());
    }

    /**
     * GET ARTICLE OBJECT WHOSE TARGET IS PROVIDED OBJECT ID
     * REMOVE USELESS FILED TO SAVE TRAFFIC
     */
    const _article = await Article.find({
        target,
        "visible": true,
        "suecount": {
            "$lte": 5
        }
    }, {
        "target": 0,
        "modify.history": 0,
        "suecount": 0,
        "visible": 0
    }).sort({
        "_id": -1
    });
    if (!_article) return await responseFunction(500, {"msg":"ERR_LOADING_TARGET_ARTICLES_FAILED"}, null);
    
    //RETURN COMMENT OBJECT TO CLIENT DEPENDS ON ARRAY LENGTH
    return await responseFunction(200, {
        "msg": _article.length ? "SUCCEED_ARTICLES_LOADED" : "COULD_NOT_FOUND_ANY_ARTICLE"
    }, {
        "count": _article.length,
        "articles": _article
    });
});

export default router;