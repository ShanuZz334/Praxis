import mongoose from "mongoose";

const JournalSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        symbol: { type: String, required: true },
        entryDate: { type: Date, required: true },
        entryPrice: { type: Number, required: true },
        exitDate: { type: Date },
        exitPrice: { type: Number },
        quantity: { type: Number, required: true },
        type: { type: String, enum: ['BUY', 'SELL'], required: true },
        status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
        pnl: { type: Number },
        notes: { type: String },
        tags: [{ type: String }],
        screenshots: [{ type: String }], // URLs to uploaded images
        strategy: { type: String },
        emotions: { type: String }, // e.g., 'Fear', 'Greed', 'Calm'
        setupRating: { type: Number, min: 1, max: 10 }
    },
    { timestamps: true }
);

const Journal = mongoose.model("Journal", JournalSchema);
export default Journal;
