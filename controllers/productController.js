import mongoose from "mongoose";
import CategoryModel from "../models/Category.js";
import ProductModel from "../models/Product.js";
import cloudinary, { safeDestroy } from "../utils/cloudinary.js";
import OrderModel from "../models/Order.js";
import { findProducts } from "../services/product.service.js";
import {
  MAX_FEATURED_PRODUCTS,
  PRODUCT_UPDATABLE_FIELDS,
} from "../utils/constants.js";

export const createCategory = async (req, res) => {
  let image;
  try {
    const { name, description, parentCategory } = req.body;
    image = req.body.image;

    const existingCategory = await CategoryModel.findOne({ name, isDeleted: false });
    if (existingCategory) {
      if (image?.public_id) await safeDestroy(image.public_id);
      return res.status(400).json({
        message: "Category already exists",
      });
    }

    if (parentCategory) {
      if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
        if (image?.public_id) await safeDestroy(image.public_id);
        return res.status(400).json({
          message: "Invalide parent category",
        });
      }

      const parentExists = await CategoryModel.findById(parentCategory);
      if (!parentExists) {
        if (image?.public_id) await safeDestroy(image.public_id);
        return res.status(404).json({ message: "Parent category not found" });
      }
    }

    const newCategory = new CategoryModel({
      name,
      description,
      parentCategory: parentCategory || null,
      image: image || null,
    });
    await newCategory.save();

    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    if (image?.public_id) await safeDestroy(image.public_id);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const allCategories = await CategoryModel.find({ isDeleted: false })
      .populate("parentCategory", "name")
      .exec();

    if (allCategories.length === 0) {
      return res.status(404).json({
        message: "Categories not found",
      });
    }

    res.status(200).json({
      message: "All categories",
      categories: allCategories,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await CategoryModel.findById(id).populate(
      "parentCategory",
      "name _id",
    );

    if (!category || category.isDeleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category found", category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  const updateData = { ...req.body };
  if (updateData.parentCategory === "") updateData.parentCategory = null;

  try {
    const existingCategory = await CategoryModel.findById(id);
    if (!existingCategory) {
      if (updateData.image?.public_id)
        await safeDestroy(updateData.image.public_id);
      return res.status(404).json({ message: "Category not found" });
    }

    const oldPublicImageId = existingCategory.image?.public_id;
    const newPublicImageId = updateData.image?.public_id;

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (
      oldPublicImageId &&
      newPublicImageId &&
      oldPublicImageId !== newPublicImageId
    ) {
      await safeDestroy(oldPublicImageId);
    }

    res
      .status(200)
      .json({ message: "Category updated", category: updatedCategory });
  } catch (error) {
    if (updateData.image?.public_id) await safeDestroy(updateData.image.public_id);
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { reassignTo } = req.body;

    const category = await CategoryModel.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const productCount = await ProductModel.countDocuments({ category: id });

    if (productCount > 0) {
      if (!reassignTo) {
        return res.status(409).json({
          message:
            "This category has products. Reassign category to a different category first.",
          productCount,
        });
      }

      if (reassignTo === id) {
        return res.status(400).json({
          message: "Cannot reassign products to the category being deleted.",
        });
      }

      const targetExists = await CategoryModel.exists({
        _id: reassignTo,
        isDeleted: false,
      });
      if (!targetExists) {
        return res.status(400).json({
          message: "Target category invalid",
        });
      }

      await ProductModel.updateMany(
        { category: id },
        { $set: { category: reassignTo } },
      );
    }

    if (category.image?.public_id) {
      try {
        await cloudinary.uploader.destroy(category.image.public_id);
      } catch (err) {
        console.warn("Failed to delete category image:", err);
      }
    }
    
    await CategoryModel.findByIdAndUpdate(id, { isDeleted: true });

    return res
      .status(200)
      .json({ message: "Category deleted and products reassigned" });
  } catch (err) {
    return res.status(500).json({
      message: "Server error while deleting category",
      error: err.message,
    });
  }
};

export const uploadProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      images,
      is_featured,
      featured_order,
    } = req.body;

    const priceNum = Number(price);
    const stockNum = Number(stock);

    if (
      !name ||
      !description ||
      !category ||
      price === undefined ||
      price === "" ||
      isNaN(priceNum) ||
      priceNum < 0 ||
      stock === undefined ||
      stock === "" ||
      isNaN(stockNum) ||
      stockNum < 0 ||
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Missing or invalid required fields" });
    }

    const categoryQuery = mongoose.Types.ObjectId.isValid(category)
      ? { $or: [{ _id: category }, { slug: category }], isDeleted: false }
      : { slug: category, isDeleted: false };

    const existingCategory = await CategoryModel.findOne(categoryQuery);

    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found or deleted",
      });
    }

    if (is_featured === true) {
      const featuredCount = await ProductModel.countDocuments({
        is_featured: true,
      });
      if (featuredCount >= MAX_FEATURED_PRODUCTS) {
        return res.status(400).json({
          message: `Cannot feature product. Max of ${MAX_FEATURED_PRODUCTS} featured products reached. Unfeature one first.`,
        });
      }
    }

    const formattedImages = images.map((img) => ({
      url: img.url,
      altText: img.altText || "",
      public_id: img.public_id || null,
    }));

    const newProduct = new ProductModel({
      name,
      description,
      price: priceNum,
      category: existingCategory._id,
      stock: stockNum,
      images: formattedImages,
      is_featured: !!is_featured,
      featured_order: featured_order || 0,
      featured_at: is_featured ? new Date() : null,
    });

    await newProduct.save();

    return res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Upload product error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const result = await findProducts(req.query);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const body = req.body;

    const updatedData = {};

    for (const field of PRODUCT_UPDATABLE_FIELDS) {
      if (body[field] !== undefined) {
        updatedData[field] = body[field];
      }
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    if (updatedData.price !== undefined) {
      const priceNum = Number(updatedData.price);
      if (updatedData.price === "" || isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ message: "Invalid price" });
      }
      updatedData.price = priceNum;
    }

    if (updatedData.stock !== undefined) {
      const stockNum = Number(updatedData.stock);
      if (updatedData.stock === "" || isNaN(stockNum) || stockNum < 0) {
        return res.status(400).json({ message: "Invalid stock" });
      }
      updatedData.stock = stockNum;
    }

    if (updatedData.category) {
      const categoryQuery = mongoose.Types.ObjectId.isValid(
        updatedData.category,
      )
        ? {
            $or: [
              { _id: updatedData.category },
              { slug: updatedData.category },
            ],
            isDeleted: false,
          }
        : { slug: updatedData.category, isDeleted: false };

      const categoryExists = await CategoryModel.findOne(categoryQuery);
      if (!categoryExists) {
        return res
          .status(404)
          .json({ message: "Category not found or deleted" });
      }
      updatedData.category = categoryExists._id;
    }

    if (updatedData.images) {
      if (
        !Array.isArray(updatedData.images) ||
        updatedData.images.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Images must be a non-empty array" });
      }
      updatedData.images = updatedData.images.map((img) => ({
        url: img.url,
        altText: img.altText || "",
        public_id: img.public_id || null,
      }));
    }

    if (updatedData.is_featured === true) {
      const current =
        await ProductModel.findById(productId).select("is_featured");
      if (!current) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (!current.is_featured) {
        const featuredCount = await ProductModel.countDocuments({
          is_featured: true,
        });
        if (featuredCount >= MAX_FEATURED_PRODUCTS) {
          return res.status(400).json({
            message: `Cannot feature product. Max of ${MAX_FEATURED_PRODUCTS} featured products reached.`,
          });
        }
      }
      updatedData.featured_at = new Date();
    }

    if (updatedData.is_featured === false) {
      updatedData.featured_at = null;
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      updatedData,
      { new: true, runValidators: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    };
    console.log('updatedProduct', updatedProduct)

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

export const getOneProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await ProductModel.findById(productId)
      .populate("category", "name slug")
      .populate("reviews.user", "name")
      .exec();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const deleteProduct = await ProductModel.findById(productId);

    if (!deleteProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    for (const img of deleteProduct.images) {
      if (img.public_id) {
        try {
          await cloudinary.uploader.destroy(img.public_id);
        } catch (err) {
          console.warn("Failed to delete img");
        }
      }
    }

    await ProductModel.findByIdAndDelete(productId);

    return res.status(200).json({
      message: "Product delete successfully",
      product: deleteProduct,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error while deleting product",
      error: err.message,
    });
  }
};

