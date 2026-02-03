/**
 * @file sentiment.js
 * @purpose Sentiment classification logic for Fundamental Scores.
 * @responsibilities
 * - Classifies normalized scores into zones (Bullish, Neutral, Bearish).
 * - Maps confidence zones to visual colors.
 * - Provides utilities for both raw percentage (0-100) and normalized (-1 to 1) inputs.
 * @key_exports
 * - classifyFundamentalScore
 * - classifyNormalizedScore
 * - getZoneColor
 * - getSentiment
 * @lifecycle
 * - Used by UI components and Intelligence engine.
 * @date 2026-02-03
 */

// =============================
// Classification Logic
// =============================

/**
 * Classify a percentage score (0-100)
 */
export function classifyFundamentalScore(score) {
  if (score >= 70) return { zone: "bull-strong", label: "Strong Bullish" };
  if (score >= 55) return { zone: "bull", label: "Bullish" };
  if (score >= 45) return { zone: "neutral", label: "Neutral" };
  if (score >= 30) return { zone: "bear", label: "Bearish" };
  return { zone: "bear-strong", label: "Strong Bearish" };
}

/**
 * Classify a normalized score (-1 to 1)
 */
export function classifyNormalizedScore(normalized) {
  if (normalized > 0.5) return { zone: "bull-strong", label: "Strong Bullish" };
  if (normalized > 0.2) return { zone: "bull", label: "Bullish" };
  if (normalized > -0.2) return { zone: "neutral", label: "Neutral" };
  if (normalized > -0.5) return { zone: "bear", label: "Bearish" };
  return { zone: "bear-strong", label: "Strong Bearish" };
}

// =============================
// Helper: Color Mapping
// =============================
export function getZoneColor(zone) {
  const colors = {
    "bull-strong": "var(--state-bullish-main)",
    "bull": "var(--state-bullish-text)",
    "bull-weak": "var(--state-bullish-text)",
    "neutral": "var(--state-neutral-main)",
    "bear-weak": "var(--state-bearish-text)",
    "bear": "var(--state-bearish-text)",
    "bear-strong": "var(--state-bearish-main)",
  };
  return colors[zone] || "var(--state-neutral-main)";
}

// =============================
// Main Export for UI
// =============================
export function getSentiment(normalized) {
  const { zone, label } = classifyNormalizedScore(normalized);
  const color = getZoneColor(zone);

  return { zone, label, color };
}
