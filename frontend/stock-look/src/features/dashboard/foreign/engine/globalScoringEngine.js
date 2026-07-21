/**
 * @file globalScoringEngine.js
 * @purpose Pure JS mathematical scoring algorithms for Global Macro metrics.
 * @responsibilities
 * - Accept raw values (manual or live)
 * - Calculate 0-100 score based on thresholds/baselines
 * - Return Bias (Bullish, Bearish, Neutral) and AI Insight Strings
 */

/**
 * Normalizes a value between 0 and 100 based on min and max boundaries.
 * If invert is true, higher value means lower score.
 */
const normalize = (value, min, max, invert = false) => {
    let bounded = Math.max(min, Math.min(max, value));
    let score = ((bounded - min) / (max - min)) * 100;
    return Math.round(invert ? (100 - score) : score);
};

/**
 * Determines bias based on score.
 */
const getBias = (score) => {
    if (score >= 70) return "Bullish";
    if (score <= 30) return "Bearish";
    return "Neutral";
};

// ---------------------------------------------------------
// 1. DXY (US Dollar Index)
// High DXY = Bad for emerging markets (India) = Bearish score
// ---------------------------------------------------------
export const scoreDXY = (currentDxy) => {
    if (!currentDxy || isNaN(currentDxy)) return null;
    const val = parseFloat(currentDxy);
    
    // Scale: 95 (very good for EM) to 110 (very bad for EM)
    const score = normalize(val, 95, 110, true); 
    const bias = getBias(score);
    
    let insight = "Dollar remains stable with limited impact.";
    if (score > 70) insight = "Weakening dollar provides a strong tailwind for emerging markets and global liquidity.";
    if (score < 30) insight = "Strong dollar tightening global liquidity and pressuring emerging market equities.";

    return { score, bias, insight, confidence: 92, impact: "Very High" };
};

// ---------------------------------------------------------
// 2. USD/INR
// High USD/INR = Rupee depreciation = Bearish for Indian Equities
// ---------------------------------------------------------
export const scoreUSDINR = (currentUsdInr) => {
    if (!currentUsdInr || isNaN(currentUsdInr)) return null;
    const val = parseFloat(currentUsdInr);
    
    // Scale: 80 (Bullish) to 100 (Bearish) - adjusted for higher baselines
    const score = normalize(val, 80, 100, true);
    const bias = getBias(score);
    
    let insight = "Rupee remains stable, minimizing imported inflation risks.";
    if (score > 70) insight = "Rupee appreciation aids FII inflows and lowers imported inflation.";
    if (score < 30) insight = "Severe Rupee depreciation risk. May trigger FII outflows and RBI intervention.";

    return { score, bias, insight, confidence: 95, impact: "High" };
};

// ---------------------------------------------------------
// 3. Brent Crude Oil
// High Crude = Bad for India (importer) = Bearish
// ---------------------------------------------------------
export const scoreCrude = (currentCrude) => {
    if (!currentCrude || isNaN(currentCrude)) return null;
    const val = parseFloat(currentCrude);
    
    // Scale: 60 (Bullish) to 95 (Bearish)
    const score = normalize(val, 60, 95, true);
    const bias = getBias(score);
    
    let insight = "Oil prices hovering in a neutral zone, structurally balanced.";
    if (score > 70) insight = "Low oil prices are a massive macroeconomic tailwind for India's trade deficit.";
    if (score < 30) insight = "Spiking oil prices threaten India's current account deficit and inflation margins.";

    return { score, bias, insight, confidence: 88, impact: "Very High" };
};

