import { Router } from "express";
import { getClientIp } from "request-ip";
import { jwtgetUser } from "../coms/jwtgetUser";
import { db_error } from "../../app";
import { genEditLog } from "../coms/buildEditlog";
import responseFunction from "../coms/apiResponse";
import moment from "moment";
import mongoose from "mongoose";
import Comment from "../../models/post/comment";
import postLog from "../../models/post/postlog";

const router = Router();
router.post ("/", async (req,res) => {
    //#CHECK DATABASE STATE AND WHETHER PROVIDED POST DATA IS VALID 
    const { text } = req.body;
    var { target, picture } = req.body;
    if (!(db_error === null)) return await responseFunction(res, 500, "ERR_DATABASE_NOT_CONNECTED", null);
    if (!(target && text)) return await responseFunction(res, 412, "ERR_DATA_NOT_PROVIDED", null);

    //#CHANGE STRING OBJECT TO ARRAY OBJECT
    try {
        target = await mongoose.Types.ObjectId(target);
        if (picture) picture = await JSON.parse(picture);
    }
    catch (err) {
        if (err.toString() === "Error: Argument passed in must be a single String of 12 bytes or a string of 24 hex characters")
            return await responseFunction(res, 412, "ERR_TARGET_FORMAT_INVALID", null, err);
        return await responseFunction(res, 412, "ERR_DATA_ARRAY_FORMAT_INVALID", null, err);
    }

    //#VALIDATE WHERE USER JWT TOKEN IS VALID AND ACCPETABLE TO TARGET
    const { jwtuser, jwtbody, jwterror } = await jwtgetUser(req.headers.authorization);
    if (!(jwterror === null)) return await responseFunction(res, 403, jwtbody, null, jwterror);

   //#GET COMMENT OBJECT WHOSE TARGET IS PROVIDED OBJECT ID
    const _comment = await Comment.findOne({
        "_id": target,
        "owner": jwtuser._id,
        "visible": true,
        "suecount": {
            "$lte": 5
        }
    });
    if (!_comment) return await responseFunction(res, 409, "ERR_LOAD_TARGET_COMMENT_FAILED");

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
        if (save_error) return responseFunction(res, 500, "ERR_UPDATE_COMMENT_FAILED", null, save_error);
        return await SAVE_LOG(await responseFunction(res, 200,"SUCCEED_COMMENT_UPDATED"));
    });
});

export default router;