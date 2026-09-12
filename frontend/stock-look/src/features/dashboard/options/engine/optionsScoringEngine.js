/**
 * @file optionsScoringEngine.js
 * @purpose Pure mathematical engine for Options intelligence scoring.
 * @responsibilities
 * - Generates 0-100 normalized scores for Options metrics (PCR, Greeks).
 * - Computes institutional-grade Biases (Bullish, Bearish, Neutral, Contrarian).
 * - Generates dynamic AI insights based on the real-time calculated values.
 * - Centralized to allow both frontend and backend to use the same logic.
 */

import { computeLiveOiChange } from './oiTrackerEngine.js';

// ==========================================
// 1. Put-Call Ratio (OI) Scoring
// ==========================================
export function scorePcrOi(pcr) {
    if (pcr === undefined || pcr === null || isNaN(pcr) || pcr === 0) return { score: 50, bias: "Neutral", sentiment: "Neutral" };
    
    // Continuous score interpolation
    const normalize = (val, min, max, scoreMin, scoreMax) => {
        return Math.min(Math.max(scoreMin + ((val - min) / (max - min)) * (scoreMax - scoreMin), scoreMin), scoreMax);
    };

    let score, bias, sentiment;

    if (pcr > 1.40) {
        bias = "Contrarian Bearish";
        score = normalize(pcr, 1.40, 2.00, 85, 100);
        sentiment = "Extremely Overbought";
    } else if (pcr > 1.05 && pcr <= 1.40) {
        bias = "Bullish";
        score = normalize(pcr, 1.05, 1.40, 50, 85);
        sentiment = "Bullish Support";
    } else if (pcr >= 0.85 && pcr <= 1.05) {
        bias = "Neutral";
        score = normalize(pcr, 0.85, 1.05, 45, 55);
        sentiment = "Balanced";
    } else if (pcr >= 0.60 && pcr < 0.85) {
        bias = "Bearish";
        score = normalize(pcr, 0.60, 0.85, 15, 45);
        sentiment = "Bearish Resistance";
    } else {
        bias = "Contrarian Bullish";
        score = normalize(pcr, 0.20, 0.60, 0, 15);
        sentiment = "Extremely Oversold";
    }
    
    return { score: Math.round(score), bias, sentiment };
}

export function generatePcrOiInsight(pcr, bias) {
    if (pcr === undefined || pcr === null || isNaN(pcr) || pcr === 0) return "Awaiting PCR data from chain.";
    
    if (bias.includes("Contrarian")) {
        return `PCR at ${pcr.toFixed(2)} indicates extreme positioning. Reversal risks are highly elevated as the market may be too heavily skewed one-way.`;
    } else if (bias === "Bullish") {
        return `Heavy put writing (PCR ${pcr.toFixed(2)}) forms a strong floor. Option writers are defending lower levels.`;
    } else if (bias === "Bearish") {
        return `Call writers dominate (PCR ${pcr.toFixed(2)}), creating overhead supply and resistance against upward momentum.`;
    }
    return `PCR is perfectly balanced at ${pcr.toFixed(2)}, indicating a tug-of-war between option writers with no clear directional edge.`;
}


// ==========================================
// 2. Put-Call Ratio (Volume) Scoring
// ==========================================
export function scorePcrVolume(pcrVol) {
    if (pcrVol === undefined || pcrVol === null || isNaN(pcrVol) || pcrVol === 0) return { score: 50, bias: "Neutral", sentiment: "Neutral" };
    
    // Continuous score interpolation
    const normalize = (val, min, max, scoreMin, scoreMax) => {
        return Math.min(Math.max(scoreMin + ((val - min) / (max - min)) * (scoreMax - scoreMin), scoreMin), scoreMax);
    };

    let score, bias, sentiment;

    if (pcrVol > 1.30) {
        bias = "Bullish";
        score = normalize(pcrVol, 1.30, 2.00, 75, 100);
        sentiment = "Aggressive Put Buying/Writing";
    } else if (pcrVol >= 0.80 && pcrVol <= 1.30) {
        bias = "Neutral";
        score = normalize(pcrVol, 0.80, 1.30, 40, 75);
        sentiment = "Normal Trading Activity";
    } else {
        bias = "Bearish";
        score = normalize(pcrVol, 0.20, 0.80, 0, 40);
        sentiment = "Aggressive Call Buying/Writing";
    }
    
    return { score: Math.round(score), bias, sentiment };
}