// ---------------------------------------------------------
// 4. Gold
// High Gold = Risk Off sentiment = Bearish for Equities
// ---------------------------------------------------------
export const scoreGold = (currentGold) => {
    if (!currentGold || isNaN(currentGold)) return null;
    const val = parseFloat(currentGold);
    
    // Scale: 1800 (Bullish/Risk-On) to 2500 (Bearish/Risk-Off)
    const score = normalize(val, 1800, 2500, true);
    const bias = getBias(score);
    
    let insight = "Gold indicates moderate safe-haven demand; market remains balanced.";
    if (score > 70) insight = "Risk-on environment. Capital flowing out of safe-haven gold into equities.";
    if (score < 30) insight = "High structural fear. Capital fleeing into gold, signaling a global risk-off regime.";

    return { score, bias, insight, confidence: 85, impact: "Moderate" };
};

// ---------------------------------------------------------
// 5. Silver
// Silver is both precious and industrial. Surging silver often means industrial demand + inflation.
// ---------------------------------------------------------
export const scoreSilver = (currentSilver) => {
    if (!currentSilver || isNaN(currentSilver)) return null;
    const val = parseFloat(currentSilver);
    
    // Scale: 20 to 35
    // In moderate uptrends, it's bullish (industrial demand). In extreme spikes, it's inflation fear.
    let score = 50;
    if (val < 22) score = 40; // Weak industrial demand
    else if (val >= 22 && val <= 28) score = 80; // Healthy economic expansion
    else score = 30; // Extreme inflation fear
    
    const bias = getBias(score);
    
    let insight = "Silver pricing reflects steady industrial and monetary demand.";
    if (score > 70) insight = "Healthy silver rally confirms strong industrial demand and economic expansion.";
    if (score < 30) insight = val < 22 ? "Silver weakness warns of industrial contraction." : "Extreme silver spikes suggest overheating inflation fears.";

    return { score, bias, insight, confidence: 80, impact: "Low" };
};

// ---------------------------------------------------------
// 6. US 10-Year Treasury Yield
// High US 10Y Yield = Bad for equities = Bearish
// ---------------------------------------------------------
export const scoreUS10Y = (currentYield) => {
    if (!currentYield || isNaN(currentYield)) return null;
    const val = parseFloat(currentYield);
    
    // Scale: 3.5 (Bullish/Accommodative) to 5.0 (Bearish/Restrictive)
    const score = normalize(val, 3.5, 5.0, true);
    const bias = getBias(score);
    
    let insight = "Treasury yields are steady, indicating a neutral rate environment.";
    if (score > 70) insight = "Falling yields signal an accommodative environment, tailwind for equities and risk assets.";
    if (score < 30) insight = "Spiking yields indicate restrictive monetary conditions, pressuring equity valuations.";

    return { score, bias, insight, confidence: 90, impact: "Very High" };
};

// ---------------------------------------------------------
// 7. S&P 500 Futures
// Positive % = Bullish for global equities
// ---------------------------------------------------------
export const scoreSPFutures = (pctChange) => {
    if (pctChange === null || pctChange === undefined || isNaN(pctChange) || pctChange === '') return null;
    const val = typeof pctChange === 'string' ? parseFloat(pctChange.replace(/,/g, '')) : parseFloat(pctChange);
    
    // Scale: 4500 to 6000
    const score = normalize(val, 4500, 6000, false);
    const bias = getBias(score);
    
    let insight = "S&P Futures indicate a flat, wait-and-see global sentiment.";
    if (score > 70) insight = "Strong US equity futures provide a major tailwind for global risk appetite.";
    if (score < 30) insight = "Weak US futures signal global risk-off pressure and capital preservation.";

    return { score, bias, insight, confidence: 92, impact: "High" };
};

// ---------------------------------------------------------
// 8. Nasdaq Futures
// Positive % = Tech-heavy Bullish for global equities
// ---------------------------------------------------------
export const scoreNasdaqFutures = (pctChange) => {
    if (pctChange === null || pctChange === undefined || isNaN(pctChange) || pctChange === '') return null;
    const val = typeof pctChange === 'string' ? parseFloat(pctChange.replace(/,/g, '')) : parseFloat(pctChange);
    
    // Scale: 15000 to 22000
    const score = normalize(val, 15000, 22000, false);
    const bias = getBias(score);
    
    let insight = "Tech futures are range-bound, suggesting balanced growth expectations.";
    if (score > 70) insight = "Surging tech futures indicate high liquidity and aggressive risk-on behavior.";
    if (score < 30) insight = "Nasdaq weakness warns of growth concerns and potential tech sector rotation.";

    return { score, bias, insight, confidence: 88, impact: "High" };
};

