import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true},
    orderItems: [
        {
            product: {type: mongoose.Schema.Types.ObjectId, ref: "product", required: true},
            quantity: { type: Number, required: true},
        }
    ],
    shippingInfo: {
        fullName: { type: String, required: true },
        email: { type: String, required: false },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        postCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    totalAmount : { type: Number, required: true },
    paymentMethod: { type: String, enum: ["COD", "SSLCOMMERZ"], default: "COD" },
    status: {
        type: String,
        enum: ['processing', 'shipped', 'delivered', 'cancelled'],
        default: "processing"
    },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    placedAt: { type: Date, default: Date.now }
}, {timestamps: true})

const OrderModel = mongoose.model("order", orderSchema);

export default OrderModel;