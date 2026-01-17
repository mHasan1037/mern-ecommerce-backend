import OrderModel from "../models/Order.js";
import ProductModel from "../models/Product.js";
import UserModel from "../models/User.js";
import sendOrderStatusEmail from "../utils/orderStatusEmail.js";

export const placeOrder = async (req, res) =>{
    try{
        const userId = req.user._id;
        const {
          shippingInfo,
          totalAmount
        } = req.body;
        const user = await UserModel.findById(userId).populate('cart.product', "name price");

        if(!user || user.cart.length === 0){
            return res.status(400).json({
                message: "Cart is empty or user not found"
            })
        };

        const orderItems = user.cart
          .filter((item) => item.product)
          .map((item) => ({
            product: item.product._id,
            quantity: item.quantity,
          }));

        const newOrder = new OrderModel({
            user: userId,
            orderItems,
            shippingInfo,
            totalAmount,
            paymentMethod: "COD"
        });

        await newOrder.save();

        user.cart = [];
        await user.save();

        return res.status(201).json({
            message: "Order placed successFully",
            order: newOrder
        });

    }catch(err){
        return res.status(500).json({
            message: "Failed to plaec order",
            error: err.message
        })
    }
}

export const placeDirectOrder = async (req, res) =>{
    try{
       const userId = req.user._id;
       const {
        productId,
        quantity,
        shippingInfo,
        totalAmount
       } = req.body;

       if(!productId || !quantity || !shippingInfo || !totalAmount){
         return res.status(400).json({
            message: "Misssing required fields for direct order"
         })
       }

    const product = await ProductModel.findById(productId);

    if(!product){
        return res.status(404).json({
            message: "Product not found"
        })
    }

    const newOrder = new OrderModel({
       user: userId,
       orderItems: [{product: product._id, quantity}],
       shippingInfo,
       totalAmount,
       paymentMethod: "COD"
    });

    await newOrder.save();

    return res.status(201).json({
        message: "Order placed successfully",
        order: newOrder
    })

    }catch(error){
       return res.status(500).json({
        message: "Failed to place direct order",
        error: error.message
       })
    }
}

export const getUserOrders = async (req, res) =>{
    try{
       const userId = req.user._id;

       const orders = await OrderModel.find({ user: userId })
         .populate("orderItems.product", "name price images")
         .sort({ placedAt: -1 });
      
       res.status(200).json({
        message: "Your orders",
        orders
       })
    }catch(err){
       res.status(500).json({
         message: "Failed to fetch orders",
         error: err.message
       })
    }
}

export const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    console.log("🚨 PAGINATION VERSION 5 — LIMIT:", limit);

    const [orders, totalOrders] = await Promise.all([
      OrderModel.find()
        .populate("user", "name email")
        .populate("orderItems.product", "name price")
        .sort({ placedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments({})
    ]);

    res.set("Cache-Control", "no-store");

    res.status(200).json({
      orders,
      pagination: {
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
        limit
      }
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: err.message
    });
  }
};

export const cancelOrder = async (req, res) =>{
    try{
       const userId = req.user._id;
       const isAdmin = req.user.is_admin;
       const orderId = req.params.id;

       const order = await OrderModel.findById(orderId);

       if(!order) return res.status(404).json({
        message: "Order not found"
       })

       if(!isAdmin && order.user.toString() !== userId.toString()){
        return res.status(403).json({
            message: "Not authorized to cancel this order"
        })
       }

       if(order.status !== 'processing'){
        return res.status(400).json({
            message: "Only processing orders can be cancelled"
        })
       }

       order.status = "cancelled";
       await order.save();

       res.status(200).json({
        message: "Order cancelled",
        order
       })
    }catch(err){
       res.status(500).json({
        message: "Failed to cancel order",
        error: err.message
       })
    }
}

export const getOrderDetails = async (req, res) =>{
    try{
       const orderId = req.params.id;
       const userId = req.user._id;
       const isAdmin = req.user.is_admin;

       const order = await OrderModel.findById(orderId)
          .populate("orderItems.product", "name price images")
          .populate("user", "name email")

       if(!order){
        return res.status(404).json({
            message: "Order not found"
        })
       };

       if(!isAdmin && order.user._id.toString() !== userId.toString()){
        return res.status(403).json({
            message: "Not authorized to view this order"
        })
       }

       res.status(200).json({
        message: "Order details fetched successfully",
        order
       })
    }catch(err){
       res.status(500).json({
        message: "Failed to fetch order details",
        error: err.message
       })
    }
}

export const updateOrderStatus = async (req, res) =>{
    try{
        const orderId = req.params.id;
        const { status } = req.body;

        if(!['processing', 'shipped', 'delivered', 'cancelled'].includes(status)){
            return res.status(400).json({
                message: "Invalid status"
            })
        };

        const order = await OrderModel.findById(orderId)
          .populate("user", "email name")
          .populate("orderItems.product", "name price images stock");

        if(!order) return res.status(404).json({
            message: "Order not found"
        });

        if(order.status !== 'shipped' && status === "shipped"){
          for(const item of order.orderItems){
            const product = await ProductModel.findById(item.product._id);
            if(!product) continue;

            product.stock -= item.quantity;
            if(product.stock < 0) product.stock = 0;
            await product.save();
          }
          order.shippedAt = new Date();
        }
        if(status === "delivered") order.deliveredAt = new Date();
        if(status === "cancelled") order.cancelledAt = new Date();

        order.status = status;
        await order.save();

        await sendOrderStatusEmail({
            to: order.user.email,
            subject: `Order #${order._id} Status Updated`,
            text: `Hello ${order.user.name}, \n\nYour order status is now: "${status}".\n\nThanks for shopping with us!`
        })

        res.status(200).json({
            message: "Order status updated",
            order
        })
    }catch(err){
        res.status(500).json({
            message: "Failed to update status",
            error: err.message
        })
    }
}

export const getAllUserOrders = async (req, res) =>{
   try{
      if(req.user.roles !== true){
        return res.status(403).json({
            message: "Access denied. Admins only"
        })
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalOrders = await OrderModel.countDocuments();

      const orders = await OrderModel.find({})
        .populate("user", "name email")
        .populate("orderItems.product", "name price images")
        .sort({ placedAt: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        message: "All orders fetched successfully",
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        orders
      })
   }catch(err){
      res.status(500).json({
        message: "Failed to fetch all orders",
        error: err.message
      })
   }
}