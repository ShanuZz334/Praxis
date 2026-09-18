import { getCompositeColor } from '../../../../shared/config/scoreColors.js';
import { CARD_REGISTRY } from '../../../../shared/config/cardRegistry.js';
import { getTechnicalSectionWeights } from '../../../../config/weights/technicalSectionWeights.js';

export const TITLE_TO_ID = {
    // Trend
    'EMA 20': CARD_REGISTRY.ema_20.id,
    'EMA 50': CARD_REGISTRY.ema_50.id,
    'EMA 200': CARD_REGISTRY.ema_200.id,
    'ADX (14)': CARD_REGISTRY.adx.id,
    'ADX': CARD_REGISTRY.adx.id,
    'Supertrend': CARD_REGISTRY.supertrend.id,
    'Beta Correlation': CARD_REGISTRY.beta_correlation.id,
    'Beta': CARD_REGISTRY.beta_correlation.id,

    // Momentum
    'RSI (14)': CARD_REGISTRY.rsi.id,
    'Stoch RSI': CARD_REGISTRY.stoch_rsi.id,
    'MACD': CARD_REGISTRY.macd.id,

    // Volatility
    'Bollinger Bands': CARD_REGISTRY.bb_20_2.id,
    'ATR': CARD_REGISTRY.atr.id,

    // Volume
    'Volume SMA': CARD_REGISTRY.volume_sma.id,
    'OBV': CARD_REGISTRY.obv.id,
    'CMF': CARD_REGISTRY.cmf.id,
    'VWAP': CARD_REGISTRY.vwap.id,

    // Structure
    'Support': CARD_REGISTRY.support.id,
    'Resistance': CARD_REGISTRY.resistance.id,
    'Trendline': CARD_REGISTRY.trendline.id,
    'Pivot Points': CARD_REGISTRY.pivot.id,
    'Fibonacci': CARD_REGISTRY.fibonacci.id,

    // Breadth
    'Breadth Ratio (ADR)':  CARD_REGISTRY.breadth_ratio.id,
    'A/D Line':             CARD_REGISTRY.ad_line.id,
    'New Highs / Lows':     CARD_REGISTRY.nh_nl.id
};

export const TECHNICAL_CARD_MAP = {
    [CARD_REGISTRY.ema_20.id]: 'Trend', [CARD_REGISTRY.ema_50.id]: 'Trend', [CARD_REGISTRY.ema_200.id]: 'Trend', [CARD_REGISTRY.supertrend.id]: 'Trend', [CARD_REGISTRY.adx.id]: 'Trend', [CARD_REGISTRY.beta_correlation.id]: 'Trend',
    [CARD_REGISTRY.rsi.id]: 'Momentum', [CARD_REGISTRY.macd.id]: 'Momentum', [CARD_REGISTRY.stoch_rsi.id]: 'Momentum',
    [CARD_REGISTRY.bb_20_2.id]: 'Volatility', [CARD_REGISTRY.atr.id]: 'Volatility',
    [CARD_REGISTRY.volume_sma.id]: 'Volume', [CARD_REGISTRY.obv.id]: 'Volume', [CARD_REGISTRY.cmf.id]: 'Volume', [CARD_REGISTRY.vwap.id]: 'Volume',
    [CARD_REGISTRY.support.id]: 'Structure', [CARD_REGISTRY.resistance.id]: 'Structure', [CARD_REGISTRY.pivot.id]: 'Structure', [CARD_REGISTRY.fibonacci.id]: 'Structure', [CARD_REGISTRY.trendline.id]: 'Structure',
    [CARD_REGISTRY.breadth_ratio.id]: 'Breadth', [CARD_REGISTRY.ad_line.id]: 'Breadth', [CARD_REGISTRY.nh_nl.id]: 'Breadth'
};

export const ID_TO_TITLE = Object.entries(CARD_REGISTRY).reduce((acc, [key, conf]) => {
    acc[conf.id] = conf.displayName;
    return acc;
}, {});

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
    // MD-08 Fix: Use symmetric unbiased weighted mean instead of asymmetric one-sided lowest-score drop
    return weightedMean(valid);
}

function computeSections(scores) {
    const g = (id) => {
        const s = scores[id];
        return (s !== undefined && s !== null && !isNaN(Number(s))) ? Number(s) : null;
    };

    // Trend: Geometric Mean (trends must align/compound) - Optimized: Standardized on EMA 20/50/200 tri-factor
    const trend = weightedGeometricMean([
        { score: g(CARD_REGISTRY.ema_20.id), weight: 0.22 },
        { score: g(CARD_REGISTRY.ema_50.id), weight: 0.24 },
        { score: g(CARD_REGISTRY.ema_200.id), weight: 0.24 },
        { score: g(CARD_REGISTRY.supertrend.id), weight: 0.12 },
        { score: g(CARD_REGISTRY.adx.id), weight: 0.10 },
        { score: g(CARD_REGISTRY.beta_correlation.id), weight: 0.08 }
    ]);

    // Momentum: Weighted Mean - Optimized: Focused on RSI, MACD, Stoch RSI
    const momentum = weightedMean([
        { score: g(CARD_REGISTRY.rsi.id), weight: 0.45 },
        { score: g(CARD_REGISTRY.macd.id), weight: 0.40 },
        { score: g(CARD_REGISTRY.stoch_rsi.id), weight: 0.15 }
    ]);

    // Volatility: Harmonic Mean (penalizes extreme volatility states) - BB + ATR + KC
    const volatility = weightedHarmonicMean([
        { score: g(CARD_REGISTRY.bb_20_2.id), weight: 0.45 },
        { score: g(CARD_REGISTRY.atr.id), weight: 0.35 },
        { score: g(CARD_REGISTRY.kc?.id || 'kc'), weight: 0.20 }
    ]);

    // Volume: Standard Weighted Mean
    const volume = weightedMean([
        { score: g(CARD_REGISTRY.volume_sma.id), weight: 0.4 },
        { score: g(CARD_REGISTRY.obv.id), weight: 0.3 },
        { score: g(CARD_REGISTRY.cmf.id), weight: 0.2 },
        { score: g(CARD_REGISTRY.vwap.id), weight: 0.1 }
    ]);

    // Structure: Min-Anchored Blend or Weighted Mean (levels must hold)
    const structure = weightedMean([
        { score: g(CARD_REGISTRY.support.id), weight: 0.25 },
        { score: g(CARD_REGISTRY.resistance.id), weight: 0.25 },
        { score: g(CARD_REGISTRY.trendline.id), weight: 0.2 },
        { score: g(CARD_REGISTRY.pivot.id), weight: 0.15 },
        { score: g(CARD_REGISTRY.fibonacci.id), weight: 0.15 }
    ]);

    // Breadth: Direct macro proxy - Optimized: Automated Advance/Decline and High/Low feeds
    const breadth = weightedGeometricMean([
        { score: g(CARD_REGISTRY.breadth_ratio.id), weight: 0.45 },
        { score: g(CARD_REGISTRY.ad_line.id), weight: 0.35 },
        { score: g(CARD_REGISTRY.nh_nl.id), weight: 0.20 }
    ]);

    return { trend, momentum, volatility, volume, structure, breadth };
}