export function generatePcrVolumeInsight(pcrVol, bias) {
    if (pcrVol === undefined || pcrVol === null || isNaN(pcrVol) || pcrVol === 0) return "Awaiting volume data.";
    if (bias === "Bullish") return `High intraday put volume (PCR ${pcrVol.toFixed(2)}) shows aggressive downside protection or bullish put writing.`;
    if (bias === "Bearish") return `High intraday call volume (PCR ${pcrVol.toFixed(2)}) indicates aggressive upside speculation or bearish call writing.`;
    return `Intraday options flow is relatively balanced.`;
}


// ==========================================
// 3. Greeks: Delta Scoring (ATM Call)
// ==========================================
export function scoreDelta(delta) {
    if (delta === undefined || delta === null || isNaN(delta)) return { score: 50, bias: "Neutral", moneyness: "Unknown" };
    
    // Assuming ATM Call Delta (typically ~0.50)
    let score = 50;
    let bias = "Neutral";
    let moneyness = "ATM";

    if (delta > 0.65) {
        bias = "Bullish";
        score = 80;
        moneyness = "ITM";
    } else if (delta >= 0.40 && delta <= 0.65) {
        bias = "Neutral";
        score = 50;
        moneyness = "ATM";
    } else {
        bias = "Bearish";
        score = 20;
        moneyness = "OTM";
    }
    
    return { score, bias, moneyness };
}

export function generateDeltaInsight(delta, bias) {
    if (delta === undefined || delta === null || isNaN(delta)) return "Awaiting Greeks data.";
    
    if (bias === "Bullish") return `Delta at ${delta.toFixed(3)} indicates the closest strike has pushed ITM, reflecting strong bullish momentum.`;
    if (bias === "Bearish") return `Delta at ${delta.toFixed(3)} indicates the closest strike is slipping OTM, reflecting fading momentum.`;
    return `Delta near 0.50 confirms true At-The-Money positioning with balanced directional exposure.`;
}


// ==========================================
// 4. Greeks: Gamma Scoring (ATM Call)
// ==========================================
export function scoreGamma(gamma, spotPrice) {
    if (gamma === undefined || gamma === null || isNaN(gamma) || !spotPrice) return { score: 50, bias: "Neutral", riskLevel: "Normal" };
    
    let score = 50;
    let bias = "Neutral";
    let riskLevel = "Normal";

    const gamma1Pct = Math.abs(gamma) * (spotPrice * 0.01);

    if (gamma1Pct > 0.15) {
        bias = "High Volatility Risk";
        score = 85;
        riskLevel = "Extreme";
    } else if (gamma1Pct > 0.08) {
        bias = "Elevated Sensitivity";
        score = 70;
        riskLevel = "High";
    } else {
        bias = "Stable";
        score = 40;
        riskLevel = "Low";
    }
    
    return { score, bias, riskLevel };
}

export function generateGammaInsight(gamma, riskLevel) {
    if (gamma === undefined || gamma === null || isNaN(gamma)) return "Awaiting Gamma data.";
    
    if (riskLevel === "Extreme" || riskLevel === "High") return `High Gamma (${gamma.toFixed(4)}) means Delta will change rapidly. Expect violent price swings on small spot moves.`;
    return `Low Gamma (${gamma.toFixed(4)}) implies steady Delta transitions with lower risk of sudden price explosions.`;
}


// ==========================================
// 5. Greeks: Theta Scoring (ATM Call)
// ==========================================
export function scoreTheta(theta, spotPrice) {
    if (theta === undefined || theta === null || isNaN(theta) || !spotPrice) return { score: 50, bias: "Neutral", decayPace: "Normal" };
    
    let score = 50;
    let bias = "Neutral";
    let decayPace = "Normal";

    const thetaPct = (Math.abs(theta) / spotPrice) * 100;

    if (thetaPct > 0.10) {
        bias = "Seller's Market";
        score = 80; 
        decayPace = "Accelerated";
    } else if (thetaPct > 0.04) {
        bias = "Neutral";
        score = 50;
        decayPace = "Moderate";
    } else {
        bias = "Buyer's Market";
        score = 30;
        decayPace = "Slow";
    }
    
    return { score, bias, decayPace };
}

