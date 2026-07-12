import mongoose from "mongoose";

const holdingSchema = new mongoose.Schema({
    instrumentKey: { type: String, required: true, unique: true, index: true },
    tradingSymbol: { type: String, required: true },
    quantity: { type: Number, required: true },
    averagePrice: { type: Number, required: true },
    currentValue: { type: Number },
    pnl: { type: Number },
    dayChange: { type: Number }
}, { timestamps: true });

const Holding = mongoose.model("Holding", holdingSchema);
export default Holding;
