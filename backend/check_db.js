import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const db = mongoose.connection.db;
        const providers = await db.collection("aiproviders").find({}).toArray();
        console.log("PROVIDERS:");
        providers.forEach(p => console.log(p.providerId, p.models));
        
        const routing = await db.collection("airoutings").findOne({ isSingleton: true });
        console.log("ROUTING:", JSON.stringify(routing, null, 2));
    } catch(e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
}
run();
