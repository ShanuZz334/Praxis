/**
 * Industry-standard card score
 * Output ∈ [0 … maxCredit]
 */
export function score(normalized, maxCredit) {
  if (!isFinite(normalized) || !isFinite(maxCredit)) return 0;

  const s = ((normalized + 1) / 2) * maxCredit;

  return Math.round(
    Math.max(0, Math.min(maxCredit, s))
  );
}
