import mongoose from "mongoose";
import dotenv from "dotenv";
import { runFutureVisionPrediction } from "./services/futureVisionService.js";

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const res = await runFutureVisionPrediction("Test payload", "NSE_EQ|INE002A01018", 7);
        console.log("SUCCESS:", res);
    } catch(e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
}
run();
