import OrderModel from "../models/Order.js";

export const findUserOrders = async (userId, {page = 1, limit = 10, status}) => {
  const skip = (page - 1) * limit;
  const query = { user: userId };

  if (status) {
    query.status = status;
  }

  const [orders, total] = await Promise.all([
    OrderModel.find(query)
      .populate("orderItems.product", "name price images")
      .sort({ placedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    OrderModel.countDocuments(query)
  ]);

  return {
    orders,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit)
  };
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