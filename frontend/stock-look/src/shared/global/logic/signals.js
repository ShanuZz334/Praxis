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
    if (score >= 75) return { label: "Bullish", className: "text-state-bullish-text font-bold", color: colors.state.bullish.main };
    if (score >= 60) return { label: "Neutral-Positive", className: "text-state-bullish-text font-bold opacity-80", color: colors.state.bullish.main };
    if (score >= 40) return { label: "Neutral", className: "text-state-neutral-text font-bold", color: colors.state.neutral.main };
    if (score >= 25) return { label: "Neutral-Negative", className: "text-state-bearish-text font-bold opacity-80", color: colors.state.warning.main };
    return { label: "Bearish", className: "text-state-bearish-text font-bold", color: colors.state.bearish.main };
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
