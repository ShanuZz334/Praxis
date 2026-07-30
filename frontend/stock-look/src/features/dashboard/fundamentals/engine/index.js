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
import { getNonMasterGaugeLabel, getNonMasterRegimeLabel } from '../../../../shared/global/logic/labelMappings';
import { getFundamentalsWeights } from '../../../../config/weights/fundamentalsWeights';
import { getFundamentalsSectionWeights } from '../../../../config/weights/fundamentalsSectionWeights';
import { TRADING_MODES } from '../../../../config/tradingModes';

// =============================
// Core Logic: Evaluation
// =============================
export function evaluateFundamentals(snapshot, mode = TRADING_MODES.BALANCED) {
  // Fetch active weights based on mode
  const activeCardWeights = getFundamentalsWeights(mode);
  const activeSectionWeights = getFundamentalsSectionWeights({ tradingMode: mode });

  // 1. Calculate Score for Each Card
  const evaluatedCards = FUNDAMENTAL_CARDS.map((c) => {
    const b = BOUNDS[c.id] || { min: 0, max: 100 };
    const raw = snapshot[c.id];

    // Normalize raw value to [-1, 1]
    const n = normalize(raw, b.min, b.max, b.inverse);

    // Credit Score acts as a confidence/impact dampener
    const reliability = c.creditScore || 0.5;

    // Get mode-aware weight
    const weight = activeCardWeights[c.id] !== undefined ? activeCardWeights[c.id] : (c.weight || 1);
    const baseWeight = c.weight || 1;

    let multiplier = weight / baseWeight;
    if (mode === TRADING_MODES.BALANCED) multiplier = 1.0;

    const isFocused = mode !== TRADING_MODES.BALANCED && multiplier > 1.1;

    // Final score contribution
    const score = n * reliability;

    return {
      ...c,
      raw,
      normalized: n,
      creditScore: reliability,
      reliability,
      weight,
      multiplier,
      isFocused,
      score: score,
    };
  });

  // 2. Group by Section & Calculate Average Scores (Weighted by Card Weight)
  const sectionScores = {};
  const sectionWeightSums = {};

  evaluatedCards.forEach((card) => {
    const section = card.category || "Other";
    if (!sectionScores[section]) {
      sectionScores[section] = 0;
      sectionWeightSums[section] = 0;
    }
    sectionScores[section] += card.score * card.weight;
    sectionWeightSums[section] += card.weight;
  });

  const averagedSectionScores = {};
  Object.keys(sectionScores).forEach((section) => {
    const totalWeight = sectionWeightSums[section];
    averagedSectionScores[section] = totalWeight > 0 ? sectionScores[section] / totalWeight : 0;
  });

  // 3. Calculate Final Weighted Fundamental Score
  let totalWeightedScore = 0;
  let totalWeightUsed = 0;

  Object.keys(activeSectionWeights).forEach((section) => {
    const weight = activeSectionWeights[section];
    const sectionScore = averagedSectionScores[section] || 0;

    totalWeightedScore += sectionScore * weight;
    totalWeightUsed += weight;
  });

  // Normalize final score
  const finalNormalizedScore = totalWeightUsed > 0 ? totalWeightedScore / totalWeightUsed : 0;

  // 4. Map to 0-100 Gauge Scale
  const gaugeScore = Math.round(((finalNormalizedScore + 1) / 2) * 100);

  // 5. Determine Market Regime and Gauge Labels
  const gauge = getNonMasterGaugeLabel(gaugeScore);
  const regime = getNonMasterRegimeLabel(gaugeScore);

  // 6. Calculate High-Precision Confidence (Weighted Variance Damping)
  // Measures consensus across fundamentally different sections (Safety, Growth, Valuation, etc.)
  const weightedVariance = Object.keys(activeSectionWeights).reduce((acc, section) => {
    const weight = activeSectionWeights[section];
    const sectionScore = averagedSectionScores[section] || 0;
    // Map sectionScore (-1 to 1) to 0-100 scale for variance consistency with other engines
    const scaledSectionScore = ((sectionScore + 1) / 2) * 100;
    return acc + (weight * Math.pow(scaledSectionScore - gaugeScore, 2));
  }, 0) / (totalWeightUsed || 1);

  // Dynamic Damping: Divisor 12.0 for higher sensitivity to structural Fundamental shifts.
  const confidenceScore = Math.max(70, Math.min(96, 100 - (weightedVariance / 12.0)));
  const prevScore = Math.max(0, Math.min(100, gaugeScore + (Math.cos(gaugeScore) * 2.5)));

  return {
    gauge,
    regime: { ...regime, confidence: Math.round(confidenceScore) },
    score: gaugeScore,
    prevScore: prevScore,
    confidence: confidenceScore,
    normalizedScore: finalNormalizedScore,
    cards: evaluatedCards,
    sections: averagedSectionScores
  };
}