export function generateThetaInsight(theta, decayPace) {
    if (theta === undefined || theta === null || isNaN(theta)) return "Awaiting Theta data.";
    
    if (decayPace === "Accelerated") return `Severe time decay (${theta.toFixed(2)}/day). Options will rapidly lose value if spot price stalls. Highly favorable for Option Writers.`;
    return `Moderate time decay (${theta.toFixed(2)}/day). Buyers have breathing room, but writers collect steady premium.`;
}


// ==========================================
// 6. Greeks: Vega Scoring (ATM Call)
// ==========================================
export function scoreVega(vega, iv, spotPrice) {
    if (vega === undefined || vega === null || isNaN(vega) || !spotPrice) return { score: 50, bias: "Neutral", exposure: "Normal" };
    
    let score = 50;
    let bias = "Neutral";
    let exposure = "Normal";

    const vegaPct = (vega / spotPrice) * 100;

    if (vegaPct > 0.06) {
        bias = "High IV Sensitivity";
        score = 75;
        exposure = "High";
    } else if (vegaPct > 0.02) {
        bias = "Moderate Sensitivity";
        score = 50;
        exposure = "Moderate";
    } else {
        bias = "Low Sensitivity";
        score = 30;
        exposure = "Low";
    }
    
    return { score, bias, exposure };
}

export function generateVegaInsight(vega, exposure) {
    if (vega === undefined || vega === null || isNaN(vega)) return "Awaiting Vega data.";
    
    if (exposure === "High") return `High Vega (${vega.toFixed(2)}) means premium will expand/contract significantly with any shifts in Implied Volatility (IV).`;
    return `Lower Vega (${vega.toFixed(2)}) implies premium is relatively insulated from minor IV fluctuations.`;
}


// ==========================================
// 7. Aggregations (from useOptionsComposite)
// ==========================================

export function gradeTotalCallOI(chainData, instrumentKey, historicalSnapshots = {}) {
    if (!chainData || chainData.length === 0) return null;
    let totalOI = 0;
    let maxOI = 0;
    let highestOIStrike = 0;
    let oiChange = 0;
    
    chainData.forEach(row => {
        if (row.call?.oi) {
            totalOI += row.call.oi;
            oiChange += (row.call.oiChg || 0);
            if (row.call.oi > maxOI) {
                maxOI = row.call.oi;
                highestOIStrike = row.strike;
            }
        }
    });


    const isConcentrated = totalOI > 0 && (maxOI / totalOI) > 0.15;

    return {
        currentValue: totalOI,
        highestOIStrike,
        oiChange,
        score: isConcentrated ? 80 : 40,
        bias: isConcentrated ? "Bearish Resistance" : "Neutral",
        confidence: "90%",
        aiInsight: `Total Call OI stands at ${totalOI.toLocaleString()}. A massive call wall exists at ${highestOIStrike}, acting as significant resistance.`
    };
}

export function gradeTotalPutOI(chainData, instrumentKey, historicalSnapshots = {}) {
    if (!chainData || chainData.length === 0) return null;
    let totalOI = 0;
    let maxOI = 0;
    let highestOIStrike = 0;
    let oiChange = 0;
    
    chainData.forEach(row => {
        if (row.put?.oi) {
            totalOI += row.put.oi;
            oiChange += (row.put.oiChg || 0);
            if (row.put.oi > maxOI) {
                maxOI = row.put.oi;
                highestOIStrike = row.strike;
            }
        }
    });

    const isConcentrated = totalOI > 0 && (maxOI / totalOI) > 0.15;

    return {
        currentValue: totalOI,
        highestOIStrike,
        oiChange,
        score: isConcentrated ? 80 : 40,
        bias: isConcentrated ? "Bullish Support" : "Neutral",
        confidence: "90%",
        aiInsight: `Total Put OI stands at ${totalOI.toLocaleString()}. A massive put base exists at ${highestOIStrike}, providing strong floor support.`
    };
}

