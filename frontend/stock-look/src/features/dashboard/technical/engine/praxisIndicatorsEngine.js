/**
 * @file praxisIndicatorsEngine.js
 * @purpose Institutional-grade mathematical engine for Praxis proprietary indicators:
 *  1. PNCO — Praxis Neural Confluence Oscillator (Cross-domain momentum & trap filter)
 *  2. AAVB — AI-Adaptive Volatility Bands (Macro-volatility modulated channel)
 *  3. IFDI — Institutional Flow Divergence Index (Smart money accumulation & distribution detector)
 * @date 2026-09-12
 */

// ─── Mathematical Helpers ──────────────────────────────────────────────────

function calcEmaArray(values, period) {
    if (!values || values.length === 0) return [];
    const k = 2 / (period + 1);
    const result = new Array(values.length);
    let ema = values[0] || 0;
    result[0] = ema;
    for (let i = 1; i < values.length; i++) {
        ema = (values[i] - ema) * k + ema;
        result[i] = ema;
    }
    return result;
}

function calcRsiArray(closes, period = 14) {
    if (!closes || closes.length <= period) return new Array(closes.length).fill(50);
    const result = new Array(closes.length).fill(50);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff;
        else losses += -diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    result[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        result[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    }
    return result;
}

function calcTrueRangeArray(candles) {
    const tr = new Array(candles.length).fill(0);
    if (candles.length === 0) return tr;
    tr[0] = candles[0].high - candles[0].low;
    for (let i = 1; i < candles.length; i++) {
        const h = candles[i].high;
        const l = candles[i].low;
        const prevC = candles[i - 1].close;
        tr[i] = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
    }
    return tr;
}

function calcStdDev(values, startIndex, period, mean) {
    let sumSq = 0;
    for (let j = 0; j < period; j++) {
        const idx = startIndex - j;
        if (idx >= 0) {
            sumSq += Math.pow(values[idx] - mean, 2);
        }
    }
    return Math.sqrt(sumSq / period);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PNCO: Praxis Neural Confluence Oscillator
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Computes the multi-dimensional Neural Confluence Oscillator.
 * Blends:
 *   - Technical Momentum: Normalized RSI [-50, +50] + MACD delta / ATR
 *   - Options Smart Money: Put-Call ratio dynamics + OI velocity bias
 *   - AI Predictive Bias: Future Vision forecast direction and confidence
 *
 * @param {Array} candles - OHLCV candles
 * @param {Object} context - Optional options & AI context { pcr, oiDelta, aiBias, aiConfidence }
 * @returns {Array} Array of { time, value, histogram, signal, trap }
 */
export function calculatePNCO(candles, context = {}) {
    if (!candles || candles.length < 15) return [];

    const closes = candles.map(c => c.close);
    const rsi14 = calcRsiArray(closes, 14);
    const tr = calcTrueRangeArray(candles);
    const atr14 = calcEmaArray(tr, 14);

    const fastEma = calcEmaArray(closes, 12);
    const slowEma = calcEmaArray(closes, 26);
    const macdRaw = fastEma.map((f, i) => f - slowEma[i]);
    const macdSignal = calcEmaArray(macdRaw, 9);
    const macdHist = macdRaw.map((m, i) => m - macdSignal[i]);

    // Context factors
    const pcrVal = context.pcr !== undefined && context.pcr !== null ? Number(context.pcr) : 1.0;
    let optionsFlowScore = 0;
    if (pcrVal > 1.3) optionsFlowScore = 45;
    else if (pcrVal > 1.05) optionsFlowScore = 20;
    else if (pcrVal < 0.75) optionsFlowScore = -40;
    else if (pcrVal < 0.95) optionsFlowScore = -15;

    let aiBiasScore = 0;
    if (context.aiBias) {
        const conf = (context.aiConfidence || 65) / 100;
        const dir = context.aiBias.toLowerCase().includes('bull') ? 1 : context.aiBias.toLowerCase().includes('bear') ? -1 : 0;
        aiBiasScore = dir * conf * 100;
    }

    const pncoSeries = [];

    for (let i = 0; i < candles.length; i++) {
        const time = candles[i].time;
        const rsiCentered = (rsi14[i] - 50) * 2; // -100 to +100
        const currAtr = atr14[i] || 1;
        const macdNorm = Math.max(-100, Math.min(100, (macdHist[i] / currAtr) * 50));
        const techMomentum = (rsiCentered * 0.55) + (macdNorm * 0.45);

        let finalValue = techMomentum;
        const isCurrentBar = (i === candles.length - 1);
        if (isCurrentBar && (context.aiBias || context.pcr)) {
            // Live sentiment only adjusts the active real-time bar (FA-009 Fix)
            finalValue = (techMomentum * 0.45) + (optionsFlowScore * 0.25) + (aiBiasScore * 0.30);
        } else {
            const velocity = i >= 3 ? ((closes[i] - closes[i - 3]) / (currAtr * 3)) * 30 : 0;
            finalValue = Math.max(-100, Math.min(100, (techMomentum * 0.7) + (velocity * 0.3)));
        }

        finalValue = Math.round(finalValue * 10) / 10;

        let signal = 'NEUTRAL';
        if (finalValue >= 45) signal = 'STRONG_BULLISH';
        else if (finalValue >= 18) signal = 'BULLISH';
        else if (finalValue <= -45) signal = 'STRONG_BEARISH';
        else if (finalValue <= -18) signal = 'BEARISH';

        let trap = null;
        if (i >= 5) {
            const highLookback = Math.max(...candles.slice(i - 4, i).map(c => c.high));
            const lowLookback = Math.min(...candles.slice(i - 4, i).map(c => c.low));
            
            if (candles[i].high > highLookback && finalValue < 10) {
                trap = 'BULL_TRAP';
            } else if (candles[i].low < lowLookback && finalValue > -10) {
                trap = 'BEAR_TRAP';
            }
        }

        pncoSeries.push({
            time,
            value: finalValue,
            histogram: finalValue,
            signal,
            trap
        });
    }

    return pncoSeries;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. AAVB: AI-Adaptive Volatility Bands
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Calculates AI-Adaptive Volatility Bands around a dynamic baseline.
 * Width dynamically expands in high macro risk / volatility regimes to prevent false stop-outs,
 * and contracts in tight consolidations to signal imminent squeezes.
 *
 * @param {Array} candles - OHLCV candles
 * @param {Object} options - { period, baseMultiplier, macroRiskScore }
 * @returns {Object} { upper, middle, lower, squeeze }
 */
export function calculateAAVB(candles, options = {}) {
    const period = options.period || 20;
    const baseMultiplier = options.baseMultiplier || 2.0;
    const macroRisk = options.macroRiskScore !== undefined ? Number(options.macroRiskScore) : 40;

    if (!candles || candles.length < period) {
        return { upper: [], middle: [], lower: [], squeeze: [] };
    }

    const closes = candles.map(c => c.close);
    const tr = calcTrueRangeArray(candles);
    const atr = calcEmaArray(tr, period);

    const upper = [];
    const middle = [];
    const lower = [];
    const squeeze = [];
    const widths = [];

    for (let i = period - 1; i < candles.length; i++) {
        const time = candles[i].time;

        let sum = 0;
        for (let j = 0; j < period; j++) sum += closes[i - j];
        const sma = sum / period;

        const stdDev = calcStdDev(closes, i, period, sma);
        const currAtr = atr[i] || stdDev || 1;

        const volRatio = (currAtr / sma) * 100;
        const volMod = Math.min(1.8, Math.max(0.6, volRatio / 1.2));
        const riskMod = 0.85 + (macroRisk / 100) * 0.45;

        const dynamicMultiplier = Math.max(1.2, Math.min(3.6, baseMultiplier * volMod * riskMod));

        const up = Math.round((sma + dynamicMultiplier * stdDev) * 100) / 100;
        const lo = Math.round((sma - dynamicMultiplier * stdDev) * 100) / 100;
        const mid = Math.round(sma * 100) / 100;
        const width = ((up - lo) / mid) * 100;

        widths.push(width);

        let isSqueeze = false;
        if (widths.length >= 10) {
            const recentWidths = widths.slice(-20);
            const minW = Math.min(...recentWidths);
            const maxW = Math.max(...recentWidths);
            const threshold = minW + (maxW - minW) * 0.18;
            isSqueeze = width <= threshold;
        }

        upper.push({ time, value: up });
        middle.push({ time, value: mid });
        lower.push({ time, value: lo });
        squeeze.push({ time, isSqueeze, width: Math.round(width * 100) / 100 });
    }

    return { upper, middle, lower, squeeze };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. IFDI: Institutional Flow Divergence Index
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Evaluates smart money accumulation vs distribution by analyzing volume pressure,
 * true range efficiency, and price-volume divergences.
 *
 * @param {Array} candles - OHLCV candles
 * @param {number} period - default 14
 * @returns {Array} Array of { time, value, flowState, divergence, color }
 */
export function calculateIFDI(candles, period = 14) {
    if (!candles || candles.length < period) return [];

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume || 1);

    const rawMfv = new Array(candles.length);
    for (let i = 0; i < candles.length; i++) {
        const range = highs[i] - lows[i];
        if (range === 0) {
            rawMfv[i] = 0;
        } else {
            const clv = ((closes[i] - lows[i]) - (highs[i] - closes[i])) / range;
            rawMfv[i] = clv * volumes[i];
        }
    }

    const flowEma = calcEmaArray(rawMfv, period);
    const volEma = calcEmaArray(volumes, period);

    const ifdiSeries = [];

    for (let i = 0; i < candles.length; i++) {
        const time = candles[i].time;
        const avgVol = volEma[i] || 1;
        const intensity = Math.max(-100, Math.min(100, (flowEma[i] / avgVol) * 100));
        const rounded = Math.round(intensity * 10) / 10;

        let flowState = 'NEUTRAL';
        let color = '#94a3b8';
        if (rounded >= 20) {
            flowState = 'ACCUMULATION';
            color = '#10b981';
        } else if (rounded <= -20) {
            flowState = 'DISTRIBUTION';
            color = '#f43f5e';
        }

        let divergence = null;
        if (i >= 8) {
            const lookbackCloses = closes.slice(i - 8, i);
            const minClose = Math.min(...lookbackCloses);
            const maxClose = Math.max(...lookbackCloses);

            if (closes[i] <= minClose && rounded >= 15) {
                divergence = 'HIDDEN_ACCUMULATION';
            } else if (closes[i] >= maxClose && rounded <= -15) {
                divergence = 'HIDDEN_DISTRIBUTION';
            }
        }

        ifdiSeries.push({
            time,
            value: rounded,
            flowState,
            divergence,
            color
        });
    }

    return ifdiSeries;
}
