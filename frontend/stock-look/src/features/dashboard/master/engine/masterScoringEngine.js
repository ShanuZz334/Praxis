export function computeInstitutionalComposite(moduleScores, extraData = {}) {
    // Expected moduleScores: { TECH, OPT, FUND, GLOB, EVT } - each 0 to 100
    // Expected extraData: { sectors, activeOpts, fiiDiiFlow }
    
    // 1. Initial Weights Matrix
    const BASE_WEIGHTS = {
        TECH: 0.30,
        OPT: 0.25,
        FUND: 0.20,
        GLOB: 0.15,
        EVT: 0.10
    };

    // 2. Validate and Re-weight based on available data
    let totalWeight = 0;
    let baseScore = 0;
    
    Object.keys(BASE_WEIGHTS).forEach(key => {
        if (moduleScores[key] !== null && moduleScores[key] !== undefined && !isNaN(moduleScores[key])) {
            totalWeight += BASE_WEIGHTS[key];
        }
    });

    if (totalWeight === 0) return { compositeScore: 50, baseScore: 50, modifierImpact: 0 }; // Fallback

    Object.keys(BASE_WEIGHTS).forEach(key => {
        if (moduleScores[key] !== null && moduleScores[key] !== undefined && !isNaN(moduleScores[key])) {
            const normalizedWeight = BASE_WEIGHTS[key] / totalWeight;
            baseScore += (moduleScores[key] * normalizedWeight);
        }
    });

    // 3. Modifiers Logic
    let modifierTotal = 0;

    // --- A. Market Breadth Modifier (Sector Rotation) ---
    // If >80% of sectors are green, it's a structural bull day (+5 to Master)
    // If >80% are red, structural bear day (-5 to Master)
    if (extraData.sectors && Array.isArray(extraData.sectors) && extraData.sectors.length > 0) {
        const total = extraData.sectors.length;
        const upCount = extraData.sectors.filter(s => s.change_pct > 0).length;
        const breadthRatio = upCount / total;

        if (breadthRatio >= 0.8) modifierTotal += 5;
        else if (breadthRatio >= 0.6) modifierTotal += 2;
        else if (breadthRatio <= 0.2) modifierTotal -= 5;
        else if (breadthRatio <= 0.4) modifierTotal -= 2;
    }

    // --- B. Institutional Flow Modifier (FII / DII) ---
    // Look at FII Cash Net Flow. Positive = tailwind, Negative = risk.
    if (extraData.fiiDiiFlow && extraData.fiiDiiFlow.fii && extraData.fiiDiiFlow.fii.CASH) {
        const cashFlow = extraData.fiiDiiFlow.fii.CASH.net || 0;
        if (cashFlow > 1000) modifierTotal += 4;      // Huge FII buying
        else if (cashFlow > 250) modifierTotal += 2;
        else if (cashFlow < -1000) modifierTotal -= 4; // Huge FII selling
        else if (cashFlow < -250) modifierTotal -= 2;
    }

    // --- C. Derivatives Momentum Modifier (Volume Shockers) ---
    if (extraData.activeOpts && Array.isArray(extraData.activeOpts) && extraData.activeOpts.length > 0) {
        const totalOpts = extraData.activeOpts.length;
        const callCount = extraData.activeOpts.filter(o => {
            const sym = o.trading_symbol || o.instrument_key || '';
            return sym.endsWith('CE');
        }).length;
        const putCount = totalOpts - callCount;

        // If institutions are aggressively writing calls (Most Active CE volume spikes), it's bearish.
        // If aggressively writing puts (Most Active PE volume spikes), it's bullish.
        if (putCount / totalOpts >= 0.7) modifierTotal += 3; // Bullish structural support
        else if (callCount / totalOpts >= 0.7) modifierTotal -= 3; // Bearish resistance
    }

    // 4. Final Aggregation
    const finalScore = Math.max(0, Math.min(100, Math.round(baseScore + modifierTotal)));

    return {
        compositeScore: finalScore,
        baseScore: Math.round(baseScore),
        modifierImpact: modifierTotal
    };
}
