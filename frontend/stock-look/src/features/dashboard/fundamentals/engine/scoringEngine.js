export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

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

    // ── Bias Mapping ──────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Breadth Zone Label ────────────────────────────────────────────────
    let breadthZone;
    if (adRatio > 2.0)       breadthZone = 'Extreme Breadth';
    else if (adRatio > 1.2)  breadthZone = 'Strong Breadth';
    else if (adRatio >= 0.8) breadthZone = 'Neutral Zone';
    else if (adRatio >= 0.5) breadthZone = 'Weak Breadth';
    else                     breadthZone = 'Panic Zone';

    // ── Confidence: higher at extremes where the signal is clearest ───────
    let confidence;
    if (adRatio > 2.0 || adRatio < 0.5) confidence = 88; // Clear extreme signal
    else if (adRatio > 1.3 || adRatio < 0.7) confidence = 80;
    else confidence = 65; // Neutral zone — less predictive

    return { score: finalScore, bias, confidence, breadthZone, signalType };
}

export function scoreDebtToEquity(currentDE, sectorDE) {
    if (currentDE === null || isNaN(currentDE)) {
        return { score: 0, bias: 'Neutral', confidence: 0, leverageZone: 'Unknown' };
    }

    // ── Factor 1: Absolute D/E Thresholds (0–100) ─────────────────────────
    // Lower D/E = healthier financial structure = higher score
    let f1Score;
    let leverageZone;
    if (currentDE < 0.1) {
        f1Score = 98; leverageZone = 'Debt Free';
    } else if (currentDE < 0.3) {
        f1Score = 90; leverageZone = 'Very Low Leverage';
    } else if (currentDE < 0.6) {
        f1Score = 78; leverageZone = 'Conservative';
    } else if (currentDE < 1.0) {
        f1Score = 60; leverageZone = 'Moderate Leverage';
    } else if (currentDE < 1.5) {
        f1Score = 42; leverageZone = 'Elevated Leverage';
    } else if (currentDE < 2.5) {
        f1Score = 22; leverageZone = 'High Leverage';
    } else {
        f1Score = 5; leverageZone = 'Dangerously Leveraged';
    }

    // ── Factor 2: Relative vs Sector D/E ─────────────────────────────────
    let f2Score = f1Score; // default if no sector data
    let hasSector = false;
    if (sectorDE !== null && !isNaN(sectorDE) && sectorDE > 0) {
        hasSector = true;
        const ratio = currentDE / sectorDE;
        if (ratio < 0.5)        f2Score = 95; // Far below sector — very disciplined
        else if (ratio < 0.8)   f2Score = 80; // Below sector — responsible
        else if (ratio < 1.0)   f2Score = 65; // Slightly below
        else if (ratio < 1.2)   f2Score = 50; // Near sector average
        else if (ratio < 1.5)   f2Score = 32; // Above sector
        else                    f2Score = 12; // Far above sector — concerning
    }

    // ── Factor 3: Risk Regime Classification ─────────────────────────────
    let f3Score;
    if (currentDE < 0.3)      f3Score = 95; // Very safe
    else if (currentDE < 0.7) f3Score = 75; // Safe
    else if (currentDE < 1.2) f3Score = 50; // Watch zone
    else if (currentDE < 2.0) f3Score = 25; // Risk zone
    else                      f3Score = 5;  // Danger zone

    // ── Blend ─────────────────────────────────────────────────────────────
    const blended = hasSector
        ? (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20)
        : (f1Score * 0.65) + (f3Score * 0.35);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    // ── Bias ──────────────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Dynamic Confidence ────────────────────────────────────────────────
    const confidence = hasSector ? 90 : (currentDE < 0.5 || currentDE > 2.0 ? 82 : 72);

    return { score: finalScore, bias, confidence, leverageZone };
}

export function scoreDividendYield(currentYield, bondYield) {
    if (currentYield === null || isNaN(currentYield)) return { score: 0, bias: 'Neutral', confidence: '0%' };

    let score = 50;
    let confidencePoints = 40;

    // 1. Absolute Yield vs Risk-Free Rate (Bond Yield)
    if (bondYield !== null && !isNaN(bondYield)) {
        confidencePoints += 20;
        const spread = currentYield - bondYield;
        if (spread > 2.0) score += 20; // Yielding much more than bonds
        else if (spread > 0) score += 10; // Yielding more than bonds
        else if (currentYield === 0) score -= 10; // No yield
        else score -= 5;
    } else {
        // Fallback to absolute thresholds if bond yield is missing
        if (currentYield > 5.0) score += 20;
        else if (currentYield > 3.0) score += 10;
        else if (currentYield === 0) score -= 10;
    }



    score = Math.max(0, Math.min(100, score));

    let bias = "Neutral";
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 65) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 35) bias = "Bearish";

    return { score, bias, confidence: `${confidencePoints}%` };
}

export function scoreEarningsTrend(epsHistory, manualCAGR) {
    if ((!epsHistory || epsHistory.length < 2) && (manualCAGR === null || isNaN(manualCAGR))) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendLabel: '--', cagr: null };
    }

    let score = 50;
    let confidencePoints = 0;
    let trendLabel = "Unknown";
    let calculatedCAGR = null;

    if (epsHistory && epsHistory.length >= 2) {
        // epsHistory is usually sorted latest first (e.g. Mar 2026, Mar 2025, Mar 2024)
        // Let's reverse it to chronological order
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

        confidencePoints = Math.min(95, 40 + (totalPeriods * 15));

        if (positiveYears === totalPeriods) {
            score = 90; trendLabel = "Consistent Growth";
        } else if (positiveYears > negativeYears && last > chronological[totalPeriods-1].value) {
            score = 75; trendLabel = "Improving";
        } else if (positiveYears === negativeYears) {
            score = 50; trendLabel = "Volatile / Flat";
        } else if (negativeYears > positiveYears && last < chronological[totalPeriods-1].value) {
            score = 30; trendLabel = "Weakening";
        } else if (negativeYears === totalPeriods) {
            score = 10; trendLabel = "Consistent Decline";
        } else {
            score = 50; trendLabel = "Mixed";
        }
    } else {
        // Manual CAGR fallback
        calculatedCAGR = manualCAGR;
        confidencePoints = 60;
        
        if (manualCAGR > 15) { score = 90; trendLabel = "Consistent Growth"; }
        else if (manualCAGR > 5) { score = 75; trendLabel = "Improving"; }
        else if (manualCAGR > -5) { score = 50; trendLabel = "Stable / Flat"; }
        else if (manualCAGR > -15) { score = 30; trendLabel = "Weakening"; }
        else { score = 10; trendLabel = "Consistent Decline"; }
    }

    let bias = "Neutral";
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";

    return { score, bias, confidence: `${confidencePoints}%`, trendLabel, cagr: calculatedCAGR };
}

export function scoreEarningsYield(currentYield, historicalYield, bondYield) {
    if (!currentYield) {
        return { score: 0, bias: "Unknown", confidence: "0%" };
    }

    let score = 50;
    let bias = "Neutral";
    let confidence = "50%";
    let conditionsMet = 0;

    // 1. Compare vs Historical Average (Primary Weight)
    if (historicalYield) {
        conditionsMet++;
        if (currentYield >= historicalYield * 1.3) {
            score += 30; // Exceptionally high yield relative to history
        } else if (currentYield > historicalYield * 1.1) {
            score += 15; // Good yield
        } else if (currentYield <= historicalYield * 0.7) {
            score -= 30; // Very poor yield
        } else if (currentYield < historicalYield * 0.9) {
            score -= 15; // Poor yield
        }
    }

    // 2. Equity Risk Premium vs Bond Yield (Secondary Weight)
    if (bondYield) {
        conditionsMet++;
        const equityRiskPremium = currentYield - bondYield;
        
        if (equityRiskPremium >= 4.0) {
            score += 20; // Excellent premium over risk-free rate
        } else if (equityRiskPremium >= 2.0) {
            score += 10;
        } else if (equityRiskPremium < 0) {
            score -= 20; // Negative risk premium (bonds yield more than equities)
        } else if (equityRiskPremium < 1.0) {
            score -= 10; // Weak premium
        }
    }

    // Normalize Score
    score = Math.max(0, Math.min(100, score));

    // Determine Bias
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";
    else bias = "Neutral";

    // Determine Confidence
    if (conditionsMet === 2) confidence = "90%";
    else if (conditionsMet === 1) confidence = "70%";
    else confidence = "40%"; // Only have current Yield

    return { score, bias, confidence };
}

