import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema({
    instrumentKey: { type: String, required: true, unique: true, index: true },
    ltp: { type: Number, required: true },
    open: { type: Number },
    high: { type: Number },
    low: { type: Number },
    close: { type: Number },
    volume: { type: Number },
    lowerCircuit: { type: Number },
    upperCircuit: { type: Number },
    yearlyHigh: { type: Number },
    yearlyLow: { type: Number },
    marketDepth: { type: Object }
}, { timestamps: true });

const Quote = mongoose.model("Quote", quoteSchema);
export default Quote;
