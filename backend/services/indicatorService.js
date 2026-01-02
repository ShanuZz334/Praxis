import TechnicalAnalysis from "../models/TechnicalAnalysis.js";

// Fetch latest indicators for a symbol
export const getLatestIndicators = async (symbol) => {
  try {
    const latest = await TechnicalAnalysis.findOne({ symbol })
      .sort({ datetime: -1 });

    return latest || null;
  } catch (err) {
    throw new Error(`Error fetching indicators: ${err.message}`);
  }
};

// Fetch historical indicators (for charts)
export const getIndicatorsHistory = async (symbol, limit = 50) => {
  try {
    const history = await TechnicalAnalysis.find({ symbol })
      .sort({ datetime: -1 })
      .limit(limit);

    return history.reverse(); // oldest → newest
  } catch (err) {
    throw new Error(`Error fetching indicators history: ${err.message}`);
  }
};

// Safe pivot point calculation
export const calculatePivotPoints = (high, low, close) => {
  high = Number(high) || 0;
  low = Number(low) || 0;
  close = Number(close) || 0;

  const pivot = (high + low + close) / 3;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);
  const r3 = high + 2 * (pivot - low);
  const s3 = low - 2 * (high - pivot);

  return { pivot, r1, r2, r3, s1, s2, s3 };
};
