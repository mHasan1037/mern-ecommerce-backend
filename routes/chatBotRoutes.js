import express from 'express';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { chatWithAI } from '../controllers/chatWithAIController.js';

const router = express.Router();

router.post(
    "/chat",
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    chatWithAI
)

export default router;