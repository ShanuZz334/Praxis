/**
 * @file strategySignalDefinitions.js
 * @purpose Master institutional signal definitions registry for Strategy Builder.
 * Defines all 27 real-time OHLCV-computable indicators and raw price/volume rules,
 * with pure mathematical computation routines and parameterized institutional buy/sell conditions.
 * @date 2026-09-17
 */
// ─── Mathematical Utility Functions ──────────────────────────────────────────

export function calcEMA(values, period) {
    if (!values || values.length === 0) return [];
    const k = 2 / (period + 1);
    const result = new Array(values.length).fill(null);
    if (values.length < period) return result;

    let sum = 0;
    for (let i = 0; i < period; i++) sum += values[i];
    let ema = sum / period;
    result[period - 1] = ema;

    for (let i = period; i < values.length; i++) {
        ema = (values[i] - ema) * k + ema;
        result[i] = ema;
    }
    return result;
}

export function calcSMA(values, period) {
    if (!values || values.length < period) return new Array(values ? values.length : 0).fill(null);
    const result = new Array(values.length).fill(null);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
        sum += values[i];
        if (i >= period) {
            sum -= values[i - period];
            result[i] = sum / period;
        } else if (i === period - 1) {
            result[i] = sum / period;
        }
    }
    return result;
}

export function calcRSI(closes, period = 14) {
    if (!closes || closes.length <= period) return new Array(closes ? closes.length : 0).fill(50);
    const result = new Array(closes.length).fill(50);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
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

export function calcATR(candles, period = 14) {
    if (!candles || candles.length < 2) return new Array(candles ? candles.length : 0).fill(0);
    const tr = [candles[0].high - candles[0].low];
    for (let i = 1; i < candles.length; i++) {
        const c = candles[i];
        const prev = candles[i - 1];
        tr.push(Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close)));
    }

    const atr = new Array(candles.length).fill(null);
    let sum = 0;
    for (let i = 0; i < Math.min(period, tr.length); i++) sum += tr[i];
    let prevAtr = sum / period;
    atr[period - 1] = prevAtr;

    for (let i = period; i < candles.length; i++) {
        prevAtr = (prevAtr * (period - 1) + tr[i]) / period;
        atr[i] = prevAtr;
    }
    return atr;
}

// ─── MASTER SIGNAL DEFINITIONS ───────────────────────────────────────────────

