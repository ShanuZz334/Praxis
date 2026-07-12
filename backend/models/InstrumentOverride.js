import mongoose from "mongoose";

const overrideSchema = new mongoose.Schema({
    instrumentKey: { type: String, required: true, index: true, unique: true },
    overrides: { type: mongoose.Schema.Types.Mixed, default: {} }, // E.g., { fii_dii_flow: -500, gdp_growth: 7.2 }
}, { timestamps: true });

const InstrumentOverride = mongoose.model("InstrumentOverride", overrideSchema);
export default InstrumentOverride;
