import { Router } from "express";
import { jwtgetUser } from "../jwtauth/jwtgetUser";
import { db_error } from "../../app";
import mongoose from "mongoose";
import responseFunction from "../coms/apiResponse";
import Article from "../../models/post/article";

const router = Router();
router.get ("/:target", async (req,res) => {
    //#CHECK DATABASE STATE AND WHETHER PROVIDED POST DATA IS VALID 
    var { target } = req.params;
    if (db_error !== null) return await responseFunction(res, 500, "ERR_DATABASE_NOT_CONNECTED", null);
    if (!target) return await responseFunction(res, 412, "ERR_DATA_NOT_PROVIDED", null);

    //#VALIDATE WHERE USER JWT TOKEN IS VALID AND ACCPETABLE TO TARGET
    const { jwtbody, jwterror } = await jwtgetUser(req, req.headers.authorization);
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
     * GET ARTICLE OBJECT WHOSE TARGET IS PROVIDED OBJECT ID
     * REMOVE USELESS FILED TO SAVE TRAFFIC
     */
    const _article = await Article.find({
        "target.community": target,
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
    if (!_article) return await responseFunction(res, 500, "ERR_LOADING_TARGET_ARTICLES_FAILED", null, _article);
    
    //RETURN COMMENT OBJECT TO CLIENT DEPENDS ON ARRAY LENGTH
    return await responseFunction(res, 200, _article.length ? "SUCCEED_ARTICLES_LOADED" : "COULD_NOT_FOUND_ANY_ARTICLE", {
        "count": _article.length,
        "articles": _article
    });
});

export default router;