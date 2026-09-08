import mongoose from 'mongoose';

const aiRoutingSchema = new mongoose.Schema({
    // Using a single singleton document since these are global settings
    isSingleton: { type: Boolean, default: true, unique: true },
    temperature: { type: Number, default: 0.7 },
    maxTokensShort: { type: Number, default: 500 },
    maxTokensMedium: { type: Number, default: 1000 },
    maxTokensDetailed: { type: Number, default: 3000 },
    cardInsight: { 
        providerId: String,
        modelId: String,
        verbosity: { type: mongoose.Schema.Types.Mixed, default: 150 }
    },
    headerInsight: { 
        providerId: String,
        modelId: String,
        verbosity: { type: mongoose.Schema.Types.Mixed, default: 350 }
    },
    pageInsight: { 
        providerId: String,
        modelId: String,
        verbosity: { type: mongoose.Schema.Types.Mixed, default: 500 }
    },
    manualChat: { 
        providerId: String,
        modelId: String,
        verbosity: { type: mongoose.Schema.Types.Mixed, default: 500 }
    },
    futureVision: {
        // Dedicated model routing for the Future Vision predictive candle engine.
        // Defaults to the best tier3_complex model available if not explicitly set.
        providerId: { type: String, default: null },
        modelId:    { type: String, default: null },
    },
    permissions: {
        readPortfolio: { type: Boolean, default: true },
        readWatchlists: { type: Boolean, default: true },
        readWallet: { type: Boolean, default: false },
        writeTrades: { type: Boolean, default: false },
        writeJournal: { type: Boolean, default: true },
        networkAccess: { type: Boolean, default: true }
    }
}, { timestamps: true });

export default mongoose.models.AiRouting || mongoose.model('AiRouting', aiRoutingSchema);
