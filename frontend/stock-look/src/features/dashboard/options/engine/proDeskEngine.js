/**
 * @file proDeskEngine.js
 * @purpose Evaluates the options chain and returns the top 3 Calls and Top 3 Puts using a scoring algorithm.
 */

export const generateProDeskPicks = (chain, spotPrice, goldenZone) => {
    if (!chain || chain.length === 0 || !spotPrice) {
        return { ce: [], pe: [] };
    }

    // 1. Filter: Only consider Golden Zone (to ensure we have Greeks and avoid deep ITM/OTM)
    // Also reject extreme LTPs (e.g., < 10 or > 1000)
    const validRows = chain.filter(row => {
        if (goldenZone) {
            return row.strike >= goldenZone.minStrike && row.strike <= goldenZone.maxStrike;
        }
        return Math.abs(row.strike - spotPrice) <= 1500; // Fallback
    });

    // We need min/max values across the valid rows to normalize scores (0-1)
    let maxCallOI = 1, maxCallVol = 1, maxCallOiChg = 1;
    let maxPutOI = 1, maxPutVol = 1, maxPutOiChg = 1;

    validRows.forEach(row => {
        // Calls
        if (row.call.ltp >= 10 && row.call.ltp <= 1000) {
            if (row.call.oi > maxCallOI) maxCallOI = row.call.oi;
            if (row.call.vol > maxCallVol) maxCallVol = row.call.vol;
            if (Math.abs(row.call.oiChg) > maxCallOiChg) maxCallOiChg = Math.abs(row.call.oiChg);
        }
        // Puts
        if (row.put.ltp >= 10 && row.put.ltp <= 1000) {
            if (row.put.oi > maxPutOI) maxPutOI = row.put.oi;
            if (row.put.vol > maxPutVol) maxPutVol = row.put.vol;
            if (Math.abs(row.put.oiChg) > maxPutOiChg) maxPutOiChg = Math.abs(row.put.oiChg);
        }
    });

    const scoreContract = (data, isCall, strike, maxOI, maxVol, maxOiChg) => {
        if (data.ltp < 10 || data.ltp > 1000 || data.oi < 1000) return 0; // Exclude

        // Normalize metrics 0 to 1
        const normOI = Math.min(data.oi / maxOI, 1);
        const normVol = Math.min(data.vol / maxVol, 1);
        // Reward positive OI change (long buildup or short buildup)
        const normOiChg = data.oiChg > 0 ? Math.min(data.oiChg / maxOiChg, 1) : 0; 
        
        // ATM Distance Score: Closer to ATM is better (max 500 pts away = 0)
        const atmDist = Math.abs(strike - spotPrice);
        const normAtmDist = Math.max(1 - (atmDist / 500), 0);

        // Delta/IV (If null, give 0.5 to not penalize heavily, or use what we have)
        const deltaTarget = isCall ? 0.5 : -0.5;
        // The closer Delta is to 0.5 or -0.5 (ATM), the better
        const normDelta = data.delta !== null ? Math.max(1 - Math.abs(data.delta - deltaTarget) * 2, 0) : 0.5;
        const normIv = data.iv ? Math.min(15 / Number(data.iv), 1) : 0.5; // Lower IV is slightly better for buying

        // Final Trade Score (Max 100)
        // 30% OI + 20% OI Change + 20% Volume + 10% ATM + 10% Delta + 10% IV
        const score = (
            (normOI * 30) +
            (normOiChg * 20) +
            (normVol * 20) +
            (normAtmDist * 10) +
            (normDelta * 10) +
            (normIv * 10)
        );

        return Math.round(score);
    };

    const scoredCalls = [];
    const scoredPuts = [];

    validRows.forEach(row => {
        const ceScore = scoreContract(row.call, true, row.strike, maxCallOI, maxCallVol, maxCallOiChg);
        if (ceScore > 0) {
            scoredCalls.push({ ...row.call, strike: row.strike, dte: 'Live', score: ceScore });
        }

        const peScore = scoreContract(row.put, false, row.strike, maxPutOI, maxPutVol, maxPutOiChg);
        if (peScore > 0) {
            scoredPuts.push({ ...row.put, strike: row.strike, dte: 'Live', score: peScore });
        }
    });

    // Sort descending by score and pick top 3
    scoredCalls.sort((a, b) => b.score - a.score);
    scoredPuts.sort((a, b) => b.score - a.score);

    return {
        ce: scoredCalls.slice(0, 3),
        pe: scoredPuts.slice(0, 3)
    };
};
