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

    if (pcr > 1.65) {
        bias = "Overbought (Reversal Watch)";
        score = normalize(pcr, 1.65, 2.20, 75, 55);
        sentiment = "Extreme Put Writing / Overextended";
    } else if (pcr > 1.25 && pcr <= 1.65) {
        bias = "Bullish";
        score = normalize(pcr, 1.25, 1.65, 55, 80);
        sentiment = "Solid Put Writing Floor";
    } else if (pcr >= 0.95 && pcr <= 1.25) {
        bias = "Neutral";
        score = normalize(pcr, 0.95, 1.25, 45, 55);
        sentiment = "Balanced Indian Market Baseline";
    } else if (pcr >= 0.70 && pcr < 0.95) {
        bias = "Bearish";
        score = normalize(pcr, 0.70, 0.95, 20, 45);
        sentiment = "Call Writing Resistance";
    } else {
        bias = "Oversold (Short Squeeze Watch)";
        score = normalize(pcr, 0.30, 0.70, 35, 20);
        sentiment = "Extreme Call Concentration";
    }
    
    return { score: Math.round(score), bias, sentiment };
}

export function generatePcrOiInsight(pcr, bias) {
    if (pcr === undefined || pcr === null || isNaN(pcr) || pcr === 0) return "Awaiting PCR data from chain.";
    
    if (bias && (bias.includes("Overbought") || bias.includes("Reversal"))) {
        return `PCR at ${pcr.toFixed(2)} indicates extreme put concentration. Institutional floor is strong, but overextension poses pullback risk.`;
    } else if (bias && bias.includes("Oversold")) {
        return `PCR at ${pcr.toFixed(2)} signals heavy call crowding. While bearish overhead exists, extreme oversold levels create high risk of violent short covering.`;
    } else if (bias === "Bullish") {
        return `Active put writing (PCR ${pcr.toFixed(2)}) forms a strong floor. Option writers are actively defending lower strikes.`;
    } else if (bias === "Bearish") {
        return `Call writers dominate (PCR ${pcr.toFixed(2)}), capping upward momentum with overhead supply.`;
    }
    return `PCR is balanced at ${pcr.toFixed(2)}, aligned with standard Indian market baseline with no extreme directional skew.`;
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
// 3. Greeks: Delta Scoring (ATM Call / Net Delta)
// ==========================================
export function scoreDelta(delta) {
    if (delta === undefined || delta === null || isNaN(delta)) return { score: 50, bias: "Neutral", moneyness: "Unknown" };
    
    // Smooth continuous delta scoring centered at 0.50
    let score = 50;
    let bias = "Neutral";
    let moneyness = "ATM";

    if (delta > 0.60) {
        bias = "Bullish";
        score = Math.min(90, Math.round(50 + (delta - 0.50) * 80));
        moneyness = "ITM";
    } else if (delta >= 0.40 && delta <= 0.60) {
        bias = "Neutral";
        score = Math.round(50 + (delta - 0.50) * 50);
        moneyness = "ATM";
    } else {
        bias = "Bearish";
        score = Math.max(15, Math.round(50 - (0.50 - delta) * 70));
        moneyness = "OTM";
    }
    
    return { score, bias, moneyness };
}

export function generateDeltaInsight(delta, bias) {
    if (delta === undefined || delta === null || isNaN(delta)) return "Awaiting Greeks data.";
    
    if (bias === "Bullish") return `Delta at ${delta.toFixed(3)} indicates the contract has pushed ITM, reflecting strong directional bullish momentum.`;
    if (bias === "Bearish") return `Delta at ${delta.toFixed(3)} indicates the contract is slipping OTM, reflecting fading upside velocity.`;
    return `Delta near 0.50 confirms true At-The-Money positioning with balanced directional exposure.`;
}


// ==========================================
// 4. Greeks: Gamma Scoring (ATM Call)
// ==========================================
export function scoreGamma(gamma, spotPrice, dte = null) {
    if (gamma === undefined || gamma === null || isNaN(gamma) || !spotPrice) return { score: 50, bias: "Neutral", riskLevel: "Normal" };
    
    let score = 50;
    let bias = "Neutral";
    let riskLevel = "Normal";

    const gamma1Pct = Math.abs(gamma) * (spotPrice * 0.01);
    // DTE normalization factor (prevents artificial 0 DTE explosion)
    const effectiveDte = dte ? Math.max(0.5, dte) : 5;
    const dteScale = Math.sqrt(5 / effectiveDte);
    const normalizedGamma = gamma1Pct / dteScale;

    if (normalizedGamma > 0.15) {
        bias = "High Volatility Risk";
        score = 80;
        riskLevel = "Extreme";
    } else if (normalizedGamma > 0.08) {
        bias = "Elevated Sensitivity";
        score = 65;
        riskLevel = "High";
    } else {
        bias = "Stable";
        score = 45;
        riskLevel = "Low";
    }
    
    return { score, bias, riskLevel, normalizedGamma: parseFloat(normalizedGamma.toFixed(4)) };
}

export function generateGammaInsight(gamma, riskLevel) {
    if (gamma === undefined || gamma === null || isNaN(gamma)) return "Awaiting Gamma data.";
    
    if (riskLevel === "Extreme" || riskLevel === "High") return `Elevated Gamma (${gamma.toFixed(4)}) means Delta will change rapidly. Expect violent sensitivity on small underlying moves.`;
    return `Stable Gamma (${gamma.toFixed(4)}) implies smooth Delta transitions with contained rehedging risk.`;
}


// ==========================================
// 5. Greeks: Theta Scoring (ATM Call)
// ==========================================
export function scoreTheta(theta, spotPrice, optionPremium = null, dte = null) {
    if (theta === undefined || theta === null || isNaN(theta) || (!spotPrice && !optionPremium)) return { score: 50, bias: "Neutral", decayPace: "Normal" };
    
    let score = 50;
    let bias = "Neutral";
    let decayPace = "Normal";

    // Normalize by option premium if available, else fall back to spot price equivalent
    const effectivePremium = (optionPremium && optionPremium > 0) ? optionPremium : (spotPrice ? spotPrice * 0.005 : 100);
    const thetaPct = (Math.abs(theta) / effectivePremium) * 100;
    
    // DTE normalization factor for natural 1/sqrt(T) time acceleration
    const effectiveDte = dte ? Math.max(0.5, dte) : 5;
    const dteNormFactor = Math.sqrt(effectiveDte / 5);
    const adjustedDecay = thetaPct * dteNormFactor;

    if (adjustedDecay > 15) {
        bias = "Seller's Market";
        score = 80; 
        decayPace = "Accelerated";
    } else if (adjustedDecay > 6) {
        bias = "Neutral";
        score = 50;
        decayPace = "Moderate";
    } else {
        bias = "Buyer's Market";
        score = 30;
        decayPace = "Slow";
    }
    
    return { score, bias, decayPace, decayPct: parseFloat(thetaPct.toFixed(2)) };
}

export function generateThetaInsight(theta, decayPace) {
    if (theta === undefined || theta === null || isNaN(theta)) return "Awaiting Theta data.";
    
    if (decayPace === "Accelerated") return `Severe time decay (${theta.toFixed(2)}/day). Options will rapidly erode value if spot stalls. Highly favorable for premium writers.`;
    return `Controlled time decay (${theta.toFixed(2)}/day). Option buyers have breathing room while writers collect steady premium.`;
}


// ==========================================
// 6. Greeks: Vega Scoring (ATM Call)
// ==========================================
export function scoreVega(vega, iv, spotPrice, optionPremium = null, dte = null) {
    if (vega === undefined || vega === null || isNaN(vega) || !spotPrice) return { score: 50, bias: "Neutral", exposure: "Normal" };
    
    let score = 50;
    let bias = "Neutral";
    let exposure = "Normal";

    const effectivePremium = (optionPremium && optionPremium > 0) ? optionPremium : (spotPrice * 0.005);
    const vegaPct = (vega / effectivePremium) * 100;

    if (vegaPct > 12) {
        bias = "High IV Sensitivity";
        score = 75;
        exposure = "High";
    } else if (vegaPct > 4) {
        bias = "Moderate Sensitivity";
        score = 50;
        exposure = "Moderate";
    } else {
        bias = "Low Sensitivity";
        score = 30;
        exposure = "Low";
    }
    
    return { score, bias, exposure, vegaPct: parseFloat(vegaPct.toFixed(2)) };
}

export function generateVegaInsight(vega, exposure) {
    if (vega === undefined || vega === null || isNaN(vega)) return "Awaiting Vega data.";
    
    if (exposure === "High") return `High Vega (${vega.toFixed(2)}) means option value will expand/contract significantly with any shifts in Implied Volatility (IV).`;
    return `Lower Vega (${vega.toFixed(2)}) implies option value is relatively insulated from minor IV fluctuations.`;
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
    let score = 50; let bias = "Neutral"; let aiInsight = "Volatility is in a balanced equilibrium range.";
    if (atmIv > 28) { 
        score = 25; 
        bias = "Bearish (High Fear)"; 
        aiInsight = "High ATM IV indicates expensive premiums and elevated market fear / risk pricing."; 
    } else if (atmIv > 18) { 
        score = 40; 
        bias = "Elevated Volatility"; 
        aiInsight = "Elevated ATM IV suggests the market anticipates substantial price swings."; 
    } else if (atmIv < 12) { 
        score = 75; 
        bias = "Bullish (Complacent / Stable)"; 
        aiInsight = "Low ATM IV indicates cheap options and tranquil market sentiment."; 
    }
    return { currentValue: atmIv, score, bias, confidence: "95%", aiInsight };
}

export function gradeIvRank(ivRank) {
    if (ivRank === undefined || ivRank === null || isNaN(ivRank)) return null;
    let score = 50; let bias = "Neutral"; let aiInsight = "IV Rank is near its historical median.";
    if (ivRank > 80) { score = 30; bias = "Extreme High IV"; aiInsight = "Extreme IV Rank. Options are expensive; mean-reversion compression favored."; }
    else if (ivRank > 55) { score = 42; bias = "Elevated IV"; aiInsight = "Elevated IV Rank favors premium sellers over buyers."; }
    else if (ivRank < 20) { score = 75; bias = "Low IV"; aiInsight = "Extremely low IV Rank. Options are cheap; volatility expansion favored."; }
    return { currentValue: ivRank, score, bias, confidence: "95%", aiInsight };
}

export function gradeIvPercentile(ivPercentile) {
    if (ivPercentile === undefined || ivPercentile === null || isNaN(ivPercentile)) return null;
    let score = 50; let bias = "Neutral"; let aiInsight = "IV Percentile shows standard volatility distribution.";
    if (ivPercentile > 80) { score = 30; bias = "Extreme High Percentile"; aiInsight = "IV is higher than 80% of the past year. Elevated fear and risk premium."; }
    else if (ivPercentile > 55) { score = 42; bias = "Upper Half Percentile"; aiInsight = "IV is in the upper half of its yearly historical distribution."; }
    else if (ivPercentile < 20) { score = 75; bias = "Low Percentile"; aiInsight = "IV is lower than 80% of the past year. Calm conditions with low option cost."; }
    return { currentValue: ivPercentile, score, bias, confidence: "95%", aiInsight };
}

export function gradeMaxPain(chainData, spotPrice) {
    if (!chainData || chainData.length === 0 || !spotPrice) return null;
    
    // Find Max Pain Strike (Minimum Total Intrinsic Value)
    let minPain = Infinity;
    let maxPainStrike = 0;
    
    chainData.forEach(targetStrike => {
        let currentPain = 0;
        const K = targetStrike.strike;
        chainData.forEach(row => {
            // Textbook Intrinsic Payoff:
            // Calls are in-the-money when target expiry price K > row.strike
            if (row.call?.oi && K > row.strike) {
                currentPain += (K - row.strike) * row.call.oi;
            }
            // Puts are in-the-money when target expiry price K < row.strike
            if (row.put?.oi && K < row.strike) {
                currentPain += (row.strike - K) * row.put.oi;
            }
        });
        if (currentPain < minPain) {
            minPain = currentPain;
            maxPainStrike = K;
        }
    });

    if (maxPainStrike === 0) return null;

    const diff = spotPrice - maxPainStrike;
    const diffPct = (Math.abs(diff) / spotPrice) * 100;
    
    // Continuous, polarity-aligned scoring:
    // If spot > maxPain (diff > 0): Gravitational pull down towards strike (Bearish Pull) -> score < 50
    // If spot < maxPain (diff < 0): Gravitational pull up towards strike (Bullish Pull) -> score > 50
    let score = 50; 
    let bias = "Neutral";
    if (diffPct >= 0.15 || Math.abs(diff) >= 25) {
        if (diff > 0) {
            bias = "Bearish Pull";
            score = Math.max(15, Math.round(50 - Math.min(35, Math.max(5, diffPct * 25))));
        } else {
            bias = "Bullish Pull";
            score = Math.min(85, Math.round(50 + Math.min(35, Math.max(5, diffPct * 25))));
        }
    }
    
    const aiInsight = `Spot is ${Math.abs(diff).toFixed(1)} (${diffPct.toFixed(2)}%) away from Max Pain (${maxPainStrike}). Gravitational magnet effect is ${bias}.`;
    
    return { currentValue: maxPainStrike, distance: diffPct, diff, score, bias, confidence: "90%", aiInsight };
}

export function gradeExpectedMove(chainData, spotPrice, atmIv = 15, dte = 5) {
    if (!spotPrice || spotPrice <= 0) return null;
    
    let expectedMove = 0;
    let method = "ATM IV";
    
    // Attempt 1: From ATM Straddle in chainData
    if (Array.isArray(chainData) && chainData.length > 0) {
        let closestStrike = -1;
        let minDiff = Infinity;
        chainData.forEach(row => {
            if (row.strike != null) {
                const diff = Math.abs(row.strike - spotPrice);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestStrike = row.strike;
                }
            }
        });
        const atmRow = chainData.find(r => r.strike === closestStrike);
        const callLtp = Number(atmRow?.call?.ltp) || 0;
        const putLtp = Number(atmRow?.put?.ltp) || 0;
        const straddlePrice = callLtp + putLtp;
        if (straddlePrice > 0) {
            expectedMove = straddlePrice * 0.85;
            method = "ATM Straddle";
        }
    }
    
    // Attempt 2: 1-sigma Black-Scholes lognormal model
    if (expectedMove <= 0 && atmIv > 0) {
        const safeDte = Math.max(0.5, dte || 5);
        const T = safeDte / 365.0;
        expectedMove = spotPrice * (atmIv / 100.0) * Math.sqrt(T);
        method = "Black-Scholes 1σ";
    }

    if (expectedMove <= 0) return null;

    const upperBand = spotPrice + expectedMove;
    const lowerBand = spotPrice - expectedMove;
    const emPct = (expectedMove / spotPrice) * 100;

    let score = 55;
    let bias = "Range-Bound";
    if (emPct > 0) {
        score = 60;
        bias = "Contained Range";
    }

    const aiInsight = `Implied ${method} Expected Move is ±₹${expectedMove.toFixed(1)} (${emPct.toFixed(2)}%), establishing an expiry range of ₹${lowerBand.toFixed(0)} – ₹${upperBand.toFixed(0)}. Positioning is ${bias}.`;

    return {
        currentValue: expectedMove,
        upperBand,
        lowerBand,
        emPct,
        method,
        score,
        bias,
        confidence: "92%",
        aiInsight
    };
}

