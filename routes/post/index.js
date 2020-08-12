import { Router } from "express";

const router = Router();

import new_article from "./new_article";
import new_comment from "./new_comment";
import load_articles from "./load_articles";
import load_comments from "./load_comments";
import load_editlogs from "./load_editlogs";
import mod_article from "./mod_article";
import mod_comment from "./mod_comment";

/**
 * RESTFUL API DOES NOT USE UNDERLINE IN URL
 */
router.use("/new-article", new_article);
router.use("/new-comment", new_comment);
router.use("/load-articles", load_articles);
router.use("/load-comments", load_comments);
router.use("/load-editlogs", load_editlogs);
router.use("/mod-article", mod_article);
router.use("/mod-comment", mod_comment);

export default router;