export function gradeOIChange(chainData, instrumentKey, historicalSnapshots = {}) {
    if (!chainData || chainData.length === 0) return null;
    
    let currentTotalCallOI = 0;
    let currentTotalPutOI = 0;
    let currentTotalOI = 0;
    
    let totalCallOiChange = 0;
    let totalPutOiChange = 0;
    
    chainData.forEach(row => {
        if (row.call?.oi) {
            currentTotalCallOI += row.call.oi;
            currentTotalOI += row.call.oi;
            totalCallOiChange += (row.call.oiChg || 0);
        }
        if (row.put?.oi) {
            currentTotalPutOI += row.put.oi;
            currentTotalOI += row.put.oi;
            totalPutOiChange += (row.put.oiChg || 0);
        }
    });

    const netChange = totalPutOiChange - totalCallOiChange; // Positive means more put writing (bullish)
    const changePercentage = currentTotalOI > 0 ? (netChange / currentTotalOI) * 100 : 0;

    return {
        currentValue: netChange,
        changePercentage,
        position: netChange > 0 ? "Put Writers Active" : "Call Writers Active",
        score: Math.min(100, Math.max(0, 50 + (changePercentage * 5))),
        bias: netChange > 0 ? "Bullish" : "Bearish",
        confidence: "90%",
        aiInsight: `Net OI has changed by ${netChange.toLocaleString()} (${changePercentage.toFixed(2)}%), indicating ${netChange > 0 ? "bullish positioning" : "bearish resistance"} in the market.`
    };
}


// ==========================================
// 8. Volatility & Max Pain
// ==========================================

export function gradeAtmIv(atmIv) {
    if (atmIv === undefined || atmIv === null || isNaN(atmIv)) return null;
    let score = 50; let bias = "Neutral"; let aiInsight = "Volatility is balanced.";
    if (atmIv > 30) { score = 85; bias = "Bearish"; aiInsight = "High ATM IV indicates expensive premiums and elevated market fear."; }
    else if (atmIv > 18) { score = 65; bias = "Cautious"; aiInsight = "Elevated ATM IV suggests expecting moderate price swings."; }
    else if (atmIv < 12) { score = 20; bias = "Bullish"; aiInsight = "Low ATM IV indicates cheap options and low market fear."; }
    return { currentValue: atmIv, score, bias, confidence: "95%", aiInsight };
}

export function gradeIvRank(ivRank) {
    if (ivRank === undefined || ivRank === null || isNaN(ivRank)) return null;
    let score = 50; let bias = "Neutral"; let aiInsight = "IV Rank is near its historical median.";
    if (ivRank > 80) { score = 90; bias = "Contrarian Bearish"; aiInsight = "Extreme IV Rank. Option selling is highly favorable."; }
    else if (ivRank > 50) { score = 70; bias = "Bearish"; aiInsight = "Elevated IV Rank favors premium sellers over buyers."; }
    else if (ivRank < 20) { score = 20; bias = "Bullish"; aiInsight = "Extremely low IV Rank. Option buying is statistically favorable."; }
    return { currentValue: ivRank, score, bias, confidence: "95%", aiInsight };
}

export function gradeIvPercentile(ivPercentile) {
    if (ivPercentile === undefined || ivPercentile === null || isNaN(ivPercentile)) return null;
    let score = 50; let bias = "Neutral"; let aiInsight = "IV Percentile shows standard volatility distribution.";
    if (ivPercentile > 80) { score = 90; bias = "Contrarian Bearish"; aiInsight = "IV is higher than 80% of the past year. High mean-reversion probability."; }
    else if (ivPercentile > 50) { score = 65; bias = "Bearish"; aiInsight = "IV is in the upper half of its yearly range."; }
    else if (ivPercentile < 20) { score = 20; bias = "Bullish"; aiInsight = "IV is lower than 80% of the past year. Volatility expansion likely."; }
    return { currentValue: ivPercentile, score, bias, confidence: "95%", aiInsight };
}

