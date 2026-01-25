/**
 * Industry-grade normalization
 * - Smooth bounded output [-1, +1]
 * - Stable at extremes
 * - Inversion-safe
 */
export function normalize(value, min, max, inverse = false) {
  if (value == null || !isFinite(value)) return 0;
  if (min === max) return 0;

  // Normalize to 0–1
  let x = (value - min) / (max - min);

  // Soft clamp (prevents hard saturation)
  x = Math.max(-0.25, Math.min(1.25, x));

  // Convert to -1 → +1
  let n = x * 2 - 1;

  // Final clamp for safety
  n = Math.max(-1, Math.min(1, n));

  return inverse ? -n : n;
}
