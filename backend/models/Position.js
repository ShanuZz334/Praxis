import mongoose from "mongoose";

const positionSchema = new mongoose.Schema({
    instrumentKey: { type: String, required: true, unique: true, index: true },
    tradingSymbol: { type: String, required: true },
    netQuantity: { type: Number, required: true },
    buyQuantity: { type: Number, required: true },
    sellQuantity: { type: Number, required: true },
    averagePrice: { type: Number, required: true },
    unrealizedPnl: { type: Number },
    realizedPnl: { type: Number }
}, { timestamps: true });

const Position = mongoose.model("Position", positionSchema);
export default Position;