export function computeTechnicalComposite(scoresData, isIndex = false, tradingMode = 'swing') {
    if (!scoresData || Object.keys(scoresData).length === 0) {
        return { compositeScore: null, regime: { label: 'Awaiting Data', color: 'text-slate-400' }, sections: [], rawSections: {}, cardScores: {} };
    }

    const scores = scoresData;
    const { trend, momentum, volatility, volume, structure, breadth } = computeSections(scores);

    // Resolve mode-specific section weights from centralized config
    const sw = getTechnicalSectionWeights(tradingMode);

    const sectionsData = [
        { id: 'trend',      label: 'Trend',      shortLabel: 'TRN',  score: trend      !== null ? Math.round(trend)      : null, weight: sw.Trend      || 0.30 },
        { id: 'momentum',   label: 'Momentum',   shortLabel: 'MOM',  score: momentum   !== null ? Math.round(momentum)   : null, weight: sw.Momentum   || 0.25 },
        { id: 'volatility', label: 'Volatility', shortLabel: 'VOL',  score: volatility !== null ? Math.round(volatility) : null, weight: sw.Volatility || 0.15 },
        { id: 'structure',  label: 'Structure',  shortLabel: 'STR',  score: structure  !== null ? Math.round(structure)  : null, weight: sw.Structure  || 0.15 }
    ];

    if (isIndex) {
        sectionsData.push({ id: 'breadth', label: 'Breadth', shortLabel: 'BRD',  score: breadth !== null ? Math.round(breadth) : null, weight: sw.Breadth || 0.20 });
    } else {
        sectionsData.push({ id: 'volume',  label: 'Volume',  shortLabel: 'VOLM', score: volume  !== null ? Math.round(volume)  : null, weight: sw.Volume  || 0.15 });
    }

    const validSections = sectionsData.filter(s => s.score !== null);
    
    let compositeScore = 0;
    if (validSections.length > 0) {
        const totalW = validSections.reduce((acc, s) => acc + s.weight, 0);
        compositeScore = validSections.reduce((acc, s) => acc + (s.score * s.weight), 0) / totalW;
        
        // Apply distress penalties (convex weighting)
        const distressCount = validSections.filter(x => x.score < 25).length;
        compositeScore = Math.max(0, compositeScore - distressCount * 4);

        const adxScore = scores[CARD_REGISTRY.adx.id];
        if (adxScore !== undefined && adxScore !== null) {
            if (adxScore < 40) {
                // Low ADX (weak trend) pulls composite towards neutral 50
                compositeScore = 50 + (compositeScore - 50) * 0.7;
            } else if (adxScore > 60) {
                // High ADX (strong trend) amplifies the composite direction
                compositeScore = Math.max(0, Math.min(100, 50 + (compositeScore - 50) * 1.2));
            }
        }
        compositeScore = Math.round(compositeScore);
    }

    // Regime uses Table 1: Composite Score Palette (7 tiers)
    const compositeColor = getCompositeColor(compositeScore);
    const regime = validSections.length > 0 ? {
        label: compositeColor.label,
        hexColor: compositeColor.hex,
        cssColor: `text-[${compositeColor.hex}]`,
    } : {
        label: 'Awaiting Data',
        hexColor: '#4B5563',
        cssColor: 'text-slate-400',
    };

    const result = {
        compositeScore,
        regime,
        sections: sectionsData,
        rawSections: { trend, momentum, volatility, volume, structure, breadth },
        cardScores: scores
    };
    
    result.nestedTreePayload = buildTechnicalNestedPayload(result, scores, isIndex);
    return result;
}

function buildTechnicalNestedPayload(result, scores, isIndex) {
    const sectionsMap = {};

    Object.entries(scores).forEach(([id, score]) => {
        if (score === null || score === undefined || isNaN(score)) return;
        // Strict guard against cross-mode card leaks
        if (isIndex && (id === 'beta_correlation' || id === 'volume_sma' || id === 'obv' || id === 'cmf' || id === 'vwap')) return;
        if (!isIndex && (id === 'breadth_ratio' || id === 'ad_line' || id === 'nh_nl')) return;

        const secName = TECHNICAL_CARD_MAP[id];
        if (!secName) return;
        if (!sectionsMap[secName]) sectionsMap[secName] = { name: secName, score: 0, cards: [] };
        
        let normalized = 0;
        if (score > 70) normalized = 1;
        else if (score < 30) normalized = -1;
        
        sectionsMap[secName].cards.push({
            name: ID_TO_TITLE[id] || id,
            score: normalized,
            value: Number(score)
        });
    });
    
    Object.values(sectionsMap).forEach(sec => {
        const rSec = result.sections.find(r => r.label.toLowerCase() === sec.name.toLowerCase() || (r.shortLabel && r.shortLabel.toLowerCase() === sec.name.substring(0,3).toLowerCase()));
        if (rSec) {
            sec.score = rSec.score;
            sec.weight = rSec.weight;
        }
    });

    return {
        engines: [{
            name: isIndex ? "Technicals (Index)" : "Technicals (Company)",
            score: result.compositeScore,
            sections: Object.values(sectionsMap)
        }]
    };
}

export function generateAiInsightTechnical(compositeScore, rawSections, isIndex, tradingMode = 'swing') {
    const modeLabel = tradingMode === 'positional' ? 'Positional' : tradingMode === 'intraday' ? 'Intraday' : 'Swing';

    if (compositeScore >= 75) {
        return `[${modeLabel}] Strong technical confirmation. Trend and momentum are strongly aligned. Buyers are in full control — ${tradingMode === 'intraday' ? 'tape and VWAP confirm aggression' : tradingMode === 'positional' ? 'price is above all key MAs with healthy structure' : 'breakouts above resistance are holding'}.`;
    } else if (compositeScore >= 55) {
        return `[${modeLabel}] Bullish bias. Trend indicates upward momentum, though there may be minor pullbacks. ${tradingMode === 'intraday' ? 'Watch VWAP reclaim for intraday entries.' : tradingMode === 'positional' ? 'Hold positions while price stays above EMA 50.' : 'Look for continuation setups on pullbacks to support.'}`;
    } else if (compositeScore <= 25) {
        return `[${modeLabel}] Strong bearish structure. Multiple technical indicators confirm a robust downtrend. ${tradingMode === 'intraday' ? 'Short bias below VWAP with volume confirmation.' : tradingMode === 'positional' ? 'Price is below key MAs — avoid longs until structure repairs.' : 'Avoid long positions until momentum reversal is confirmed.'}`;
    } else if (compositeScore <= 45) {
        return `[${modeLabel}] Bearish bias. Momentum is fading and support levels are being tested. ${tradingMode === 'intraday' ? 'Intraday bulls are losing control — watch for ORB failure.' : tradingMode === 'positional' ? 'Weekly structure is deteriorating — reduce exposure.' : 'Caution advised — wait for clear trend resumption signal.'}`;
    }
    return `[${modeLabel}] Market is range-bound and consolidating. ${tradingMode === 'intraday' ? 'Avoid directional bias — trade the ORB range only.' : tradingMode === 'positional' ? 'Wait for a confirmed weekly breakout before adding positions.' : 'Wait for a clear breakout above resistance or breakdown below support.'}`;
}

const defaultReturn = { score: null, bias: "Neutral", confidence: "0%", aiInsight: "Awaiting valid data to calculate." };

export function scoreADLineCard(val) {
    if (val === null || val === undefined || isNaN(val)) return defaultReturn;
    let score = 50, bias = "Neutral", insight = "A/D Line is flat, showing indecision.";
    if (val > 1000) { score = 85; bias = "Strong Bullish"; insight = `A/D Line at ${val}. Broad and aggressive accumulation across the market. Strongly supports the uptrend.`; }
    else if (val > 0) { score = 65; bias = "Bullish"; insight = `A/D Line is positive (${val}). More stocks are participating in the upside, confirming a healthy market structure.`; }
    else if (val < -1000) { score = 15; bias = "Strong Bearish"; insight = `A/D Line at ${val}. Severe underlying weakness with broad distribution. Very unhealthy market structure.`; }
    else if (val < 0) { score = 35; bias = "Bearish"; insight = `A/D Line is negative (${val}). Market participation is weak, indicating underlying selling pressure.`; }
    return { score, bias, confidence: "85%", aiInsight: insight };
}

