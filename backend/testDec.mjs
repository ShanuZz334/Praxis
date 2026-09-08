import mongoose from "mongoose";
import dotenv from "dotenv";
import { decrypt } from "./utils/encryption.js";
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const AiProvider = mongoose.connection.db.collection("aiproviders");
    const providers = await AiProvider.find({}).toArray();
    for (const p of providers) {
        if (p.apiKey) {
            try {
                const key = decrypt(p.apiKey);
                console.log(p.providerId, "Key decrypted successfully (length " + key.length + ")");
            } catch (e) {
                console.log(p.providerId, "Key decryption FAILED:", e.message);
            }
        } else {
            console.log(p.providerId, "No API key configured");
        }
    }
    await mongoose.disconnect();
}
run();
