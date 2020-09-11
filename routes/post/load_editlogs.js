import { Router } from "express";
import { jwtgetUser } from "../coms/jwtgetUser";
import { db_error } from "../../app";
import mongoose from "mongoose";
import responseFunction from "../coms/apiResponse";
import Article from "../../models/post/article";
import Comment from "../../models/post/comment";

const router = Router();
router.get ("/:objectType/:target", async (req,res) => {
    //#CHECK DATABASE STATE AND WHETHER PROVIDED POST DATA IS VALID 
    var { objectType, target } = req.params;
    if (!(db_error === null)) return await responseFunction(res, 500, "ERR_DATABASE_NOT_CONNECTED", null);
    if (!(objectType && target)) return await responseFunction(res, 412, "ERR_DATA_NOT_PROVIDED", null);

    //#VALIDATE WHERE USER JWT TOKEN IS VALID AND ACCPETABLE TO TARGET
    const { jwtbody, jwterror } = await jwtgetUser(req.headers.authorization);
    if (!(jwterror === null)) return await responseFunction(res, 403, jwtbody, null, jwterror);

    //#GENERATE RESPONSE OUTPUT OBJECT
    try {
        target = await mongoose.Types.ObjectId(target);
    }
    catch (parseerr) 
    {
       return await responseFunction(res, 412, "ERR_TARGET_ID_FORMAT_INVALID", null, parseerr);
    }
   
    //#GENERATE RESPONSE OBJECT && GET TARGET OBJECT
    var _editlog, condition = {
            "_id": target,
            "visible": true,
            "suecount": {
                "$lte": 5
            }
        };
    if (objectType === "article") _editlog = await Article.findOne(condition);
    if (objectType === "comment") _editlog = await Comment.findOne(condition);
    if (!_editlog) return await responseFunction(res, 409, "ERR_ACCESS_TARGET_OBJECT_FAILED", null, _editlog);

    //RETURN EDITLOG OBJECT TO CLIENT DEPENDS ON ISMODIFIED
    return await responseFunction(res, 200, _editlog.modify.ismodified ? "SUCCEED_EDITLOG_LOADED" : "OBJECT_HAD_NOT_BEEN_MODIFIED", {
        "count": _editlog.modify.history.length,
        "history": _editlog.modify.history
    });
});

export default router;