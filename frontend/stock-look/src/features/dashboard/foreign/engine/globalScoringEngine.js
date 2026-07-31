/**
 * @file globalScoringEngine.js
 * @purpose Institutional-grade pure JS scoring algorithms for Global Macro metrics.
 * @version 3.0 — 52-Week Auto-Calibration System
 *
 * HOW AUTO-CALIBRATION WORKS:
 * ----------------------------
 * Every scorer accepts an optional `range` object: { hi52, lo52 }
 * sourced directly from Yahoo Finance's 52-week high/low data.
 *
 * If range data is available:
 *   dynamicMin = lo52 * (1 - BUFFER)   ← 8% below 52-week low
 *   dynamicMax = hi52 * (1 + BUFFER)   ← 8% above 52-week high
 *
 * This means:
 *   - The score is ALWAYS relative to the instrument's OWN recent history
 *   - When price is at 52wk high → score ~88 (never trivially 100)
 *   - When price is at 52wk low  → score ~12 (never trivially 0)
 *   - No manual recalibration needed — it self-updates every minute
 *
 * If range data is missing (manual override, crypto without 52wk, etc.):
 *   → Falls back to hardcoded institutional ranges calibrated for July 2026
 *
 * INDIA-CENTRIC SCORING:
 * ----------------------
 * A HIGH score (>65) = BULLISH signal for Indian equity markets.
 * A LOW score (<35)  = BEARISH signal for Indian equity markets.
 */

const BUFFER = 0.08; // 8% buffer on each side of the 52-week range

/**
 * Core normalization: maps value linearly between 0 and 100.
 */
const normalize = (value, min, max, invert = false) => {
    const bounded = Math.max(min, Math.min(max, value));
    const raw = ((bounded - min) / (max - min)) * 100;
    return Math.round(invert ? (100 - raw) : raw);
};

/**
 * Determines bias from score.
 */
const getBias = (score) => {
    if (score >= 65) return "Bullish";
    if (score <= 35) return "Bearish";
    return "Neutral";
};

/**
 * Returns dynamic [min, max] bounds using 52-week range if available,
 * otherwise falls back to hardcoded institutional bounds.
 *
 * For INVERTED indicators (high = bad, e.g. VIX, DXY):
 *   - lo52 becomes the "good" extreme (score → 100)
 *   - hi52 becomes the "bad" extreme (score → 0)
 * The `normalize(..., invert=true)` call handles this correctly.
 */
const getDynamicBounds = (hardMin, hardMax, range = {}) => {
    const { hi52, lo52 } = range;
    if (hi52 && lo52 && hi52 > lo52) {
        return {
            min: lo52 * (1 - BUFFER),
            max: hi52 * (1 + BUFFER),
            isDynamic: true,
        };
    }
    return { min: hardMin, max: hardMax, isDynamic: false };
};

// =============================================================================
// SECTION 1: CURRENCY
// =============================================================================

// DXY: HIGH = tight global liquidity = BEARISH for India (invert=true)
export const scoreDXY = (currentDxy, range = {}) => {
    if (!currentDxy || isNaN(currentDxy)) return null;
    const val = parseFloat(currentDxy);
    const { min, max } = getDynamicBounds(97, 108, range);
    const score = normalize(val, min, max, true);
    const bias = getBias(score);
    let insight = `DXY at ${val.toFixed(1)} sits in neutral territory — dollar neither strongly supportive nor restrictive for emerging markets.`;
    if (score >= 65) insight = `DXY at ${val.toFixed(1)} is weak versus its recent range — a softening dollar is a structural tailwind for FII inflows into India and eases imported commodity prices.`;
    if (score <= 35) insight = `DXY at ${val.toFixed(1)} is elevated in its 52-week context — strong dollar compresses EM liquidity and risks triggering FII outflows from Indian equities.`;
    return { score, bias, insight, confidence: 92, impact: "Very High" };
};

