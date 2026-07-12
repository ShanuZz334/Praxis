import mongoose from "mongoose";

const fundSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // Global platform fund for now
    availableBalance: { type: Number, required: true },
    marginUsed: { type: Number, required: true },
    marginAvailable: { type: Number, required: true }
}, { timestamps: true });

const Fund = mongoose.model("Fund", fundSchema);
export default Fund;
