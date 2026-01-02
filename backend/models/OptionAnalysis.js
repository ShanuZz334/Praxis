import mongoose from "mongoose";

const OptionAnalysisSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, index: true },
    expiry_date: { type: Date, required: true, index: true },
    strike_price: { type: Number, required: true, index: true },
    option_type: { type: String, enum: ["CE", "PE"], required: true },

    ltp: Number,
    open_interest: Number,
    change_in_oi: Number,
    volume: Number,
    bid_price: Number,
    bid_qty: Number,
    ask_price: Number,
    ask_qty: Number,
    implied_volatility: Number,

    delta: Number,
    gamma: Number,
    theta: Number,
    vega: Number,
    rho: Number,

    max_pain: Number,
    intrinsic_value: Number,
    time_value: Number,
    percentage_change: Number,

    trend: {
      type: String,
      enum: ["Bullish", "Bearish", "Neutral"],
      default: "Neutral",
    },

    last_updated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index for fast searching in dashboard
OptionAnalysisSchema.index({
  symbol: 1,
  expiry_date: 1,
  strike_price: 1,
  option_type: 1,
});

const OptionAnalysis = mongoose.model(
  "OptionAnalysis",
  OptionAnalysisSchema
);

export default OptionAnalysis;
