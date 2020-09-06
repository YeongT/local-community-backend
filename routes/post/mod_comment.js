import { Router } from "express";
import { getClientIp } from "request-ip";
import { jwtgetUser } from "../coms/jwtgetUser";
import { db_error } from "../../app";
import { genEditLog } from "../coms/buildEditlog";
import moment from "moment";
import mongoose from "mongoose";
import Comment from "../../models/post/comment";
import postLog from "../../models/post/postlog";

const router = Router();
router.post ("/", async (req,res) => {
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

    const { text } = req.body;
    var { target, picture } = req.body;
    if (!(db_error === null)) return await responseFunction(500, "ERR_DATABASE_NOT_CONNECTED", null);
    if (!(target && text)) return await responseFunction(412, "ERR_DATA_NOT_PROVIDED", null);

    //#CHANGE STRING OBJECT TO ARRAY OBJECT
    try {
        target = await mongoose.Types.ObjectId(target);
        if (picture) picture = await JSON.parse(picture);
    }
    catch (err) {
        if (err.toString() === "Error: Argument passed in must be a single String of 12 bytes or a string of 24 hex characters")
            return await responseFunction(412, {"msg":"ERR_TARGET_FORMAT_INVALID"}, null, err.toString());
        return await responseFunction(412, {"msg":"ERR_DATA_ARRAY_FORMAT_INVALID"}, null, err.toString());
    }

    //#VALIDATE WHERE USER JWT TOKEN IS VALID AND ACCPETABLE TO TARGET
    const { jwtuser, jwtbody, jwterror } = await jwtgetUser(req.headers.authorization);
    if (!(jwterror === null)) return await responseFunction(403, {"msg":jwtbody}, null, jwterror);

   //#GET COMMENT OBJECT WHOSE TARGET IS PROVIDED OBJECT ID
    const _comment = await Comment.findOne({
        "_id": target,
        "owner": jwtuser._id,
        "visible": true,
        "suecount": {
            "$lte": 5
        }
    });
    if (!_comment) return await responseFunction(409, {"msg":"ERR_LOAD_TARGET_COMMENT_FAILED"}, null);

    //#SAVE LOG FUNCTION
    const SAVE_LOG = async (_response) => {
        const createLog = new postLog ({
            timestamp : moment().format("YYYY-MM-DD HH:mm:ss"), 
            causeby : jwtuser.email,
            originip : getClientIp(req),
            category : "MOD_COMMENT",
            details : _comment.content,
            result : _response.result
        });
        createLog.save(async (err) => {
            if (err) console.error(err);
        });
    };

    //#UPDATE COMMENT OBJECT USING PREVIOUS OBJECT
    _comment.modify.ismodified = true;
    _comment.modify.history.unshift(await genEditLog(_comment.content));
    _comment.content = {
        text,
        picture
    };

    //SAVE ARTICLE INFO ON DATABASE
    await Comment.updateOne({
        "_id": target
    }, {
        "modify": _comment.modify,
        "content": _comment.content,
        "timestamp" : moment().format("YYYY-MM-DD HH:mm:ss")
    }, async (save_error) => {
        if (save_error) return responseFunction(500, {"msg":"ERR_UPDATE_COMMENT_FAILED"}, null, save_error);
        await responseFunction(200,{"msg":"SUCCEED_COMMENT_UPDATED"}, null);
        return SAVE_LOG(_response);
    });
});


export default router;