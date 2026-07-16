import { useMemo } from 'react';
import { scoreDXY, scoreUSDINR, scoreCrude, scoreGold, scoreSilver, scoreUS10Y, scoreSPFutures, scoreNasdaqFutures, scoreDowFutures, scoreVIX, scoreBitcoin, scoreEurusd, scoreUsdjpy, scoreNikkei, scoreFtse, scoreDax, scoreHangseng, scoreShanghai, scoreCac40, scoreEurostoxx, scoreCopper, scoreNatgas, scoreWheat, scoreAluminum, scoreMove } from './globalScoringEngine';
import { getCompositeColor, getIndicatorColor } from '../../../../shared/config/scoreColors';

export const ID_TO_TITLE_GLOBAL = {
    dxy: "US Dollar Index",
    usd_inr: "USD/INR",
    crude: "Brent Crude",
    gold: "Gold",
    silver: "Silver",
    us_10y_yield: "US 10Y Yield",
    sp_futures: "S&P 500 Futures",
    nasdaq_futures: "Nasdaq Futures",
    dow_futures: "Dow Jones Futures",
    vix: "CBOE VIX",
    bitcoin: "Bitcoin",
    eurusd: "EUR/USD",
    usdjpy: "USD/JPY",
    nikkei: "Nikkei 225",
    ftse: "FTSE 100",
    dax: "DAX 40",
    hangseng: "Hang Seng",
    shanghai: "Shanghai Comp",
    cac40: "CAC 40",
    eurostoxx: "Euro Stoxx 50",
    copper: "Copper",
    natgas: "Natural Gas",
    wheat: "Wheat",
    aluminum: "Aluminum",
    move: "MOVE Index"
};

// ─── Aggregation Utilities ────────────────────────────────────────────────────
function weightedHarmonicMean(items) {
    const valid = items.filter(({ score }) => score !== null && !isNaN(score));
    if (!valid.length) return null;
    const totalW = valid.reduce((s, { weight }) => s + weight, 0);
    if (!totalW) return 0;
    const denom = valid.reduce((s, { weight, score }) => s + weight / Math.max(1, score), 0);
    return denom === 0 ? 0 : totalW / denom;
}

function weightedGeometricMean(items) {
    const valid = items.filter(({ score }) => score !== null && !isNaN(score));
    if (!valid.length) return null;
    const totalW = valid.reduce((s, { weight }) => s + weight, 0);
    if (!totalW) return 0;
    const logSum = valid.reduce((s, { weight, score }) => s + weight * Math.log(Math.max(1, score)), 0);
    return Math.exp(logSum / totalW);
}

function weightedMean(items) {
    const valid = items.filter(({ score }) => score !== null && !isNaN(score));
    if (!valid.length) return null;
    const totalW = valid.reduce((s, { weight }) => s + weight, 0);
    if (!totalW) return 0;
    return valid.reduce((s, { weight, score }) => s + weight * score, 0) / totalW;
}

function trimmedWeightedMean(items) {
    const valid = items.filter(({ score }) => score !== null && !isNaN(score));
    if (!valid.length) return null;
    if (valid.length <= 2) return weightedMean(valid);
    const sorted = [...valid].sort((a, b) => a.score - b.score);
    return weightedMean(sorted.slice(1));
}

function clamp(val, lo = 0, hi = 100) {
    return Math.max(lo, Math.min(hi, val));
}