export function scoreADXCard(valObj, isBullish = null) {
    if (valObj === null || valObj === undefined) return defaultReturn;
    
    const manualVal = parseFloat(valObj);
    if (typeof valObj !== 'object' && !isNaN(manualVal)) valObj = { value: manualVal, prev: undefined };
    
    if (!valObj || valObj.value === null || valObj.value === undefined || isNaN(valObj.value)) return defaultReturn;
    
    const { prev, pdi, mdi } = valObj;
    let val = Number(valObj.value);
    
    // Directional orientation:
    // 1. Explicit isBullish parameter takes precedence
    // 2. +DI / -DI directional movement indicator polarity
    // 3. Fallback: null (direction unknown)
    let isBull = isBullish !== null ? Boolean(isBullish) : null;
    if (isBull === null && pdi !== undefined && mdi !== undefined) {
        isBull = Number(pdi) >= Number(mdi);
    }

    const isRising = prev !== undefined && prev !== null ? val > prev : true;
    const velocity = prev !== undefined && prev !== null ? (val - prev).toFixed(2) : "0.00";

    let score = 50, bias = "Choppy / Ranging", insight = "Trend is weak.";

    if (val > 25) {
        // Strong Trend Regime (Institutional: directional strength)
        if (isBull === true) {
            score = isRising ? 85 : 75;
            bias = isRising ? "Strong Bullish Trend" : "Fading Bullish Trend";
            insight = `ADX is elevated at ${val.toFixed(2)} with positive directional bias. ${isRising ? 'Uptrend is accelerating with strong institutional conviction (Velocity: +' + velocity + ').' : 'Uptrend is robust but losing velocity (Velocity: ' + velocity + ').'}`;
        } else if (isBull === false) {
            score = isRising ? 15 : 25;
            bias = isRising ? "Strong Bearish Trend" : "Fading Bearish Trend";
            insight = `ADX is elevated at ${val.toFixed(2)} with negative directional bias. ${isRising ? 'Downtrend is accelerating with severe institutional selling pressure (Velocity: +' + velocity + ').' : 'Downtrend remains active but velocity is decelerating (Velocity: ' + velocity + ').'}`;
        } else {
            // Direction unconfirmed: score trend strength with neutral bias
            score = isRising ? 75 : 65;
            bias = isRising ? "Strong Trend" : "Fading Trend";
            insight = `ADX is actively elevated at ${val.toFixed(2)}. ${isRising ? 'Trend is accelerating (Velocity: +' + velocity + ').' : 'Trend is strong but losing velocity (Velocity: ' + velocity + ').'}`;
        }
    } else if (val > 20) {
        // Developing Trend Regime
        if (isBull === true) {
            score = isRising ? 65 : 55;
            bias = "Developing Bullish Trend";
            insight = `ADX is at ${val.toFixed(2)}, building upward trend momentum. ${isRising ? 'Bullish continuation probability is rising.' : 'Bullish momentum is stabilizing.'}`;
        } else if (isBull === false) {
            score = isRising ? 35 : 45;
            bias = "Developing Bearish Trend";
            insight = `ADX is at ${val.toFixed(2)}, building downward trend momentum. ${isRising ? 'Bearish continuation probability is rising.' : 'Bearish pressure is stabilizing.'}`;
        } else {
            score = isRising ? 60 : 45;
            bias = "Developing Trend";
            insight = `ADX is at ${val.toFixed(2)}, approaching the trend threshold. ${isRising ? 'Directional momentum is building.' : 'Trend structure is deteriorating.'}`;
        }
    } else {
        // Range-bound / Chop Regime
        score = 50;
        bias = "Choppy / Non-Trending";
        insight = `ADX is at ${val.toFixed(2)}, below the trending threshold of 20. Market is consolidating in a range. Avoid aggressive breakout/trend-following systems.`;
    }

    return { score, bias, confidence: "80%", aiInsight: insight };
}

export function scoreATRCard(val, currentPrice, atrBaseline = null) {
    if (val === null || val === undefined || isNaN(val) || !currentPrice) return defaultReturn;
    const atr = Number(val);
    const price = Number(currentPrice);
    const atrPct = (atr / price) * 100;

    let score = 50, bias = "Normal Volatility", insight = `Average True Range is ${atr.toFixed(2)} points (${atrPct.toFixed(2)}% of price).`;

    // Continuous scaling to avoid cliff jumps and harmonic-mean distortion
    if (atrBaseline && Number(atrBaseline) > 0) {
        const ratio = atr / Number(atrBaseline);
        if (ratio > 1.5) {
            score = Math.min(85, Math.round(75 + (ratio - 1.5) * 20));
            bias = "High Volatility Expansion";
            insight += " Volatility has expanded significantly above historical baseline. Wider stops required.";
        } else if (ratio > 1.0) {
            score = Math.round(55 + (ratio - 1.0) * 40);
            bias = "Moderate Volatility";
            insight += " Volatility is slightly above average. Healthy expansion for swing continuation.";
        } else if (ratio >= 0.7) {
            score = Math.round(45 + ((ratio - 0.7) / 0.3) * 10);
            bias = "Normal Volatility";
            insight += " Volatility is moving within normal historical parameters.";
        } else {
            score = Math.max(35, Math.round(45 - ((0.7 - ratio) / 0.7) * 10));
            bias = "Volatility Compression";
            insight += " Volatility is heavily compressed. High probability of imminent explosive expansion.";
        }
    } else {
        // Piecewise continuous percentage scaling
        if (atrPct >= 3.0) {
            score = Math.min(85, Math.round(75 + ((atrPct - 3.0) / 2.0) * 10));
            bias = "Extreme Volatility";
            insight += " The market is experiencing extreme price swings. Reduce position sizing and avoid tight stops.";
        } else if (atrPct >= 1.8) {
            score = Math.round(65 + ((atrPct - 1.8) / 1.2) * 10);
            bias = "High Volatility";
            insight += " Volatility is elevated. Trend breakout setups have favorable range expansion.";
        } else if (atrPct >= 0.8) {
            score = Math.round(50 + ((atrPct - 0.8) / 1.0) * 15);
            bias = "Normal Volatility";
            insight += " Volatility is balanced within standard institutional trading ranges.";
        } else {
            score = Math.max(40, Math.round(50 - ((0.8 - atrPct) / 0.8) * 10));
            bias = "Low Volatility / Compression";
            insight += " Volatility is compressed below 0.8%. A major directional volatility breakout is approaching.";
        }
    }

    return { score, bias, confidence: "80%", aiInsight: insight };
}

export function scoreBBCard(valObj) {
    if (!valObj || valObj.pb === undefined) return defaultReturn;
    const { pb } = valObj;
    let score = 50, bias = "Neutral", insight = "Trading within Bollinger Bands.";
    if (pb > 1.0) { 
        score = 65; 
        bias = "Upper Band Breakout"; 
        insight = `Price has broken above the upper Bollinger Band (%B: ${Number(pb).toFixed(2)}). Strong breakout momentum active, though watch for exhaustion.`; 
    } else if (pb < 0.0) { 
        score = 30; 
        bias = "Lower Band Breakdown"; 
        insight = `Price has broken below the lower Bollinger Band (%B: ${Number(pb).toFixed(2)}). Downside momentum dominant with breakdown risk.`; 
    } else if (pb >= 0.8) { 
        score = 70; 
        bias = "Near Upper Band"; 
        insight = "Price is pushing near the upper band with strong buyer demand."; 
    } else if (pb <= 0.2) { 
        score = 35; 
        bias = "Near Lower Band"; 
        insight = "Price is pushing near the lower band with persistent selling pressure."; 
    } else if (pb > 0.5) { 
        score = 55; 
        bias = "Upper Half"; 
        insight = "Price is trading in the upper half of the Bollinger Bands, maintaining positive bias."; 
    } else { 
        score = 45; 
        bias = "Lower Half"; 
        insight = "Price is trading in the lower half of the Bollinger Bands, maintaining soft bias."; 
    }
    return { score, bias, confidence: "80%", aiInsight: insight };
}

