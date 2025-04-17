import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    email: {type: String, required: true, trim: true, unique: true, lowercase: true},
    password: {type: String, required: true, trim: true},
    is_verified: {type: Boolean, default: false},
    is_admin: {type: Boolean, default: false},
    cart: [
        {
            product: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "product",
               required: true
            },
            quantity: {type: Number, required: true, min: 1}
        }
    ],
    wishlist: [
       { type: mongoose.Schema.Types.ObjectId, ref: "product" }
    ],
}, {timestamps: true})

const UserModel = mongoose.model('user', userSchema);

export default UserModel;