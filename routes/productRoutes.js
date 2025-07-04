import express from "express";
import {
  createCategory,
  getAllCategories,
  uploadProduct,
  getAllProducts,
  updateProduct,
  getOneProduct,
  deleteProduct,
  createProductReview,
  deleteProductImage,
  getMostSoldProducts,
  getCategoryById,
  updateCategory
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
  getAllCategories
);

router.get(
  "/categories/:id",
  getCategoryById
);

router.put(
  "/categories/:id",
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  adminMiddleware,
  updateCategory
)

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

router.get(
  "/products/most-sold", 
  getMostSoldProducts
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
);

router.delete(
  "/products/delete-image/:publicId",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", {
    session: false
  }),
  deleteProductImage
);



export default router;
