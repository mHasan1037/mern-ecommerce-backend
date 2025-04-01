import express from "express";
import {
  createCategory,
  getAllCategories,
  uploadProduct,
  getAllProducts,
  updateProduct,
  getOneProduct,
  deleteProduct,
  createProductReview
} from "../controllers/productController.js";
import passport from "passport";
import accessTokenAutoRefresh from "../middlewares/accessTokenAutoRefresh.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.post(
  "/categories",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {
    session: false,
  }),
  adminMiddleware,
  createCategory
);

router.get(
  "/categories",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {
    session: false,
  }),
  adminMiddleware,
  getAllCategories
);

router.post(
  "/upload-product",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {
    session: false,
  }),
  adminMiddleware,
  uploadProduct
);

router.get(
  "/products",
  getAllProducts
);

router.put(
  "/products/:id",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {
    session: false,
  }),
  adminMiddleware,
  updateProduct
);

router.get(
  "/products/:id",
  getOneProduct
)

router.delete(
  "/products/:id",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {
    session: false,
  }),
  adminMiddleware,
  deleteProduct
)

router.post(
  "/products/:id/review",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {
    session: false
  }),
  createProductReview
)



export default router;