// ─── Section Computations ──────────────────────────────────────────────────
function computeGlobalSections(scores) {
    const g = (id) => {
        const s = scores[id]?.score;
        return (s !== undefined && s !== null && !isNaN(Number(s))) ? Number(s) : null;
    };

    // Currency (Weighted Mean)
    const currency = weightedMean([
        { score: g('dxy'), weight: 0.40 },
        { score: g('usd_inr'), weight: 0.30 },
        { score: g('eurusd'), weight: 0.15 },
        { score: g('usdjpy'), weight: 0.15 }
    ]);

    // Commodities (Trimmed Weighted Mean)
    const commodities = trimmedWeightedMean([
        { score: g('crude'), weight: 0.25 },
        { score: g('gold'), weight: 0.20 },
        { score: g('silver'), weight: 0.15 },
        { score: g('copper'), weight: 0.15 },
        { score: g('natgas'), weight: 0.10 },
        { score: g('wheat'), weight: 0.05 },
        { score: g('aluminum'), weight: 0.10 }
    ]);

    // Rates & Volatility (Min-Anchored Blend)
    const us10yScore = g('us_10y_yield');
    const vixScore = g('vix');
    
    let rates = null;
    const ratesItems = [
        { score: us10yScore, weight: 0.50 },
        { score: vixScore, weight: 0.25 },
        { score: g('move'), weight: 0.25 }
    ].filter(x => x.score !== null);

    if (ratesItems.length > 0) {
        const mean = weightedMean(ratesItems);
        const minScore = Math.min(...ratesItems.map(x => x.score));
        rates = minScore * 0.40 + mean * 0.60;
    }

    // US Markets (Weighted Harmonic Mean)
    const us_markets = weightedHarmonicMean([
        { score: g('sp_futures'), weight: 0.45 },
        { score: g('nasdaq_futures'), weight: 0.35 },
        { score: g('dow_futures'), weight: 0.20 }
    ]);

    // Digital Assets (Direct Score)
    const digital_assets = g('bitcoin');

    
    // Global Indices (Trimmed Weighted Mean)
    const global_indices = trimmedWeightedMean([
        { score: g('nikkei'), weight: 0.20 },
        { score: g('ftse'), weight: 0.15 },
        { score: g('dax'), weight: 0.15 },
        { score: g('hangseng'), weight: 0.15 },
        { score: g('shanghai'), weight: 0.15 },
        { score: g('cac40'), weight: 0.10 },
        { score: g('eurostoxx'), weight: 0.10 }
    ]);

    return { currency, commodities, rates, us_markets, digital_assets, global_indices };
}


