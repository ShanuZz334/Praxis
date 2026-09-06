import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const db = mongoose.connection.db;
        const providers = await db.collection("aiproviders").find({}).sort({priority: 1}).toArray();
        console.log("PROVIDERS:");
        providers.forEach(p => console.log(`${p.priority}: ${p.providerId}`));
    } catch(e) {}
    process.exit(0);
}
run();
