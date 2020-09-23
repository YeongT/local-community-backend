import { Router } from "express";
import jwtdecode from "./jwtdecode";

const router = Router();
router.use ("/decode",jwtdecode);

export default router;
