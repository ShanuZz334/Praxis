/**
 * @file labelMappings.js
 * @purpose Centralized label mapping system for all composite scores and regimes.
 * @responsibilities
 * - Provides 4 distinct label mapping tables:
 *   1. Master Gauge (Trading Action Engine)
 *   2. Master Regime (User Behaviour Guidance)
 *   3. Non-Master Gauge (Structural Health)
 *   4. Non-Master Regime (Market Environment Classification)
 * @key_exports
 * - getMasterGaugeLabel
 * - getMasterRegimeLabel
 * - getNonMasterGaugeLabel
 * - getNonMasterRegimeLabel
 * @date 2026-02-04
 */

// =============================
// TABLE 1: MASTER GAUGE
// Purpose: Tell user what action to take
// Used in: Master Dashboard (Stocky Composite)
// =============================

export function getMasterGaugeLabel(score) {
    if (score >= 85) return {
        label: "Strong Buy",
        color: "#059669",
        meaning: "High confidence opportunity"
    };
    if (score >= 70) return {
        label: "Buy",
        color: "#10B981",
        meaning: "Favor upside participation"
    };
    if (score >= 55) return {
        label: "Accumulate",
        color: "#84CC16",
        meaning: "Gradually build exposure"
    };
    if (score >= 45) return {
        label: "Hold / Watch",
        color: "#64748B",
        meaning: "Wait for clearer confirmation"
    };
    if (score >= 30) return {
        label: "Reduce Exposure",
        color: "#F59E0B",
        meaning: "Risk increasing"
    };
    if (score >= 15) return {
        label: "Sell",
        color: "#F97316",
        meaning: "Downside pressure building"
    };
    return {
        label: "Exit / Risk Off",
        color: "#DC2626",
        meaning: "Preserve capital"
    };
}

// =============================
// TABLE 2: MASTER REGIME
// Purpose: Tell user how to behave in current market
// Used in: Master Dashboard (Stocky Composite)
// =============================

export function getMasterRegimeLabel(score) {
    if (score >= 85) return {
        label: "Aggressive Opportunity",
        color: "#059669",
        behaviour: "Favor trend continuation and higher exposure"
    };
    if (score >= 70) return {
        label: "Opportunity Favorable",
        color: "#10B981",
        behaviour: "Prefer directional setups"
    };
    if (score >= 55) return {
        label: "Gradual Positioning",
        color: "#84CC16",
        behaviour: "Build positions cautiously"
    };
    if (score >= 45) return {
        label: "Selective Participation",
        color: "#64748B",
        behaviour: "Focus only high conviction trades"
    };
    if (score >= 30) return {
        label: "Defensive Positioning",
        color: "#F59E0B",
        behaviour: "Tighten stops and reduce leverage"
    };
    if (score >= 15) return {
        label: "Capital Protection Mode",
        color: "#F97316",
        behaviour: "Hedge and reduce market exposure"
    };
    return {
        label: "Risk-Off Environment",
        color: "#DC2626",
        behaviour: "Avoid entries and protect capital"
    };
}

// =============================
// TABLE 3: NON-MASTER GAUGE
// Purpose: Explain quality of supporting drivers
// Used in: Technical, Fundamental, Options, Global pages
// =============================

export function getNonMasterGaugeLabel(score) {
    if (score >= 85) return {
        label: "Structural Strength",
        color: "#059669",
        meaning: "Strong supportive environment"
    };
    if (score >= 70) return {
        label: "Positive Alignment",
        color: "#10B981",
        meaning: "Majority of drivers supportive"
    };
    if (score >= 55) return {
        label: "Improving Structure",
        color: "#84CC16",
        meaning: "Strength gradually forming"
    };
    if (score >= 45) return {
        label: "Balanced Structure",
        color: "#64748B",
        meaning: "Mixed environment"
    };
    if (score >= 30) return {
        label: "Weakening Structure",
        color: "#F59E0B",
        meaning: "Support fading"
    };
    if (score >= 15) return {
        label: "Structural Pressure",
        color: "#F97316",
        meaning: "Negative drivers increasing"
    };
    return {
        label: "Structural Breakdown",
        color: "#DC2626",
        meaning: "Strong adverse conditions"
    };
}

// =============================
// TABLE 4: NON-MASTER REGIME
// Purpose: Explain overall market state
// Used in: Technical, Fundamental, Options, Global pages
// =============================

export function getNonMasterRegimeLabel(score) {
    if (score >= 85) return {
        label: "Expansion Phase",
        color: "#059669",
        description: "Broad participation and strong momentum"
    };
    if (score >= 70) return {
        label: "Growth Phase",
        color: "#10B981",
        description: "Sustained positive directional movement"
    };
    if (score >= 55) return {
        label: "Constructive Phase",
        color: "#84CC16",
        description: "Early strength building"
    };
    if (score >= 45) return {
        label: "Balanced Phase",
        color: "#64748B",
        description: "Mixed or range-bound environment"
    };
    if (score >= 30) return {
        label: "Fragile Phase",
        color: "#F59E0B",
        description: "Momentum weakening"
    };
    if (score >= 15) return {
        label: "Distribution Phase",
        color: "#F97316",
        description: "Selling pressure increasing"
    };
    return {
        label: "Stress Phase",
        color: "#DC2626",
        description: "Instability or breakdown conditions"
    };
}
