import { Router } from "express";
import { getClientIp } from "request-ip";
import { jwtgetUser } from "../coms/jwtgetUser";
import { db_error } from "../../app";
import responseFunction from "../coms/apiResponse";
import mongoose from "mongoose";
import moment from "moment";
import Comment from "../../models/post/comment";
import postLog from "../../models/post/postlog";

const router = Router();
router.put ("/", async (req,res) => {
    //#CHECK DATABASE STATE AND WHETHER PROVIDED POST DATA IS VALID 
    const { text } = req.body;
    var { target, picture } = req.body;
    if (!(db_error === null)) return await responseFunction(res, 500, "ERR_DATABASE_NOT_CONNECTED");
    if (!(target && text)) return await responseFunction(res, 412, "ERR_DATA_NOT_PROVIDED");

    //#VALIDATE TARGET OBJECT ID && CHANGE STRING OBJECT TO ARRAY OBJECT
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

    //#GENERATE COMMENT OBJECT
    const postComment = new Comment({
        timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
        target,
        content: {
            text,
            picture
        },
        owner: jwtuser._id
    });

    //#SAVE LOG FUNCTION
    const SAVE_LOG = async (_response) => {
        const createLog = new postLog ({
            timestamp : moment().format("YYYY-MM-DD HH:mm:ss"), 
            causeby : jwtuser.email,
            originip : getClientIp(req),
            category : "NEW_COMMENT",
            details : postComment.content,
            result : _response
        });
        await createLog.save(async (err) => {
            if (err) console.error(err);
        });
    };

    //#SAVE COMMENT INFO ON DATABASE
    await postComment.save(async (save_error) => {
        if (save_error) return await responseFunction(res, 500, "ERR_POST_NEW_COMMENT_FAIELD", null, save_error);
        return await SAVE_LOG(await responseFunction(res, 200, "SUCCEED_NEW_COMMENT_POSTED"));
    });
});

export default router;