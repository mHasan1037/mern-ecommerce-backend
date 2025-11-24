import express from "express";
import SSLCommerzPayment from "sslcommerz-lts";
import Order from "../models/Order.js";

const router = express.Router();
const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.SSLCOMMERZ_MODE === "true";
const FRONTEND_URL = process.env.FRONTEND_PROD_URL;
const BACKEND_URL = process.env.BACKEND_PROD_URL;

router.post("/init", async (req, res) => {
  try {
    const {
      orderItems,
      shippingInfo,
      totalAmount,
      userId,
      currency = "BDT",
    } = req.body;
    const pendingOrder = await Order.create({
      user: userId,
      orderItems: orderItems.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
      })),
      shippingInfo,
      paymentMethod: "SSLCOMMERZ",
      paymentStatus: "processing",
      totalAmount,
      currency: currency,
      status: "processing",
    });

    const tran_id = pendingOrder._id.toString();

    const data = {
      total_amount: totalAmount.toString(),
      currency: currency,
      tran_id,
      success_url: `${BACKEND_URL}/api/payment/ssl/success?tran_id=${tran_id}`,
      fail_url: `${BACKEND_URL}/api/payment/ssl/fail?tran_id=${tran_id}`,
      cancel_url: `${BACKEND_URL}/api/payment/ssl/cancel?tran_id=${tran_id}`,
      ipn_url: `${BACKEND_URL}/api/payment/ssl/ipn`,

      cus_name: shippingInfo?.fullName || "Customer",
      cus_email: shippingInfo?.email || "customer@example.com",
      cus_add1: shippingInfo?.address || "Dhaka",
      cus_city: shippingInfo?.city || "Dhaka",
      cus_postcode: shippingInfo?.postCode || "1000",
      cus_country: shippingInfo?.country || "Bangladesh",
      cus_phone: shippingInfo?.phone || "017xxxxxxx",

      shipping_method: "Courier",
      ship_name: shippingInfo?.fullName || "Customer",
      ship_add1: shippingInfo?.address || "Dhaka",
      ship_city: shippingInfo?.city || "Dhaka",
      ship_postcode: shippingInfo?.postCode || "1000",
      ship_country: shippingInfo?.country || "Bangladesh",

      product_name: "Order Payment",
      product_category: "eCommerce",
      product_profile: "general",
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);

    if (apiResponse?.GatewayPageURL) {
      return res.json({ url: apiResponse.GatewayPageURL });
    } else {
      await Order.findByIdAndUpdate(tran_id, {
        paymentStatus: "failed",
        status: "cancelled",
      });
      return res.status(400).json({ error: "SSLCOMMERZ init failed" });
    }
  } catch (error) {
    console.error("SSL Init Error:", error);
    return res.status(500).json({ error: "Server error during SSL init" });
  }
});

router.post("/success", async (req, res) => {
  try {
    const { val_id } = req.body;
    const { tran_id } = req.query;

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const validation = await sslcz.validate({ val_id });

    const isValid =
      validation?.status === "VALID" || validation?.status === "VALIDATED";
    const amountMatched = Number(validation?.amount) > 0;
    const currencyMatched = validation?.currency === "BDT";

    if (isValid && amountMatched && currencyMatched) {
      await Order.findByIdAndUpdate(tran_id, {
        paymentStatus: "paid",
        status: "processing",
        paidAt: new Date(),
        "paymentResult.gateway": "SSLCOMMERZ",
        "paymentResult.val_id": validation?.val_id,
        "paymentResult.bank_tran_id": validation?.bank_tran_id,
        "paymentResult.card_type": validation?.card_type,
        "paymentResult.amount": validation?.amount,
        "paymentResult.currency": validation?.currency,
      });

      const order = await Order.findById(tran_id);
      if(order?.user){
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(order.user, {cart: []});
      }
      return res.redirect(
        `${FRONTEND_URL}/account/order_success?orderId=${tran_id}`
      );
    }

    await Order.findByIdAndUpdate(tran_id, {
      paymentStatus: "failed",
      status: "cancelled",
    });
    return res.redirect(`${FRONTEND_URL}/checkout?payment=failed`);
  } catch (error) {
    console.error("SSL Success Handler Error:", err);
    return res.redirect(`${FRONTEND_URL}/checkout?payment=error`);
  }
});

router.post("/fail", async (req, res) => {
  try {
    const { tran_id } = req.query;
    await Order.findByIdAndUpdate(tran_id, {
      paymentStatus: "failed",
      status: "cancelled",
    });
    return res.redirect(`${FRONTEND_URL}/checkout?payment=failed`);
  } catch (err) {
    return res.redirect(`${FRONTEND_URL}/checkout?payment=error`);
  }
});

router.post("/cancel", async (req, res) => {
  try {
    const { tran_id } = req.query;
    await Order.findByIdAndUpdate(tran_id, {
      paymentStatus: "cancelled",
      status: "cancelled",
    });
    return res.redirect(`${FRONTEND_URL}/checkout?payment=cancelled`);
  } catch (err) {
    return res.redirect(`${FRONTEND_URL}/checkout?payment=error`);
  }
});

router.post("/ipn", async (req, res) => {
  try {
    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ error: "IPN error" });
  }
});

export default router;
