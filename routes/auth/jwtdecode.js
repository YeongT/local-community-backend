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
    res.status(result ? 200 : 500).send(result);
});


export default router;