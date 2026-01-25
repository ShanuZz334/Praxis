// Logic for Permission, Global Impact, and Behavioral Locks

export function getTradePermission(walletData) {
    if (!walletData) return { status: "ALLOWED", reason: "Data Missing" };

    const { drawdown, riskRules } = walletData;

    // 1. BLOCKED: Hard Drawdown Breach
    if (drawdown && drawdown.current <= -5.0) { // Example hard limit
        return {
            status: "BLOCKED",
            reason: "Hard Drawdown Limit Breached (-5%). Trading Halted.",
            color: "red"
        };
    }

    // 2. REDUCED: Moderate Drawdown or High Volatility Rule
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

export function getGlobalImpact(globalData) {
    if (!globalData) return null;

    // Simplified Mock Logic
    // In real app, check US Yields, DXY, Oil

    return {
        bias: "Mild Bearish",
        primary: "US Yields > 4.5%",
        secondary: "Brent > $80",
        confidence: "Medium",
        impactOnNifty: "Gap Down Likely"
    };
}

export function getBehavioralLock(journalData) {
    if (!journalData || !journalData.trades) return null;

    // Check last 3 trades for 'Rushed' or 'Validation Errors'
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
