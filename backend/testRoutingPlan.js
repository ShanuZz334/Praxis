import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "c:/project/ALLBACKUP/Praxis/backend/.env" });
import { getRouteForTask } from "./ai-gateway/modelRouter.js";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const plan = await getRouteForTask(3, 'future_vision_prediction');
    console.log(JSON.stringify(plan, null, 2));
    process.exit(0);
}
run();
