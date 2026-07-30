import { FUNDAMENTAL_THRESHOLDS, DEFAULT_BIAS_MAP, applyBiasMap } from '../../../../shared/thresholds/fundamentalThresholds.js';

export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// Helper: resolve a score from an absolute bands array in FUNDAMENTAL_THRESHOLDS
// Band format: { below?, above?, else?, score }
function resolveBand(value, bands) {
    for (const band of bands) {
        if (band.else) return band.score;
        if (band.below !== undefined && value < band.below) return band.score;
        if (band.above !== undefined && value > band.above) return band.score;
    }
    return bands[bands.length - 1].score;
}

export function scoreADRatio(adRatio) {
    if (adRatio === null || isNaN(adRatio)) {
        return { score: null, bias: 'Neutral', confidence: 0, breadthZone: 'Unknown', signalType: 'No Data' };
    }

    // ── Factor 1: Level vs Neutral (0–100) ────────────────────────────────
    // Neutral line is 1.0. Deviation above = bullish. Deviation below = bearish.
    let f1Score;
    if (adRatio > 2.5)       f1Score = 85; // Very strong but potential exhaustion
    else if (adRatio > 1.5)  f1Score = 90; // Strong bullish breadth
    else if (adRatio > 1.2)  f1Score = 78; // Bullish breadth
    else if (adRatio >= 0.9) f1Score = 52; // Near neutral
    else if (adRatio >= 0.7) f1Score = 32; // Moderately bearish breadth
    else if (adRatio >= 0.5) f1Score = 18; // Broad selling
    else                     f1Score = 8;  // Extreme panic

    // ── Factor 2: Extreme Contrarian Adjustment (penalty for exhaustion) ──
    // When breadth is extremely one-sided, it often signals short-term exhaustion
    let f2Score = f1Score;
    let signalType = 'Trending';
    if (adRatio > 2.5) {
        f2Score = Math.max(f1Score - 15, 60); // Reduce score — extreme breadth = near-term caution
        signalType = 'Exhaustion Risk';
    } else if (adRatio < 0.4) {
        f2Score = Math.min(f1Score + 20, 40); // Boost slightly — panic = contrarian buy signal
        signalType = 'Contrarian Reversal Signal';
    } else if (adRatio > 1.5) {
        signalType = 'Broad Buying';
    } else if (adRatio < 0.7) {
        signalType = 'Broad Selling';
    } else {
        signalType = 'Mixed Breadth';
    }

    // ── Factor 3: Absolute Safety Bands (0–100) ───────────────────────────
    let f3Score;
    if (adRatio > 2.0)       f3Score = 70; // Strong but cautious
    else if (adRatio > 1.2)  f3Score = 82;
    else if (adRatio >= 0.8) f3Score = 50;
    else if (adRatio >= 0.5) f3Score = 25;
    else                     f3Score = 10;

    // ── Blend ─────────────────────────────────────────────────────────────
    const blended = (f2Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    const bias = applyBiasMap(finalScore, FUNDAMENTAL_THRESHOLDS.advance_decline.biasMap);

    // ── Breadth Zone Label ────────────────────────────────────────────────
    let breadthZone;
    if (adRatio > 2.0)       breadthZone = 'Extreme Breadth';
    else if (adRatio > 1.2)  breadthZone = 'Strong Breadth';
    else if (adRatio >= 0.8) breadthZone = 'Neutral Zone';
    else if (adRatio >= 0.5) breadthZone = 'Weak Breadth';
    else                     breadthZone = 'Panic Zone';

    // ── Confidence: higher at extremes where the signal is clearest ───────
    let confidence;
    if (adRatio > 2.0 || adRatio < 0.5) confidence = 88;
    else if (adRatio > 1.3 || adRatio < 0.7) confidence = 80;
    else confidence = 65;

    return { score: finalScore, bias, confidence, breadthZone, signalType };
}

export function scoreDebtToEquity(currentDE, sectorDE) {
    if (currentDE === null || isNaN(currentDE)) {
        return { score: null, bias: 'Neutral', confidence: 0, leverageZone: 'Unknown' };
    }

    const T = FUNDAMENTAL_THRESHOLDS.debt_to_equity;

    // ── Factor 1: Absolute D/E Thresholds (0–100) ─────────────────────────
    const abs1  = T.absoluteBands.find(b => b.else || (b.below !== undefined && currentDE < b.below));
    const f1Score   = abs1?.score ?? 5;
    const leverageZone = abs1?.zone ?? 'Dangerously Leveraged';

    // ── Factor 2: Relative vs Sector D/E ─────────────────────────────────
    let f2Score = f1Score;
    let hasSector = false;
    if (sectorDE !== null && !isNaN(sectorDE) && sectorDE > 0) {
        hasSector = true;
        const ratio = currentDE / sectorDE;
        f2Score = resolveBand(ratio, T.sectorRatioBands);
    }

    // ── Factor 3: Risk Regime Classification ─────────────────────────────
    const f3Score = resolveBand(currentDE, T.riskBands);

    // ── Blend ─────────────────────────────────────────────────────────────
    const fw = hasSector ? T.factorWeights.withSector : T.factorWeights.withoutSector;
    const blended = hasSector
        ? (f1Score * fw.f1) + (f2Score * fw.f2) + (f3Score * fw.f3)
        : (f1Score * fw.f1) + (f3Score * fw.f3);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    const bias = applyBiasMap(finalScore, T.biasMap);
    const confidence = hasSector
        ? T.confidence.withSector
        : (currentDE < 0.5 || currentDE > 2.0 ? T.confidence.extremeNoSector : T.confidence.normal);

    return { score: finalScore, bias, confidence, leverageZone };
}

export function scoreDividendYield(currentYield, bondYield) {
    if (currentYield === null || isNaN(currentYield)) return { score: null, bias: 'Neutral', confidence: '0%' };

    const T = FUNDAMENTAL_THRESHOLDS.dividend_yield;
    let score = 50;
    let confidencePoints = 40;

    if (bondYield !== null && !isNaN(bondYield)) {
        confidencePoints += 20;
        const spread = currentYield - bondYield;
        if (spread > 2.0) score += 20;
        else if (spread > 0) score += 10;
        else if (currentYield === 0) score -= 10;
        else score -= 5;
    } else {
        if (currentYield > 5.0) score += 20;
        else if (currentYield > 3.0) score += 10;
        else if (currentYield === 0) score -= 10;
    }

    score = Math.max(0, Math.min(100, score));
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: `${confidencePoints}%` };
}

export function scoreEarningsTrend(epsHistory, manualCAGR) {
    if ((!epsHistory || epsHistory.length < 2) && (manualCAGR === null || isNaN(manualCAGR))) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendLabel: '--', cagr: null };
    }

    const T = FUNDAMENTAL_THRESHOLDS.earnings_trend;
    let score = 50;
    let confidencePoints = 0;
    let trendLabel = 'Unknown';
    let calculatedCAGR = null;

    if (epsHistory && epsHistory.length >= 2) {
        const chronological = [...epsHistory].reverse();
        let positiveYears = 0;
        let negativeYears = 0;
        let totalPeriods = chronological.length - 1;

        for (let i = 1; i <= totalPeriods; i++) {
            const prev = chronological[i-1].value;
            const curr = chronological[i].value;
            if (prev > 0) {
                const growth = (curr - prev) / Math.abs(prev);
                if (growth > 0) positiveYears++;
                else negativeYears++;
            }
        }

        const first = chronological[0].value;
        const last = chronological[chronological.length - 1].value;
        if (first > 0 && last > 0) {
            calculatedCAGR = (Math.pow(last / first, 1 / totalPeriods) - 1) * 100;
        }

        confidencePoints = Math.min(T.confidence.max, T.confidence.base + (totalPeriods * T.confidence.perPeriod));

        if (positiveYears === totalPeriods) {
            score = 90; trendLabel = 'Consistent Growth';
        } else if (positiveYears > negativeYears && last > chronological[totalPeriods-1].value) {
            score = 75; trendLabel = 'Improving';
        } else if (positiveYears === negativeYears) {
            score = 50; trendLabel = 'Volatile / Flat';
        } else if (negativeYears > positiveYears && last < chronological[totalPeriods-1].value) {
            score = 30; trendLabel = 'Weakening';
        } else if (negativeYears === totalPeriods) {
            score = 10; trendLabel = 'Consistent Decline';
        } else {
            score = 50; trendLabel = 'Mixed';
        }
    } else {
        calculatedCAGR = manualCAGR;
        confidencePoints = T.confidence.manual;
        if (manualCAGR > 15)       { score = 90; trendLabel = 'Consistent Growth'; }
        else if (manualCAGR > 5)   { score = 75; trendLabel = 'Improving'; }
        else if (manualCAGR > -5)  { score = 50; trendLabel = 'Stable / Flat'; }
        else if (manualCAGR > -15) { score = 30; trendLabel = 'Weakening'; }
        else                       { score = 10; trendLabel = 'Consistent Decline'; }
    }

    return { score, bias: applyBiasMap(score, T.biasMap), confidence: `${confidencePoints}%`, trendLabel, cagr: calculatedCAGR };
}

export function scoreEarningsYield(currentYield, historicalYield, bondYield) {
    if (!currentYield) {
        return { score: null, bias: 'Unknown', confidence: '0%' };
    }

    const T = FUNDAMENTAL_THRESHOLDS.earnings_yield;
    let score = 50;
    let conditionsMet = 0;

    if (historicalYield) {
        conditionsMet++;
        if (currentYield >= historicalYield * 1.3)     score += 30;
        else if (currentYield > historicalYield * 1.1) score += 15;
        else if (currentYield <= historicalYield * 0.7) score -= 30;
        else if (currentYield < historicalYield * 0.9) score -= 15;
    }

    if (bondYield) {
        conditionsMet++;
        const equityRiskPremium = currentYield - bondYield;
        if (equityRiskPremium >= 4.0)      score += 20;
        else if (equityRiskPremium >= 2.0) score += 10;
        else if (equityRiskPremium < 0)    score -= 20;
        else if (equityRiskPremium < 1.0)  score -= 10;
    }

    score = Math.max(0, Math.min(100, score));

    const confidence = conditionsMet === 2 ? T.confidence.both
        : conditionsMet === 1 ? T.confidence.one
        : T.confidence.none;

    return { score, bias: applyBiasMap(score, T.biasMap), confidence };
}

export function scoreEPSGrowth(cagr, latestYoY, positiveYears, totalPeriods) {
    if (cagr === null || isNaN(cagr)) {
        return { score: null, bias: 'Neutral', confidence: 0, growthTier: 'Unknown', momentumLabel: 'Unknown' };
    }

    // ── Factor 1: CAGR Level (0–100) ─────────────────────────────────────
    let f1Score;
    let growthTier;
    if (cagr > 25) {
        f1Score = 95; growthTier = 'Exceptional Compounder';
    } else if (cagr > 15) {
        f1Score = 82; growthTier = 'Strong Growth';
    } else if (cagr > 8) {
        f1Score = 65; growthTier = 'Healthy Growth';
    } else if (cagr > 0) {
        f1Score = 48; growthTier = 'Modest Growth';
    } else if (cagr > -10) {
        f1Score = 25; growthTier = 'Earnings Contraction';
    } else {
        f1Score = 8;  growthTier = 'Severe EPS Decline';
    }

    // ── Factor 2: Latest YoY Momentum (acceleration vs deceleration) ──────
    let f2Score = f1Score;
    let momentumLabel = 'Stable';
    if (latestYoY !== null && !isNaN(latestYoY) && cagr !== 0) {
        const accelerating = latestYoY > cagr + 5;
        const decelerating = latestYoY < cagr - 5;
        if (accelerating) {
            f2Score = Math.min(100, f1Score + 12); momentumLabel = 'Accelerating ↑';
        } else if (decelerating && latestYoY < 0) {
            f2Score = Math.max(0, f1Score - 20); momentumLabel = 'Sharply Decelerating ↓';
        } else if (decelerating) {
            f2Score = Math.max(0, f1Score - 8); momentumLabel = 'Decelerating ↓';
        } else {
            momentumLabel = 'Steady';
        }
    }

    // ── Factor 3: Earnings Consistency ────────────────────────────────────
    let f3Score = 50;
    if (totalPeriods > 0 && positiveYears !== null) {
        const consistencyRatio = positiveYears / totalPeriods;
        if (consistencyRatio >= 1.0)       f3Score = 92;
        else if (consistencyRatio >= 0.75) f3Score = 72;
        else if (consistencyRatio >= 0.5)  f3Score = 50;
        else if (consistencyRatio >= 0.25) f3Score = 28;
        else                               f3Score = 10;
    }

    // ── Blend ─────────────────────────────────────────────────────────────
    const hasHistory = totalPeriods > 0;
    const blended = hasHistory
        ? (f1Score * 0.45) + (f2Score * 0.35) + (f3Score * 0.20)
        : f1Score;
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    const bias = applyBiasMap(finalScore, FUNDAMENTAL_THRESHOLDS.eps_growth.biasMap);

    let confidence;
    if (totalPeriods >= 5)      confidence = 90;
    else if (totalPeriods >= 3) confidence = 80;
    else if (totalPeriods >= 2) confidence = 70;
    else                        confidence = 55;

    return { score: finalScore, bias, confidence, growthTier, momentumLabel };
}

export function scoreInstitutionalFlow(fiiFlow, diiFlow) {
    if (fiiFlow === null || isNaN(fiiFlow) || diiFlow === null || isNaN(diiFlow)) {
        return { score: null, bias: 'Neutral', confidence: '0%', netFlow: null };
    }

    const netFlow = fiiFlow + diiFlow;
    let score = 50;

    if (fiiFlow > 0 && diiFlow > 0) { score = 95; }
    else if (fiiFlow < 0 && diiFlow < 0) { score = 10; }
    else if (netFlow > 0) { score = fiiFlow > 0 ? 80 : 70; }
    else { score = fiiFlow < 0 ? 30 : 40; }

    return { score, bias: applyBiasMap(score, FUNDAMENTAL_THRESHOLDS.advance_decline.biasMap), confidence: '95%', netFlow };
}

