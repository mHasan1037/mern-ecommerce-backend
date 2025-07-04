import mongoose, { mongo } from "mongoose";
import CategoryModel from "../models/Category.js";
import ProductModel from "../models/Product.js";
import cloudinary from "../utils/cloudinary.js";
import OrderModel from "../models/Order.js";

export const createCategory = async (req, res) =>{
    try{
        const {name, description, parentCategory, image} = req.body;

        if (!image || !image.url || !image.public_id) {
            return res.status(400).json({ message: "Image is required" });
        }

        const existingCategory = await CategoryModel.findOne({name});
        if(existingCategory){
            return res.status(400).json({
                message: 'Category already exists'
            })
        }

        if (parentCategory) {
            if(!mongoose.Types.ObjectId.isValid(parentCategory)){
                return res.status(400).json({
                    message: "Invalide parent category"
                })
            };

            const parentExists = await CategoryModel.findById(parentCategory);
            if (!parentExists) {
                return res.status(404).json({ message: "Parent category not found" });
            }
        }

        const newCategory = new CategoryModel({name, description, parentCategory: parentCategory || null, image});
        await newCategory.save();

        res.status(201).json({
            message: "Category created successfully", category: newCategory
        })
    }catch(error){
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const getAllCategories = async (req, res) =>{
    try{
       const allCategories = await CategoryModel.find({ isDeleted: false })
        .populate("parentCategory", "name")
        .exec();

       if(allCategories.length === 0){
        return res.status(404).json({
            message: 'Categories not found'
        })
       }

       res.status(200).json({
        message: 'All categories',
        categories: allCategories
       })
    }catch(error){
       res.status(500).json({
        message: 'Something went wrong'
       })
    }
}

export const getCategoryById = async (req, res) =>{
    try{
        const {id} = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ message: "Invalid category ID"})
        };

        const category = await CategoryModel.findById(id).populate("parentCategory", "name _id");

        if(!category || category.isDeleted){
            return res.status(404).json({ message: "Category not found"});
        }
        
        res.status(200).json({ message: "Category found", category});
    }catch (error){
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

export const updateCategory = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  try {
    const updateData = { ...req.body };

    if (updateData.parentCategory === "") {
        updateData.parentCategory = null;
    }

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id, updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res
      .status(200)
      .json({ message: "Category updated", category: updatedCategory });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadProduct = async (req, res) =>{
    try {
        const {
           name,
           description,
           price,
           category,
           stock,
           images,
           is_featured,
        } = req.body;

    if(!name || !description ||  !price || !category || !stock || !Array.isArray(images) || images.length === 0 || !is_featured === undefined){
        return res.status(400).json({
            message: 'Missing required fields'
        })
    }

    const existingCategory = await CategoryModel.findOne({
        $or: [{_id: category}, {slug: category}],
        isDeleted: false,
    })

    if(!existingCategory){
        return res.status(404).json({
            message: "Category not found or deleted"
        });
    }

    const formattedImages = images.map((img) =>({
        url: img.url,
        altText: img.altText || "",
        public_id: img.public_id || null,
    }))

    const newProduct = new ProductModel({
        name,
        description,
        price,
        category: existingCategory._id,
        stock,
        images: formattedImages,
        is_featured,
    });
    
    await newProduct.save();

    return res.status(201).json({
        message: "Product created successfully",
        product: newProduct,
    })

    } catch (error) {
        console.error("Upload product error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });        
    }
}

export const getAllProducts = async (req, res) =>{
    try{
        const {
           category,
           search,
           minPrice,
           maxPrice,
           sort="newest",
           page = 1,
           limit = 20,
           is_featured
        } = req.query;

        const query = {};

        if(search){
           query.$or = [
            {name: {$regex: search, $options: "i"}},
            {description: {$regex: search, $options: "i"}}
           ]
        }

        if(category){
            const categoryDoc = await CategoryModel.findOne({
                $or: [{_id: category}, {slug: category}],
                isDeleted: false
            });

            if(categoryDoc){
                query.category = categoryDoc._id;
            }
        }

        if(minPrice || maxPrice){
            query.price = {};
            if(minPrice) query.price.$gte = Number(minPrice);
            if(maxPrice) query.price.$lte = Number(maxPrice);
        }

        if(is_featured !== undefined){
            query.is_featured = is_featured === "true";
        }

        const skip = (Number(page) - 1) * Number(limit);

        const sortOption = {
            "newest" : { createdAt: -1},
            "price_asc": {price: 1},
            "price_desc": {price: -1}
        }[sort] || {createdAt: -1};

        const products = await ProductModel.find(query)
            .populate("category", "name slug")
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit))
            .exec();
        
        const total = await ProductModel.countDocuments(query);

        return res.status(200).json({
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            products
        });

    }catch(err){
        res
        .status(500)
        .json({
            message: "Failed to fetch products",
            error: err.message
        })
    }
}


export const updateProduct = async (req, res) =>{
    try{
       const productId = req.params.id;
       const updatedData = req.body;

       if(updatedData.category){
         const categoryExists = await CategoryModel.findOne({
            $or: [{_id: updatedData.category}, {slug: updatedData.category}],
            isDeleted: false
         })

         if(!categoryExists){
            return res.status(404).json({message: "Category not found or deleted"})
         }
         updatedData.category = categoryExists._id;
       }

       const updatedProduct = await ProductModel.findByIdAndUpdate(
        productId,
        updatedData,
        {new: true, runValidators: true}
       )

       if(!updatedProduct){
        return res.status(404).json({
            message: "Product not found"
        })
       }

       return res.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct
       })
    }catch(err){
       return res.status(500).json({
        message: "Server error",
        error: err.message
       })
    }
}

