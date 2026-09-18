/**
 * @file masterScoringEngine.js
 * @purpose Core mathematical aggregation engine for the Master Dashboard.
 * Resolves defects:
 * - MD-18: Return null (NO_DATA) when totalWeight === 0 instead of false 50.
 * - MD-13: Mode-aware base weights (Intraday, Positional, Swing).
 * - MD-01: Correlation dampening for aligned modifiers & hard cap at [-8, +8].
 * - MD-12: VIX distress propagation from global/volatility indicators.
 * - MD-22: Granular provenance and modifier breakdown for auditability.
 */

export const MASTER_MODE_WEIGHTS = {
    intraday: {
        TECH: 0.35,
        OPT: 0.30,
        GLOB: 0.15,
        EVT: 0.10,
        FUND: 0.10
    },
    positional: {
        FUND: 0.35,
        TECH: 0.30,
        GLOB: 0.15,
        OPT: 0.10,
        EVT: 0.10
    },
    swing: {
        TECH: 0.30,
        OPT: 0.25,
        FUND: 0.20,
        GLOB: 0.15,
        EVT: 0.10
    }
};

export function computeInstitutionalComposite(moduleScores, extraData = {}) {
    // Expected moduleScores: { TECH, OPT, FUND, GLOB, EVT } - each 0 to 100
    // Expected extraData: { sectors, activeOpts, fiiDiiFlow, tradingMode, vixDistress, globalData }

    // 1. Resolve Mode-Specific Base Weights (MD-13)
    const mode = (extraData.tradingMode || 'swing').toLowerCase();
    const modeWeights = MASTER_MODE_WEIGHTS[mode] || MASTER_MODE_WEIGHTS.swing;
    let BASE_WEIGHTS = { ...modeWeights };

    // Dynamic Shock Escalation:
    // When a systemic event shock occurs, escalate EVT weighting from default 0.10 to 0.20 (0.25 for intraday)
    // to prevent lagging technicals/fundamentals from masking immediate exogenous price shocks.
    const isShock = !!(
        extraData.hasSystemicEvent ||
        extraData.isShock ||
        extraData.eventSeverity === 'Systemic' ||
        (extraData.volatilityPressure && extraData.volatilityPressure >= 60)
    );

    if (isShock && BASE_WEIGHTS.EVT) {
        const targetEvtWeight = mode === 'intraday' ? 0.25 : 0.20;
        const oldEvtWeight = BASE_WEIGHTS.EVT;
        const scaleFactor = (1 - targetEvtWeight) / (1 - oldEvtWeight);

        Object.keys(BASE_WEIGHTS).forEach(key => {
            if (key === 'EVT') {
                BASE_WEIGHTS[key] = targetEvtWeight;
            } else {
                BASE_WEIGHTS[key] = Number((BASE_WEIGHTS[key] * scaleFactor).toFixed(4));
            }
        });
    }

    // 2. Validate and Re-weight based on available data
    let totalWeight = 0;
    let baseScore = 0;
    const activeWeights = {};

    Object.keys(BASE_WEIGHTS).forEach(key => {
        const val = moduleScores ? moduleScores[key] : null;
        if (val !== null && val !== undefined && !isNaN(val)) {
            totalWeight += BASE_WEIGHTS[key];
        }
    });

    // MD-18 Fix: Return null (NO_DATA) on total absence of valid modules instead of masking with 50
    if (totalWeight === 0) {
        return {
            compositeScore: null,
            baseScore: null,
            modifierImpact: 0,
            status: 'NO_DATA',
            activeWeights: {},
            modifierBreakdown: {
                breadth: 0,
                fiiDii: 0,
                derivatives: 0,
                rawTotal: 0,
                dampenedTotal: 0
            }
        };
    }

    Object.keys(BASE_WEIGHTS).forEach(key => {
        const val = moduleScores ? moduleScores[key] : null;
        if (val !== null && val !== undefined && !isNaN(val)) {
            const normalizedWeight = BASE_WEIGHTS[key] / totalWeight;
            activeWeights[key] = normalizedWeight;
            baseScore += (val * normalizedWeight);
        }
    });

    // 3. Modifiers Logic with Correlation Dampening (MD-01)
    let mBreadth = 0;
    let mFii = 0;
    let mDeriv = 0;

    // --- A. Market Breadth Modifier (Sector Rotation) ---
    if (extraData.sectors && Array.isArray(extraData.sectors) && extraData.sectors.length > 0) {
        const total = extraData.sectors.length;
        const upCount = extraData.sectors.filter(s => s.change_pct > 0).length;
        const breadthRatio = upCount / total;

        if (breadthRatio >= 0.8) mBreadth = 5;
        else if (breadthRatio >= 0.6) mBreadth = 2;
        else if (breadthRatio <= 0.2) mBreadth = -5;
        else if (breadthRatio <= 0.4) mBreadth = -2;
    }

    // --- B. Institutional Flow Modifier (FII / DII) ---
    if (extraData.fiiDiiFlow && extraData.fiiDiiFlow.fii && extraData.fiiDiiFlow.fii.CASH) {
        const cashFlow = extraData.fiiDiiFlow.fii.CASH.net || 0;
        if (cashFlow > 1000) mFii = 4;
        else if (cashFlow > 250) mFii = 2;
        else if (cashFlow < -1000) mFii = -4;
        else if (cashFlow < -250) mFii = -2;
    }

    // --- C. Derivatives Momentum Modifier (Volume Shockers) ---
    if (extraData.activeOpts && Array.isArray(extraData.activeOpts) && extraData.activeOpts.length > 0) {
        const totalOpts = extraData.activeOpts.length;
        const callCount = extraData.activeOpts.filter(o => {
            const sym = o.trading_symbol || o.instrument_key || '';
            return sym.endsWith('CE');
        }).length;
        const putCount = totalOpts - callCount;

        if (putCount / totalOpts >= 0.7) mDeriv = 3;
        else if (callCount / totalOpts >= 0.7) mDeriv = -3;
    }

    const rawModifierTotal = mBreadth + mFii + mDeriv;

    // Institutional Correlation Dampening (MD-01):
    // When multiple modifiers push strongly in the same direction, they reflect collinear macro sentiment.
    // Dampen by 0.75x to avoid double-counting breadth + FII + options momentum.
    let dampenedModifier = rawModifierTotal;
    const nonZeroCount = [mBreadth, mFii, mDeriv].filter(m => m !== 0).length;
    const allPositive = [mBreadth, mFii, mDeriv].every(m => m >= 0) && nonZeroCount >= 2;
    const allNegative = [mBreadth, mFii, mDeriv].every(m => m <= 0) && nonZeroCount >= 2;

    if (allPositive || allNegative) {
        dampenedModifier = rawModifierTotal * 0.75;
    }

    // Hard-clamp modifier impact between -8 and +8 points
    const finalModifierImpact = Math.max(-8, Math.min(8, Math.round(dampenedModifier)));

    // 4. Final Aggregation & VIX Distress Cap (MD-12)
    let finalScore = Math.max(0, Math.min(100, Math.round(baseScore + finalModifierImpact)));

    // Check for systemic VIX distress
    const vixVal = extraData.vix || extraData.globalData?.vix?.value || (extraData.globalData?.vix && typeof extraData.globalData.vix === 'number' ? extraData.globalData.vix : null);
    const vixDistress = !!extraData.vixDistress || (vixVal !== null && vixVal > 24) || (moduleScores?.GLOB !== null && moduleScores?.GLOB !== undefined && moduleScores.GLOB < 20);

    let vixDistressApplied = false;
    if (vixDistress && finalScore > 45) {
        finalScore = 45; // Hard cap at maximum 45 during systemic risk / volatility shock
        vixDistressApplied = true;
    }

    return {
        compositeScore: finalScore,
        baseScore: Math.round(baseScore),
        modifierImpact: finalModifierImpact,
        status: 'LIVE',
        vixDistressApplied,
        isShockEscalated: isShock,
        activeWeights,
        modifierBreakdown: {
            breadth: mBreadth,
            fiiDii: mFii,
            derivatives: mDeriv,
            rawTotal: rawModifierTotal,
            dampenedTotal: finalModifierImpact
        }
    };
}
