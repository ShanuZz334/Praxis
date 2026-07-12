import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
    id: { type: String, required: true },
    module: { type: String }, // 'P/E Ratio', etc.
    score: { type: Number, min: 0, max: 100 },
    bias: { type: String },
    creditAllocation: { type: Number },
    normalized: { type: Number }, // -1, 0, 1
    rawInput: { type: mongoose.Schema.Types.Mixed } // Stores the exact JSON/float values used for AI analysis
}, { _id: false });

const sectionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    label: { type: String },
    score: { type: Number, min: 0, max: 100 },
    weight: { type: Number }
}, { _id: false });

const intelligenceSnapshotSchema = new mongoose.Schema({
    instrumentKey: { type: String, required: true, index: true },
    instrumentType: { type: String, enum: ['Companies', 'Indices'], default: 'Companies' },
    type: { type: String, enum: ["fundamental", "technical", "options"], required: true, index: true },
    timestamp: { type: Date, required: true, index: true, default: Date.now },
    compositeScore: { type: Number, min: 0, max: 100 },
    regime: {
        label: { type: String },
        description: { type: String },
        confidence: { type: Number },
        color: { type: String },
        hexColor: { type: String }
    },
    sections: [sectionSchema],
    tailwinds: [mongoose.Schema.Types.Mixed],
    risks: [mongoose.Schema.Types.Mixed],
    cards: [cardSchema],
    regimeShift: { type: Boolean, default: false }
}, { timestamps: true });

// Compound index for fast queries: Fetch a specific instrument's specific snapshot type chronologically
intelligenceSnapshotSchema.index({ instrumentKey: 1, type: 1, timestamp: -1 });

const IntelligenceSnapshot = mongoose.model("IntelligenceSnapshot", intelligenceSnapshotSchema);
export default IntelligenceSnapshot;
