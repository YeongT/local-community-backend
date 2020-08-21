import { Router } from "express";
import { jwtgetUser } from "../jwtgetUser";
import { db_error } from "../../app";
import mongoose from "mongoose";
import Comment from "../../models/post/comment";

const router = Router();
router.post ("/", async (req,res) => {
    var _response = { "result" : "ERR_SERVER_FAILED_TEMPORARILY" };

    /**
     * CHECK DATABASE
     */
    if (!(db_error == null)) {
        _response.result = "ERR_DATABASE_NOT_CONNECTED";
        res.status(500).json(_response);
        return;
    }

    /**
     * VERIFY JWT TOKEN
     */
    var { target } = req.body;
    const { userjwt } = req.body;
    if (!(userjwt && target)) {
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
     * GET COMMENT OBJECT WHOSE TARGET IS PROVIDED ID 
     * REMOVE USELESS FILED TO SAVE TRAFFIC
     */
    const _comment = await Comment.find({
        "target": target,
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
    if (!_comment) {
        _response.result = "ERR_LOADING_TARGET_COMMENT";
        res.status(500).json(_response);
        return;
    }

    /**
     * RETURN COMMENT OBJECT TO CLIENT DEPENDS ON ARRAY LENGTH
     */
    _response.result = _comment.length ? "SUCCEED_COMMENTS_LOADED" : "COULD_NOT_FOUND_ANY_COMMENT";
    _response.count = _comment.length;
    _response.comments = _comment;
    res.status(200).json(_response);
});

export default router;