export function scoreBreadthRatioCard(val) {
    if (val === null || val === undefined || isNaN(val)) return defaultReturn;
    val = Number(val);
    let score = 50, bias = "Neutral", insight = "Market breadth is evenly balanced between advancing and declining issues.";
    if (val >= 2.0) { score = 85; bias = "Strong Bullish"; insight = `Breadth Ratio at ${val.toFixed(2)}. Overwhelming buying pressure with 2+ stocks advancing for every decliner.`; }
    else if (val > 1.2) { score = 65; bias = "Bullish"; insight = `Breadth Ratio is positive at ${val.toFixed(2)}. Bulls have clear control of the broader market.`; }
    else if (val <= 0.5) { score = 15; bias = "Strong Bearish"; insight = `Breadth Ratio at ${val.toFixed(2)}. Severe selling pressure with 2+ stocks declining for every advancer.`; }
    else if (val < 0.8) { score = 35; bias = "Bearish"; insight = `Breadth Ratio is negative at ${val.toFixed(2)}. Bears have control of the broader market.`; }
    return { score, bias, confidence: "85%", aiInsight: insight };
}

export function scoreCmfCard(val) {
    if (val === null || val === undefined || isNaN(val)) return defaultReturn;
    val = Number(val);
    let score = 50, bias = "Neutral", insight = "Money flow is neutral.";
    if (val > 0.2) { 
        score = 85; bias = "Strong Bullish"; 
        insight = `CMF at ${val.toFixed(2)}. Extreme buying pressure. Institutions are actively accumulating.`; 
    } else if (val > 0.05) { 
        score = 65; bias = "Bullish"; 
        insight = `CMF at ${val.toFixed(2)}. Positive money flow confirms underlying buying interest.`; 
    } else if (val < -0.2) { 
        score = 15; bias = "Strong Bearish"; 
        insight = `CMF at ${val.toFixed(2)}. Heavy distribution. Institutions are actively offloading positions.`; 
    } else if (val < -0.05) { 
        score = 35; bias = "Bearish"; 
        insight = `CMF at ${val.toFixed(2)}. Negative money flow indicates sustained selling pressure.`; 
    } else {
        score = 50; bias = "Neutral";
        insight = `CMF at ${val.toFixed(2)}. Capital flows are balanced, showing no clear institutional bias.`;
    }
    return { score, bias, confidence: "75%", aiInsight: insight };
}

function evaluateMA(val, price, period, type = "EMA") {
    if (val === null || val === undefined || isNaN(val) || !price || isNaN(price)) return defaultReturn;
    
    val = Number(val);
    price = Number(price);
    const diffPct = ((price - val) / val) * 100;
    
    // Institutional threshold scaling: Longer periods require wider percentage thresholds
    const baseThresh = 0.5 * Math.log10(period); 
    const extendedThresh = baseThresh * 2.5;     
    const testThresh = baseThresh * 0.4;         

    let score = 50, bias = "Neutral", insight = `Trading near the ${period} ${type}.`;
    let confidence = "70%";

    if (diffPct >= extendedThresh) {
        // Continuous asymptotic approach to 90 (starts at 80 at extendedThresh)
        score = Math.min(90, Math.round(80 + Math.min(1.0, (diffPct - extendedThresh) / extendedThresh) * 10));
        bias = "Strong Bullish";
        confidence = "85%";
        insight = `Price is significantly extended (+${diffPct.toFixed(2)}%) above the ${period} ${type}. Strong momentum is active, but monitor for mean-reversion exhaustion.`;
    } else if (diffPct > testThresh) {
        // Continuous transition from 60 at testThresh up to 80 at extendedThresh
        score = Math.round(60 + ((diffPct - testThresh) / (extendedThresh - testThresh)) * 20);
        bias = "Bullish";
        confidence = "75%";
        insight = `Price is trending healthily (+${diffPct.toFixed(2)}%) above the ${period} ${type}, establishing a solid directional advantage for buyers.`;
    } else if (diffPct >= 0) {
        // Continuous transition from 50 at 0 up to 60 at testThresh
        score = Math.round(50 + (diffPct / testThresh) * 10);
        bias = "Neutral-Bullish";
        confidence = "60%";
        insight = `Price is compressing (+${diffPct.toFixed(2)}%) just above the ${period} ${type}. Dynamic support is holding buyer conviction.`;
    } else if (diffPct >= -testThresh) {
        // Continuous transition from 50 at 0 down to 40 at -testThresh
        score = Math.round(50 - (Math.abs(diffPct) / testThresh) * 10);
        bias = "Neutral-Bearish";
        confidence = "60%";
        insight = `Price is testing immediate dynamic overhead resistance at the ${period} ${type} (${diffPct.toFixed(2)}%).`;
    } else if (diffPct > -extendedThresh) {
        // Continuous transition from 40 down to 20 at -extendedThresh
        score = Math.round(40 - ((Math.abs(diffPct) - testThresh) / (extendedThresh - testThresh)) * 20);
        bias = "Bearish";
        confidence = "75%";
        insight = `Price is established below the ${period} ${type} (${diffPct.toFixed(2)}%), confirming sustained directional control for sellers.`;
    } else {
        // Continuous asymptotic approach to 10 (starts at 20 at -extendedThresh)
        score = Math.max(10, Math.round(20 - Math.min(1.0, (Math.abs(diffPct) - extendedThresh) / extendedThresh) * 10));
        bias = "Strong Bearish";
        confidence = "85%";
        insight = `Price is heavily depressed (${diffPct.toFixed(2)}%) below the ${period} ${type}. Market structure is severely impaired by sustained supply.`;
    }

    return { score, bias, confidence, aiInsight: insight };
}

export function scoreEMA20Card(val, price) { return evaluateMA(val, price, 20, "EMA"); }
export function scoreEMA50Card(val, price) { return evaluateMA(val, price, 50, "EMA"); }
export function scoreEMA200Card(val, price) { return evaluateMA(val, price, 200, "EMA"); }

export function scoreFibonacciCard(valObj, currentPrice) {
    if (valObj === null || valObj === undefined || !currentPrice) return defaultReturn;
    
    const manualVal = parseFloat(valObj);
    if (typeof valObj !== 'object' && !isNaN(manualVal)) {
        const dist = ((currentPrice - manualVal) / currentPrice) * 100;
        let score = 50, bias = "Neutral", insight = "Tracking manual Fibonacci level.";
        if (currentPrice > manualVal) { score = 65; bias = "Bullish"; insight = "Price is holding above the manual Fibonacci level."; }
        else { score = 35; bias = "Bearish"; insight = "Price is below the manual Fibonacci level."; }
        return { score, bias, confidence: "70%", aiInsight: insight, nearestFib: "Manual", nearestFibVal: manualVal, distancePct: Math.abs(dist) };
    }

    if (!valObj.level_500) return defaultReturn;
    const { level_0, level_236, level_382, level_500, level_618, level_705, level_786, level_100, level_1272, level_1414, level_1618, level_2000, level_2618 } = valObj;
    
    let score = 50, bias = "Neutral", insight = "Tracking Fibonacci retracements.";
    
    if (currentPrice >= level_236) {
        score = 85; bias = "Strong Continuation"; insight = "Price pushed past 0.236. Extremely shallow retracement indicates buyers are aggressively buying the dip.";
    } else if (currentPrice >= level_382) {
        score = 70; bias = "Healthy Retracement"; insight = "Price holding the 0.236 - 0.382 zone. A perfectly healthy structural pullback in an established uptrend.";
    } else if (currentPrice >= level_618) {
        score = 50; bias = "Golden Pocket"; insight = "Price is battling in the 0.5 - 0.618 golden pocket. This is the ultimate make-or-break zone for trend continuation.";
    } else if (currentPrice >= level_100) {
        score = 30; bias = "Deep Retracement"; insight = "Price fell below 0.618 into a deep retracement. The prevailing trend structure is severely compromised.";
    } else {
        score = 10; bias = "Trend Failure"; insight = "Price completely broke the 1.0 origin level. 100% retracement confirms total failure of the previous trend.";
    }

    // Find nearest Fib
    const levels = [
        { name: "0.000", val: level_0 },
        { name: "0.236", val: level_236 },
        { name: "0.382", val: level_382 },
        { name: "0.500", val: level_500 },
        { name: "0.618", val: level_618 },
        { name: "0.705", val: level_705 },
        { name: "0.786", val: level_786 },
        { name: "1.000", val: level_100 },
        { name: "1.272", val: level_1272 },
        { name: "1.414", val: level_1414 },
        { name: "1.618", val: level_1618 },
        { name: "2.000", val: level_2000 },
        { name: "2.618", val: level_2618 }
    ];

    let nearest = null;
    let minDiff = Infinity;
    for (const lvl of levels) {
        if (lvl.val === undefined) continue;
        const diff = Math.abs(currentPrice - lvl.val);
        if (diff < minDiff) {
            minDiff = diff;
            nearest = lvl;
        }
    }
    
    let distancePct = nearest ? (minDiff / currentPrice) * 100 : null;

    return { 
        score, 
        bias, 
        confidence: "85%", 
        aiInsight: insight,
        nearestFib: nearest ? nearest.name : null,
        nearestFibVal: nearest ? nearest.val : null,
        distancePct
    };
}

