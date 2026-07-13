import { SMA, EMA, RSI, MACD, StochasticRSI, WilliamsR, BollingerBands, ATR, ADX, OBV, VWAP } from 'technicalindicators';
import db from '../config/localDb.js';

/**
 * Helper to calculate Supertrend natively.
 */
function calculateSupertrend(high, low, close, period = 10, multiplier = 3) {
    if (close.length <= period) return [];
    
    const atrArr = ATR.calculate({ high, low, close, period });
    const offset = close.length - atrArr.length;
    
    let finalSupertrend = [];
    let isUptrend = true;
    let prevUpper = 0;
    let prevLower = 0;
    let prevSupertrend = 0;

    for (let i = offset; i < close.length; i++) {
        const c = close[i];
        const prevClose = close[i-1];
        const hl2 = (high[i] + low[i]) / 2;
        const atr = atrArr[i - offset];
        
        let basicUpper = hl2 + (multiplier * atr);
        let basicLower = hl2 - (multiplier * atr);
        
        if (i === offset) {
            prevUpper = basicUpper;
            prevLower = basicLower;
            prevSupertrend = basicLower;
            isUptrend = true;
        }

        let finalUpper = (basicUpper < prevUpper || prevClose > prevUpper) ? basicUpper : prevUpper;
        let finalLower = (basicLower > prevLower || prevClose < prevLower) ? basicLower : prevLower;
        
        let st = 0;
        
        if (prevSupertrend === prevUpper && c <= finalUpper) {
            isUptrend = false;
            st = finalUpper;
        } else if (prevSupertrend === prevUpper && c > finalUpper) {
            isUptrend = true;
            st = finalLower;
        } else if (prevSupertrend === prevLower && c >= finalLower) {
            isUptrend = true;
            st = finalLower;
        } else if (prevSupertrend === prevLower && c < finalLower) {
            isUptrend = false;
            st = finalUpper;
        }
        
        finalSupertrend.push({ value: st, isUptrend });
        
        prevUpper = finalUpper;
        prevLower = finalLower;
        prevSupertrend = st;
    }
    
    return finalSupertrend;
}

/**
 * Helper to calculate Chaikin Money Flow (CMF).
 */
function calculateCMF(high, low, close, volume, period = 20) {
    if (close.length < period) return [];
    
    let mfv = [];
    for (let i = 0; i < close.length; i++) {
        let h = high[i], l = low[i], c = close[i], v = volume[i];
        let divisor = h - l;
        let multiplier = divisor === 0 ? 0 : ((c - l) - (h - c)) / divisor;
        mfv.push(multiplier * v);
    }
    
    let cmf = [];
    for (let i = period - 1; i < close.length; i++) {
        let sumMFV = 0;
        let sumVol = 0;
        for (let j = i - period + 1; j <= i; j++) {
            sumMFV += mfv[j];
            sumVol += volume[j];
        }
        cmf.push(sumVol === 0 ? 0 : sumMFV / sumVol);
    }
    
    // Pad the front with nulls to match original array length
    return new Array(period - 1).fill(null).concat(cmf);
}

/**
 * Fetch the latest N candles from SQLite for the given instrument.
 */
function getHistoricalCandles(instrumentKey, limit = 500, timeframe = 'day') {
    const stmt = db.prepare(`
        SELECT timestamp, open, high, low, close, volume
        FROM candles
        WHERE instrument_key = ? AND timeframe = ?
        ORDER BY timestamp DESC
        LIMIT ?
    `);
    const rows = stmt.all(instrumentKey, timeframe, limit);
    // Reverse to chronological order
    return rows.reverse();
}

/**
 * Run technical indicator algorithms on the historical data.
 */
