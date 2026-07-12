import mongoose from "mongoose";

const optionChainSchema = new mongoose.Schema({
    underlyingKey: { type: String, required: true, index: true },
    expiry: { type: Date, required: true, index: true },
    spotPrice: { type: Number },
    strikePrice: { type: Number, required: true },
    ceLtp: { type: Number },
    peLtp: { type: Number },
    ceOi: { type: Number },
    peOi: { type: Number },
    ceOiChange: { type: Number },
    peOiChange: { type: Number },
    ceVolume: { type: Number },
    peVolume: { type: Number },
    ceInstrumentKey: { type: String },
    peInstrumentKey: { type: String }
}, { timestamps: true });

optionChainSchema.index({ underlyingKey: 1, expiry: 1, strikePrice: 1 }, { unique: true });

const OptionChain = mongoose.model("OptionChain", optionChainSchema);
export default OptionChain;