// USD/INR: HIGH = Rupee depreciation = BEARISH (invert=true)
export const scoreUSDINR = (currentUsdInr, range = {}) => {
    if (!currentUsdInr || isNaN(currentUsdInr)) return null;
    const val = parseFloat(currentUsdInr);
    const { min, max } = getDynamicBounds(82, 90, range);
    const score = normalize(val, min, max, true);
    const bias = getBias(score);
    let insight = `USD/INR at ₹${val.toFixed(2)} — Rupee trading within its recent range without extreme stress.`;
    if (score >= 65) insight = `USD/INR at ₹${val.toFixed(2)} — Rupee near its 52-week strength, reducing imported inflation and signalling healthy FII participation.`;
    if (score <= 35) insight = `USD/INR at ₹${val.toFixed(2)} — Rupee near its 52-week weakness, raising imported inflation risks and potential RBI intervention pressure.`;
    return { score, bias, insight, confidence: 95, impact: "High" };
};

// EUR/USD: HIGHER = weaker dollar = BULLISH (invert=false)
export const scoreEurusd = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = parseFloat(val);
    const { min, max } = getDynamicBounds(1.03, 1.13, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `EUR/USD at ${v.toFixed(4)} — dollar and euro in equilibrium within their recent range.`;
    if (score >= 65) insight = `EUR/USD at ${v.toFixed(4)} — near its 52-week highs, signalling dollar weakness and supporting global risk appetite and EM inflows.`;
    if (score <= 35) insight = `EUR/USD at ${v.toFixed(4)} — near its 52-week lows, reflecting European growth concerns and dollar dominance tightening global liquidity.`;
    return { score, bias, insight, confidence: 85, impact: "High" };
};

// USD/JPY: Nuanced — moderate levels are fine; extremes in either direction are bearish
export const scoreUsdjpy = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = parseFloat(val);
    // If 52-week data exists, use midpoint logic: score is best in the middle of the range
    const { hi52, lo52, isDynamic } = getDynamicBounds(140, 162, range);
    let score;
    if (isDynamic && hi52 && lo52) {
        const mid = (hi52 + lo52) / 2;
        const halfRange = (hi52 - lo52) / 2;
        // Distance from midpoint → 0 = best, halfRange = worst
        const dist = Math.abs(v - mid);
        score = Math.round(Math.max(0, 100 - (dist / halfRange) * 100));
    } else {
        // Fallback: moderate levels good, extremes bad
        if (v < 140) score = 35;
        else if (v >= 140 && v <= 152) score = normalize(v, 140, 152, false);
        else if (v > 152 && v <= 158) score = normalize(v, 152, 158, true);
        else score = 15;
    }
    score = Math.min(score, 82); // Never give 100 — yen risk always exists
    const bias = getBias(score);
    let insight = `USD/JPY at ${v.toFixed(1)} — yen carry trade in moderate territory.`;
    if (score >= 65) insight = `USD/JPY at ${v.toFixed(1)} — near the stable mid-range of its 52-week band, carry trade conditions healthy without BOJ intervention risk.`;
    if (score <= 35) insight = v > (range.hi52 || 158)
        ? `USD/JPY at ${v.toFixed(1)} — at extreme highs of its range, BOJ intervention risk is elevated. A sudden yen reversal could trigger a global carry trade unwind.`
        : `USD/JPY at ${v.toFixed(1)} — yen strengthening toward 52-week lows, carry trade unwinding. Global risk appetite may be under pressure.`;
    return { score, bias, insight, confidence: 85, impact: "High" };
};

// =============================================================================
// SECTION 2: COMMODITIES
// =============================================================================

// Crude: HIGH crude = BEARISH for India (invert=true)
export const scoreCrude = (currentCrude, range = {}) => {
    if (!currentCrude || isNaN(currentCrude)) return null;
    const val = parseFloat(currentCrude);
    const { min, max } = getDynamicBounds(55, 100, range);
    const score = normalize(val, min, max, true);
    const bias = getBias(score);
    let insight = `Crude at $${val.toFixed(1)}/bbl — oil within its recent range, balanced impact on India.`;
    if (score >= 65) insight = `Crude at $${val.toFixed(1)}/bbl — near 52-week lows. Low oil compresses India's current account deficit, controls inflation, and supports RBI rate-cut optionality.`;
    if (score <= 35) insight = `Crude at $${val.toFixed(1)}/bbl — near 52-week highs. Elevated oil directly pressures India's trade balance, accelerates inflation, and constrains the monetary easing cycle.`;
    return { score, bias, insight, confidence: 90, impact: "Very High" };
};

