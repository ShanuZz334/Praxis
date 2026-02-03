/**
 * @file score.js
 * @purpose Calculates the final credit-weighted score for a card.
 * @responsibilities
 * - Maps normalized values to a credit-weighted scale.
 * - Output ranges from [0 ... maxCredit].
 * @key_exports
 * - score
 * @lifecycle
 * - Utility used for final score computation (if needed separately from index.js).
 * @date 2026-02-03
 */

// =============================
// Core Logic
// =============================
export function score(normalized, maxCredit) {
  if (!isFinite(normalized) || !isFinite(maxCredit)) return 0;

  // Map [-1, 1] -> [0, 1] -> [0, maxCredit]
  const s = ((normalized + 1) / 2) * maxCredit;

  return Math.round(
    Math.max(0, Math.min(maxCredit, s))
  );
}
