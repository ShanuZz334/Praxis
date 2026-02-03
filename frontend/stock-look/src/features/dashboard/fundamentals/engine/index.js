/**
 * @file index.js
 * @purpose Core entry point for the Fundamentals Engine.
 * @responsibilities
 * - Orchestrates the evaluation of all fundamental cards.
 * - Aggregates section scores and calculates the final weighted composite score.
 * - Determines the market regime (Risk-On/Risk-Off) and confidence level.
 * @key_exports
 * - evaluateFundamentals (Main Computation Function)
 * @dependencies
 * - cards.config.js: Card definitions.
 * - bounds.js: Normalization bounds.
 * - normalize.js: Scaling logic.
 * - sections.config.js: Section weightings.
 * @lifecycle
 * - Called by `FundamentalPage` or `FundamentalSystem` hooks.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import { FUNDAMENTAL_CARDS } from "./cards.config";
import { BOUNDS } from "./bounds";
import { normalize } from "./normalize";
import { SECTION_WEIGHTS } from "./sections.config";

// =============================
// Core Logic: Evaluation
// =============================
export function evaluateFundamentals(snapshot) {
  // 1. Calculate Score for Each Card
  const evaluatedCards = FUNDAMENTAL_CARDS.map((c) => {
    const b = BOUNDS[c.id] || { min: 0, max: 100 };
    const raw = snapshot[c.id];

    // Normalize raw value to [-1, 1]
    const n = normalize(raw, b.min, b.max, b.inverse);

    // Credit Score acts as a confidence/impact dampener
    const credit = c.creditScore || 0.5;

    // Final score contribution
    const score = n * credit;

    return {
      ...c,
      raw,
      normalized: n,
      creditScore: credit,
      score: score,
    };
  });

  // 2. Group by Section & Calculate Average Scores
  const sectionScores = {};
  const sectionCounts = {};

  evaluatedCards.forEach((card) => {
    const section = card.category || "Other";
    if (!sectionScores[section]) {
      sectionScores[section] = 0;
      sectionCounts[section] = 0;
    }
    sectionScores[section] += card.score;
    sectionCounts[section] += 1;
  });

  const averagedSectionScores = {};
  Object.keys(sectionScores).forEach((section) => {
    const count = sectionCounts[section];
    averagedSectionScores[section] = count > 0 ? sectionScores[section] / count : 0;
  });

  // 3. Calculate Final Weighted Fundamental Score
  let totalWeightedScore = 0;
  let totalWeightUsed = 0;

  Object.keys(SECTION_WEIGHTS).forEach((section) => {
    const weight = SECTION_WEIGHTS[section];
    const sectionScore = averagedSectionScores[section] || 0;

    totalWeightedScore += sectionScore * weight;
    totalWeightUsed += weight;
  });

  // Normalize final score
  const finalNormalizedScore = totalWeightUsed > 0 ? totalWeightedScore / totalWeightUsed : 0;

  // 4. Map to 0-100 Gauge Scale
  const gauge = Math.round(((finalNormalizedScore + 1) / 2) * 100);

  // 5. Determine Market Regime
  let regime = "Balanced";
  if (gauge >= 70) regime = "Risk-On";
  else if (gauge < 40) regime = "Risk-Off";

  // 6. Calculate Confidence (Variance Check)
  const scores = Object.values(averagedSectionScores);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;

  let confidence = "High";
  if (variance > 0.1) confidence = "Medium";
  if (variance > 0.25) confidence = "Low";

  return {
    gauge, // 0-100
    regime,
    confidence,
    normalizedScore: finalNormalizedScore,
    cards: evaluatedCards,
    sections: averagedSectionScores
  };
}
