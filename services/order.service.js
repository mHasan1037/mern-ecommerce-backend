import OrderModel from "../models/Order.js";

export const findUserOrders = async (userId) => {
  return OrderModel.find({ user: userId })
    .populate("orderItems.product", "name price images")
    .sort({ placedAt: -1 });
};

export const findOrderById = async (orderId, userId, isAdmin) => {
  const order = await OrderModel.findById(orderId)
    .populate("orderItems.product", "name price images")
    .populate("user", "name email");

  if (!order) return { error: "not_found" };

  if (!isAdmin && order.user._id.toString() !== userId.toString()) {
    return { error: "not_authorized" };
  }

  return { order };
};