export function scoreKCCard(valObj, currentPrice) {
    if (valObj === null || valObj === undefined || !currentPrice) return defaultReturn;

    const manualVal = parseFloat(valObj);
    if (typeof valObj !== 'object' && !isNaN(manualVal)) {
        const diffPct = ((currentPrice - manualVal) / manualVal) * 100;
        let score = 50, bias = "Neutral", insight = "Tracking manual KC Middle.";
        if (diffPct > 2) { score = 85; bias = "Bullish"; }
        else if (diffPct < -2) { score = 15; bias = "Bearish"; }
        return { score, bias, confidence: "70%", aiInsight: insight };
    }

    if (valObj.middle === undefined) return defaultReturn;
    const { lower, upper } = valObj;
    
    let score = 50, bias = "Neutral", insight = "Trading within Keltner Channels.";
    if (currentPrice > upper) {
        score = 80; bias = "Strong Bullish"; insight = "Price broke above upper Keltner Channel. Indicates strong trend continuation.";
    } else if (currentPrice < lower) {
        score = 20; bias = "Strong Bearish"; insight = "Price broke below lower Keltner Channel. Indicates strong downward momentum.";
    } else if (currentPrice > valObj.middle) {
        score = 60; bias = "Slightly Bullish"; insight = "Price holding above middle line in upper half of channel.";
    } else {
        score = 40; bias = "Slightly Bearish"; insight = "Price holding below middle line in lower half of channel.";
    }
    return { score, bias, confidence: "75%", aiInsight: insight };
}

export function scoreMACDCard(valObj) {
    if (!valObj || valObj.MACD === undefined || valObj.signal === undefined || valObj.histogram === undefined) return defaultReturn;
    
    const { MACD, signal, histogram } = valObj;
    let score = 50, bias = "Neutral", insight = "MACD momentum is flat.";
    
    // Crossover Logic + Histogram Acceleration
    if (MACD > signal) {
        if (histogram > 0 && histogram > Math.abs(MACD) * 0.1) {
            score = 85; bias = "Strong Bullish"; 
            insight = "Bullish crossover active and momentum is accelerating upward.";
        } else {
            score = 65; bias = "Bullish"; 
            insight = "MACD line is above the Signal line, maintaining a bullish bias, but momentum is currently decelerating.";
        }
    } else {
        if (histogram < 0 && Math.abs(histogram) > Math.abs(MACD) * 0.1) {
            score = 15; bias = "Strong Bearish"; 
            insight = "Bearish crossover active and downward momentum is accelerating aggressively.";
        } else {
            score = 35; bias = "Bearish"; 
            insight = "MACD line is below the Signal line. Sellers are in control, though momentum may be stabilizing.";
        }
    }
    
    return { score, bias, confidence: "85%", aiInsight: insight };
}

export function scoreMcClellanCard(val) {
    if (val === null || val === undefined || isNaN(val)) return defaultReturn;
    val = Number(val);
    let score = 50, bias = "Neutral", insight = "Oscillator is hovering near the zero line, indicating a balanced market.";
    if (val > 50) { score = 90; bias = "Overbought / Strong Bull"; insight = `Oscillator is extremely elevated at +${val.toFixed(1)}. Massive liquidity injection, but vulnerable to short-term mean reversion.`; }
    else if (val > 0) { score = 70; bias = "Bullish"; insight = `Oscillator is positive (+${val.toFixed(1)}). Capital is actively flowing into the market, supporting an uptrend.`; }
    else if (val < -50) { score = 10; bias = "Oversold / Strong Bear"; insight = `Oscillator is deeply negative (${val.toFixed(1)}). Liquidity is drained. Reversal is possible, but current trend is heavily bearish.`; }
    else if (val < 0) { score = 30; bias = "Bearish"; insight = `Oscillator is negative (${val.toFixed(1)}). Capital is flowing out of the market, indicating underlying structural weakness.`; }
    return { score, bias, confidence: "80%", aiInsight: insight };
}

export function scoreNhnlCard(val) {
    if (val === null || val === undefined || isNaN(val)) return defaultReturn;
    let score = 50, bias = "Neutral", insight = "New Highs and New Lows are relatively matched, indicating market consolidation.";
    if (val > 150) { score = 90; bias = "Strong Bullish"; insight = `Net High/Low at +${val}. Exceptional market strength. Breakout momentum is broadening across many sectors.`; }
    else if (val > 20) { score = 70; bias = "Bullish"; insight = `Net High/Low is positive (+${val}). A healthy number of stocks are hitting new highs, validating the uptrend.`; }
    else if (val < -150) { score = 10; bias = "Strong Bearish"; insight = `Net High/Low at ${val}. Severe market weakness. Widespread breakdowns indicate a dominant downtrend.`; }
    else if (val < -20) { score = 30; bias = "Bearish"; insight = `Net High/Low is negative (${val}). Increasing numbers of stocks hitting new lows points to structural deterioration.`; }
    return { score, bias, confidence: "80%", aiInsight: insight };
}

export function scoreObvCard(val, sma, volumeSma = null) {
    if (val === null || val === undefined || isNaN(val) || sma === null || sma === undefined || isNaN(sma)) return defaultReturn;
    val = Number(val);
    sma = Number(sma);
    
    let score = 50, bias = "Neutral", insight = "OBV tracking normal.";
    
    // Institutional normalization:
    // When volumeSma is available, normalize displacement (val - sma) against average daily volume.
    // Over a 20-period lookback, excess volume accumulation > 1.5-2x average daily volume represents strong institutional bias.
    let normMetric = 0;
    if (volumeSma && Number(volumeSma) > 0) {
        normMetric = (val - sma) / Number(volumeSma);
    } else {
        // Safe clamped denominator to prevent near-zero singularity when cumulative OBV crosses 0
        const safeDenom = Math.max(Math.abs(sma), 100000);
        normMetric = ((val - sma) / safeDenom) * 20;
    }
    
    if (normMetric > 1.5) { 
        score = 85; bias = "Strong Bullish Accumulation"; 
        insight = "OBV is surging well above its moving average. Strong institutional accumulation confirms buyer dominance."; 
    } else if (normMetric > 0.3) { 
        score = 65; bias = "Bullish Accumulation"; 
        insight = "OBV is trending positively above its average, confirming orderly accumulation."; 
    } else if (normMetric < -1.5) { 
        score = 15; bias = "Strong Bearish Distribution"; 
        insight = "OBV has broken down sharply below its moving average. Institutional distribution confirms heavy selling pressure."; 
    } else if (normMetric < -0.3) { 
        score = 35; bias = "Bearish Distribution"; 
        insight = "OBV is drifting below its average, indicating persistent supply overhead."; 
    } else {
        score = 50; bias = "Balanced Money Flow";
        insight = "OBV is closely tracking its moving average. Supply and demand volumes are currently in equilibrium.";
    }
    return { score, bias, confidence: "75%", aiInsight: insight };
}

