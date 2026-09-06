import mongoose from "mongoose";
import { runFutureVisionPrediction } from "./services/futureVisionService.js";
import { aiGateway } from "./ai-gateway/index.js";
import AiRouting from "./models/AiRouting.js";

async function run() {
    await mongoose.connect("mongodb://localhost:27017/stocky");
    try {
        const res = await runFutureVisionPrediction("Test payload", "NSE_EQ|INE002A01018", 7);
        console.log("SUCCESS:", res);
    } catch(e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
}
run();
