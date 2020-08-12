import { Router } from "express";
import { decode } from "jsonwebtoken";

const router = Router();

router.get ("/", async (req,res) => {
    var _response = { "result" : "ERR_SERVER_FAILED_TEMPORARILY" };

    /**
     * CHECK WHETHER PROVIDED POST DATA IS VALID
     */
    const { token } = req.query;
    if (!token) {
        _response.result = "ERR_DATA_FORMAT_INVALID";
        res.status(412).json(_response);
        return;
    } 
    const _decode = decode(token);
    if (!_decode) {
        _response.result = "ERR_TOKEN_DECODE_FAILED";
        res.status(500).json(_response);
    }
    else {
        _decode._id = undefined;
        _decode.__v = undefined;
        _response.result = "SUCCEED_TOKEN_DECODED";
        _response.decode = _decode; 
        res.status(200).json(_response);
    }
});


export default router;