import { findUserOrders } from "../../services/order.service.js";

export const orderTool = {
  name: "order_status",
  description: "Get the current user's recent orders. Requires authentication.",
  requiresAuth: true,

  async execute(args, context) {
    const orders = await findUserOrders(context.userId);

    if (!orders.length) {
      return { found: false, message: "You don't have any orders yet.", link: "/orders" };
    }
    const latest = orders[0];

    return {
      found: true,
      total: orders.length,
      latestOrder: {
        id: latest._id.toString(),
        status: latest.status,
        total: latest.totalAmount,
        placedAt: latest.placedAt,
        items: latest.orderItems.map((item) =>({
          name: item.product?.name ?? "Unknown product",
          price: item.product?.price ?? null,
          image: item.product?.images?.[0] ?? null,
          quantity: item.quantity,
        }))
      },
      link: "/account/all_orders"
    };
  }
};