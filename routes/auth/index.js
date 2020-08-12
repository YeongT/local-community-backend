import { Router } from "express";
import signup from "./signup";
import login from "./login";
import active from "./active";
import jwtdecode from "./jwtdecode";

const router = Router();

router.use("/signup",signup);
router.use("/active",active);
router.use("/login",login);
router.use("/jwtdecode",jwtdecode);

export default router;