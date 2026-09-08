
import mongoose from "mongoose";
import dotenv from "dotenv";
import AiProvider from "./models/AiProvider.js";

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    await AiProvider.findOneAndUpdate(
        { providerId: "zai" },
        {
            baseUrl: "https://api.z.ai/api/paas/v4"
        }
    );
    
    console.log("Updated Z.AI baseUrl!");
    process.exit(0);
}
run();