export function gradeGEX(chainData, spotPrice) {
    if (!Array.isArray(chainData) || chainData.length === 0 || !spotPrice || spotPrice <= 0) return null;

    let totalGexRupees = 0;
    let totalCallGex = 0;
    let totalPutGex = 0;

    chainData.forEach(row => {
        const S = spotPrice;
        const callOi = Number(row.call?.oi) || 0;
        const putOi = Number(row.put?.oi) || 0;
        
        let gamma = Number(row.call?.gamma || row.gamma) || 0;
        if (gamma <= 0 && row.strike) {
            const moneyness = Math.log(S / row.strike);
            const sigma = 0.15 * Math.sqrt(5 / 365);
            gamma = (1 / (S * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(moneyness / sigma, 2));
        }

        if (gamma > 0) {
            const cGex = callOi * gamma * S * 100;
            const pGex = putOi * gamma * S * 100;
            totalCallGex += cGex;
            totalPutGex += pGex;
            totalGexRupees += (cGex - pGex);
        }
    });

    const netGexCr = totalGexRupees / 10000000;
    let score = 50;
    let bias = "Neutral Gamma";
    let regime = "Neutral Flip Zone";

    if (netGexCr > 0.5) {
        score = Math.min(85, Math.round(55 + Math.min(30, netGexCr * 5)));
        bias = "Long Gamma (Volatility Suppressed)";
        regime = "Positive Gamma";
    } else if (netGexCr < -0.5) {
        score = Math.max(15, Math.round(45 - Math.min(30, Math.abs(netGexCr) * 5)));
        bias = "Short Gamma (Volatility Accelerated)";
        regime = "Negative Gamma";
    }

    const aiInsight = `Net Dealer Gamma Exposure is ${netGexCr >= 0 ? '+' : ''}${netGexCr.toFixed(2)} Cr per 1% move. Market is operating in a ${regime} regime (${bias}).`;

    return {
        currentValue: netGexCr,
        netGexCr,
        totalCallGexCr: totalCallGex / 10000000,
        totalPutGexCr: totalPutGex / 10000000,
        regime,
        score,
        bias,
        confidence: "90%",
        aiInsight
    };
}

// ==========================================
// 9. Institutional Composite Scoring Engine
// ==========================================
export function computeOptionsInstitutionalComposite(chainData, spotPrice, instrumentKey, historicalSnapshots = {}) {
    if (!chainData || !Array.isArray(chainData) || chainData.length === 0) {
        return {
            compositeScore: 0,
            regime: { label: 'Awaiting Data' },
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
    const iv        = atmRow?.iv || 15;
    const callLtp   = atmRow?.call?.ltp || 0;

    const estimatedIvRank = Math.min(100, Math.max(0, Math.round(((iv - 11.0) / (25.0 - 11.0)) * 100)));

    const c_oi_chg   = gradeOIChange(chainData, instrumentKey, historicalSnapshots);
    const c_total_call_oi = gradeTotalCallOI(chainData, instrumentKey, historicalSnapshots);
    const c_total_put_oi  = gradeTotalPutOI(chainData, instrumentKey, historicalSnapshots);
    const c_pcr_oi   = scorePcrOi(pcrOiValue);
    const c_pcr_vol  = scorePcrVolume(pcrVolValue);
    const c_delta    = scoreDelta(callDelta);
    const c_gamma    = scoreGamma(callGamma, spotPrice);
    const c_theta    = scoreTheta(callTheta, spotPrice, callLtp);
    const c_vega     = scoreVega(callVega, iv, spotPrice, callLtp);
    const c_atm_iv   = gradeAtmIv(iv);
    const c_iv_rank  = gradeIvRank(estimatedIvRank);
    const c_iv_pct   = gradeIvPercentile(estimatedIvRank);
    const c_max_pain = gradeMaxPain(chainData, spotPrice);
    const c_expected_move = gradeExpectedMove(chainData, spotPrice, iv);
    const c_gex      = gradeGEX(chainData, spotPrice);

    const safeScore = (obj) => (obj && obj.score != null && !isNaN(obj.score)) ? Math.round(obj.score) : null;

    const cardScores = {
        oi_change: safeScore(c_oi_chg),
        total_call_oi: safeScore(c_total_call_oi),
        total_put_oi: safeScore(c_total_put_oi),
        pcr_oi: safeScore(c_pcr_oi),
        pcr_volume: safeScore(c_pcr_vol),
        delta: safeScore(c_delta),
        gamma: safeScore(c_gamma),
        theta: safeScore(c_theta),
        vega: safeScore(c_vega),
        atm_iv: safeScore(c_atm_iv),
        iv_rank: safeScore(c_iv_rank) ?? 50,
        max_pain: safeScore(c_max_pain),
        expected_move: safeScore(c_expected_move),
        gex: safeScore(c_gex)
    };

    const avg = (...keys) => {
        const vals = keys.map(k => cardScores[k]).filter(v => v !== null && !isNaN(v));
        if (vals.length === 0) return null;
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    };

    const sections = [
        { id: 'Open Interest',      label: 'Open Interest',      shortLabel: 'OI',  score: avg('oi_change', 'total_call_oi', 'total_put_oi'), weight: 0.20 },
        { id: 'Put-Call Ratio',     label: 'Put-Call Ratio',     shortLabel: 'PCR', score: avg('pcr_oi', 'pcr_volume'), weight: 0.30 },
        { id: 'Greeks',             label: 'Greeks',             shortLabel: 'GRK', score: avg('delta', 'gamma', 'theta', 'vega'), weight: 0.20 },
        { id: 'Volatility',         label: 'Volatility',         shortLabel: 'VOL', score: avg('atm_iv', 'iv_rank'), weight: 0.20 },
        { id: 'Market Positioning', label: 'Market Positioning', shortLabel: 'POS', score: avg('max_pain', 'expected_move', 'gex'), weight: 0.10 },
    ];

    const validSections = sections.filter(s => s.score !== null);
    let compositeScore = 0;
    if (validSections.length > 0) {
        const totalW = validSections.reduce((acc, s) => acc + s.weight, 0);
        compositeScore = validSections.reduce((acc, s) => acc + (s.score * s.weight), 0) / totalW;
        const distressCount = validSections.filter(s => s.score < 25).length;
        compositeScore = Math.max(0, compositeScore - distressCount * 3);
        compositeScore = Math.min(100, Math.round(compositeScore));
    }

    let regimeLabel = 'Neutral';
    if (validSections.length === 0) regimeLabel = 'Awaiting Data';
    else if (compositeScore >= 70) regimeLabel = 'Bullish';
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

