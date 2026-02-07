import express from 'express';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import {
  placeOrder,
  getUserOrders,
  getAllOrders,
  cancelOrder,
  getOrderDetails,
  updateOrderStatus,
  placeDirectOrder
} from "../controllers/orderController.js";
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.post(
    "/orders",
    accessTokenAutoRefresh,
    passport.authenticate('jwt', { session: false }),
    placeOrder
);

router.post(
    "/orders/direct",
    accessTokenAutoRefresh,
    passport.authenticate('jwt', { session: false }),
    placeDirectOrder
)

router.get(
   "/orders",
   accessTokenAutoRefresh,
   passport.authenticate("jwt", {session: false }),
   getUserOrders
);

// router.get(
//     "/admin/allUsersOrders",
//     accessTokenAutoRefresh,
//     passport.authenticate("jwt", {session: false }),
//     adminMiddleware,
//     getAllUserOrders
// )

router.get(
   "/admin/orders",
   accessTokenAutoRefresh,
   passport.authenticate("jwt", { session: false }),
   adminMiddleware,
   getAllOrders
);

router.patch(
    "/orders/:id/cancel",
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    cancelOrder
);

router.get(
    "/orders/:id",
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    getOrderDetails
);

router.patch(
    "/admin/orders/:id/status",
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    adminMiddleware,
    updateOrderStatus
)

export default router;