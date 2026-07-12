import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true, index: true },
    instrumentKey: { type: String, required: true },
    tradingSymbol: { type: String, required: true },
    transactionType: { type: String, required: true },
    orderType: { type: String, required: true },
    quantity: { type: Number, required: true },
    pendingQuantity: { type: Number },
    filledQuantity: { type: Number },
    price: { type: Number },
    triggerPrice: { type: Number },
    averagePrice: { type: Number },
    status: { type: String, required: true },
    statusMessage: { type: String },
    orderTimestamp: { type: Date, required: true }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;
