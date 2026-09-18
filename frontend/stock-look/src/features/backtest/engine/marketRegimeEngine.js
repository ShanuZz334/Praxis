/**
 * Institutional Market Regime Classification & Performance Profiling Engine
 * 
 * Segment historical candles and backtest trades into 5 quantitative regimes:
 * BULL_TREND, BEAR_TREND, SIDEWAYS_CHOP, HIGH_VOL_CRISIS, and LOW_VOL.
 * Computes regime efficiency metrics, stress tests, and environmental robustness scores.
 */

export const REGIME_TYPES = {
    BULL_TREND: 'BULL_TREND',
    BEAR_TREND: 'BEAR_TREND',
    SIDEWAYS_CHOP: 'SIDEWAYS_CHOP',
    HIGH_VOL_CRISIS: 'HIGH_VOL_CRISIS',
    LOW_VOL: 'LOW_VOL',
};

/**
 * Classifies all candlestick bars into distinct quantitative market regimes.
 * 
 * @param {Array} candles - Array of OHLCV candles
 * @returns {Map<number, string>} Map of candle.time -> regime string
 */
export function classifyCandleRegimes(candles) {
    if (!candles || candles.length < 20) return new Map();

    const n = candles.length;
    const closes = candles.map(c => c.close);

    // Calculate EMA 50 & EMA 200
    const ema50 = calcRollingEMA(closes, 50);
    const ema200 = calcRollingEMA(closes, 200);

    // Calculate ATR 14
    const atr14 = calcRollingATR(candles, 14);
    const atrPercentiles = computePercentileRanks(atr14);

    // Calculate ADX 14 proxy
    const adx14 = calcRollingADX(candles, 14);

    const regimeMap = new Map();

    for (let i = 0; i < n; i++) {
        const c = candles[i];
        const close = c.close;
        const e50 = ema50[i] || close;
        const e200 = ema200[i] || close;
        const adx = adx14[i] || 20;
        const atrP = atrPercentiles[i] || 50;

        let regime = REGIME_TYPES.SIDEWAYS_CHOP;

        if (atrP >= 80) {
            regime = REGIME_TYPES.HIGH_VOL_CRISIS;
        } else if (adx >= 22 && close > e200 && e50 >= e200 * 0.99) {
            regime = REGIME_TYPES.BULL_TREND;
        } else if (adx >= 22 && close < e200 && e50 <= e200 * 1.01) {
            regime = REGIME_TYPES.BEAR_TREND;
        } else if (atrP <= 20 && adx < 18) {
            regime = REGIME_TYPES.LOW_VOL;
        } else {
            regime = REGIME_TYPES.SIDEWAYS_CHOP;
        }

        regimeMap.set(c.time, regime);
    }

    return regimeMap;
}

/**
 * Analyzes backtest trade performance segmented by market regime.
 * 
 * @param {Array} trades - Array of trade objects
 * @param {Array} candles - Array of historical candles
 * @returns {Object} Comprehensive regime performance breakdown and robustness rating
 */
export function analyzeRegimePerformance(trades, candles) {
    if (!trades || !trades.length || !candles || !candles.length) {
        return getEmptyRegimeResult();
    }

    const regimeMap = classifyCandleRegimes(candles);

    // Group trades by regime at entry
    const regimeStats = {
        [REGIME_TYPES.BULL_TREND]: createRegimeBucket('Bull Trend', 'emerald', 'Trending Up (EMA > 200, ADX > 22)'),
        [REGIME_TYPES.BEAR_TREND]: createRegimeBucket('Bear Trend', 'rose', 'Trending Down (EMA < 200, ADX > 22)'),
        [REGIME_TYPES.SIDEWAYS_CHOP]: createRegimeBucket('Sideways Chop', 'amber', 'Range-Bound / Consolidation (ADX < 20)'),
        [REGIME_TYPES.HIGH_VOL_CRISIS]: createRegimeBucket('High Vol / Crisis', 'purple', 'Elevated ATR / Volatility Shock (ATR > 80th %)'),
        [REGIME_TYPES.LOW_VOL]: createRegimeBucket('Low Vol Drift', 'cyan', 'Dull / Low Range Compression (ATR < 20th %)'),
    };

    trades.forEach(trade => {
        const reg = regimeMap.get(trade.entryTime) || REGIME_TYPES.SIDEWAYS_CHOP;
        const bucket = regimeStats[reg];
        if (!bucket) return;

        bucket.trades++;
        bucket.netPnl += (trade.realizedPnl || 0);
        bucket.grossReturn += (trade.returnPct || 0);

        if (trade.outcome === 'WIN') {
            bucket.wins++;
            bucket.grossGains += Math.max(0, trade.returnPct);
        } else if (trade.outcome === 'LOSS') {
            bucket.losses++;
            bucket.grossLosses += Math.abs(trade.returnPct);
        } else {
            bucket.breakEvens++;
        }
    });

    // Finalize metrics per regime
    const regimeArray = Object.values(regimeStats).map(b => {
        const total = b.trades;
        b.winRate = total > 0 ? Math.round((b.wins / total) * 1000) / 10 : 0;
        b.profitFactor = b.grossLosses > 0 
            ? Math.round((b.grossGains / b.grossLosses) * 100) / 100 
            : (b.grossGains > 0 ? 99.9 : 0);
        b.avgTradeReturn = total > 0 ? Math.round((b.grossReturn / total) * 100) / 100 : 0;
        b.netPnl = Math.round(b.netPnl);
        b.tradesCount = b.trades;
        b.totalPnl = b.netPnl;
        b.label = b.name;
        b.regime = b.name;
        return b;
    });

    // Calculate Regime Robustness Index (0-100)
    // Measures if the system produces positive profit factors across varied market environments
    const activeRegimes = regimeArray.filter(r => r.trades >= 3);
    const profitableRegimes = activeRegimes.filter(r => r.profitFactor >= 1.05 && r.avgTradeReturn > 0);
    const robustnessRatio = activeRegimes.length > 0 ? profitableRegimes.length / activeRegimes.length : 0;

    let robustnessScore = Math.round(robustnessRatio * 85);
    // Penalty if strategy completely collapses in sideways chop
    const chopRegime = regimeStats[REGIME_TYPES.SIDEWAYS_CHOP];
    if (chopRegime && chopRegime.trades >= 5 && chopRegime.profitFactor < 0.6) {
        robustnessScore = Math.max(10, robustnessScore - 20);
    }
    // Reward for all-weather profitability
    if (activeRegimes.length >= 3 && profitableRegimes.length === activeRegimes.length) {
        robustnessScore = Math.min(98, robustnessScore + 15);
    }

    return {
        regimes: regimeArray,
        regimeMatrix: regimeArray,
        activeRegimeCount: activeRegimes.length,
        profitableRegimeCount: profitableRegimes.length,
        robustnessScore: Math.max(10, Math.min(99, robustnessScore)),
        resilienceScore: Math.max(10, Math.min(99, robustnessScore)),
        isAllWeather: robustnessScore >= 75,
        primaryEdgeRegime: [...regimeArray].sort((a, b) => b.profitFactor - a.profitFactor)[0]?.name || 'Neutral',
    };
}

