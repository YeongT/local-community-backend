import { Router } from 'express';
import { decode } from 'jsonwebtoken';

const router = Router();

router.get ('/', async (req,res) => {
    /**
     * CHECK WHETHER PROVIDED POST DATA IS VALID
     */
    const { token } = req.query;
    if (!token) {
        res.status(412).send('ERR_DATA_FORMAT_INVALID');
        return;
    } 
    const result = decode(token);
    if (result) {
        result._id = undefined;
        result.__v = undefined;
        res.status(200).send(result);
    }
    else res.status(500).send('ERR_TOKEN_DECODE_FAILED');
});


export default router;