export function scoreForwardPE(currentFwdPE, currentPE) {
    if (currentFwdPE === null || currentFwdPE === undefined || isNaN(currentFwdPE)) {
        return { score: null, bias: 'Neutral', confidence: 60 };
    }

    const T = FUNDAMENTAL_THRESHOLDS.forward_pe;

    if (currentPE === null || currentPE === undefined || isNaN(currentPE)) {
        // Absolute Forward PE scoring if Trailing PE is missing
        const absScore = resolveBand(currentFwdPE, T.absoluteBands);
        return { score: absScore, bias: applyBiasMap(absScore, T.biasMap), confidence: T.confidence.absoluteOnly };
    }

    // Relative scoring: Forward PE vs Trailing PE
    const growthPremium = (currentPE - currentFwdPE) / currentPE; // Positive means Fwd PE is lower (growth)

    let relScore = 50;
    if (growthPremium > 0.30)       relScore = 95;
    else if (growthPremium > 0.15)  relScore = 85;
    else if (growthPremium > 0.05)  relScore = 65;
    else if (growthPremium > -0.05) relScore = 50;
    else if (growthPremium > -0.15) relScore = 35;
    else if (growthPremium > -0.30) relScore = 20;
    else                            relScore = 5;

    return { score: relScore, bias: applyBiasMap(relScore, T.biasMap), confidence: T.confidence.withTrailing };
}

export function scoreFreeCashFlow(currentFCF, revenue) {
    if (currentFCF === null || isNaN(currentFCF)) {
        return { score: null, bias: 'Neutral', confidence: 0, fcfCategory: 'Unknown', fcfYield: null };
    }

    // ── Compute FCF Yield when revenue is available ───────────────────────
    let fcfYield = null;
    if (revenue !== null && !isNaN(revenue) && revenue > 0) {
        fcfYield = (currentFCF / revenue) * 100;
    }

    // ── Factor 1: FCF Sign + Magnitude Absolute Context (0–100) ──────────
    let f1Score;
    let fcfCategory;
    if (currentFCF > 0) {
        // Positive FCF — use yield if available, else use raw sign
        if (fcfYield !== null) {
            if (fcfYield > 15)       { f1Score = 95; fcfCategory = 'Exceptional FCF Generation'; }
            else if (fcfYield > 8)   { f1Score = 82; fcfCategory = 'Strong FCF Generation'; }
            else if (fcfYield > 4)   { f1Score = 68; fcfCategory = 'Healthy FCF Generation'; }
            else if (fcfYield > 1)   { f1Score = 55; fcfCategory = 'Positive — Thin Yield'; }
            else                     { f1Score = 48; fcfCategory = 'Barely Positive'; }
        } else {
            // No revenue data — use raw FCF sign as bullish signal only
            f1Score = 68; fcfCategory = 'Positive FCF';
        }
    } else if (currentFCF === 0) {
        f1Score = 45; fcfCategory = 'Break-Even';
    } else {
        // Negative FCF — use yield if available
        if (fcfYield !== null) {
            if (fcfYield > -5)       { f1Score = 35; fcfCategory = 'Mild Cash Burn'; }
            else if (fcfYield > -15) { f1Score = 20; fcfCategory = 'Significant Cash Burn'; }
            else                     { f1Score = 5;  fcfCategory = 'Heavy Cash Burn'; }
        } else {
            f1Score = 22; fcfCategory = 'Negative FCF';
        }
    }

    // ── Factor 2: FCF Yield Quality Band ─────────────────────────────────
    let f2Score = 50;
    if (fcfYield !== null) {
        if (fcfYield > 12)       f2Score = 95;
        else if (fcfYield > 6)   f2Score = 80;
        else if (fcfYield > 2)   f2Score = 62;
        else if (fcfYield > 0)   f2Score = 50;
        else if (fcfYield > -5)  f2Score = 32;
        else if (fcfYield > -15) f2Score = 15;
        else                     f2Score = 5;
    } else {
        // No yield — score based on raw FCF sign only
        f2Score = currentFCF > 0 ? 65 : (currentFCF === 0 ? 45 : 25);
    }

    // ── Factor 3: Absolute Context ────────────────────────────────────────
    // Provides a sanity-check band regardless of yield
    let f3Score;
    if (currentFCF > 0)      f3Score = 70; // Positive is always at least good structurally
    else if (currentFCF > -1000) f3Score = 35;
    else                     f3Score = 10;

    // ── Blend ─────────────────────────────────────────────────────────────
    const hasYield = fcfYield !== null;
    const blended = hasYield
        ? (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20)
        : (f1Score * 0.70) + (f3Score * 0.30);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    const bias = applyBiasMap(finalScore, FUNDAMENTAL_THRESHOLDS.free_cash_flow.biasMap);
    const confidence = hasYield ? 88 : 68;

    return { score: finalScore, bias, confidence, fcfCategory, fcfYield };
}

export function scoreGDPGrowth(currentGrowth) {
    if (currentGrowth === null || isNaN(currentGrowth)) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    const T = FUNDAMENTAL_THRESHOLDS.gdp_growth;
    const match = T.absoluteBands.find(b => b.else || (b.above !== undefined && currentGrowth > b.above));
    const score     = match?.score ?? 10;
    const trendDesc = match?.label ?? 'Contraction (Recession)';

    const confidence = currentGrowth > 8 || currentGrowth < 0 ? `${T.confidence.extreme}%` : `${T.confidence.normal}%`;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence, trendDesc };
}

