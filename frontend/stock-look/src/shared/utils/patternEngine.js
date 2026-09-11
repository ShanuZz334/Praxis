/**
 * @file patternEngine.js
 * @purpose Pure mathematical engine for scanning OHLCV data, detecting candlestick patterns, and calculating a decaying composite sentiment score.
 * @date 2026-09-11
 */

const PATTERN_DEFS = {
    // A. Single-Candle Patterns
    Hammer:           { len: 1, dir: 1,  base: 3, w: { intraday: 1.3, swing: 1.0, positional: 0.6 } },
    HangingMan:       { len: 1, dir: -1, base: -3, w: { intraday: 1.3, swing: 1.0, positional: 0.6 } },
    ShootingStar:     { len: 1, dir: -1, base: -3, w: { intraday: 1.3, swing: 1.0, positional: 0.6 } },
    InvertedHammer:   { len: 1, dir: 1,  base: 2, w: { intraday: 1.2, swing: 0.9, positional: 0.5 } },
    BullMarubozu:     { len: 1, dir: 1,  base: 2, w: { intraday: 1.4, swing: 0.8, positional: 0.4 } },
    BearMarubozu:     { len: 1, dir: -1, base: -2, w: { intraday: 1.4, swing: 0.8, positional: 0.4 } },
    Doji:             { len: 1, dir: 0,  base: 0, w: { intraday: 1.0, swing: 1.0, positional: 1.0 } },
    SpinningTop:      { len: 1, dir: 0,  base: 0, w: { intraday: 1.0, swing: 1.0, positional: 1.0 } },
    
    // B. Two-Candle Patterns
    BullEngulfing:    { len: 2, dir: 1,  base: 4, w: { intraday: 1.4, swing: 1.2, positional: 0.8 } },
    BearEngulfing:    { len: 2, dir: -1, base: -4, w: { intraday: 1.4, swing: 1.2, positional: 0.8 } },
    PiercingLine:     { len: 2, dir: 1,  base: 3, w: { intraday: 1.2, swing: 1.0, positional: 0.6 } },
    DarkCloudCover:   { len: 2, dir: -1, base: -3, w: { intraday: 1.2, swing: 1.0, positional: 0.6 } },
    BullHarami:       { len: 2, dir: 1,  base: 2, w: { intraday: 1.0, swing: 1.0, positional: 0.7 } },
    BearHarami:       { len: 2, dir: -1, base: -2, w: { intraday: 1.0, swing: 1.0, positional: 0.7 } },
    BullHaramiCross:  { len: 2, dir: 1,  base: 2.5, w: { intraday: 1.0, swing: 1.0, positional: 0.7 } },
    BearHaramiCross:  { len: 2, dir: -1, base: -2.5, w: { intraday: 1.0, swing: 1.0, positional: 0.7 } },
    TweezerBottom:    { len: 2, dir: 1,  base: 2, w: { intraday: 1.1, swing: 0.9, positional: 0.5 } },
    TweezerTop:       { len: 2, dir: -1, base: -2, w: { intraday: 1.1, swing: 0.9, positional: 0.5 } },

    // C. Three-Candle Patterns
    MorningStar:      { len: 3, dir: 1,  base: 5, w: { intraday: 1.2, swing: 1.3, positional: 1.0 } },
    EveningStar:      { len: 3, dir: -1, base: -5, w: { intraday: 1.2, swing: 1.3, positional: 1.0 } },
    AbandBabyBull:    { len: 3, dir: 1,  base: 5, w: { intraday: 1.2, swing: 1.3, positional: 1.0 } },
    AbandBabyBear:    { len: 3, dir: -1, base: -5, w: { intraday: 1.2, swing: 1.3, positional: 1.0 } },
    ThreeWhiteSoldiers:{len: 3, dir: 1,  base: 5, w: { intraday: 1.3, swing: 1.2, positional: 0.8 } },
    ThreeBlackCrows:  { len: 3, dir: -1, base: -5, w: { intraday: 1.3, swing: 1.2, positional: 0.8 } },
    ThreeInsideUp:    { len: 3, dir: 1,  base: 3, w: { intraday: 1.0, swing: 1.0, positional: 0.7 } },
    ThreeInsideDown:  { len: 3, dir: -1, base: -3, w: { intraday: 1.0, swing: 1.0, positional: 0.7 } },
    ThreeOutsideUp:   { len: 3, dir: 1,  base: 4, w: { intraday: 1.1, swing: 1.1, positional: 0.7 } },
    ThreeOutsideDown: { len: 3, dir: -1, base: -4, w: { intraday: 1.1, swing: 1.1, positional: 0.7 } },

    // D. Continuation
    RisingThree:      { len: 5, dir: 1,  base: 3, w: { intraday: 0.9, swing: 1.1, positional: 0.9 } },
    FallingThree:     { len: 5, dir: -1, base: -3, w: { intraday: 0.9, swing: 1.1, positional: 0.9 } },
    TasukiGapUp:      { len: 3, dir: 1,  base: 2, w: { intraday: 0.9, swing: 1.0, positional: 0.7 } },
    TasukiGapDown:    { len: 3, dir: -1, base: -2, w: { intraday: 0.9, swing: 1.0, positional: 0.7 } },

    // E. Structural Patterns
    DoubleBottom:     { len: 5, dir: 1,  base: 4, w: { intraday: 0.4, swing: 1.1, positional: 1.3 } },
    DoubleTop:        { len: 5, dir: -1, base: -4, w: { intraday: 0.4, swing: 1.1, positional: 1.3 } },
    TripleBottom:     { len: 7, dir: 1,  base: 4, w: { intraday: 0.3, swing: 1.0, positional: 1.3 } },
    TripleTop:        { len: 7, dir: -1, base: -4, w: { intraday: 0.3, swing: 1.0, positional: 1.3 } },
    InvHeadAndShoulders:{ len: 7, dir: 1,  base: 5, w: { intraday: 0.4, swing: 1.2, positional: 1.4 } },
    HeadAndShoulders: { len: 7, dir: -1, base: -5, w: { intraday: 0.4, swing: 1.2, positional: 1.4 } },
    AscendingTriangle:{ len: 5, dir: 1,  base: 3, w: { intraday: 0.5, swing: 1.1, positional: 1.1 } },
    DescendingTriangle:{len: 5, dir: -1, base: -3, w: { intraday: 0.5, swing: 1.1, positional: 1.1 } },
    SymmetricalTriangle:{len: 5, dir: 0,  base: 0, w: { intraday: 1.0, swing: 1.0, positional: 1.0 } },
    FallingWedge:     { len: 5, dir: 1,  base: 3, w: { intraday: 0.5, swing: 1.0, positional: 1.1 } },
    RisingWedge:      { len: 5, dir: -1, base: -3, w: { intraday: 0.5, swing: 1.0, positional: 1.1 } },
    BullFlag:         { len: 11, dir: 1,  base: 3, w: { intraday: 0.8, swing: 1.2, positional: 0.8 } },
    BearFlag:         { len: 11, dir: -1, base: -3, w: { intraday: 0.8, swing: 1.2, positional: 0.8 } },
    BullPennant:      { len: 11, dir: 1,  base: 2, w: { intraday: 0.8, swing: 1.1, positional: 0.7 } },
    BearPennant:      { len: 11, dir: -1, base: -2, w: { intraday: 0.8, swing: 1.1, positional: 0.7 } },
    CupAndHandle:     { len: 8, dir: 1,  base: 4, w: { intraday: 0.2, swing: 1.0, positional: 1.4 } },
    RoundingBottom:   { len: 6, dir: 1,  base: 3, w: { intraday: 0.2, swing: 0.8, positional: 1.2 } },
    RoundingTop:      { len: 6, dir: -1, base: -3, w: { intraday: 0.2, swing: 0.8, positional: 1.2 } },

    // F. Gap Patterns
    BreakawayGapUp:   { len: 2, dir: 1,  base: 3, w: { intraday: 1.0, swing: 1.0, positional: 0.8 } },
    BreakawayGapDown: { len: 2, dir: -1, base: -3, w: { intraday: 1.0, swing: 1.0, positional: 0.8 } },
    ExhaustionGapUp:  { len: 2, dir: -1, base: -2, w: { intraday: 0.9, swing: 1.0, positional: 0.8 } },
    ExhaustionGapDown:{ len: 2, dir: 1,  base: 2, w: { intraday: 0.9, swing: 1.0, positional: 0.8 } }
};


