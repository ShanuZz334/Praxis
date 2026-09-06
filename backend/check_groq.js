import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const db = mongoose.connection.db;
        const p = await db.collection("aiproviders").findOne({ providerId: "groq" });
        console.log(p);
    } catch(e) {}
    process.exit(0);
}
run();
