/**
 * Sentiment Classification
 * Classifies scores into zones.
 * Input 'normalized' is assumed to be Directional (-1 = Bad, +1 = Good).
 */

/**
 * Classify a fundamental score (0-100) into sentiment zones
 */
export function classifyFundamentalScore(score) {
  // Score 0-100 is typically already directional (0=Bad, 100=Good)
  // If it's not, the caller should handle it.

  if (score >= 70) {
    return { zone: "bull-strong", label: "Strong Bullish" };
  }
  if (score >= 55) {
    return { zone: "bull", label: "Bullish" };
  }
  if (score >= 45) {
    return { zone: "neutral", label: "Neutral" };
  }
  if (score >= 30) {
    return { zone: "bear", label: "Bearish" };
  }
  return { zone: "bear-strong", label: "Strong Bearish" };
}

/**
 * Classify normalized score (-1 to 1) into sentiment zones
 * Input is assumed to be directional (High = Bullish, Low = Bearish)
 */
export function classifyNormalizedScore(normalized) {
  if (normalized > 0.5) {
    return { zone: "bull-strong", label: "Strong Bullish" };
  }
  if (normalized > 0.2) {
    return { zone: "bull", label: "Bullish" };
  }
  if (normalized > -0.2) {
    return { zone: "neutral", label: "Neutral" };
  }
  if (normalized > -0.5) {
    return { zone: "bear", label: "Bearish" };
  }
  return { zone: "bear-strong", label: "Strong Bearish" };
}

/**
 * Get color for a zone
 * Using professional palette
 */
export function getZoneColor(zone) {
  const colors = {
    "bull-strong": "#22c55e", // Green 500
    "bull": "#4ade80",        // Green 400
    "bull-weak": "#86efac",   // Green 300
    "neutral": "#94a3b8",     // Slate 400
    "bear-weak": "#fca5a5",   // Red 300
    "bear": "#f87171",        // Red 400
    "bear-strong": "#ef4444", // Red 500
  };
  return colors[zone] || "#94a3b8";
}

/**
 * Get sentiment for display (used in cards)
 */
export function getSentiment(normalized) {
  const { zone, label } = classifyNormalizedScore(normalized);
  const color = getZoneColor(zone);

  return { zone, label, color };
}