export function scorePivotCard(valObj, currentPrice) {
    if (valObj === null || valObj === undefined || !currentPrice) return defaultReturn;

    const manualVal = parseFloat(valObj);
    if (typeof valObj !== 'object' && !isNaN(manualVal)) {
        const dist = ((currentPrice - manualVal) / currentPrice) * 100;
        let score = 50, bias = "Neutral", insight = "Tracking manual Pivot Point.";
        if (currentPrice > manualVal) { score = 65; bias = "Bullish"; }
        else { score = 35; bias = "Bearish"; }
        return { score, bias, confidence: "70%", aiInsight: insight, nearestLabel: "Manual", nearestVal: manualVal, distancePct: Math.abs(dist) };
    }

    if (valObj.p === undefined) return defaultReturn;
    const { s1, s2, s3, p, r1, r2, r3 } = valObj;
    let score = 50, bias = "Neutral", insight = "Trading within daily pivot range.";
    
    if (r3 && currentPrice >= r3) {
        score = 95; bias = "Parabolic Breakout"; insight = "Price smashed through R3 resistance. Extreme parabolic momentum, highly vulnerable to mean reversion.";
    } else if (currentPrice >= r2) {
        score = 90; bias = "Extreme Breakout"; insight = "Price smashed through R2 resistance. Exceptionally strong intraday bullish momentum, but watch for exhaustion.";
    } else if (currentPrice >= r1) {
        score = 75; bias = "Bullish Extension"; insight = "Price cleared R1 resistance. Bulls have established a new higher intraday range.";
    } else if (s3 && currentPrice <= s3) {
        score = 5; bias = "Capitulation"; insight = "Price crashed below S3 support. Absolute structural collapse indicating extreme panic selling.";
    } else if (currentPrice <= s2) {
        score = 10; bias = "Extreme Breakdown"; insight = "Price crashed below S2 support. Severe structural damage indicating panic selling.";
    } else if (currentPrice <= s1) {
        score = 25; bias = "Bearish Extension"; insight = "Price lost S1 support. Sellers have complete control over the short-term structure.";
    } else if (currentPrice > p) {
        const dist = ((currentPrice - p) / p) * 100;
        score = 60; bias = "Slightly Bullish"; insight = `Price holding above the daily Pivot by ${dist.toFixed(2)}%. Bulls maintain a slight intraday advantage.`;
    } else {
        const dist = ((p - currentPrice) / p) * 100;
        score = 40; bias = "Slightly Bearish"; insight = `Price trapped below the daily Pivot by ${dist.toFixed(2)}%. Bears maintain a slight intraday advantage.`;
    }
    return { score, bias, confidence: "85%", aiInsight: insight };
}

export function scoreResistanceCard(val, currentPrice) {
    if (val === null || val === undefined || isNaN(val) || !currentPrice) return defaultReturn;
    const dist = ((val - currentPrice) / currentPrice) * 100;
    
    let score = 50, bias = "Neutral", insight = "Tracking resistance.";
    if (dist < -1) {
        score = 85; bias = "Strong Breakout"; insight = `Price decisively cleared major resistance (by ${Math.abs(dist).toFixed(2)}%). Structural ceiling destroyed, bulls in full control.`;
    } else if (dist < 0) {
        score = 75; bias = "Breakout"; insight = `Price broke above major resistance by ${Math.abs(dist).toFixed(2)}%. Confirming a structural shift to bullish.`;
    } else if (dist < 1) {
        score = 45; bias = "Testing Resistance"; insight = `Price is aggressively testing overhead supply (only ${dist.toFixed(2)}% away). High risk of rejection or imminent breakout.`;
    } else if (dist < 5) {
        score = 35; bias = "Below Resistance"; insight = `Overhead resistance is looming (${dist.toFixed(2)}% away). The upside is capped by historical supply zones.`;
    } else {
        score = 25; bias = "Heavy Resistance"; insight = `Major resistance is established far overhead (${dist.toFixed(2)}% away). Price is suppressed in a broader bearish structure.`;
    }
    return { score, bias, confidence: "85%", aiInsight: insight };
}

export function scoreBetaCard(val) {
    return scoreBetaCorrelationCard(val);
}

export function scoreRSICard(val) {
    if (val === null || val === undefined || isNaN(val)) return defaultReturn;
    val = Number(val);
    let score = 50, bias = "Neutral", insight = "RSI is in neutral equilibrium.";
    
    // MD-09 Fix: Continuous piecewise scoring without cliffs
    if (val >= 85) {
        // Severe overextension - mean reversion risk
        score = Math.round(35 - ((Math.min(100, val) - 85) / 15) * 15);
        bias = "Extreme Overbought";
        insight = `RSI at ${val.toFixed(2)}. Extreme overbought territory. Elevated probability of sharp mean-reversion consolidation.`;
    } else if (val >= 70) {
        // Bullish momentum with emerging overbought caution (graceful transition from 75 down to 35)
        score = Math.round(75 - ((val - 70) / 15) * 40);
        bias = "Overbought Momentum";
        insight = `RSI at ${val.toFixed(2)}. Strong bullish momentum with extended conditions. Trail stop-losses closely.`;
    } else if (val >= 50) {
        // Bullish momentum acceleration (50 up to 75 at RSI 70)
        score = Math.round(50 + ((val - 50) / 20) * 25);
        bias = "Bullish Zone";
        insight = `RSI at ${val.toFixed(2)}. Asset is operating in a healthy constructive momentum expansion.`;
    } else if (val >= 35) {
        // Bearish momentum decay (50 down to 25 at RSI 35)
        score = Math.round(50 - ((50 - val) / 15) * 25);
        bias = "Bearish Zone";
        insight = `RSI at ${val.toFixed(2)}. Price momentum is suppressed below median equilibrium.`;
    } else if (val >= 20) {
        // Deep oversold / relief bounce setup (25 up to 60 at RSI 20)
        score = Math.round(25 + ((35 - val) / 15) * 35);
        bias = "Oversold";
        insight = `RSI at ${val.toFixed(2)}. Oversold conditions developing; selling velocity decelerating.`;
    } else {
        // Extreme capitulation (60 up to 85 at RSI 0)
        score = Math.round(60 + ((20 - Math.max(0, val)) / 20) * 25);
        bias = "Extreme Oversold";
        insight = `RSI at ${val.toFixed(2)}. Extreme capitulation zone with strong potential for violent relief rebound.`;
    }
    
    return { score, bias, confidence: "85%", aiInsight: insight };
}

export function scoreSMA200Card(val, price) { return evaluateMA(val, price, 200, "SMA"); }
export function scoreSMA50Card(val, price) { return evaluateMA(val, price, 50, "SMA"); }

