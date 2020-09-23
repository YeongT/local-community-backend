import { Router } from "express";
import jwtVerify from "../jwtauth/jwtVerify";
import responseFunction from "../coms/apiResponse";

const router = Router();

router.get ("/:accessToken", async (req,res) => {
    //#CHECK WHETHER PROVIDED POST DATA IS VALID
    const { accessToken } = req.params;
    if (!accessToken) return await responseFunction(res, 412, "ERR_DATA_FORMAT_INVALID");
    
    const { jwtdecode , tokenerror } = await jwtVerify(accessToken);
    if (tokenerror !== null) return await responseFunction(res, 500, "ERR_TOKEN_DECODE_FAILED", null, tokenerror);
    if (jwtdecode.decodable === false) return await responseFunction(res, 500, "ERR_REFRESH_TOKEN_DECODE_DENINED", null, null);

    jwtdecode._id = undefined;
    return await responseFunction(res, 200, "SUCCEED_TOKEN_DECODED", {"decode":jwtdecode});
});

export default router;