// ─── Composite Score & Engine ────────────────────────────────────────────────
export const computeGlobalComposite = (scores) => {
    
    const raw = computeGlobalSections(scores);

    const sectionsArray = [
        { id: 'currency',       label: 'Currency',           shortLabel: 'CUR', score: raw.currency !== null ? clamp(Math.round(raw.currency)) : null, weight: 0.20 },
        { id: 'commodities',    label: 'Commodities',        shortLabel: 'COM', score: raw.commodities !== null ? clamp(Math.round(raw.commodities)) : null, weight: 0.20 },
        { id: 'rates',          label: 'Rates & Vol',        shortLabel: 'RAT', score: raw.rates !== null ? clamp(Math.round(raw.rates)) : null, weight: 0.25 },
        { id: 'us_markets',     label: 'US Markets',         shortLabel: 'USM', score: raw.us_markets !== null ? clamp(Math.round(raw.us_markets)) : null, weight: 0.25 },
        { id: 'digital_assets', label: 'Digital Assets',     shortLabel: 'DIG', score: raw.digital_assets !== null ? clamp(Math.round(raw.digital_assets)) : null, weight: 0.05 },
        { id: 'global_indices', label: 'Global Indices',     shortLabel: 'GLO', score: raw.global_indices !== null ? clamp(Math.round(raw.global_indices)) : null, weight: 0.15 }
    ];

    const validSections = sectionsArray.filter(s => s.score !== null);
    let finalScore = 50;

    if (validSections.length > 0) {
        const totalW = validSections.reduce((s, x) => s + x.weight, 0);
        if (totalW > 0) {
            finalScore = validSections.reduce((s, x) => s + x.weight * x.score, 0) / totalW;
            
            // Distress penalty
            const distressCount = validSections.filter(x => x.score < 25).length;
            finalScore = Math.max(0, finalScore - distressCount * 4);
        }
    }

    finalScore = clamp(Math.round(finalScore));

    // Insights extraction from individual indicators
    const validIndicators = Object.entries(scores)
        .filter(([id, scoreData]) => scoreData && scoreData.score !== null && !isNaN(scoreData.score))
        .map(([id, scoreData]) => {
            const score = scoreData.score;
            // Very rough mapping of weights for individual items inside global
            let weight = 5.0; 
            if (id === 'dxy' || id === 'us_10y_yield' || id === 'vix') weight = 8.0;
            if (id === 'sp_futures' || id === 'nasdaq_futures') weight = 7.0;
            return { id, title: ID_TO_TITLE_GLOBAL[id] || id, score, insight: scoreData.insight, weight };
        });

    const tailwindImpact = (s) => (s.score - 50) * s.weight;
    const tailwinds = sectionsArray
        .filter(s => s.score !== null && s.score >= 60)
        .sort((a, b) => tailwindImpact(b) - tailwindImpact(a))
        .slice(0, 3)
        .map(s => ({ 
            id: s.id, 
            label: s.label, 
            value: s.score, 
            sub: `${Math.round(s.weight * 100)}% weight · ${getIndicatorColor(s.score).label}` 
        }));

    // Risk: Score <= 40 (Bearish threshold). 
    // Impact = (Deviation from 50) * Configured Impact Weight
    const riskImpact = (s) => (50 - s.score) * s.weight;
    const risks = sectionsArray
        .filter(s => s.score !== null && s.score <= 40)
        .sort((a, b) => riskImpact(b) - riskImpact(a))
        .slice(0, 3)
        .map(s => ({ 
            id: s.id, 
            label: s.label, 
            value: s.score, 
            sub: `${Math.round(s.weight * 100)}% weight · ${getIndicatorColor(s.score).label}` 
        }));

    const compositeColor = getCompositeColor(finalScore);
    let regime = { 
        label: compositeColor.label, 
        description: "Global macro forces are driving the score.", 
        color: compositeColor.hex 
    };
    if (validSections.length === 0) {
        regime = { label: "Neutral", description: "Insufficient data to determine regime", color: "#64748B" };
    } else if (finalScore >= 85) {
        regime.description = "Exceptional macro backdrop. Broad-based global strength.";
    } else if (finalScore >= 70) {
        regime.description = "Global macro conditions are highly supportive of equities.";
    } else if (finalScore >= 60) {
        regime.description = "Constructive setup. Minor headwinds exist.";
    } else if (finalScore >= 45) {
        regime.description = "Global macro forces are balanced.";
    } else if (finalScore >= 30) {
        regime.description = "Headwinds building. Caution warranted.";
    } else if (finalScore >= 15) {
        regime.description = "Severe macro headwinds. Capital preserving mode.";
    } else {
        regime.description = "Deep risk-off signal. Macro crisis indicators active.";
    }

    return {
        sections: sectionsArray,
        compositeScore: finalScore,
        regime,
        risks,
        tailwinds,
        rawScores: {
            dxy: scores.dxy?.score ?? null,
            usd_inr: scores.usd_inr?.score ?? null,
            crude: scores.crude?.score ?? null,
            gold: scores.gold?.score ?? null,
            silver: scores.silver?.score ?? null,
            us_10y_yield: scores.us_10y_yield?.score ?? null,
            sp_futures: scores.sp_futures?.score ?? null,
            nasdaq_futures: scores.nasdaq_futures?.score ?? null,
            dow_futures: scores.dow_futures?.score ?? null,
            vix: scores.vix?.score ?? null,
            bitcoin: scores.bitcoin?.score ?? null,
            eurusd: scores.eurusd?.score ?? null,
            usdjpy: scores.usdjpy?.score ?? null,
            nikkei: scores.nikkei?.score ?? null,
            ftse: scores.ftse?.score ?? null,
            dax: scores.dax?.score ?? null,
            hangseng: scores.hangseng?.score ?? null,
            shanghai: scores.shanghai?.score ?? null,
            cac40: scores.cac40?.score ?? null,
            eurostoxx: scores.eurostoxx?.score ?? null,
            copper: scores.copper?.score ?? null,
            natgas: scores.natgas?.score ?? null,
            wheat: scores.wheat?.score ?? null,
            aluminum: scores.aluminum?.score ?? null,
            move: scores.move?.score ?? null
        }
    };
};