export function scoreStochRSICard(valObj) {
    if (!valObj || valObj.k === undefined || valObj.d === undefined) return defaultReturn;
    
    const { k, d } = valObj;
    let score = 50, bias = "Neutral", insight = "Neutral momentum.";

    if (k > 80 && d > 80) {
        if (k < d) {
            score = 15; bias = "Bearish Reversal"; 
            insight = "Fast %K crossed below %D inside the Overbought zone. Imminent bearish momentum shift.";
        } else {
            score = 25; bias = "Overbought"; 
            insight = "StochRSI is extremely overbought. The trend is technically up, but exhaustion is near.";
        }
    } else if (k < 20 && d < 20) {
        if (k > d) {
            score = 85; bias = "Bullish Reversal"; 
            insight = "Fast %K crossed above %D inside the Oversold zone. Imminent bullish momentum shift.";
        } else {
            score = 75; bias = "Oversold"; 
            insight = "StochRSI is deeply oversold. Strong downward pressure, but watch for a relief bounce crossover.";
        }
    } else if (k > d) {
        score = 65; bias = "Bullish"; insight = "Fast %K is leading %D upward. Momentum favors buyers.";
    } else {
        score = 35; bias = "Bearish"; insight = "Fast %K is trailing %D downward. Momentum favors sellers.";
    }

    return { score, bias, confidence: "80%", aiInsight: insight };
}

export function scoreSupertrendCard(valObj, price) {
    if (!valObj || valObj.value === null || valObj.value === undefined || isNaN(valObj.value) || !price) return defaultReturn;
    
    const stValue = valObj.value;
    const isUptrend = valObj.isUptrend;
    const diffPct = ((price - stValue) / stValue) * 100;
    
    let score = 50, bias = "Neutral", insight = "Supertrend tracking.";
    let confidence = "70%";

    if (isUptrend) {
        if (diffPct < 0.2) {
            score = 60; bias = "Bullish"; confidence = "60%";
            insight = `Price is dangerously close to triggering a bearish Supertrend flip (Buffer: +${diffPct.toFixed(2)}%).`;
        } else if (diffPct > 1.5) {
            score = 85; bias = "Strong Bullish"; confidence = "85%";
            insight = `Price is deeply entrenched in a Bullish Supertrend regime. The trailing stop is safely distanced at ${stValue.toFixed(2)}.`;
        } else {
            score = 75; bias = "Bullish"; confidence = "75%";
            insight = `Active Bullish Supertrend. Price is comfortably riding above the algorithmic trailing stop.`;
        }
    } else {
        if (diffPct > -0.2) {
            score = 40; bias = "Bearish"; confidence = "60%";
            insight = `Price is dangerously close to triggering a bullish Supertrend flip (Buffer: ${diffPct.toFixed(2)}%).`;
        } else if (diffPct < -1.5) {
            score = 15; bias = "Strong Bearish"; confidence = "85%";
            insight = `Price is deeply entrenched in a Bearish Supertrend regime. Supply is overwhelmingly dominant.`;
        } else {
            score = 25; bias = "Bearish"; confidence = "75%";
            insight = `Active Bearish Supertrend. Price remains trapped below the algorithmic resistance stop at ${stValue.toFixed(2)}.`;
        }
    }
    
    return { score, bias, confidence, aiInsight: insight };
}

export function scoreSupportCard(val, currentPrice) {
    if (val === null || val === undefined || isNaN(val) || !currentPrice) return defaultReturn;
    const dist = ((currentPrice - val) / currentPrice) * 100;
    
    let score = 50, bias = "Neutral", insight = "Tracking support.";
    if (dist < -1) {
        score = 15; bias = "Strong Breakdown"; insight = `Price has decisively broken below major support (by ${Math.abs(dist).toFixed(2)}%). Structural floor has collapsed.`;
    } else if (dist < 0) {
        score = 25; bias = "Breakdown"; insight = `Price slipped below major support by ${Math.abs(dist).toFixed(2)}%. High risk of a structural shift to bearish.`;
    } else if (dist < 1) {
        score = 45; bias = "Testing Support"; insight = `Price is aggressively testing the structural floor (only ${dist.toFixed(2)}% away). Critical zone for a bounce or breakdown.`;
    } else if (dist < 5) {
        score = 65; bias = "Holding Support"; insight = `Price is safely holding above major support (${dist.toFixed(2)}% away). The bullish structure remains intact.`;
    } else {
        score = 75; bias = "Strong Support Base"; insight = `Price is well above the established support base (${dist.toFixed(2)}% away). Buyers are firmly in control of the trend.`;
    }
    return { score, bias, confidence: "85%", aiInsight: insight };
}

export function scoreTrendlineCard(val, currentPrice) {
    if (val === null || val === undefined) return defaultReturn;
    
    // If it's the calculated Linear Regression object
    if (typeof val === 'object' && val.slopePct !== undefined) {
        const { slopePct, r2 } = val;
        let score = 50, bias = "Neutral", insight = "Trendline is perfectly flat.";
        let r2Insight = "";
        
        if (r2 !== undefined) {
            if (r2 < 0.2) r2Insight = ` However, low R-Squared (${r2.toFixed(2)}) indicates the price is chopping violently and ignoring the trendline.`;
            else if (r2 > 0.7) r2Insight = ` High R-Squared (${r2.toFixed(2)}) confirms strong structural adherence to this channel.`;
        }

        if (slopePct > 0.5) { 
            score = 85; bias = "Strong Uptrend"; 
            insight = `Linear regression confirms a steep positive slope (+${slopePct.toFixed(2)}%). Buyers dominate.${r2Insight}`; 
        } else if (slopePct > 0.1) { 
            score = 65; bias = "Uptrend"; 
            insight = `Linear regression shows a positive slope (+${slopePct.toFixed(2)}%). Steady bullish momentum.${r2Insight}`; 
        } else if (slopePct < -0.5) { 
            score = 15; bias = "Strong Downtrend"; 
            insight = `Linear regression confirms a steep negative slope (${slopePct.toFixed(2)}%). Sellers dominate.${r2Insight}`; 
        } else if (slopePct < -0.1) { 
            score = 35; bias = "Downtrend"; 
            insight = `Linear regression shows a negative slope (${slopePct.toFixed(2)}%). Steady bearish momentum.${r2Insight}`; 
        } else { 
            score = 50; bias = "Flat Trend"; 
            insight = `Linear regression slope is near zero (${slopePct.toFixed(2)}%). Market is moving sideways.${r2Insight}`; 
        }

        // Penalize the score heavily if it's choppy (R2 < 0.3)
        if (r2 !== undefined && r2 < 0.3) {
            score = 50 + (score - 50) * 0.3; // Pull the score strongly back to neutral 50
            bias = "Choppy / Invalid Trend";
        }

        return { score, bias, confidence: r2 !== undefined ? `${Math.round(r2 * 100)}%` : "85%", aiInsight: insight };
    }

    // Fallback for manual overrides
    val = Number(val);
    if (isNaN(val) || !currentPrice) return defaultReturn;
    const dist = ((currentPrice - val) / currentPrice) * 100;

    let score = 50, bias = "Neutral", insight = "Tracking trendline.";
    if (dist < -2) {
        score = 15; bias = "Trend Breakdown"; insight = `Price decisively crashed through the trendline (by ${Math.abs(dist).toFixed(2)}%). The structural trend has failed.`;
    } else if (dist < 0) {
        score = 30; bias = "Trend Violation"; insight = `Price slipped below the trendline (by ${Math.abs(dist).toFixed(2)}%). Warning: structural trend is compromised.`;
    } else if (dist < 1) {
        score = 55; bias = "Testing Trendline"; insight = `Price is riding exactly on the structural trendline (${dist.toFixed(2)}% away). Critical pivot for continuation.`;
    } else if (dist < 3) {
        score = 75; bias = "Bullish Trend"; insight = `Price is respecting the trendline structure (${dist.toFixed(2)}% away). Buyers are defending the slope.`;
    } else {
        score = 85; bias = "Strong Trend"; insight = `Price is accelerating away from the trendline (${dist.toFixed(2)}% away). Exceptional directional momentum.`;
    }
    return { score, bias, confidence: "80%", aiInsight: insight };
}

