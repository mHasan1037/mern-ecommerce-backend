import { findUserOrders } from "../../services/order.service.js";

export const orderTool = {
  name: "order_status",
  description:
    "Get the current user's orders, optionally filtered by product. Requires authentication.",
  requiresAuth: true,

  async execute(args, context) {
    const orders = await findUserOrders(context.userId);

    if (!orders.length) {
      return {
        found: false,
        message: "You don't have any orders yet.",
        link: "/orders",
      };
    }
    if (args?.search) {
      return searchOrdersByProduct(orders, args.search);
    }

    return {
      found: true,
      mode: "latest",
      total: orders.length,
      latestOrder: mapOrder(orders[0]),
      link: "/account/all_orders",
    };
  },
};

function searchOrdersByProduct(orders, search) {
  const term = search.trim().toLowerCase();

  const matches = orders.filter((o) =>
    o.orderItems.some((item) => item.product?.name?.toLowerCase().includes(term))
  );

  if (!matches.length) {
    return {
      found: false,
      mode: "search",
      search,
      message: `You don't have any orders matching "${search}".`,
      link: "/orders",
    };
  }

  return {
    found: true,
    mode: "search",
    search,
    total: matches.length,
    orders: matches.map(mapOrder),
    link: "/account/all_orders",
  };
}

function mapOrder(order) {
  return {
    id: order._id.toString(),
    status: order.status,
    total: order.totalAmount,
    placedAt: order.placedAt,
    items: order.orderItems.map((item) => ({
      name: item.product?.name ?? "Unknown product",
      price: item.product?.price ?? null,
      image: item.product?.images?.[0] ?? null,
      quantity: item.quantity,
    })),
  };
}
