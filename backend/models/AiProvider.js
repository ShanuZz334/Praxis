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
    supportedLevels: [{ type: String }],
    models: {
        level1_fast: String,
        level2_standard: String,
        level3_advanced: String,
        level4_expert: String,
        level5_reasoner: String,
        level6_vision: String,
        level7_audio: String
    },
    rateLimitedUntil: { type: Date, default: null },
    lastUsed: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.models.AiProvider || mongoose.model('AiProvider', aiProviderSchema);
