import mongoose from "mongoose";
import CategoryModel from "../models/Category.js";

const connectDB = async (DATABASE_URL) =>{
    try{
       const DB_OPTIONS = {
        dbName: 'ecommerce',
       }
       await mongoose.connect(DATABASE_URL, DB_OPTIONS);
       console.log("Server Connected Successfully...");

       await CategoryModel.syncIndexes();
       console.log("Indexes synced");
    }catch(error){
       console.log(error);
    }
}

export default connectDB;