// Gold: HIGH = risk-off = BEARISH for equities (invert=true)
export const scoreGold = (currentGold, range = {}) => {
    if (!currentGold || isNaN(currentGold)) return null;
    const val = parseFloat(currentGold);
    const { min, max } = getDynamicBounds(2300, 4500, range);
    const score = normalize(val, min, max, true);
    const bias = getBias(score);
    let insight = `Gold at $${val.toFixed(0)}/oz — moderate safe-haven demand, market sentiment balanced between risk assets and hedges.`;
    if (score >= 65) insight = `Gold at $${val.toFixed(0)}/oz — near its 52-week lows, a risk-on signal. Capital rotating from safe havens into equities.`;
    if (score <= 35) insight = `Gold at $${val.toFixed(0)}/oz — near its 52-week highs, signalling significant safe-haven demand. Institutional capital is hedging, broadly bearish for equity risk appetite.`;
    return { score, bias, insight, confidence: 85, impact: "Moderate" };
};

// Silver: dual industrial + monetary signal — moderate levels bullish, extremes bearish
export const scoreSilver = (currentSilver, range = {}) => {
    if (!currentSilver || isNaN(currentSilver)) return null;
    const val = parseFloat(currentSilver);
    const { hi52, lo52, isDynamic } = getDynamicBounds(28, 60, range);
    let score;
    if (isDynamic && hi52 && lo52) {
        // Upper third of range = inflationary fear = bearish; lower/mid = healthy
        const lowerThird  = lo52 + (hi52 - lo52) / 3;
        const upperThird  = lo52 + 2 * (hi52 - lo52) / 3;
        if (val <= lowerThird)  score = normalize(val, lo52, lowerThird, false);  // 0–50: weak demand
        else if (val <= upperThird) score = normalize(val, lowerThird, upperThird, false) + 30; // 30–80: healthy
        else score = Math.max(15, normalize(val, upperThird, hi52, true) + 10);   // declines: spike = fear
    } else {
        if (val < 28) score = 30;
        else if (val <= 40) score = normalize(val, 28, 40, false);
        else if (val <= 55) score = Math.round(normalize(val, 40, 55, true) * 0.7 + 15);
        else score = 15;
    }
    score = Math.min(85, Math.max(10, score));
    const bias = getBias(score);
    let insight = `Silver at $${val.toFixed(2)}/oz — balanced between industrial demand and monetary hedging signals.`;
    if (score >= 65) insight = `Silver at $${val.toFixed(2)}/oz — within healthy industrial demand territory, confirming solid manufacturing activity without inflationary excess.`;
    if (score <= 35) insight = val < (lo52 || 28)
        ? `Silver at $${val.toFixed(2)}/oz — near 52-week lows, warning of declining industrial demand and global growth deceleration.`
        : `Silver at $${val.toFixed(2)}/oz — elevated near 52-week highs, signalling inflation fear or safe-haven panic that typically compresses equity multiples.`;
    return { score, bias, insight, confidence: 78, impact: "Low" };
};

// Copper: HIGH = strong industrial demand = BULLISH (invert=false)
// Note: Yahoo HG=F returns in $/lb (e.g. 4.50). If > 10, it was returned in cents → divide.
export const scoreCopper = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    let v = parseFloat(val);
    if (v > 10) v = v / 100; // Convert ¢/lb → $/lb if needed
    // Adjust range too if it came in cents
    const adjustedRange = {
        hi52: range.hi52 && range.hi52 > 10 ? range.hi52 / 100 : range.hi52,
        lo52: range.lo52 && range.lo52 > 10 ? range.lo52 / 100 : range.lo52,
    };
    const { min, max } = getDynamicBounds(3.80, 7.00, adjustedRange);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `Copper at $${v.toFixed(2)}/lb — neutral industrial demand signals within recent range.`;
    if (score >= 65) insight = `Copper at $${v.toFixed(2)}/lb — near 52-week highs, confirming robust global manufacturing and construction activity. Broadly bullish for cyclical sectors.`;
    if (score <= 35) insight = `Copper at $${v.toFixed(2)}/lb — near 52-week lows, a forward-looking warning of global industrial deceleration and reduced capital expenditure.`;
    return { score, bias, insight, confidence: 85, impact: "High" };
};

