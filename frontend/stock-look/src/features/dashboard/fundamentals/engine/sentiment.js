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
    "bull-strong": "var(--state-bullish-main)",
    "bull": "var(--state-bullish-text)",       // Using text variant for cleaner look or main? Let's use main for consistency with old hex.
    // Wait, old hex was #4ade80 (green-400). --state-bullish-text is #34d399 (emerald-400). Close enough.
    // Actually, let's use the explicit variables created in index.css
    "bull-weak": "var(--state-bullish-text)",
    "neutral": "var(--state-neutral-main)",
    "bear-weak": "var(--state-bearish-text)",
    "bear": "var(--state-bearish-text)",
    "bear-strong": "var(--state-bearish-main)",
  };
  return colors[zone] || "var(--state-neutral-main)";
}

/**
 * Get sentiment for display (used in cards)
 */
export function getSentiment(normalized) {
  const { zone, label } = classifyNormalizedScore(normalized);
  const color = getZoneColor(zone);

  return { zone, label, color };
}
