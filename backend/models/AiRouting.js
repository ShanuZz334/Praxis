import mongoose from 'mongoose';

const aiRoutingSchema = new mongoose.Schema({
    // Using a single singleton document since these are global settings
    isSingleton: { type: Boolean, default: true, unique: true },
    cardInsight: { 
        providerId: String,
        modelId: String
    },
    headerInsight: { 
        providerId: String,
        modelId: String
    },
    pageInsight: { 
        providerId: String,
        modelId: String
    },
    manualChat: { 
        providerId: String,
        modelId: String
    }
}, { timestamps: true });

export default mongoose.models.AiRouting || mongoose.model('AiRouting', aiRoutingSchema);
