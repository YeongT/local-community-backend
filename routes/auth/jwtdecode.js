import { Router } from "express";
import { decode } from "jsonwebtoken";

const router = Router();

router.get ("/", async (req,res) => {
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

    //#CHECK WHETHER PROVIDED POST DATA IS VALID
    const { token } = req.query;
    if (!token) return await responseFunction(412, {"msg":"ERR_DATA_FORMAT_INVALID"}, null);
    
    const _decode = decode(token);
    if (!_decode) return await responseFunction(500, {"msg":"ERR_TOKEN_DECODE_FAILED"}, null, _decode);
    
    _decode._id = undefined;
    await responseFunction(200, {"msg":"SUCCEED_TOKEN_DECODED"}, _decode);
});

export default router;