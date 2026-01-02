import mongoose from "mongoose";

const FundamentalAnalysisSchema = new mongoose.Schema({
  symbol: { type: String, required: true, index: true },
  name: { type: String },
  sector: { type: String },
  industry: { type: String },
  exchange: { type: String, default: "NSE" },

  // Price & Market Metrics
  current_price: Number,
  previous_close: Number,
  open_price: Number,
  day_high: Number,
  day_low: Number,
  fifty_two_week_high: Number,
  fifty_two_week_low: Number,
  market_cap: Number,
  shares_outstanding: Number,

  // Valuation Ratios
  pe_ratio: Number,
  forward_pe: Number,
  peg_ratio: Number,
  price_to_book: Number,
  price_to_sales: Number,
  enterprise_value: Number,
  ev_to_ebitda: Number,

  // Profitability
  eps: Number,
  roe: Number,
  roa: Number,
  net_profit_margin: Number,

  // Liquidity & Leverage
  current_ratio: Number,
  quick_ratio: Number,
  debt_to_equity: Number,
  interest_coverage: Number,

  // Dividend Metrics
  dividend_yield: Number,
  dividend_per_share: Number,
  payout_ratio: Number,

  // Growth Metrics
  revenue_growth: Number,
  eps_growth: Number,
  free_cash_flow: Number,
  operating_cash_flow: Number,

  // Optional Notes
  analyst_rating: { type: String, enum: ["Strong Buy","Buy","Hold","Sell","Strong Sell"] },
  source: { type: String },
  last_updated: { type: Date, default: Date.now },
}, { timestamps: true });

const FundamentalAnalysis = mongoose.model("FundamentalAnalysis", FundamentalAnalysisSchema);
export default FundamentalAnalysis;
