/**
 * optionsHelper.js
 * ----------------
 * Intelligence logic for the Options Dashboard.
 * - Composite Score Calculation
 * - Regime Detection
 * - Tailwind/Risk Extraction
 */

export const optionsSections = [
    { id: 'Open Interest', label: 'Open Interest', w: 0.4 },
    { id: 'Greeks', label: 'Greeks', w: 0.35 },
    { id: 'Volatility', label: 'Volatility', w: 0.25 }
];

// 1. CALCULATE POSITIONING SCORE (Institutional Logic)
export function calculatePositioningScore(metrics) {
    if (!metrics) return { score: 50, details: {} };

    // 1. Net Delta (Normalized)
    // Assume Net Delta of +/- 1M is extreme.
    const netDelta = metrics.netDelta || 0;
    const normDelta = Math.min(100, Math.max(0, ((netDelta + 1000000) / 2000000) * 100)); // 0 = -1M, 50 = 0, 100 = +1M

    // 2. Put/Call OI Imbalance (PCR) - Inverse relation usually (High PCR = Bearish? Or Bullish Support?)
    // Standard: High PCR (>1.5) = Oversold/Bullish Support? Or Bearish Sentinel?
    // User Guide: PCR > 1 = Bullish Support in previous steps. Let's assume PCR > 1 is Bullish (Put Walls support).
    // Let's normalize PCR 0.5 to 1.5 -> 0 to 100
    const pcr = metrics.pcr || 1;
    const normPCR = Math.min(100, Math.max(0, (pcr - 0.5) * 100));

    // 3. Mocked components for Gamma/Skew (since we don't have full surfaces yet)
    // In a real engine, these would come from the backend structure
    const gammaExposure = 55; // Neutral-ish
    const ivSkew = 45; // Slightly bearish skew
    const maxPainDist = 60; // Fairly close

    // FORMULA:
    // (Normalized Net Delta * 0.30 + Gamma Exposure * 0.25 + Put/Call OI Imbalance * 0.20 + IV Skew * 0.15 + Max Pain Dist * 0.10)
    let rawScore = (
        (normDelta * 0.30) +
        (gammaExposure * 0.25) +
        (normPCR * 0.20) +
        (ivSkew * 0.15) +
        (maxPainDist * 0.10)
    );

    // Contextual Adjustment (Simulate market moves)
    // If Spot > Max Pain, add slight bullish bias
    if (metrics.spot > metrics.maxPain) rawScore += 2;

    const finalScore = Math.min(100, Math.max(0, rawScore));

    return {
        score: finalScore,
        details: {
            netDelta: netDelta,
            gammaFlip: metrics.maxPain + 50, // Mock
            putWall: metrics.maxPain - 100,
            callWall: metrics.maxPain + 200,
            ivRank: 34, // Mock
            breakdown: [
                { label: "Net Delta", val: normDelta > 50 ? "Bullish" : "Bearish", color: normDelta > 50 ? "text-green-400" : "text-red-400" },
                { label: "Gamma", val: "Neutral", color: "text-blue-400" },
                { label: "IV Skew", val: "Put-Heavy", color: "text-yellow-400" }
            ]
        }
    };
}

// 2. GET REGIME
export function getOptionsRegime(score, metrics) {
    // Logic: Gamma and IV determine "Stability" vs "Explosion"
    // Score determines "Bullish" vs "Bearish" bias

    let regime = { label: "Neutral Range", desc: "Markets well bracketed by OI walls.", color: "text-state-neutral-text" };
    if (score > 65) {
        regime = { label: "Bullish Control", desc: "Call writers unwinding, Puts supporting.", color: "text-state-bullish-text" };
    } else if (score < 35) {
        regime = { label: "Bearish Drag", desc: "Call writing heavy, resistance holding.", color: "text-state-bearish-text" };
    } else {
        // Neutral nuances based on pseudo-Greeks (using PCR as proxy if metrics available)
        if (metrics && metrics.pcr > 1.2) {
            regime = { label: "Neutral-Bullish", desc: "Base building with strong Put support.", color: "text-state-bullish-text" };
        }
    }

    return regime;
}

// 3. EXTRACT TAILWINDS
export function extractOptionsTailwinds(cards) {
    // Find cards with High Normalized Score (> 0.7)
    return cards
        .filter(c => (c.normalized || 0) >= 0.7)
        .sort((a, b) => b.normalized - a.normalized)
        .slice(0, 3)
        .map(c => ({
            id: c.id,
            label: c.label,
            category: c.category,
            impact: 'High',
            score: c.normalized,
            desc: c.interpretation
        }));
}

