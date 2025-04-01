import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true},
    slug: { type: String, unique: true },
    description: { type: String, trim: true },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "category", default: null },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true })

categorySchema.pre("save", function (next) {
    if (this.isModified("name")) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

const CategoryModel = mongoose.model('category', categorySchema);

export default CategoryModel;