/**
 * @file proDeskEngine.js
 * @purpose Institutional-grade Options ProDesk Engine.
 *
 * ENGINE ARCHITECTURE
 * ───────────────────
 * This engine replaces all fixed-rupee biases with dynamic, asset-scale-independent
 * quantitative models. It is designed to work accurately across the full NSE F&O
 * universe — from ₹50 micro-caps to ₹3,000 large-caps and 25,000-level index options.
 *
 * SCORING STACK (per contract)
 * ────────────────────────────
 *   S_contract = (0.30·Q_greeks + 0.25·I_flow + 0.20·L_depth + 0.15·V_pricing + 0.10·M_confluence) × κ(d)
 *
 *   1. Q_greeks   — Greek Quality & Efficiency (GTE + Delta Optimality + POP)
 *   2. I_flow     — Institutional Flow via 4-Quadrant Order Flow Matrix
 *   3. L_depth    — Microstructure Liquidity Depth (vol/OI/rupee turnover)
 *   4. V_pricing  — IV Mispricing / Volatility Skew vs ATM baseline
 *   5. M_conflu   — Max Pain proximity confluence bonus
 *   κ(d)          — Expected Move proximity decay (non-linear boundary)
 *
 * TIER SYSTEM
 * ───────────
 * The dropdown's 5 numeric values (15, 30, 45, 80, 150) are mapped to target |Δ| bands
 * that are asset-scale-independent. The engine never uses the raw rupee value as a
 * premium comparison target.
 *
 * EXPORTS
 * ───────
 *   generateProDeskPicks(chain, spotPrice, idealPremium, expiryDateStr)
 *     → { goldenStrikes: { calls, puts }, categories: { bullish, bearish, atm, momentum, liquidity } }
 */

import { calculateGreeks, timeToExpiry } from './blackScholesEngine.js';

// ─── Tier Config ─────────────────────────────────────────────────────────────
/**
 * Maps the 5 dropdown numeric values to delta-band targets.
 * These are institutional-grade delta tiers, independent of absolute price level.
 */
const TIER_MAP = {
    15:  { name: 'Deep OTM (Convexity)',    deltaLow: 0.10, deltaHigh: 0.22, deltaTarget: 0.16, sigmaWidth: 0.06 },
    30:  { name: 'Retail Sweet (Velocity)', deltaLow: 0.22, deltaHigh: 0.38, deltaTarget: 0.30, sigmaWidth: 0.07 },
    45:  { name: 'Balanced (Institutional)',deltaLow: 0.38, deltaHigh: 0.56, deltaTarget: 0.47, sigmaWidth: 0.08 },
    80:  { name: 'High Delta (Synthetic)',   deltaLow: 0.56, deltaHigh: 0.78, deltaTarget: 0.67, sigmaWidth: 0.08 },
    150: { name: 'ITM Safe (Conservative)', deltaLow: 0.78, deltaHigh: 0.95, deltaTarget: 0.86, sigmaWidth: 0.06 },
};

function getTierConfig(idealPremium) {
    const key = [15, 30, 45, 80, 150].reduce((prev, curr) =>
        Math.abs(curr - idealPremium) < Math.abs(prev - idealPremium) ? curr : prev
    );
    return TIER_MAP[key] || TIER_MAP[45];
}

// ─── 4-Quadrant Order Flow Matrix ────────────────────────────────────────────
/**
 * Classifies each contract's institutional order flow using:
 *   Long Build-Up:    ΔPrice > 0 & ΔOI > 0  → Fresh bullish accumulation  (score 95)
 *   Short Covering:   ΔPrice > 0 & ΔOI < 0  → Trapped shorts covering     (score 80)
 *   Short Build-Up:   ΔPrice < 0 & ΔOI > 0  → Institutional supply/write  (score 30)
 *   Long Unwinding:   ΔPrice < 0 & ΔOI < 0  → Position liquidation        (score 15)
 *   Stale / No Trade: ΔPrice ≈ 0 or Vol ≈ 0 → Illiquid / no signal        (score 40)
 *
 * Returns: { quadrant: string, flowScore: number [0-100] }
 */