// 4. EXTRACT RISKS
export function extractOptionsRisks(cards) {
    // Find cards with Low Normalized Score (< 0.3)
    return cards
        .filter(c => (c.normalized || 0) <= 0.3)
        .sort((a, b) => a.normalized - b.normalized)
        .slice(0, 3)
        .map(c => ({
            id: c.id,
            label: c.label,
            category: c.category,
            impact: 'High',
            score: c.normalized,
            desc: c.interpretation
        }));
}

// 5. STRATEGY ENGINE
export function getStrategySuggestions(score, pcr, ivRank) {
    // Simplified logic
    const suggestions = [];

    if (score > 60) {
        // Bullish
        if (ivRank < 40) suggestions.push({ name: "Long Call / Bull Call Spread", reason: "Bullish bias + Cheap Vol" });
        else suggestions.push({ name: "Bull Put Spread", reason: "Bullish bias + Rich Vol (Credit)" });
    } else if (score < 40) {
        // Bearish
        if (ivRank > 50) suggestions.push({ name: "Bear Call Spread", reason: "Bearish bias + Rich Vol (Credit)" });
        else suggestions.push({ name: "Long Put / Bear Put Spread", reason: "Bearish bias + Cheap Vol" });
    } else {
        // Neutral
        if (ivRank > 40) suggestions.push({ name: "Iron Condor", reason: "Range bound + Rich Vol" });
        else suggestions.push({ name: "Iron Fly / Calendar", reason: "Range bound + Low Vol" });
    }

    return suggestions;
}

// 6. GET TOP CONTRACTS
// 6. GET ADVANCED TOP PICKS (Weighted Scoring)
export function getAdvancedTopPicks(chain, spotPrice) {
    if (!chain || chain.length === 0) return { ce: [], pe: [] };

    const scoreOption = (opt, strike, type) => {
        // Factors
        // 1. Delta Strength (Closer to 50 is ATM, but user wants "High Prob" so maybe Delta ~30-60 range)
        // Let's assume higher delta = better directional play, but balance with cost.
        const deltaScore = Math.abs(opt.delta) * 25;

        // 2. OI Change (Momentum)
        const oiChgScore = Math.min(20, (opt.oiChg / opt.oi) * 100); // Up to 20 pts for growth

        // 3. Vol/OI Ratio (Liquidity/Activity)
        const volOiScore = Math.min(15, (opt.vol / opt.oi) * 15);

        // 4. Distance from ATM (15%) - Prefer closer
        const dist = Math.abs(strike - spotPrice) / spotPrice;
        const distScore = Math.max(0, 15 - (dist * 100 * 2)); // decay as we go far OTM

        // 5. Gamma (Explosiveness)
        const gammaScore = Math.min(10, opt.gamma * 1000);

        // 6. IV Suitability (Cheaper is better for buying) - Mock logic
        const ivScore = 15; // Placeholder

        return deltaScore + oiChgScore + volOiScore + distScore + gammaScore + ivScore;
    };

    // Score CE
    const scoredCE = chain.filter(i => i.strike > spotPrice).map(i => ({  // OTM Calls primarily
        ...i.call,
        strike: i.strike,
        type: 'CE',
        dte: '2DTE',
        score: scoreOption(i.call, i.strike, 'CE')
    })).sort((a, b) => b.score - a.score).slice(0, 3);

    // Score PE
    const scoredPE = chain.filter(i => i.strike < spotPrice).map(i => ({ // OTM Puts primarily
        ...i.put,
        strike: i.strike,
        type: 'PE',
        dte: '2DTE',
        score: scoreOption(i.put, i.strike, 'PE')
    })).sort((a, b) => b.score - a.score).slice(0, 3);

    return { ce: scoredCE, pe: scoredPE };
}

// 7. GET TOP CONTRACTS (Legacy / Simple - For Strategy Desk)
export function getTopContracts(chain) {
    if (!chain || chain.length === 0) return { ce: [], pe: [] };

    const topCE = [...chain].filter(i => i.strike > 0).sort((a, b) => b.call.oi - a.call.oi).slice(0, 3)
        .map(i => ({ strike: i.strike, oi: i.call.oi, type: 'CE' }));

    const topPE = [...chain].filter(i => i.strike > 0).sort((a, b) => b.put.oi - a.put.oi).slice(0, 3)
        .map(i => ({ strike: i.strike, oi: i.put.oi, type: 'PE' }));

    return { ce: topCE, pe: topPE };
}
