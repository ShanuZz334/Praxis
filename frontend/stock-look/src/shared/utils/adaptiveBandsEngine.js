/**
 * @file adaptiveBandsEngine.js
 * @purpose Institutional-grade Adaptive Bands — 3 separate calculation engines
 *          tied to SCALP / SWING / POSITIONAL trade modes.
 *
 *  SCALP      → Bollinger Bands   — Statistical mean reversion (Bessel-corrected σ)
 *  SWING      → Keltner Channels  — ATR-adaptive volatility (proper EMA seed + Wilder RMA)
 *  POSITIONAL → Donchian Channels — Dual-channel trend following (Turtle System)
 *
 * Each function returns: { outer: { upper, lower }, middle, inner: { upper, lower } | null, label }
 * where every element is a lightweight-charts compatible { time, value }[] array.
 */

/* ─── SCALP: Bollinger Bands with Bessel's correction ──────────────────── */
/**
 * @param {Object[]} data  — OHLCV candles
 * @param {number}   period     — lookback (default 20)
 * @param {number}   multiplier — σ multiplier (default 2.0)
 *
 * Formula:
 *   SMA  = mean(Close, period)
 *   σₛ   = √[ Σ(Cᵢ − SMA)² / (n−1) ]   ← sample std dev, Bessel's correction
 *   Upper = SMA + multiplier × σₛ
 *   Lower = SMA − multiplier × σₛ
 *
 * Derived (returned as extra arrays for overlay display):
 *   %B        = (Close − Lower) / (Upper − Lower)   → 0=at lower, 1=at upper
 *   Bandwidth = (Upper − Lower) / SMA × 100          → squeeze detector
 */
export function calculateScalpBands(data, period = 20, multiplier = 2.0) {
    if (!data || data.length < period) {
        return { outer: { upper: [], lower: [] }, middle: [], inner: null, label: `BB(${period},${multiplier}σ)` };
    }

    const outerUpper = [], outerLower = [], middle = [];

    for (let i = period - 1; i < data.length; i++) {
        // SMA
        let sum = 0;
        for (let j = 0; j < period; j++) sum += data[i - j].close;
        const sma = sum / period;

        // Sample std dev (Bessel's correction: n-1 denominator)
        let sq = 0;
        for (let j = 0; j < period; j++) sq += Math.pow(data[i - j].close - sma, 2);
        const stdDev = Math.sqrt(sq / (period - 1));

        const time = data[i].time;
        middle.push({ time, value: sma });
        outerUpper.push({ time, value: sma + multiplier * stdDev });
        outerLower.push({ time, value: sma - multiplier * stdDev });
    }

    return {
        outer: { upper: outerUpper, lower: outerLower },
        middle,
        inner: null,   // BB has no inner channel
        label: `BB(${period},${multiplier}σ)`,
    };
}

/* ─── SWING: Keltner Channels — proper EMA seed + Wilder RMA ATR ───────── */
/**
 * @param {Object[]} data
 * @param {number}   emaPeriod  — EMA period (default 20)
 * @param {number}   atrPeriod  — ATR period (default 14)
 * @param {number}   outerMult  — outer band ATR multiplier (default 2.0)
 * @param {number}   innerMult  — inner band ATR multiplier (default 1.0)
 *
 * Formula:
 *   EMA₂₀  = seeded from SMA of first emaPeriod bars, then recursive EMA
 *   ATR₁₄  = Wilder RMA:  seed = SMA(TR, 14);  RMAᵢ = (RMAᵢ₋₁×13 + TRᵢ) / 14
 *   Outer Upper = EMA + outerMult × ATR
 *   Outer Lower = EMA − outerMult × ATR
 *   Inner Upper = EMA + innerMult × ATR   ← squeeze zone boundary
 *   Inner Lower = EMA − innerMult × ATR
 *
 * Squeeze signal: Bollinger Bands (σ-based) inside Keltner → momentum coiling
 */