// ---------------------------------------------------------
// 9. Dow Jones Futures
// Positive % = Cyclical/Industrial Bullish
// ---------------------------------------------------------
export const scoreDowFutures = (pctChange) => {
    if (pctChange === null || pctChange === undefined || isNaN(pctChange) || pctChange === '') return null;
    const val = typeof pctChange === 'string' ? parseFloat(pctChange.replace(/,/g, '')) : parseFloat(pctChange);
    
    // Scale: 35000 to 45000
    const score = normalize(val, 35000, 45000, false);
    const bias = getBias(score);
    
    let insight = "Industrial futures are stable, pointing to steady economic activity.";
    if (score > 70) insight = "Dow strength reflects confidence in traditional sectors and economic resilience.";
    if (score < 30) insight = "Dow weakness hints at industrial slowdowns and cyclical fears.";

    return { score, bias, insight, confidence: 85, impact: "Moderate" };
};

// ---------------------------------------------------------
// 10. VIX (CBOE Volatility Index)
// High VIX = Fear = Bearish
// ---------------------------------------------------------
export const scoreVIX = (currentVix) => {
    if (!currentVix || isNaN(currentVix)) return null;
    const val = parseFloat(currentVix);
    
    // Scale: 12 (Bullish/Complacent) to 30 (Bearish/Panic)
    const score = normalize(val, 12, 30, true);
    const bias = getBias(score);
    
    let insight = "VIX is at historical averages, indicating normal market functioning.";
    if (score > 70) insight = "Extremely low volatility. Markets are confident, but beware of complacency.";
    if (score < 30) insight = "VIX spiking into fear territory. Extreme caution and hedging advised.";

    return { score, bias, insight, confidence: 95, impact: "Very High" };
};

// ---------------------------------------------------------
// 11. Bitcoin
// Crypto % change = Proxy for extreme retail/institutional risk appetite
// ---------------------------------------------------------
export const scoreBitcoin = (pctChange) => {
    if (pctChange === null || pctChange === undefined || isNaN(pctChange) || pctChange === '') return null;
    const val = typeof pctChange === 'string' ? parseFloat(pctChange.replace(/,/g, '')) : parseFloat(pctChange);
    
    // Scale: 40000 to 100000
    const score = normalize(val, 40000, 100000, false);
    const bias = getBias(score);
    
    let insight = "Crypto markets are consolidating, showing neutral risk appetite.";
    if (score > 70) insight = "Aggressive crypto buying signals massive liquidity and extreme risk-on behavior.";
    if (score < 30) insight = "Heavy crypto selloff warns of liquidity drains and collapsing risk tolerance.";

    return { score, bias, insight, confidence: 75, impact: "Moderate" };
};

// ---------------------------------------------------------
// 12. EUR/USD
// ---------------------------------------------------------
export const scoreEurusd = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const score = normalize(parseFloat(val), 1.0, 1.15, false);
    const bias = getBias(score);
    let insight = "EUR/USD is range-bound.";
    if (score > 70) insight = "Strong Euro pressures dollar, bullish for global liquidity.";
    if (score < 30) insight = "Weak Euro signals dollar dominance.";
    return { score, bias, insight, confidence: 85, impact: "High" };
};

// ---------------------------------------------------------
// 13. USD/JPY
// ---------------------------------------------------------
export const scoreUsdjpy = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const score = normalize(parseFloat(val), 130, 160, true);
    const bias = getBias(score);
    let insight = "Yen is stable.";
    if (score > 70) insight = "Strong Yen could disrupt carry trades.";
    if (score < 30) insight = "Weak Yen boosts Japanese exports but raises intervention risks.";
    return { score, bias, insight, confidence: 85, impact: "High" };
};

