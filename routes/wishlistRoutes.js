import express from 'express';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { addToWishlist, clearWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlistController.js';

const router = express.Router();

router.post(
    "/wishlist/:productId",
    accessTokenAutoRefresh,
    passport.authenticate("jwt", {session: false}),
    addToWishlist
);

router.delete(
  "/wishlist/:productId",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  removeFromWishlist
);

router.delete(
  "/wishlist",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  clearWishlist
)

router.get(
   "/wishlist",
   accessTokenAutoRefresh,
   passport.authenticate("jwt", { session: false }),
   getWishlist
);

export default router;