export function gradeMaxPain(chainData, spotPrice) {
    if (!chainData || chainData.length === 0 || !spotPrice) return null;
    
    // Find Max Pain Strike (Minimum Total Intrinsic Value)
    let minPain = Infinity;
    let maxPainStrike = 0;
    
    chainData.forEach(targetStrike => {
        let currentPain = 0;
        chainData.forEach(row => {
            if (row.call?.oi && targetStrike.strike < row.strike) {
                currentPain += row.call.oi * (row.strike - targetStrike.strike);
            }
            if (row.put?.oi && targetStrike.strike > row.strike) {
                currentPain += row.put.oi * (targetStrike.strike - row.strike);
            }
        });
        if (currentPain < minPain) {
            minPain = currentPain;
            maxPainStrike = targetStrike.strike;
        }
    });

    if (maxPainStrike === 0) return null;

    const diff = spotPrice - maxPainStrike;
    const diffPct = (Math.abs(diff) / spotPrice) * 100;
    
    let score = 50; let bias = "Neutral";
    if (diffPct > 2) { score = 80; bias = diff > 0 ? "Bearish Pull" : "Bullish Pull"; }
    else if (diffPct > 0.5) { score = 65; bias = diff > 0 ? "Bearish Pull" : "Bullish Pull"; }
    
    const aiInsight = `Spot is ${Math.abs(diff).toFixed(1)} (${diffPct.toFixed(2)}%) away from Max Pain (${maxPainStrike}). Expect gravitational pull towards this level by expiry.`;
    
    return { currentValue: maxPainStrike, distance: diffPct, diff, score, bias, confidence: "90%", aiInsight };
}

