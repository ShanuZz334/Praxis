import mongoose from "mongoose";

const instrumentSchema = new mongoose.Schema({
    instrumentKey: { type: String, required: true, unique: true, index: true },
    tradingSymbol: { type: String, required: true, index: true },
    name: { type: String },
    exchange: { type: String, required: true },
    segment: { type: String, required: true },
    instrumentType: { type: String },
    tickSize: { type: Number },
    lotSize: { type: Number },
    expiry: { type: Date },
    strike: { type: Number },
    optionType: { type: String, enum: ['CE', 'PE', ''] },
    isin: { type: String, index: true },
    freezeQuantity: { type: Number },
    exchangeToken: { type: String },
    underlyingKey: { type: String },
    underlyingSymbol: { type: String },
    underlyingType: { type: String }
}, { timestamps: true });

const Instrument = mongoose.model("Instrument", instrumentSchema);
export default Instrument;