export function calculateSwingBands(data, emaPeriod = 20, atrPeriod = 14, outerMult = 2.0, innerMult = 1.0) {
    const minLen = Math.max(emaPeriod, atrPeriod) + 1;
    if (!data || data.length < minLen) {
        return {
            outer: { upper: [], lower: [] }, middle: [],
            inner: { upper: [], lower: [] },
            label: `KC(${emaPeriod},${atrPeriod},${outerMult}x${innerMult}xATR)`
        };
    }

    // Step 1: True Range for each bar
    const tr = [data[0].high - data[0].low];
    for (let i = 1; i < data.length; i++) {
        tr.push(Math.max(
            data[i].high - data[i].low,
            Math.abs(data[i].high - data[i - 1].close),
            Math.abs(data[i].low  - data[i - 1].close)
        ));
    }

    // Step 2: ATR via Wilder's RMA — seed = SMA of first atrPeriod TRs
    let atrSeed = 0;
    for (let i = 0; i < atrPeriod; i++) atrSeed += tr[i];
    atrSeed /= atrPeriod;

    const atrArr = new Array(atrPeriod).fill(null);
    atrArr.push(atrSeed);
    for (let i = atrPeriod + 1; i < data.length; i++) {
        atrArr.push((atrArr[atrArr.length - 1] * (atrPeriod - 1) + tr[i]) / atrPeriod);
    }

    // Step 3: EMA — seed = SMA of first emaPeriod closes, then recursive
    let emaSeed = 0;
    for (let i = 0; i < emaPeriod; i++) emaSeed += data[i].close;
    emaSeed /= emaPeriod;

    const k = 2 / (emaPeriod + 1);
    const emaArr = new Array(emaPeriod - 1).fill(null);
    let ema = emaSeed;
    emaArr.push(ema);
    for (let i = emaPeriod; i < data.length; i++) {
        ema = (data[i].close - ema) * k + ema;
        emaArr.push(ema);
    }

    // Step 4: Combine from the first bar where both ATR and EMA are valid
    const startIdx = Math.max(emaPeriod, atrPeriod);
    const outerUpper = [], outerLower = [], middle = [], innerUpper = [], innerLower = [];

    for (let i = startIdx; i < data.length; i++) {
        if (atrArr[i] == null || emaArr[i] == null) continue;
        const time = data[i].time;
        const e = emaArr[i];
        const a = atrArr[i];
        middle.push({ time, value: e });
        outerUpper.push({ time, value: e + outerMult * a });
        outerLower.push({ time, value: e - outerMult * a });
        innerUpper.push({ time, value: e + innerMult * a });
        innerLower.push({ time, value: e - innerMult * a });
    }

    return {
        outer: { upper: outerUpper, lower: outerLower },
        middle,
        inner: { upper: innerUpper, lower: innerLower },
        label: `KC(${emaPeriod},${atrPeriod},${outerMult}x${innerMult}xATR)`,
    };
}

/* ─── POSITIONAL: Donchian Dual Channel (Turtle Trading System) ─────────── */
/**
 * @param {Object[]} data
 * @param {number}   outerPeriod — breakout signal lookback (default 50)
 * @param {number}   innerPeriod — entry trigger lookback  (default 20)
 *
 * Formula (Turtle Trading System 1 & 2):
 *   Outer 50-bar:
 *     Upper₅₀ = max(High[i−49 .. i])  → long breakout signal
 *     Lower₅₀ = min(Low [i−49 .. i])  → short breakout signal
 *     Mid₅₀   = (Upper₅₀ + Lower₅₀) / 2  → exit trigger
 *
 *   Inner 20-bar (System 1 entry):
 *     Upper₂₀ = max(High[i−19 .. i])  → early entry trigger
 *     Lower₂₀ = min(Low [i−19 .. i])
 *
 * Both channels include current bar (inclusive — correct breakout semantics).
 */
export function calculatePositionalBands(data, outerPeriod = 50, innerPeriod = 20) {
    if (!data || data.length < outerPeriod) {
        return {
            outer: { upper: [], lower: [] }, middle: [],
            inner: { upper: [], lower: [] },
            label: `DC(${outerPeriod}+${innerPeriod})`
        };
    }

    const outerUpper = [], outerLower = [], middle = [];
    const innerUpper = [], innerLower = [];

    for (let i = outerPeriod - 1; i < data.length; i++) {
        // Outer 50-bar channel (inclusive of current bar)
        let h50 = -Infinity, l50 = Infinity;
        for (let j = 0; j < outerPeriod; j++) {
            if (data[i - j].high > h50) h50 = data[i - j].high;
            if (data[i - j].low  < l50) l50 = data[i - j].low;
        }
        const time = data[i].time;
        outerUpper.push({ time, value: h50 });
        outerLower.push({ time, value: l50 });
        middle.push({ time, value: (h50 + l50) / 2 });

        // Inner 20-bar channel (entry trigger — always available since i >= outerPeriod > innerPeriod)
        let h20 = -Infinity, l20 = Infinity;
        for (let j = 0; j < innerPeriod; j++) {
            if (data[i - j].high > h20) h20 = data[i - j].high;
            if (data[i - j].low  < l20) l20 = data[i - j].low;
        }
        innerUpper.push({ time, value: h20 });
        innerLower.push({ time, value: l20 });
    }

    return {
        outer: { upper: outerUpper, lower: outerLower },
        middle,
        inner: { upper: innerUpper, lower: innerLower },
        label: `DC(${outerPeriod}+${innerPeriod})`,
    };
}

/* ─── Unified dispatcher ────────────────────────────────────────────────── */
/**
 * @param {Object[]} data
 * @param {'scalp'|'swing'|'positional'} mode
 */
export function computeAdaptiveBands(data, mode = 'swing') {
    switch (mode) {
        case 'scalp':      return calculateScalpBands(data);
        case 'positional': return calculatePositionalBands(data);
        case 'swing':
        default:           return calculateSwingBands(data);
    }
}