// Natural Gas: HIGH natgas = energy inflation = BEARISH (invert=true)
export const scoreNatgas = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = parseFloat(val);
    const { min, max } = getDynamicBounds(1.5, 8.0, range);
    const score = normalize(v, min, max, true);
    const bias = getBias(score);
    let insight = `Natural Gas at $${v.toFixed(2)}/MMBtu — energy costs within manageable range.`;
    if (score >= 65) insight = `Natural Gas at $${v.toFixed(2)}/MMBtu — near 52-week lows, suppressing energy inflation and benefiting manufacturing-heavy economies.`;
    if (score <= 35) insight = `Natural Gas at $${v.toFixed(2)}/MMBtu — near 52-week highs, inflating industrial and residential energy costs and feeding into core inflation globally.`;
    return { score, bias, insight, confidence: 75, impact: "Moderate" };
};

// Wheat: HIGH = food inflation = BEARISH (invert=true)
export const scoreWheat = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = parseFloat(val);
    const { min, max } = getDynamicBounds(500, 1000, range);
    const score = normalize(v, min, max, true);
    const bias = getBias(score);
    let insight = `Wheat at ${v.toFixed(0)} ¢/bu — food prices broadly contained, limiting inflationary spillover.`;
    if (score >= 65) insight = `Wheat at ${v.toFixed(0)} ¢/bu — near 52-week lows, easing food inflation globally and reducing CPI pressures in emerging markets.`;
    if (score <= 35) insight = `Wheat at ${v.toFixed(0)} ¢/bu — near 52-week highs, signalling food supply stress and rising headline inflation in food-import-dependent economies.`;
    return { score, bias, insight, confidence: 72, impact: "Moderate" };
};

// Aluminum: HIGH demand = BULLISH (invert=false)
export const scoreAluminum = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = parseFloat(val);
    const { min, max } = getDynamicBounds(2000, 4000, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `Aluminum at $${v.toFixed(0)}/ton — moderate industrial demand within recent range.`;
    if (score >= 65) insight = `Aluminum at $${v.toFixed(0)}/ton — near 52-week highs, confirming strong construction and manufacturing demand globally.`;
    if (score <= 35) insight = `Aluminum at $${v.toFixed(0)}/ton — near 52-week lows, reflecting oversupply or declining industrial demand.`;
    return { score, bias, insight, confidence: 72, impact: "Moderate" };
};

// =============================================================================
// SECTION 3: RATES & VOLATILITY
// =============================================================================

// US 10Y Yield: HIGH = tight conditions = BEARISH (invert=true)
export const scoreUS10Y = (currentYield, range = {}) => {
    if (!currentYield || isNaN(currentYield)) return null;
    const val = parseFloat(currentYield);
    const { min, max } = getDynamicBounds(3.5, 5.5, range);
    const score = normalize(val, min, max, true);
    const bias = getBias(score);
    let insight = `US 10Y at ${val.toFixed(2)}% — yields within recent range, neutral for equity multiples.`;
    if (score >= 65) insight = `US 10Y at ${val.toFixed(2)}% — near its 52-week lows, signalling accommodative financial conditions. Lower discount rates support equity valuations.`;
    if (score <= 35) insight = `US 10Y at ${val.toFixed(2)}% — near its 52-week highs, increasing the risk-free hurdle rate. Compresses P/E multiples and diverts capital from equities to bonds.`;
    return { score, bias, insight, confidence: 92, impact: "Very High" };
};

// VIX: HIGH fear = BEARISH (invert=true); also cap complacency
export const scoreVIX = (currentVix, range = {}) => {
    if (!currentVix || isNaN(currentVix)) return null;
    const val = parseFloat(currentVix);
    const { min, max } = getDynamicBounds(10, 40, range);
    let score = normalize(val, min, max, true);
    // Cap: VIX below 13 is dangerous complacency — cap at 78 to avoid false 100 signal
    if (val < 13) score = Math.min(score, 78);
    score = Math.min(score, 85);
    const bias = getBias(score);
    let insight = `VIX at ${val.toFixed(1)} — implied volatility within its recent operating range.`;
    if (score >= 65) insight = `VIX at ${val.toFixed(1)} — near its 52-week lows, reflecting institutional confidence. Markets calm, favoring steady upside with controlled risk.`;
    if (score <= 35) insight = `VIX at ${val.toFixed(1)} — elevated near 52-week highs, signalling significant hedging activity and fear. Directional positions carry substantial gap risk.`;
    return { score, bias, insight, confidence: 95, impact: "Very High" };
};

