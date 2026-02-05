/* --------------------------------------------------------------------------
   GLOBAL SIGNAL LOGIC
   Centralized logic for determining Buy/Sell/Unknown states and coloring.
-------------------------------------------------------------------------- */

import { colors } from "../styles/palette";

/**
 * Returns the styling configuration for a Reliability Score (0-1)
 */
export function getReliabilityConfig(score = 0) {
    if (score >= 0.8) return { label: "High", className: colors.reliability.high };
    if (score >= 0.6) return { label: "Med", className: colors.reliability.med };
    return { label: "Low", className: colors.reliability.low };
}

/**
 * Derives Credit Allocation from Reliability using Tiered Institutional Logic.
 * Tiers: 1, 3, 5, 8, 12
 */
export const getCreditFromReliability = (reliability = 0.5) => {
    const rel = Number(reliability) || 0;
    if (rel >= 0.95) return 12; // Elite: Immutable Law
    if (rel >= 0.85) return 8;  // Prime: Core Driver
    if (rel >= 0.70) return 5;  // Strategic: Tactical Setup
    if (rel >= 0.45) return 3;  // Standard: Retail Confirmation
    return 1;                   // Micro: Fringe Data
};

/**
 * Returns the Signal State (Bullish/Bearish/Neutral) based on Normalized Score (-1 to 1)
 */
export function getSignalState(normalized = 0) {
    if (normalized > 0.2) {
        return {
            label: "Bullish",
            color: colors.state.bullish.main,
            className: "text-state-bullish-text font-bold"
        };
    }
    if (normalized < -0.2) {
        return {
            label: "Bearish",
            color: colors.state.bearish.main,
            className: "text-state-bearish-text font-bold"
        };
    }
    return {
        label: "Neutral",
        color: colors.state.neutral.main,
        className: "text-state-neutral-text font-medium"
    };
}

/**
 * Returns the Signal State based on Raw Score (0-100)
 * Used for Main Gauge / Composite Scores
 */
export function getCompositeState(score = 0) {
    if (score >= 85) return { label: "STRONG-BUY", className: "text-[#10b981] font-extrabold tracking-tight", color: colors.actions.strongBuy };
    if (score >= 70) return { label: "BUY", className: "text-[#22c55e] font-bold", color: colors.actions.buy };
    if (score >= 55) return { label: "ACCUMULATE", className: "text-[#84cc16] font-bold", color: colors.actions.accumulate };
    if (score >= 45) return { label: "HOLD", className: "text-[#eab308] font-medium opacity-80", color: colors.actions.hold };
    if (score >= 30) return { label: "CAUTION", className: "text-[#f97316] font-bold", color: colors.actions.caution };
    if (score >= 15) return { label: "SELL", className: "text-[#ef4444] font-bold", color: colors.actions.sell };
    return { label: "EXIT", className: "text-[#b91c1c] font-extrabold tracking-tight", color: colors.actions.exit };
}

/**
 * Returns color class for a trend string
 */
export function getTrendColorClass(trend) {
    const t = (trend || "").toLowerCase();
    if (t.includes('bull') || t.includes('up') || t.includes('accel')) return "bg-emerald-600 dark:bg-emerald-500";
    if (t.includes('bear') || t.includes('down') || t.includes('fad')) return "bg-red-600 dark:bg-red-500";
    return "bg-blue-600 dark:bg-blue-500";
}
