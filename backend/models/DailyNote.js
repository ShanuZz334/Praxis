import mongoose from "mongoose";

const dailyNoteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Ensure one note per day per user
dailyNoteSchema.index({ user: 1, date: 1 }, { unique: true });

const DailyNote = mongoose.model("DailyNote", dailyNoteSchema);

export default DailyNote;
