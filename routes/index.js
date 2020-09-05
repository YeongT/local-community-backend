import { Router } from "express";
import YAML from "yamljs";
import moment from "moment";
import timezone from "moment-timezone";
import swaggerJSDoc from "swagger-jsdoc";
import { join as pathJoin } from "path";
import { serve as swServe, setup as swSetup} from "swagger-ui-express";


const router = Router();

import auth from "./auth";
import list from "./list";
import post from "./post";

router.use("/auth",auth);
router.use("/list",list);
router.use("/post",post);

const swaggerDefinition = YAML.load(pathJoin(__dirname, "swagger.yaml"));
const options = {
    swaggerDefinition,
    apis: ["./auth/index.js", "./list/index.js", "./index.js"]
};

moment.tz.setDefault("Asia/Seoul");
router.use("/docs", swServe, swSetup(swaggerJSDoc(options)));
router.get("/", (req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write("<title>Local Community API Server</title>");
    res.write("<link rel=\"icon\" href=\"https://dev.hakbong.me/common/icon.png\">");
    res.write("Welcome!<br>This is API Server of Hakbong<br><br>");
    res.end("API Document is <a href=\"https://api.hakbong.me/docs\">HERE</a>");
});

export default router;