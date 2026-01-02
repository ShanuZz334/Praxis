import { fetchLivePrice, fetchOptionChain } from "../services/upstoxService.js";
import { getLatestIndicators } from "../services/indicatorService.js";
import OptionAnalysis from "../models/OptionAnalysis.js";
import ForeignMarket from "../models/ForeignMarket.js";

// GET /api/dashboard
export const getDashboardData = async (req, res) => {
  try {
    // ---------------- Overview ----------------
    const symbol = "NIFTY50"; // default, can be dynamic

    const liveData = await fetchLivePrice(symbol);

    if (!liveData) {
      return res.status(500).json({ message: "Unable to fetch live data" });
    }

    const overview = {
      symbol,
      current_price: liveData.last_price ?? 0,
      open: liveData.open ?? 0,
      high: liveData.high ?? 0,
      low: liveData.low ?? 0,
      close: liveData.close ?? 0,
      volume: liveData.volume ?? 0,
    };

    // ---------------- Technical Summary ----------------
    const technicals = await getLatestIndicators(symbol);

    const technical_summary = technicals
      ? {
          rsi: technicals.rsi ?? null,
          macd: technicals.macd_hist ?? null,
          atr: technicals.atr ?? null,
          sma_5: technicals.sma_5 ?? null,
          sma_20: technicals.sma_20 ?? null,
          ema_5: technicals.ema_5 ?? null,
          ema_20: technicals.ema_20 ?? null,
        }
      : {};

    // ---------------- Options Summary ----------------
    const options = await OptionAnalysis.find({ symbol }).sort({
      expiry_date: 1,
      strike_price: 1,
    });

    let total_oi = 0,
      total_put_oi = 0,
      total_call_oi = 0;

    let max_pain_strike = null,
      max_pain_val = Infinity;

    options.forEach((opt) => {
      const oi = opt.open_interest ?? 0;

      total_oi += oi;

      if (opt.option_type === "PE") total_put_oi += oi;
      if (opt.option_type === "CE") total_call_oi += oi;

      // Simple max pain
      if (oi < max_pain_val) {
        max_pain_val = oi;
        max_pain_strike = opt.strike_price;
      }
    });

    const put_call_ratio =
      total_call_oi > 0 ? (total_put_oi / total_call_oi).toFixed(2) : 0;

    const options_summary = {
      total_oi,
      put_call_ratio,
      max_pain_strike,
    };

    // ---------------- Performance ----------------
    const close = Number(overview.close) || 1; // prevent divide by zero
    const cp = Number(overview.current_price) || 0;

    const change_percent = ((cp - close) / close) * 100;

    let trend = "Neutral";
    if (change_percent > 0.2) trend = "Bullish";
    else if (change_percent < -0.2) trend = "Bearish";

    const performance = {
      change_percent: change_percent.toFixed(2),
      trend,
    };

    // ---------------- Response ----------------
    return res.status(200).json({
      overview,
      technical_summary,
      options_summary,
      performance,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err.message);
    return res.status(500).json({
      message: "Error fetching dashboard data",
      error: err.message,
    });
  }
};
