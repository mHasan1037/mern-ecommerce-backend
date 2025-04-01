import express from  'express';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import adminMiddleware from '../middlewares/adminMiddleware.js';
import { adminDashboard } from '../controllers/adminDashboard.js';

const router = express.Router();

router.get(
  "/admin/summary",
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  adminMiddleware,
  adminDashboard
);

export default router;