// MOVE: HIGH bond vol = BEARISH (invert=true)
export const scoreMove = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = parseFloat(val);
    const { min, max } = getDynamicBounds(60, 150, range);
    const score = normalize(v, min, max, true);
    const bias = getBias(score);
    let insight = `MOVE Index at ${v.toFixed(1)} — bond market volatility at moderate levels within recent range.`;
    if (score >= 65) insight = `MOVE Index at ${v.toFixed(1)} — near 52-week lows, calm bond markets allow equity risk premiums to compress and support valuations.`;
    if (score <= 35) insight = `MOVE Index at ${v.toFixed(1)} — near 52-week highs, elevated bond volatility signals Fed policy uncertainty, compressing equity multiples and increasing hedging costs.`;
    return { score, bias, insight, confidence: 88, impact: "High" };
};

// =============================================================================
// SECTION 4: US EQUITY MARKETS (ABSOLUTE LEVELS — higher = bullish)
// =============================================================================

export const scoreSPFutures = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const { min, max } = getDynamicBounds(5000, 8000, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `S&P at ${v.toLocaleString()} — US equities trending within their recent range.`;
    if (score >= 65) insight = `S&P at ${v.toLocaleString()} — near 52-week highs, strong US markets signal global risk-on, typically supportive of FII inflows into Indian equities.`;
    if (score <= 35) insight = `S&P at ${v.toLocaleString()} — near 52-week lows, US market weakness typically triggers global risk-off, reducing FII appetite for EM equities.`;
    return { score, bias, insight, confidence: 92, impact: "High" };
};

export const scoreNasdaqFutures = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const { min, max } = getDynamicBounds(18000, 34000, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `Nasdaq at ${v.toLocaleString()} — tech sentiment broadly healthy within recent range.`;
    if (score >= 65) insight = `Nasdaq at ${v.toLocaleString()} — near 52-week highs, surging tech index drives global risk appetite, particularly bullish for Indian IT exporters.`;
    if (score <= 35) insight = `Nasdaq at ${v.toLocaleString()} — near 52-week lows, tech weakness signals growth concerns, historically a headwind for Indian IT sector revenue visibility.`;
    return { score, bias, insight, confidence: 88, impact: "High" };
};

export const scoreDowFutures = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const { min, max } = getDynamicBounds(38000, 60000, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `Dow at ${v.toLocaleString()} — industrial and cyclical sector confidence steady.`;
    if (score >= 65) insight = `Dow at ${v.toLocaleString()} — near 52-week highs, strong industrials signal healthy economic activity and supportive global capex.`;
    if (score <= 35) insight = `Dow at ${v.toLocaleString()} — near 52-week lows, industrial weakness suggests cyclical slowdown.`;
    return { score, bias, insight, confidence: 85, impact: "Moderate" };
};

// =============================================================================
// SECTION 5: DIGITAL ASSETS
// =============================================================================

export const scoreBitcoin = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const { min, max } = getDynamicBounds(50000, 130000, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `Bitcoin at $${v.toLocaleString()} — crypto risk appetite in neutral-to-positive territory.`;
    if (score >= 65) insight = `Bitcoin at $${v.toLocaleString()} — near 52-week highs, aggressive crypto buying signals abundant liquidity and high risk tolerance, broadly supportive of EM equity inflows.`;
    if (score <= 35) insight = `Bitcoin at $${v.toLocaleString()} — near 52-week lows, crypto selloff reflects deteriorating risk appetite and potential liquidity stress across global markets.`;
    return { score, bias, insight, confidence: 72, impact: "Moderate" };
};

// =============================================================================
// SECTION 6: GLOBAL EQUITY INDICES (absolute levels — higher = bullish)
// =============================================================================

