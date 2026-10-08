
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



export const searchProductsForAIChat = async ({
  search,
  keywords = [],
  minPrice,
  maxPrice,
  limit = 5,
}) => {
  const original = (search ?? "").trim();
  const expanded = [
    ...new Set(keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean)),
  ].filter((k) => k !== original.toLowerCase());

  const should = [];

  if (original) {
    should.push(
      { text: { query: original, path: "name", fuzzy: { maxEdits: 1 }, score: { boost: { value: 5 } } } },
      { text: { query: original, path: "description", fuzzy: { maxEdits: 1 }, score: { boost: { value: 2 } } } }
    );
  }

  for (const k of expanded) {
    should.push(
      { phrase: { query: k, path: "name", score: { boost: { value: 3 } } } },
      { phrase: { query: k, path: "description", score: { boost: { value: 1 } } } }
    );
  }

  if (!should.length) return { products: [], total: 0 };

  const match = {};
  if (minPrice || maxPrice) {
    match.price = {};
    if (minPrice) match.price.$gte = Number(minPrice);
    if (maxPrice) match.price.$lte = Number(maxPrice);
  }

  const results = await ProductModel.aggregate([
    { $search: { index: "product_search", compound: { should, minimumShouldMatch: 1 } } },
    { $addFields: { score: { $meta: "searchScore" } } },
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $limit: Number(limit) * 4 },
  ]);

  
  console.log("search scores:", results.map((r) => [r.name.slice(0, 40), r.score.toFixed(2)]));
  const top = results[0]?.score ?? 0;
  const relevant = results.filter((r) => r.score >= top * 0.5).slice(0, Number(limit));

  const products = await ProductModel.populate(relevant, { path: "category", select: "name slug" });
  return { products, total: products.length };
};