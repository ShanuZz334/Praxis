/**
 * @file stockyEngine.js
 * @purpose Core engine for calculating the aggregate Stocky Score and determining market regimes.
 * @responsibilities
 * - Calculates weighted composite score from multiple data sources (Technical, Options, Fundamental, etc.).
 * - Derives the current market regime based on the score and volatility state.
 * - Provides visual color mapping for different regimes.
 * @key_exports
 * - calculateStockyScore, deriveMasterRegime, getRegimeColor
 * @dependencies
 * - None
 * @lifecycle
 * - Used by MasterDashboard to compute and display the main gauge and regime status.
 * @date 2026-02-03
 */

// =============================
// Constants & Configuration
// =============================

const WEIGHTS = {
    technical: 0.30,
    options: 0.25,
    fundamental: 0.20,
    global: 0.15,
    events: 0.10
};

// =============================
// Core Scoring Logic
// =============================

/**
 * Calculates a weighted aggregate score (0-100).
 * @param {Object} components - Object containing individual component scores.
 * @returns {number} Rounded aggregate score.
 */
export function calculateStockyScore(components) {
    if (!components) return 0;

    const score =
        (components.technical * WEIGHTS.technical) +
        (components.options * WEIGHTS.options) +
        (components.fundamental * WEIGHTS.fundamental) +
        (components.events * WEIGHTS.events) +
        (components.global * WEIGHTS.global);

    return Math.round(score);
}

// =============================
// Regime Derivation
// =============================

/**
 * Determines the market regime based on the score and volatility.
 * @param {number} score - Aggregate Stocky Score.
 * @param {string} volatilityState - Current volatility state (e.g., "High", "Volatile").
 * @returns {string} The derived regime name.
 */
export function deriveMasterRegime(score, volatilityState) {
    const isHighVol = ["High", "Elevated", "Volatile"].includes(volatilityState);

    if (score >= 75) {
        return isHighVol ? "Volatile Breakout" : "Risk-On Trend";
    }
    if (score >= 60) {
        return isHighVol ? "Emotional Rally" : "Selective Bullish";
    }
    if (score >= 40) {
        return isHighVol ? "Choppy / Uncertain" : "Neutral / Range";
    }
    if (score >= 25) {
        return isHighVol ? "Liquidation Risk" : "Defensive / Hedge";
    }
    return "Capital Protection";
}

// =============================
// Visual Helpers
// =============================

/**
 * Returns the Tailwind CSS classes corresponding to a regime.
 * @param {string} regime - The market regime name.
 * @returns {string} Tailwind CSS class string.
 */
export function getRegimeColor(regime) {
    switch (regime) {
        case "Risk-On Trend":
        case "Volatile Breakout":
            return "text-emerald-600 dark:text-emerald-400 font-bold";
        case "Selective Bullish":
        case "Emotional Rally":
            return "text-emerald-500 font-bold";
        case "Neutral / Range":
        case "Choppy / Uncertain":
            return "text-amber-600 dark:text-amber-400 font-bold";
        case "Defensive / Hedge":
        case "Liquidation Risk":
            return "text-orange-600 dark:text-orange-400 font-bold";
        case "Capital Protection":
            return "text-red-600 dark:text-red-400 font-bold";
        default:
            return "text-text-primary";
    }
}
