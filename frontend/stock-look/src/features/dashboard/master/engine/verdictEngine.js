/**
 * @file verdictEngine.js
 * @purpose Evaluates trade permissions, global market impact, and behavioral constraints.
 * @responsibilities
 * - Determines if trading is allowed based on wallet drawdown rules.
 * - Assesses global market impact on the local session.
 * - Enforces behavioral locks (e.g., cooling period after rushed trades).
 * @key_exports
 * - getTradePermission, getGlobalImpact, getBehavioralLock
 * @dependencies
 * - None
 * @lifecycle
 * - Called by Dashboard components to validate readiness and enforce risk controls.
 * @date 2026-02-03
 */

// =============================
// Trade Permission Logic
// =============================

/**
 * Checks if trading is allowed based on account drawdown and risk thresholds.
 * @param {Object} walletData - Current wallet and risk data.
 * @returns {Object} Status object with status, reason, and color.
 */
export function getTradePermission(walletData) {
    if (!walletData) return { status: "ALLOWED", reason: "Data Missing" };

    const { drawdown } = walletData;

    // 1. HARD BLOCK: Critical Drawdown Breach
    if (drawdown && drawdown.current <= -5.0) {
        return {
            status: "BLOCKED",
            reason: "Hard Drawdown Limit Breached (-5%). Trading Halted.",
            color: "red"
        };
    }

    // 2. WARNING: Moderate Drawdown
    if (drawdown && drawdown.current <= -2.0) {
        return {
            status: "REDUCED_SIZE",
            reason: "Drawdown Warning (>2%). Reduce size by 50%.",
            color: "yellow"
        };
    }

    return {
        status: "ALLOWED",
        reason: "All Risk Parameters Normal.",
        color: "green"
    };
}

// =============================
// Global Impact Logic
// =============================

/**
 * Assesses the impact of global markets on the local trading session.
 * @param {Object} globalData - Global market data (mocked).
 * @returns {Object} Impact assessment object.
 */
export function getGlobalImpact(globalData) {
    if (!globalData) return null;

    // Simplified logic for impact assessment
    return {
        bias: "Mild Bearish",
        primary: "US Yields > 4.5%",
        secondary: "Brent > $80",
        confidence: "Medium",
        impactOnNifty: "Gap Down Likely"
    };
}

// =============================
// Behavioral Lock Logic
// =============================

/**
 * Checks for behavioral triggers that should lock trading (e.g., FOMO).
 * @param {Object} journalData - Trading journal data including recent trades.
 * @returns {Object} Lock status object.
 */
export function getBehavioralLock(journalData) {
    if (!journalData || !journalData.trades) return null;

    // Check last 3 trades for 'Rushed' state
    const recentTrades = journalData.trades.slice(0, 3);
    const rushedCount = recentTrades.filter(t => t.psychology?.state === "Rushed").length;

    if (rushedCount >= 1) {
        return {
            isLocked: true,
            type: "FOMO Detected",
            action: "Mandatory 5m Delay",
            message: "Your last trade was 'Rushed'. Cooling off period active."
        };
    }

    return { isLocked: false };
}
