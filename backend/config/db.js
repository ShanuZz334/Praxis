/**
 * @file db.js
 * @purpose MongoDB database connection configuration.
 * @responsibilities
 * - Establishes connection to MongoDB using Mongoose
 * - Validates MONGO_URI environment variable
 * - Handles connection errors and exits process on failure
 * - Logs connection status
 * @key_exports
 * - connectDB - Async function to connect to MongoDB (default export)
 * @dependencies
 * - mongoose - MongoDB ODM
 * @lifecycle
 * - Called on server startup in server.js
 * - Requires MONGO_URI environment variable
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import mongoose from "mongoose";

// =============================
// Connection Function
// =============================
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

// =============================
// Export
// =============================
export default connectDB;