export const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user._id;
    const userName = req.user.name;

    if (!rating && !comment) {
      return res.status(400).json({
        message: "Please provide a rating or a commnet",
      });
    }
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString(),
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    const newReview = {
      user: userId,
      name: userName,
    };

    if (rating) newReview.rating = Number(rating);
    if (comment) newReview.comment = comment;

    product.reviews.push(newReview);
    product.ratings.totalReviews = product.reviews.length;

    const reviewsWithRating = product.reviews.filter(
      (r) => typeof r.rating === "number" && !isNaN(r.rating),
    );

    product.ratings.average =
      reviewsWithRating.length > 0
        ? reviewsWithRating.reduce((acc, r) => acc + r.rating, 0) /
          reviewsWithRating.length
        : 0;

    await product.save();

    return res.status(201).json({
      message: "Review added successfully",
      product,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const publicId = req.params.publicId;

    if (!publicId) {
      return res.status(400).json({
        message: "Missing public_id",
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      return res.status(500).json({
        message: "Failed to delete image",
      });
    }

    return res.status(200).json({
      message: "Image deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getMostSoldProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const bestSellers = await OrderModel.aggregate([
      { $match: { status: "delivered" } },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          totalSold: { $sum: "$orderItems.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          totalSold: 1,
          product: 1,
        },
      },
    ]);

    return res.status(200).json({
      count: bestSellers.length,
      products: bestSellers.map((item) => ({
        ...item.product,
        totalSold: item.totalSold,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch most sold products",
      error: err.message,
    });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await ProductModel.find({ is_featured: true })
       .populate("category", "name slug")
      .sort({ featured_order: 1, featured_at: -1 })
      .limit(MAX_FEATURED_PRODUCTS)
      .exec();
    return res.status(200).json({
      products,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch featured products",
      error: err.message,
    });
  }
};
