import { Router } from "express";
import { jwtgetUser } from "../jwtgetUser";
import { db_error } from "../../app";
import mongoose from "mongoose";
import Article from "../../models/post/article";
import Comment from "../../models/post/comment";

const router = Router();
router.post ("/", async (req,res) => {
    var _response = { "result" : "ERR_SERVER_FAILED_TEMPORARILY" };

    /**
     * CHECK DATABASE
     */
    if (!(db_error === null)) {
        _response.result = "ERR_DATABASE_NOT_CONNECTED";
        res.status(500).json(_response);
        return;
    }

    /**
     * VERIFY JWT TOKEN
     */
    var { target } = req.body;
    const { userjwt, objectType } = req.body;
    if (!(userjwt && objectType && target)) {
        _response.result = "ERR_DATA_NOT_PROVIDED";
        res.status(412).json(_response);
        return;
    }

    const jwtuser = await jwtgetUser(userjwt);
    if (!jwtuser.user) {
        _response.result = jwtuser.error;
        res.status(401).json(_response);
        return;
    }

    //# SHOULD CODING CHECK-IF-USER-IS-IN-COMMUNITY SYNTAX

    /**
     * GENERATE TARGET OBJECT
     */
    try {
        target = mongoose.Types.ObjectId(target);
    }
    catch (err) {
        console.error(err);
        _response.result = "ERR_TARGET_ID_FORMAT_INVALID";
        _response.error = err.toString();
        res.status(412).json(_response);
        return;
    }
   
    /**
     * GET TARGET OBJECT
     */
    var _editlog = undefined,
        condition = {
            "_id": target,
            "visible": true,
            "suecount": {
                "$lte": 5
            }
        };
    if (objectType === "article") _editlog = await Article.findOne(condition);
    if (objectType === "comment") _editlog = await Comment.findOne(condition);
    if (!_editlog) {
        _response.result = "ERR_ACCESS_TARGET_OBJECT_FAILED";
        res.status(409).json(_response);
        return;
    }

    /**
     * RETURN COMMENT OBJECT TO CLIENT DEPENDS ON ARRAY LENGTH
     */
    _response.result = _editlog.modify.ismodified ? "SUCCEED_EDITLOG_LOADED" : "OBJECT_HAD_NOT_BEEN_MODIFIED";
    _response.count = _editlog.modify.history.length;
    _response.history = _editlog.modify.history;
    res.status(200).json(_response);
});

export default router;