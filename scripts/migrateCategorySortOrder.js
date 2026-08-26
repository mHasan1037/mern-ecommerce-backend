import mongoose from "mongoose";
import dotenv from "dotenv";
import CategoryModel from "../models/Category.js";

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.DATABASE_URL, { dbName: "ecommerce" });
    console.log("Connected to DB");

    const cats = await CategoryModel.find({ isDeleted: false }).sort({ createdAt: 1 });
    console.log(`Found ${cats.length} categories to migrate`);

    await Promise.all(
      cats.map((cat, index) =>
        CategoryModel.updateOne({ _id: cat._id }, { sortOrder: index })
      )
    );

    console.log("Migration complete");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();