import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/connectdb.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatbotRoutes from './routes/chatBotRoutes.js';
import passport from 'passport';
import './config/passport-jwt-strategy.js';

const app = express();
const port = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL

const corsOptions = {
    origin: process.env.FRONTEND_HOST,
    credentials: true,
    optionSuccessStatus: 200,
  };

app.use(cors(corsOptions));
connectDB(DATABASE_URL);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(cookieParser());
app.use('/api/user', userRoutes);
app.use('/api', productRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', wishlistRoutes);
app.use('/api', adminRoutes);
app.use('/api', chatbotRoutes);


app.listen(port, '0.0.0.0', ()=>{
    console.log(`Server is listing at http://0.0.0.0:${port}`)
})
 