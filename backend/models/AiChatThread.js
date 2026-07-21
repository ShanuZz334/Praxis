import mongoose from 'mongoose';

/**
 * AiChatThread — persists every AI insight exchange per card / page header / global chat.
 *
 * scope values:
 *   'card'   — one thread per card targetId (e.g. "nifty_pe")
 *   'page'   — one thread per page header (e.g. "fundamentals_header_index")
 *   'global' — one cross-page global chat thread per user (targetId = "global")
 */
const threadEntrySchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // The AI provider / model that generated this response
    model: {
        type: String,
        default: null
    },
    provider: {
        type: String,
        default: null
    },
    latencyMs: {
        type: Number,
        default: null
    },
    // Snapshot of the card value at the time of insight generation
    cardValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, { _id: false, timestamps: true });

const aiChatThreadSchema = new mongoose.Schema({
    // The unique card/page/global identifier
    targetId: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    // 'card' | 'page' | 'global'
    scope: {
        type: String,
        enum: ['card', 'page', 'global'],
        required: true,
        default: 'card'
    },
    // The user this thread belongs to
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Ordered list of exchanges
    entries: [threadEntrySchema],
    // Limit entries in DB to last 100 to keep it lean
    entryCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Compound unique index: one thread per (targetId + scope + userId)
aiChatThreadSchema.index({ targetId: 1, scope: 1, userId: 1 }, { unique: true });

export default mongoose.models.AiChatThread || mongoose.model('AiChatThread', aiChatThreadSchema);