// ---------------------------------------------------------
// 14. Nikkei 225
// ---------------------------------------------------------
export const scoreNikkei = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const score = normalize(v, 30000, 42000, false);
    return { score, bias: getBias(score), insight: "Nikkei 225 tracks Asian momentum.", confidence: 85, impact: "High" };
};

// ---------------------------------------------------------
// 15. FTSE 100
// ---------------------------------------------------------
export const scoreFtse = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const score = normalize(v, 7000, 8500, false);
    return { score, bias: getBias(score), insight: "FTSE tracks European value stocks.", confidence: 80, impact: "Moderate" };
};

// ---------------------------------------------------------
// 16. DAX 40
// ---------------------------------------------------------
export const scoreDax = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const score = normalize(v, 15000, 19000, false);
    return { score, bias: getBias(score), insight: "DAX reflects Eurozone industrial health.", confidence: 80, impact: "Moderate" };
};

// ---------------------------------------------------------
// 17. Hang Seng
// ---------------------------------------------------------
export const scoreHangseng = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const score = normalize(v, 14000, 20000, false);
    return { score, bias: getBias(score), insight: "Hang Seng tracks China tech and property.", confidence: 80, impact: "Moderate" };
};

// ---------------------------------------------------------
// 18. Shanghai Comp
// ---------------------------------------------------------
export const scoreShanghai = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const score = normalize(v, 2600, 3200, false);
    return { score, bias: getBias(score), insight: "Shanghai Comp tracks mainland China stimulus.", confidence: 80, impact: "Moderate" };
};

// ---------------------------------------------------------
// 19. CAC 40
// ---------------------------------------------------------
export const scoreCac40 = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const score = normalize(v, 6500, 8500, false);
    return { score, bias: getBias(score), insight: "CAC 40 tracks French luxury and financials.", confidence: 80, impact: "Moderate" };
};

// ---------------------------------------------------------
// 20. Euro Stoxx 50
// ---------------------------------------------------------
export const scoreEurostoxx = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const score = normalize(v, 4000, 5200, false);
    return { score, bias: getBias(score), insight: "Euro Stoxx represents broad EU equities.", confidence: 80, impact: "Moderate" };
};

// ---------------------------------------------------------
// 21. Copper
// ---------------------------------------------------------
export const scoreCopper = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const score = normalize(parseFloat(val), 3.0, 4.5, false);
    return { score, bias: getBias(score), insight: "Copper indicates global industrial health.", confidence: 85, impact: "High" };
};

// ---------------------------------------------------------
// 22. Natural Gas
// ---------------------------------------------------------
export const scoreNatgas = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const score = normalize(parseFloat(val), 2.0, 8.0, true);
    return { score, bias: getBias(score), insight: "Natural Gas prices affect global energy costs.", confidence: 75, impact: "Moderate" };
};

// ---------------------------------------------------------
// 23. Wheat
// ---------------------------------------------------------
export const scoreWheat = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const score = normalize(parseFloat(val), 500, 1000, true);
    return { score, bias: getBias(score), insight: "Wheat prices impact global food inflation.", confidence: 75, impact: "Moderate" };
};

// ---------------------------------------------------------
// 24. Aluminum
// ---------------------------------------------------------
export const scoreAluminum = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const score = normalize(parseFloat(val), 2000, 3000, false);
    return { score, bias: getBias(score), insight: "Aluminum tracks broad construction and manufacturing.", confidence: 75, impact: "Moderate" };
};

// ---------------------------------------------------------
// 25. MOVE Index
// ---------------------------------------------------------
export const scoreMove = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const score = normalize(parseFloat(val), 80, 150, true);
    return { score, bias: getBias(score), insight: "MOVE Index tracks bond market volatility.", confidence: 90, impact: "High" };
};
