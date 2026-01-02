import mongoose from "mongoose";

const DashboardSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  overview: {
    symbol: { type: String, default: "NIFTY 50" },
    current_price: Number,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
  },
  technical_summary: {
    rsi: Number,
    macd: Number,
    atr: Number,
    sma_5: Number,
    sma_20: Number,
    ema_5: Number,
    ema_20: Number,
  },
  options_summary: {
    total_oi: Number,
    put_call_ratio: Number,
    max_pain_strike: Number,
  },
  performance: {
    change_percent: Number,
    trend: { type: String, enum: ["Bullish", "Bearish", "Neutral"], default: "Neutral" },
  },
});

const Dashboard = mongoose.model("Dashboard", DashboardSchema);
export default Dashboard;
