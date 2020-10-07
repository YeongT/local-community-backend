import { Router } from "express";
import jwtgetUser from "../jwtauth/jwtgetUser";
import jwtRefresh from "../jwtauth/jwtRefresh";
import { db_error } from "../../app";
import mongoose from "mongoose";
import responseFunction from "../coms/apiResponse";
import Comment from "../../models/post/comment";

const router = Router();
router.get ("/:target", async (req,res) => {
    //#CHECK DATABASE STATE AND WHETHER PROVIDED POST DATA IS VALID 
    var { target } = req.params;
    if (db_error !== null) return await responseFunction(res, 500, "ERR_DATABASE_NOT_CONNECTED", null);
    if (!target) return await responseFunction(res, 412, "ERR_DATA_NOT_PROVIDED", null);

    //#REFRESH ACCESS TOKEN USING REFRESH TOKEN WHEN REFRESH TOKEN PROVIDED
    if (req.headers.refreshToken) {
        const { newtoken, tokenerror } = await jwtRefresh(req, req.headers.authorization, req.headers.refreshToken);
        if (tokenerror !== null) return await responseFunction(res, 403, "ERR_JWT_AUTHENTIFCATION_FAILED", null, tokenerror);
        else req.headers.authorization = newtoken;
    }

    //#VALIDATE WHERE USER JWT TOKEN IS VALID AND ACCPETABLE TO TARGET
    const { jwtbody, jwterror } = await jwtgetUser(req, req.headers.authorization, {"type":"comment", target});
    if (jwterror !== null) return await responseFunction(res, 403, jwtbody, null, jwterror);

    //#GENERATE RESPONSE OUTPUT OBJECT
    try {
        target = mongoose.Types.ObjectId(target);
    }
    catch (parseerr) 
    {
       return await responseFunction(res, 412, "ERR_TARGET_ID_FORMAT_INVALID", null, parseerr);
    }
   
    /**
     * GET COMMENT OBJECT WHOSE TARGET IS PROVIDED ID 
     * REMOVE USELESS FILED TO SAVE TRAFFIC
     */
    const _comment = await Comment.find({
        "target.article": target,
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
    if (!_comment) return await responseFunction(res, 500, "ERR_LOADING_TARGET_COMMENTS_FAILED", null, _comment);

    //RETURN COMMENT OBJECT TO CLIENT DEPENDS ON ARRAY LENGTH
    return await responseFunction(res, 200, _comment.length ? "SUCCEED_COMMENTS_LOADED" : "COULD_NOT_FOUND_ANY_COMMENT", {
        "count": _comment.length,
        "articles": _comment
    });
});

export default router;