// ── Helpers ──
const isBull = (c) => c.close > c.open;
const isBear = (c) => c.close < c.open;
const bodySize = (c) => Math.abs(c.close - c.open);
const totalSize = (c) => c.high - c.low;
const upperWick = (c) => c.high - Math.max(c.open, c.close);
const lowerWick = (c) => Math.min(c.open, c.close) - c.low;

// Detects local trend over the last N candles
const getTrend = (data, idx, period = 5) => {
    if (idx < period) return 'neutral';
    const current = data[idx].close;
    const past = data[idx - period].close;
    if (current > past * 1.01) return 'uptrend';
    if (current < past * 0.99) return 'downtrend';
    return 'neutral';
};

const isDoji = (c) => bodySize(c) <= totalSize(c) * 0.1;
const isMarubozu = (c) => bodySize(c) >= totalSize(c) * 0.9;
const isHammer = (c) => {
    if (isDoji(c)) return false;
    return lowerWick(c) >= bodySize(c) * 2 && upperWick(c) <= bodySize(c) * 0.5;
};
const isShootingStar = (c) => {
    if (isDoji(c)) return false;
    return upperWick(c) >= bodySize(c) * 2 && lowerWick(c) <= bodySize(c) * 0.5;
};

// ── Detection Engine ──
export const detectPatternsAtCandle = (data, idx) => {
    const patterns = [];
    if (idx < 5) return patterns;

    const c0 = data[idx];     // Current candle
    const c1 = data[idx - 1]; // Previous
    const c2 = data[idx - 2];
    const c3 = data[idx - 3];
    const c4 = data[idx - 4];

    const trend = getTrend(data, idx);

    // -- 1. Single Candle --
    if (isHammer(c0)) {
        if (trend === 'downtrend') patterns.push({ id: 'Hammer', name: 'Hammer', ...PATTERN_DEFS.Hammer });
        else if (trend === 'uptrend') patterns.push({ id: 'HangingMan', name: 'Hanging Man', ...PATTERN_DEFS.HangingMan });
    }
    if (isShootingStar(c0)) {
        if (trend === 'uptrend') patterns.push({ id: 'ShootingStar', name: 'Shooting Star', ...PATTERN_DEFS.ShootingStar });
        else if (trend === 'downtrend') patterns.push({ id: 'InvertedHammer', name: 'Inverted Hammer', ...PATTERN_DEFS.InvertedHammer });
    }
    if (isMarubozu(c0)) {
        if (isBull(c0)) patterns.push({ id: 'BullMarubozu', name: 'Bull Marubozu', ...PATTERN_DEFS.BullMarubozu });
        if (isBear(c0)) patterns.push({ id: 'BearMarubozu', name: 'Bear Marubozu', ...PATTERN_DEFS.BearMarubozu });
    }
    if (isDoji(c0)) {
        patterns.push({ id: 'Doji', name: 'Doji', ...PATTERN_DEFS.Doji });
    }

    // -- 2. Two Candle --
    if (isBear(c1) && isBull(c0)) {
        // Bullish Engulfing
        if (c0.close > c1.open && c0.open <= c1.close) {
            patterns.push({ id: 'BullEngulfing', name: 'Bull Engulfing', ...PATTERN_DEFS.BullEngulfing });
        }
        // Piercing Line (Relaxed)
        else if (c0.close > (c1.open + c1.close) / 2 && c0.close <= c1.open && c0.low < c1.low) {
            patterns.push({ id: 'PiercingLine', name: 'Piercing Line', ...PATTERN_DEFS.PiercingLine });
        }
        // Bullish Harami
        else if (c0.close < c1.open && c0.open >= c1.close && bodySize(c0) <= bodySize(c1) * 0.6) {
            if (isDoji(c0)) patterns.push({ id: 'BullHaramiCross', name: 'Bull Harami Cross', ...PATTERN_DEFS.BullHaramiCross });
            else patterns.push({ id: 'BullHarami', name: 'Bull Harami', ...PATTERN_DEFS.BullHarami });
        }
    }
    if (isBull(c1) && isBear(c0)) {
        // Bearish Engulfing
        if (c0.close < c1.open && c0.open >= c1.close) {
            patterns.push({ id: 'BearEngulfing', name: 'Bear Engulfing', ...PATTERN_DEFS.BearEngulfing });
        }
        // Dark Cloud Cover (Relaxed)
        else if (c0.close < (c1.open + c1.close) / 2 && c0.close >= c1.open && c0.high > c1.high) {
            patterns.push({ id: 'DarkCloudCover', name: 'Dark Cloud Cover', ...PATTERN_DEFS.DarkCloudCover });
        }
        // Bearish Harami
        else if (c0.close > c1.open && c0.open <= c1.close && bodySize(c0) <= bodySize(c1) * 0.6) {
            if (isDoji(c0)) patterns.push({ id: 'BearHaramiCross', name: 'Bear Harami Cross', ...PATTERN_DEFS.BearHaramiCross });
            else patterns.push({ id: 'BearHarami', name: 'Bear Harami', ...PATTERN_DEFS.BearHarami });
        }
    }

    // Tweezer
    if (Math.abs(c1.low - c0.low) / c1.low < 0.0005 && trend === 'downtrend') {
        patterns.push({ id: 'TweezerBottom', name: 'Tweezer Bottom', ...PATTERN_DEFS.TweezerBottom });
    }
    if (Math.abs(c1.high - c0.high) / c1.high < 0.0005 && trend === 'uptrend') {
        patterns.push({ id: 'TweezerTop', name: 'Tweezer Top', ...PATTERN_DEFS.TweezerTop });
    }

    // -- 3. Three Candle --
    if (isBear(c2) && isBull(c0) && bodySize(c1) < bodySize(c2) * 0.5) {
        if (c0.close > (c2.open + c2.close) / 2) {
            if (c1.low <= c2.close) { // Relaxed gap logic
                if (isDoji(c1) && c1.open < c2.close) patterns.push({ id: 'AbandBabyBull', name: 'Abandoned Baby (Bull)', ...PATTERN_DEFS.AbandBabyBull });
                else patterns.push({ id: 'MorningStar', name: 'Morning Star', ...PATTERN_DEFS.MorningStar });
            }
        }
    }
    if (isBull(c2) && isBear(c0) && bodySize(c1) < bodySize(c2) * 0.5) {
        if (c0.close < (c2.open + c2.close) / 2) {
            if (c1.high >= c2.close) {
                if (isDoji(c1) && c1.open > c2.close) patterns.push({ id: 'AbandBabyBear', name: 'Abandoned Baby (Bear)', ...PATTERN_DEFS.AbandBabyBear });
                else patterns.push({ id: 'EveningStar', name: 'Evening Star', ...PATTERN_DEFS.EveningStar });
            }
        }
    }

    if (isBull(c2) && isBull(c1) && isBull(c0) && c2.close > c2.open && c1.close > c2.close && c0.close > c1.close) {
        patterns.push({ id: 'ThreeWhiteSoldiers', name: 'Three White Soldiers', ...PATTERN_DEFS.ThreeWhiteSoldiers });
    }
    if (isBear(c2) && isBear(c1) && isBear(c0) && c2.close < c2.open && c1.close < c2.close && c0.close < c1.close) {
        patterns.push({ id: 'ThreeBlackCrows', name: 'Three Black Crows', ...PATTERN_DEFS.ThreeBlackCrows });
    }

    // Inside / Outside Up/Down
    if (isBear(c2) && isBull(c1) && c1.close < c2.open && c1.open > c2.close && isBull(c0) && c0.close > c2.open) {
        patterns.push({ id: 'ThreeInsideUp', name: 'Three Inside Up', ...PATTERN_DEFS.ThreeInsideUp });
    }
    if (isBull(c2) && isBear(c1) && c1.close > c2.open && c1.open < c2.close && isBear(c0) && c0.close < c2.open) {
        patterns.push({ id: 'ThreeInsideDown', name: 'Three Inside Down', ...PATTERN_DEFS.ThreeInsideDown });
    }
    if (isBear(c2) && isBull(c1) && c1.close > c2.open && c1.open < c2.close && isBull(c0) && c0.close > c1.close) {
        patterns.push({ id: 'ThreeOutsideUp', name: 'Three Outside Up', ...PATTERN_DEFS.ThreeOutsideUp });
    }
    if (isBull(c2) && isBear(c1) && c1.close < c2.open && c1.open > c2.close && isBear(c0) && c0.close < c1.close) {
        patterns.push({ id: 'ThreeOutsideDown', name: 'Three Outside Down', ...PATTERN_DEFS.ThreeOutsideDown });
    }

    return patterns;
};

