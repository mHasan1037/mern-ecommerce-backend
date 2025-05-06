import OrderModel from "../models/Order.js";
import UserModel from "../models/User.js";

export const getFullUserProfile = async (userId) => {
    const user = await UserModel.findById(userId).select("-password");
  
    if (!user) {
      throw new Error("User not found");
    }
  
    const totalDelivered = await OrderModel.countDocuments({
      user: userId,
      status: "delivered",
    });
  
    const deliveredOrders = await OrderModel.find({
      user: userId,
      status: "delivered",
    });
  
    const totalSpent = deliveredOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
  
    const totalCancelled = await OrderModel.countDocuments({
      user: userId,
      status: "cancelled",
    });
  
    const recentOrder = await OrderModel.findOne({ user: userId })
      .sort({ placedAt: -1 })
      .populate("orderItems.product", "_id name")
      .select("status placedAt orderItems");
  
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      isVerified: user.is_verified,
      isAdmin: user.is_admin,
      totalSpent: totalSpent.toFixed(2),
      totalDeliveredOrders: totalDelivered,
      totalCancelledOrders: totalCancelled,
      recentOrder: recentOrder
        ? {
            id: recentOrder._id,
            status: recentOrder.status,
            placedAt: recentOrder.placedAt,
            orderItems: recentOrder.orderItems[0]?.product || null,
          }
        : null,
    };
  };