export function calculateTechnicals(instrumentKey, liveQuote = null, timeframe = 'day', config = {}) {
    const candles = getHistoricalCandles(instrumentKey, 500, timeframe);
    
    if (candles.length < 50) {
        return null; // Not enough data
    }

    // Dynamic Live Candle Stitching
    if (liveQuote) {
        const last = candles[candles.length - 1];
        
        if (timeframe === 'day') {
            const todayStr = new Date().toISOString().split('T')[0];
            const lastDateStr = last.timestamp ? last.timestamp.split('T')[0] : "";

            if (lastDateStr === todayStr) {
                // Update the existing current day's candle
                last.close = liveQuote.ltp || liveQuote.close || last.close;
                if (liveQuote.high && liveQuote.high > last.high) last.high = liveQuote.high;
                if (liveQuote.low && liveQuote.low < last.low) last.low = liveQuote.low;
                if (liveQuote.volume) last.volume = liveQuote.volume;
            } else {
                // Append a brand new active candle for today using the live quotes
                candles.push({
                    timestamp: new Date().toISOString(),
                    open: liveQuote.open || liveQuote.ltp,
                    high: liveQuote.high || liveQuote.ltp,
                    low: liveQuote.low || liveQuote.ltp,
                    close: liveQuote.ltp || liveQuote.close,
                    volume: liveQuote.volume || 0
                });
            }
        } else {
            // For intraday, simply append the live quote as the active unclosed candle
            // (or overwrite the last one if it's the same minute/interval, but appending is safer for moving averages to process the "current tick")
            candles.push({
                timestamp: new Date().toISOString(),
                open: liveQuote.open || liveQuote.ltp,
                high: liveQuote.high || liveQuote.ltp,
                low: liveQuote.low || liveQuote.ltp,
                close: liveQuote.ltp || liveQuote.close,
                volume: liveQuote.volume || 0
            });
        }
    }

    const close = candles.map(c => c.close);
    const high = candles.map(c => c.high);
    const low = candles.map(c => c.low);
    const volume = candles.map(c => c.volume);

    // SMA & EMA
    const sma50 = SMA.calculate({ period: 50, values: close });
    const sma200 = SMA.calculate({ period: 200, values: close });
    const ema20 = EMA.calculate({ period: 20, values: close });
    const ema50 = EMA.calculate({ period: 50, values: close });
    const ema200 = EMA.calculate({ period: 200, values: close });

    // Momentum
    const rsiPeriod = config.rsi_period || 14;
    const macdFast = config.macd_fast || 12;
    const macdSlow = config.macd_slow || 26;
    const macdSignal = config.macd_signal || 9;
    const stochRsiPeriod = config.stoch_rsi_period || 14;
    const stochPeriod = config.stoch_period || 14;
    const stochKPeriod = config.stoch_k_period || 3;
    const stochDPeriod = config.stoch_d_period || 3;
    const williamsPeriod = config.williams_period || 14;

    const rsi = RSI.calculate({ period: rsiPeriod, values: close });
    const macd = MACD.calculate({
        values: close,
        fastPeriod: macdFast,
        slowPeriod: macdSlow,
        signalPeriod: macdSignal,
        SimpleMAOscillator: false,
        SimpleMASignal: false
    });
    const stochRsi = StochasticRSI.calculate({ values: close, rsiPeriod: stochRsiPeriod, stochasticPeriod: stochPeriod, kPeriod: stochKPeriod, dPeriod: stochDPeriod });
    const williams = WilliamsR.calculate({ high, low, close, period: williamsPeriod });

    // Volatility
    const bbPeriod = config.bb_period || 20;
    const bbStdDev = config.bb_stddev || 2;
    const atrPeriod = config.atr_period || 14;
    
    const bb = BollingerBands.calculate({ period: bbPeriod, values: close, stdDev: bbStdDev });
    const atr = ATR.calculate({ high, low, close, period: atrPeriod });

    // Custom Keltner Channel implementation
    const kcPeriod = config.kc_period || 20;
    const kcMultiplier = config.kc_multiplier || 1.5;
    const kcAtrPeriod = config.kc_atr_period || 10;
    
    let kcArr = [];
    if (close.length >= kcPeriod && close.length >= kcAtrPeriod) {
        const kcEma = EMA.calculate({ period: kcPeriod, values: close });
        const kcAtr = ATR.calculate({ high, low, close, period: kcAtrPeriod });
        
        // Align arrays (EMA drops first N-1 items, ATR drops first M-1 items)
        const diffLength = close.length - kcEma.length;
        const atrDiffLength = close.length - kcAtr.length;

        for (let i = 0; i < close.length; i++) {
            const emaIndex = i - diffLength;
            const atrIndex = i - atrDiffLength;
            if (emaIndex >= 0 && atrIndex >= 0) {
                const middle = kcEma[emaIndex];
                const atrVal = kcAtr[atrIndex];
                kcArr.push({
                    middle: middle,
                    upper: middle + (kcMultiplier * atrVal),
                    lower: middle - (kcMultiplier * atrVal)
                });
            }
        }
    }

    // Trend
    const adxPeriod = config.adx_period || 14;
    const stPeriod = config.supertrend_period || 10;
    const stMultiplier = config.supertrend_multiplier || 3;

    const adx = ADX.calculate({ high, low, close, period: adxPeriod });
    const supertrendArr = calculateSupertrend(high, low, close, stPeriod, stMultiplier);

    // Volume
    const obv = OBV.calculate({ close, volume });
    const obvSma = SMA.calculate({ period: 20, values: obv });
    const vwap = VWAP.calculate({ high, low, close, volume });
    const volumeSma = SMA.calculate({ period: 20, values: volume });
    
    const cmfPeriod = config.cmf_period || 20;
    const cmfArr = calculateCMF(high, low, close, volume, cmfPeriod);

    // Structure (Support, Resistance, Pivot, Fibonacci)
    const structurePeriod = config.structure_period || 50;
    let support = null, resistance = null;
    let fibonacci = null;
    if (close.length >= structurePeriod) {
        let highest = -Infinity, lowest = Infinity;
        for (let i = close.length - structurePeriod; i < close.length; i++) {
            if (high[i] > highest) highest = high[i];
            if (low[i] < lowest) lowest = low[i];
        }
        support = lowest;
        resistance = highest;
        
        let diff = highest - lowest;
        fibonacci = {
            level_0: highest,
            level_236: highest - (diff * 0.236),
            level_382: highest - (diff * 0.382),
            level_500: highest - (diff * 0.5),
            level_618: highest - (diff * 0.618),
            level_705: highest - (diff * 0.705),
            level_786: highest - (diff * 0.786),
            level_100: lowest,
            level_1272: highest - (diff * 1.272),
            level_1414: highest - (diff * 1.414),
            level_1618: highest - (diff * 1.618),
            level_2000: highest - (diff * 2.0),
            level_2618: highest - (diff * 2.618)
        };
    }

    let pivot = null;
    // Calculate pivot from the previously completed candle
    const prevCandleIdx = close.length >= 2 ? close.length - 2 : null;
    if (prevCandleIdx !== null) {
        const ph = high[prevCandleIdx];
        const pl = low[prevCandleIdx];
        const pc = close[prevCandleIdx];
        const p = (ph + pl + pc) / 3;
        pivot = {
            p,
            r1: (p * 2) - pl,
            s1: (p * 2) - ph,
            r2: p + (ph - pl),
            s2: p - (ph - pl),
            r3: ph + 2 * (p - pl),
            s3: pl - 2 * (ph - p)
        };
    }

    // Extract the latest values
    const safeLast = (arr) => arr && arr.length > 0 ? arr[arr.length - 1] : null;

    const latestBb = safeLast(bb);
    const latestMacd = safeLast(macd);

    return {
                current_price: close[close.length - 1],
        current_volume: volume[volume.length - 1],
        
        // Trend
        ema_20: safeLast(ema20),
        ema_50: safeLast(ema50),
        ema_200: safeLast(ema200),
        sma_50: safeLast(sma50),
        sma_200: safeLast(sma200),
        adx: adx && adx.length >= 2 ? {
            value: adx[adx.length - 1].adx,
            prev: adx[adx.length - 2].adx
        } : null,
        supertrend: safeLast(supertrendArr),

        // Momentum
        rsi: safeLast(rsi),
        macd: latestMacd, // Exports the full { MACD, signal, histogram } object
        stoch_rsi: safeLast(stochRsi), // Exports the full { k, d } object
        williams_r: safeLast(williams),

        // Volatility
        bb_20_2: latestBb, // Exports { lower, middle, upper, pb }
        atr: safeLast(atr),
        kc: safeLast(kcArr), // Exports { lower, middle, upper }
        india_vix: null, // Pulled dynamically in controller

        // Volume
        cmf: safeLast(volumeSma) === 0 ? null : safeLast(cmfArr), 
        obv: safeLast(volumeSma) === 0 ? null : safeLast(obv),
        obv_sma: safeLast(volumeSma) === 0 ? null : safeLast(obvSma),
        vwap: safeLast(volumeSma) === 0 ? null : safeLast(vwap),
        volume_sma: safeLast(volumeSma) === 0 ? null : safeLast(volumeSma),

        // Key Levels
        support,
        resistance,
        fibonacci,
        pivot,
        trendline: null, // Extremely complex to mathematically define dynamically on 1D arrays without chart patterns, leaving as null so frontend can fallback to overrides.
        
        // Live Equivalents for Engines
        current_price: safeLast(close),
        current_volume: safeLast(volume),

        // Timestamp of the actual data used
        last_candle_timestamp: candles[candles.length - 1]?.timestamp || null
    };
}



