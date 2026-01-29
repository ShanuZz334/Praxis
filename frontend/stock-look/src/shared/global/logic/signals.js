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
            className: "text-emerald-400"
        };
    }
    if (normalized < -0.2) {
        return {
            label: "Bearish",
            color: colors.state.bearish.main,
            className: "text-red-400"
        };
    }
    return {
        label: "Neutral",
        color: colors.state.neutral.main,
        className: "text-slate-400"
    };
}

/**
 * Returns the Signal State based on Raw Score (0-100)
 * Used for Main Gauge / Composite Scores
 */
export function getCompositeState(score = 0) {
    if (score >= 70) return { label: "Bullish", className: "text-emerald-400", color: colors.state.bullish.main };
    if (score >= 55) return { label: "Neutral-Positive", className: "text-emerald-400/80", color: colors.state.bullish.main };
    if (score >= 45) return { label: "Neutral", className: "text-slate-200", color: colors.state.neutral.main };
    if (score >= 30) return { label: "Neutral-Negative", className: "text-orange-400", color: colors.state.warning.main };
    return { label: "Bearish", className: "text-red-500", color: colors.state.bearish.main };
}

/**
 * Returns color class for a trend string
 */
export function getTrendColorClass(trend) {
    const t = (trend || "").toLowerCase();
    if (t.includes('bull') || t.includes('up') || t.includes('accel')) return "bg-emerald-500";
    if (t.includes('bear') || t.includes('down') || t.includes('fad')) return "bg-red-500";
    return "bg-blue-400";
}
