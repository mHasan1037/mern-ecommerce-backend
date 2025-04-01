import OrderModel from "../models/Order.js";
import ProductModel from "../models/Product.js";
import UserModel from "../models/User.js"

export const adminDashboard = async (req, res) =>{
    try{
       const totalUsers = await UserModel.countDocuments();
       const totalProducts = await ProductModel.countDocuments();
       const totalOrders = await OrderModel.countDocuments();

       const totalRevenueData = await OrderModel.aggregate([
        { $match: { status: { $ne: "cancelled"}}},
        { $group: { _id: null, total: { $sum: "$totalAmount"}}}
       ])
       const totalRevenue = totalRevenueData[0]?.total || 0;

       const orderStatusCount = await OrderModel.aggregate([
        { $group: {_id: "$status", count: {$sum: 1}}}
       ])

       const lowStockProducts = await ProductModel.find({ stock: { $lt: 5 }})
         .select("name stock")

       res.status(200).json({
        message: "Admin summary fetched",
        summary: {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue,
            orderStatusCount,
            lowStockProducts,
        }
       })
    }catch(error){
       res.status(500).json({
        message: "Failed to fetch admin summary",
        error: error.message
       })
    }
}