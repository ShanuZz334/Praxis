/* --------------------------------------------------------------------------
   GLOBAL SIGNAL LOGIC
   Centralized logic for determining Status, Regime, and Reliability states.
   Matches the Praxis standard color palettes defined in colors.js
-------------------------------------------------------------------------- */

import { PRAXIS_COLORS } from "../styles/colors";

/**
 * Returns the styling configuration for a Reliability Score (0-1)
 */
export function getReliabilityConfig(score = 0) {
    if (score >= 0.8) return { label: "High", className: "text-state-bullish-text" };
    if (score >= 0.6) return { label: "Med", className: "text-state-warning-text" };
    return { label: "Low", className: "text-state-neutral-text" };
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
            color: PRAXIS_COLORS.status5.strong,
            className: "text-state-bullish-text font-bold"
        };
    }
    if (normalized < -0.2) {
        return {
            label: "Bearish",
            color: PRAXIS_COLORS.status5.poor,
            className: "text-state-bearish-text font-bold"
        };
    }
    return {
        label: "Neutral",
        color: PRAXIS_COLORS.status5.balanced,
        className: "text-state-neutral-text font-medium"
    };
}

/**
 * Returns the Signal State based on Raw Score (0-100) using 7-Level Scale
 * Used for Main Gauge / Composite Scores
 */
export function getCompositeState(score = 0) {
    if (score >= 90) return { label: "EXCEPTIONAL", className: "text-[var(--color-praxis-blue)] font-extrabold tracking-tight", color: PRAXIS_COLORS.status7.exceptional };
    if (score >= 75) return { label: "STRONG", className: "text-[var(--color-praxis-green)] font-bold", color: PRAXIS_COLORS.status7.strong };
    if (score >= 60) return { label: "CONSTRUCTIVE", className: "text-[#22C55E] font-bold", color: PRAXIS_COLORS.status7.constructive };
    if (score >= 45) return { label: "BALANCED", className: "text-[var(--color-praxis-amber)] font-medium", color: PRAXIS_COLORS.status7.balanced };
    if (score >= 30) return { label: "WEAK", className: "text-[#F79009] font-bold", color: PRAXIS_COLORS.status7.weak };
    if (score >= 15) return { label: "HIGH RISK", className: "text-[#F04438] font-bold", color: PRAXIS_COLORS.status7.highRisk };
    return { label: "EXTREME RISK", className: "text-[var(--color-praxis-red)] font-extrabold tracking-tight", color: PRAXIS_COLORS.status7.extremeRisk };
}

/**
 * Returns color class for a trend string (using new Praxis standardized classes)
 */
export function getTrendColorClass(trend) {
    const t = (trend || "").toLowerCase();
    if (t.includes('bull') || t.includes('up') || t.includes('accel')) return "bg-[var(--color-praxis-green)]";
    if (t.includes('bear') || t.includes('down') || t.includes('fad')) return "bg-[var(--color-praxis-red)]";
    return "bg-[var(--color-praxis-blue)]";
}
