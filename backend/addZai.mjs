
import mongoose from "mongoose";
import dotenv from "dotenv";
import { encrypt } from "./utils/encryption.js";
import AiProvider from "./models/AiProvider.js";

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const apiKey = "d8fe84ff93a8456cb0f090932bafbc7b.U8qoULiwG2RaxU6N";
    const encryptedKey = encrypt(apiKey);

    const providerId = "zai";

    const p = await AiProvider.findOneAndUpdate(
        { providerId },
        {
            providerId,
            displayName: "Z.AI (Zhipu)",
            purpose: "High concurrency and cost-effective multi-modal models",
            apiKey: encryptedKey,
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            isActive: true,
            priority: 2,
            supportedLevels: [
                "level1_fast",
                "level2_standard",
                "level3_advanced",
                "level4_expert",
                "level5_reasoner",
                "level6_vision"
            ],
            models: {
                level1_fast: "glm-4.5-flash",
                level2_standard: "glm-5.3-flash",
                level3_advanced: "glm-5.1",
                level4_expert: "glm-5.2",
                level5_reasoner: "glm-4-plus",
                level6_vision: "glm-4.6v"
            }
        },
        { upsert: true, new: true }
    );

    console.log("Upserted Z.AI provider!", p);
    process.exit(0);
}
run();