export function scorePCR(pcrValue) {
    if (pcrValue === null || isNaN(pcrValue)) {
        return { score: null, bias: 'Neutral', confidence: 0, optionsBias: 'Unknown', signalStrength: 'No Data' };
    }
    const T = FUNDAMENTAL_THRESHOLDS.pcr;
    // ── Factor 1: Contrarian Level Score (0–100) ──────────────────────────
    // HIGH PCR = bullish contrarian signal (bearish crowd = market bottom)
    // LOW PCR = bearish contrarian signal (bullish crowd = market top)
    let f1Score;
    if (pcrValue > 1.8)       f1Score = 95; // Extreme put buying = extreme bearish = strong bottom signal
    else if (pcrValue > 1.5)  f1Score = 85; // Heavy put buying = oversold sentiment
    else if (pcrValue > 1.2)  f1Score = 72; // Moderate put dominance = bullish lean
    else if (pcrValue > 0.9)  f1Score = 52; // Near neutral
    else if (pcrValue > 0.7)  f1Score = 38; // Mild call dominance = mild complacency
    else if (pcrValue > 0.55) f1Score = 22; // Strong call dominance = overbought sentiment
    else                      f1Score = 8;  // Extreme greed = strong top signal

    // ── Factor 2: Options Dominance Strength ─────────────────────────────
    // How far from neutral (1.0) — further away = stronger signal
    const distanceFromNeutral = Math.abs(pcrValue - 1.0);
    let f2Score;
    let signalStrength;
    if (distanceFromNeutral > 0.7) {
        f2Score = (pcrValue > 1.0) ? 90 : 10; // Extreme — very strong contrarian signal
        signalStrength = 'Extreme';
    } else if (distanceFromNeutral > 0.4) {
        f2Score = (pcrValue > 1.0) ? 72 : 28; // Strong
        signalStrength = 'Strong';
    } else if (distanceFromNeutral > 0.2) {
        f2Score = (pcrValue > 1.0) ? 60 : 40; // Moderate
        signalStrength = 'Moderate';
    } else {
        f2Score = 52; // Near neutral — weak signal
        signalStrength = 'Neutral';
    }

    // ── Factor 3: Historical India PCR Context ───────────────────────────
    // NSE historical PCR typically ranges 0.6–1.4; extremes beyond are rare
    let f3Score;
    if (pcrValue > 1.6)       f3Score = 90; // Top 5% historically — strong bottom signal
    else if (pcrValue > 1.3)  f3Score = 75; // Top 20%
    else if (pcrValue > 0.9)  f3Score = 52; // Middle range
    else if (pcrValue > 0.65) f3Score = 30; // Lower 20%
    else                      f3Score = 8;  // Bottom 5% — strong top signal

    // ── Blend ─────────────────────────────────────────────────────────────
    const blended = (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    // ── Bias Mapping ──────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Options Dominance Label ───────────────────────────────────────────
    let optionsBias;
    if (pcrValue > 1.5)       optionsBias = 'Extreme Put Dominance';
    else if (pcrValue > 1.2)  optionsBias = 'Put Dominated';
    else if (pcrValue > 0.8)  optionsBias = 'Balanced';
    else if (pcrValue > 0.6)  optionsBias = 'Call Dominated';
    else                      optionsBias = 'Extreme Call Dominance';

    // ── Confidence: highest at extremes where PCR is most predictive ─────
    let confidence;
    if (pcrValue > 1.6 || pcrValue < 0.6) confidence = 88; // Extreme readings = high signal quality
    else if (pcrValue > 1.3 || pcrValue < 0.75) confidence = 78;
    else confidence = 60; // Neutral zone = weak predictive power

    return { score: finalScore, bias, confidence, optionsBias, signalStrength };
}

export function scoreInterestCoverage(currentCoverage, sectorCoverage) {
    if (currentCoverage === null || isNaN(currentCoverage)) {
        return { score: null, bias: 'Neutral', confidence: 0, safetyZone: 'Unknown' };
    }

    const T = FUNDAMENTAL_THRESHOLDS.interest_coverage;

    // ── Factor 1: Absolute Safety Threshold ───────────────────────────────
    let f1Score;
    let safetyZone;
    if (currentCoverage > 15) {
        f1Score = 98; safetyZone = 'Fortress Balance Sheet';
    } else if (currentCoverage > 8) {
        f1Score = 90; safetyZone = 'Very Safe';
    } else if (currentCoverage > 5) {
        f1Score = 78; safetyZone = 'Comfortable';
    } else if (currentCoverage >= 3) {
        f1Score = 60; safetyZone = 'Adequate';
    } else if (currentCoverage >= 1.5) {
        f1Score = 35; safetyZone = 'Thin — Watch Closely';
    } else if (currentCoverage >= 1.0) {
        f1Score = 15; safetyZone = 'At Risk';
    } else {
        f1Score = 3;  safetyZone = 'Distress — Cannot Cover Interest';
    }

    // ── Factor 2: Margin of Safety Above Break-Even (1.0x) ────────────────
    const marginAboveBreakeven = Math.max(0, currentCoverage - 1.0);
    let f2Score;
    if (marginAboveBreakeven > 10) f2Score = 95;
    else if (marginAboveBreakeven > 5) f2Score = 82;
    else if (marginAboveBreakeven > 3) f2Score = 65;
    else if (marginAboveBreakeven > 1) f2Score = 42;
    else if (marginAboveBreakeven > 0) f2Score = 20;
    else f2Score = 5;

    // ── Factor 3: Sector Comparison ──────────────────────────────────────
    let f3Score = f1Score;
    let hasSector = false;
    if (sectorCoverage !== null && !isNaN(sectorCoverage) && sectorCoverage > 0) {
        hasSector = true;
        const ratio = currentCoverage / sectorCoverage;
        if (ratio > 2.0)      f3Score = 95;
        else if (ratio > 1.3) f3Score = 80;
        else if (ratio > 0.8) f3Score = 55;
        else if (ratio > 0.5) f3Score = 30;
        else                  f3Score = 10;
    }

    const blended = hasSector
        ? (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20)
        : (f1Score * 0.60) + (f2Score * 0.40);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    const bias = applyBiasMap(finalScore, T.biasMap);
    const confidence = hasSector ? 90 : (currentCoverage > 10 || currentCoverage < 1.5 ? 82 : 74);

    return { score: finalScore, bias, confidence, safetyZone };
}

export function scoreMACDHistogram(macdValue) {
    if (macdValue === null || isNaN(macdValue)) {
        return { score: null, bias: 'Neutral', confidence: 0, momentumDir: 'Unknown', signalZone: 'No Data' };
    }

    const absValue = Math.abs(macdValue);
    const isPositive = macdValue >= 0;

    // ── Factor 1: Magnitude + Direction Score (0–100) ─────────────────────
    // Use absolute magnitude to determine strength, direction to set polarity
    let f1Score;
    if (isPositive) {
        if (absValue > 200)       f1Score = 95; // Extreme bullish momentum
        else if (absValue > 100)  f1Score = 85; // Strong bullish momentum
        else if (absValue > 50)   f1Score = 72; // Healthy positive momentum
        else if (absValue > 15)   f1Score = 60; // Mild positive
        else                      f1Score = 53; // Near zero (just barely positive)
    } else {
        if (absValue > 200)       f1Score = 5;  // Extreme bearish momentum
        else if (absValue > 100)  f1Score = 15; // Strong bearish momentum
        else if (absValue > 50)   f1Score = 28; // Healthy negative momentum
        else if (absValue > 15)   f1Score = 40; // Mild negative
        else                      f1Score = 47; // Near zero (just barely negative)
    }

    // ── Factor 2: Zero-Line Crossover Zone ───────────────────────────────
    // Near zero = most critical zone (potential trend change)
    let f2Score;
    let signalZone;
    if (macdValue > 100) {
        f2Score = 82; signalZone = 'Above Zero — Strong Bullish';
    } else if (macdValue > 15) {
        f2Score = 68; signalZone = 'Above Zero — Bullish';
    } else if (macdValue >= 0 && macdValue <= 15) {
        f2Score = 55; signalZone = 'Zero Line — Watch for Crossover';
    } else if (macdValue >= -15) {
        f2Score = 45; signalZone = 'Zero Line — Watch for Crossover';
    } else if (macdValue > -100) {
        f2Score = 32; signalZone = 'Below Zero — Bearish';
    } else {
        f2Score = 15; signalZone = 'Below Zero — Strong Bearish';
    }

    // ── Factor 3: Expansion/Contraction context ───────────────────────────
    // Higher absolute values = momentum is expanding = stronger conviction
    let f3Score;
    if (absValue > 150) {
        f3Score = isPositive ? 90 : 10; // Strong expansion in either direction
    } else if (absValue > 75) {
        f3Score = isPositive ? 75 : 25;
    } else if (absValue > 25) {
        f3Score = isPositive ? 62 : 38;
    } else {
        f3Score = 50; // Near zero = no momentum conviction
    }

    // ── Blend ─────────────────────────────────────────────────────────────
    const blended = (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    const bias = applyBiasMap(finalScore, FUNDAMENTAL_THRESHOLDS.advance_decline.biasMap);

    let momentumDir;
    if (macdValue > 100)       momentumDir = 'Strong Upward Momentum';
    else if (macdValue > 15)   momentumDir = 'Positive Momentum';
    else if (macdValue > -15)  momentumDir = 'Momentum Transition';
    else if (macdValue > -100) momentumDir = 'Negative Momentum';
    else                       momentumDir = 'Strong Downward Momentum';

    let confidence;
    if (absValue > 150) confidence = 88;
    else if (absValue > 60) confidence = 76;
    else if (absValue > 15) confidence = 64;
    else confidence = 52;

    return { score: finalScore, bias, confidence, momentumDir, signalZone };
}

export function scoreDMA200(dmaDistance) {
    if (dmaDistance === null || isNaN(dmaDistance)) {
        return { score: null, bias: 'Neutral', confidence: 0, dmaPosition: 'Unknown', distanceCategory: 'No Data' };
    }

    // ── Factor 1: Position & Trend Regime (0–100) ─────────────────────────
    let f1Score;
    let dmaPosition;
    if (dmaDistance > 20) {
        f1Score = 30; dmaPosition = 'Severely Extended Above';
    } else if (dmaDistance > 12) {
        f1Score = 60; dmaPosition = 'Extended Above';
    } else if (dmaDistance > 5) {
        f1Score = 88; dmaPosition = 'Comfortably Above — Bull Trend';
    } else if (dmaDistance > 0) {
        f1Score = 72; dmaPosition = 'Slightly Above';
    } else if (dmaDistance > -3) {
        f1Score = 55; dmaPosition = 'Testing 200 DMA Support';
    } else if (dmaDistance > -8) {
        f1Score = 35; dmaPosition = 'Below 200 DMA — Bearish';
    } else if (dmaDistance > -15) {
        f1Score = 20; dmaPosition = 'Well Below 200 DMA — Bear Market';
    } else {
        f1Score = 40; dmaPosition = 'Deep Below — Capitulation Zone';  // Oversold bounce potential
    }

    // ── Factor 2: Mean Reversion Penalty for Extreme Extensions ──────────
    // The further above 200 DMA, the higher the mean reversion risk
    let f2Score;
    let distanceCategory;
    if (dmaDistance > 25) {
        f2Score = 10; distanceCategory = 'Historically Extreme Extension';
    } else if (dmaDistance > 15) {
        f2Score = 35; distanceCategory = 'Overextended';
    } else if (dmaDistance > 5) {
        f2Score = 82; distanceCategory = 'Healthy Bull Extension';
    } else if (dmaDistance > -5) {
        f2Score = 62; distanceCategory = 'Critical Support Zone';
    } else if (dmaDistance > -15) {
        f2Score = 25; distanceCategory = 'Bear Market Territory';
    } else {
        f2Score = 48; distanceCategory = 'Extreme Oversold — Bounce Risk';
    }

    // ── Factor 3: Historical India Index Context ─────────────────────────
    // Based on Nifty 50 historical mean reversion patterns (2010–2024)
    let f3Score;
    if (dmaDistance > 20) f3Score = 15;   // Historically precedes 8–15% corrections
    else if (dmaDistance > 10) f3Score = 72; // Strong bull territory for Nifty
    else if (dmaDistance > 0) f3Score = 65;  // Normal bull positioning
    else if (dmaDistance > -5) f3Score = 52; // Transition zone
    else if (dmaDistance > -12) f3Score = 25; // Bear market historically
    else f3Score = 45;                        // Extreme — bounce likely

    // ── Blend ─────────────────────────────────────────────────────────────
    const blended = (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    const bias = applyBiasMap(finalScore, FUNDAMENTAL_THRESHOLDS.advance_decline.biasMap);

    let confidence;
    if (dmaDistance > 20 || dmaDistance < -15) confidence = 90;
    else if (dmaDistance > 10 || dmaDistance < -8) confidence = 82;
    else if (Math.abs(dmaDistance) < 3) confidence = 78;
    else confidence = 70;

    return { score: finalScore, bias, confidence, dmaPosition, distanceCategory };
}

export function scoreNetMargin(currentMargin, sectorMargin) {
    if (currentMargin === null || isNaN(currentMargin)) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    const T = FUNDAMENTAL_THRESHOLDS.net_margin;

    // Factor 1: Absolute margin level
    const band1 = T.absoluteBands.find(b => b.else || (b.above !== undefined && currentMargin > b.above));
    const f1Score = band1?.score ?? 5;
    const trendDesc = band1?.label ?? 'Unknown';

    // Factor 2: Sector comparison
    let hasSector = false;
    let f2Score = f1Score;
    if (sectorMargin !== null && !isNaN(sectorMargin)) {
        hasSector = true;
        const spread = currentMargin - sectorMargin;
        if (spread > 8)       f2Score = 95;
        else if (spread > 3)  f2Score = 80;
        else if (spread > -2) f2Score = 60;
        else if (spread > -7) f2Score = 35;
        else                  f2Score = 10;
    }

    const fw = T.factorWeights;
    const blended = hasSector
        ? (f1Score * fw.withSector.f1) + (f2Score * fw.withSector.f2)
        : f1Score;
    const score = Math.round(Math.max(0, Math.min(100, blended)));

    const bias = applyBiasMap(score, T.biasMap);
    const confidence = hasSector
        ? `${T.confidence.withSector}%`
        : (currentMargin > 20 || currentMargin < 0 ? `${T.confidence.absoluteOnly}%` : '72%');

    return { score, bias, confidence, trendDesc };
}

export function scoreOperatingMargin(currentMargin, sectorMargin) {
    if (currentMargin === null || isNaN(currentMargin)) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    const T = FUNDAMENTAL_THRESHOLDS.operating_margin;

    // Factor 1: Absolute operating margin level
    const band1 = T.absoluteBands.find(b => b.else || (b.above !== undefined && currentMargin > b.above));
    const f1Score = band1?.score ?? 5;
    const trendDesc = band1?.label ?? 'Unknown';

    // Factor 2: Sector comparison
    let hasSector = false;
    let f2Score = f1Score;
    if (sectorMargin !== null && !isNaN(sectorMargin)) {
        hasSector = true;
        const spread = currentMargin - sectorMargin;
        if (spread > 8)       f2Score = 95;
        else if (spread > 3)  f2Score = 80;
        else if (spread > -2) f2Score = 60;
        else if (spread > -7) f2Score = 35;
        else                  f2Score = 10;
    }

    const fw = T.factorWeights;
    const blended = hasSector
        ? (f1Score * fw.withSector.f1) + (f2Score * fw.withSector.f2)
        : f1Score;
    const score = Math.round(Math.max(0, Math.min(100, blended)));

    const bias = applyBiasMap(score, T.biasMap);
    const confidence = hasSector
        ? `${T.confidence.withSector}%`
        : (currentMargin > 25 || currentMargin < 0 ? `${T.confidence.absoluteOnly}%` : '72%');

    return { score, bias, confidence, trendDesc };
}

export function scorePBRatio(currentPB, historicalPB, sectorPB) {
    if (!currentPB) {
        return { score: null, bias: "Unknown", confidence: "0%" };
    }

    const T = FUNDAMENTAL_THRESHOLDS.pb_ratio;
    let score = 50;
    let conditionsMet = 0;

    if (historicalPB) {
        conditionsMet++;
        if (currentPB <= historicalPB * 0.7) score += 30;
        else if (currentPB < historicalPB * 0.95) score += 15;
        else if (currentPB >= historicalPB * 1.3) score -= 30;
        else if (currentPB > historicalPB * 1.05) score -= 15;
    }

    if (sectorPB) {
        conditionsMet++;
        if (currentPB <= sectorPB * 0.8) score += 15;
        else if (currentPB < sectorPB * 0.95) score += 5;
        else if (currentPB >= sectorPB * 1.2) score -= 15;
        else if (currentPB > sectorPB * 1.05) score -= 5;
    }

    score = Math.max(0, Math.min(100, score));
    const bias = applyBiasMap(score, T.biasMap);

    let confidence;
    if (conditionsMet === 2) confidence = "90%";
    else if (conditionsMet === 1) confidence = "70%";
    else confidence = "40%";

    return { score, bias, confidence };
}

export function scorePERatio(currentPE, historicalAvg, sectorPE) {
    if (currentPE === null || currentPE === undefined || isNaN(currentPE)) {
        return { score: null, bias: 'Neutral', confidence: 60 };
    }

    const T = FUNDAMENTAL_THRESHOLDS.pe_ratio;

    // ── Factor 1: vs Historical Average (0–100) ────────────────────────────
    let f1Score = 50;
    if (historicalAvg && !isNaN(historicalAvg) && historicalAvg > 0) {
        const deviation = (currentPE - historicalAvg) / historicalAvg;
        f1Score = Math.max(0, Math.min(100, 50 - (deviation * T.deviationMultiplier)));
    } else {
        f1Score = resolveBand(currentPE, T.absoluteBands);
    }

    // ── Factor 2: vs Sector PE (0–100) ────────────────────────────────────
    let f2Score = 50;
    let hasSector = false;
    if (sectorPE && !isNaN(sectorPE) && sectorPE > 0) {
        hasSector = true;
        const ratio = currentPE / sectorPE;
        f2Score = resolveBand(ratio, T.sectorRatioBands);
    }

    // ── Factor 3: Absolute PE Safety Bands (0–100) ────────────────────────
    const f3Score = resolveBand(currentPE, T.safetyBands);

    // ── Blend Factors ──────────────────────────────────────────────────────
    const fw = hasSector ? T.factorWeights.withSector : T.factorWeights.withoutSector;
    const blendedScore = hasSector
        ? (f1Score * fw.f1) + (f2Score * fw.f2) + (f3Score * fw.f3)
        : (f1Score * fw.f1) + (f3Score * fw.f3);

    const finalScore = Math.round(Math.max(0, Math.min(100, blendedScore)));

    // ── Bias Mapping ───────────────────────────────────────────────────────
    const bias = applyBiasMap(finalScore, T.biasMap);

    // ── Confidence ─────────────────────────────────────────────────────────
    const confidence = hasSector
        ? T.confidence.withSector
        : (historicalAvg ? T.confidence.withHistorical : T.confidence.absoluteOnly);

    return { score: finalScore, bias, confidence };
}

export function scoreProfitGrowth(profitHistory, manualCAGR) {
    if ((!profitHistory || profitHistory.length < 2) && (manualCAGR === null || isNaN(manualCAGR))) {
        return { score: null, bias: 'Neutral', confidence: '0%', calculatedCAGR: null, latestProfit: null, previousProfit: null };
    }

    const T = FUNDAMENTAL_THRESHOLDS.profit_growth;

    let score = 50;
    let confidencePoints = 0;
    let calculatedCAGR = null;
    let latestProfit = null;
    let previousProfit = null;
    let trendDesc = 'Mixed';

    if (profitHistory && profitHistory.length >= 2) {
        const chronological = [...profitHistory].reverse();
        const totalPeriods  = chronological.length - 1;

        latestProfit   = chronological[totalPeriods].value;
        previousProfit = chronological[totalPeriods - 1].value;
        const firstProfit = chronological[0].value;

        if (firstProfit > 0 && latestProfit > 0) {
            calculatedCAGR = (Math.pow(latestProfit / firstProfit, 1 / totalPeriods) - 1) * 100;
        }

        const recentGrowth = previousProfit > 0 ? ((latestProfit - previousProfit) / previousProfit) * 100 : 0;
        confidencePoints = Math.min(95, 40 + (totalPeriods * 15));

        if (calculatedCAGR > 25) {
            score = 95; trendDesc = 'Explosive Growth';
        } else if (calculatedCAGR > 12) {
            if (recentGrowth > calculatedCAGR) { score = 85; trendDesc = 'Accelerating Growth'; }
            else                               { score = 75; trendDesc = 'Healthy Growth'; }
        } else if (calculatedCAGR > 0) {
            if (recentGrowth < 0) { score = 40; trendDesc = 'Stalling'; }
            else                  { score = 60; trendDesc = 'Moderate Growth'; }
        } else {
            score = 15; trendDesc = 'Contraction';
        }
    } else {
        calculatedCAGR = manualCAGR;
        confidencePoints = 60;
        if (manualCAGR > 25)      { score = 95; trendDesc = 'Explosive Growth'; }
        else if (manualCAGR > 12) { score = 75; trendDesc = 'Healthy Growth'; }
        else if (manualCAGR > 0)  { score = 60; trendDesc = 'Moderate Growth'; }
        else if (manualCAGR > -5) { score = 40; trendDesc = 'Stalling'; }
        else                      { score = 15; trendDesc = 'Contraction'; }
    }

    return { score, bias: applyBiasMap(score, T.biasMap), confidence: `${confidencePoints}%`, calculatedCAGR, latestProfit, previousProfit, trendDesc };
}

export function scoreRevenueGrowth(revenueHistory, manualCAGR) {
    if ((!revenueHistory || revenueHistory.length < 2) && (manualCAGR === null || isNaN(manualCAGR))) {
        return { score: null, bias: 'Neutral', confidence: '0%', calculatedCAGR: null, latestRevenue: null, previousRevenue: null };
    }

    const T = FUNDAMENTAL_THRESHOLDS.revenue_growth;

    let score = 50;
    let confidencePoints = 0;
    let calculatedCAGR = null;
    let latestRevenue = null;
    let previousRevenue = null;
    let trendDesc = 'Mixed';

    if (revenueHistory && revenueHistory.length >= 2) {
        const chronological = [...revenueHistory].reverse();
        const totalPeriods  = chronological.length - 1;

        latestRevenue   = chronological[totalPeriods].value;
        previousRevenue = chronological[totalPeriods - 1].value;
        const firstRevenue = chronological[0].value;

        if (firstRevenue > 0 && latestRevenue > 0) {
            calculatedCAGR = (Math.pow(latestRevenue / firstRevenue, 1 / totalPeriods) - 1) * 100;
        }

        const recentGrowth = previousRevenue > 0 ? ((latestRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        confidencePoints = Math.min(95, 40 + (totalPeriods * 15));

        if (calculatedCAGR > 20) {
            score = 90; trendDesc = 'Hyper Growth';
        } else if (calculatedCAGR > 10) {
            if (recentGrowth > calculatedCAGR) { score = 85; trendDesc = 'Accelerating Growth'; }
            else                               { score = 75; trendDesc = 'Healthy Growth'; }
        } else if (calculatedCAGR > 0) {
            if (recentGrowth < 0) { score = 40; trendDesc = 'Stalling'; }
            else                  { score = 60; trendDesc = 'Moderate Growth'; }
        } else {
            score = 15; trendDesc = 'Contraction';
        }
    } else {
        calculatedCAGR = manualCAGR;
        confidencePoints = 60;
        if (manualCAGR > 20)       { score = 90; trendDesc = 'Hyper Growth'; }
        else if (manualCAGR > 10)  { score = 75; trendDesc = 'Healthy Growth'; }
        else if (manualCAGR > 0)   { score = 60; trendDesc = 'Moderate Growth'; }
        else if (manualCAGR > -5)  { score = 40; trendDesc = 'Stalling'; }
        else                       { score = 15; trendDesc = 'Contraction'; }
    }

    return { score, bias: applyBiasMap(score, T.biasMap), confidence: `${confidencePoints}%`, calculatedCAGR, latestRevenue, previousRevenue, trendDesc };
}

export function scoreROCE(currentROCE, sectorROCE) {
    if (currentROCE === null || isNaN(currentROCE)) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    const T = FUNDAMENTAL_THRESHOLDS.roce;
    let score, trendDesc;

    if (sectorROCE !== null && !isNaN(sectorROCE)) {
        const spread = currentROCE - sectorROCE;
        const match = T.comparativeBands.find(b => b.else ||
            (b.above !== undefined && currentROCE > b.above && (b.spreadAbove === undefined || spread > b.spreadAbove)));
        score      = match?.score      ?? 10;
        trendDesc  = match?.label      ?? 'Capital Destroyer';
    } else {
        const match = T.absoluteBands.find(b => b.else || (b.above !== undefined && currentROCE > b.above));
        score      = match?.score      ?? 10;
        trendDesc  = match?.label      ?? 'Capital Destroyer';
    }

    const hasSector = sectorROCE !== null && !isNaN(sectorROCE);
    const confidence = hasSector ? T.confidence.withSector : (currentROCE > 25 || currentROCE < 0 ? T.confidence.high : T.confidence.base);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence, trendDesc };
}

export function scoreROE(currentROE, sectorROE) {
    if (currentROE === null || isNaN(currentROE)) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    const T = FUNDAMENTAL_THRESHOLDS.roe;
    let score, trendDesc;

    if (sectorROE !== null && !isNaN(sectorROE)) {
        const spread = currentROE - sectorROE;
        const match = T.comparativeBands.find(b => b.else ||
            (b.above !== undefined && currentROE > b.above && (b.spreadAbove === undefined || spread > b.spreadAbove)));
        score     = match?.score ?? 10;
        trendDesc = match?.label ?? 'Value Destroyer';
    } else {
        const match = T.absoluteBands.find(b => b.else || (b.above !== undefined && currentROE > b.above));
        score     = match?.score ?? 10;
        trendDesc = match?.label ?? 'Value Destroyer';
    }

    const hasSector = sectorROE !== null && !isNaN(sectorROE);
    const confidence = hasSector ? 90 : (currentROE > 20 || currentROE < 0 ? 80 : 72);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence, trendDesc };
}

export function scoreVIX(vixValue) {
    if (vixValue === null || isNaN(vixValue)) {
        return { score: null, bias: 'Neutral', confidence: 0, vixRegime: 'Unknown', marketCondition: 'No Data' };
    }

    const T = FUNDAMENTAL_THRESHOLDS.vix;

    // ── Factor 1: VIX Regime Classification (0–100) ───────────────────────
    let f1Score;
    let vixRegime;
    if (vixValue > 35) {
        f1Score = 5; vixRegime = 'Crisis Panic';
    } else if (vixValue > 25) {
        f1Score = 15; vixRegime = 'High Fear';
    } else if (vixValue > 20) {
        f1Score = 28; vixRegime = 'Elevated Risk';
    } else if (vixValue > 18) {
        f1Score = 40; vixRegime = 'Mild Concern';
    } else if (vixValue > 15) {
        f1Score = 58; vixRegime = 'Normal';
    } else if (vixValue > 13) {
        f1Score = 72; vixRegime = 'Calm';
    } else if (vixValue > 10) {
        f1Score = 85; vixRegime = 'Very Calm';
    } else {
        f1Score = 70; vixRegime = 'Extreme Complacency';
    }

    // ── Factor 2: Risk-Reward Context ────────────────────────────────────
    // Below 13 = great for longs; above 20 = elevated risk; above 25 = avoid
    let f2Score;
    let marketCondition;
    if (vixValue > 25) {
        f2Score = 10; marketCondition = 'Defensive — High Risk';
    } else if (vixValue > 18) {
        f2Score = 35; marketCondition = 'Cautious — Elevated Risk';
    } else if (vixValue > 13) {
        f2Score = 65; marketCondition = 'Constructive — Normal Risk';
    } else if (vixValue > 10) {
        f2Score = 88; marketCondition = 'Favorable — Low Risk';
    } else {
        f2Score = 60; marketCondition = 'Caution — Complacency Risk';
    }

    // ── Factor 3: Historical India VIX Percentile Bands ──────────────────
    // India VIX long-run average ~15–16; below 12 is <10th percentile
    let f3Score;
    if (vixValue > 30)       f3Score = 5;   // Top 5% historically — crisis
    else if (vixValue > 22)  f3Score = 20;  // Top 15% — stressed
    else if (vixValue > 17)  f3Score = 45;  // Normal upper range
    else if (vixValue > 13)  f3Score = 68;  // Average zone
    else if (vixValue > 10)  f3Score = 88;  // Historically very low
    else                     f3Score = 72;  // Extremely low — rare and risky

    // ── Blend ─────────────────────────────────────────────────────────────
    const fw = T.factorWeights;
    const blended = (f1Score * fw.f1) + (f2Score * fw.f2) + (f3Score * fw.f3);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    const bias = applyBiasMap(finalScore, T.biasMap);

    // ── Confidence: highest at extremes where VIX is most predictive ─────
    let confidence;
    if (vixValue > 28 || vixValue < 11) confidence = T.confidence.extreme;
    else if (vixValue > 22 || vixValue < 13) confidence = T.confidence.elevated;
    else confidence = T.confidence.neutral;

    return { score: finalScore, bias, confidence, vixRegime, marketCondition };
}



export function generateAiInsightAdvanceDeclineCard(adRatio, bias, breadthZone, signalType) {
    if (adRatio === null || isNaN(adRatio)) {
        return "Enter the current A/D Ratio (Advancing / Declining stocks) to analyze market breadth. A value above 1.0 means more stocks are advancing than declining.";
    }

    const rounded = adRatio.toFixed(2);

    if (adRatio > 2.5) {
        return `A/D Ratio is extremely elevated at ${rounded}. While this confirms overwhelming bullish breadth, such extremes historically precede short-term consolidation as the market absorbs gains. The rally appears broad but may be near exhaustion.`;
    }
    if (adRatio > 1.5) {
        return `Market breadth is powerfully positive at ${rounded}, confirming the current rally has strong underlying participation across the index. This is a high-quality signal — broad-based moves tend to be more sustainable than narrow, index-led ones.`;
    }
    if (adRatio > 1.2) {
        return `Breadth is moderately bullish at ${rounded}. More stocks are advancing than declining, which lends credibility to the uptrend. Watch for this ratio to hold above 1.0 on pullbacks for trend confirmation.`;
    }
    if (adRatio >= 0.8) {
        return `A/D Ratio of ${rounded} reflects balanced and inconclusive market breadth. Roughly equal advancing and declining stocks suggest the market is in a consolidation or decision zone — no clear directional edge from breadth alone.`;
    }
    if (adRatio >= 0.5) {
        return `Market breadth is weakening at ${rounded}. More stocks are declining than advancing, indicating the selling is broad-based rather than isolated. This undermines the case for a durable rally and increases downside risk.`;
    }
    return `A/D Ratio of ${rounded} signals extreme broad-based panic selling. While structurally bearish, historical data shows that extreme breadth readings below 0.5 often coincide with short-term capitulation bottoms — a potential contrarian reversal setup.`;
}

export function generateAiInsightDebtToEquityCard(currentDE, sectorDE, leverageZone) {
    if (currentDE === null || isNaN(currentDE)) {
        return 'Waiting for Debt-to-Equity data to generate insight.';
    }

    let base = `D/E ratio of ${currentDE.toFixed(2)}x places the company in the "${leverageZone}" zone.`;

    if (sectorDE !== null && !isNaN(sectorDE)) {
        const vsStr = currentDE < sectorDE
            ? `${((1 - currentDE / sectorDE) * 100).toFixed(1)}% below the sector average of ${sectorDE.toFixed(2)}x`
            : `${((currentDE / sectorDE - 1) * 100).toFixed(1)}% above the sector average of ${sectorDE.toFixed(2)}x`;
        base += ` This is ${vsStr}.`;
    }

    if (currentDE < 0.3) {
        return base + ' An extremely clean balance sheet with negligible debt. The company has the financial firepower to self-fund growth or absorb acquisitions without distress.';
    } else if (currentDE < 0.7) {
        return base + ' A conservative capital structure that balances growth investment with financial stability. Low risk of solvency issues even in economic downturns.';
    } else if (currentDE < 1.2) {
        return base + ' Leverage is moderate and within manageable bounds. Monitor interest coverage to ensure EBIT comfortably services debt obligations.';
    } else if (currentDE < 2.0) {
        return base + ' Elevated leverage is a concern. A significant economic slowdown or margin compression could create debt servicing difficulties. Scrutinize the debt maturity profile.';
    } else {
        return base + ' Dangerously high leverage exposes the company to severe financial stress. Any earnings deterioration risks covenant breaches and potential equity dilution.';
    }
}

export function generateAiInsightDividendYieldCard(currentYield, bondYield) {
    if (currentYield === null || isNaN(currentYield)) return "Awaiting manual entry of the Dividend Yield (%).";
    if (currentYield === 0) return "This stock does not currently pay a dividend, prioritizing internal reinvestment over shareholder distributions.";

    let text = `Offering a dividend yield of ${currentYield}%.`;

    if (bondYield !== null) {
        if (currentYield > bondYield) text += ` This impressively exceeds the 10Y risk-free rate of ${bondYield}%, providing excellent income.`;
        else text += ` This trails the 10Y risk-free rate of ${bondYield}%, meaning bonds offer higher pure income.`;
    }



    return text;
}

export function generateAiInsightEarningsTrendCard(epsHistory, cagr, trendLabel) {
    if (!epsHistory || epsHistory.length < 2) {
        if (cagr !== null && !isNaN(cagr)) {
            return `Manual override indicates a ${cagr}% trend, classified as ${trendLabel}.`;
        }
        return "Insufficient EPS history to determine a reliable earnings trend.";
    }
    
    let text = `Earnings history shows ${trendLabel} over the last ${epsHistory.length} periods`;
    if (cagr !== null) {
        text += `, delivering a Compound Annual Growth Rate (CAGR) of ${cagr.toFixed(2)}%.`;
    } else {
        text += `.`;
    }

    if (trendLabel === "Consistent Growth") text += " This unbroken upward trajectory is highly sought after by institutional investors and commands a valuation premium.";
    else if (trendLabel === "Consistent Decline") text += " A multi-year contraction in earnings is a severe red flag indicating structural headwinds or loss of competitive advantage.";
    else if (trendLabel === "Volatile / Flat") text += " Earnings lack clear directionality, typical of highly cyclical businesses or companies struggling to scale.";

    return text;
}

export function generateAiInsightEarningsYieldCard(currentYield, historicalYield, bondYield) {
    if (!currentYield) {
        return "Insufficient data to analyze Earnings Yield. Waiting for Upstox feed or manual override.";
    }

    if (historicalYield && bondYield) {
        const erp = (currentYield - bondYield).toFixed(2);
        if (currentYield > historicalYield && currentYield > bondYield + 3) {
            return `Exceptionally attractive valuation. The stock is generating a yield above its historical norm and offers a robust Equity Risk Premium of ${erp}% over the risk-free rate.`;
        } else if (currentYield < historicalYield && currentYield < bondYield) {
            return `Severe valuation warning. The earnings yield has compressed below historical norms and is actually lower than the 10Y risk-free bond yield (${bondYield}%). Investors are not being compensated for equity risk.`;
        } else if (currentYield > bondYield) {
            return `Valuation is reasonable, offering an Equity Risk Premium of ${erp}%. However, compare this against historical norms to confirm structural attractiveness.`;
        } else {
            return `The earnings yield is struggling to keep pace with the risk-free rate, compressing the Equity Risk Premium.`;
        }
    }

    if (historicalYield) {
        if (currentYield > historicalYield * 1.1) return `The current earnings yield is expanding beyond historical averages, signaling potential undervaluation assuming earnings quality is stable.`;
        if (currentYield < historicalYield * 0.9) return `Yield compression relative to history suggests the stock is becoming expensive unless future growth accelerates significantly.`;
        return `Earnings yield is tracking closely with its historical average.`;
    }

    if (bondYield) {
        const erp = (currentYield - bondYield).toFixed(2);
        if (currentYield < bondYield) return `Negative Equity Risk Premium (${erp}%). Risk-free bonds currently offer a better yield than this equity.`;
        if (currentYield > bondYield + 4) return `Strong Equity Risk Premium (${erp}%). The stock offers significant compensation for equity risk compared to government bonds.`;
        return `Moderate Equity Risk Premium (${erp}%).`;
    }

    return `Current Earnings Yield is ${currentYield}%. Add 10Y Bond Yield in manual overrides to unlock Equity Risk Premium (ERP) analysis.`;
}

export function generateAiInsightEPSGrowthCard(cagr, latestYoY, growthTier, momentumLabel, totalPeriods) {
    if (cagr === null || isNaN(cagr)) {
        return 'EPS Growth will be auto-computed from Upstox income statement history when available. Alternatively, enter the YoY or CAGR EPS growth manually.';
    }

    const cagrStr = cagr.toFixed(2);
    const source = totalPeriods >= 2 ? `over ${totalPeriods} periods of EPS history` : 'based on manual input';

    let base = `EPS has compounded at ${cagrStr}% annually ${source}, classified as "${growthTier}".`;

    if (latestYoY !== null && !isNaN(latestYoY)) {
        base += ` Latest YoY EPS growth: ${latestYoY.toFixed(2)}% (${momentumLabel}).`;
    }

    if (growthTier === 'Exceptional Compounder') {
        return base + ' Compounding EPS at >25% consistently is exceedingly rare and is the signature of a dominant franchise with strong pricing power and reinvestment capacity.';
    } else if (growthTier === 'Strong Growth' && momentumLabel.includes('Accelerating')) {
        return base + ' Accelerating earnings growth — the business is gaining operational leverage as revenue scales faster than costs, a highly coveted quality.';
    } else if (growthTier === 'Earnings Contraction') {
        return base + ' Declining EPS over multiple years signals a structural deterioration in profitability. The market typically de-rates such companies with a valuation multiple compression.';
    } else if (growthTier === 'Severe EPS Decline') {
        return base + ' Severe earnings contraction indicates significant distress. Either cost inflation is overwhelming revenues, or core demand is collapsing.';
    }
    return base + ' Monitoring the trend of EPS acceleration or deceleration matters as much as the absolute growth rate itself.';
}

export function generateAiInsightFIIDIIFlowCard(fiiFlow, diiFlow, netFlow) {
    if (fiiFlow === null || diiFlow === null) {
        return "Awaiting manual entry of FII and DII Flow (₹ Cr).";
    }

    if (fiiFlow > 0 && diiFlow > 0) {
        return `Exceptional institutional support. Both Foreign (FII) and Domestic (DII) investors are aggressively accumulating, injecting a net ₹${netFlow} Cr into the market.`;
    } else if (fiiFlow < 0 && diiFlow < 0) {
        return `Severe institutional distribution. Both FIIs and DIIs are offloading positions simultaneously, draining a net ₹${Math.abs(netFlow)} Cr from the market.`;
    } else if (fiiFlow < 0 && diiFlow > 0) {
        if (netFlow > 0) {
            return `Domestic resilience. DIIs (₹${diiFlow} Cr) are successfully absorbing the FII selling pressure (₹${fiiFlow} Cr), resulting in positive net liquidity of ₹${netFlow} Cr.`;
        } else {
            return `FII distribution is overpowering domestic support. Despite DII buying, massive FII selling (₹${fiiFlow} Cr) has dragged net liquidity into the red (₹${netFlow} Cr).`;
        }
    } else if (fiiFlow > 0 && diiFlow < 0) {
        if (netFlow > 0) {
            return `Foreign capital is driving the market higher (₹${fiiFlow} Cr), easily absorbing the profit-booking by Domestic institutions (₹${diiFlow} Cr).`;
        } else {
            return `Domestic institutions are booking heavy profits (₹${diiFlow} Cr), entirely neutralizing the foreign capital inflows and turning net liquidity negative.`;
        }
    }
    
    return "Institutional flows are perfectly balanced, resulting in flat net liquidity.";
}

export function generateAiInsightForwardPECard(currentFwdPE, currentPE, bias) {
    if (!currentFwdPE) return 'Waiting for Forward P/E data to generate an insight.';
    
    if (!currentPE) {
        return `The Forward P/E is ${currentFwdPE}x. Trailing P/E is needed for a comprehensive growth comparison.`;
    }

    const diffPercent = Math.abs((currentFwdPE - currentPE) / currentPE * 100).toFixed(1);

    if (currentFwdPE < currentPE) {
        return `Forward P/E is trading at a ${diffPercent}% discount to the trailing P/E of ${currentPE}x. This indicates the market expects strong earnings growth over the next 12 months, driving the valuation multiple lower.`;
    } else if (currentFwdPE > currentPE) {
        return `Forward P/E is trading at a ${diffPercent}% premium to the trailing P/E of ${currentPE}x. This suggests anticipated earnings contraction or that the market price has run ahead of expected fundamental growth.`;
    } else {
        return `Forward P/E aligns perfectly with the trailing P/E at ${currentPE}x, implying expectations for flat earnings growth over the next 12 months.`;
    }
}

export function generateAiInsightFreeCashFlowCard(currentFCF, fcfYield, fcfCategory) {
    if (currentFCF === null || isNaN(currentFCF)) {
        return 'Waiting for Free Cash Flow data. FCF = Operating Cash Flow − Capital Expenditure.';
    }

    const fcfStr = currentFCF >= 0 ? `+₹${Math.abs(currentFCF).toFixed(0)} Cr` : `-₹${Math.abs(currentFCF).toFixed(0)} Cr`;
    const yieldStr = fcfYield !== null ? ` (${fcfYield.toFixed(1)}% of revenue)` : '';

    if (currentFCF > 0 && fcfYield !== null && fcfYield > 10) {
        return `The company generates exceptional free cash flow of ${fcfStr}${yieldStr}. Converting >10% of revenue into cash signals a highly efficient, capital-light business model. This FCF funds dividends, buybacks, debt repayment, and organic growth without external financing.`;
    } else if (currentFCF > 0 && fcfYield !== null && fcfYield > 4) {
        return `Healthy free cash flow of ${fcfStr}${yieldStr}. The business converts a meaningful share of revenue into cash, demonstrating solid working capital management and disciplined capex allocation.`;
    } else if (currentFCF > 0) {
        return `Positive free cash flow of ${fcfStr}${yieldStr}. The company is cash generative — a fundamental prerequisite for financial independence. Monitor the FCF-to-revenue yield trend to assess sustainability.`;
    } else if (currentFCF === 0) {
        return `Free cash flow is exactly break-even (${fcfStr}). The company is investing all operational cash back into the business. Not inherently negative if capex drives future growth.`;
    } else if (fcfYield !== null && fcfYield > -10) {
        return `Moderate cash burn of ${fcfStr}${yieldStr}. Negative FCF is common during aggressive expansion phases or capex-heavy investment cycles. The sustainability depends on whether the investment yields future returns.`;
    }
    return `Heavy cash burn of ${fcfStr}${yieldStr}. The company is spending significantly more cash than it generates. Without strong external financing or a path to positive FCF, this is structurally unsustainable.`;
}

export function generateAiInsightGDPGrowthCard(currentGrowth, trendDesc) {
    if (currentGrowth === null || isNaN(currentGrowth)) {
        return "Waiting for manual GDP Growth input to generate insight.";
    }

    let text = `The broader economy is currently in a state of ${trendDesc}, expanding at a rate of ${currentGrowth}%.`;

    if (trendDesc === "Rapid Expansion") {
        text += " This highly stimulative environment acts as a massive tailwind for corporate earnings, heavily favoring pro-cyclical sectors like Industrials and Financials.";
    } else if (trendDesc === "Healthy Expansion") {
        text += " Steady economic expansion provides a supportive backdrop for overall market valuations without triggering immediate inflation fears.";
    } else if (trendDesc === "Economic Slowdown") {
        text += " A slowing GDP puts pressure on corporate margins and consumer spending. Defensive sectors usually outperform in this regime.";
    } else if (trendDesc === "Contraction (Recession)") {
        text += " An actively shrinking economy implies rising unemployment, collapsing demand, and severe earnings downgrades. High market risk.";
    }

    return text;
}

export function generateAiInsightIndexPCRCard(pcrValue, optionsBias, signalStrength) {
    if (pcrValue === null || isNaN(pcrValue)) {
        return "Enter the current Put-Call Ratio (Total Put OI / Total Call OI) to analyze options market sentiment. PCR is a powerful contrarian indicator — extreme readings often precede market reversals.";
    }

    const rounded = pcrValue.toFixed(2);

    if (pcrValue > 1.8) {
        return `PCR is at extreme levels (${rounded}), indicating massive put buying across the index. When the crowd is this bearish, the market is often over-positioned for a decline. Historically, NSE PCR above 1.8 has been one of the most reliable bottom indicators for Nifty/BankNifty.`;
    }
    if (pcrValue > 1.3) {
        return `PCR of ${rounded} shows put-dominated options positioning. Traders are heavily hedged and expecting downside — a contrarian bullish signal. When fear is extreme, corrections are often overdone and sharp reversals follow.`;
    }
    if (pcrValue > 0.8) {
        return `PCR of ${rounded} reflects balanced options positioning with no extreme directional bet. The market is in a neutral sentiment zone — price action and technical setups will dominate over sentiment signals at this level.`;
    }
    if (pcrValue > 0.6) {
        return `PCR of ${rounded} shows call-dominated positioning, suggesting market participants are complacent and expecting further upside. This level of one-sided bullishness is a mild contrarian warning — risk of short-term correction increases.`;
    }
    return `PCR of ${rounded} reflects extreme call buying and bullish complacency. Historically, NSE PCR below 0.6 has been associated with short-term market tops. The risk-reward for fresh longs is unfavorable at this sentiment extreme.`;
}

export function generateAiInsightInterestCoverageCard(currentCoverage, sectorCoverage, safetyZone) {
    if (currentCoverage === null || isNaN(currentCoverage)) {
        return 'Waiting for Interest Coverage data. This is EBIT divided by Finance Costs from the income statement.';
    }

    const rounded = currentCoverage.toFixed(2);
    let base = `Interest coverage of ${rounded}x (${safetyZone}).`;

    if (sectorCoverage !== null && !isNaN(sectorCoverage)) {
        base += ` Sector average: ${sectorCoverage.toFixed(2)}x.`;
    }

    if (currentCoverage > 10) {
        return base + ` The company earns ${rounded}x its annual interest obligations — an extremely strong safety cushion. Even a severe earnings collapse would not immediately threaten debt servicing.`;
    } else if (currentCoverage > 5) {
        return base + ` Healthy debt servicing capacity. The company comfortably covers interest from operating earnings with a ${rounded}x buffer, leaving substantial room for earnings volatility.`;
    } else if (currentCoverage >= 3) {
        return base + ` Adequate coverage, but the buffer is thinning. A 60%+ earnings decline would threaten interest payment ability. Monitor debt maturity profile and EBIT trends closely.`;
    } else if (currentCoverage >= 1.5) {
        return base + ` Dangerously thin coverage. Any meaningful revenue shortfall or margin compression could prevent full interest payment. This level warrants elevated risk scrutiny.`;
    } else if (currentCoverage >= 1.0) {
        return base + ` At the edge of insolvency risk. The company barely covers its interest obligations and has no operating earnings buffer for unexpected shocks.`;
    }
    return base + ` Critical — the company cannot cover its interest payments from operating earnings. This is a strong leading indicator of potential default or distress financing.`;
}

export function generateAiInsightMACDTrendCard(macdValue, momentumDir, signalZone) {
    if (macdValue === null || isNaN(macdValue)) {
        return "Enter the MACD Histogram value (MACD Line − Signal Line) for the index. Use daily MACD(12,26,9). Nifty histogram typically ranges ±50 to ±300; BankNifty ±100 to ±600.";
    }

    const rounded = macdValue.toFixed(1);
    const abs = Math.abs(macdValue);

    if (macdValue > 150) {
        return `MACD Histogram at +${rounded} reflects strong and accelerating bullish momentum for the index. The gap between the MACD and Signal line is expanding rapidly, confirming institutional momentum is firmly in the bulls' corner. Trend-following strategies are well-supported.`;
    }
    if (macdValue > 15) {
        return `MACD Histogram is positive at +${rounded}, indicating bulls are in control and momentum is building. The index is trending above its short-term momentum baseline. This supports continuation of the current uptrend with manageable risk.`;
    }
    if (macdValue >= 0 && macdValue <= 15) {
        return `MACD Histogram is near zero (+${rounded}), signaling a critical transition zone. Momentum is neither decisively bullish nor bearish. A breakout above zero with expansion would confirm a bullish momentum shift; a breakdown below with expansion confirms bearish momentum.`;
    }
    if (macdValue >= -15) {
        return `MACD Histogram is near zero (${rounded}), in a momentum transition zone. Downward pressure is mild but the direction is not yet established. Watch for a clear expansion in either direction — this is a high-alert zone for trend traders.`;
    }
    if (macdValue > -150) {
        return `MACD Histogram is negative at ${rounded}, showing bears have the momentum advantage. The index is trending below its short-term momentum baseline. Bounces should be treated as selling opportunities until the histogram crosses back above zero.`;
    }
    return `MACD Histogram at ${rounded} reflects extreme bearish momentum for the index. The MACD line is deeply below the signal line, confirming strong institutional selling pressure. Avoid aggressive longs — wait for histogram to stabilize and start contracting before considering reversals.`;
}

export function generateAiInsightMovingAverageCard(dmaDistance, dmaPosition, distanceCategory) {
    if (dmaDistance === null || isNaN(dmaDistance)) {
        return "Enter the % distance from the 200-day moving average. Calculate as: ((Current Price − 200 DMA) / 200 DMA) × 100. A positive value means the index is above its 200 DMA (bullish); negative means below (bearish).";
    }

    const rounded = Math.abs(dmaDistance).toFixed(2);
    const direction = dmaDistance >= 0 ? 'above' : 'below';

    if (dmaDistance > 20) {
        return `The index is ${rounded}% above its 200 DMA — historically an extreme extension. Nifty has rarely sustained distances above +20% without significant mean-reversion corrections of 8–15%. While the long-term trend remains bullish, fresh longs at this stretch carry elevated risk.`;
    }
    if (dmaDistance > 10) {
        return `The index is trading ${rounded}% above its 200 DMA, confirming a strong and intact bull market trend. This level of extension is healthy for a sustained uptrend. Dips toward the 200 DMA would present excellent long-term buying opportunities.`;
    }
    if (dmaDistance > 0) {
        return `The index is ${rounded}% above its 200 DMA, maintaining structural bull market positioning. The 200 DMA is trending upward, confirming the long-term uptrend. This zone is constructive for medium-term investing.`;
    }
    if (dmaDistance > -3) {
        return `The index is testing its 200 DMA (currently ${rounded}% below). This is the most critical technical level in any index — it separates the long-term bull and bear market regimes. A decisive break below on high volume is a major bearish signal; a reclaim with momentum is bullish.`;
    }
    if (dmaDistance > -12) {
        return `The index is ${rounded}% below its 200 DMA, placing it in structural bear market territory. The 200 DMA is likely acting as resistance on bounces. Avoid aggressive long positions — wait for a reclaim and hold of the 200 DMA before turning constructive.`;
    }
    return `The index is ${rounded}% below its 200 DMA — historically an extreme dislocation for Indian indices. While the structural trend is bearish, such extreme dislocations below the 200 DMA have historically coincided with capitulation lows and sharp snap-back rallies. A contrarian reversal watch is appropriate.`;
}

export function generateAiInsightNetMarginCard(currentMargin, trendDesc) {
    if (currentMargin === null || isNaN(currentMargin)) {
        return 'Waiting for Net Margin data to generate insight.';
    }

    let text = `The company converts ${currentMargin.toFixed(2)}% of its total revenue into pure bottom-line profit.`;

    if (trendDesc === "Exceptional Profitability") {
        text += " Margins above 20% are typically reserved for software, asset-light tech, or companies with highly dominant monopolies.";
    } else if (trendDesc === "High Margin") {
        text += " This demonstrates strong pricing power and excellent cost controls.";
    } else if (trendDesc === "Thin Margin") {
        text += " The business operates on razor-thin margins, making it highly sensitive to minor increases in operating costs or inflation.";
    } else if (trendDesc === "Loss Making") {
        text += " The business is structurally unprofitable at the bottom line, indicating cash burn.";
    }

    return text;
}

export function generateAiInsightOperatingMarginCard(currentMargin, trendDesc) {
    if (currentMargin === null || isNaN(currentMargin)) {
        return 'Waiting for Operating Margin data to generate insight.';
    }

    let text = `The core business operations yield a margin of ${currentMargin.toFixed(2)}%.`;

    if (trendDesc === "Exceptional Operations") {
        text += " This highly lucrative margin suggests a wide economic moat, dominant market share, and low core operating costs.";
    } else if (trendDesc === "High Operating Leverage") {
        text += " The company efficiently manages its cost of goods sold and operating expenses relative to revenue.";
    } else if (trendDesc === "Weak Operations") {
        text += " Core profitability is dangerously thin, leaving little room for error if inflation or competition increases.";
    } else if (trendDesc === "Operating Loss") {
        text += " The core business is structurally unprofitable before even accounting for debt and taxes. Extreme risk.";
    }

    return text;
}

export function generateAiInsightPBRatioCard(currentPB, historicalPB, sectorPB) {
    if (!currentPB) {
        return "Insufficient data to analyze Price-to-Book valuation. Waiting for Upstox feed or manual override.";
    }

    if (historicalPB && sectorPB) {
        if (currentPB < historicalPB && currentPB < sectorPB) {
            return `Trading at a dual discount to both its historical average (${historicalPB}) and the sector (${sectorPB}), presenting a compelling value proposition assuming asset quality remains intact.`;
        } else if (currentPB > historicalPB && currentPB > sectorPB) {
            return `Priced at a premium over both historical norms and sector peers. Investors are pricing in exceptional future ROE or significant intangible asset value not captured on the balance sheet.`;
        } else if (currentPB < historicalPB && currentPB > sectorPB) {
            return `Historically undervalued for this specific company, but still commands a premium over the broader sector average of ${sectorPB}.`;
        } else {
            return `Trading above historical norms but below the sector average. The market recognizes improving fundamentals but hasn't fully re-rated it to sector levels.`;
        }
    }

    if (historicalPB) {
        if (currentPB < historicalPB * 0.9) return `Trading at a significant discount to its historical book value multiple, suggesting potential undervaluation or structural asset impairment.`;
        if (currentPB > historicalPB * 1.1) return `Commanding a premium over its historical book value average, indicating market optimism regarding asset yield.`;
        return `Fairly valued relative to its own historical book value multiples.`;
    }

    if (sectorPB) {
        if (currentPB < sectorPB) return `Trading cheaper than the sector average on a price-to-book basis.`;
        if (currentPB > sectorPB) return `Commanding a premium over sector peers for its net assets.`;
    }

    return `Current P/B stands at ${currentPB}.`;
}

export function generateAiInsightPERatioCard(currentPE, historicalAvg, sectorPE, bias) {
    if (!currentPE) return 'Waiting for P/E data to generate an insight.';

    const vsHist = historicalAvg
        ? currentPE < historicalAvg
            ? `trading at a ${((1 - currentPE / historicalAvg) * 100).toFixed(1)}% discount to its historical average of ${historicalAvg}x`
            : `trading at a ${((currentPE / historicalAvg - 1) * 100).toFixed(1)}% premium to its historical average of ${historicalAvg}x`
        : null;

    const vsSector = sectorPE
        ? currentPE < sectorPE
            ? `cheaper than its sector peers at ${sectorPE}x`
            : `richer than sector peers at ${sectorPE}x`
        : null;

    const contextParts = [vsHist, vsSector].filter(Boolean).join(', and ');
    const context = contextParts ? ` The stock is currently ${contextParts}.` : '';

    if (bias === 'Strong Bullish' || bias === 'Bullish') {
        return `The current P/E of ${currentPE}x suggests the market is offering an attractive entry point from a valuation standpoint.${context} This may represent a favorable risk/reward for long-term investors.`;
    } else if (bias === 'Neutral') {
        return `At ${currentPE}x earnings, the stock appears fairly valued relative to growth expectations.${context} Monitor for earnings acceleration or deceleration before taking a directional view.`;
    } else if (bias === 'Bearish') {
        return `The P/E of ${currentPE}x suggests elevated expectations are already priced in.${context} Investors should exercise caution and await a more favorable entry.`;
    } else {
        return `At ${currentPE}x earnings, the stock is trading at a significant premium that may not be justified by fundamentals.${context} Downside risk is elevated if growth disappoints.`;
    }
}

export function generateAiInsightProfitGrowthCard(profitHistory, cagr, trendDesc) {
    if (!profitHistory || profitHistory.length < 2) {
        if (cagr !== null && !isNaN(cagr)) {
            return `Based on manual input, net profit is growing at a ${cagr}% CAGR, categorized as ${trendDesc}.`;
        }
        return "Waiting for Profit history to generate insight.";
    }

    let text = `The company's bottom-line has demonstrated ${trendDesc} with a ${cagr !== null ? cagr.toFixed(2) : '--'}% Compound Annual Growth Rate.`;

    if (trendDesc === "Accelerating Growth") {
        text += " Recent YoY profit growth is outpacing the historical CAGR, highlighting powerful operating leverage.";
    } else if (trendDesc === "Contraction") {
        text += " Net income is actively shrinking. Prolonged profit contraction destroys shareholder equity and dividend sustainability.";
    } else if (trendDesc === "Explosive Growth") {
        text += " Compounding net income at >25% annually indicates phenomenal execution and pricing power.";
    }

    return text;
}

export function generateAiInsightRevenueGrowthCard(revenueHistory, cagr, trendDesc) {
    if (!revenueHistory || revenueHistory.length < 2) {
        if (cagr !== null && !isNaN(cagr)) {
            return `Based on manual input, the revenue is growing at a ${cagr}% CAGR, categorized as ${trendDesc}.`;
        }
        return "Waiting for Revenue history to generate insight.";
    }

    let text = `The company has demonstrated ${trendDesc} with a ${cagr !== null ? cagr.toFixed(2) : '--'}% Compound Annual Growth Rate over the analyzed period.`;

    if (trendDesc === "Accelerating Growth") {
        text += " Recent YoY growth exceeds the multi-year average, indicating increasing market penetration or successful new product cycles.";
    } else if (trendDesc === "Contraction") {
        text += " The top-line is shrinking, which is a severe structural red flag. Without revenue growth, profitability can only be maintained through finite cost-cutting.";
    } else if (trendDesc === "Hyper Growth") {
        text += " Sustaining >20% top-line growth at scale is rare and typically commands a significant premium in the market.";
    }

    return text;
}

export function generateAiInsightROCECard(currentROCE, sectorROCE, trendDesc) {
    if (currentROCE === null || isNaN(currentROCE)) {
        return 'Waiting for ROCE data to generate insight.';
    }

    let text = `The company generates a Return on Capital Employed (ROCE) of ${currentROCE.toFixed(2)}%`;
    if (sectorROCE !== null && !isNaN(sectorROCE)) {
        text += ` compared to the sector average of ${sectorROCE.toFixed(2)}%.`;
    } else {
        text += `.`;
    }

    if (trendDesc === "Elite Capital Allocator") {
        text += " This indicates phenomenal capital allocation skills, compounding both equity and debt capital at exceptionally high rates.";
    } else if (trendDesc === "Outperforming Sector") {
        text += " Management is utilizing total capital more efficiently than industry peers.";
    } else if (trendDesc === "Capital Destroyer") {
        text += " The core business is failing to cover the blended cost of debt and equity capital, leading to structural value destruction.";
    }

    return text;
}

export function generateAiInsightROECard(currentROE, sectorROE, trendDesc) {
    if (currentROE === null || isNaN(currentROE)) {
        return 'Waiting for ROE data to generate insight.';
    }

    let text = `The company generates a Return on Equity (ROE) of ${currentROE.toFixed(2)}%`;
    if (sectorROE !== null && !isNaN(sectorROE)) {
        text += ` compared to the sector average of ${sectorROE.toFixed(2)}%.`;
    } else {
        text += `.`;
    }

    if (trendDesc === "Exceptional Compounder") {
        text += " This indicates a powerful economic moat, highly efficient capital allocation, and strong pricing power.";
    } else if (trendDesc === "Outperforming Sector") {
        text += " Management is effectively utilizing shareholder equity to generate above-average profits.";
    } else if (trendDesc === "Value Destroyer") {
        text += " Negative returns actively destroy shareholder equity. Requires immediate fundamental turnaround.";
    }

    return text;
}

export function generateAiInsightVolatilityCard(vixValue, vixRegime, marketCondition) {
    if (vixValue === null || isNaN(vixValue)) {
        return "Enter the current India VIX reading to analyze market fear and volatility expectations. India VIX measures the expected volatility over the next 30 days derived from Nifty options prices.";
    }

    const rounded = vixValue.toFixed(2);

    if (vixValue > 35) {
        return `India VIX is at crisis levels (${rounded}), indicating extreme fear and expectation of sharp market dislocations. Historically, readings above 35 coincide with capitulation bottoms — a high-risk but potentially high-reward contrarian entry zone for long-term investors.`;
    }
    if (vixValue > 25) {
        return `India VIX at ${rounded} signals significant market anxiety. Option premiums are expensive, suggesting large institutional players are aggressively hedging. Avoid leveraged positions — wait for VIX to start declining before adding risk.`;
    }
    if (vixValue > 18) {
        return `India VIX is elevated at ${rounded}, reflecting above-normal market uncertainty. The market is pricing in meaningful risk — directional bets carry higher volatility. Risk management is critical at this level.`;
    }
    if (vixValue > 13) {
        return `India VIX is in the normal range at ${rounded}, indicating a stable market environment with balanced risk. This is the historically optimal zone for systematic investing and trend-following strategies.`;
    }
    if (vixValue > 10) {
        return `India VIX is comfortably low at ${rounded}, reflecting strong market confidence and low hedging demand. This benign environment supports momentum strategies, though very low VIX can precede sudden volatility shocks.`;
    }
    return `India VIX is at extreme lows (${rounded}) — historically rare and a sign of market complacency. While current conditions are calm, such extreme suppression of volatility has historically been a leading indicator of sudden spikes. Maintain disciplined stops.`;
}
export function scoreEVEbitda(currentEV, sectorEV) {
    if (currentEV === null || isNaN(currentEV)) {
        return { score: null, bias: 'Neutral', confidence: 0, valuationZone: 'Unknown' };
    }

    const T = FUNDAMENTAL_THRESHOLDS.ev_ebitda;

    const band1 = T.absoluteBands.find(b => b.else || (b.below !== undefined && currentEV < b.below));
    const f1Score = band1?.score ?? 5;
    const valuationZone = band1?.zone ?? 'Highly Overvalued';

    let f2Score = f1Score;
    let hasSector = false;
    if (sectorEV !== null && !isNaN(sectorEV) && sectorEV > 0) {
        hasSector = true;
        const ratio = currentEV / sectorEV;
        f2Score = resolveBand(ratio, T.sectorRatioBands);
    }

    const fw = T.factorWeights;
    const blended = hasSector
        ? (f1Score * fw.withSector.f1) + (f2Score * fw.withSector.f2)
        : f1Score;
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    return { score: finalScore, bias: applyBiasMap(finalScore, T.biasMap), confidence: hasSector ? 90 : 70, valuationZone };
}

export function generateAiInsightEVEbitdaCard(currentEV, sectorEV, valuationZone) {
    if (currentEV === null || isNaN(currentEV)) return 'Waiting for EV/EBITDA data to generate insight.';
    let text = `The company trades at an EV/EBITDA multiple of ${currentEV.toFixed(2)}x`;
    if (sectorEV !== null && !isNaN(sectorEV)) {
        text += ` compared to the sector average of ${sectorEV.toFixed(2)}x.`;
    } else {
        text += `.`;
    }

    if (valuationZone === 'Deep Value' || valuationZone === 'Undervalued') {
        text += " This suggests the company is trading at a discount relative to its cash flow generation capacity, a potential value opportunity.";
    } else if (valuationZone === 'Overvalued' || valuationZone === 'Highly Overvalued') {
        text += " The market is pricing in significant future growth, making the current valuation expensive relative to current cash flows.";
    } else {
        text += " The valuation appears reasonable and in line with typical market multiples for its cash flow profile.";
    }
    return text;
}

export function scoreROA(currentROA, sectorROA) {
    if (currentROA === null || isNaN(currentROA)) {
        return { score: null, bias: 'Neutral', confidence: 0, efficiencyZone: 'Unknown' };
    }

    const T = FUNDAMENTAL_THRESHOLDS.roa;

    const band1 = T.absoluteBands.find(b => b.else || (b.above !== undefined && currentROA > b.above));
    const f1Score       = band1?.score ?? 15;
    const efficiencyZone = band1?.zone ?? 'Asset Destroyer';

    let f2Score = f1Score;
    let hasSector = false;
    if (sectorROA !== null && !isNaN(sectorROA) && sectorROA !== 0) {
        hasSector = true;
        const diff = currentROA - sectorROA;
        if (diff > 5) f2Score = 95;
        else if (diff > 2) f2Score = 80;
        else if (diff > -2) f2Score = 60;
        else if (diff > -5) f2Score = 40;
        else f2Score = 15;
    }

    const fw = T.factorWeights;
    const blended = hasSector
        ? (f1Score * fw.withSector.f1) + (f2Score * fw.withSector.f2)
        : f1Score;
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    return { score: finalScore, bias: applyBiasMap(finalScore, T.biasMap), confidence: hasSector ? 90 : 70, efficiencyZone };
}

export function generateAiInsightROACard(currentROA, sectorROA, efficiencyZone) {
    if (currentROA === null || isNaN(currentROA)) return 'Waiting for ROA data to generate insight.';
    let text = `The company generates a Return on Assets (ROA) of ${currentROA.toFixed(2)}%`;
    if (sectorROA !== null && !isNaN(sectorROA)) {
        text += ` compared to the sector average of ${sectorROA.toFixed(2)}%.`;
    } else {
        text += `.`;
    }

    if (efficiencyZone === 'Elite Efficiency' || efficiencyZone === 'High Efficiency') {
        text += " Management is highly effective at deploying the company's asset base to generate net income, indicating a strong operational moat.";
    } else if (efficiencyZone === 'Low Efficiency' || efficiencyZone === 'Asset Destroyer') {
        text += " The company is struggling to extract profitability from its assets, which is a structural concern for long-term compounding.";
    } else {
        text += " Asset utilization is stable and in line with typical baseline expectations.";
    }
    return text;
}

// --- Promoter Holding Score ---------------------------------------------------
export function scorePromoterHolding(currentPct, prevPct) {
    if (currentPct === null || isNaN(currentPct)) return { score: null, bias: 'Neutral', confidence: 0, holdingZone: 'Unknown', trend: 'No Data' };

    const T = FUNDAMENTAL_THRESHOLDS.promoter_holding;

    const band1 = T.absoluteBands.find(b => b.else || (b.above !== undefined && currentPct >= b.above));
    const f1Score    = band1?.score ?? 10;
    const holdingZone = band1?.zone ?? 'Minimal Insider Stake';

    let f2Score = f1Score, trend = 'Stable';
    if (prevPct !== null && !isNaN(prevPct)) {
        const delta = currentPct - prevPct;
        if (delta > 1.0)       { f2Score = Math.min(100, f1Score + T.trendAdjust.strongIncrease); trend = 'Increasing'; }
        else if (delta > 0.2)  { f2Score = Math.min(100, f1Score + T.trendAdjust.slightIncrease); trend = 'Slight Increase'; }
        else if (delta < -1.0) { f2Score = Math.max(0, f1Score + T.trendAdjust.strongDecrease); trend = 'Decreasing'; }
        else if (delta < -0.2) { f2Score = Math.max(0, f1Score + T.trendAdjust.slightDecrease); trend = 'Slight Dilution'; }
    }

    const fw = T.factorWeights;
    const finalScore = Math.round(Math.max(0, Math.min(100, (f1Score * fw.f1) + (f2Score * fw.f2))));
    return { score: finalScore, bias: applyBiasMap(finalScore, T.biasMap), confidence: prevPct !== null ? 88 : 72, holdingZone, trend };
}

export function generateAiInsightPromoterCard(currentPct, prevPct, holdingZone, trend) {
    if (currentPct === null || isNaN(currentPct)) return 'Awaiting shareholding data from Upstox.';
    let text = `Promoters hold ${currentPct.toFixed(2)}% of shares (${holdingZone}).`;
    if (prevPct !== null && !isNaN(prevPct)) {
        const delta = currentPct - prevPct;
        if (delta > 0) text += ` Stake increased by ${delta.toFixed(2)}% QoQ � a vote of confidence in the company's future.`;
        else if (delta < 0) text += ` Stake decreased by ${Math.abs(delta).toFixed(2)}% QoQ � monitor for continued dilution.`;
        else text += ' Promoter stake remained unchanged this quarter.';
    }
    if (currentPct >= 55) text += ' High promoter stake strongly aligns management with shareholder interests.';
    else if (currentPct < 30) text += ' Low promoter holding increases governance risk.';
    return text;
}

// --- Smart Money Flow Score ---------------------------------------------------
export function scoreSmartMoneyFlow(latestInstitutional, prevInstitutional) {
    if (latestInstitutional === null || isNaN(latestInstitutional)) return { score: null, bias: 'Neutral', confidence: 0, flowZone: 'Unknown', trend: 'No Data' };
    const T = FUNDAMENTAL_THRESHOLDS.smart_money_flow;
    const band = T.absoluteBands.find(b => b.else || (b.above !== undefined && latestInstitutional > b.above));
    const f1Score = band?.score ?? 25;
    const flowZone = band?.label ?? 'Retail-Dominated';
    let f2Score = f1Score, trend = 'Stable';
    if (prevInstitutional !== null && !isNaN(prevInstitutional)) {
        const delta = latestInstitutional - prevInstitutional;
        if (delta > 1.5) { f2Score = Math.min(100, f1Score + T.trendAdjust.strongAccum); trend = 'Accumulating'; }
        else if (delta > 0.5) { f2Score = Math.min(100, f1Score + T.trendAdjust.slightAccum); trend = 'Slight Accumulation'; }
        else if (delta < -1.5) { f2Score = Math.max(0, f1Score + T.trendAdjust.strongDistrib); trend = 'Distributing'; }
        else if (delta < -0.5) { f2Score = Math.max(0, f1Score + T.trendAdjust.slightDistrib); trend = 'Slight Distribution'; }
    }
    const fw = T.factorWeights;
    const finalScore = Math.round(Math.max(0, Math.min(100, (f1Score * fw.f1) + (f2Score * fw.f2))));
    const confidence = prevInstitutional !== null ? T.confidence.withTrend : T.confidence.withoutTrend;
    return { score: finalScore, bias: applyBiasMap(finalScore, T.biasMap), confidence, flowZone, trend };
}

export function generateAiInsightSmartMoneyCard(latestInstitutional, prevInstitutional, flowZone, trend) {
    if (latestInstitutional === null || isNaN(latestInstitutional)) return 'Awaiting shareholding data from Upstox.';
    let text = `Institutional investors (FII + DII + MF) hold ${latestInstitutional.toFixed(2)}% � classified as "${flowZone}".`;
    if (prevInstitutional !== null && !isNaN(prevInstitutional)) {
        const delta = latestInstitutional - prevInstitutional;
        if (delta > 0) text += ` Institutions are accumulating (+${delta.toFixed(2)}% QoQ), which typically precedes price appreciation.`;
        else if (delta < 0) text += ` Institutions are distributing (${delta.toFixed(2)}% QoQ). Net outflows from smart money are a cautionary signal.`;
        else text += ' Institutional holdings are stable this quarter.';
    }
    return text;
}

// --- Earnings Quality Score ---------------------------------------------------
export function scoreEarningsQuality(cfoToNetProfit) {
    if (cfoToNetProfit === null || isNaN(cfoToNetProfit)) return { score: null, bias: 'Neutral', confidence: 0, qualityLabel: 'Unknown' };
    const T = FUNDAMENTAL_THRESHOLDS.earnings_quality;
    const band = T.absoluteBands.find(b => b.else || (b.above !== undefined && cfoToNetProfit > b.above));
    const score = band?.score ?? 10;
    const qualityLabel = band?.label ?? 'Negative CFO — Paper Profits';
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always, qualityLabel };
}

export function generateAiInsightEarningsQualityCard(cfoToNetProfit, qualityLabel) {
    if (cfoToNetProfit === null || isNaN(cfoToNetProfit)) return 'Awaiting cash flow and income data from Upstox.';
    let text = `Earnings Quality Ratio (CFO / Net Profit) is ${cfoToNetProfit.toFixed(2)}x � "${qualityLabel}".`;
    if (cfoToNetProfit > 1.0) text += ` For every ?1 of reported net profit, the company generates ?${cfoToNetProfit.toFixed(2)} of actual operating cash. Profits are real and cash-backed.`;
    else if (cfoToNetProfit > 0) text += ` Only ?${cfoToNetProfit.toFixed(2)} of every ?1 profit is backed by real cash flows � possible aggressive revenue recognition or working capital buildup.`;
    else text += ' Operating cash flows are negative despite reported profits � a classic earnings quality warning sign.';
    return text;
}


// ==========================================
// INDEX FUNDAMENTALS SCORING ENGINE
// ==========================================

export function scoreNiftyPE(pe) {
    if (pe === undefined || pe === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(pe);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };

    const T = FUNDAMENTAL_THRESHOLDS.nifty_pe;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}

export function generateAiInsightNiftyPE(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Nifty PE ratio data is unavailable.";
    if (scoreObj.score >= 80) return `Nifty PE at ${val} is deep in the value zone, historically followed by strong forward returns.`;
    if (scoreObj.score <= 20) return `Nifty PE at ${val} is stretched. High vulnerability to earnings disappointment or rate shocks.`;
    return `Nifty PE at ${val} is near historical fair value. Market is pricing in steady growth.`;
}

export function scoreNiftyPB(pb) {
    if (pb === undefined || pb === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(pb);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };

    const T = FUNDAMENTAL_THRESHOLDS.nifty_pb;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}

export function generateAiInsightNiftyPB(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Nifty PB data unavailable.";
    if (scoreObj.score >= 75) return `Nifty PB at ${val}x suggests severe undervaluation of banking and heavy asset sectors.`;
    if (scoreObj.score <= 25) return `Nifty PB at ${val}x implies significant premium being paid for future ROE expansion.`;
    return `Nifty PB at ${val}x is perfectly aligned with historical long-term averages.`;
}

export function scoreMarketCapGDP(ratio) {
    if (ratio === undefined || ratio === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(ratio);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };

    const T = FUNDAMENTAL_THRESHOLDS.mcap_gdp;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}

export function generateAiInsightMarketCapGDP(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Market Cap/GDP data unavailable.";
    if (scoreObj.score >= 80) return `At ${val}%, the Buffett Indicator suggests India is structurally undervalued relative to its economic footprint.`;
    if (scoreObj.score <= 20) return `At ${val}%, total market cap far exceeds GDP. Market is pulling forward multiple years of growth.`;
    return `At ${val}%, Indian equities are fairly priced relative to the current size of the underlying economy.`;
}

export function scoreNiftyDividendYield(yieldVal) {
    if (yieldVal === undefined || yieldVal === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(yieldVal);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.nifty_dividend_yield;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}

export function generateAiInsightNiftyDividendYield(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Nifty Dividend Yield data unavailable.";
    if (scoreObj.score >= 80) return `Aggregate yield of ${val}% provides a massive floor to index drawdowns. Deep value territory.`;
    if (scoreObj.score <= 20) return `Aggregate yield of ${val}% is extremely low, typical of late-stage bull market euphoria.`;
    return `Yield of ${val}% represents a standard, healthy baseline for large-cap Indian equities.`;
}

export function scoreNiftyEPSGrowth(growth) {
    if (growth === undefined || growth === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(growth);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.nifty_eps_growth;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}

export function generateAiInsightNiftyEPSGrowth(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Nifty EPS Growth data unavailable.";
    if (scoreObj.score >= 80) return `Nifty EPS surging ${val}%. The fundamental earnings engine is fully intact to support current valuations.`;
    if (scoreObj.score <= 20) return `Sluggish EPS growth of ${val}% makes the index highly vulnerable to valuation contraction.`;
    return `EPS compounding at ${val}%, directly in line with long-term nominal GDP growth plus inflation.`;
}

export function scoreNiftyForwardEPS(growth) {
    if (growth === undefined || growth === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(growth);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.nifty_forward_eps;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightNiftyForwardEPS(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Forward EPS data unavailable.";
    if (scoreObj.score >= 80) return `Street expects powerful ${val}% forward growth, providing a massive tailwind for momentum.`;
    if (scoreObj.score <= 20) return `Forward estimates are collapsing to ${val}%. High risk of downward rerating across the board.`;
    return `Forward consensus at ${val}% indicates a stable, middle-of-the-road earnings cycle.`;
}

export function scoreEarningsRevision(netUpgrades) {
    if (netUpgrades === undefined || netUpgrades === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(netUpgrades);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.earnings_revision;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightEarningsRevision(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Earnings revision data unavailable.";
    if (scoreObj.score >= 75) return `Net ${val}% positive revisions. Analysts are scrambling to upgrade targets—classic bull market behavior.`;
    if (scoreObj.score <= 25) return `Net ${val}% downgrades. The street is aggressively cutting estimates, signaling a deteriorating macro environment.`;
    return `Revisions are balanced at ${val}%. The street is largely comfortable with current consensus.`;
}

export function scoreSectorEarnings(breadth) {
    if (breadth === undefined || breadth === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(breadth);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.sector_earnings_breadth;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightSectorEarnings(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Sector earnings breadth unavailable.";
    if (scoreObj.score >= 75) return `${val}% of sectors beating estimates indicates incredibly broad-based economic resilience.`;
    if (scoreObj.score <= 25) return `Only ${val}% of sectors beating. Growth is heavily isolated, making the broader index fragile.`;
    return `Sector breadth at ${val}% indicates a standard, mixed earnings season with clear winners and losers.`;
}

export function scoreAggregateProfitMargin(margin) {
    if (margin === undefined || margin === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(margin);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.aggregate_profit_margin;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightAggregateProfitMargin(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Margin data unavailable.";
    if (scoreObj.score >= 75) return `Record aggregate margins of ${val}%. Corporate India has immense pricing power and cost leverage right now.`;
    if (scoreObj.score <= 25) return `Margins squeezed to ${val}%. Input cost inflation and lack of pricing power are destroying profitability.`;
    return `Aggregate margins at ${val}% reflect a steady-state operating environment for Nifty constituents.`;
}

export function scoreCPIInflation(cpi) {
    if (cpi === undefined || cpi === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(cpi);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };

    const T = FUNDAMENTAL_THRESHOLDS.cpi;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightCPIInflation(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "CPI data unavailable.";
    if (scoreObj.score >= 75) return `Goldilocks CPI at ${val}%. Perfectly aligned with RBI targets, granting maximum policy flexibility.`;
    if (scoreObj.score <= 25) return `Hot CPI at ${val}% breaches RBI tolerance bands. Expect aggressive liquidity tightening and rate hikes.`;
    return `CPI at ${val}% is manageable, but RBI will likely maintain a neutral to slightly vigilant stance.`;
}

export function scoreRepoRate(repo) {
    if (repo === undefined || repo === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(repo);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };

    const T = FUNDAMENTAL_THRESHOLDS.repo;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightRepoRate(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Repo rate data unavailable.";
    if (scoreObj.score >= 80) return `Accommodative repo rate of ${val}% provides massive structural support for equity valuations.`;
    if (scoreObj.score <= 20) return `Restrictive ${val}% repo rate is severely choking corporate credit flow and suppressing P/E multiples.`;
    return `Neutral rate of ${val}% implies RBI is balancing growth objectives with inflation management.`;
}

export function scorePolicyStance(stance) {
    if (stance === undefined || stance === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.policy_stance;
    const s = String(stance).toLowerCase();
    const match = Object.entries(T.stanceMap).find(([key]) => s.includes(key));
    const score      = match ? match[1].score      : 50;
    const confidence = match ? match[1].confidence : T.confidence.unknown;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence };
}
export function generateAiInsightPolicyStance(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Policy stance unavailable.";
    if (scoreObj.score >= 80) return `Explicitly dovish/accommodative stance. The central bank put is firmly in play for equities.`;
    if (scoreObj.score <= 20) return `Hawkish withdrawal of accommodation. Systemic liquidity will drain, directly pressuring asset prices.`;
    return `Neutral stance. The central bank is data-dependent and on autopilot.`;
}

export function scoreFiscalDeficit(deficit) {
    if (deficit === undefined || deficit === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(deficit);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };

    const T = FUNDAMENTAL_THRESHOLDS.fiscal_deficit;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightFiscalDeficit(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Fiscal deficit data unavailable.";
    if (scoreObj.score >= 75) return `Excellent fiscal discipline at ${val}%. Prevents crowding out of private borrowing and supports bond yields.`;
    if (scoreObj.score <= 25) return `Bloated deficit of ${val}% threatens sovereign ratings and spikes borrowing costs across the curve.`;
    return `Deficit of ${val}% is manageable and strictly aligns with the government's stated consolidation glide path.`;
}

export function scoreCurrentAccount(cad) {
    if (cad === undefined || cad === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(cad);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.current_account;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightCurrentAccount(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "CAD data unavailable.";
    if (scoreObj.score >= 80) return `Current Account at ${val}% is a massive structural positive, providing an ironclad floor for the INR.`;
    if (scoreObj.score <= 20) return `Severe CAD of ${val}%. The INR is highly vulnerable to capital flight and imported inflation.`;
    return `CAD of ${val}% is easily financeable by standard FDI/FPI flows without stressing the currency.`;
}

export function scoreFiiFlowTrend(persistence) {
    if (persistence === undefined || persistence === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(persistence);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.fii_flow_trend;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightFiiFlowTrend(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "FII trend data unavailable.";
    if (scoreObj.score >= 75) return `Relentless institutional buying momentum (${val} days). This structural tailwind forces shorts to cover.`;
    if (scoreObj.score <= 25) return `Persistent FII dumping (${val} days). Domestic liquidity is being severely tested by foreign capitulation.`;
    return `Choppy, non-directional FII flows (${val} factor). Institutions lack conviction at current levels.`;
}

export function scoreSystemLiquidity(surplus) {
    if (surplus === undefined || surplus === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(surplus);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.system_liquidity;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightSystemLiquidity(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "System liquidity data unavailable.";
    if (scoreObj.score >= 75) return `Banking surplus of ₹${val}L Cr. Abundant liquidity historically bleeds into risk assets like equities.`;
    if (scoreObj.score <= 25) return `Severe deficit of ₹${val}L Cr. Banks are scrambling for funds, choking off market liquidity.`;
    return `System liquidity is perfectly balanced near ₹${val}L Cr, allowing orderly transmission of RBI policy.`;
}

export function scoreMFFlows(sip) {
    if (sip === undefined || sip === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(sip);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.mf_sip_flows;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightMFFlows(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "MF SIP data unavailable.";
    if (scoreObj.score >= 80) return `Retail SIP behemoth at ₹${val} Cr/month. Provides an indestructible bid beneath the market during FII selloffs.`;
    if (scoreObj.score <= 20) return `Retail flows collapsing to ₹${val} Cr. The strongest domestic pillar supporting the market is cracking.`;
    return `Consistent retail participation at ₹${val} Cr provides a stable, predictable floor for domestic equities.`;
}

export function scoreSectorValuationSpread(spread) {
    if (spread === undefined || spread === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(spread);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.sector_valuation_spread;
    const band = T.spreadBands.find(b => b.else || (b.below !== undefined && num < b.below));
    const score = band?.score ?? 20;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightSectorValuationSpread(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Spread data unavailable.";
    if (scoreObj.score >= 80) return `Low valuation spread (${val}). The rally is incredibly broad and structurally sound across all sectors.`;
    if (scoreObj.score <= 20) return `Extreme spread (${val}). A few sectors are in bubble territory while the rest of the market languishes.`;
    return `Valuation dispersion (${val}) is normal. Capital is rotating cleanly between growth and value sectors.`;
}

export function scoreSectorGrowthDifferential(diff) {
    if (diff === undefined || diff === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(diff);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.sector_growth_differential;
    const score = num > 0 ? 75 : 25;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightSectorGrowthDifferential(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `High-beta growth sectors are leading the market, confirming a strong risk-on environment.`;
    return `Defensive laggards are outperforming. This is a classic late-cycle or risk-aversion signal.`;
}

export function scoreSectorConcentration(top3Weight) {
    if (top3Weight === undefined || top3Weight === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(top3Weight);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.sector_concentration;
    const band = T.spreadBands.find(b => b.else || (b.below !== undefined && num < b.below));
    const score = band?.score ?? 15;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightSectorConcentration(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `Top 3 sectors only hold ${val}% weight. Excellent diversification mitigates systemic shock risks.`;
    return `Dangerous concentration: Top 3 sectors control ${val}% of the index. A shock to one sector drags down the entire market.`;
}

export function scoreCyclicalDefensive(ratio) {
    if (ratio === undefined || ratio === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(ratio);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.cyclical_defensive;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightCyclicalDefensive(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `Ratio of ${val}. Smart money is aggressively accumulating cyclical risk assets over safe-haven defensives.`;
    return `Ratio of ${val}. Capital is fleeing to defensive sectors (FMCG/Pharma), signaling impending macroeconomic fear.`;
}

export function scoreBankCreditGrowth(growth) {
    if (growth === undefined || growth === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(growth);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.bank_credit_growth;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightBankCreditGrowth(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score >= 80) return `Roaring ${val}% credit growth. Capex cycle is firing on all cylinders, driving multiplier effects.`;
    if (scoreObj.score <= 20) return `Anemic ${val}% credit growth. Banks are risk-averse and the corporate capex cycle is dead.`;
    return `Credit growing steadily at ${val}%, adequately supporting nominal GDP expansion without overheating.`;
}

export function scoreAggregateCorporateDebt(debtGdp) {
    if (debtGdp === undefined || debtGdp === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(debtGdp);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.aggregate_corporate_debt;
    const band = T.spreadBands.find(b => b.else || (b.below !== undefined && num < b.below));
    const score = band?.score ?? 15;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightAggregateCorporateDebt(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `Deleveraged balance sheets (${val}% of GDP) mean corporate India can easily absorb massive rate shocks.`;
    return `Dangerous leverage (${val}% of GDP). The aggregate corporate sector is highly vulnerable to refinancing risks.`;
}

export function scorePolicyTailwinds(score) {
    if (score === undefined || score === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(score);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.policy_tailwinds;
    const finalScore = Math.max(0, Math.min(100, num * 10));
    return { score: finalScore, bias: applyBiasMap(finalScore, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightPolicyTailwinds(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Data unavailable.";
    if (scoreObj.score >= 70) return `Massive sovereign policy support (PLI, capex) providing an artificial floor to specific sectors.`;
    return `Regulatory environment is currently passive with minimal structural tailwinds.`;
}

export function scoreCrudeOil(crude) {
    if (crude === undefined || crude === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(crude);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.crude_oil;
    const band = T.absoluteBands.find(b => b.else || (b.below !== undefined && num < b.below));
    const score = band?.score ?? 0;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightCrudeOil(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score >= 80) return `Brent at $${val}/bbl acts as a massive tax cut for India, significantly compressing the trade deficit.`;
    if (scoreObj.score <= 20) return `Brent at $${val}/bbl imports severe inflation, destroys corporate margins, and wrecks the INR.`;
    return `Brent at $${val}/bbl is within India's comfort zone and easily absorbed by the current macro framework.`;
}

export function scoreUSDINR(usdinr) {
    if (usdinr === undefined || usdinr === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(usdinr);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.usdinr;
    const band = T.absoluteBands.find(b => b.else || (b.below !== undefined && num < b.below));
    const score = band?.score ?? 15;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightUSDINR(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `Strong INR (${val}) prevents imported inflation and protects FII dollar-denominated returns.`;
    if (scoreObj.score < 50) return `Depreciating INR (${val}) triggers FII panic selling to protect dollar-adjusted portfolio returns.`;
    return `INR is highly stable at ${val}, artificially managed by RBI intervention to prevent volatility shocks.`;
}

export function scoreGlobalLiquidity(stance) {
    if (stance === undefined || stance === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.global_liquidity;
    const s = String(stance).toLowerCase();
    const match = Object.entries(T.stanceMap).find(([key]) => s.includes(key));
    const score      = match ? match[1].score      : 50;
    const confidence = match ? match[1].confidence : T.confidence.unknown;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence };
}
export function generateAiInsightGlobalLiquidity(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score >= 80) return `Global central banks are flooding the system with liquidity. Emerging markets like India will see massive inflows.`;
    if (scoreObj.score <= 20) return `Aggressive global QT is sucking dollar liquidity from emerging markets, forcing structural derating.`;
    return `Global liquidity conditions are neutral. Fed is on hold.`;
}

export function scoreSovereignRisk(cds) {
    if (cds === undefined || cds === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(cds);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.sovereign_risk;
    const band = T.absoluteBands.find(b => b.else || (b.below !== undefined && num < b.below));
    const score = band?.score ?? 10;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightSovereignRisk(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `CDS at ${val} bps indicates zero structural sovereign risk. Foreign capital views India as a safe haven.`;
    return `Spike in CDS (${val} bps) signals global institutional fear regarding India's macroeconomic stability.`;
}

export function scoreNPA(npa) {
    if (npa === undefined || npa === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(npa);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.npa;
    const band = T.absoluteBands.find(b => b.else || (b.below !== undefined && num < b.below));
    const score = band?.score ?? 10;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightNPA(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score >= 75) return `Decade-best asset quality (GNPA ${val}%). Banks have completely cleaned up balance sheets for the next cycle.`;
    if (scoreObj.score <= 25) return `Toxic asset quality (GNPA ${val}%). Banking system is paralyzed and cannot fund economic growth.`;
    return `Asset quality at ${val}% is manageable with adequate provisioning buffers in place.`;
}

export function scoreReformMomentum(momentum) {
    if (momentum === undefined || momentum === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(momentum);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.reform_momentum;
    const finalScore = Math.max(0, Math.min(100, num * 10));
    return { score: finalScore, bias: applyBiasMap(finalScore, T.biasMap), confidence: T.confidence.always };
}
export function generateAiInsightReformMomentum(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score >= 70) return `High structural reform momentum triggers long-term FII upgrades and raises potential GDP growth ceilings.`;
    return `Policy paralysis. Lack of structural reform indicates long-term growth ceilings may be permanently capped.`;
}

export function scoreFIIFlow(val) {
    if (val === undefined || val === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(val);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.fii_flow;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}

export function generateAiInsightFIIFlow(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "FII flow data is unavailable.";
    if (scoreObj.score >= 75) return `Strong FII buying of ₹${val} Cr indicates robust foreign confidence.`;
    if (scoreObj.score <= 25) return `Heavy FII selling of ₹${val} Cr presents a significant liquidity headwind.`;
    return `FII flows of ₹${val} Cr are relatively muted, showing no clear aggressive positioning.`;
}

export function scoreDIIFlow(val) {
    if (val === undefined || val === null) return { score: null, bias: 'Unknown', confidence: 0 };
    const num = Number(val);
    if (isNaN(num)) return { score: null, bias: 'Unknown', confidence: 0 };
    const T = FUNDAMENTAL_THRESHOLDS.dii_flow;
    const score = resolveBand(num, T.absoluteBands);
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always };
}

export function generateAiInsightDIIFlow(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "DII flow data is unavailable.";
    if (scoreObj.score >= 75) return `Strong DII buying of ₹${val} Cr provides excellent domestic support to the market.`;
    if (scoreObj.score <= 25) return `DII selling of ₹${val} Cr removes a key pillar of domestic market support.`;
    return `DII flows of ₹${val} Cr are relatively neutral, providing stable but unaggressive support.`;
}
export function generateAiInsightSectorDashboard(score, adv, val, growth, cyc) { return 'Sector breadth and concentration metrics indicate underlying health. Broad participation supports longer-term uptrends.'; }

export function scoreCurrentRatio(currentRatio) {
    if (currentRatio === null || isNaN(currentRatio)) {
        return { score: null, bias: 'Neutral', confidence: 0 };
    }
    const T = FUNDAMENTAL_THRESHOLDS.current_ratio;
    const band = T.absoluteBands.find(b => b.else || (b.above !== undefined && currentRatio > b.above));
    const score = band?.score ?? 10;
    const label = band?.label ?? 'Liquidity Risk';
    return { score, bias: applyBiasMap(score, T.biasMap), confidence: T.confidence.always, label };
}

export function generateAiInsightCurrentRatioCard(currentRatio, sectorRatio) {
    if (currentRatio === null || isNaN(currentRatio)) return 'No current ratio data available.';

    const hasSector = sectorRatio !== null && !isNaN(sectorRatio);
    const vsStr = hasSector
        ? ` vs sector average of ${sectorRatio.toFixed(2)}x`
        : '';

    if (currentRatio > 3.0) {
        return `Current ratio of ${currentRatio.toFixed(2)}x${vsStr} is very high. While short-term liquidity is strong, an excessively high ratio may indicate idle cash or inefficient working capital management.`;
    }
    if (currentRatio > 2.0) {
        return `Current ratio of ${currentRatio.toFixed(2)}x${vsStr} reflects excellent short-term liquidity. The company is well-positioned to cover all near-term obligations with significant buffer.`;
    }
    if (currentRatio > 1.5) {
        return `Current ratio of ${currentRatio.toFixed(2)}x${vsStr} indicates good liquidity. The company can comfortably meet short-term liabilities and has a healthy working capital cushion.`;
    }
    if (currentRatio > 1.2) {
        return `Current ratio of ${currentRatio.toFixed(2)}x${vsStr} is adequate. Liquidity is sufficient, though monitoring working capital trends is advisable if the ratio continues to compress.`;
    }
    if (currentRatio > 1.0) {
        return `Current ratio of ${currentRatio.toFixed(2)}x${vsStr} is tight but manageable. Current assets barely exceed current liabilities — any operational disruption could stress liquidity.`;
    }
    if (currentRatio > 0.8) {
        return `Current ratio of ${currentRatio.toFixed(2)}x${vsStr} signals liquidity stress. Current liabilities exceed current assets, indicating the company may need to refinance obligations or draw down credit lines.`;
    }
    return `Current ratio of ${currentRatio.toFixed(2)}x${vsStr} is critically low. The company faces severe short-term liquidity risk and may struggle to meet near-term financial obligations without external financing.`;
}

export function scoreAnalystConsensus(consensusObj) {
    if (!consensusObj || !consensusObj.consensus) {
        return { score: null, bias: 'Neutral', confidence: 0 };
    }
    const T = FUNDAMENTAL_THRESHOLDS.analyst_consensus;
    const rec = consensusObj.consensus.toLowerCase().replace('_', '');
    const score = T.ratingMap[rec] ??
        (rec.includes('strongbuy') ? 90 :
         rec.includes('buy')        ? 75 :
         rec.includes('hold')       ? 50 :
         rec.includes('underperform')? 28 : 15);
    const confidence = consensusObj.analysts ? Math.min(100, consensusObj.analysts * 5) : T.confidence.always;
    return { score, bias: applyBiasMap(score, T.biasMap), confidence };
}
