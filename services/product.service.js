
import CategoryModel from "../models/Category.js";
import ProductModel from "../models/Product.js";


export const findProducts = async ({
  search,
  category,
  minPrice,
  maxPrice,
  sort = "newest",
  page = 1,
  limit = 20,
  is_featured
}) => {
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  if (category) {
    const categoryDoc = await CategoryModel.findOne({
      $or: [{ _id: category }, { slug: category }],
      isDeleted: false
    });
    if (categoryDoc) query.category = categoryDoc._id;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (is_featured !== undefined) {
    query.is_featured = is_featured === "true" || is_featured === true;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortOption = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 }
  }[sort] || { createdAt: -1 };

  const products = await ProductModel.find(query)
    .populate("category", "name slug")
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit))
    .exec();

  const total = await ProductModel.countDocuments(query);

  return { total, page: Number(page), pages: Math.ceil(total / Number(limit)), products };
};