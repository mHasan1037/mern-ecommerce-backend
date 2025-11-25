import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/connectdb.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatbotRoutes from "./routes/chatBotRoutes.js";
import sslRoutes from "./payment/sslRoutes.js";
import passport from "passport";
import "./config/passport-jwt-strategy.js";

const app = express();
const port = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_PROD_URL,
  "https://sandbox.sslcommerz.com",
  "https://securepay.sslcommerz.com"
];

const corsOptions = {
   origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
connectDB(DATABASE_URL);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(cookieParser());
app.use("/api/payment/ssl", sslRoutes);
app.use("/api/user", userRoutes);
app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", wishlistRoutes);
app.use("/api", adminRoutes);
app.use("/api", chatbotRoutes);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is listing at http://0.0.0.0:${port}`);
});
