/**
 * @file proDeskEngine.js
 * @purpose Evaluates the options chain and returns institutional-grade picks and dynamic Golden Zone strikes.
 */

export const generateProDeskPicks = (chain, spotPrice, idealPremium = 45) => {
    if (!chain || chain.length === 0 || !spotPrice) {
        return { 
            goldenStrikes: [], 
            categories: {
                bullish: null,
                bearish: null,
                atm: null,
                momentum: null,
                liquidity: null
            }
        };
    }

    // Determine strike step size (e.g. 50 for NIFTY, 100 for BANKNIFTY)
    const stepSize = chain.length > 1 ? Math.abs(chain[0].strike - chain[1].strike) : 50;

    // We need max values across the chain to normalize scores
    let maxCallOI = 1, maxCallVol = 1, maxCallOiChg = 1;
    let maxPutOI = 1, maxPutVol = 1, maxPutOiChg = 1;
    let atmIvCall = 15, atmIvPut = 15;
    
    // Find ATM for IV baselining
    let minDiff = Infinity;
    let atmRow = null;

    chain.forEach(row => {
        const diff = Math.abs(row.strike - spotPrice);
        if (diff < minDiff) {
            minDiff = diff;
            atmRow = row;
        }

        if (row.call) {
            if (row.call.oi > maxCallOI) maxCallOI = row.call.oi;
            if (row.call.vol > maxCallVol) maxCallVol = row.call.vol;
            if (Math.abs(row.call.oiChg) > maxCallOiChg) maxCallOiChg = Math.abs(row.call.oiChg);
        }
        if (row.put) {
            if (row.put.oi > maxPutOI) maxPutOI = row.put.oi;
            if (row.put.vol > maxPutVol) maxPutVol = row.put.vol;
            if (Math.abs(row.put.oiChg) > maxPutOiChg) maxPutOiChg = Math.abs(row.put.oiChg);
        }
    });

    if (atmRow) {
        atmIvCall = atmRow.call?.iv || 15;
        atmIvPut = atmRow.put?.iv || 15;
    }

    const scoreContract = (data, isCall, strike) => {
        if (!data || data.ltp < 1 || data.oi < 10) return { score: 0, details: {} };

        const distanceSteps = Math.round(Math.abs(strike - spotPrice) / stepSize);
        // Visibility cutoff - do not score options that are > 15 strikes away (off-screen)
        if (distanceSteps > 15) return { score: 0, details: { penalty: 0 } };

        // 1. Liquidity Score (30%)
        const mOI = isCall ? maxCallOI : maxPutOI;
        const mVol = isCall ? maxCallVol : maxPutVol;
        
        const normOI = Math.min(data.oi / (mOI || 1), 1) * 100;
        const normVol = Math.min(data.vol / (mVol || 1), 1) * 100;
        const liquidityScore = (0.60 * normVol) + (0.40 * normOI);

        // 2. Premium Quality Score (20%)
        let premiumScore = 0;
        const premium = data.ltp;
        const diffFromIdeal = Math.abs(premium - idealPremium);
        
        if (diffFromIdeal <= 10) premiumScore = 100;      
        else if (diffFromIdeal <= 20) premiumScore = 80;  
        else if (diffFromIdeal <= 30) premiumScore = 50;  
        else premiumScore = Math.max(0, 50 - diffFromIdeal);

        // 3. Greeks Score (30%) - Industry Level Filtering
        let greeksScore = 0;
        const delta = Math.abs(data.delta || 0);
        const theta = data.theta || 0;
        
        // Delta Sweet Spot (0.20 to 0.40 is ideal for Risk/Reward directional buying)
        let deltaScore = 0;
        if (delta >= 0.20 && delta <= 0.40) deltaScore = 100;
        else if (delta > 0.40 && delta <= 0.55) deltaScore = 80;
        else if (delta > 0.10 && delta < 0.20) deltaScore = 60;
        else deltaScore = 20;

        // Theta Decay Penalty (Theta as % of premium per day)
        let thetaScore = 100;
        if (premium > 0 && theta < 0) {
            const decayPct = Math.abs(theta) / premium;
            if (decayPct > 0.20) thetaScore = 0;       // Losing > 20% a day = Garbage
            else if (decayPct > 0.10) thetaScore = 40; // Losing 10-20% = Risky
            else if (decayPct > 0.05) thetaScore = 80; // Losing 5-10% = Normal
            else thetaScore = 100;                     // Losing < 5% = Excellent
        }

        greeksScore = (deltaScore * 0.6) + (thetaScore * 0.4);

        // 4. OI Structure & Momentum (20%)
        let momentumScore = 0;
        if (data.oiChg > 0 && normVol > 50) momentumScore = 100;
        else if (data.oiChg > 0) momentumScore = 60;
        else if (data.oiChg < 0) momentumScore = 20; // Short covering / long unwinding

        // Weighted Final Score
        const baseFinalScore = (
            (liquidityScore * 0.30) +
            (premiumScore * 0.20) +
            (greeksScore * 0.30) +
            (momentumScore * 0.20)
        );

        // Strict Penalties
        let outOfBoundsPenalty = 1.0;
        const maxAllowedDiff = Math.max(40, idealPremium * 0.8);
        if (diffFromIdeal > maxAllowedDiff) {
            const excess = diffFromIdeal - maxAllowedDiff;
            outOfBoundsPenalty = Math.max(0.01, 1.0 - (excess / 100));
        }

        // Moneyness Penalty (Reward OTM, Heavily Penalize ITM)
        let moneynessPenalty = 1.0;
        const isITM = isCall ? (strike < spotPrice) : (strike > spotPrice);
        if (isITM) {
            moneynessPenalty = 0.2;
        }

        const finalScore = baseFinalScore * outOfBoundsPenalty * moneynessPenalty;

        return { 
            score: Math.round(finalScore),
            details: { liquidityScore, premiumScore, greeksScore, momentumScore, penalty: outOfBoundsPenalty }
        };
    };

    const allOptions = [];

    chain.forEach(row => {
        const ceResult = scoreContract(row.call, true, row.strike);
        if (ceResult.score > 0) {
            allOptions.push({ ...row.call, strike: row.strike, type: 'call', score: ceResult.score, details: ceResult.details });
        }

        const peResult = scoreContract(row.put, false, row.strike);
        if (peResult.score > 0) {
            allOptions.push({ ...row.put, strike: row.strike, type: 'put', score: peResult.score, details: peResult.details });
        }
    });

    // Sort descending by score
    allOptions.sort((a, b) => b.score - a.score);

    const calls = allOptions.filter(o => o.type === 'call');
    const puts = allOptions.filter(o => o.type === 'put');

    // --- PREPARE SAFE OPTIONS ---
    // Strictly filter out options that were heavily penalized for missing the premium target
    const viableOptions = allOptions.filter(o => o.details.penalty > 0.3);
    const safeOptions = viableOptions.length > 0 ? viableOptions : allOptions.slice(0, 10);

    const safeCalls = safeOptions.filter(o => o.type === 'call');
    const safePuts = safeOptions.filter(o => o.type === 'put');

    // --- GOLDEN STRIKES (High Precision Selection) ---
    // User requested EXACTLY top 5 CE and top 6 PE every time, based purely on high-precision Greek/Liquid scoring.
    // We removed the forced contiguous grouping so it only picks genuinely high-value options.
    const top5Calls = safeCalls.slice(0, 5).map(o => o.strike).sort((a,b) => a - b);
    const top6Puts = safePuts.slice(0, 6).map(o => o.strike).sort((a,b) => a - b);

    const goldenStrikes = {
        calls: top5Calls,
        puts: top6Puts
    };

    // --- PRO DESK CATEGORICAL PICKS ---

    const categories = {
        bullish: null,
        bearish: null,
        atm: null,
        momentum: null,
        liquidity: null
    };

    // 1. Best Bullish Call (Highest scoring Call)
    categories.bullish = safeCalls[0] || null;

    // 2. Best Bearish Put (Highest scoring Put)
    categories.bearish = safePuts[0] || null;

    // 3. Best ATM Trade (Highest scoring option strictly at distanceSteps 0 or 1)
    categories.atm = safeOptions.find(o => {
        const dist = Math.round(Math.abs(o.strike - spotPrice) / stepSize);
        return dist <= 1;
    }) || null;

    // 4. Best Momentum Option (Highest momentum score)
    const momentumCandidates = safeOptions.filter(o => 
        o.details.momentumScore > 80 && 
        o.strike !== categories.bullish?.strike && 
        o.strike !== categories.bearish?.strike
    );
    categories.momentum = momentumCandidates.length > 0 
        ? momentumCandidates.sort((a,b) => b.details.momentumScore - a.details.momentumScore)[0] 
        : safeOptions.sort((a,b) => b.details.momentumScore - a.details.momentumScore)[0];

    // 5. Best Liquidity Option (Highest liquidity score)
    const liquidityCandidates = safeOptions.filter(o => 
        o.strike !== categories.bullish?.strike && 
        o.strike !== categories.bearish?.strike &&
        o.strike !== categories.atm?.strike
    );
    categories.liquidity = liquidityCandidates.length > 0
        ? liquidityCandidates.sort((a,b) => b.details.liquidityScore - a.details.liquidityScore)[0]
        : safeOptions.sort((a,b) => b.details.liquidityScore - a.details.liquidityScore)[0];

    return {
        goldenStrikes,
        categories
    };
};