export const SIGNAL_CATEGORIES = [
    { id: 'MOMENTUM', label: 'Momentum', iconColor: 'text-violet-400', badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
    { id: 'TREND', label: 'Trend Following', iconColor: 'text-blue-400', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { id: 'VOLATILITY', label: 'Volatility & Bands', iconColor: 'text-amber-400', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { id: 'VOLUME', label: 'Volume & Order Flow', iconColor: 'text-cyan-400', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
    { id: 'STRUCTURE', label: 'Market Structure & Pivots', iconColor: 'text-emerald-400', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { id: 'RAW_DATA', label: 'Raw Price & Tape', iconColor: 'text-slate-300', badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
    { id: 'CUSTOM_LAB', label: 'Custom Lab Models', iconColor: 'text-orange-400', badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
];

export const SIGNAL_DEFINITIONS = {
    // ═════════════════════════════════════════════════════════════════════════
    // 1. MOMENTUM INDICATORS
    // ═════════════════════════════════════════════════════════════════════════
    rsi: {
        id: 'rsi',
        label: 'RSI (Relative Strength Index)',
        category: 'MOMENTUM',
        desc: 'Relative Strength Index - Mean-reversion momentum oscillator',
        defaultParams: { period: 14 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 14, min: 2, max: 100 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 14;
            const closes = candles.map(c => c.close);
            return calcRSI(closes, period);
        },
        presetConditions: [
            {
                id: 'rsi_oversold',
                label: 'RSI Oversold (< Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Oversold Level', defaultThreshold: 30, step: 1, min: 5, max: 50, unit: '' },
                checkBuy: (val, prev, c, prevC, thresh = 30) => Number(val) < Number(thresh),
                checkSell: (val, prev, c, prevC, thresh = 30) => Number(val) > (100 - Number(thresh))
            },
            {
                id: 'rsi_overbought',
                label: 'RSI Overbought (> Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Overbought Level', defaultThreshold: 70, step: 1, min: 50, max: 95, unit: '' },
                checkBuy: (val, prev, c, prevC, thresh = 70) => Number(val) > Number(thresh),
                checkSell: (val, prev, c, prevC, thresh = 70) => Number(val) < (100 - Number(thresh))
            },
            {
                id: 'rsi_cross_above',
                label: 'RSI Crosses Above Threshold',
                hasThreshold: true,
                thresholdConfig: { label: 'Threshold Level', defaultThreshold: 30, step: 1, min: 5, max: 95, unit: '' },
                checkBuy: (val, prev, c, prevC, thresh = 30) => Number(prev) <= Number(thresh) && Number(val) > Number(thresh),
                checkSell: (val, prev, c, prevC, thresh = 30) => Number(prev) >= (100 - Number(thresh)) && Number(val) < (100 - Number(thresh))
            },
            {
                id: 'rsi_cross_below',
                label: 'RSI Crosses Below Threshold',
                hasThreshold: true,
                thresholdConfig: { label: 'Threshold Level', defaultThreshold: 70, step: 1, min: 5, max: 95, unit: '' },
                checkBuy: (val, prev, c, prevC, thresh = 70) => Number(prev) >= Number(thresh) && Number(val) < Number(thresh),
                checkSell: (val, prev, c, prevC, thresh = 70) => Number(prev) <= (100 - Number(thresh)) && Number(val) > (100 - Number(thresh))
            },
            {
                id: 'rsi_above_midline',
                label: 'RSI Above Midline (> 50)',
                hasThreshold: false,
                checkBuy: (val) => Number(val) > 50,
                checkSell: (val) => Number(val) < 50
            },
            {
                id: 'rsi_below_midline',
                label: 'RSI Below Midline (< 50)',
                hasThreshold: false,
                checkBuy: (val) => Number(val) < 50,
                checkSell: (val) => Number(val) > 50
            }
        ]
    },

    macd: {
        id: 'macd',
        label: 'MACD (Trend & Momentum)',
        category: 'MOMENTUM',
        desc: 'Moving Average Convergence Divergence - Trend momentum crossover',
        defaultParams: { fast: 12, slow: 26, signal: 9 },
        paramConfig: [
            { key: 'fast', label: 'Fast Period', type: 'number', default: 12, min: 2, max: 50 },
            { key: 'slow', label: 'Slow Period', type: 'number', default: 26, min: 5, max: 100 },
            { key: 'signal', label: 'Signal Period', type: 'number', default: 9, min: 2, max: 50 }
        ],
        compute: (candles, params = {}) => {
            const fast = Number(params.fast) || 12;
            const slow = Number(params.slow) || 26;
            const sigPeriod = Number(params.signal) || 9;
            const closes = candles.map(c => c.close);

            const fastEma = calcEMA(closes, fast);
            const slowEma = calcEMA(closes, slow);
            const macdLine = new Array(candles.length).fill(null);

            for (let i = slow - 1; i < candles.length; i++) {
                if (fastEma[i] !== null && slowEma[i] !== null) {
                    macdLine[i] = fastEma[i] - slowEma[i];
                }
            }

            const validMacdIndices = [];
            const validMacdValues = [];
            for (let i = 0; i < macdLine.length; i++) {
                if (macdLine[i] !== null) {
                    validMacdIndices.push(i);
                    validMacdValues.push(macdLine[i]);
                }
            }

            const sigEma = calcEMA(validMacdValues, sigPeriod);
            const result = new Array(candles.length).fill(null);

            validMacdIndices.forEach((origIdx, pos) => {
                const s = sigEma[pos];
                const m = macdLine[origIdx];
                if (s !== null && m !== null) {
                    result[origIdx] = {
                        macd: m,
                        signal: s,
                        histogram: m - s,
                    };
                }
            });
            return result;
        },
        presetConditions: [
            {
                id: 'macd_bullish_cross',
                label: 'MACD Bullish Crossover (MACD > Signal)',
                hasThreshold: false,
                checkBuy: (curr, prev) => Boolean(curr && prev && prev.macd <= prev.signal && curr.macd > curr.signal),
                checkSell: (curr, prev) => Boolean(curr && prev && prev.macd >= prev.signal && curr.macd < curr.signal)
            },
            {
                id: 'macd_bearish_cross',
                label: 'MACD Bearish Crossover (MACD < Signal)',
                hasThreshold: false,
                checkBuy: (curr, prev) => Boolean(curr && prev && prev.macd >= prev.signal && curr.macd < curr.signal),
                checkSell: (curr, prev) => Boolean(curr && prev && prev.macd <= prev.signal && curr.macd > curr.signal)
            },
            {
                id: 'macd_above_zero',
                label: 'MACD Line Above Level (> Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'MACD Level', defaultThreshold: 0, step: 0.5, min: -100, max: 100, unit: '' },
                checkBuy: (curr, prev, c, prevC, thresh = 0) => Boolean(curr && curr.macd > Number(thresh)),
                checkSell: (curr, prev, c, prevC, thresh = 0) => Boolean(curr && curr.macd < Number(thresh))
            },
            {
                id: 'macd_below_zero',
                label: 'MACD Line Below Level (< Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'MACD Level', defaultThreshold: 0, step: 0.5, min: -100, max: 100, unit: '' },
                checkBuy: (curr, prev, c, prevC, thresh = 0) => Boolean(curr && curr.macd < Number(thresh)),
                checkSell: (curr, prev, c, prevC, thresh = 0) => Boolean(curr && curr.macd > Number(thresh))
            },
            {
                id: 'macd_hist_positive',
                label: 'Histogram Accelerating (> Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Hist Threshold', defaultThreshold: 0, step: 0.2, min: -50, max: 50, unit: '' },
                checkBuy: (curr, prev, c, prevC, thresh = 0) => Boolean(curr && curr.histogram > Number(thresh)),
                checkSell: (curr, prev, c, prevC, thresh = 0) => Boolean(curr && curr.histogram < -Number(thresh))
            },
            {
                id: 'macd_hist_negative',
                label: 'Histogram Decelerating (< Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Hist Threshold', defaultThreshold: 0, step: 0.2, min: -50, max: 50, unit: '' },
                checkBuy: (curr, prev, c, prevC, thresh = 0) => Boolean(curr && curr.histogram < Number(thresh)),
                checkSell: (curr, prev, c, prevC, thresh = 0) => Boolean(curr && curr.histogram > -Number(thresh))
            }
        ]
    },

    stoch_rsi: {
        id: 'stoch_rsi',
        label: 'Stochastic RSI',
        category: 'MOMENTUM',
        desc: 'StochRSI oscillator for pinpoint oversold bounce entries',
        defaultParams: { rsiPeriod: 14, stochPeriod: 14, kPeriod: 3, dPeriod: 3 },
        paramConfig: [
            { key: 'rsiPeriod', label: 'RSI Period', type: 'number', default: 14, min: 2, max: 50 },
            { key: 'stochPeriod', label: 'Stoch Period', type: 'number', default: 14, min: 2, max: 50 },
            { key: 'kPeriod', label: '%K Period', type: 'number', default: 3, min: 1, max: 20 },
            { key: 'dPeriod', label: '%D Period', type: 'number', default: 3, min: 1, max: 20 }
        ],
        compute: (candles, params = {}) => {
            const rsiPeriod = Number(params.rsiPeriod) || 14;
            const stochPeriod = Number(params.stochPeriod) || 14;
            const closes = candles.map(c => c.close);
            const rsi = calcRSI(closes, rsiPeriod);

            const stochRaw = new Array(candles.length).fill(null);
            for (let i = rsiPeriod + stochPeriod - 1; i < candles.length; i++) {
                let minRsi = Infinity;
                let maxRsi = -Infinity;
                for (let j = 0; j < stochPeriod; j++) {
                    const r = rsi[i - j];
                    if (r < minRsi) minRsi = r;
                    if (r > maxRsi) maxRsi = r;
                }
                stochRaw[i] = maxRsi === minRsi ? 50 : ((rsi[i] - minRsi) / (maxRsi - minRsi)) * 100;
            }

            const kVals = calcSMA(stochRaw.map(v => v === null ? 50 : v), Number(params.kPeriod) || 3);
            const dVals = calcSMA(kVals.map(v => v === null ? 50 : v), Number(params.dPeriod) || 3);

            return candles.map((_, i) => ({
                k: kVals[i] ?? 50,
                d: dVals[i] ?? 50
            }));
        },
        presetConditions: [
            {
                id: 'stoch_oversold_cross',
                label: '%K Crosses Above %D in Oversold (< Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Oversold Level', defaultThreshold: 20, step: 1, min: 5, max: 40, unit: '' },
                checkBuy: (curr, prev, c, prevC, thresh = 20) => Boolean(curr && prev && prev.k <= prev.d && curr.k > curr.d && curr.k < Number(thresh)),
                checkSell: (curr, prev, c, prevC, thresh = 20) => Boolean(curr && prev && prev.k >= prev.d && curr.k < curr.d && curr.k > (100 - Number(thresh)))
            },
            {
                id: 'stoch_overbought_cross',
                label: '%K Crosses Below %D in Overbought (> Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Overbought Level', defaultThreshold: 80, step: 1, min: 60, max: 95, unit: '' },
                checkBuy: (curr, prev, c, prevC, thresh = 80) => Boolean(curr && prev && prev.k >= prev.d && curr.k < curr.d && curr.k > Number(thresh)),
                checkSell: (curr, prev, c, prevC, thresh = 80) => Boolean(curr && prev && prev.k <= prev.d && curr.k > curr.d && curr.k < (100 - Number(thresh)))
            },
            {
                id: 'stoch_k_above_d',
                label: '%K > %D (Bullish Fast Line)',
                hasThreshold: false,
                checkBuy: (curr) => Boolean(curr && curr.k > curr.d),
                checkSell: (curr) => Boolean(curr && curr.k < curr.d)
            },
            {
                id: 'stoch_k_oversold',
                label: '%K in Oversold Zone (< Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Oversold Level', defaultThreshold: 20, step: 1, min: 5, max: 50, unit: '' },
                checkBuy: (curr, prev, c, prevC, thresh = 20) => Boolean(curr && curr.k < Number(thresh)),
                checkSell: (curr, prev, c, prevC, thresh = 20) => Boolean(curr && curr.k > (100 - Number(thresh)))
            },
            {
                id: 'stoch_k_overbought',
                label: '%K in Overbought Zone (> Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Overbought Level', defaultThreshold: 80, step: 1, min: 50, max: 95, unit: '' },
                checkBuy: (curr, prev, c, prevC, thresh = 80) => Boolean(curr && curr.k > Number(thresh)),
                checkSell: (curr, prev, c, prevC, thresh = 80) => Boolean(curr && curr.k < (100 - Number(thresh)))
            }
        ]
    },

    williams_r: {
        id: 'williams_r',
        label: 'Williams %R',
        category: 'MOMENTUM',
        desc: 'Momentum indicator reflecting level of close relative to high-low range',
        defaultParams: { period: 14 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 14, min: 2, max: 50 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 14;
            return candles.map((c, i) => {
                if (i < period - 1) return -50;
                let highest = -Infinity;
                let lowest = Infinity;
                for (let j = 0; j < period; j++) {
                    highest = Math.max(highest, candles[i - j].high);
                    lowest = Math.min(lowest, candles[i - j].low);
                }
                if (highest === lowest) return -50;
                return ((highest - c.close) / (highest - lowest)) * -100;
            });
        },
        presetConditions: [
            {
                id: 'wr_oversold',
                label: 'Williams %R Oversold (< Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Oversold Level', defaultThreshold: -80, step: 1, min: -100, max: -50, unit: '' },
                checkBuy: (val, prev, c, prevC, thresh = -80) => Number(val) < Number(thresh),
                checkSell: (val, prev, c, prevC, thresh = -80) => Number(val) > (-100 - Number(thresh))
            },
            {
                id: 'wr_overbought',
                label: 'Williams %R Overbought (> Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Overbought Level', defaultThreshold: -20, step: 1, min: -50, max: 0, unit: '' },
                checkBuy: (val, prev, c, prevC, thresh = -20) => Number(val) > Number(thresh),
                checkSell: (val, prev, c, prevC, thresh = -20) => Number(val) < (-100 - Number(thresh))
            },
            {
                id: 'wr_above_mid',
                label: 'Trading in Upper Half (> -50)',
                hasThreshold: false,
                checkBuy: (val) => Number(val) > -50,
                checkSell: (val) => Number(val) < -50
            }
        ]
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 2. TREND INDICATORS
    // ═════════════════════════════════════════════════════════════════════════
    ema_20: {
        id: 'ema_20',
        label: 'EMA 20 (Short-Term Trend)',
        category: 'TREND',
        desc: '20-period Exponential Moving Average (Short-term trend)',
        defaultParams: { period: 20 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 20, min: 2, max: 200 }
        ],
        compute: (candles, params = {}) => calcEMA(candles.map(c => c.close), Number(params.period) || 20),
        presetConditions: [
            {
                id: 'price_above_ema20',
                label: 'Price > EMA',
                hasThreshold: false,
                checkBuy: (val, prev, c) => c.close > val,
                checkSell: (val, prev, c) => c.close < val
            },
            {
                id: 'price_below_ema20',
                label: 'Price < EMA',
                hasThreshold: false,
                checkBuy: (val, prev, c) => c.close < val,
                checkSell: (val, prev, c) => c.close > val
            },
            {
                id: 'price_cross_above_ema20',
                label: 'Price Crosses Above EMA',
                hasThreshold: false,
                checkBuy: (val, prev, c, prevC) => prevC.close <= prev && c.close > val,
                checkSell: (val, prev, c, prevC) => prevC.close >= prev && c.close < val
            },
            {
                id: 'price_pullback_ema20',
                label: 'Price within Pullback Buffer of EMA',
                hasThreshold: true,
                thresholdConfig: { label: 'Buffer Tolerance', defaultThreshold: 0.50, step: 0.1, min: 0.05, max: 5.0, unit: '%' },
                checkBuy: (val, prev, c, prevC, thresh = 0.5) => Math.abs((c.close - val) / val) * 100 <= Number(thresh),
                checkSell: (val, prev, c, prevC, thresh = 0.5) => Math.abs((c.close - val) / val) * 100 <= Number(thresh)
            }
        ]
    },

    ema_50: {
        id: 'ema_50',
        label: 'EMA 50 (Intermediate Trend)',
        category: 'TREND',
        desc: '50-period Exponential Moving Average (Intermediate institutional trend)',
        defaultParams: { period: 50 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 50, min: 5, max: 200 }
        ],
        compute: (candles, params = {}) => calcEMA(candles.map(c => c.close), Number(params.period) || 50),
        presetConditions: [
            {
                id: 'price_above_ema50',
                label: 'Price > EMA',
                hasThreshold: false,
                checkBuy: (val, prev, c) => c.close > val,
                checkSell: (val, prev, c) => c.close < val
            },
            {
                id: 'price_below_ema50',
                label: 'Price < EMA',
                hasThreshold: false,
                checkBuy: (val, prev, c) => c.close < val,
                checkSell: (val, prev, c) => c.close > val
            },
            {
                id: 'price_cross_above_ema50',
                label: 'Price Crosses Above EMA',
                hasThreshold: false,
                checkBuy: (val, prev, c, prevC) => prevC.close <= prev && c.close > val,
                checkSell: (val, prev, c, prevC) => prevC.close >= prev && c.close < val
            },
            {
                id: 'price_pullback_ema50',
                label: 'Price within Pullback Buffer of EMA',
                hasThreshold: true,
                thresholdConfig: { label: 'Buffer Tolerance', defaultThreshold: 0.75, step: 0.1, min: 0.05, max: 5.0, unit: '%' },
                checkBuy: (val, prev, c, prevC, thresh = 0.75) => Math.abs((c.close - val) / val) * 100 <= Number(thresh),
                checkSell: (val, prev, c, prevC, thresh = 0.75) => Math.abs((c.close - val) / val) * 100 <= Number(thresh)
            }
        ]
    },

    ema_200: {
        id: 'ema_200',
        label: 'EMA 200 (Macro Regime)',
        category: 'TREND',
        desc: '200-period Exponential Moving Average (Major bull/bear regime boundary)',
        defaultParams: { period: 200 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 200, min: 50, max: 500 }
        ],
        compute: (candles, params = {}) => calcEMA(candles.map(c => c.close), Number(params.period) || 200),
        presetConditions: [
            {
                id: 'price_above_ema200',
                label: 'Price > EMA (Bull Market Regime)',
                hasThreshold: false,
                checkBuy: (val, prev, c) => c.close > val,
                checkSell: (val, prev, c) => c.close < val
            },
            {
                id: 'price_below_ema200',
                label: 'Price < EMA (Bear Market Regime)',
                hasThreshold: false,
                checkBuy: (val, prev, c) => c.close < val,
                checkSell: (val, prev, c) => c.close > val
            },
            {
                id: 'price_cross_above_ema200',
                label: 'Price Crosses Above EMA 200',
                hasThreshold: false,
                checkBuy: (val, prev, c, prevC) => prevC.close <= prev && c.close > val,
                checkSell: (val, prev, c, prevC) => prevC.close >= prev && c.close < val
            }
        ]
    },

    ema_cross_20_50: {
        id: 'ema_cross_20_50',
        label: '20 / 50 EMA Cross',
        category: 'TREND',
        desc: 'Fast trend alignment (Fast EMA vs Slow EMA)',
        defaultParams: { fast: 20, slow: 50 },
        paramConfig: [
            { key: 'fast', label: 'Fast Period', type: 'number', default: 20, min: 2, max: 100 },
            { key: 'slow', label: 'Slow Period', type: 'number', default: 50, min: 5, max: 200 }
        ],
        compute: (candles, params = {}) => {
            const fast = Number(params.fast) || 20;
            const slow = Number(params.slow) || 50;
            const closes = candles.map(c => c.close);
            const emaFast = calcEMA(closes, fast);
            const emaSlow = calcEMA(closes, slow);
            return candles.map((_, i) => ({ emaFast: emaFast[i], emaSlow: emaSlow[i] }));
        },
        presetConditions: [
            {
                id: 'cross_20_above_50',
                label: 'Fast EMA Crosses Above Slow EMA',
                hasThreshold: false,
                checkBuy: (curr, prev) => Boolean(curr && prev && prev.emaFast <= prev.emaSlow && curr.emaFast > curr.emaSlow),
                checkSell: (curr, prev) => Boolean(curr && prev && prev.emaFast >= prev.emaSlow && curr.emaFast < curr.emaSlow)
            },
            {
                id: 'cross_20_below_50',
                label: 'Fast EMA Crosses Below Slow EMA',
                hasThreshold: false,
                checkBuy: (curr, prev) => Boolean(curr && prev && prev.emaFast >= prev.emaSlow && curr.emaFast < curr.emaSlow),
                checkSell: (curr, prev) => Boolean(curr && prev && prev.emaFast <= prev.emaSlow && curr.emaFast > curr.emaSlow)
            },
            {
                id: 'trend_20_above_50',
                label: 'Fast EMA > Slow EMA (Sustained Uptrend)',
                hasThreshold: false,
                checkBuy: (curr) => Boolean(curr && curr.emaFast > curr.emaSlow),
                checkSell: (curr) => Boolean(curr && curr.emaFast < curr.emaSlow)
            }
        ]
    },

    ema_cross_50_200: {
        id: 'ema_cross_50_200',
        label: 'Golden / Death Cross (50/200)',
        category: 'TREND',
        desc: 'Major institutional trend regime crossover',
        defaultParams: { fast: 50, slow: 200 },
        paramConfig: [
            { key: 'fast', label: 'Fast Period', type: 'number', default: 50, min: 10, max: 150 },
            { key: 'slow', label: 'Slow Period', type: 'number', default: 200, min: 100, max: 500 }
        ],
        compute: (candles, params = {}) => {
            const fast = Number(params.fast) || 50;
            const slow = Number(params.slow) || 200;
            const closes = candles.map(c => c.close);
            const emaFast = calcEMA(closes, fast);
            const emaSlow = calcEMA(closes, slow);
            return candles.map((_, i) => ({ emaFast: emaFast[i], emaSlow: emaSlow[i] }));
        },
        presetConditions: [
            {
                id: 'golden_cross',
                label: 'Golden Cross (Fast EMA Crosses Above Slow EMA)',
                hasThreshold: false,
                checkBuy: (curr, prev) => Boolean(curr && prev && prev.emaFast <= prev.emaSlow && curr.emaFast > curr.emaSlow),
                checkSell: (curr, prev) => Boolean(curr && prev && prev.emaFast >= prev.emaSlow && curr.emaFast < curr.emaSlow)
            },
            {
                id: 'death_cross',
                label: 'Death Cross (Fast EMA Crosses Below Slow EMA)',
                hasThreshold: false,
                checkBuy: (curr, prev) => Boolean(curr && prev && prev.emaFast >= prev.emaSlow && curr.emaFast < curr.emaSlow),
                checkSell: (curr, prev) => Boolean(curr && prev && prev.emaFast <= prev.emaSlow && curr.emaFast > curr.emaSlow)
            },
            {
                id: 'bullish_stack',
                label: 'Bullish Stack (Fast EMA > Slow EMA)',
                hasThreshold: false,
                checkBuy: (curr) => Boolean(curr && curr.emaFast > curr.emaSlow),
                checkSell: (curr) => Boolean(curr && curr.emaFast < curr.emaSlow)
            }
        ]
    },

    sma_50: {
        id: 'sma_50',
        label: 'SMA 50',
        category: 'TREND',
        desc: '50-period Simple Moving Average',
        defaultParams: { period: 50 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 50, min: 5, max: 200 }
        ],
        compute: (candles, params = {}) => calcSMA(candles.map(c => c.close), Number(params.period) || 50),
        presetConditions: [
            {
                id: 'price_above_sma50',
                label: 'Price > SMA',
                hasThreshold: false,
                checkBuy: (val, prev, c) => c.close > val,
                checkSell: (val, prev, c) => c.close < val
            },
            {
                id: 'price_cross_above_sma50',
                label: 'Price Crosses Above SMA',
                hasThreshold: false,
                checkBuy: (val, prev, c, prevC) => prevC.close <= prev && c.close > val,
                checkSell: (val, prev, c, prevC) => prevC.close >= prev && c.close < val
            }
        ]
    },

    sma_200: {
        id: 'sma_200',
        label: 'SMA 200',
        category: 'TREND',
        desc: '200-period Simple Moving Average (Institutional Benchmark)',
        defaultParams: { period: 200 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 200, min: 50, max: 500 }
        ],
        compute: (candles, params = {}) => calcSMA(candles.map(c => c.close), Number(params.period) || 200),
        presetConditions: [
            {
                id: 'price_above_sma200',
                label: 'Price > SMA (Institutional Floor)',
                hasThreshold: false,
                checkBuy: (val, prev, c) => c.close > val,
                checkSell: (val, prev, c) => c.close < val
            },
            {
                id: 'price_cross_above_sma200',
                label: 'Price Crosses Above SMA 200',
                hasThreshold: false,
                checkBuy: (val, prev, c, prevC) => prevC.close <= prev && c.close > val,
                checkSell: (val, prev, c, prevC) => prevC.close >= prev && c.close < val
            }
        ]
    },

    adx: {
        id: 'adx',
        label: 'ADX (Trend Strength)',
        category: 'TREND',
        desc: 'Average Directional Index - Trend strength filter (> 25 is trending)',
        defaultParams: { period: 14 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 14, min: 2, max: 50 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 14;
            const n = candles.length;
            if (n < period * 2) return new Array(n).fill({ adx: 15, isTrending: false });

            const tr = [];
            const plusDm = [];
            const minusDm = [];

            for (let i = 1; i < n; i++) {
                const c = candles[i];
                const p = candles[i - 1];
                tr.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
                const upMove = c.high - p.high;
                const downMove = p.low - c.low;
                plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
                minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
            }

            let smoothTr = tr.slice(0, period).reduce((a, b) => a + b, 0);
            let smoothPlus = plusDm.slice(0, period).reduce((a, b) => a + b, 0);
            let smoothMinus = minusDm.slice(0, period).reduce((a, b) => a + b, 0);

            const dx = [];
            for (let i = period; i < tr.length; i++) {
                smoothTr = smoothTr - (smoothTr / period) + tr[i];
                smoothPlus = smoothPlus - (smoothPlus / period) + plusDm[i];
                smoothMinus = smoothMinus - (smoothMinus / period) + minusDm[i];

                const plusDi = smoothTr === 0 ? 0 : (smoothPlus / smoothTr) * 100;
                const minusDi = smoothTr === 0 ? 0 : (smoothMinus / smoothTr) * 100;
                const diff = Math.abs(plusDi - minusDi);
                const sum = plusDi + minusDi;
                dx.push(sum === 0 ? 0 : (diff / sum) * 100);
            }

            const adxValues = new Array(n).fill(null);
            let adxSum = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
            const startIdx = period * 2 - 1;
            if (startIdx < n) adxValues[startIdx] = adxSum;

            for (let i = period; i < dx.length; i++) {
                adxSum = (adxSum * (period - 1) + dx[i]) / period;
                const orig = i + period;
                if (orig < n) adxValues[orig] = adxSum;
            }

            return candles.map((_, i) => ({
                adx: adxValues[i] ?? 18,
                isTrending: (adxValues[i] ?? 0) > 25
            }));
        },
        presetConditions: [
            {
                id: 'adx_strong_trend',
                label: 'Strong Trend Active (ADX > Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Trend Strength', defaultThreshold: 25, step: 1, min: 10, max: 60, unit: '' },
                checkBuy: (v, prev, c, prevC, thresh = 25) => Boolean(v && v.adx > Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = 25) => Boolean(v && v.adx > Number(thresh))
            },
            {
                id: 'adx_extreme_trend',
                label: 'Extreme Momentum Trend (ADX > Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Extreme Level', defaultThreshold: 40, step: 1, min: 25, max: 75, unit: '' },
                checkBuy: (v, prev, c, prevC, thresh = 40) => Boolean(v && v.adx > Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = 40) => Boolean(v && v.adx > Number(thresh))
            },
            {
                id: 'adx_range_bound',
                label: 'Choppy / Rangebound (ADX < Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Choppy Level', defaultThreshold: 20, step: 1, min: 5, max: 35, unit: '' },
                checkBuy: (v, prev, c, prevC, thresh = 20) => Boolean(v && v.adx < Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = 20) => Boolean(v && v.adx < Number(thresh))
            }
        ]
    },

    supertrend: {
        id: 'supertrend',
        label: 'Supertrend',
        category: 'TREND',
        desc: 'Volatility-adjusted trailing stop and directional trend flip',
        defaultParams: { period: 10, multiplier: 3.0 },
        paramConfig: [
            { key: 'period', label: 'ATR Period', type: 'number', default: 10, min: 2, max: 50 },
            { key: 'multiplier', label: 'Multiplier', type: 'number', default: 3.0, step: 0.1, min: 0.5, max: 10.0 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 10;
            const multiplier = Number(params.multiplier) || 3.0;
            const n = candles.length;
            const atr = calcATR(candles, period);

            const result = new Array(n);
            let prevFinalUpper = 0;
            let prevFinalLower = 0;
            let prevSupertrend = 1;

            for (let i = 0; i < n; i++) {
                const c = candles[i];
                const a = atr[i] || (c.high - c.low);
                const basicUpper = (c.high + c.low) / 2 + multiplier * a;
                const basicLower = (c.high + c.low) / 2 - multiplier * a;
                const prevClose = i > 0 ? candles[i - 1].close : c.close;

                let finalUpper = (basicUpper < prevFinalUpper || prevClose > prevFinalUpper) ? basicUpper : prevFinalUpper;
                let finalLower = (basicLower > prevFinalLower || prevClose < prevFinalLower) ? basicLower : prevFinalLower;

                let supertrend = prevSupertrend;
                if (prevSupertrend === 1 && c.close < finalLower) {
                    supertrend = -1;
                } else if (prevSupertrend === -1 && c.close > finalUpper) {
                    supertrend = 1;
                }

                result[i] = {
                    isUptrend: supertrend === 1,
                    value: supertrend === 1 ? finalLower : finalUpper
                };

                prevFinalUpper = finalUpper;
                prevFinalLower = finalLower;
                prevSupertrend = supertrend;
            }
            return result;
        },
        presetConditions: [
            {
                id: 'supertrend_bullish_flip',
                label: 'Supertrend Flips BULLISH (Fresh Buy)',
                hasThreshold: false,
                checkBuy: (curr, prev) => Boolean(curr && prev && !prev.isUptrend && curr.isUptrend),
                checkSell: (curr, prev) => Boolean(curr && prev && prev.isUptrend && !curr.isUptrend)
            },
            {
                id: 'supertrend_bearish_flip',
                label: 'Supertrend Flips BEARISH (Fresh Sell)',
                hasThreshold: false,
                checkBuy: (curr, prev) => Boolean(curr && prev && prev.isUptrend && !curr.isUptrend),
                checkSell: (curr, prev) => Boolean(curr && prev && !prev.isUptrend && curr.isUptrend)
            },
            {
                id: 'supertrend_is_bullish',
                label: 'Supertrend Active BULLISH (Price > Band)',
                hasThreshold: false,
                checkBuy: (curr) => Boolean(curr && curr.isUptrend),
                checkSell: (curr) => Boolean(curr && !curr.isUptrend)
            }
        ]
    },

    trendline: {
        id: 'trendline',
        label: 'Trendline Slope',
        category: 'TREND',
        desc: 'Linear regression slope over rolling candles',
        defaultParams: { period: 20 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 20, min: 5, max: 100 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 20;
            return candles.map((c, i) => {
                if (i < period) return { slopePct: 0, r2: 0.5 };
                let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
                for (let j = 0; j < period; j++) {
                    const x = j;
                    const y = candles[i - period + 1 + j].close;
                    sumX += x; sumY += y; sumXY += x * y; sumXX += x * x;
                }
                const slope = (period * sumXY - sumX * sumY) / (period * sumXX - sumX * sumX);
                const slopePct = (slope / c.close) * 100;
                return { slopePct, isUp: slopePct > 0.05 };
            });
        },
        presetConditions: [
            {
                id: 'trendline_rising',
                label: 'Regression Slope Rising (> Threshold %)',
                hasThreshold: true,
                thresholdConfig: { label: 'Slope Threshold', defaultThreshold: 0.10, step: 0.05, min: 0.01, max: 2.0, unit: '%' },
                checkBuy: (v, prev, c, prevC, thresh = 0.10) => Boolean(v && v.slopePct > Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = 0.10) => Boolean(v && v.slopePct < -Number(thresh))
            },
            {
                id: 'trendline_falling',
                label: 'Regression Slope Falling (< Threshold %)',
                hasThreshold: true,
                thresholdConfig: { label: 'Slope Threshold', defaultThreshold: -0.10, step: 0.05, min: -2.0, max: -0.01, unit: '%' },
                checkBuy: (v, prev, c, prevC, thresh = -0.10) => Boolean(v && v.slopePct < Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = -0.10) => Boolean(v && v.slopePct > -Number(thresh))
            }
        ]
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 3. VOLATILITY & BANDS
    // ═════════════════════════════════════════════════════════════════════════
    bb: {
        id: 'bb',
        label: 'Bollinger Bands',
        category: 'VOLATILITY',
        desc: 'Bollinger Bands %B and expansion/squeeze detector',
        defaultParams: { period: 20, multiplier: 2.0 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 20, min: 5, max: 100 },
            { key: 'multiplier', label: 'StdDev Mult', type: 'number', default: 2.0, step: 0.1, min: 0.5, max: 5.0 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 20;
            const mult = Number(params.multiplier) || 2.0;
            const closes = candles.map(c => c.close);
            const sma = calcSMA(closes, period);

            return candles.map((c, i) => {
                if (i < period - 1 || sma[i] === null) return { pb: 0.5, upper: c.close, lower: c.close, middle: c.close };
                let sumSq = 0;
                for (let j = 0; j < period; j++) sumSq += Math.pow(closes[i - j] - sma[i], 2);
                const std = Math.sqrt(sumSq / period);
                const upper = sma[i] + mult * std;
                const lower = sma[i] - mult * std;
                const pb = upper === lower ? 0.5 : (c.close - lower) / (upper - lower);
                return { pb, upper, lower, middle: sma[i] };
            });
        },
        presetConditions: [
            {
                id: 'bb_touch_lower',
                label: 'Price Pierces Lower Band (%B <= Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: '%B Threshold', defaultThreshold: 0.05, step: 0.05, min: -0.5, max: 0.5, unit: '%B' },
                checkBuy: (v, prev, c, prevC, thresh = 0.05) => Boolean(v && v.pb <= Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = 0.05) => Boolean(v && v.pb >= (1 - Number(thresh)))
            },
            {
                id: 'bb_cross_midline',
                label: 'Price Crosses Above Middle Band (%B > 0.5)',
                hasThreshold: false,
                checkBuy: (v) => Boolean(v && v.pb > 0.5),
                checkSell: (v) => Boolean(v && v.pb < 0.5)
            },
            {
                id: 'bb_touch_upper',
                label: 'Price Breaks Above Upper Band (%B >= Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: '%B Threshold', defaultThreshold: 1.00, step: 0.05, min: 0.5, max: 1.5, unit: '%B' },
                checkBuy: (v, prev, c, prevC, thresh = 1.00) => Boolean(v && v.pb >= Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = 1.00) => Boolean(v && v.pb <= (1 - Number(thresh)))
            }
        ]
    },

    kc: {
        id: 'kc',
        label: 'Keltner Channels',
        category: 'VOLATILITY',
        desc: 'ATR-based volatility envelope for breakout and mean reversion',
        defaultParams: { period: 20, multiplier: 1.5 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 20, min: 5, max: 100 },
            { key: 'multiplier', label: 'ATR Mult', type: 'number', default: 1.5, step: 0.1, min: 0.5, max: 5.0 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 20;
            const mult = Number(params.multiplier) || 1.5;
            const closes = candles.map(c => c.close);
            const ema = calcEMA(closes, period);
            const atr = calcATR(candles, period);

            return candles.map((c, i) => {
                const mid = ema[i] || c.close;
                const a = atr[i] || (c.high - c.low);
                return {
                    middle: mid,
                    upper: mid + mult * a,
                    lower: mid - mult * a,
                };
            });
        },
        presetConditions: [
            {
                id: 'kc_break_upper',
                label: 'Price Breaks Above Upper KC Channel',
                hasThreshold: false,
                checkBuy: (v, prev, c) => c.close > v.upper,
                checkSell: (v, prev, c) => c.close < v.lower
            },
            {
                id: 'kc_rebound_lower',
                label: 'Price Holding Above Lower KC (Channel Support)',
                hasThreshold: false,
                checkBuy: (v, prev, c) => c.close > v.lower && c.low <= v.lower,
                checkSell: (v, prev, c) => c.close < v.upper
            },
            {
                id: 'kc_cross_midline',
                label: 'Price Crosses Above Middle KC Channel',
                hasThreshold: false,
                checkBuy: (v, prev, c, prevC) => prevC.close <= prev.middle && c.close > v.middle,
                checkSell: (v, prev, c, prevC) => prevC.close >= prev.middle && c.close < v.middle
            }
        ]
    },

    atr: {
        id: 'atr',
        label: 'ATR (Average True Range)',
        category: 'VOLATILITY',
        desc: 'Average True Range - Volatility expansion confirmation',
        defaultParams: { period: 14 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 14, min: 2, max: 50 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 14;
            const atrValues = calcATR(candles, period);
            return candles.map((c, i) => {
                const curr = atrValues[i] || 0;
                const prev = i > 0 ? (atrValues[i - 1] || curr) : curr;
                return {
                    atr: curr,
                    isRising: curr > prev,
                    pctOfPrice: c.close > 0 ? (curr / c.close) * 100 : 0
                };
            });
        },
        presetConditions: [
            {
                id: 'atr_rising',
                label: 'Volatility Expanding (ATR Rising)',
                hasThreshold: false,
                checkBuy: (v) => Boolean(v && v.isRising),
                checkSell: (v) => Boolean(v && !v.isRising)
            },
            {
                id: 'atr_elevated',
                label: 'High Volatility Regime (ATR > Threshold % of price)',
                hasThreshold: true,
                thresholdConfig: { label: 'ATR % of Price', defaultThreshold: 1.50, step: 0.1, min: 0.1, max: 10.0, unit: '%' },
                checkBuy: (v, prev, c, prevC, thresh = 1.5) => Boolean(v && v.pctOfPrice > Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = 1.5) => Boolean(v && v.pctOfPrice < (Number(thresh) * 0.5))
            }
        ]
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 4. VOLUME & ORDER FLOW
    // ═════════════════════════════════════════════════════════════════════════
    vwap: {
        id: 'vwap',
        label: 'VWAP',
        category: 'VOLUME',
        desc: 'Volume-Weighted Average Price - Institutional benchmark floor',
        compute: (candles) => {
            const n = candles ? candles.length : 0;
            if (n === 0) return [];
            const result = new Array(n).fill(null);

            // Detect if dataset is intraday (< 20h interval between consecutive bars) or daily/swing
            const isIntraday = n > 1 && (() => {
                const t0 = typeof candles[0].time === 'number' && candles[0].time < 1e11 ? candles[0].time * 1000 : new Date(candles[0].time).getTime();
                const t1 = typeof candles[1].time === 'number' && candles[1].time < 1e11 ? candles[1].time * 1000 : new Date(candles[1].time).getTime();
                return Math.abs(t1 - t0) < 20 * 3600 * 1000;
            })();

            if (isIntraday) {
                // Session-anchored intraday VWAP: Resets cumulative volume and price at each session open
                let cumVol = 0;
                let cumVP = 0;
                for (let i = 0; i < n; i++) {
                    const c = candles[i];
                    if (i > 0) {
                        const prev = candles[i - 1];
                        const dPrev = typeof prev.time === 'string' ? prev.time.slice(0, 10) : new Date(prev.time < 1e11 ? prev.time * 1000 : prev.time).toISOString().slice(0, 10);
                        const dCurr = typeof c.time === 'string' ? c.time.slice(0, 10) : new Date(c.time < 1e11 ? c.time * 1000 : c.time).toISOString().slice(0, 10);
                        if (dPrev !== dCurr) {
                            cumVol = 0;
                            cumVP = 0;
                        }
                    }
                    const vol = c.volume && c.volume > 0 ? c.volume : 1;
                    const typical = (c.high + c.low + c.close) / 3;
                    cumVol += vol;
                    cumVP += typical * vol;
                    result[i] = cumVol > 0 ? Math.round((cumVP / cumVol) * 100) / 100 : c.close;
                }
            } else {
                // Institutional 20-period volume-weighted moving benchmark for daily/swing candles
                const period = Math.min(20, n);
                let windowVP = 0;
                let windowVol = 0;
                for (let i = 0; i < n; i++) {
                    const c = candles[i];
                    const vol = c.volume && c.volume > 0 ? c.volume : 1;
                    const typical = (c.high + c.low + c.close) / 3;
                    windowVP += typical * vol;
                    windowVol += vol;
                    if (i >= period) {
                        const oldC = candles[i - period];
                        const oldVol = oldC.volume && oldC.volume > 0 ? oldC.volume : 1;
                        const oldTypical = (oldC.high + oldC.low + oldC.close) / 3;
                        windowVP -= oldTypical * oldVol;
                        windowVol -= oldVol;
                    }
                    result[i] = windowVol > 0 ? Math.round((windowVP / windowVol) * 100) / 100 : c.close;
                }
            }
            return result;
        },
        presetConditions: [
            {
                id: 'price_above_vwap',
                label: 'Price > VWAP (Institutional Acceptance)',
                hasThreshold: false,
                checkBuy: (val, prev, c) => c.close > val,
                checkSell: (val, prev, c) => c.close < val
            },
            {
                id: 'price_below_vwap',
                label: 'Price < VWAP',
                hasThreshold: false,
                checkBuy: (val, prev, c) => c.close < val,
                checkSell: (val, prev, c) => c.close > val
            },
            {
                id: 'price_cross_above_vwap',
                label: 'Price Crosses Above VWAP',
                hasThreshold: false,
                checkBuy: (val, prev, c, prevC) => prevC.close <= prev && c.close > val,
                checkSell: (val, prev, c, prevC) => prevC.close >= prev && c.close < val
            },
            {
                id: 'price_near_vwap',
                label: 'Price within Pullback Buffer of VWAP',
                hasThreshold: true,
                thresholdConfig: { label: 'Buffer Tolerance', defaultThreshold: 0.30, step: 0.05, min: 0.05, max: 3.0, unit: '%' },
                checkBuy: (val, prev, c, prevC, thresh = 0.3) => Math.abs((c.close - val) / val) * 100 <= Number(thresh),
                checkSell: (val, prev, c, prevC, thresh = 0.3) => Math.abs((c.close - val) / val) * 100 <= Number(thresh)
            }
        ]
    },

    obv: {
        id: 'obv',
        label: 'OBV (On-Balance Volume)',
        category: 'VOLUME',
        desc: 'Cumulative volume flow indicator reflecting smart money accumulation',
        defaultParams: { period: 20 },
        paramConfig: [
            { key: 'period', label: 'SMA Period', type: 'number', default: 20, min: 2, max: 100 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 20;
            const n = candles.length;
            const obv = new Array(n).fill(0);
            for (let i = 1; i < n; i++) {
                const c = candles[i];
                const p = candles[i - 1];
                const vol = c.volume || 1;
                if (c.close > p.close) obv[i] = obv[i - 1] + vol;
                else if (c.close < p.close) obv[i] = obv[i - 1] - vol;
                else obv[i] = obv[i - 1];
            }
            const sma = calcSMA(obv, period);
            return candles.map((_, i) => ({ obv: obv[i], sma: sma[i] || obv[i] }));
        },
        presetConditions: [
            {
                id: 'obv_above_sma',
                label: 'OBV > Moving Average (Accumulation)',
                hasThreshold: false,
                checkBuy: (v) => Boolean(v && v.obv > v.sma),
                checkSell: (v) => Boolean(v && v.obv < v.sma)
            },
            {
                id: 'obv_cross_above_sma',
                label: 'OBV Crosses Above Moving Average',
                hasThreshold: false,
                checkBuy: (curr, prev) => Boolean(curr && prev && prev.obv <= prev.sma && curr.obv > curr.sma),
                checkSell: (curr, prev) => Boolean(curr && prev && prev.obv >= prev.sma && curr.obv < curr.sma)
            }
        ]
    },

    cmf: {
        id: 'cmf',
        label: 'CMF (Chaikin Money Flow)',
        category: 'VOLUME',
        desc: 'Measures institutional accumulation/distribution over rolling bars',
        defaultParams: { period: 20 },
        paramConfig: [
            { key: 'period', label: 'Period', type: 'number', default: 20, min: 5, max: 100 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 20;
            const n = candles.length;
            const mfv = new Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                const c = candles[i];
                const range = c.high - c.low;
                if (range > 0) {
                    const mfm = ((c.close - c.low) - (c.high - c.close)) / range;
                    mfv[i] = mfm * (c.volume || 1);
                }
            }
            return candles.map((c, i) => {
                if (i < period) return 0;
                let sumMfv = 0;
                let sumVol = 0;
                for (let j = 0; j < period; j++) {
                    sumMfv += mfv[i - j];
                    sumVol += (candles[i - j].volume || 1);
                }
                return sumVol === 0 ? 0 : sumMfv / sumVol;
            });
        },
        presetConditions: [
            {
                id: 'cmf_positive',
                label: 'CMF Inflow (> +Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Inflow Level', defaultThreshold: 0.05, step: 0.05, min: 0.0, max: 0.5, unit: '' },
                checkBuy: (v, prev, c, prevC, thresh = 0.05) => Number(v) > Number(thresh),
                checkSell: (v, prev, c, prevC, thresh = 0.05) => Number(v) < -Number(thresh)
            },
            {
                id: 'cmf_strong',
                label: 'CMF Strong Inflow (> +Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Strong Inflow', defaultThreshold: 0.20, step: 0.05, min: 0.0, max: 0.5, unit: '' },
                checkBuy: (v, prev, c, prevC, thresh = 0.20) => Number(v) > Number(thresh),
                checkSell: (v, prev, c, prevC, thresh = 0.20) => Number(v) < -Number(thresh)
            },
            {
                id: 'cmf_negative',
                label: 'CMF Outflow (< -Threshold)',
                hasThreshold: true,
                thresholdConfig: { label: 'Outflow Level', defaultThreshold: -0.05, step: 0.05, min: -0.5, max: 0.0, unit: '' },
                checkBuy: (v, prev, c, prevC, thresh = -0.05) => Number(v) < Number(thresh),
                checkSell: (v, prev, c, prevC, thresh = -0.05) => Number(v) > -Number(thresh)
            }
        ]
    },

    volume_sma: {
        id: 'volume_sma',
        label: 'Volume vs SMA',
        category: 'VOLUME',
        desc: 'Current bar volume relative to moving average volume',
        defaultParams: { period: 20 },
        paramConfig: [
            { key: 'period', label: 'SMA Period', type: 'number', default: 20, min: 2, max: 100 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 20;
            const vols = candles.map(c => c.volume || 1);
            const sma = calcSMA(vols, period);
            return candles.map((c, i) => {
                const s = sma[i] || vols[i];
                return s === 0 ? 1 : vols[i] / s;
            });
        },
        presetConditions: [
            {
                id: 'vol_above_avg',
                label: 'Volume >= Multiple of Average SMA',
                hasThreshold: true,
                thresholdConfig: { label: 'Volume Multiplier', defaultThreshold: 1.20, step: 0.1, min: 0.5, max: 10.0, unit: '×' },
                checkBuy: (ratio, prev, c, prevC, thresh = 1.2) => {
                    if (!c || !c.volume) return true; // Gracefully pass for zero-volume index feeds (e.g. Nifty 50)
                    return Number(ratio) >= Number(thresh);
                },
                checkSell: (ratio, prev, c, prevC, thresh = 1.2) => {
                    if (!c || !c.volume) return true;
                    return Number(ratio) < (Number(thresh) * 0.5);
                }
            },
            {
                id: 'vol_heavy_spike',
                label: 'Institutional Volume Spike (>= Multiple)',
                hasThreshold: true,
                thresholdConfig: { label: 'Spike Multiplier', defaultThreshold: 2.00, step: 0.2, min: 1.0, max: 15.0, unit: '×' },
                checkBuy: (ratio, prev, c, prevC, thresh = 2.0) => {
                    if (!c || !c.volume) return true;
                    return Number(ratio) >= Number(thresh);
                },
                checkSell: (ratio, prev, c, prevC, thresh = 2.0) => {
                    if (!c || !c.volume) return true;
                    return Number(ratio) < (Number(thresh) * 0.4);
                }
            },
            {
                id: 'vol_below_avg',
                label: 'Low Volume Contraction (<= Multiple)',
                hasThreshold: true,
                thresholdConfig: { label: 'Contraction Multiplier', defaultThreshold: 0.60, step: 0.1, min: 0.1, max: 1.0, unit: '×' },
                checkBuy: (ratio, prev, c, prevC, thresh = 0.6) => {
                    if (!c || !c.volume) return true;
                    return Number(ratio) <= Number(thresh);
                },
                checkSell: (ratio, prev, c, prevC, thresh = 0.6) => {
                    if (!c || !c.volume) return true;
                    return Number(ratio) <= Number(thresh);
                }
            }
        ]
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 5. MARKET STRUCTURE & PIVOTS
    // ═════════════════════════════════════════════════════════════════════════
    support: {
        id: 'support',
        label: 'Support Level',
        category: 'STRUCTURE',
        desc: 'Key swing low structural support zone',
        defaultParams: { period: 20 },
        paramConfig: [
            { key: 'period', label: 'Lookback Period', type: 'number', default: 20, min: 5, max: 100 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 20;
            return candles.map((c, i) => {
                if (i < period) return c.low;
                let lowest = Infinity;
                for (let j = 1; j <= period; j++) lowest = Math.min(lowest, candles[i - j].low);
                return lowest;
            });
        },
        presetConditions: [
            {
                id: 'support_hold',
                label: 'Price Bouncing Above Support (within Buffer %)',
                hasThreshold: true,
                thresholdConfig: { label: 'Buffer Tolerance', defaultThreshold: 1.00, step: 0.1, min: 0.1, max: 5.0, unit: '%' },
                checkBuy: (supp, prev, c, prevC, thresh = 1.0) => {
                    const buff = Number(thresh) / 100;
                    return c.low >= supp && c.close > supp && (c.close - supp) / supp <= buff;
                },
                checkSell: (supp, prev, c) => c.close < supp
            },
            {
                id: 'support_breakdown',
                label: 'Price Breaks Below Support',
                hasThreshold: false,
                checkBuy: (supp, prev, c) => c.close < supp,
                checkSell: (supp, prev, c) => c.close < supp
            }
        ]
    },

    resistance: {
        id: 'resistance',
        label: 'Resistance Level',
        category: 'STRUCTURE',
        desc: 'Key swing high structural supply zone',
        defaultParams: { period: 20 },
        paramConfig: [
            { key: 'period', label: 'Lookback Period', type: 'number', default: 20, min: 5, max: 100 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 20;
            return candles.map((c, i) => {
                if (i < period) return c.high;
                let highest = -Infinity;
                for (let j = 1; j <= period; j++) highest = Math.max(highest, candles[i - j].high);
                return highest;
            });
        },
        presetConditions: [
            {
                id: 'resistance_breakout',
                label: 'Price Breaks Above Resistance',
                hasThreshold: false,
                checkBuy: (res, prev, c, prevC) => prevC.close <= res && c.close > res,
                checkSell: (res, prev, c, prevC) => prevC.close >= res && c.close < res
            },
            {
                id: 'resistance_reject',
                label: 'Price Rejecting Resistance (within Buffer %)',
                hasThreshold: true,
                thresholdConfig: { label: 'Buffer Tolerance', defaultThreshold: 1.00, step: 0.1, min: 0.1, max: 5.0, unit: '%' },
                checkBuy: (res, prev, c, prevC, thresh = 1.0) => {
                    const buff = Number(thresh) / 100;
                    return c.high <= res * (1 + buff) && c.close < res;
                },
                checkSell: (res, prev, c) => c.close > res
            }
        ]
    },

    fibonacci: {
        id: 'fibonacci',
        label: 'Fibonacci Retracement',
        category: 'STRUCTURE',
        desc: 'Retracement to institutional golden ratio zone',
        defaultParams: { period: 30 },
        paramConfig: [
            { key: 'period', label: 'Lookback Period', type: 'number', default: 30, min: 10, max: 100 }
        ],
        compute: (candles, params = {}) => {
            const period = Number(params.period) || 30;
            return candles.map((c, i) => {
                if (i < period) return { high: c.high, low: c.low };
                let high = -Infinity;
                let low = Infinity;
                for (let j = 0; j < period; j++) {
                    high = Math.max(high, candles[i - j].high);
                    low = Math.min(low, candles[i - j].low);
                }
                return { high, low };
            });
        },
        presetConditions: [
            {
                id: 'fib_golden_hold',
                label: 'Defending Retracement Ratio (with Buffer %)',
                hasThreshold: true,
                thresholdConfig: { label: 'Fib Ratio', defaultThreshold: 0.618, step: 0.05, min: 0.1, max: 1.0, unit: 'Ratio' },
                checkBuy: (v, prev, c, prevC, thresh = 0.618) => {
                    const ratio = Number(thresh);
                    const level = v.high - (v.high - v.low) * ratio;
                    return c.close >= level && c.low <= level * 1.01;
                },
                checkSell: (v, prev, c, prevC, thresh = 0.618) => {
                    const ratio = Number(thresh);
                    const level = v.low + (v.high - v.low) * ratio;
                    return c.close <= level && c.high >= level * 0.99;
                }
            }
        ]
    },

    pivot: {
        id: 'pivot',
        label: 'Classical Pivot Point',
        category: 'STRUCTURE',
        desc: 'Daily floor trader pivot (H + L + C) / 3',
        compute: (candles) => {
            return candles.map((c, i) => {
                if (i === 0) return c.close;
                const p = candles[i - 1];
                return (p.high + p.low + p.close) / 3;
            });
        },
        presetConditions: [
            {
                id: 'pivot_above',
                label: 'Price > Classical Pivot Point',
                hasThreshold: false,
                checkBuy: (pivot, prev, c) => c.close > pivot,
                checkSell: (pivot, prev, c) => c.close < pivot
            },
            {
                id: 'pivot_below',
                label: 'Price < Classical Pivot Point',
                hasThreshold: false,
                checkBuy: (pivot, prev, c) => c.close < pivot,
                checkSell: (pivot, prev, c) => c.close > pivot
            },
            {
                id: 'pivot_cross_above',
                label: 'Price Crosses Above Pivot Point',
                hasThreshold: false,
                checkBuy: (pivot, prev, c, prevC) => prevC.close <= prev && c.close > pivot,
                checkSell: (pivot, prev, c, prevC) => prevC.close >= prev && c.close < pivot
            }
        ]
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 6. RAW PRICE & TAPE RULES
    // ═════════════════════════════════════════════════════════════════════════
    raw_close_price: {
        id: 'raw_close_price',
        label: 'Close Price vs Lookback High/Low',
        category: 'RAW_DATA',
        desc: 'Direct price action breakout or breakdown',
        defaultParams: { lookback: 20 },
        paramConfig: [
            { key: 'lookback', label: 'Lookback Bars', type: 'number', default: 20, min: 5, max: 100 }
        ],
        compute: (candles, params = {}) => {
            const lookback = Number(params.lookback) || 20;
            return candles.map((c, i) => {
                if (i < lookback) return { isHigh: false, isLow: false };
                let highest = -Infinity, lowest = Infinity;
                for (let j = 1; j <= lookback; j++) {
                    highest = Math.max(highest, candles[i - j].high);
                    lowest = Math.min(lowest, candles[i - j].low);
                }
                return { isHigh: c.close > highest, isLow: c.close < lowest };
            });
        },
        presetConditions: [
            {
                id: 'raw_new_20_high',
                label: 'Close at New Lookback High (Donchian Breakout)',
                hasThreshold: false,
                checkBuy: (v) => Boolean(v && v.isHigh),
                checkSell: (v) => Boolean(v && v.isLow)
            },
            {
                id: 'raw_new_20_low',
                label: 'Close at New Lookback Low',
                hasThreshold: false,
                checkBuy: (v) => Boolean(v && v.isLow),
                checkSell: (v) => Boolean(v && v.isHigh)
            }
        ]
    },

    raw_body_size: {
        id: 'raw_body_size',
        label: 'Candle Body Size (%)',
        category: 'RAW_DATA',
        desc: 'Filters for strong directional conviction candles',
        compute: (candles) => {
            return candles.map(c => {
                const bodyPct = c.open > 0 ? (Math.abs(c.close - c.open) / c.open) * 100 : 0;
                return { bodyPct, isBullish: c.close > c.open };
            });
        },
        presetConditions: [
            {
                id: 'raw_strong_bull_bar',
                label: 'Strong Bullish Candle (Body >= Threshold %)',
                hasThreshold: true,
                thresholdConfig: { label: 'Body Size', defaultThreshold: 0.75, step: 0.05, min: 0.1, max: 5.0, unit: '%' },
                checkBuy: (v, prev, c, prevC, thresh = 0.75) => Boolean(v && v.isBullish && v.bodyPct >= Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = 0.75) => Boolean(v && !v.isBullish && v.bodyPct >= Number(thresh))
            },
            {
                id: 'raw_strong_bear_bar',
                label: 'Strong Bearish Candle (Body >= Threshold %)',
                hasThreshold: true,
                thresholdConfig: { label: 'Body Size', defaultThreshold: 0.75, step: 0.05, min: 0.1, max: 5.0, unit: '%' },
                checkBuy: (v, prev, c, prevC, thresh = 0.75) => Boolean(v && !v.isBullish && v.bodyPct >= Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = 0.75) => Boolean(v && v.isBullish && v.bodyPct >= Number(thresh))
            },
            {
                id: 'raw_doji_bar',
                label: 'Doji / Small Body (Body <= Threshold %)',
                hasThreshold: true,
                thresholdConfig: { label: 'Max Body Size', defaultThreshold: 0.20, step: 0.05, min: 0.05, max: 1.0, unit: '%' },
                checkBuy: (v, prev, c, prevC, thresh = 0.20) => Boolean(v && v.bodyPct <= Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = 0.20) => Boolean(v && v.bodyPct <= Number(thresh))
            }
        ]
    },

    raw_price_change_pct: {
        id: 'raw_price_change_pct',
        label: '1-Bar Momentum Return (%)',
        category: 'RAW_DATA',
        desc: 'Single candle percentage surge',
        compute: (candles) => {
            return candles.map((c, i) => {
                if (i === 0) return 0;
                const p = candles[i - 1].close;
                return p > 0 ? ((c.close - p) / p) * 100 : 0;
            });
        },
        presetConditions: [
            {
                id: 'raw_surge_1pct',
                label: '1-Bar Return Surge (>= +Threshold %)',
                hasThreshold: true,
                thresholdConfig: { label: 'Surge Return', defaultThreshold: 1.00, step: 0.25, min: 0.25, max: 10.0, unit: '%' },
                checkBuy: (ret, prev, c, prevC, thresh = 1.0) => Number(ret) >= Number(thresh),
                checkSell: (ret, prev, c, prevC, thresh = 1.0) => Number(ret) <= -Number(thresh)
            },
            {
                id: 'raw_surge_2pct',
                label: '1-Bar Return Drop (<= -Threshold %)',
                hasThreshold: true,
                thresholdConfig: { label: 'Drop Return', defaultThreshold: -1.00, step: 0.25, min: -10.0, max: -0.25, unit: '%' },
                checkBuy: (ret, prev, c, prevC, thresh = -1.0) => Number(ret) <= Number(thresh),
                checkSell: (ret, prev, c, prevC, thresh = -1.0) => Number(ret) >= -Number(thresh)
            }
        ]
    },

    raw_gap_up: {
        id: 'raw_gap_up',
        label: 'Opening Gap (%)',
        category: 'RAW_DATA',
        desc: 'Opening gap relative to prior candle high/low',
        compute: (candles) => {
            return candles.map((c, i) => {
                if (i === 0) return { isGapUp: false, isGapDown: false, gapPct: 0 };
                const prev = candles[i - 1];
                const gapUpPct = prev.high > 0 ? ((c.open - prev.high) / prev.high) * 100 : 0;
                const gapDownPct = prev.low > 0 ? ((c.open - prev.low) / prev.low) * 100 : 0;
                return {
                    isGapUp: gapUpPct > 0,
                    isGapDown: gapDownPct < 0,
                    gapUpPct,
                    gapDownPct
                };
            });
        },
        presetConditions: [
            {
                id: 'raw_gap_up_active',
                label: 'Gap Up Open (>= +Threshold % above prior high)',
                hasThreshold: true,
                thresholdConfig: { label: 'Gap Size', defaultThreshold: 0.25, step: 0.05, min: 0.05, max: 5.0, unit: '%' },
                checkBuy: (v, prev, c, prevC, thresh = 0.25) => Boolean(v && v.isGapUp && v.gapUpPct >= Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = 0.25) => Boolean(v && v.isGapDown && v.gapDownPct <= -Number(thresh))
            },
            {
                id: 'raw_gap_down_active',
                label: 'Gap Down Open (<= -Threshold % below prior low)',
                hasThreshold: true,
                thresholdConfig: { label: 'Gap Size', defaultThreshold: -0.25, step: 0.05, min: -5.0, max: -0.05, unit: '%' },
                checkBuy: (v, prev, c, prevC, thresh = -0.25) => Boolean(v && v.isGapDown && v.gapDownPct <= Number(thresh)),
                checkSell: (v, prev, c, prevC, thresh = -0.25) => Boolean(v && v.isGapUp && v.gapUpPct >= -Number(thresh))
            }
        ]
    }
};
