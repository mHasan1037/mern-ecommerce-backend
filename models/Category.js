import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true },
    description: { type: String, trim: true },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      default: null,
      validate: {
      validator: function (v) {
        return v === null || mongoose.Types.ObjectId.isValid(v);
      },
      message: props => `${props.value} is not a valid category ID`,
  }
    },
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

categorySchema.pre("save", async function (next) {
  if (!this.isModified("name")) return next();

  const baseSlug = slugify(this.name, {lower: true, strict: true });

  let finalSlug = baseSlug;
  let counter = 1;

  while(await mongoose.models.category.findOne({slug: finalSlug})){
    finalSlug = `${baseSlug} - ${counter}`;
    counter++;
  }

  this.slug = finalSlug;

  next();
});

const CategoryModel = mongoose.model("category", categorySchema);

export default CategoryModel;
