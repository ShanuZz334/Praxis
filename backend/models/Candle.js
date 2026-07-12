import mongoose from "mongoose";

const candleSchema = new mongoose.Schema({
    instrumentKey: { type: String, required: true, index: true },
    timeframe: { type: String, required: true, index: true }, // e.g. "1M", "5M", "1D"
    timestamp: { type: Date, required: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, required: true },
    openInterest: { type: Number }
});

// Compound index for fast querying by instrument + timeframe + time
candleSchema.index({ instrumentKey: 1, timeframe: 1, timestamp: -1 }, { unique: true });

const Candle = mongoose.model("Candle", candleSchema);
export default Candle;
