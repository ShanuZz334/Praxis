import mongoose from "mongoose";

const optionGreekSchema = new mongoose.Schema({
    instrumentKey: { type: String, required: true, unique: true, index: true },
    delta: { type: Number },
    gamma: { type: Number },
    theta: { type: Number },
    vega: { type: Number },
    rho: { type: Number },
    iv: { type: Number }
}, { timestamps: true });

const OptionGreek = mongoose.model("OptionGreek", optionGreekSchema);
export default OptionGreek;
