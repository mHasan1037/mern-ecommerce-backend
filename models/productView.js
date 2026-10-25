import mongoose from "mongoose";

const productViewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  views: { type: Number, default: 1 },
  lastViewedAt: { type: Date, default: Date.now },
});

// one doc per user + product
productViewSchema.index({ user: 1, product: 1 }, { unique: true });
// fast "recent views for this user"
productViewSchema.index({ user: 1, lastViewedAt: -1 });
// auto-delete after 90 days
productViewSchema.index({ lastViewedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const ProductViewModel = mongoose.model('ProductViewRecord', productViewSchema);

export default ProductViewModel;