// ==========================================
// 9. Institutional Composite Scoring Engine
// ==========================================
export function computeOptionsInstitutionalComposite(chainData, spotPrice, instrumentKey, historicalSnapshots = {}) {
    if (!chainData || !Array.isArray(chainData) || chainData.length === 0) {
        return {
            compositeScore: 50,
            regime: { label: 'Neutral' },
            sections: [],
            tailwinds: [],
            risks: [],
            cardScores: {}
        };
    }

    let totalCallOi = 0;
    let totalPutOi = 0;
    let totalCallVol = 0;
    let totalPutVol = 0;
    let closestStrike = -1;
    let minDiff = Infinity;

    chainData.forEach(row => {
        if (row.call) {
            totalCallOi += (row.call.oi || 0);
            totalCallVol += (row.call.vol || 0);
        }
        if (row.put) {
            totalPutOi += (row.put.oi || 0);
            totalPutVol += (row.put.vol || 0);
        }
        if (spotPrice && row.strike != null) {
            const diff = Math.abs(row.strike - spotPrice);
            if (diff < minDiff) {
                minDiff = diff;
                closestStrike = row.strike;
            }
        }
    });

    const pcrOiValue = totalCallOi > 0 ? (totalPutOi / totalCallOi) : 1;
    const pcrVolValue = totalCallVol > 0 ? (totalPutVol / totalCallVol) : 1;

    const atmRow = chainData.find(r => r.strike === closestStrike);
    const callDelta = atmRow?.call?.delta || 0;
    const callGamma = atmRow?.call?.gamma || 0;
    const callTheta = atmRow?.call?.theta || 0;
    const callVega  = atmRow?.call?.vega  || 0;
    const iv = atmRow?.iv || atmRow?.call?.iv || 15;

    const c_call_oi  = gradeTotalCallOI(chainData, instrumentKey, historicalSnapshots);
    const c_put_oi   = gradeTotalPutOI(chainData, instrumentKey, historicalSnapshots);
    const c_oi_chg   = gradeOIChange(chainData, instrumentKey, historicalSnapshots);
    const c_pcr_oi   = scorePcrOi(pcrOiValue);
    const c_pcr_vol  = scorePcrVolume(pcrVolValue);
    const c_delta    = scoreDelta(callDelta);
    const c_gamma    = scoreGamma(callGamma, spotPrice);
    const c_theta    = scoreTheta(callTheta, spotPrice);
    const c_vega     = scoreVega(callVega, iv, spotPrice);
    const c_atm_iv   = gradeAtmIv(iv);
    const c_iv_rank  = gradeIvRank(50);
    const c_iv_pct   = gradeIvPercentile(50);
    const c_max_pain = gradeMaxPain(chainData, spotPrice);

    const safeScore = (obj) => (obj && obj.score != null && !isNaN(obj.score)) ? Math.round(obj.score) : null;

    const cardScores = {
        total_call_oi: safeScore(c_call_oi),
        total_put_oi: safeScore(c_put_oi),
        oi_change: safeScore(c_oi_chg),
        pcr_oi: safeScore(c_pcr_oi),
        pcr_volume: safeScore(c_pcr_vol),
        delta: safeScore(c_delta),
        gamma: safeScore(c_gamma),
        theta: safeScore(c_theta),
        vega: safeScore(c_vega),
        atm_iv: safeScore(c_atm_iv),
        iv_rank: safeScore(c_iv_rank) ?? 50,
        iv_percentile: safeScore(c_iv_pct) ?? 50,
        max_pain: safeScore(c_max_pain)
    };

    const avg = (...keys) => {
        const vals = keys.map(k => cardScores[k]).filter(v => v !== null && !isNaN(v));
        if (vals.length === 0) return null;
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    };

    const sections = [
        { id: 'Open Interest',      label: 'Open Interest',      shortLabel: 'OI',  score: avg('total_call_oi', 'total_put_oi', 'oi_change'), weight: 0.25 },
        { id: 'Put-Call Ratio',     label: 'Put-Call Ratio',     shortLabel: 'PCR', score: avg('pcr_oi', 'pcr_volume'),                       weight: 0.20 },
        { id: 'Greeks',             label: 'Greeks',             shortLabel: 'GRK', score: avg('delta', 'gamma', 'theta', 'vega'),             weight: 0.20 },
        { id: 'Market Positioning', label: 'Market Positioning', shortLabel: 'POS', score: avg('max_pain'),                                   weight: 0.20 },
        { id: 'Volatility',         label: 'Volatility',         shortLabel: 'VOL', score: avg('atm_iv', 'iv_rank', 'iv_percentile'),          weight: 0.15 },
    ];

    const validSections = sections.filter(s => s.score !== null);
    let compositeScore = 50;
    if (validSections.length > 0) {
        const totalW = validSections.reduce((acc, s) => acc + s.weight, 0);
        compositeScore = validSections.reduce((acc, s) => acc + (s.score * s.weight), 0) / totalW;
        const distressCount = validSections.filter(s => s.score < 25).length;
        compositeScore = Math.max(0, compositeScore - distressCount * 3);
        compositeScore = Math.min(100, Math.round(compositeScore));
    }

    let regimeLabel = 'Neutral';
    if (compositeScore >= 70) regimeLabel = 'Bullish';
    else if (compositeScore >= 55) regimeLabel = 'Mild Bullish';
    else if (compositeScore >= 45) regimeLabel = 'Balanced Phase';
    else if (compositeScore >= 30) regimeLabel = 'Mild Bearish';
    else regimeLabel = 'Bearish';

    const tailwindImpact = (s) => (s.score - 50) * s.weight;
    const tailwinds = sections
        .filter(s => s.score !== null && s.score >= 60)
        .sort((a, b) => tailwindImpact(b) - tailwindImpact(a))
        .slice(0, 3)
        .map(s => ({ id: s.id, label: s.label, value: s.score, sub: `${Math.round(s.weight * 100)}% weight` }));

    const riskImpact = (s) => (50 - s.score) * s.weight;
    const risks = sections
        .filter(s => s.score !== null && s.score <= 40)
        .sort((a, b) => riskImpact(b) - riskImpact(a))
        .slice(0, 3)
        .map(s => ({ id: s.id, label: s.label, value: s.score, sub: `${Math.round(s.weight * 100)}% weight` }));

    return {
        compositeScore,
        regime: { label: regimeLabel },
        sections,
        tailwinds,
        risks,
        cardScores,
        pcrOiValue,
        pcrVolValue,
        totalCallOi,
        totalPutOi
    };
}