export const scoreNikkei = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const { min, max } = getDynamicBounds(35000, 55000, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `Nikkei at ${v.toLocaleString()} — Asian equity sentiment broadly constructive.`;
    if (score >= 65) insight = `Nikkei at ${v.toLocaleString()} — near 52-week highs, confirming healthy Asian risk appetite and yen carry trade stability.`;
    if (score <= 35) insight = `Nikkei at ${v.toLocaleString()} — near 52-week lows, Nikkei weakness often signals broader Asian risk aversion or yen carry unwind.`;
    return { score, bias, insight, confidence: 83, impact: "High" };
};

// FTSE: Yahoo ^FTSE returns index points (e.g. 8800 or 10958 if at all-time highs)
export const scoreFtse = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const { min, max } = getDynamicBounds(7500, 12000, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `FTSE at ${v.toLocaleString()} — UK equities tracking European macro conditions.`;
    if (score >= 65) insight = `FTSE at ${v.toLocaleString()} — near 52-week highs, signal resilient European consumer and financial sector confidence.`;
    if (score <= 35) insight = `FTSE at ${v.toLocaleString()} — near 52-week lows, FTSE weakness reflects European recession risk or Brexit headwinds.`;
    return { score, bias, insight, confidence: 78, impact: "Moderate" };
};

export const scoreDax = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const { min, max } = getDynamicBounds(18000, 30000, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `DAX at ${v.toLocaleString()} — Eurozone industrial health at moderate levels.`;
    if (score >= 65) insight = `DAX at ${v.toLocaleString()} — near 52-week highs, recovering Eurozone manufacturing and export demand, globally bullish for cyclicals.`;
    if (score <= 35) insight = `DAX at ${v.toLocaleString()} — near 52-week lows, reflecting Germany's industrial slowdown and Eurozone structural headwinds.`;
    return { score, bias, insight, confidence: 78, impact: "Moderate" };
};

export const scoreHangseng = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const { min, max } = getDynamicBounds(16000, 30000, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `Hang Seng at ${v.toLocaleString()} — China/HK equity sentiment at moderate optimism.`;
    if (score >= 65) insight = `Hang Seng at ${v.toLocaleString()} — near 52-week highs, improving China growth expectations broadly benefit India as a correlated EM destination.`;
    if (score <= 35) insight = `Hang Seng at ${v.toLocaleString()} — near 52-week lows, China property/debt concerns may trigger broad EM risk-off and FII outflows.`;
    return { score, bias, insight, confidence: 78, impact: "Moderate" };
};

export const scoreShanghai = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const { min, max } = getDynamicBounds(2800, 4200, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `Shanghai Comp at ${v.toLocaleString()} — mainland China domestic confidence at moderate levels.`;
    if (score >= 65) insight = `Shanghai at ${v.toLocaleString()} — near 52-week highs, effective stimulus transmission supporting regional trade flows.`;
    if (score <= 35) insight = `Shanghai at ${v.toLocaleString()} — near 52-week lows, slowing domestic consumption and limited stimulus effectiveness.`;
    return { score, bias, insight, confidence: 75, impact: "Moderate" };
};

export const scoreCac40 = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const { min, max } = getDynamicBounds(7000, 10000, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `CAC 40 at ${v.toLocaleString()} — French equities reflect Eurozone financial and luxury sector confidence.`;
    if (score >= 65) insight = `CAC 40 at ${v.toLocaleString()} — near 52-week highs, healthy European luxury exports and financial sector profitability.`;
    if (score <= 35) insight = `CAC 40 at ${v.toLocaleString()} — near 52-week lows, European political/fiscal risk or luxury spending slowdown.`;
    return { score, bias, insight, confidence: 75, impact: "Moderate" };
};

export const scoreEurostoxx = (val, range = {}) => {
    if (val === null || val === undefined || isNaN(val) || val === '') return null;
    const v = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
    const { min, max } = getDynamicBounds(4500, 7500, range);
    const score = normalize(v, min, max, false);
    const bias = getBias(score);
    let insight = `Euro Stoxx 50 at ${v.toLocaleString()} — broad EU equity performance reflects continental macro health.`;
    if (score >= 65) insight = `Euro Stoxx at ${v.toLocaleString()} — near 52-week highs, broad European equity strength supports global portfolio allocation.`;
    if (score <= 35) insight = `Euro Stoxx at ${v.toLocaleString()} — near 52-week lows, signalling Eurozone recession risks dampening global growth expectations.`;
    return { score, bias, insight, confidence: 75, impact: "Moderate" };
};
