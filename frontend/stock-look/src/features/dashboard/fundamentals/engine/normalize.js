/**
 * @file normalize.js
 * @purpose Industry-grade normalization logic for transforming raw data into comparable scores.
 * @responsibilities
 * - Normalizes values to a [-1, +1] range.
 * - Applies soft clamping to handle outliers gracefully.
 * - Supports bounds-based scaling and inversion.
 * @key_exports
 * - normalize (Main Utility)
 * @lifecycle
 * - Core math utility used by `evaluateFundamentals`.
 * @date 2026-02-03
 */

// =============================
// Core Logic
// =============================
export function normalize(value, min, max, inverse = false) {
  // Safety checks
  if (value == null || !isFinite(value)) return 0;
  if (min === max) return 0;

  // 1. Normalize to [0...1]
  let x = (value - min) / (max - min);

  // 2. Soft Clamp (prevents hard saturation at extremes)
  x = Math.max(-0.25, Math.min(1.25, x));

  // 3. Convert to [-1...+1]
  let n = x * 2 - 1;

  // 4. Final Clamp
  n = Math.max(-1, Math.min(1, n));

  // 5. Inversion (if required)
  return inverse ? -n : n;
}
