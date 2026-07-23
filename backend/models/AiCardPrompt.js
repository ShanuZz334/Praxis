import mongoose from 'mongoose';

/**
 * AiCardPrompt — stores the system instruction for each unique card / page header.
 * Keyed by targetId (e.g. "nifty_pe", "fundamentals_header_index").
 * When the user edits and saves a prompt in Prompts Studio, it writes here.
 * When useCardInsight fetches the prompt before calling the AI Gateway, it reads from here.
 */
const aiCardPromptSchema = new mongoose.Schema({
    targetId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    // Human-readable label shown in Prompts Studio (e.g. "Nifty P/E")
    displayName: {
        type: String,
        required: true
    },
    // The page this card belongs to (Fundamentals / Technical Analysis / Options Analysis / Foreign Markets / Master)
    page: {
        type: String,
        required: true
    },
    // The actual system instruction sent to the AI Gateway
    systemInstruction: {
        type: String,
        default: ''
    },
    // Whether this is a page-level header prompt (vs a card-level prompt)
    isHeaderPrompt: {
        type: Boolean,
        default: false
    },
    // Applicability context: 'both' | 'index_only' | 'company_only'
    applicability: {
        type: String,
        default: 'both'
    },
    // Array of available presets
    presets: [{
        id: String,
        name: String,
        systemInstruction: String,
        isCustom: Boolean
    }],
    activePresetId: {
        type: String,
        default: 'default'
    },
    // Enforced baseline rules for this specific target, injected below the preset instruction
    goldenRules: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export default mongoose.models.AiCardPrompt || mongoose.model('AiCardPrompt', aiCardPromptSchema);
