import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  deleteCartItem,
  clearCart
} from "../controllers/cartController.js";
import accessTokenAutoRefresh from "../middlewares/accessTokenAutoRefresh.js";
import passport from "passport";

const router = express.Router();

router.post(
  "/cart",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  addToCart
);

router.get(
    "/cart",
    accessTokenAutoRefresh,
    passport.authenticate("jwt", {session: false}),
    getCart
);

router.put(
   "/cart/:productId",
   accessTokenAutoRefresh,
   passport.authenticate("jwt", {session: false}),
   updateCartItem
);

router.delete(
  "/cart/:productId",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {session: false}),
  deleteCartItem
)

router.delete(
  "/cart",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {session: false}),
  clearCart
)

export default router;
