import OrderModel from "../models/Order.js";
import ProductModel from "../models/Product.js";
import ProductViewModel from "../models/productView.js";


const RECENT_PURCHASE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const HALF_LIFE_DAYS = 14;
const SIGNAL_WEIGHTS = { view: 1, wishlist: 3, cart: 4, purchase: 5 };


const decay = (date) =>
  Math.pow(0.5, (Date.now() - new Date(date).getTime()) / (HALF_LIFE_DAYS * DAY_MS));

// pure function: views -> sorted [{ category, score }]
const scoreCategories = (views) => {
  const scores = new Map();
  for (const v of views) {
    if (!v.category) continue;
    const points =
      Math.min(v.views, 5) * SIGNAL_WEIGHTS.view * decay(v.lastViewedAt);
    const key = v.category.toString();
    scores.set(key, (scores.get(key) || 0) + points);
  }
  return [...scores]
    .map(([category, score]) => ({ category, score }))
    .sort((a, b) => b.score - a.score);
};

export const recommendProductsService = async (userId, limit = 6) => {
  const since = new Date(Date.now() - RECENT_PURCHASE_DAYS * DAY_MS);

  const [views, recentOrders] = await Promise.all([
    ProductViewModel.find({ user: userId })
      .sort({ lastViewedAt: -1 })
      .limit(100)
      .select("product category views lastViewedAt")
      .lean(),
    OrderModel.find({ user: userId, createdAt: { $gte: since }, status: { $ne: "cancelled" }, })
      .select("orderItems.product")
      .lean(),
  ]);

  // products bought recently -> never recommend these
  const purchasedIds = new Set(
    recentOrders.flatMap((o) => o.orderItems.map((i) => i.product.toString()))
  );

  const topCategories = scoreCategories(views)
    .slice(0, 3)
    .map((i) => i.category);

  // cold start: no history, return newest products
  if (topCategories.length === 0) {
    return ProductModel.find({ _id: { $nin: [...purchasedIds] } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  // 1) viewed but not bought, in top categories, strongest interest first
  const viewedCandidates = views
    .filter(
      (v) =>
        v.product &&
        topCategories.includes(v.category?.toString()) &&
        !purchasedIds.has(v.product.toString())
    )
    .map((v) => ({
      id: v.product.toString(),
      score: Math.min(v.views, 5) * decay(v.lastViewedAt),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const viewedIds = viewedCandidates.map((c) => c.id);

  const viewedProducts = await ProductModel.find({ _id: { $in: viewedIds } }).lean();
  // $in doesn't keep order, so restore the ranking
  const byId = new Map(viewedProducts.map((p) => [p._id.toString(), p]));
  const results = viewedIds.map((id) => byId.get(id)).filter(Boolean);

  // 2) fill the rest with similar products from the same categories
  const remaining = limit - results.length;
  if (remaining > 0) {
    const excluded = [
      ...purchasedIds,
      ...results.map((p) => p._id.toString()),
    ];
    const similar = await ProductModel.find({
      category: { $in: topCategories },
      _id: { $nin: excluded },
    })
      .sort({ createdAt: -1 }) // swap for rating / sales count if you have one
      .limit(remaining)
      .lean();
    results.push(...similar);
  }

  return results;
};