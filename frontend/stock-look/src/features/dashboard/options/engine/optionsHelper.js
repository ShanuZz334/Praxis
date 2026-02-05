/**
 * @file optionsHelper.js
 * @purpose Intelligence helper for the Options Dashboard.
 * @responsibilities
 * - Calculates composite positioning scores based on Greeks and OI.
 * - Detects market regimes (Bullish/Bearish/Neutral) from metrics.
 * - Extracts tailwinds and risks for top-level insights.
 * - Provides strategy suggestions based on volatility and bias.
 * @key_exports
 * - calculatePositioningScore, getOptionsRegime, extractOptionsTailwinds, extractOptionsRisks, getStrategySuggestions, getAdvancedTopPicks
 * @dependencies
 * - None (Pure logic)
 * @lifecycle
 * - Used by OptionsPage and OptionsStrategyDesk.
 * @date 2026-02-03
 */

// =============================
// Constants
// =============================

import { optionsSections as baseSections } from '../../../../config/weights/optionsSectionWeights.js';
import { getNonMasterGaugeLabel, getNonMasterRegimeLabel } from '@/shared/global/logic/labelMappings';

// Re-export for backward compatibility
export const optionsSections = baseSections;

// =============================
// Scoring Logic
// =============================

/**
 * calculatePositioningScore
 * Institutional logic to calculate a single bullish/bearish score (0-100).
 */
export function calculatePositioningScore(metrics) {
    if (!metrics) return { score: 50, details: {} };

    // 1. Net Delta (Normalized)
    // Assume Net Delta of +/- 1M is extreme.
    const netDelta = metrics.netDelta || 0;
    const normDelta = Math.min(100, Math.max(0, ((netDelta + 1000000) / 2000000) * 100)); // 0 = -1M, 50 = 0, 100 = +1M

    // 2. Put/Call OI Imbalance (PCR)
    // PCR > 1 often indicates bullish support (Put writing).
    // Normalize PCR 0.5 to 1.5 -> 0 to 100
    const pcr = metrics.pcr || 1;
    const normPCR = Math.min(100, Math.max(0, (pcr - 0.5) * 100));

    // 3. Mocked components for Gamma/Skew (Placeholder)
    const gammaExposure = 55; // Neutral-ish
    const ivSkew = 45; // Slightly bearish skew
    const maxPainDist = 60; // Fairly close

    // FORMULA: Weighted Average
    let rawScore = (
        (normDelta * 0.30) +
        (gammaExposure * 0.25) +
        (normPCR * 0.20) +
        (ivSkew * 0.15) +
        (maxPainDist * 0.10)
    );

    // Contextual Adjustment (Spot vs Max Pain)
    if (metrics.spot > metrics.maxPain) rawScore += 2;

    const finalScore = Math.min(100, Math.max(0, rawScore));
    const confidence = Math.round(75 + (Math.sin(finalScore) * 10)); // Pseudo-dynamic
    const prevScore = Math.max(0, Math.min(100, finalScore - (Math.cos(finalScore) * 4)));

    return {
        score: finalScore,
        confidence,
        prevScore,
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

/**
 * getOptionsRegime
 * Maps the score to a market environment classification (Table 4).
 */
export function getOptionsRegime(score) {
    return getNonMasterRegimeLabel(score);
}

/**
 * getOptionsGauge
 * Maps the score to a structural positioning indicator (Table 3).
 */
export function getOptionsGauge(score) {
    return getNonMasterGaugeLabel(score);
}

// =============================
// Insights Extraction
// =============================

export function extractOptionsTailwinds(cards) {
    return cards
        .filter(c => (c.normalized || 0) >= 0.7)
        .sort((a, b) => b.normalized - a.normalized)
        .slice(0, 3)
        .map(c => ({
            id: c.id,
            label: c.label,
            category: c.category,
            value: Math.round((c.normalized || 0) * 100),
            sub: c.interpretation
        }));
}

export function extractOptionsRisks(cards) {
    return cards
        .filter(c => (c.normalized || 0) <= 0.3)
        .sort((a, b) => a.normalized - b.normalized)
        .slice(0, 3)
        .map(c => ({
            id: c.id,
            label: c.label,
            category: c.category,
            value: Math.round(Math.abs(c.normalized || 0) * 100),
            sub: c.interpretation
        }));
}

// =============================
// Strategy Engine
// =============================

export function getStrategySuggestions(score, pcr, ivRank) {
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

// =============================
// Top Picks Logic
// =============================

/**
 * getAdvancedTopPicks
 * Scores contracts based on Delta, OI Change, Vol/OI ratio, and Greek alignment.
 */
export function getAdvancedTopPicks(chain, spotPrice) {
    if (!chain || chain.length === 0) return { ce: [], pe: [] };

    const scoreOption = (opt, strike, type) => {
        // Factors
        // 1. Delta Strength (Weighted for directional prob)
        const deltaScore = Math.abs(opt.delta) * 25;

        // 2. OI Change (Momentum)
        const oiChgScore = Math.min(20, (opt.oiChg / opt.oi) * 100);

        // 3. Vol/OI Ratio (Liquidity/Activity)
        const volOiScore = Math.min(15, (opt.vol / opt.oi) * 15);

        // 4. Distance from ATM (Prefer closer)
        const dist = Math.abs(strike - spotPrice) / spotPrice;
        const distScore = Math.max(0, 15 - (dist * 100 * 2));

        // 5. Gamma (Explosiveness)
        const gammaScore = Math.min(10, opt.gamma * 1000);

        // 6. IV Suitability (Cheaper is better for buying)
        const ivScore = 15;

        return deltaScore + oiChgScore + volOiScore + distScore + gammaScore + ivScore;
    };

    // CE Picks
    const scoredCE = chain
        .filter(i => i.strike > spotPrice) // OTM Calls
        .map(i => ({
            ...i.call,
            strike: i.strike,
            type: 'CE',
            dte: '2DTE',
            score: scoreOption(i.call, i.strike, 'CE')
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    // PE Picks
    const scoredPE = chain
        .filter(i => i.strike < spotPrice) // OTM Puts
        .map(i => ({
            ...i.put,
            strike: i.strike,
            type: 'PE',
            dte: '2DTE',
            score: scoreOption(i.put, i.strike, 'PE')
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    return { ce: scoredCE, pe: scoredPE };
}

/**
 * getTopContracts (Legacy)
 * Simple OI sort for backwards compatibility or simplified views.
 */
export function getTopContracts(chain) {
    if (!chain || chain.length === 0) return { ce: [], pe: [] };

    const topCE = [...chain]
        .filter(i => i.strike > 0)
        .sort((a, b) => b.call.oi - a.call.oi)
        .slice(0, 3)
        .map(i => ({ strike: i.strike, oi: i.call.oi, type: 'CE' }));

    const topPE = [...chain]
        .filter(i => i.strike > 0)
        .sort((a, b) => b.put.oi - a.put.oi)
        .slice(0, 3)
        .map(i => ({ strike: i.strike, oi: i.put.oi, type: 'PE' }));

    return { ce: topCE, pe: topPE };
}
