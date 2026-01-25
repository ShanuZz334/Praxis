import { FUNDAMENTAL_CARDS } from "./cards.config";
import { BOUNDS } from "./bounds";
import { normalize } from "./normalize";
import { SECTION_WEIGHTS } from "./sections.config";

/**
 * Industry-standard fundamentals evaluator (Refactored)
 * - Single Authoritative Gauge
 * - Weighted Sections
 * - Reliability-based Scoring
 */
export function evaluateFundamentals(snapshot) {
  // 1. Calculate Score for Each Card
  const evaluatedCards = FUNDAMENTAL_CARDS.map((c) => {
    const b = BOUNDS[c.id] || { min: 0, max: 100 }; // Fallback bound
    const raw = snapshot[c.id];

    // Normalized [-1 to +1]
    const n = normalize(raw, b.min, b.max, b.inverse);

    // Credit Score [0.5 to 1.0]
    const credit = c.creditScore || 0.5;

    // Final Card Score [-1 to +1 scaled by credit]
    // Note: We keep it in -1..1 range conceptually for aggregation, 
    // but the credit acts as a "confidence/impact" dampener if we wanted, 
    // OR we can treat it as a direct weight.
    // User Formula: cardScore = normalized * creditScore
    // If normalized is 1 and credit is 0.9, score is 0.9.
    const score = n * credit;

    return {
      ...c,
      raw,
      normalized: n,
      creditScore: credit,
      score: score, // This is the contributing score
    };
  });

  // 2. Group by Section & Calculate Section Scores
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

  // Calculate Average Section Score
  // This prevents sections with more cards from overpowering just by count.
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
    // Use the computed average for this section, or 0 if missing (neutral)
    const sectionScore = averagedSectionScores[section] || 0;

    totalWeightedScore += sectionScore * weight;
    totalWeightUsed += weight;
  });

  // Normalize final score if weights don't sum to exactly 1 (safety)
  const finalNormalizedScore = totalWeightUsed > 0 ? totalWeightedScore / totalWeightUsed : 0;

  // 4. Map to 0-100 Scale
  // [-1 ... +1] -> [0 ... 100]
  const gauge = Math.round(((finalNormalizedScore + 1) / 2) * 100);

  // 5. Determine Market Regime
  let regime = "Balanced";
  if (gauge >= 70) regime = "Risk-On";
  if (gauge < 40) regime = "Risk-Off";

  // 6. Calculate Confidence (based on dispersion)
  // Simple variance check between section scores
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
    sections: averagedSectionScores // Useful for debugging/deep dive
  };
}
