import { Router } from "express";
import { getClientIp } from "request-ip";
import { jwtgetUser } from "../jwtgetUser";
import { db_error } from "../../app";
import { genEditLog } from "../../models/post/recordlog";
import moment from "moment";
import mongoose from "mongoose";
import Comment from "../../models/post/comment";
import postLog from "../../models/post/postlog";

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

    const { userjwt, text } = req.body;
    var { target, picture} = req.body;
    if (!(userjwt && target && text)) {
        _response.result = "ERR_DATA_NOT_PROVIDED";
        res.status(412).json(_response);
        return;
    }

    /**
     * CHANGE STRING OBJECT TO ARRAY OBJECT
     */
    try {
        if (picture) picture = JSON.parse(picture);
    }
    catch (err) {
        console.error(err);
        _response.result = "ERR_DATA_ARRAY_FORMAT_INVALID";
        _response.error = err.toString();
        res.status(412).json(_response);
        return;
    }

    /**
     * VERIFY JWT TOKEN && GET COMMENT OBJECT
     */
    const jwtuser = await jwtgetUser(userjwt);
    if (!jwtuser.user) {
        _response.result = jwtuser.error;
        res.status(401).json(_response);
        return;
    }

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
   
    const _comment = await Comment.findOne({
        "_id": target,
        "owner": jwtuser.user._id,
        "visible": true,
        "suecount": {
            "$lte": 5
        }
    });
    if (!_comment) {
        _response.result = "ERR_LOADING_TARGET_COMMENT_FAILED";
        res.status(409).json(_response);
        return;
    }

    /**
     * SAVE LOG FUNCTION
     */
    const SAVE_LOG = (_response) => {
        const createLog = new postLog ({
            timestamp : moment().format("YYYY-MM-DD HH:mm:ss"), 
            causeby : jwtuser.user.email,
            originip : getClientIp(req),
            category : "MOD_COMMENT",
            details : _comment.content
        });
        createLog.save((err) => {
            if (err) console.error(err);
        });
    };

    /**
     * UPDATE ARTICLE OBJECT USING PREVIOUS OBJECT
     */
    _comment.modify.ismodified = true;
    _comment.modify.history.unshift(genEditLog(_comment.content));
    _comment.content = {
        text,
        picture
    };

    /**
     * SAVE ARTICLE INFO ON DATABASE
     */
    await Comment.updateOne({
        "_id": target
    }, {
        "modify": _comment.modify,
        "content": _comment.content,
        "timestamp" : moment().format("YYYY-MM-DD HH:mm:ss")
    }, async (err) => {
        if (err) {
            _response.result = "ERR_EDIT_COMMENT_FAILED";
            _response.error = err;
            res.status(500).json(_response);
            return;
        }

        _response.result = "SUCCEED_COMMENT_EDITED";
        res.status(200).json(_response);
        SAVE_LOG(_response);
    });
});


export default router;