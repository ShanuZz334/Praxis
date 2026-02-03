/**
 * @file globalRiskEngine.js
 * @purpose Advanced Risk Analysis Engine for Global Markets.
 * @responsibilities
 * - Analyzes cross-asset correlations (e.g., Yields vs. Equities).
 * - Derives specific impacts on Indian Markets (Nifty/BankNifty).
 * - Generates high-level textual summaries / narratives.
 * @key_exports
 * - calculateGlobalRiskScore (Core Logic)
 * - deriveIndiaImpact (Impact Analysis)
 * - generateGlobalInsight (Narrative Check)
 * @dependencies
 * - None (Pure logic)
 * @lifecycle
 * - Called by Dashboard/Foreign pages to enrich raw data.
 * @date 2026-02-03
 */

// =============================
// Core Analysis Logic
// =============================

/**
 * Calculates a consolidated risk score based on Volatility, FX, and Rates.
 */
export function calculateGlobalRiskScore(data) {
    const { vix } = data.volatility;
    const { dxy } = data.fx;
    const { us10y } = data.rates;

    let bias = "Neutral";

    // Heuristic Thresholds
    if (vix.value < 15 && dxy.value < 105) bias = "Risk-On";
    if (vix.value > 20 || us10y.value > 4.5) bias = "Risk-Off";

    return {
        score: data.riskScore,
        bias
    };
}

// =============================
// Impact Analysis (India Context)
// =============================

/**
 * Determines how global factors specifically affect Indian Indices.
 */
export function deriveIndiaImpact(data) {
    const impacts = [];

    // 1. Yield Sensitivity (Bank Nifty)
    if (data.rates.us10y.value > 4.2) {
        impacts.push({
            factor: "US 10Y Yield > 4.2%",
            target: "Bank Nifty",
            impact: "Bearish (Rate Sensitivity)",
            strength: "High"
        });
    }

    // 2. Oil Inflation Risk (CPI / OMCs)
    const oil = data.commodities.find(c => c.name.includes("Crude"));
    if (oil && oil.value > 80) {
        impacts.push({
            factor: "Brent Crude > $80",
            target: "India Macros (CPI)",
            impact: "Inflationary / Negative OMCs",
            strength: "Medium"
        });
    }

    // 3. Currency Flow Risk (FIIs)
    if (data.fx.dxy.value > 103) {
        impacts.push({
            factor: "Strong Dollar (DXY > 103)",
            target: "FII Flows",
            impact: "Outflow Risk",
            strength: "High"
        });
    }

    // 4. Volatility Regime (Options)
    if (data.volatility.vix.value < 15) {
        impacts.push({
            factor: "Low Global VIX (<15)",
            target: "Nifty Options",
            impact: "Theta Decay / Short Vol Favorable",
            strength: "Medium"
        });
    }

    return impacts;
}

// =============================
// Narrative Generation
// =============================

export function generateGlobalInsight(data) {
    const { indices, volatility } = data;
    const usTrend = indices.find(i => i.name === "S&P 500")?.trend || "Neutral";

    if (usTrend === "Bullish" && volatility.vix.value < 15) {
        return {
            title: "Constructive Global Backdrop",
            text: "US Equities are leading with broad participation. Volatility remains compressed, supporting carry trades and risk deployment into EMs, though Dollar strength is a headwind.",
            action: "Maintain bullish bias with reduced leverage."
        };
    }

    return {
        title: "Mixed Global Signals",
        text: "Divergence between US Tech and broader markets. Caution advised.",
        action: "Defensive positioning recommended."
    };
}
