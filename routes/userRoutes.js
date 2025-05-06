import express from "express";
import {
  userRegistration,
  verifyEmail,
  userLogin,
  userProfile,
  getUserProfileById,
  userLogout,
  changeUserPassword,
  sendUserPasswordResetEmail,
  userPasswordReset
} from "../controllers/userController.js";
import passport from "passport";
import accessTokenAutoRefresh from "../middlewares/accessTokenAutoRefresh.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.post("/register", userRegistration);
router.post("/verify-email", verifyEmail);
router.post("/login", userLogin);
router.post("/reset-password-link", sendUserPasswordResetEmail);
router.post("/reset-password/:id/:token", userPasswordReset);

router.get(
  "/me",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {session: false,}),
  userProfile
);

router.get(
  "/:id/profile",
  accessTokenAutoRefresh, 
  passport.authenticate("jwt", { session: false }),
  adminMiddleware, 
  getUserProfileById
)

router.get(
  "/admin-dashboard",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {
    session: false,
  }),
  adminMiddleware,
  (req, res) => {
    res.json({ status: "success", message: "Welcome, Admin!" });
  }
);

router.post(
  '/change-password',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {
    session: false,
  }),
  changeUserPassword
);

router.post(
  "/logout",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {
    session: false,
  }),
  userLogout
);

export default router;
