import { Router } from "express";
import { decode } from "jsonwebtoken";
import responseFunction from "../coms/apiResponse";

const router = Router();

router.get ("/", async (req,res) => {
    //#CHECK WHETHER PROVIDED POST DATA IS VALID
    const { token } = req.query;
    if (!token) return await responseFunction(res, 412, "ERR_DATA_FORMAT_INVALID");
    
    const _decode = decode(token);
    if (!_decode) return await responseFunction(res, 500, "ERR_TOKEN_DECODE_FAILED", null, _decode);
    
    _decode._id = undefined;
    return await responseFunction(res, 200, "SUCCEED_TOKEN_DECODED", {"decode":_decode});
});

export default router;