import mongoose from "mongoose";

const TechnicalAnalysisSchema = new mongoose.Schema({
  symbol: { type: String, required: true, index: true },
  datetime: { type: Date, required: true },

  // Momentum Indicators
  rsi: Number,
  stoch_k: Number,
  stoch_d: Number,
  macd: Number,
  macd_signal: Number,
  macd_hist: Number,

  // Trend Indicators
  sma_5: Number,
  sma_20: Number,
  ema_5: Number,
  ema_20: Number,
  adx: Number,
  supertrend: Number,

  // Volatility
  atr: Number,
  bollinger_upper: Number,
  bollinger_middle: Number,
  bollinger_lower: Number,

  // Pivot Points
  pivot_point: Number,
  support_1: Number,
  support_2: Number,
  support_3: Number,
  resistance_1: Number,
  resistance_2: Number,
  resistance_3: Number,

}, { timestamps: true });

const TechnicalAnalysis = mongoose.model("TechnicalAnalysis", TechnicalAnalysisSchema);
export default TechnicalAnalysis;