export function scoreEPSGrowth(cagr, latestYoY, positiveYears, totalPeriods) {
    if (cagr === null || isNaN(cagr)) {
        return { score: 0, bias: 'Neutral', confidence: 0, growthTier: 'Unknown', momentumLabel: 'Unknown' };
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

    // ── Bias ──────────────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Confidence scales with data richness ──────────────────────────────
    let confidence;
    if (totalPeriods >= 5)      confidence = 90;
    else if (totalPeriods >= 3) confidence = 80;
    else if (totalPeriods >= 2) confidence = 70;
    else                        confidence = 55; // Manual only

    return { score: finalScore, bias, confidence, growthTier, momentumLabel };
}

export function scoreInstitutionalFlow(fiiFlow, diiFlow) {
    if (fiiFlow === null || isNaN(fiiFlow) || diiFlow === null || isNaN(diiFlow)) {
        return { score: null, bias: 'Neutral', confidence: '0%', netFlow: null };
    }

    const netFlow = fiiFlow + diiFlow;
    let score = 50;

    if (fiiFlow > 0 && diiFlow > 0) {
        // Both buying: Strong Bullish
        score = 95;
    } else if (fiiFlow < 0 && diiFlow < 0) {
        // Both selling: Strong Bearish
        score = 10;
    } else if (netFlow > 0) {
        // One is selling, but net is positive (usually DII absorbing FII)
        score = fiiFlow > 0 ? 80 : 70; // Slightly better if FII is leading the buying
    } else {
        // One is buying, but net is negative
        score = fiiFlow < 0 ? 30 : 40; // Slightly worse if FII is leading the selling
    }

    let bias = "Neutral";
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";

    return { score, bias, confidence: '95%', netFlow };
}

export function scoreForwardPE(currentFwdPE, currentPE) {
    if (currentFwdPE === null || currentFwdPE === undefined || isNaN(currentFwdPE)) {
        return { score: null, bias: 'Neutral', confidence: 60 };
    }

    if (currentPE === null || currentPE === undefined || isNaN(currentPE)) {
        // Absolute Forward PE scoring if Trailing PE is missing
        let absScore = 50;
        if (currentFwdPE < 10)       absScore = 95;
        else if (currentFwdPE < 15)  absScore = 80;
        else if (currentFwdPE < 20)  absScore = 65;
        else if (currentFwdPE < 25)  absScore = 50;
        else if (currentFwdPE < 35)  absScore = 30;
        else                         absScore = 10;
        
        let bias;
        if (absScore >= 80)      bias = 'Strong Bullish';
        else if (absScore >= 62) bias = 'Bullish';
        else if (absScore >= 42) bias = 'Neutral';
        else if (absScore >= 25) bias = 'Bearish';
        else                     bias = 'Strong Bearish';
        
        return { score: absScore, bias, confidence: 65 };
    }

    // Relative scoring: Forward PE vs Trailing PE
    const growthPremium = (currentPE - currentFwdPE) / currentPE; // Positive means Fwd PE is lower (growth)
    
    let relScore = 50;
    if (growthPremium > 0.30)       relScore = 95; // 30%+ earnings growth priced in
    else if (growthPremium > 0.15)  relScore = 85; // 15-30% growth
    else if (growthPremium > 0.05)  relScore = 65; // 5-15% growth
    else if (growthPremium > -0.05) relScore = 50; // Flat earnings
    else if (growthPremium > -0.15) relScore = 35; // Slight earnings decline
    else if (growthPremium > -0.30) relScore = 20; // Significant earnings decline
    else                            relScore = 5;  // Severe contraction

    let bias;
    if (relScore >= 80)      bias = 'Strong Bullish';
    else if (relScore >= 62) bias = 'Bullish';
    else if (relScore >= 42) bias = 'Neutral';
    else if (relScore >= 25) bias = 'Bearish';
    else                     bias = 'Strong Bearish';

    return { score: relScore, bias, confidence: 85 };
}

export function scoreFreeCashFlow(currentFCF, revenue) {
    if (currentFCF === null || isNaN(currentFCF)) {
        return { score: 0, bias: 'Neutral', confidence: 0, fcfCategory: 'Unknown', fcfYield: null };
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

    // ── Bias ──────────────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Confidence: Higher when yield is available for normalization ───────
    const confidence = hasYield ? 88 : 68;

    return { score: finalScore, bias, confidence, fcfCategory, fcfYield };
}

export function scoreGDPGrowth(currentGrowth) {
    if (currentGrowth === null || isNaN(currentGrowth)) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    let score = 50;
    let trendDesc = "Stable";
    let bias = "Neutral";

    if (currentGrowth > 8) {
        score = 95; bias = "Strong Bullish"; trendDesc = "Rapid Expansion";
    } else if (currentGrowth > 6) {
        score = 82; bias = "Bullish"; trendDesc = "Healthy Expansion";
    } else if (currentGrowth > 4) {
        score = 60; bias = "Neutral"; trendDesc = "Moderate Growth";
    } else if (currentGrowth > 0) {
        score = 35; bias = "Bearish"; trendDesc = "Economic Slowdown";
    } else {
        score = 10; bias = "Strong Bearish"; trendDesc = "Contraction (Recession)";
    }

    const confidence = currentGrowth > 8 || currentGrowth < 0 ? '88%' : '78%';
    return { score, bias, confidence, trendDesc };
}

export function scorePCR(pcrValue) {
    if (pcrValue === null || isNaN(pcrValue)) {
        return { score: null, bias: 'Neutral', confidence: 0, optionsBias: 'Unknown', signalStrength: 'No Data' };
    }

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
        return { score: 0, bias: 'Neutral', confidence: 0, safetyZone: 'Unknown' };
    }

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
    // Every x above 1.0 represents one full layer of earnings buffer
    const marginAboveBreakeven = Math.max(0, currentCoverage - 1.0);
    let f2Score;
    if (marginAboveBreakeven > 10) f2Score = 95;
    else if (marginAboveBreakeven > 5) f2Score = 82;
    else if (marginAboveBreakeven > 3) f2Score = 65;
    else if (marginAboveBreakeven > 1) f2Score = 42;
    else if (marginAboveBreakeven > 0) f2Score = 20;
    else f2Score = 5; // Below break-even

    // ── Factor 3: Sector Comparison ──────────────────────────────────────
    let f3Score = f1Score; // fallback
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

    // ── Blend ─────────────────────────────────────────────────────────────
    const blended = hasSector
        ? (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20)
        : (f1Score * 0.60) + (f2Score * 0.40);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    // ── Bias ──────────────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Confidence ────────────────────────────────────────────────────────
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

    // ── Bias Mapping ──────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Momentum Direction Label ──────────────────────────────────────────
    let momentumDir;
    if (macdValue > 100)       momentumDir = 'Strong Upward Momentum';
    else if (macdValue > 15)   momentumDir = 'Positive Momentum';
    else if (macdValue > -15)  momentumDir = 'Momentum Transition';
    else if (macdValue > -100) momentumDir = 'Negative Momentum';
    else                       momentumDir = 'Strong Downward Momentum';

    // ── Confidence: highest at extremes, lowest near zero ────────────────
    let confidence;
    if (absValue > 150) confidence = 88; // Clear directional momentum
    else if (absValue > 60) confidence = 76;
    else if (absValue > 15) confidence = 64;
    else confidence = 52; // Near zero — uncertain crossover zone

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

    // ── Bias Mapping ──────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Confidence: highest at extremes where signal is clearest ─────────
    let confidence;
    if (dmaDistance > 20 || dmaDistance < -15) confidence = 90; // Clear extremes
    else if (dmaDistance > 10 || dmaDistance < -8) confidence = 82;
    else if (Math.abs(dmaDistance) < 3) confidence = 78; // Support/resistance test
    else confidence = 70;

    return { score: finalScore, bias, confidence, dmaPosition, distanceCategory };
}

export function scoreNetMargin(currentMargin, sectorMargin) {
    if (currentMargin === null || isNaN(currentMargin)) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    // Factor 1: Absolute margin level (50 weight)
    let f1Score;
    let trendDesc;
    if (currentMargin > 20) {
        f1Score = 95; trendDesc = "Exceptional Profitability";
    } else if (currentMargin > 15) {
        f1Score = 82; trendDesc = "High Margin";
    } else if (currentMargin >= 10) {
        f1Score = 60; trendDesc = "Healthy Margin";
    } else if (currentMargin > 0) {
        f1Score = 30; trendDesc = "Thin Margin";
    } else {
        f1Score = 5; trendDesc = "Loss Making";
    }

    // Factor 2: Sector comparison (30 weight when available)
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

    const blended = hasSector
        ? (f1Score * 0.65) + (f2Score * 0.35)
        : f1Score;
    const score = Math.round(Math.max(0, Math.min(100, blended)));

    let bias;
    if (score >= 80)      bias = 'Strong Bullish';
    else if (score >= 60) bias = 'Bullish';
    else if (score >= 40) bias = 'Neutral';
    else if (score >= 20) bias = 'Bearish';
    else                  bias = 'Strong Bearish';

    const confidence = hasSector ? '90%' : (currentMargin > 20 || currentMargin < 0 ? '82%' : '72%');
    return { score, bias, confidence, trendDesc };
}

export function scoreOperatingMargin(currentMargin, sectorMargin) {
    if (currentMargin === null || isNaN(currentMargin)) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    // Factor 1: Absolute operating margin level
    let f1Score;
    let trendDesc;
    if (currentMargin > 25) {
        f1Score = 95; trendDesc = "Exceptional Operations";
    } else if (currentMargin > 18) {
        f1Score = 82; trendDesc = "High Operating Leverage";
    } else if (currentMargin >= 10) {
        f1Score = 60; trendDesc = "Healthy Operations";
    } else if (currentMargin > 0) {
        f1Score = 30; trendDesc = "Weak Operations";
    } else {
        f1Score = 5; trendDesc = "Operating Loss";
    }

    // Factor 2: Sector comparison (35% weight when available)
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

    const blended = hasSector ? (f1Score * 0.65) + (f2Score * 0.35) : f1Score;
    const score = Math.round(Math.max(0, Math.min(100, blended)));

    let bias;
    if (score >= 80)      bias = 'Strong Bullish';
    else if (score >= 60) bias = 'Bullish';
    else if (score >= 40) bias = 'Neutral';
    else if (score >= 20) bias = 'Bearish';
    else                  bias = 'Strong Bearish';

    const confidence = hasSector ? '90%' : (currentMargin > 25 || currentMargin < 0 ? '82%' : '72%');
    return { score, bias, confidence, trendDesc };
}

export function scorePBRatio(currentPB, historicalPB, sectorPB) {
    if (!currentPB) {
        return { score: 0, bias: "Unknown", confidence: "0%" };
    }

    let score = 50;
    let bias = "Neutral";
    let confidence = "50%";
    let conditionsMet = 0;

    // 1. Compare vs Historical Average (Primary Weight)
    if (historicalPB) {
        conditionsMet++;
        if (currentPB <= historicalPB * 0.7) {
            score += 30; // Deep discount to own history
        } else if (currentPB < historicalPB * 0.95) {
            score += 15; // Moderate discount
        } else if (currentPB >= historicalPB * 1.3) {
            score -= 30; // Severe premium
        } else if (currentPB > historicalPB * 1.05) {
            score -= 15; // Moderate premium
        }
    }

    // 2. Compare vs Sector Average (Secondary Weight)
    if (sectorPB) {
        conditionsMet++;
        if (currentPB <= sectorPB * 0.8) {
            score += 15;
        } else if (currentPB < sectorPB * 0.95) {
            score += 5;
        } else if (currentPB >= sectorPB * 1.2) {
            score -= 15;
        } else if (currentPB > sectorPB * 1.05) {
            score -= 5;
        }
    }

    // Normalize Score
    score = Math.max(0, Math.min(100, score));

    // Determine Bias
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";
    else bias = "Neutral";

    // Determine Confidence
    if (conditionsMet === 2) confidence = "90%";
    else if (conditionsMet === 1) confidence = "70%";
    else confidence = "40%"; // Only have current PB

    return { score, bias, confidence };
}

export function scorePERatio(currentPE, historicalAvg, sectorPE) {
    if (currentPE === null || currentPE === undefined || isNaN(currentPE)) {
        return { score: null, bias: 'Neutral', confidence: 60 };
    }

    // ── Factor 1: vs Historical Average (0–100) ────────────────────────────
    let f1Score = 50;
    if (historicalAvg && !isNaN(historicalAvg) && historicalAvg > 0) {
        const deviation = (currentPE - historicalAvg) / historicalAvg; // -ve = cheap, +ve = expensive
        // Score inversely proportional to deviation (cheaper = higher score)
        f1Score = Math.max(0, Math.min(100, 50 - (deviation * 200)));
    } else {
        // Absolute fallback bands when no historical avg is provided
        if (currentPE < 10)       f1Score = 95;
        else if (currentPE < 15)  f1Score = 80;
        else if (currentPE < 20)  f1Score = 65;
        else if (currentPE < 25)  f1Score = 50;
        else if (currentPE < 30)  f1Score = 35;
        else if (currentPE < 40)  f1Score = 20;
        else                      f1Score = 5;
    }

    // ── Factor 2: vs Sector PE (0–100) ────────────────────────────────────
    let f2Score = 50;
    let hasSector = false;
    if (sectorPE && !isNaN(sectorPE) && sectorPE > 0) {
        hasSector = true;
        const sectorDev = (currentPE - sectorPE) / sectorPE;
        f2Score = Math.max(0, Math.min(100, 50 - (sectorDev * 150)));
    }

    // ── Factor 3: Absolute PE Safety Bands (0–100) ────────────────────────
    let f3Score = 50;
    if (currentPE < 10)       f3Score = 95;  // Extremely cheap
    else if (currentPE < 15)  f3Score = 82;  // Cheap
    else if (currentPE < 22)  f3Score = 65;  // Fair value zone
    else if (currentPE < 28)  f3Score = 45;  // Slightly stretched
    else if (currentPE < 35)  f3Score = 28;  // Expensive
    else if (currentPE < 50)  f3Score = 15;  // Very expensive
    else                      f3Score = 5;   // Bubble territory

    // ── Blend Factors ──────────────────────────────────────────────────────
    const blendedScore = hasSector
        ? (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20)
        : (f1Score * 0.60) + (f3Score * 0.40);

    const finalScore = Math.round(Math.max(0, Math.min(100, blendedScore)));

    // ── Bias Mapping ───────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Confidence: higher when more data sources are present ─────────────
    const confidence = hasSector ? 90 : (historicalAvg ? 82 : 70);

    return { score: finalScore, bias, confidence };
}

export function scoreProfitGrowth(profitHistory, manualCAGR) {
    if ((!profitHistory || profitHistory.length < 2) && (manualCAGR === null || isNaN(manualCAGR))) {
        return { score: null, bias: 'Neutral', confidence: '0%', calculatedCAGR: null, latestProfit: null, previousProfit: null };
    }

    let score = 50;
    let confidencePoints = 0;
    let calculatedCAGR = null;
    let latestProfit = null;
    let previousProfit = null;
    let trendDesc = "Mixed";

    if (profitHistory && profitHistory.length >= 2) {
        // profitHistory is usually sorted latest first
        const chronological = [...profitHistory].reverse();
        const totalPeriods = chronological.length - 1;
        
        latestProfit = chronological[totalPeriods].value;
        previousProfit = chronological[totalPeriods - 1].value;
        const firstProfit = chronological[0].value;

        if (firstProfit > 0 && latestProfit > 0) {
            calculatedCAGR = (Math.pow(latestProfit / firstProfit, 1 / totalPeriods) - 1) * 100;
        }
        
        const recentGrowth = previousProfit > 0 ? ((latestProfit - previousProfit) / previousProfit) * 100 : 0;

        confidencePoints = Math.min(95, 40 + (totalPeriods * 15));

        if (calculatedCAGR > 25) {
            score = 95; trendDesc = "Explosive Growth";
        } else if (calculatedCAGR > 12) {
            if (recentGrowth > calculatedCAGR) { score = 85; trendDesc = "Accelerating Growth"; }
            else { score = 75; trendDesc = "Healthy Growth"; }
        } else if (calculatedCAGR > 0) {
            if (recentGrowth < 0) { score = 40; trendDesc = "Stalling"; }
            else { score = 60; trendDesc = "Moderate Growth"; }
        } else {
            score = 15; trendDesc = "Contraction";
        }
    } else {
        calculatedCAGR = manualCAGR;
        confidencePoints = 60;
        
        if (manualCAGR > 25) { score = 95; trendDesc = "Explosive Growth"; }
        else if (manualCAGR > 12) { score = 75; trendDesc = "Healthy Growth"; }
        else if (manualCAGR > 0) { score = 60; trendDesc = "Moderate Growth"; }
        else if (manualCAGR > -5) { score = 40; trendDesc = "Stalling"; }
        else { score = 15; trendDesc = "Contraction"; }
    }

    let bias = "Neutral";
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";

    return { score, bias, confidence: `${confidencePoints}%`, calculatedCAGR, latestProfit, previousProfit, trendDesc };
}

export function scoreRevenueGrowth(revenueHistory, manualCAGR) {
    if ((!revenueHistory || revenueHistory.length < 2) && (manualCAGR === null || isNaN(manualCAGR))) {
        return { score: null, bias: 'Neutral', confidence: '0%', calculatedCAGR: null, latestRevenue: null, previousRevenue: null };
    }

    let score = 50;
    let confidencePoints = 0;
    let calculatedCAGR = null;
    let latestRevenue = null;
    let previousRevenue = null;
    let trendDesc = "Mixed";

    if (revenueHistory && revenueHistory.length >= 2) {
        // revenueHistory is usually sorted latest first
        const chronological = [...revenueHistory].reverse();
        const totalPeriods = chronological.length - 1;
        
        latestRevenue = chronological[totalPeriods].value;
        previousRevenue = chronological[totalPeriods - 1].value;
        const firstRevenue = chronological[0].value;

        if (firstRevenue > 0 && latestRevenue > 0) {
            calculatedCAGR = (Math.pow(latestRevenue / firstRevenue, 1 / totalPeriods) - 1) * 100;
        }
        
        const recentGrowth = previousRevenue > 0 ? ((latestRevenue - previousRevenue) / previousRevenue) * 100 : 0;

        confidencePoints = Math.min(95, 40 + (totalPeriods * 15));

        if (calculatedCAGR > 20) {
            score = 90; trendDesc = "Hyper Growth";
        } else if (calculatedCAGR > 10) {
            if (recentGrowth > calculatedCAGR) { score = 85; trendDesc = "Accelerating Growth"; }
            else { score = 75; trendDesc = "Healthy Growth"; }
        } else if (calculatedCAGR > 0) {
            if (recentGrowth < 0) { score = 40; trendDesc = "Stalling"; }
            else { score = 60; trendDesc = "Moderate Growth"; }
        } else {
            score = 15; trendDesc = "Contraction";
        }
    } else {
        calculatedCAGR = manualCAGR;
        confidencePoints = 60;
        
        if (manualCAGR > 20) { score = 90; trendDesc = "Hyper Growth"; }
        else if (manualCAGR > 10) { score = 75; trendDesc = "Healthy Growth"; }
        else if (manualCAGR > 0) { score = 60; trendDesc = "Moderate Growth"; }
        else if (manualCAGR > -5) { score = 40; trendDesc = "Stalling"; }
        else { score = 15; trendDesc = "Contraction"; }
    }

    let bias = "Neutral";
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";

    return { score, bias, confidence: `${confidencePoints}%`, calculatedCAGR, latestRevenue, previousRevenue, trendDesc };
}

export function scoreROCE(currentROCE, sectorROCE) {
    if (currentROCE === null || isNaN(currentROCE)) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    let score = 50;
    let bias = 'Neutral';
    let trendDesc = "Average";

    if (sectorROCE !== null && !isNaN(sectorROCE)) {
        // Comparative Scoring
        const spread = currentROCE - sectorROCE;
        if (currentROCE > 25 && spread > 5) {
            score = 95; bias = 'Strong Bullish'; trendDesc = "Elite Capital Allocator";
        } else if (currentROCE > 15 && spread > 0) {
            score = 85; bias = 'Bullish'; trendDesc = "Outperforming Sector";
        } else if (currentROCE >= 10 && spread >= -2) {
            score = 60; bias = 'Neutral'; trendDesc = "In-line with Sector";
        } else if (currentROCE > 0) {
            score = 30; bias = 'Bearish'; trendDesc = "Underperforming";
        } else {
            score = 10; bias = 'Strong Bearish'; trendDesc = "Capital Destroyer";
        }
    } else {
        // Absolute Scoring
        if (currentROCE > 25) {
            score = 90; bias = 'Strong Bullish'; trendDesc = "High Capital Efficiency";
        } else if (currentROCE > 15) {
            score = 75; bias = 'Bullish'; trendDesc = "Solid Efficiency";
        } else if (currentROCE >= 10) {
            score = 50; bias = 'Neutral'; trendDesc = "Acceptable Efficiency";
        } else if (currentROCE > 0) {
            score = 30; bias = 'Bearish'; trendDesc = "Sub-par Efficiency";
        } else {
            score = 10; bias = 'Strong Bearish'; trendDesc = "Capital Destroyer";
        }
    }

    const confidence = sectorROCE !== null && !isNaN(sectorROCE) ? 90 : (currentROCE > 25 || currentROCE < 0 ? 80 : 72);
    return { score, bias, confidence, trendDesc };
}

export function scoreROE(currentROE, sectorROE) {
    if (currentROE === null || isNaN(currentROE)) {
        return { score: null, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    let score = 50;
    let bias = 'Neutral';
    let trendDesc = "Average";

    if (sectorROE !== null && !isNaN(sectorROE)) {
        // Comparative Scoring
        const spread = currentROE - sectorROE;
        if (currentROE > 20 && spread > 5) {
            score = 95; bias = 'Strong Bullish'; trendDesc = "Exceptional Compounder";
        } else if (currentROE > 15 && spread > 0) {
            score = 85; bias = 'Bullish'; trendDesc = "Outperforming Sector";
        } else if (currentROE >= 10 && spread >= -2) {
            score = 60; bias = 'Neutral'; trendDesc = "In-line with Sector";
        } else if (currentROE > 0) {
            score = 30; bias = 'Bearish'; trendDesc = "Underperforming";
        } else {
            score = 10; bias = 'Strong Bearish'; trendDesc = "Value Destroyer";
        }
    } else {
        // Absolute Scoring
        if (currentROE > 20) {
            score = 90; bias = 'Strong Bullish'; trendDesc = "High Return on Capital";
        } else if (currentROE > 15) {
            score = 75; bias = 'Bullish'; trendDesc = "Solid Returns";
        } else if (currentROE >= 10) {
            score = 50; bias = 'Neutral'; trendDesc = "Cost of Capital";
        } else if (currentROE > 0) {
            score = 30; bias = 'Bearish'; trendDesc = "Sub-par Returns";
        } else {
            score = 10; bias = 'Strong Bearish'; trendDesc = "Value Destroyer";
        }
    }

    const confidence = sectorROE !== null && !isNaN(sectorROE) ? 90 : (currentROE > 20 || currentROE < 0 ? 80 : 72);
    return { score, bias, confidence, trendDesc };
}

export function scoreVIX(vixValue) {
    if (vixValue === null || isNaN(vixValue)) {
        return { score: null, bias: 'Neutral', confidence: 0, vixRegime: 'Unknown', marketCondition: 'No Data' };
    }

    // ── Factor 1: VIX Regime Classification (0–100) ───────────────────────
    // Scoring is INVERSE: low VIX = higher score, but extreme low has penalty
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
        f1Score = 70; vixRegime = 'Extreme Complacency'; // Penalty — dangerous low
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
    const blended = (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    // ── Bias Mapping ──────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Confidence: highest at extremes where VIX is most predictive ─────
    let confidence;
    if (vixValue > 28 || vixValue < 11) confidence = 92; // Extremes = highest signal quality
    else if (vixValue > 22 || vixValue < 13) confidence = 84;
    else confidence = 72; // Mid-range VIX = less directional

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
        return { score: 0, bias: 'Neutral', confidence: 0, valuationZone: 'Unknown' };
    }

    let f1Score;
    let valuationZone;
    if (currentEV < 5) {
        f1Score = 95; valuationZone = 'Deep Value';
    } else if (currentEV < 8) {
        f1Score = 80; valuationZone = 'Undervalued';
    } else if (currentEV < 12) {
        f1Score = 60; valuationZone = 'Fairly Valued';
    } else if (currentEV < 18) {
        f1Score = 40; valuationZone = 'Overvalued';
    } else {
        f1Score = 15; valuationZone = 'Highly Overvalued';
    }

    let f2Score = f1Score;
    let hasSector = false;
    if (sectorEV !== null && !isNaN(sectorEV) && sectorEV > 0) {
        hasSector = true;
        const ratio = currentEV / sectorEV;
        if (ratio < 0.6) f2Score = 95;
        else if (ratio < 0.8) f2Score = 80;
        else if (ratio < 1.0) f2Score = 60;
        else if (ratio < 1.2) f2Score = 40;
        else f2Score = 15;
    }

    const blended = hasSector ? (f1Score * 0.5) + (f2Score * 0.5) : f1Score;
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    let bias;
    if (finalScore >= 80) bias = 'Strong Bullish';
    else if (finalScore >= 60) bias = 'Bullish';
    else if (finalScore >= 40) bias = 'Neutral';
    else if (finalScore >= 20) bias = 'Bearish';
    else bias = 'Strong Bearish';

    return { score: finalScore, bias, confidence: hasSector ? 90 : 70, valuationZone };
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
        return { score: 0, bias: 'Neutral', confidence: 0, efficiencyZone: 'Unknown' };
    }

    let f1Score;
    let efficiencyZone;
    if (currentROA > 15) {
        f1Score = 95; efficiencyZone = 'Elite Efficiency';
    } else if (currentROA > 8) {
        f1Score = 80; efficiencyZone = 'High Efficiency';
    } else if (currentROA > 4) {
        f1Score = 60; efficiencyZone = 'Average Efficiency';
    } else if (currentROA > 0) {
        f1Score = 40; efficiencyZone = 'Low Efficiency';
    } else {
        f1Score = 15; efficiencyZone = 'Asset Destroyer';
    }

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

    const blended = hasSector ? (f1Score * 0.5) + (f2Score * 0.5) : f1Score;
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    let bias;
    if (finalScore >= 80) bias = 'Strong Bullish';
    else if (finalScore >= 60) bias = 'Bullish';
    else if (finalScore >= 40) bias = 'Neutral';
    else if (finalScore >= 20) bias = 'Bearish';
    else bias = 'Strong Bearish';

    return { score: finalScore, bias, confidence: hasSector ? 90 : 70, efficiencyZone };
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
    if (currentPct === null || isNaN(currentPct)) return { score: 0, bias: 'Neutral', confidence: 0, holdingZone: 'Unknown', trend: 'No Data' };
    let f1Score, holdingZone;
    if (currentPct >= 70) { f1Score = 90; holdingZone = 'Fortress Control'; }
    else if (currentPct >= 55) { f1Score = 80; holdingZone = 'Strong Commitment'; }
    else if (currentPct >= 45) { f1Score = 65; holdingZone = 'Moderate Commitment'; }
    else if (currentPct >= 30) { f1Score = 48; holdingZone = 'Diluted Control'; }
    else if (currentPct >= 15) { f1Score = 28; holdingZone = 'Low Promoter Skin'; }
    else { f1Score = 10; holdingZone = 'Minimal Insider Stake'; }
    let f2Score = f1Score, trend = 'Stable';
    if (prevPct !== null && !isNaN(prevPct)) {
        const delta = currentPct - prevPct;
        if (delta > 1.0) { f2Score = Math.min(100, f1Score + 10); trend = 'Increasing'; }
        else if (delta > 0.2) { f2Score = Math.min(100, f1Score + 5); trend = 'Slight Increase'; }
        else if (delta < -1.0) { f2Score = Math.max(0, f1Score - 15); trend = 'Decreasing'; }
        else if (delta < -0.2) { f2Score = Math.max(0, f1Score - 7); trend = 'Slight Dilution'; }
    }
    const finalScore = Math.round(Math.max(0, Math.min(100, (f1Score * 0.65) + (f2Score * 0.35))));
    let bias;
    if (finalScore >= 80) bias = 'Strong Bullish'; else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral'; else if (finalScore >= 25) bias = 'Bearish'; else bias = 'Strong Bearish';
    return { score: finalScore, bias, confidence: prevPct !== null ? 88 : 72, holdingZone, trend };
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
    if (latestInstitutional === null || isNaN(latestInstitutional)) return { score: 0, bias: 'Neutral', confidence: 0, flowZone: 'Unknown', trend: 'No Data' };
    let f1Score, flowZone;
    if (latestInstitutional >= 50) { f1Score = 90; flowZone = 'Heavy Institutional Ownership'; }
    else if (latestInstitutional >= 35) { f1Score = 78; flowZone = 'Strong Institutional Interest'; }
    else if (latestInstitutional >= 20) { f1Score = 62; flowZone = 'Moderate Institutional Interest'; }
    else if (latestInstitutional >= 10) { f1Score = 45; flowZone = 'Low Institutional Interest'; }
    else { f1Score = 25; flowZone = 'Retail-Dominated'; }
    let f2Score = f1Score, trend = 'Stable';
    if (prevInstitutional !== null && !isNaN(prevInstitutional)) {
        const delta = latestInstitutional - prevInstitutional;
        if (delta > 1.5) { f2Score = Math.min(100, f1Score + 12); trend = 'Accumulating'; }
        else if (delta > 0.5) { f2Score = Math.min(100, f1Score + 6); trend = 'Slight Accumulation'; }
        else if (delta < -1.5) { f2Score = Math.max(0, f1Score - 18); trend = 'Distributing'; }
        else if (delta < -0.5) { f2Score = Math.max(0, f1Score - 8); trend = 'Slight Distribution'; }
    }
    const finalScore = Math.round(Math.max(0, Math.min(100, (f1Score * 0.55) + (f2Score * 0.45))));
    let bias;
    if (finalScore >= 80) bias = 'Strong Bullish'; else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral'; else if (finalScore >= 25) bias = 'Bearish'; else bias = 'Strong Bearish';
    return { score: finalScore, bias, confidence: prevInstitutional !== null ? 90 : 72, flowZone, trend };
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
    if (cfoToNetProfit === null || isNaN(cfoToNetProfit)) return { score: 0, bias: 'Neutral', confidence: 0, qualityLabel: 'Unknown' };
    let score, qualityLabel;
    if (cfoToNetProfit > 1.5) { score = 95; qualityLabel = 'Exceptional Cash Quality'; }
    else if (cfoToNetProfit > 1.1) { score = 82; qualityLabel = 'High Quality Earnings'; }
    else if (cfoToNetProfit > 0.8) { score = 65; qualityLabel = 'Adequate Cash Conversion'; }
    else if (cfoToNetProfit > 0.5) { score = 45; qualityLabel = 'Weak Cash Conversion'; }
    else if (cfoToNetProfit > 0) { score = 28; qualityLabel = 'Poor Cash Quality'; }
    else if (cfoToNetProfit === 0) { score = 40; qualityLabel = 'Break-Even'; }
    else { score = 10; qualityLabel = 'Negative CFO � Paper Profits'; }
    let bias;
    if (score >= 80) bias = 'Strong Bullish'; else if (score >= 62) bias = 'Bullish';
    else if (score >= 42) bias = 'Neutral'; else if (score >= 25) bias = 'Bearish'; else bias = 'Strong Bearish';
    return { score, bias, confidence: 88, qualityLabel };
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
    if (pe === undefined || pe === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(pe);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };

    let score = 50;
    let bias = 'Neutral';

    // Historical Nifty PE averages around 20-22
    if (num < 15) { score = 100; bias = 'Strong Bullish'; }
    else if (num < 18) { score = 80; bias = 'Bullish'; }
    else if (num < 22) { score = 50; bias = 'Neutral'; }
    else if (num < 25) { score = 20; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }

    return { score, bias, confidence: 95 };
}

export function generateAiInsightNiftyPE(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Nifty PE ratio data is unavailable.";
    if (scoreObj.score >= 80) return `Nifty PE at ${val} is deep in the value zone, historically followed by strong forward returns.`;
    if (scoreObj.score <= 20) return `Nifty PE at ${val} is stretched. High vulnerability to earnings disappointment or rate shocks.`;
    return `Nifty PE at ${val} is near historical fair value. Market is pricing in steady growth.`;
}

export function scoreNiftyPB(pb) {
    if (pb === undefined || pb === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(pb);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };

    let score = 50;
    let bias = 'Neutral';

    // Nifty PB historical average around 3.0
    if (num < 2.5) { score = 100; bias = 'Strong Bullish'; }
    else if (num < 3.0) { score = 75; bias = 'Bullish'; }
    else if (num < 3.8) { score = 50; bias = 'Neutral'; }
    else if (num < 4.5) { score = 25; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }

    return { score, bias, confidence: 90 };
}

export function generateAiInsightNiftyPB(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Nifty PB data unavailable.";
    if (scoreObj.score >= 75) return `Nifty PB at ${val}x suggests severe undervaluation of banking and heavy asset sectors.`;
    if (scoreObj.score <= 25) return `Nifty PB at ${val}x implies significant premium being paid for future ROE expansion.`;
    return `Nifty PB at ${val}x is perfectly aligned with historical long-term averages.`;
}

export function scoreMarketCapGDP(ratio) {
    if (ratio === undefined || ratio === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(ratio);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };

    let score = 50;
    let bias = 'Neutral';

    // Buffett Indicator for India (Historically 75%-100% is fair, >120% is expensive)
    if (num < 70) { score = 100; bias = 'Strong Bullish'; }
    else if (num < 90) { score = 80; bias = 'Bullish'; }
    else if (num < 110) { score = 50; bias = 'Neutral'; }
    else if (num < 130) { score = 20; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }

    return { score, bias, confidence: 90 };
}

export function generateAiInsightMarketCapGDP(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Market Cap/GDP data unavailable.";
    if (scoreObj.score >= 80) return `At ${val}%, the Buffett Indicator suggests India is structurally undervalued relative to its economic footprint.`;
    if (scoreObj.score <= 20) return `At ${val}%, total market cap far exceeds GDP. Market is pulling forward multiple years of growth.`;
    return `At ${val}%, Indian equities are fairly priced relative to the current size of the underlying economy.`;
}

export function scoreNiftyDividendYield(yieldVal) {
    if (yieldVal === undefined || yieldVal === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(yieldVal);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };

    let score = 50;
    let bias = 'Neutral';

    // Nifty Div Yield average is ~1.2%
    if (num > 1.8) { score = 100; bias = 'Strong Bullish'; }
    else if (num > 1.4) { score = 80; bias = 'Bullish'; }
    else if (num > 1.0) { score = 50; bias = 'Neutral'; }
    else if (num > 0.7) { score = 20; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }

    return { score, bias, confidence: 90 };
}

export function generateAiInsightNiftyDividendYield(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Nifty Dividend Yield data unavailable.";
    if (scoreObj.score >= 80) return `Aggregate yield of ${val}% provides a massive floor to index drawdowns. Deep value territory.`;
    if (scoreObj.score <= 20) return `Aggregate yield of ${val}% is extremely low, typical of late-stage bull market euphoria.`;
    return `Yield of ${val}% represents a standard, healthy baseline for large-cap Indian equities.`;
}

export function scoreNiftyEPSGrowth(growth) {
    if (growth === undefined || growth === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(growth);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };

    let score = 50;
    let bias = 'Neutral';

    // Nifty long term EPS CAGR is ~12-14%
    if (num > 20) { score = 100; bias = 'Strong Bullish'; }
    else if (num > 15) { score = 80; bias = 'Bullish'; }
    else if (num > 10) { score = 50; bias = 'Neutral'; }
    else if (num > 5) { score = 20; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }

    return { score, bias, confidence: 90 };
}

export function generateAiInsightNiftyEPSGrowth(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Nifty EPS Growth data unavailable.";
    if (scoreObj.score >= 80) return `Nifty EPS surging ${val}%. The fundamental earnings engine is fully intact to support current valuations.`;
    if (scoreObj.score <= 20) return `Sluggish EPS growth of ${val}% makes the index highly vulnerable to valuation contraction.`;
    return `EPS compounding at ${val}%, directly in line with long-term nominal GDP growth plus inflation.`;
}

export function scoreNiftyForwardEPS(growth) {
    if (growth === undefined || growth === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(growth);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    if (num > 22) { score = 100; bias = 'Strong Bullish'; }
    else if (num > 16) { score = 80; bias = 'Bullish'; }
    else if (num > 12) { score = 50; bias = 'Neutral'; }
    else if (num > 6) { score = 20; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 85 };
}
export function generateAiInsightNiftyForwardEPS(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Forward EPS data unavailable.";
    if (scoreObj.score >= 80) return `Street expects powerful ${val}% forward growth, providing a massive tailwind for momentum.`;
    if (scoreObj.score <= 20) return `Forward estimates are collapsing to ${val}%. High risk of downward rerating across the board.`;
    return `Forward consensus at ${val}% indicates a stable, middle-of-the-road earnings cycle.`;
}

export function scoreEarningsRevision(netUpgrades) {
    if (netUpgrades === undefined || netUpgrades === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(netUpgrades); // % of companies with EPS upgrades minus downgrades
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    if (num > 20) { score = 100; bias = 'Strong Bullish'; }
    else if (num > 5) { score = 75; bias = 'Bullish'; }
    else if (num > -5) { score = 50; bias = 'Neutral'; }
    else if (num > -20) { score = 25; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 80 };
}
export function generateAiInsightEarningsRevision(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Earnings revision data unavailable.";
    if (scoreObj.score >= 75) return `Net ${val}% positive revisions. Analysts are scrambling to upgrade targets—classic bull market behavior.`;
    if (scoreObj.score <= 25) return `Net ${val}% downgrades. The street is aggressively cutting estimates, signaling a deteriorating macro environment.`;
    return `Revisions are balanced at ${val}%. The street is largely comfortable with current consensus.`;
}

export function scoreSectorEarnings(breadth) {
    if (breadth === undefined || breadth === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(breadth); // % of sectors beating estimates
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    if (num > 75) { score = 100; bias = 'Strong Bullish'; }
    else if (num > 60) { score = 75; bias = 'Bullish'; }
    else if (num > 40) { score = 50; bias = 'Neutral'; }
    else if (num > 25) { score = 25; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 85 };
}
export function generateAiInsightSectorEarnings(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Sector earnings breadth unavailable.";
    if (scoreObj.score >= 75) return `${val}% of sectors beating estimates indicates incredibly broad-based economic resilience.`;
    if (scoreObj.score <= 25) return `Only ${val}% of sectors beating. Growth is heavily isolated, making the broader index fragile.`;
    return `Sector breadth at ${val}% indicates a standard, mixed earnings season with clear winners and losers.`;
}

export function scoreAggregateProfitMargin(margin) {
    if (margin === undefined || margin === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(margin);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    if (num > 12) { score = 100; bias = 'Strong Bullish'; }
    else if (num > 10) { score = 75; bias = 'Bullish'; }
    else if (num > 8) { score = 50; bias = 'Neutral'; }
    else if (num > 6) { score = 25; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 90 };
}
export function generateAiInsightAggregateProfitMargin(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Margin data unavailable.";
    if (scoreObj.score >= 75) return `Record aggregate margins of ${val}%. Corporate India has immense pricing power and cost leverage right now.`;
    if (scoreObj.score <= 25) return `Margins squeezed to ${val}%. Input cost inflation and lack of pricing power are destroying profitability.`;
    return `Aggregate margins at ${val}% reflect a steady-state operating environment for Nifty constituents.`;
}

export function scoreCPIInflation(cpi) {
    if (cpi === undefined || cpi === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(cpi);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    // RBI target is 4%, band 2-6%
    if (num < 4.5 && num > 2) { score = 100; bias = 'Strong Bullish'; }
    else if (num <= 5.5) { score = 75; bias = 'Bullish'; }
    else if (num <= 6.5) { score = 50; bias = 'Neutral'; }
    else if (num <= 7.5) { score = 25; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 95 };
}
export function generateAiInsightCPIInflation(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "CPI data unavailable.";
    if (scoreObj.score >= 75) return `Goldilocks CPI at ${val}%. Perfectly aligned with RBI targets, granting maximum policy flexibility.`;
    if (scoreObj.score <= 25) return `Hot CPI at ${val}% breaches RBI tolerance bands. Expect aggressive liquidity tightening and rate hikes.`;
    return `CPI at ${val}% is manageable, but RBI will likely maintain a neutral to slightly vigilant stance.`;
}

export function scoreRepoRate(repo) {
    if (repo === undefined || repo === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(repo);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    // Lower rates are generally bullish for equities
    if (num < 4.5) { score = 100; bias = 'Strong Bullish'; }
    else if (num < 5.5) { score = 80; bias = 'Bullish'; }
    else if (num < 6.5) { score = 50; bias = 'Neutral'; }
    else if (num < 7.5) { score = 20; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 95 };
}
export function generateAiInsightRepoRate(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Repo rate data unavailable.";
    if (scoreObj.score >= 80) return `Accommodative repo rate of ${val}% provides massive structural support for equity valuations.`;
    if (scoreObj.score <= 20) return `Restrictive ${val}% repo rate is severely choking corporate credit flow and suppressing P/E multiples.`;
    return `Neutral rate of ${val}% implies RBI is balancing growth objectives with inflation management.`;
}

export function scorePolicyStance(stance) {
    if (!stance) return { score: 0, bias: 'Unknown', confidence: 0 };
    const s = stance.toLowerCase();
    
    if (s.includes('accommodative')) return { score: 100, bias: 'Strong Bullish', confidence: 90 };
    if (s.includes('neutral')) return { score: 50, bias: 'Neutral', confidence: 90 };
    if (s.includes('withdrawal') || s.includes('hawkish')) return { score: 15, bias: 'Bearish', confidence: 90 };
    
    return { score: 50, bias: 'Neutral', confidence: 50 };
}
export function generateAiInsightPolicyStance(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Policy stance unavailable.";
    if (scoreObj.score >= 80) return `Explicitly dovish/accommodative stance. The central bank put is firmly in play for equities.`;
    if (scoreObj.score <= 20) return `Hawkish withdrawal of accommodation. Systemic liquidity will drain, directly pressuring asset prices.`;
    return `Neutral stance. The central bank is data-dependent and on autopilot.`;
}

export function scoreFiscalDeficit(deficit) {
    if (deficit === undefined || deficit === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(deficit);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    // Lower is better (Govt target glide path to 4.5%)
    if (num < 4.5) { score = 100; bias = 'Strong Bullish'; }
    else if (num <= 5.2) { score = 75; bias = 'Bullish'; }
    else if (num <= 5.9) { score = 50; bias = 'Neutral'; }
    else if (num <= 6.5) { score = 25; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 90 };
}
export function generateAiInsightFiscalDeficit(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Fiscal deficit data unavailable.";
    if (scoreObj.score >= 75) return `Excellent fiscal discipline at ${val}%. Prevents crowding out of private borrowing and supports bond yields.`;
    if (scoreObj.score <= 25) return `Bloated deficit of ${val}% threatens sovereign ratings and spikes borrowing costs across the curve.`;
    return `Deficit of ${val}% is manageable and strictly aligns with the government's stated consolidation glide path.`;
}

export function scoreCurrentAccount(cad) {
    if (cad === undefined || cad === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(cad); // Negative means deficit, positive means surplus
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    if (num >= 0) { score = 100; bias = 'Strong Bullish'; } // Surplus
    else if (num > -1.5) { score = 80; bias = 'Bullish'; }
    else if (num > -2.5) { score = 50; bias = 'Neutral'; }
    else if (num > -3.5) { score = 20; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 85 };
}
export function generateAiInsightCurrentAccount(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "CAD data unavailable.";
    if (scoreObj.score >= 80) return `Current Account at ${val}% is a massive structural positive, providing an ironclad floor for the INR.`;
    if (scoreObj.score <= 20) return `Severe CAD of ${val}%. The INR is highly vulnerable to capital flight and imported inflation.`;
    return `CAD of ${val}% is easily financeable by standard FDI/FPI flows without stressing the currency.`;
}

export function scoreFiiFlowTrend(persistence) {
    if (persistence === undefined || persistence === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(persistence); // -10 to +10 scale (days of net buying)
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    if (num >= 7) { score = 100; bias = 'Strong Bullish'; }
    else if (num >= 3) { score = 75; bias = 'Bullish'; }
    else if (num >= -2) { score = 50; bias = 'Neutral'; }
    else if (num >= -6) { score = 25; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 90 };
}
export function generateAiInsightFiiFlowTrend(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "FII trend data unavailable.";
    if (scoreObj.score >= 75) return `Relentless institutional buying momentum (${val} days). This structural tailwind forces shorts to cover.`;
    if (scoreObj.score <= 25) return `Persistent FII dumping (${val} days). Domestic liquidity is being severely tested by foreign capitulation.`;
    return `Choppy, non-directional FII flows (${val} factor). Institutions lack conviction at current levels.`;
}

export function scoreSystemLiquidity(surplus) {
    if (surplus === undefined || surplus === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(surplus); // In Lakh Crores
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    if (num > 2.0) { score = 100; bias = 'Strong Bullish'; } // 2 Lakh Cr surplus
    else if (num > 0.5) { score = 75; bias = 'Bullish'; }
    else if (num > -0.5) { score = 50; bias = 'Neutral'; }
    else if (num > -2.0) { score = 25; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 85 };
}
export function generateAiInsightSystemLiquidity(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "System liquidity data unavailable.";
    if (scoreObj.score >= 75) return `Banking surplus of ₹${val}L Cr. Abundant liquidity historically bleeds into risk assets like equities.`;
    if (scoreObj.score <= 25) return `Severe deficit of ₹${val}L Cr. Banks are scrambling for funds, choking off market liquidity.`;
    return `System liquidity is perfectly balanced near ₹${val}L Cr, allowing orderly transmission of RBI policy.`;
}

export function scoreMFFlows(sip) {
    if (sip === undefined || sip === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(sip); // SIP flows in Rs Crores
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    if (num > 18000) { score = 100; bias = 'Strong Bullish'; }
    else if (num > 15000) { score = 80; bias = 'Bullish'; }
    else if (num > 12000) { score = 50; bias = 'Neutral'; }
    else if (num > 8000) { score = 20; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 95 };
}
export function generateAiInsightMFFlows(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "MF SIP data unavailable.";
    if (scoreObj.score >= 80) return `Retail SIP behemoth at ₹${val} Cr/month. Provides an indestructible bid beneath the market during FII selloffs.`;
    if (scoreObj.score <= 20) return `Retail flows collapsing to ₹${val} Cr. The strongest domestic pillar supporting the market is cracking.`;
    return `Consistent retail participation at ₹${val} Cr provides a stable, predictable floor for domestic equities.`;
}

export function scoreSectorValuationSpread(spread) {
    if (spread === undefined || spread === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(spread); // standard deviation of sector PEs
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    
    let score = 50; let bias = 'Neutral';
    // Lower dispersion means broad participation, high means bubble in specific sectors
    if (num < 10) { score = 90; bias = 'Bullish'; }
    else if (num < 15) { score = 50; bias = 'Neutral'; }
    else { score = 20; bias = 'Bearish'; }
    return { score, bias, confidence: 75 };
}
export function generateAiInsightSectorValuationSpread(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Spread data unavailable.";
    if (scoreObj.score >= 80) return `Low valuation spread (${val}). The rally is incredibly broad and structurally sound across all sectors.`;
    if (scoreObj.score <= 20) return `Extreme spread (${val}). A few sectors are in bubble territory while the rest of the market languishes.`;
    return `Valuation dispersion (${val}) is normal. Capital is rotating cleanly between growth and value sectors.`;
}

export function scoreSectorGrowthDifferential(diff) {
    if (diff === undefined || diff === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(diff); 
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    let score = 50; let bias = 'Neutral';
    if (num > 0) { score = 75; bias = 'Bullish'; } // Growth leading
    else { score = 25; bias = 'Bearish'; } // Laggards leading
    return { score, bias, confidence: 70 };
}
export function generateAiInsightSectorGrowthDifferential(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `High-beta growth sectors are leading the market, confirming a strong risk-on environment.`;
    return `Defensive laggards are outperforming. This is a classic late-cycle or risk-aversion signal.`;
}

export function scoreSectorConcentration(top3Weight) {
    if (top3Weight === undefined || top3Weight === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(top3Weight);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    let score = 50; let bias = 'Neutral';
    if (num < 45) { score = 90; bias = 'Bullish'; }
    else if (num < 55) { score = 50; bias = 'Neutral'; }
    else { score = 15; bias = 'Bearish'; }
    return { score, bias, confidence: 85 };
}
export function generateAiInsightSectorConcentration(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `Top 3 sectors only hold ${val}% weight. Excellent diversification mitigates systemic shock risks.`;
    return `Dangerous concentration: Top 3 sectors control ${val}% of the index. A shock to one sector drags down the entire market.`;
}

export function scoreCyclicalDefensive(ratio) {
    if (ratio === undefined || ratio === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(ratio);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    let score = 50; let bias = 'Neutral';
    if (num > 1.2) { score = 90; bias = 'Bullish'; }
    else if (num > 0.9) { score = 50; bias = 'Neutral'; }
    else { score = 20; bias = 'Bearish'; }
    return { score, bias, confidence: 80 };
}
export function generateAiInsightCyclicalDefensive(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `Ratio of ${val}. Smart money is aggressively accumulating cyclical risk assets over safe-haven defensives.`;
    return `Ratio of ${val}. Capital is fleeing to defensive sectors (FMCG/Pharma), signaling impending macroeconomic fear.`;
}

export function scoreBankCreditGrowth(growth) {
    if (growth === undefined || growth === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(growth);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    let score = 50; let bias = 'Neutral';
    if (num > 15) { score = 100; bias = 'Strong Bullish'; }
    else if (num > 12) { score = 80; bias = 'Bullish'; }
    else if (num > 9) { score = 50; bias = 'Neutral'; }
    else if (num > 5) { score = 20; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 90 };
}
export function generateAiInsightBankCreditGrowth(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score >= 80) return `Roaring ${val}% credit growth. Capex cycle is firing on all cylinders, driving multiplier effects.`;
    if (scoreObj.score <= 20) return `Anemic ${val}% credit growth. Banks are risk-averse and the corporate capex cycle is dead.`;
    return `Credit growing steadily at ${val}%, adequately supporting nominal GDP expansion without overheating.`;
}

export function scoreAggregateCorporateDebt(debtGdp) {
    if (debtGdp === undefined || debtGdp === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(debtGdp);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    let score = 50; let bias = 'Neutral';
    if (num < 45) { score = 90; bias = 'Bullish'; }
    else if (num < 55) { score = 50; bias = 'Neutral'; }
    else { score = 15; bias = 'Bearish'; }
    return { score, bias, confidence: 85 };
}
export function generateAiInsightAggregateCorporateDebt(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `Deleveraged balance sheets (${val}% of GDP) mean corporate India can easily absorb massive rate shocks.`;
    return `Dangerous leverage (${val}% of GDP). The aggregate corporate sector is highly vulnerable to refinancing risks.`;
}

export function scorePolicyTailwinds(score) {
    if (score === undefined || score === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(score); // 0-10 scale
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    let finalScore = num * 10;
    return { 
        score: finalScore, 
        bias: finalScore > 60 ? 'Bullish' : (finalScore < 40 ? 'Bearish' : 'Neutral'), 
        confidence: 70 
    };
}
export function generateAiInsightPolicyTailwinds(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "Data unavailable.";
    if (scoreObj.score >= 70) return `Massive sovereign policy support (PLI, capex) providing an artificial floor to specific sectors.`;
    return `Regulatory environment is currently passive with minimal structural tailwinds.`;
}

export function scoreCrudeOil(crude) {
    if (crude === undefined || crude === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(crude);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    let score = 50; let bias = 'Neutral';
    if (num < 65) { score = 100; bias = 'Strong Bullish'; }
    else if (num < 75) { score = 80; bias = 'Bullish'; }
    else if (num < 85) { score = 50; bias = 'Neutral'; }
    else if (num < 95) { score = 20; bias = 'Bearish'; }
    else { score = 0; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 95 };
}
export function generateAiInsightCrudeOil(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score >= 80) return `Brent at $${val}/bbl acts as a massive tax cut for India, significantly compressing the trade deficit.`;
    if (scoreObj.score <= 20) return `Brent at $${val}/bbl imports severe inflation, destroys corporate margins, and wrecks the INR.`;
    return `Brent at $${val}/bbl is within India's comfort zone and easily absorbed by the current macro framework.`;
}

export function scoreUSDINR(usdinr) {
    if (usdinr === undefined || usdinr === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(usdinr);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    // This requires a proxy for "stability". For simplicity we assume < 82 is bullish, > 84 is bearish
    let score = 50; let bias = 'Neutral';
    if (num < 81) { score = 90; bias = 'Bullish'; }
    else if (num < 83.5) { score = 50; bias = 'Neutral'; }
    else { score = 15; bias = 'Bearish'; }
    return { score, bias, confidence: 85 };
}
export function generateAiInsightUSDINR(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `Strong INR (${val}) prevents imported inflation and protects FII dollar-denominated returns.`;
    if (scoreObj.score < 50) return `Depreciating INR (${val}) triggers FII panic selling to protect dollar-adjusted portfolio returns.`;
    return `INR is highly stable at ${val}, artificially managed by RBI intervention to prevent volatility shocks.`;
}

export function scoreGlobalLiquidity(stance) {
    if (!stance) return { score: 0, bias: 'Unknown', confidence: 0 };
    const s = stance.toLowerCase();
    if (s.includes('easing') || s.includes('qe')) return { score: 100, bias: 'Strong Bullish', confidence: 90 };
    if (s.includes('neutral')) return { score: 50, bias: 'Neutral', confidence: 90 };
    if (s.includes('tightening') || s.includes('qt')) return { score: 10, bias: 'Bearish', confidence: 90 };
    return { score: 50, bias: 'Neutral', confidence: 50 };
}
export function generateAiInsightGlobalLiquidity(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score >= 80) return `Global central banks are flooding the system with liquidity. Emerging markets like India will see massive inflows.`;
    if (scoreObj.score <= 20) return `Aggressive global QT is sucking dollar liquidity from emerging markets, forcing structural derating.`;
    return `Global liquidity conditions are neutral. Fed is on hold.`;
}

export function scoreSovereignRisk(cds) {
    if (cds === undefined || cds === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(cds); // basis points
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    let score = 50; let bias = 'Neutral';
    if (num < 100) { score = 90; bias = 'Bullish'; }
    else if (num < 150) { score = 50; bias = 'Neutral'; }
    else { score = 10; bias = 'Bearish'; }
    return { score, bias, confidence: 80 };
}
export function generateAiInsightSovereignRisk(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score > 50) return `CDS at ${val} bps indicates zero structural sovereign risk. Foreign capital views India as a safe haven.`;
    return `Spike in CDS (${val} bps) signals global institutional fear regarding India's macroeconomic stability.`;
}

export function scoreNPA(npa) {
    if (npa === undefined || npa === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(npa);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    let score = 50; let bias = 'Neutral';
    if (num < 3.0) { score = 100; bias = 'Strong Bullish'; }
    else if (num < 5.0) { score = 75; bias = 'Bullish'; }
    else if (num < 7.0) { score = 40; bias = 'Bearish'; }
    else { score = 10; bias = 'Strong Bearish'; }
    return { score, bias, confidence: 95 };
}
export function generateAiInsightNPA(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score >= 75) return `Decade-best asset quality (GNPA ${val}%). Banks have completely cleaned up balance sheets for the next cycle.`;
    if (scoreObj.score <= 25) return `Toxic asset quality (GNPA ${val}%). Banking system is paralyzed and cannot fund economic growth.`;
    return `Asset quality at ${val}% is manageable with adequate provisioning buffers in place.`;
}

export function scoreReformMomentum(momentum) {
    if (momentum === undefined || momentum === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(momentum); // 0-10 scale
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };
    let finalScore = num * 10;
    return { 
        score: finalScore, 
        bias: finalScore > 60 ? 'Bullish' : (finalScore < 40 ? 'Bearish' : 'Neutral'), 
        confidence: 70 
    };
}
export function generateAiInsightReformMomentum(scoreObj, val) {
    if (scoreObj.score === 0) return "Data unavailable.";
    if (scoreObj.score >= 70) return `High structural reform momentum triggers long-term FII upgrades and raises potential GDP growth ceilings.`;
    return `Policy paralysis. Lack of structural reform indicates long-term growth ceilings may be permanently capped.`;
}

export function scoreFIIFlow(val) {
    if (val === undefined || val === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(val);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };

    let score = 50;
    let bias = 'Neutral';

    if (num > 5000) { score = 90; bias = 'Strong Bullish'; }
    else if (num > 1000) { score = 75; bias = 'Bullish'; }
    else if (num > 0) { score = 60; bias = 'Mild Bullish'; }
    else if (num > -1000) { score = 40; bias = 'Mild Bearish'; }
    else if (num > -5000) { score = 25; bias = 'Bearish'; }
    else { score = 10; bias = 'Strong Bearish'; }

    return { score, bias, confidence: 90 };
}

export function generateAiInsightFIIFlow(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "FII flow data is unavailable.";
    if (scoreObj.score >= 75) return `Strong FII buying of ₹${val} Cr indicates robust foreign confidence.`;
    if (scoreObj.score <= 25) return `Heavy FII selling of ₹${val} Cr presents a significant liquidity headwind.`;
    return `FII flows of ₹${val} Cr are relatively muted, showing no clear aggressive positioning.`;
}

export function scoreDIIFlow(val) {
    if (val === undefined || val === null) return { score: 0, bias: 'Unknown', confidence: 0 };
    const num = Number(val);
    if (isNaN(num)) return { score: 0, bias: 'Unknown', confidence: 0 };

    let score = 50;
    let bias = 'Neutral';

    if (num > 5000) { score = 90; bias = 'Strong Bullish'; }
    else if (num > 1000) { score = 75; bias = 'Bullish'; }
    else if (num > 0) { score = 60; bias = 'Mild Bullish'; }
    else if (num > -1000) { score = 40; bias = 'Mild Bearish'; }
    else if (num > -5000) { score = 25; bias = 'Bearish'; }
    else { score = 10; bias = 'Strong Bearish'; }

    return { score, bias, confidence: 90 };
}

export function generateAiInsightDIIFlow(scoreObj, val) {
    if (scoreObj.score === 0 && scoreObj.bias === 'Unknown') return "DII flow data is unavailable.";
    if (scoreObj.score >= 75) return `Strong DII buying of ₹${val} Cr provides excellent domestic support to the market.`;
    if (scoreObj.score <= 25) return `DII selling of ₹${val} Cr removes a key pillar of domestic market support.`;
    return `DII flows of ₹${val} Cr are relatively neutral, providing stable but unaggressive support.`;
}
