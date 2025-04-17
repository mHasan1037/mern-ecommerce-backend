import { getMonthlyCount } from "../helpers/getMonthlyCount.js";
import OrderModel from "../models/Order.js";
import ProductModel from "../models/Product.js";
import UserModel from "../models/User.js";

const startOfMonth = (offset = 0) => {
  const date = new Date();
  date.setMonth(date.getMonth() + offset, 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
sixMonthsAgo.setDate(1);
sixMonthsAgo.setHours(0, 0, 0, 0);

const startOfThisMonth = startOfMonth(0);
const startOfLastMonth = startOfMonth(-1);


export const adminDashboard = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments({ is_admin: false });
    const totalProducts = await ProductModel.countDocuments();
    const totalOrders = await OrderModel.countDocuments();

    const totalRevenueData = await OrderModel.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = totalRevenueData[0]?.total || 0;

    const orderStatusCount = await OrderModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const lowStockProducts = await ProductModel.find({
      stock: { $lt: 5 },
    }).select("name stock");

    const usersThisMonth = await UserModel.countDocuments({
      is_admin: false,
      createdAt: { $gte: startOfThisMonth },
    });
    
    const usersLastMonth = await UserModel.countDocuments({
      is_admin: false,
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth}
    })

    const usersGrowthThisMonth = usersLastMonth === 0 ? 100 : ((usersThisMonth - usersLastMonth) / usersLastMonth ) * 100

    
    const ordersThisMonth = await OrderModel.countDocuments({
      placedAt: { $gte: startOfThisMonth }
    })

    const ordersLastMonth = await OrderModel.countDocuments({
      placedAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }
    })

    const ordersGrowthThisMonth = ordersLastMonth === 0 ? 100 : ((ordersThisMonth - ordersLastMonth ) / ordersLastMonth ) * 100;

    const revenueThisMonthData = await OrderModel.aggregate([
      { $match: { placedAt: { $gte: startOfThisMonth }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const revenueThisMonth = revenueThisMonthData[0]?.total || 0;

    const revenueLastMonthData = await OrderModel.aggregate([
      { $match: { placedAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }, status: { $ne: "cancelled" }}},
      { $group: {_id: null, total: { $sum: "$totalAmount" }}}
    ]);
    const revenueLastMonth = revenueLastMonthData[0]?.total || 0;

    const revenueGrowthThisMonth = revenueLastMonth === 0 ? 100 : ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;

    const newProductsThisMonth = await ProductModel.countDocuments({
      createdAt: { $gte: startOfThisMonth }
    });

    const monthlyRevenue = await OrderModel.aggregate([
      {
        $match: {
          placedAt: { $gte: sixMonthsAgo },
          state: { $ne: "cancelled"}
        }
      },
      {
        $group: {
          _id: { year: { $year: "$placedAt" }, month: { $month: "$placedAt"}},
          total: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: {"_id.year": 1, "_id.month": 1}
      }
    ]);

    const revenueGraphSixMonth = getMonthlyCount(monthlyRevenue, "total")

    const monthlyOrders = await OrderModel.aggregate([
      {
        $match: {
          placedAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { year: { $year: "$placedAt" }, month: { $month: "$placedAt"}},
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1}
      }
    ]);

    const ordersGraphSixMonth = getMonthlyCount(monthlyOrders, "count");

    
    const monthlyUsers = await UserModel.aggregate([
      {
        $match: {
          is_admin: false,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt "}},
          count: { $sum: 1}
        }
      },
      {
        $sort: {"_id.year": 1, "_id.month": 1}
      }
    ]);

    const userGraphSixMonth = getMonthlyCount(monthlyUsers, "count");
    

    res.status(200).json({
      message: "Admin summary fetched",
      summary: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        orderStatusCount,
        lowStockProducts,
        usersGrowthThisMonth,
        ordersGrowthThisMonth,
        revenueGrowthThisMonth,
        newProductsThisMonth,
        revenueGraphSixMonth,
        ordersGraphSixMonth,
        userGraphSixMonth
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin summary",
      error: error.message,
    });
  }
};
