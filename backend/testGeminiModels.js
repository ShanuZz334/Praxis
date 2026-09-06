import dotenv from "dotenv";
dotenv.config({ path: "c:/project/ALLBACKUP/Praxis/backend/.env" });
import axios from "axios";
import mongoose from "mongoose";
import AiProvider from "./models/AiProvider.js";
import { decrypt } from "./ai-gateway/utils/encryption.js";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const gemini = await AiProvider.findOne({ providerId: 'gemini' }).lean();
    const apiKey = decrypt(gemini.apiKey);
    
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        console.log(response.data.models.map(m => m.name).join("\n"));
    } catch (e) {
        console.error(e.response?.data || e.message);
    }
    process.exit(0);
}
run();