export function scoreTrinCard(val) {
    if (val === null || val === undefined || isNaN(val)) return defaultReturn;
    val = Number(val);
    let score = 50, bias = "Neutral", insight = "TRIN is within the normal 0.8 - 1.2 range, showing balanced volume distribution.";
    if (val < 0.5) { score = 85; bias = "Strong Bullish"; insight = `TRIN is extremely low at ${val.toFixed(2)}. Advancing volume is overwhelming. Very strong bullish conviction.`; }
    else if (val <= 0.8) { score = 65; bias = "Bullish"; insight = `TRIN is low (${val.toFixed(2)}). Disproportionately high volume is flowing into advancing stocks.`; }
    else if (val > 2.0) { score = 15; bias = "Strong Bearish / Panic"; insight = `TRIN is highly elevated at ${val.toFixed(2)}. Panic selling is occurring. Massive volume is flowing into declining stocks.`; }
    else if (val >= 1.2) { score = 35; bias = "Bearish"; insight = `TRIN is high (${val.toFixed(2)}). Volume is primarily concentrated in declining issues, showing bearish conviction.`; }
    return { score, bias, confidence: "85%", aiInsight: insight };
}


export function scoreVolumeSmaCard(volumeSma, currentVolume, currentPrice = null, openPrice = null) {
    if (volumeSma === null || volumeSma === undefined || isNaN(volumeSma) || !currentVolume) return defaultReturn;
    
    const vSma = Number(volumeSma);
    const cVol = Number(currentVolume);
    if (vSma <= 0) return defaultReturn;
    
    const ratio = cVol / vSma;
    let isUpCandle = null;
    if (currentPrice !== null && openPrice !== null && !isNaN(Number(currentPrice)) && !isNaN(Number(openPrice))) {
        isUpCandle = Number(currentPrice) >= Number(openPrice);
    }

    let score = 50, bias = "Normal Participation", aiInsightText = "Volume is tracking near historical average.";

    if (ratio >= 2.0) {
        if (isUpCandle === true) {
            score = 90;
            bias = "Institutional Accumulation";
            aiInsightText = `Volume is massive (${ratio.toFixed(1)}x average) on an advancing session. Heavy institutional buying confirms the rally.`;
        } else if (isUpCandle === false) {
            score = 15;
            bias = "Panic Liquidation / Distribution";
            aiInsightText = `Volume is massive (${ratio.toFixed(1)}x average) on a declining session. Heavy institutional distribution confirms intense selling pressure.`;
        } else {
            score = 80;
            bias = "Exceptional Volume Activity";
            aiInsightText = `Volume is ${ratio.toFixed(1)}x average, confirming exceptional market turnover.`;
        }
    } else if (ratio >= 1.2) {
        if (isUpCandle === true) {
            score = 75;
            bias = "Bullish Accumulation";
            aiInsightText = `Above-average volume (${ratio.toFixed(1)}x) supports the upside move with healthy buyer participation.`;
        } else if (isUpCandle === false) {
            score = 30;
            bias = "Bearish Selling Pressure";
            aiInsightText = `Above-average volume (${ratio.toFixed(1)}x) on a down day signals active distribution and supply overhead.`;
        } else {
            score = 65;
            bias = "High Participation";
            aiInsightText = `Above-average volume (${ratio.toFixed(1)}x) confirms current price action conviction.`;
        }
    } else if (ratio >= 0.8) {
        score = 50;
        bias = "Normal Participation";
        aiInsightText = `Volume is running at ${ratio.toFixed(1)}x of its 20-period average, in line with normal market turnover.`;
    } else if (ratio >= 0.5) {
        score = 40;
        bias = "Low Participation";
        aiInsightText = `Volume is below average (${ratio.toFixed(1)}x), suggesting a lack of institutional conviction.`;
    } else {
        score = 25;
        bias = "Extremely Thin Volume";
        aiInsightText = `Volume is extremely depressed (${ratio.toFixed(1)}x). Price movement lacks institutional liquidity and is vulnerable to false breakouts.`;
    }

    return { score, bias, confidence: "80%", aiInsight: aiInsightText };
}

export function scoreVwapCard(vwapVal, currentPrice) {
    if (vwapVal === null || vwapVal === undefined || isNaN(vwapVal) || !currentPrice) return defaultReturn;
    let score = 50, bias = "Neutral", aiInsightText = "Trading near fair value.";
    if (currentPrice > vwapVal * 1.005) { score = 80; bias = "Bullish"; aiInsightText = "Price is holding strongly above VWAP, signaling institutional buying."; }
    else if (currentPrice > vwapVal) { score = 60; bias = "Slightly Bullish"; aiInsightText = "Price is above VWAP, suggesting buyers are in control today."; }
    else if (currentPrice < vwapVal * 0.995) { score = 20; bias = "Bearish"; aiInsightText = "Price is significantly below VWAP, indicating strong institutional selling."; }
    else if (currentPrice < vwapVal) { score = 40; bias = "Slightly Bearish"; aiInsightText = "Price is below VWAP, keeping sellers in control."; }
    return { score, bias, confidence: "80%", aiInsight: aiInsightText };
}

export function scoreWilliamsRCard(val) {
    if (val === null || val === undefined || isNaN(val)) return defaultReturn;
    val = Number(val);
    let score = 50, bias = "Neutral", insight = "Neutral momentum.";
    
    // Institutional momentum interpretation:
    // Williams %R measures close location relative to 14-day high-low range (0 to -100)
    // 0 to -20: Bullish momentum zone (pinned to highs)
    // -20 to -50: Upper half of range (bullish bias)
    // -50 to -80: Lower half of range (bearish bias)
    // -80 to -100: Bearish momentum zone (pinned to lows)
    if (val >= -15) {
        score = 75;
        bias = "Strong Bullish Momentum";
        insight = `Williams %R is pinned near recent highs (${val.toFixed(2)}%). Robust buyer momentum is driving the advance.`;
    } else if (val >= -50) {
        score = Math.round(55 + ((val + 50) / 35) * 20);
        bias = "Bullish Bias";
        insight = `Trading in the upper half of the 14-day range (${val.toFixed(2)}%). Buyers maintain continuous control.`;
    } else if (val >= -85) {
        score = Math.round(30 + ((val + 85) / 35) * 20);
        bias = "Bearish Bias";
        insight = `Trading in the lower half of the 14-day range (${val.toFixed(2)}%). Sellers maintain continuous control.`;
    } else {
        score = 25;
        bias = "Strong Bearish Momentum";
        insight = `Williams %R is pinned near recent lows (${val.toFixed(2)}%). Heavy downward momentum indicates dominant selling pressure.`;
    }
    
    return { score, bias, confidence: "80%", aiInsight: insight };
}

export function scoreBetaCorrelationCard(val) {
    if (val === null || val === undefined || isNaN(Number(val))) return defaultReturn;
    val = Number(val);
    
    let score = 50, bias = "Neutral", insight = "Beta is exactly 1.0 (moves in perfect tandem with Nifty).";
    if (val > 1.5) {
        score = 85; bias = "High Beta"; insight = `Beta is very high (${val.toFixed(2)}). Stock is highly sensitive to Nifty movements and acts as a strong multiplier in bull markets.`;
    } else if (val > 1.1) {
        score = 65; bias = "Slightly High Beta"; insight = `Beta is moderately high (${val.toFixed(2)}). Stock slightly amplifies Nifty trends.`;
    } else if (val < 0.5) {
        score = 20; bias = "Low Beta / Defensive"; insight = `Beta is very low (${val.toFixed(2)}). Stock is highly defensive and largely ignores broader market movements.`;
    } else if (val < 0.9) {
        score = 40; bias = "Slightly Low Beta"; insight = `Beta is moderately low (${val.toFixed(2)}). Stock is less volatile than the broader market.`;
    } else {
        score = 50; bias = "Market Beta"; insight = `Beta is near market average (${val.toFixed(2)}). Stock tracks Nifty closely.`;
    }
    
    return { score, bias, confidence: "90%", aiInsight: insight };
}

// Force Vite HMR reload
