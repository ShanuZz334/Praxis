export function calculateGlobalRiskScore(data) {
    // Logic to be used if we were calculating strictly from raw inputs
    // For now we pass through the mock score but derive the regime label dynamically

    const { vix } = data.volatility;
    const { dxy } = data.fx;
    const { us10y } = data.rates;

    let bias = "Neutral";
    if (vix.value < 15 && dxy.value < 105) bias = "Risk-On";
    if (vix.value > 20 || us10y.value > 4.5) bias = "Risk-Off";

    return {
        score: data.riskScore,
        bias
    };
}

export function deriveIndiaImpact(data) {
    const impacts = [];

    // 1. Yields -> Bank Nifty
    if (data.rates.us10y.value > 4.2) {
        impacts.push({
            factor: "US 10Y Yield > 4.2%",
            target: "Bank Nifty",
            impact: "Bearish (Rate Sensitivity)",
            strength: "High"
        });
    }

    // 2. Oil -> Inflation/Macros
    const oil = data.commodities.find(c => c.name.includes("Crude"));
    if (oil && oil.value > 80) {
        impacts.push({
            factor: "Brent Crude > $80",
            target: "India Macros (CPI)",
            impact: "Inflationary / Negative OMCs",
            strength: "Medium"
        });
    }

    // 3. DXY -> Flows
    if (data.fx.dxy.value > 103) {
        impacts.push({
            factor: "Strong Dollar (DXY > 103)",
            target: "FII Flows",
            impact: "Outflow Risk",
            strength: "High"
        });
    }

    // 4. VIX -> Options Regime
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