export const useGlobalComposite = (manualOverrides, liveData = {}) => {
    return useMemo(() => {
        // Fallback logic: Upstox Live Data -> Manual Overrides
        const getVal = (key) => liveData[key] ?? manualOverrides[key];

        const scores = {
            dxy: scoreDXY(getVal('dxy')),
            usd_inr: scoreUSDINR(getVal('usd_inr')),
            crude: scoreCrude(getVal('crude')),
            gold: scoreGold(getVal('gold')),
            silver: scoreSilver(getVal('silver')),
            us_10y_yield: scoreUS10Y(getVal('us_10y_yield')),
            sp_futures: scoreSPFutures(getVal('sp_futures')),
            nasdaq_futures: scoreNasdaqFutures(getVal('nasdaq_futures')),
            dow_futures: scoreDowFutures(getVal('dow_futures')),
            vix: scoreVIX(getVal('vix')),
            bitcoin: scoreBitcoin(getVal('bitcoin')),
            eurusd: scoreEurusd(getVal('eurusd')),
            usdjpy: scoreUsdjpy(getVal('usdjpy')),
            nikkei: scoreNikkei(getVal('nikkei')),
            ftse: scoreFtse(getVal('ftse')),
            dax: scoreDax(getVal('dax')),
            hangseng: scoreHangseng(getVal('hangseng')),
            shanghai: scoreShanghai(getVal('shanghai')),
            cac40: scoreCac40(getVal('cac40')),
            eurostoxx: scoreEurostoxx(getVal('eurostoxx')),
            copper: scoreCopper(getVal('copper')),
            natgas: scoreNatgas(getVal('natgas')),
            wheat: scoreWheat(getVal('wheat')),
            aluminum: scoreAluminum(getVal('aluminum')),
            move: scoreMove(getVal('move'))
        };

        const engineOutput = computeGlobalComposite(scores);
        
        const result = {
            ...engineOutput,
            cardData: {
                dxy: { value: getVal('dxy'), ...scores.dxy },
                usd_inr: { value: getVal('usd_inr'), ...scores.usd_inr },
                crude: { value: getVal('crude'), ...scores.crude },
                gold: { value: getVal('gold'), ...scores.gold },
                silver: { value: getVal('silver'), ...scores.silver },
                us_10y_yield: { value: getVal('us_10y_yield'), ...scores.us_10y_yield },
                sp_futures: { value: getVal('sp_futures'), ...scores.sp_futures },
                nasdaq_futures: { value: getVal('nasdaq_futures'), ...scores.nasdaq_futures },
                dow_futures: { value: getVal('dow_futures'), ...scores.dow_futures },
                vix: { value: getVal('vix'), ...scores.vix },
                bitcoin: { value: getVal('bitcoin'), ...scores.bitcoin },
                eurusd: { value: getVal('eurusd'), ...scores.eurusd },
                usdjpy: { value: getVal('usdjpy'), ...scores.usdjpy },
                nikkei: { value: getVal('nikkei'), ...scores.nikkei },
                ftse: { value: getVal('ftse'), ...scores.ftse },
                dax: { value: getVal('dax'), ...scores.dax },
                hangseng: { value: getVal('hangseng'), ...scores.hangseng },
                shanghai: { value: getVal('shanghai'), ...scores.shanghai },
                cac40: { value: getVal('cac40'), ...scores.cac40 },
                eurostoxx: { value: getVal('eurostoxx'), ...scores.eurostoxx },
                copper: { value: getVal('copper'), ...scores.copper },
                natgas: { value: getVal('natgas'), ...scores.natgas },
                wheat: { value: getVal('wheat'), ...scores.wheat },
                aluminum: { value: getVal('aluminum'), ...scores.aluminum },
                move: { value: getVal('move'), ...scores.move }
            }
        };

        // Fire & Forget DB Sync
        if (typeof window !== 'undefined') {
            import('@/shared/utils/axiosInstance').then(({ default: axiosInstance }) => {
                axiosInstance.post('/api/v1/snapshots/header', {
                    instrument_key: 'GLOBAL',
                    category: 'global',
                    composite_score: engineOutput.compositeScore,
                    regime_json: engineOutput.regime,
                    tailwinds_json: engineOutput.tailwinds,
                    risks_json: engineOutput.risks
                }).catch(err => console.error("Failed to sync Global header:", err));
            });
        }

        return result;
    }, [manualOverrides, liveData]);
};