function classifyOrderFlow(data) {
    const deltaPrice = (data.ltp || 0) - (data.close || data.ltp || 0);
    const deltaOI = data.oiChg ?? 0;
    const vol = data.vol ?? 0;

    // If no volume, contract is effectively stale for flow purposes
    if (vol < 10) return { quadrant: 'NO_DATA', flowScore: 40, label: 'Stale' };

    const priceUp = deltaPrice > 0.005 * (data.ltp || 1); // > 0.5% move to confirm
    const priceDown = deltaPrice < -0.005 * (data.ltp || 1);
    const oiUp = deltaOI > 0;
    const oiDown = deltaOI < 0;

    if (priceUp && oiUp)   return { quadrant: 'LONG_BUILDUP',   flowScore: 95, label: 'LONG BUILD-UP' };
    if (priceUp && oiDown) return { quadrant: 'SHORT_COVERING',  flowScore: 80, label: 'SHORT COVERING' };
    if (priceDown && oiUp) return { quadrant: 'SHORT_BUILDUP',   flowScore: 30, label: 'SHORT BUILD-UP' };
    if (priceDown && oiDown) return { quadrant: 'LONG_UNWINDING', flowScore: 15, label: 'LONG UNWINDING' };

    return { quadrant: 'NEUTRAL', flowScore: 50, label: 'NEUTRAL' };
}

// ─── Main Engine ──────────────────────────────────────────────────────────────
/**
 * @param {Array}  chain          - Options chain array [{ strike, call:{ltp,oi,vol,...}, put:{...} }]
 * @param {number} spotPrice      - Live underlying spot price
 * @param {number} idealPremium   - Dropdown tier value (15 | 30 | 45 | 80 | 150)
 * @param {string} [expiryDateStr]- Expiry date string e.g. "2026-09-25" (used for DTE)
 */
