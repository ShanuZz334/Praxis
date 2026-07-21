import mongoose from 'mongoose';

const aiProviderSchema = new mongoose.Schema({
    providerId: {
        type: String,
        required: true,
        unique: true
    },
    displayName: { type: String, required: true },
    purpose: { type: String, default: '' },
    apiKey: { type: String }, // Encrypted AES-256-GCM
    baseUrl: { type: String },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 10 },
    supportedTiers: [{ type: String }],
    models: {
        tier1_simple: String,
        tier2_medium: String,
        tier3_complex: String,
        tier4_vision: String
    },
    rateLimitedUntil: { type: Date, default: null },
    lastUsed: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.models.AiProvider || mongoose.model('AiProvider', aiProviderSchema);
