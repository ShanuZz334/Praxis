import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "c:/project/ALLBACKUP/Praxis/backend/.env" });
import AiProvider from "./models/AiProvider.js";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const docs = await AiProvider.find().lean();
    docs.forEach(d => {
        if (d.providerId === 'gemini') {
            console.log(JSON.stringify(d.models, null, 2));
        }
    });
    process.exit(0);
}
run();