export const generateProDeskPicks = (chain, spotPrice, idealPremium = 45, expiryDateStr = null) => {
    const EMPTY_RESULT = {
        goldenStrikes: { calls: [], puts: [] },
        categories: { bullish: null, bearish: null, atm: null, momentum: null, liquidity: null }
    };

    if (!chain || chain.length === 0 || !spotPrice || spotPrice <= 0) return EMPTY_RESULT;

    // ── Step 1: Core Constants ────────────────────────────────────────────────
    const tierConfig = getTierConfig(idealPremium);
    const T = expiryDateStr ? timeToExpiry(expiryDateStr) : Math.max(1 / 365, 7 / 365); // fallback 7-day DTE

    // Step size (e.g. 50 for NIFTY, 100 for BANKNIFTY, 10 for equity)
    const sortedStrikes = chain.map(r => r.strike).sort((a, b) => a - b);
    const stepSize = sortedStrikes.length > 1
        ? Math.abs(sortedStrikes[1] - sortedStrikes[0])
        : 50;

    // ── Step 2: ATM Row & Baseline IV ────────────────────────────────────────
    let atmRow = null;
    let minDiff = Infinity;
    chain.forEach(row => {
        const diff = Math.abs(row.strike - spotPrice);
        if (diff < minDiff) { minDiff = diff; atmRow = row; }
    });

    const atmIvCall = (atmRow?.call?.iv || atmRow?.iv || 15);
    const atmIvPut  = (atmRow?.put?.iv  || atmRow?.iv || 15);
    const atmIv     = (atmIvCall + atmIvPut) / 2;
    const atmIvDec  = atmIv / 100;

    // Expected Move (1σ lognormal boundary)
    const em1Sigma = spotPrice * atmIvDec * Math.sqrt(T);

    // ── Step 3: Chain Normalization Anchors ───────────────────────────────────
    let maxCallOI = 1, maxCallVol = 1, maxPutOI = 1, maxPutVol = 1;
    let allLtpVol = [];

    chain.forEach(row => {
        if (row.call) {
            if ((row.call.oi || 0) > maxCallOI) maxCallOI = row.call.oi;
            if ((row.call.vol || 0) > maxCallVol) maxCallVol = row.call.vol;
            if ((row.call.ltp || 0) > 0 && (row.call.vol || 0) > 0) {
                allLtpVol.push(row.call.ltp * row.call.vol);
            }
        }
        if (row.put) {
            if ((row.put.oi || 0) > maxPutOI) maxPutOI = row.put.oi;
            if ((row.put.vol || 0) > maxPutVol) maxPutVol = row.put.vol;
            if ((row.put.ltp || 0) > 0 && (row.put.vol || 0) > 0) {
                allLtpVol.push(row.put.ltp * row.put.vol);
            }
        }
    });

    allLtpVol.sort((a, b) => a - b);
    const turnoverMedian = allLtpVol.length > 0
        ? allLtpVol[Math.floor(allLtpVol.length / 2)]
        : 1;

    // ── Step 4: Per-Contract Scoring ─────────────────────────────────────────
    /**
     * Returns a scored contract object or null if contract is too illiquid.
     */
    const scoreContract = (data, isCall, strike) => {
        if (!data || (data.ltp || 0) < 0.50 || (data.oi || 0) < 5) return null;

        const distanceSteps = Math.abs(strike - spotPrice) / stepSize;
        // Hard cutoff: do not score options > 18 strikes from spot (off-screen, irrelevant)
        if (distanceSteps > 18) return null;

        const type = isCall ? 'call' : 'put';
        const iv = data.iv || atmIv;
        const ivDec = Math.max(0.001, iv / 100);

        // ── Resolve Delta (live Upstox → B-S fallback) ───────────────────────
        let delta, gamma, theta;
        if (data.delta !== undefined && data.delta !== null && data.delta !== 0) {
            delta = isCall ? Math.abs(data.delta) : Math.abs(data.delta);
            gamma = data.gamma || 0;
            theta = data.theta || 0;
        } else {
            // Compute via Black-Scholes
            const bsGreeks = calculateGreeks(spotPrice, strike, T, 0.068, ivDec, type, 0.012);
            delta = Math.abs(bsGreeks.delta);
            gamma = bsGreeks.gamma;
            theta = bsGreeks.theta;
        }

        const ltp = data.ltp;
        const oi  = data.oi  || 0;
        const vol = data.vol || 0;
        const mOI  = isCall ? maxCallOI  : maxPutOI;
        const mVol = isCall ? maxCallVol : maxPutVol;

        // ── 1. Greek Quality (Q_greeks, 30%) ─────────────────────────────────
        // a) GTE — Gamma-to-Theta Efficiency: directional acceleration per ₹ of daily bleed
        const gte = (gamma * spotPrice) / (Math.abs(theta) + 1e-5);
        // Normalise GTE against a target of 0.5 (reasonable baseline for NSE options)
        const gteNorm = Math.min(100, (gte / 0.5) * 100);

        // b) Delta Optimality (Gaussian centred on tier target delta)
        const sigDelta = tierConfig.sigmaWidth;
        const sDelta = 100 * Math.exp(-Math.pow(delta - tierConfig.deltaTarget, 2) / (2 * sigDelta * sigDelta));

        // c) POP — Probability of expiring ITM using d2 from B-S
        let pop = 50; // default neutral
        if (T > 0 && ivDec > 0) {
            const d2 = (Math.log(spotPrice / strike) + (0.068 - 0.012 - 0.5 * ivDec * ivDec) * T)
                       / (ivDec * Math.sqrt(T));
            // High-precision normal CDF (Abramowitz-Stegun, matches blackScholesEngine.js)
            const cndD2 = (() => {
                const x = isCall ? d2 : -d2;
                if (x < -10) return 0;
                if (x > 10) return 1;
                const sign = x >= 0 ? 1 : -1;
                const absX = Math.abs(x);
                const p = 0.2316419, b1 = 0.319381530, b2 = -0.356563782,
                      b3 = 1.781477937, b4 = -1.821255978, b5 = 1.330274429;
                const t_ = 1.0 / (1.0 + p * absX);
                const t2 = t_*t_, t3=t2*t_, t4=t3*t_, t5=t4*t_;
                const poly = b1*t_ + b2*t2 + b3*t3 + b4*t4 + b5*t5;
                const pdf  = Math.exp(-0.5*absX*absX) / Math.sqrt(2*Math.PI);
                const r = 1.0 - pdf * poly;
                return sign === 1 ? r : 1.0 - r;
            })();
            pop = Math.min(100, Math.max(0, cndD2 * 100));
        }

        const qGreeks = 0.40 * sDelta + 0.35 * gteNorm + 0.25 * pop;

        // ── 2. Institutional Flow (I_flow, 25%) ──────────────────────────────
        const flow = classifyOrderFlow(data);
        // Volume-to-OI velocity: captures rapid institutional turnover
        const vVelocity = vol / (oi + 1);
        const vVelocityScore = Math.min(100, vVelocity * 40);
        const iFlow = 0.60 * flow.flowScore + 0.40 * vVelocityScore;

        // ── 3. Microstructure Liquidity Depth (L_depth, 20%) ─────────────────
        const normOI  = Math.min(100, (oi / mOI) * 100);
        const normVol = Math.min(100, (vol / mVol) * 100);
        const rupeeTurnover = ltp * vol;
        const turnoverScore = Math.min(100, (rupeeTurnover / (turnoverMedian + 1)) * 50);
        const lDepth = 0.45 * normVol + 0.35 * normOI + 0.20 * turnoverScore;

        // ── 4. IV Mispricing / Skew (V_pricing, 15%) ─────────────────────────
        const ivRatio = iv / (atmIv + 1e-5);
        // Fair zone: 0.80–1.40× ATM IV. Reward cheap; heavily penalise rich IV.
        let vPricing;
        if (ivRatio < 0.80)      vPricing = 80;          // Discounted IV — accumulation opportunity
        else if (ivRatio <= 1.20) vPricing = 100;         // Fair value zone
        else if (ivRatio <= 1.50) vPricing = 70;          // Slightly elevated — moderate penalty
        else if (ivRatio <= 2.00) vPricing = 35;          // Retail overpayment zone
        else                      vPricing = 10;           // Extreme skew — high crush risk

        // ── 5. Expected Move Proximity κ(d) — boundary decay ─────────────────
        // Smooth decay for strikes beyond 1.8σ EM boundary
        const distFromSpot = Math.abs(strike - spotPrice);
        const sigmaUnits = em1Sigma > 0 ? distFromSpot / em1Sigma : 0;
        let kappa;
        if (sigmaUnits <= 1.0)      kappa = 1.00;
        else if (sigmaUnits <= 1.5) kappa = 1.00 - 0.15 * (sigmaUnits - 1.0) / 0.5;
        else if (sigmaUnits <= 1.8) kappa = 0.85 - 0.30 * (sigmaUnits - 1.5) / 0.3;
        else if (sigmaUnits <= 2.5) kappa = 0.55 - 0.40 * (sigmaUnits - 1.8) / 0.7;
        else                        kappa = Math.max(0.05, 0.15 - 0.10 * (sigmaUnits - 2.5));

        // ── Base Score ────────────────────────────────────────────────────────
        // Note: M_confluence (10%) is handled by kappa already; we fold max-pain
        // bonus in here as a 5-point additive if within 1 step of ATM (approximation
        // since max pain requires full chain OI — caller can pass if available)
        const atmBonus = distanceSteps <= 1 ? 5 : 0;
        const baseScore = (
            0.30 * qGreeks +
            0.25 * iFlow +
            0.20 * lDepth +
            0.15 * vPricing +
            atmBonus
        );

        const finalScore = Math.min(100, Math.max(0, baseScore * kappa));

        return {
            // Chain data passthrough
            ...data,
            strike,
            type,
            // Computed enrichment
            score: Math.round(finalScore),
            delta: isCall ? delta : -delta,       // signed delta
            absDelta: delta,
            gamma,
            theta,
            pop: Math.round(pop),
            gte: parseFloat(gte.toFixed(4)),
            flow,                                   // { quadrant, flowScore, label }
            kappa: parseFloat(kappa.toFixed(3)),
            sigmaUnits: parseFloat(sigmaUnits.toFixed(2)),
            iv,
            // Sub-scores for transparency
            scoreBreakdown: {
                greeks:    Math.round(qGreeks),
                flow:      Math.round(iFlow),
                liquidity: Math.round(lDepth),
                pricing:   Math.round(vPricing),
                kappa:     parseFloat(kappa.toFixed(3)),
            }
        };
    };

    // ── Step 5: Score all contracts ───────────────────────────────────────────
    const scoredContracts = [];
    chain.forEach(row => {
        const ce = scoreContract(row.call, true, row.strike);
        if (ce) scoredContracts.push(ce);
        const pe = scoreContract(row.put, false, row.strike);
        if (pe) scoredContracts.push(pe);
    });

    if (scoredContracts.length === 0) return EMPTY_RESULT;

    scoredContracts.sort((a, b) => b.score - a.score);

    const allCalls = scoredContracts.filter(o => o.type === 'call');
    const allPuts  = scoredContracts.filter(o => o.type === 'put');

    // ── Step 6: Categorical Pick Selection ───────────────────────────────────

    // ── 6a. Best Bullish Call ─────────────────────────────────────────────────
    // Must be: call, delta in [0.20, 0.68], long build-up preferred, GTE > 0
    const bullishCandidates = allCalls.filter(o =>
        o.absDelta >= 0.18 && o.absDelta <= 0.70 &&
        o.ltp > 0
    );
    // Prefer Long Build-Up; then fall back to highest overall score
    const bullishByFlow = bullishCandidates.filter(o => o.flow.quadrant === 'LONG_BUILDUP');
    const bullishPick = (bullishByFlow.length > 0 ? bullishByFlow : bullishCandidates)[0] || null;

    // ── 6b. Best Bearish Put ──────────────────────────────────────────────────
    // Must be: put, |delta| in [0.20, 0.68], Long Build-Up on put preferred
    const bearishCandidates = allPuts.filter(o =>
        o.absDelta >= 0.18 && o.absDelta <= 0.70 &&
        o.ltp > 0
    );
    const bearishByFlow = bearishCandidates.filter(o => o.flow.quadrant === 'LONG_BUILDUP');
    const bearishPick = (bearishByFlow.length > 0 ? bearishByFlow : bearishCandidates)[0] || null;

    // ── 6c. Best ATM Trade ────────────────────────────────────────────────────
    // True ATM: strike closest to spot, delta ≈ ±0.50 (strictly within 1 strike step)
    // Compare the ATM Call vs ATM Put and pick the one with stronger institutional flow
    const atmCandidates = scoredContracts.filter(o => {
        const dist = Math.abs(o.strike - spotPrice) / stepSize;
        return dist <= 1 && o.absDelta >= 0.35 && o.absDelta <= 0.65;
    });
    // Sort ATM candidates by flow score then overall score
    atmCandidates.sort((a, b) =>
        (b.flow.flowScore * 0.6 + b.score * 0.4) - (a.flow.flowScore * 0.6 + a.score * 0.4)
    );
    const atmPick = atmCandidates[0] || null;

    // ── 6d. Top Momentum ──────────────────────────────────────────────────────
    // Fastest-rotating institutional position (highest V/OI velocity + pct change)
    // Exclude already picked strikes to avoid repetition
    const pickedStrikes = new Set([
        bullishPick?.strike,
        bearishPick?.strike,
        atmPick?.strike,
    ].filter(Boolean));

    const momentumCandidates = scoredContracts
        .filter(o =>
            !pickedStrikes.has(o.strike) &&
            o.absDelta >= 0.12 &&
            (o.vol || 0) >= 10                          // must have actual volume
        )
        .sort((a, b) => {
            // Momentum composite: V/OI velocity + flow score + absolute pct change
            const volturnA = (a.vol || 0) / ((a.oi || 0) + 1);
            const volturnB = (b.vol || 0) / ((b.oi || 0) + 1);
            const pctChgA = Math.abs(((a.ltp - (a.close || a.ltp)) / (a.close || a.ltp)) * 100);
            const pctChgB = Math.abs(((b.ltp - (b.close || b.ltp)) / (b.close || b.ltp)) * 100);
            const momentumA = 0.45 * volturnA * 100 + 0.30 * a.flow.flowScore + 0.25 * pctChgA;
            const momentumB = 0.45 * volturnB * 100 + 0.30 * b.flow.flowScore + 0.25 * pctChgB;
            return momentumB - momentumA;
        });
    const momentumPick = momentumCandidates[0] || null;
    if (momentumPick) pickedStrikes.add(momentumPick.strike);

    // ── 6e. Highest Institutional Liquidity ───────────────────────────────────
    // Max rupee-volume turnover (ltp × vol) + OI depth within 1.5σ EM boundary
    const liquidityCandidates = scoredContracts
        .filter(o =>
            !pickedStrikes.has(o.strike) &&
            o.absDelta >= 0.15 &&
            o.sigmaUnits <= 1.5                        // within 1.5σ boundary
        )
        .sort((a, b) => {
            const turA = (a.ltp || 0) * (a.vol || 0);
            const turB = (b.ltp || 0) * (b.vol || 0);
            const liqA = 0.60 * turA + 0.40 * (a.oi || 0);
            const liqB = 0.60 * turB + 0.40 * (b.oi || 0);
            return liqB - liqA;
        });
    const liquidityPick = liquidityCandidates[0] || null;

    // ── Step 7: Contiguous Golden Zone Brackets ───────────────────────────────
    /**
     * Algorithm: Starting from the ATM strike, walk outward in the OTM direction
     * (calls → ascending strikes, puts → descending strikes) and pick the first 4-5
     * strikes that are:
     *   a) Contiguous (no gaps allowed)
     *   b) Within 2.0σ expected move
     *   c) Liquid (vol > 0 and oi > 5)
     *   d) Delta within tier target range plus OTM spillover band
     *
     * This ensures the golden zone is always a single, clean, unbroken bracket.
     */
    const buildContiguousZone = (isCall) => {
        // Start from ATM strike, walk in OTM direction
        const atmStrike = atmRow?.strike || spotPrice;

        // Get all strikes sorted in walking order (ascending for calls, descending for puts)
        const strikesInOrder = sortedStrikes.filter(s => isCall ? s >= atmStrike : s <= atmStrike);
        if (!isCall) strikesInOrder.reverse();

        const zone = [];
        for (let i = 0; i < strikesInOrder.length && zone.length < 5; i++) {
            const s = strikesInOrder[i];

            // Confirm contiguity: must be adjacent to previous pick
            if (zone.length > 0) {
                const prevStrike = zone[zone.length - 1];
                const gap = Math.abs(s - prevStrike);
                if (gap > stepSize * 1.1) break; // gap in chain — stop zone here
            }

            // Find chain row
            const row = chain.find(r => r.strike === s);
            if (!row) continue;

            const data = isCall ? row.call : row.put;
            if (!data || (data.oi || 0) < 5) continue;

            // Distance from spot in sigma units
            const distSigma = em1Sigma > 0 ? Math.abs(s - spotPrice) / em1Sigma : 0;
            if (distSigma > 2.0) break; // beyond 2σ — stop

            // Resolve delta for filter
            let absDelta = data.delta != null ? Math.abs(data.delta) : 0;
            if (absDelta < 0.01 && T > 0) {
                const ivDec = Math.max(0.01, (data.iv || atmIv) / 100);
                const bs = calculateGreeks(spotPrice, s, T, 0.068, ivDec, isCall ? 'call' : 'put', 0.012);
                absDelta = Math.abs(bs.delta);
            }

            // Accept strikes from near-ATM (Δ≈0.50) through the OTM boundary of selected tier
            // with a small spillover for the anchor row
            const deltaLowBound = Math.max(0.08, tierConfig.deltaLow - 0.10);
            if (absDelta < deltaLowBound) break; // too far OTM — stop zone

            zone.push(s);
        }

        return zone.sort((a, b) => a - b);
    };

    const goldenCalls = buildContiguousZone(true);
    const goldenPuts  = buildContiguousZone(false);

    return {
        goldenStrikes: {
            calls: goldenCalls,
            puts:  goldenPuts,
        },
        categories: {
            bullish:   bullishPick,
            bearish:   bearishPick,
            atm:       atmPick,
            momentum:  momentumPick,
            liquidity: liquidityPick,
        },
        // Metadata for consumers (PAI / DataRegistry)
        meta: {
            tier: tierConfig.name,
            atmIv: parseFloat(atmIv.toFixed(2)),
            em1Sigma: parseFloat(em1Sigma.toFixed(2)),
            dte: parseFloat((T * 365).toFixed(1)),
        }
    };
};
