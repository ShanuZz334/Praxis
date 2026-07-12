export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

export function scoreADRatio(adRatio) {
    if (adRatio === null || isNaN(adRatio)) {
        return { score: 50, bias: 'Neutral', confidence: 0, breadthZone: 'Unknown', signalType: 'No Data' };
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
        return { score: 50, bias: 'Neutral', confidence: '0%', trendLabel: '--', cagr: null };
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
        return { score: 50, bias: 'Neutral', confidence: '0%', netFlow: null };
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
        return { score: 50, bias: 'Neutral', confidence: 60 };
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
        return { score: 50, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
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
        return { score: 50, bias: 'Neutral', confidence: 0, optionsBias: 'Unknown', signalStrength: 'No Data' };
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
        return { score: 50, bias: 'Neutral', confidence: 0, momentumDir: 'Unknown', signalZone: 'No Data' };
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
        return { score: 50, bias: 'Neutral', confidence: 0, dmaPosition: 'Unknown', distanceCategory: 'No Data' };
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
        return { score: 50, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
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
        return { score: 50, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
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
        return { score: 50, bias: 'Neutral', confidence: 60 };
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
        return { score: 50, bias: 'Neutral', confidence: '0%', calculatedCAGR: null, latestProfit: null, previousProfit: null };
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
        return { score: 50, bias: 'Neutral', confidence: '0%', calculatedCAGR: null, latestRevenue: null, previousRevenue: null };
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
        return { score: 50, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
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
        return { score: 50, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
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
        return { score: 50, bias: 'Neutral', confidence: 0, vixRegime: 'Unknown', marketCondition: 'No Data' };
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

