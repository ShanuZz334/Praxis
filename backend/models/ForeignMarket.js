import mongoose from "mongoose";

const ForeignMarketSchema = new mongoose.Schema(
  {
    asset_name: {
      type: String,
      required: true,
      enum: [
        "DAX",
        "FTSE 100",
        "CAC 40",
        "S&P 500",
        "Dow Jones",
        "NASDAQ",
        "Nikkei 225",
        "Gold",
        "Silver",
        "Crude Oil (WTI)",
        "Crude Oil (Brent)",
        "US 10Y Yield",
      ],
    },

    symbol: { type: String, required: true, index: true },

    category: {
      type: String,
      enum: ["Index", "Commodity", "Bond"],
      required: true,
    },

    current_price: { type: Number, required: true },
    change: { type: Number, default: 0 },
    percent_change: { type: Number, default: 0 },

    high: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    open: { type: Number, default: 0 },
    previous_close: { type: Number, default: 0 },

    currency: { type: String, default: "USD" },

    last_updated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Performance index
ForeignMarketSchema.index({
  symbol: 1,
  asset_name: 1,
  category: 1,
});

const ForeignMarket = mongoose.model(
  "ForeignMarket",
  ForeignMarketSchema
);

export default ForeignMarket;
