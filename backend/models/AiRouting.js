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
        verbosity: { type: String, default: 'medium' }
    },
    headerInsight: { 
        providerId: String,
        modelId: String,
        verbosity: { type: String, default: 'detailed' }
    },
    pageInsight: { 
        providerId: String,
        modelId: String,
        verbosity: { type: String, default: 'detailed' }
    },
    manualChat: { 
        providerId: String,
        modelId: String
    }
}, { timestamps: true });

export default mongoose.models.AiRouting || mongoose.model('AiRouting', aiRoutingSchema);
