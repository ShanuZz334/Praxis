import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema({
    tradeId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    instrumentKey: { type: String, required: true },
    tradingSymbol: { type: String, required: true },
    transactionType: { type: String, required: true },
    quantity: { type: Number, required: true },
    tradePrice: { type: Number, required: true },
    tradeTimestamp: { type: Date, required: true }
}, { timestamps: true });

const Trade = mongoose.model("Trade", tradeSchema);
export default Trade;