export const getOneProduct = async (req, res) =>{
    try{
       const productId = req.params.id;

       const product = await ProductModel.findById(productId)
         .populate("category", "name slug")
         .populate("reviews.user", "name")
         .exec();

       if(!product){
        return res.status(404).json({ message: "Product not found"})
       }

       return res.status(200).json({
        message: "Product fetched successfully",
        product
       })
    }catch(err){
        return res.status(500)
        .json({
            message: "Server error",
            error: err.message
        })
    }
}

export const deleteProduct = async (req, res) =>{
    try{
       const productId = req.params.id;

       const deleteProduct = await ProductModel.findById(productId);

       if(!deleteProduct){
        return res.status(404).json({
            message: "Product not found"
        })
       };

       for(const img of deleteProduct.images){
        if(img.public_id){
            try{
              await cloudinary.uploader.destroy(img.public_id);
            }catch(err){
              console.warn("Failed to delete img")
            }
        }
       }

       await ProductModel.findByIdAndDelete(productId);

       return res.status(200).json({
        message: "Product delete successfully",
        product: deleteProduct
       });

    }catch(err){
       return res.status(500).json({
        message: "Server error while deleting product",
        error: err.message
       })
    }
}

export const createProductReview = async (req, res) =>{
    try{
       const {rating, comment} = req.body;
       const productId = req.params.id;
       const userId = req.user._id;
       const userName = req.user.name;

       if(!rating && !comment){
         return res.status(400).json({
            message: "Please provide a rating or a commnet"
         })
       }
       const product = await ProductModel.findById(productId);

       if(!product){
        return res.status(404).json({
            message: "Product not found"
        })
       };

       const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === userId.toString()
       );

       if(alreadyReviewed){
        return res.status(400).json({
            message: "You have already reviewed this product"
        })
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
        (r) => typeof r.rating === "number" && !isNaN(r.rating)
       );

       product.ratings.average = 
        reviewsWithRating.length > 0
        ? reviewsWithRating.reduce((acc, r) => acc + r.rating, 0) / reviewsWithRating.length
        : 0;

       await product.save();

       return res.status(201).json({
        message: "Review added successfully",
        product
       });
    }catch(err){
       return res.status(500).json({
        message: "Server error",
        error: err.message
       })
    }
};

export const deleteProductImage = async (req, res) => {
    try{
        const publicId = req.params.publicId;

        if(!publicId){
            return res.status(400).json({
                message: "Missing public_id"
            })
        };

        const result = await cloudinary.uploader.destroy(publicId);

        if(result.result !== "ok"){
            return res.status(500).json({
                message: "Failed to delete image"
            })
        }

        return res.status(200).json({
            message: "Image deleted successfully"
        });
    }catch(error){
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

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

