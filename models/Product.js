import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true},
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true},
    stock: { type: Number, required: true, min: 0 },
    images: [
        { 
            url:  {
                type: String,
                required: true,
            },
            altText: {
                type: String,
            },
            public_id: { type: String }
        }
    ],
    //seller: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    ratings: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        totalReviews: { type: Number, default: 0 },
    },
    reviews: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true},
            name: {type: String},
            rating: {type: Number, min: 1, max: 5},
            comment: {type: String},
            createdAt: {type: Date, default: Date.now}
        }
    ],
    is_featured: { type: Boolean, default: false },
}, { timestamps: true })

const ProductModel = mongoose.model('product', productSchema);

export default ProductModel;