// ── Full Array Scanner & Scorer ──
export const analyzeChartPatterns = (data, mode = 'swing') => {
    const activePatterns = []; // Track patterns to compute decay

    // Calculate moving averages for volume confirmation and ATR for dynamic thresholds
    const volMA = [];
    const atr = [];
    let volSum = 0;
    for (let i = 0; i < data.length; i++) {
        // Volume MA
        volSum += (data[i].volume || 0);
        if (i >= 20) volSum -= (data[i - 20].volume || 0);
        volMA.push(i >= 19 ? volSum / 20 : 0);
        
        // ATR (14-period)
        const c = data[i];
        const prevC = i > 0 ? data[i-1].close : c.open;
        const tr = Math.max(c.high - c.low, Math.abs(c.high - prevC), Math.abs(c.low - prevC));
        atr.push(i === 0 ? tr : (atr[i-1] * 13 + tr) / 14);
    }

    // Pass 1: Find all Candlestick Patterns
    for (let i = 5; i < data.length; i++) {
        const found = detectPatternsAtCandle(data, i);
        if (found.length > 0) {
            // Apply volume confluence
            const vMA = volMA[i];
            const candleVol = data[i].volume || 0;
            const volMult = (candleVol > vMA * 1.5) ? 1.25 : 1.0;

            found.forEach(p => {
                activePatterns.push({
                    ...p,
                    index: i,
                    time: data[i].time,
                    volMult,
                    invalidated: false,
                    stopLevel: p.dir > 0 ? data[i].low : data[i].high // Basic invalidation
                });
            });
        }
    }

    // Pass 2: Gap Patterns
    for (let i = 1; i < data.length; i++) {
        const c0 = data[i];
        const c1 = data[i-1];
        const currentAtr = atr[i];
        
        // Gap Up (Gap must be at least 0.5 ATR to filter noise)
        if (c0.low > c1.high + currentAtr * 0.5) { 
            const isBreakaway = c0.volume > volMA[i] * 1.5;
            const p = isBreakaway ? PATTERN_DEFS.BreakawayGapUp : PATTERN_DEFS.ExhaustionGapUp;
            activePatterns.push({
                id: isBreakaway ? 'BreakawayGapUp' : 'ExhaustionGapUp',
                name: isBreakaway ? 'Breakaway Gap Up' : 'Exhaustion Gap Up',
                ...p, index: i, time: c0.time, volMult: 1.0, invalidated: false,
                stopLevel: c1.high
            });
        }
        // Gap Down
        if (c0.high < c1.low - currentAtr * 0.5) {
            const isBreakaway = c0.volume > volMA[i] * 1.5;
            const p = isBreakaway ? PATTERN_DEFS.BreakawayGapDown : PATTERN_DEFS.ExhaustionGapDown;
            activePatterns.push({
                id: isBreakaway ? 'BreakawayGapDown' : 'ExhaustionGapDown',
                name: isBreakaway ? 'Breakaway Gap Down' : 'Exhaustion Gap Down',
                ...p, index: i, time: c0.time, volMult: 1.0, invalidated: false,
                stopLevel: c1.low
            });
        }
    }

    // Pass 3: Structural Chart Patterns (ZigZag Pivots)
    const pivotLen = mode === 'positional' ? 10 : mode === 'swing' ? 5 : 3;
    const highs = [];
    const lows = [];
    
    for (let i = pivotLen; i < data.length - pivotLen; i++) {
        let isHigh = true, isLow = true;
        for (let j = 1; j <= pivotLen; j++) {
            if (data[i].high <= data[i - j].high || data[i].high <= data[i + j].high) isHigh = false;
            if (data[i].low >= data[i - j].low || data[i].low >= data[i + j].low) isLow = false;
        }
        if (isHigh) highs.push({ idx: i, val: data[i].high });
        if (isLow) lows.push({ idx: i, val: data[i].low });
    }

    // Double Top
    if (highs.length >= 2) {
        for (let i = 1; i < highs.length; i++) {
            const h1 = highs[i-1];
            const h2 = highs[i];
            if ((h2.idx - h1.idx) > 120) continue; // Safety bound
            
            const currentAtr = atr[h2.idx];
            // Tops must be within 0.5 ATR
            if (Math.abs(h1.val - h2.val) < currentAtr * 0.5 && (h2.idx - h1.idx) > pivotLen) {
                activePatterns.push({
                    id: 'DoubleTop', name: 'Double Top', ...PATTERN_DEFS.DoubleTop, len: (h2.idx - h1.idx) + 1,
                    index: h2.idx, time: data[h2.idx].time, volMult: 1.0, invalidated: false,
                    stopLevel: h2.val + currentAtr * 0.5
                });
            }
        }
    }
    
    // Double Bottom
    if (lows.length >= 2) {
        for (let i = 1; i < lows.length; i++) {
            const l1 = lows[i-1];
            const l2 = lows[i];
            if ((l2.idx - l1.idx) > 120) continue; // Safety bound
            
            const currentAtr = atr[l2.idx];
            if (Math.abs(l1.val - l2.val) < currentAtr * 0.5 && (l2.idx - l1.idx) > pivotLen) {
                activePatterns.push({
                    id: 'DoubleBottom', name: 'Double Bottom', ...PATTERN_DEFS.DoubleBottom, len: (l2.idx - l1.idx) + 1,
                    index: l2.idx, time: data[l2.idx].time, volMult: 1.0, invalidated: false,
                    stopLevel: l2.val - currentAtr * 0.5
                });
            }
        }
    }

    // Triple Top & Head and Shoulders
    if (highs.length >= 3) {
        for (let i = 2; i < highs.length; i++) {
            const h1 = highs[i-2], h2 = highs[i-1], h3 = highs[i];
            if ((h3.idx - h1.idx) > 150) continue; // Safety bound
            
            const currentAtr = atr[h3.idx];
            
            // Triple Top (All 3 peaks within 0.5 ATR)
            if (Math.abs(h1.val - h2.val) < currentAtr * 0.5 && Math.abs(h2.val - h3.val) < currentAtr * 0.5) {
                activePatterns.push({
                    id: 'TripleTop', name: 'Triple Top', ...PATTERN_DEFS.TripleTop, len: (h3.idx - h1.idx) + 1,
                    index: h3.idx, time: data[h3.idx].time, volMult: 1.0, invalidated: false, stopLevel: h3.val + currentAtr * 0.5
                });
            }
            // Head and Shoulders (Head > Shoulders by 1 ATR, Shoulders within 1 ATR of each other)
            else if (h2.val > h1.val + currentAtr && h2.val > h3.val + currentAtr && Math.abs(h1.val - h3.val) < currentAtr) {
                activePatterns.push({
                    id: 'HeadAndShoulders', name: 'Head & Shoulders', ...PATTERN_DEFS.HeadAndShoulders, len: (h3.idx - h1.idx) + 1,
                    index: h3.idx, time: data[h3.idx].time, volMult: 1.0, invalidated: false, stopLevel: h2.val + currentAtr * 0.2
                });
            }
        }
    }
    
    // Triple Bottom & Inverse H&S
    if (lows.length >= 3) {
        for (let i = 2; i < lows.length; i++) {
            const l1 = lows[i-2], l2 = lows[i-1], l3 = lows[i];
            if ((l3.idx - l1.idx) > 150) continue; // Safety bound
            
            const currentAtr = atr[l3.idx];
            
            // Triple Bottom
            if (Math.abs(l1.val - l2.val) < currentAtr * 0.5 && Math.abs(l2.val - l3.val) < currentAtr * 0.5) {
                activePatterns.push({
                    id: 'TripleBottom', name: 'Triple Bottom', ...PATTERN_DEFS.TripleBottom, len: (l3.idx - l1.idx) + 1,
                    index: l3.idx, time: data[l3.idx].time, volMult: 1.0, invalidated: false, stopLevel: l3.val - currentAtr * 0.5
                });
            }
            // Inverse H&S
            else if (l2.val < l1.val - currentAtr && l2.val < l3.val - currentAtr && Math.abs(l1.val - l3.val) < currentAtr) {
                activePatterns.push({
                    id: 'InvHeadAndShoulders', name: 'Inv Head & Shoulders', ...PATTERN_DEFS.InvHeadAndShoulders, len: (l3.idx - l1.idx) + 1,
                    index: l3.idx, time: data[l3.idx].time, volMult: 1.0, invalidated: false, stopLevel: l2.val - currentAtr * 0.2
                });
            }
        }
    }
    
    // Triangles & Wedges (Needs at least 2 highs and 2 lows converging)
    if (highs.length >= 2 && lows.length >= 2) {
        for (let i = 1; i < Math.min(highs.length, lows.length); i++) {
            const h1 = highs[i-1], h2 = highs[i];
            const l1 = lows[i-1], l2 = lows[i];
            
            // Ensure the peaks and troughs are structurally interleaved in the same time neighborhood
            if (Math.abs(h1.idx - l1.idx) > 60 || Math.abs(h2.idx - l2.idx) > 60) continue;
            
            const len = Math.max(h2.idx, l2.idx) - Math.min(h1.idx, l1.idx) + 1;
            if (len > 150) continue; // Safety bounds
            
            const highSlope = (h2.val - h1.val) / (h2.idx - h1.idx);
            const lowSlope = (l2.val - l1.val) / (l2.idx - l1.idx);
            const maxIdx = Math.max(h2.idx, l2.idx);
            const currentAtr = atr[maxIdx];
            const flatThreshold = currentAtr * 0.1; // Less than 10% ATR change per bar is "flat"
            
            if (highSlope < -flatThreshold && lowSlope > flatThreshold) {
                activePatterns.push({
                    id: 'SymmetricalTriangle', name: 'Sym Triangle', ...PATTERN_DEFS.SymmetricalTriangle, len,
                    index: maxIdx, time: data[maxIdx].time, volMult: 1.0, invalidated: false, stopLevel: h2.val
                });
            } else if (Math.abs(highSlope) <= flatThreshold && lowSlope > flatThreshold) { // Ascending
                activePatterns.push({
                    id: 'AscendingTriangle', name: 'Asc Triangle', ...PATTERN_DEFS.AscendingTriangle, len,
                    index: maxIdx, time: data[maxIdx].time, volMult: 1.0, invalidated: false, stopLevel: l2.val
                });
            } else if (highSlope < -flatThreshold && Math.abs(lowSlope) <= flatThreshold) { // Descending
                activePatterns.push({
                    id: 'DescendingTriangle', name: 'Desc Triangle', ...PATTERN_DEFS.DescendingTriangle, len,
                    index: maxIdx, time: data[maxIdx].time, volMult: 1.0, invalidated: false, stopLevel: h2.val
                });
            } else if (highSlope < -flatThreshold && lowSlope < -flatThreshold && highSlope < lowSlope) { // Falling Wedge
                activePatterns.push({
                    id: 'FallingWedge', name: 'Falling Wedge', ...PATTERN_DEFS.FallingWedge, len,
                    index: maxIdx, time: data[maxIdx].time, volMult: 1.0, invalidated: false, stopLevel: l2.val
                });
            } else if (highSlope > flatThreshold && lowSlope > flatThreshold && highSlope < lowSlope) { // Rising Wedge
                activePatterns.push({
                    id: 'RisingWedge', name: 'Rising Wedge', ...PATTERN_DEFS.RisingWedge, len,
                    index: maxIdx, time: data[maxIdx].time, volMult: 1.0, invalidated: false, stopLevel: h2.val
                });
            }
        }
    }

    // Pass 4: Flags & Pennants (Short-term continuation)
    for (let i = 10; i < data.length; i++) {
        const c0 = data[i], c5 = data[i-5], c10 = data[i-10];
        const currentAtr = atr[i];
        
        // Bull Flag/Pennant: strong runup over 5 bars (> 3 ATR), then shallow consolidation
        if (c5.high > c10.low + currentAtr * 3 && c0.close < c5.high && c0.close > c5.low - currentAtr && c0.close > c10.high) {
            if (c0.high < data[i-1].high && c0.low > data[i-1].low) { // Coiling inward
                activePatterns.push({
                    id: 'BullPennant', name: 'Bull Pennant', ...PATTERN_DEFS.BullPennant,
                    index: i, time: c0.time, volMult: 1.0, invalidated: false, stopLevel: c10.high
                });
            } else if (c0.close < data[i-1].close) { // Slanting down
                activePatterns.push({
                    id: 'BullFlag', name: 'Bull Flag', ...PATTERN_DEFS.BullFlag,
                    index: i, time: c0.time, volMult: 1.0, invalidated: false, stopLevel: c10.high
                });
            }
        }
        // Bear Flag/Pennant: strong drop (> 3 ATR), then shallow rally
        if (c5.low < c10.high - currentAtr * 3 && c0.close > c5.low && c0.close < c5.high + currentAtr && c0.close < c10.low) {
            if (c0.high < data[i-1].high && c0.low > data[i-1].low) {
                activePatterns.push({
                    id: 'BearPennant', name: 'Bear Pennant', ...PATTERN_DEFS.BearPennant,
                    index: i, time: c0.time, volMult: 1.0, invalidated: false, stopLevel: c10.low
                });
            } else if (c0.close > data[i-1].close) {
                activePatterns.push({
                    id: 'BearFlag', name: 'Bear Flag', ...PATTERN_DEFS.BearFlag,
                    index: i, time: c0.time, volMult: 1.0, invalidated: false, stopLevel: c10.low
                });
            }
        }
    }

    // Calculate Decay and Invalidation relative to the latest candle
    const currentIndex = data.length - 1;
    if (currentIndex < 0) return { score: "0.0", label: 'Neutral', activePatterns: [] };
    
    let halfLife = 3.5; // Swing default
    if (mode === 'intraday' || mode === 'scalp') halfLife = 9;
    else if (mode === 'positional') halfLife = 14;

    let totalScore = 0;
    const finalActive = [];

    activePatterns.forEach(p => {
        // Age is how many candles ago it formed
        const age = currentIndex - p.index;
        
        // Skip if it's so old it decayed to virtually 0 anyway
        if (age > halfLife * 4) return;

        // Check invalidation retrospectively
        let invalidated = false;
        for (let j = p.index + 1; j <= currentIndex; j++) {
            if (p.dir > 0 && data[j].close < p.stopLevel) invalidated = true;
            if (p.dir < 0 && data[j].close > p.stopLevel) invalidated = true;
            if (invalidated) break;
        }

        if (invalidated) return;

        const decay = Math.exp(-age / halfLife);
        const modeW = mode === 'intraday' || mode === 'scalp' ? p.w.intraday : mode === 'swing' ? p.w.swing : p.w.positional;
        
        // Guarantee 1.25x volume confluence multiplier for all non-gap patterns
        let finalVolMult = p.volMult || 1.0;
        if (!p.id.includes('Gap') && data[p.index] && data[p.index].volume > volMA[p.index] * 1.5) {
            finalVolMult = 1.25;
        }
        
        // Composite contribution
        const contribution = p.base * modeW * decay * finalVolMult;
        
        totalScore += contribution;

        // Add to active display array if it still holds weight
        if (Math.abs(contribution) >= 0.5) {
            finalActive.push({
                ...p,
                age,
                decay: decay.toFixed(2),
                contribution: contribution.toFixed(2)
            });
        }
    });

    // Clip score to [-10, 10]
    totalScore = Math.max(-10, Math.min(10, totalScore));

    // Determine Label
    let label = 'Neutral / Choppy';
    if (totalScore >= 6) label = 'Strong Bullish';
    else if (totalScore >= 2) label = 'Bullish';
    else if (totalScore <= -6) label = 'Strong Bearish';
    else if (totalScore <= -2) label = 'Bearish';

    // Mixed Signals Check
    const hasBull = finalActive.some(p => p.dir > 0 && Math.abs(p.contribution) > 2);
    const hasBear = finalActive.some(p => p.dir < 0 && Math.abs(p.contribution) > 2);
    if (hasBull && hasBear && Math.abs(totalScore) < 3) {
        label = 'Mixed Signals';
    }

    return {
        score: totalScore.toFixed(1),
        label,
        activePatterns: finalActive
    };
};