function createRegimeBucket(name, color, desc) {
    return {
        name,
        color,
        description: desc,
        trades: 0,
        wins: 0,
        losses: 0,
        breakEvens: 0,
        winRate: 0,
        profitFactor: 0,
        avgTradeReturn: 0,
        grossGains: 0,
        grossLosses: 0,
        grossReturn: 0,
        netPnl: 0,
    };
}

function getEmptyRegimeResult() {
    return {
        regimes: [],
        activeRegimeCount: 0,
        profitableRegimeCount: 0,
        robustnessScore: 50,
        isAllWeather: false,
        primaryEdgeRegime: 'N/A',
    };
}

// ─── Mathematical Indicator Helpers for Regimes ─────────────────────────────

function calcRollingEMA(values, period) {
    const k = 2 / (period + 1);
    const ema = new Array(values.length);
    let sum = 0;
    for (let i = 0; i < Math.min(period, values.length); i++) {
        sum += values[i];
        ema[i] = sum / (i + 1);
    }
    for (let i = period; i < values.length; i++) {
        ema[i] = values[i] * k + ema[i - 1] * (1 - k);
    }
    return ema;
}

function calcRollingATR(candles, period = 14) {
    const trs = [candles[0].high - candles[0].low];
    for (let i = 1; i < candles.length; i++) {
        const c = candles[i];
        const prev = candles[i - 1];
        trs.push(Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close)));
    }
    const atrs = new Array(candles.length);
    let sum = 0;
    for (let i = 0; i < Math.min(period, trs.length); i++) {
        sum += trs[i];
        atrs[i] = sum / (i + 1);
    }
    for (let i = period; i < candles.length; i++) {
        atrs[i] = (atrs[i - 1] * (period - 1) + trs[i]) / period;
    }
    return atrs;
}

function computePercentileRanks(values) {
    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);
    return values.map(val => {
        let count = 0;
        for (let i = 0; i < n; i++) {
            if (sorted[i] <= val) count++;
            else break;
        }
        return Math.round((count / n) * 100);
    });
}

function calcRollingADX(candles, period = 14) {
    // Standard Wilder ADX approximation
    const n = candles.length;
    const adx = new Array(n).fill(20);
    if (n < period * 2) return adx;

    const tr = [];
    const plusDm = [];
    const minusDm = [];

    for (let i = 1; i < n; i++) {
        const c = candles[i];
        const p = candles[i - 1];
        const up = c.high - p.high;
        const down = p.low - c.low;

        plusDm.push(up > down && up > 0 ? up : 0);
        minusDm.push(down > up && down > 0 ? down : 0);
        tr.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
    }

    let trSm = tr.slice(0, period).reduce((a, b) => a + b, 0);
    let pSm = plusDm.slice(0, period).reduce((a, b) => a + b, 0);
    let mSm = minusDm.slice(0, period).reduce((a, b) => a + b, 0);

    const dx = [];
    for (let i = period; i < tr.length; i++) {
        trSm = trSm - (trSm / period) + tr[i];
        pSm = pSm - (pSm / period) + plusDm[i];
        mSm = mSm - (mSm / period) + minusDm[i];

        const pDi = trSm > 0 ? (pSm / trSm) * 100 : 0;
        const mDi = trSm > 0 ? (mSm / trSm) * 100 : 0;
        const sumDi = pDi + mDi;
        const diffDi = Math.abs(pDi - mDi);
        dx.push(sumDi > 0 ? (diffDi / sumDi) * 100 : 0);
    }

    let adxSm = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period * 2; i < n; i++) {
        const dxIdx = i - period;
        if (dxIdx < dx.length) {
            adxSm = (adxSm * (period - 1) + dx[dxIdx]) / period;
            adx[i] = Math.round(adxSm * 10) / 10;
        }
    }

    return adx;
}
