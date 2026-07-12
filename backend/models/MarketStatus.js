import mongoose from "mongoose";

const marketStatusSchema = new mongoose.Schema({
    segment: { type: String, required: true, unique: true, index: true },
    status: { type: String, required: true }, // e.g., "NORMAL_OPEN", "CLOSED"
    lastUpdated: { type: Date, required: true }
}, { timestamps: true });

const MarketStatus = mongoose.model("MarketStatus", marketStatusSchema);
export default MarketStatus;
