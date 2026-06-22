import mongoose from "mongoose";

const journalLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    instrument: {
        type: String,
        required: true
    },
    type: {
        type: String, // e.g., 'Option Buy', 'Futures', 'Equity'
        required: true
    },
    direction: {
        type: String, // 'Long', 'Short'
        required: true,
        enum: ['Long', 'Short']
    },
    entry: { type: Number, required: true },
    exit: { type: Number, required: true },
    sl: { type: Number, required: true },
    target: { type: Number, required: true },

    size: { type: Number, required: true },
    riskPct: { type: Number },
    pnl: { type: Number, required: true },
    pnlPct: { type: Number },
    rMultiple: { type: Number },

    strategy: { type: String, required: true },
    outcome: {
        type: String,
        required: true,
        enum: ['Win', 'Loss', 'Breakeven']
    },

    context: {
        regime: String,
        vol: String
    },

    execution: {
        earlyEntry: { type: Boolean, default: false },
        slRespected: { type: Boolean, default: true },
        targetManaged: { type: Boolean, default: true },
        errors: [String]
    },

    psychology: {
        state: String,
        notes: String
    },

    // Elite/Advanced Fields
    verdict: String,
    failureAttribution: {
        primary: String,
        secondary: String,
        score: Number
    },
    counterfactual: {
        label: String,
        result: String,
        saved: String
    },
    ruleInjection: {
        trigger: String,
        action: String
    },
    emotionalFlow: [String]

}, {
    timestamps: true
});

const JournalLog = mongoose.model("JournalLog", journalLogSchema);

export default JournalLog;
