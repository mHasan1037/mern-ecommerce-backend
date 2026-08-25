import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true},
    slug: { type: String},
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
      type: {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
      required: false,
      default: null
    },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

categorySchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

categorySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

categorySchema.pre("save", async function (next) {
  if (!this.isModified("name")) return next();

  const baseSlug = slugify(this.name, {lower: true, strict: true });

  let finalSlug = baseSlug;
  let counter = 1;

  while(await mongoose.models.category.findOne({slug: finalSlug, isDeleted: false})){
    finalSlug = `${baseSlug} - ${counter}`;
    counter++;
  }

  this.slug = finalSlug;

  next();
});

const CategoryModel = mongoose.model("category", categorySchema);

export default CategoryModel;
