import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        category: { type: String, enum: ['alerts', 'notifications', 'system'], required: true },
        priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
        title: { type: String, required: true },
        description: { type: String },
        content: { type: String },
        read: { type: Boolean, default: false },
        metadata: { type: Map, of: String }, // Flexible metadata for different message types
        archived: { type: Boolean, default: false }
    },
    { timestamps: true }
);

// Index for efficient querying by user and read status
MessageSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Message = mongoose.model("Message", MessageSchema);
export default Message;
