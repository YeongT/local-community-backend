import { Router } from "express";
import { jwtgetUser } from "../coms/jwtgetUser";
import { db_error } from "../../app";
import mongoose from "mongoose";
import Article from "../../models/post/article";
import Comment from "../../models/post/comment";

const router = Router();
router.get ("/:objectType/:target", async (req,res) => {
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
    var { objectType, target } = req.params;
    if (!(db_error === null)) return await responseFunction(500, "ERR_DATABASE_NOT_CONNECTED", null);
    if (!(objectType && target)) return await responseFunction(412, "ERR_DATA_NOT_PROVIDED", null);

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
   
    //#GENERATE RESPONSE OBJECT && GET TARGET OBJECT
    var _editlog = undefined, condition = {
            "_id": target,
            "visible": true,
            "suecount": {
                "$lte": 5
            }
        };
    if (objectType === "article") _editlog = await Article.findOne(condition);
    if (objectType === "comment") _editlog = await Comment.findOne(condition);
    if (!_editlog) return await responseFunction(409, {"msg":"ERR_ACCESS_TARGET_OBJECT_FAILED"}, null);

    //RETURN EDITLOG OBJECT TO CLIENT DEPENDS ON ISMODIFIED
    return await responseFunction(200, {
        "msg": _editlog.modify.ismodified ? "SUCCEED_EDITLOG_LOADED" : "OBJECT_HAD_NOT_BEEN_MODIFIED"
    }, {
        "count": _editlog.modify.history.length,
        "history": _editlog.modify.history
    });
});

export default router;