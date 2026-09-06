import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import AiRouting from "./models/AiRouting.js";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const doc = await AiRouting.findOne({ isSingleton: true }).lean();
    console.log(JSON.stringify(doc, null, 2));
    process.exit(0);
}
run();
