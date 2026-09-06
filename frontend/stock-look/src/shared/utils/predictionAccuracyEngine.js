/**
 * @file predictionAccuracyEngine.js
 * @purpose Institutional-grade Prediction Accuracy Engine (PAE).
 *
 * Scores each Future Vision ghost candle prediction against incoming real candles
 * using 5 institutional error metrics:
 *   1. DA    — Directional Accuracy
 *   2. MAPE  — Mean Absolute % Error on close price
 *   3. HL    — High-Low Range Error
 *   4. CBias — Systematic Close Bias
 *   5. WIS   — Weighted Interval Score (Bracher et al. 2021)
 *
 * The PAE report is injected as Context Block 6 into the NEXT AI prediction
 * prompt, enabling self-correction over successive calls.
 */

const PAE_STORAGE_KEY = 'praxis_pae_history';
const ALPHA = 0.1; // significance level for WIS

// ─────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────

export function storePrediction(instrumentKey, timeframe, tradingMode, candles, bias, risk, times, modelUsed) {
    const db = _load();
    db[_key(instrumentKey, timeframe)] = {
        instrumentKey, timeframe, tradingMode,
        candles,   // predicted
        bias,
        risk,
        times,
        modelUsed,
        scores: [],
        storedAt: Date.now(),
    };
    _save(db);
}

export function scoreClosedCandle(instrumentKey, timeframe, barIndex, realCandle) {
    const db = _load();
    const session = db[_key(instrumentKey, timeframe)];
    if (!session || !session.candles[barIndex]) return null;

    const pred = session.candles[barIndex];
    const real = realCandle;

    const realDir = Math.sign(real.close - real.open);
    const predDir = Math.sign(pred.close - pred.open);
    const da      = realDir === predDir ? 1 : 0;

    const mapeClose = Math.abs(real.close - pred.close) / Math.max(real.close, 0.001);

    const realRange = real.high - real.low;
    const predRange = pred.high - pred.low;
    const hlError   = realRange > 0 ? Math.abs(realRange - predRange) / realRange : 0;

    const closeBias = pred.close - real.close;

    const intervalWidth = pred.high - pred.low;
    const undershoot    = Math.max(0, pred.low - real.close);
    const overshoot     = Math.max(0, real.close - pred.high);
    const wis = intervalWidth + (2 / ALPHA) * undershoot + (2 / ALPHA) * overshoot;

    const barScore = {
        barIndex,
        da,
        mapeClose: mapeClose * 100,
        hlError:   hlError   * 100,
        closeBias,
        wis,
        realCandle: { open: real.open, high: real.high, low: real.low, close: real.close },
        predCandle: { open: pred.open, high: pred.high, low: pred.low, close: pred.close },
        scoredAt: Date.now(),
    };

    session.scores.push(barScore);
    db[_key(instrumentKey, timeframe)] = session;
    _save(db);
    return barScore;
}

export function getPAEReport(instrumentKey, timeframe) {
    const db = _load();
    const session = db[_key(instrumentKey, timeframe)];
    if (!session || session.scores.length === 0) {
        return 'No prior prediction history — first prediction for this instrument/timeframe.';
    }

    const s = session.scores;
    const n = s.length;
    const daRate   = (s.reduce((a, b) => a + b.da, 0) / n * 100).toFixed(1);
    const mape     = (s.reduce((a, b) => a + b.mapeClose, 0) / n).toFixed(2);
    const hlErr    = (s.reduce((a, b) => a + b.hlError, 0) / n).toFixed(2);
    const avgBias  = (s.reduce((a, b) => a + b.closeBias, 0) / n);
    const avgWIS   = (s.reduce((a, b) => a + b.wis, 0) / n).toFixed(2);
    const biasDir  = avgBias > 0 ? 'overestimated' : avgBias < 0 ? 'underestimated' : 'neutral';
    const biasAmt  = Math.abs(avgBias).toFixed(2);

    let correction = '';
    if (Math.abs(avgBias) > 0.5) {
        correction = `CORRECTION REQUIRED: Your close price predictions systematically ${biasDir} the real close by avg Rs.${biasAmt}. Adjust close predictions ${avgBias > 0 ? 'DOWNWARD' : 'UPWARD'} by ~${biasAmt}.`;
    }
    if (parseFloat(hlErr) > 15) {
        correction += ` Candle body sizes also inaccurate by ${hlErr}% avg — ${parseFloat(mape) > 2 ? 'narrow' : 'widen'} your High-Low range.`;
    }

    return `=== PREVIOUS PREDICTION ACCURACY REPORT (PAE) ===
Bars Scored: ${n}
Directional Accuracy: ${daRate}%
MAPE on Close: ${mape}%
HL Range Error: ${hlErr}%
Systematic Close Bias: ${avgBias > 0 ? '+' : ''}${avgBias.toFixed(2)} (${biasDir})
Weighted Interval Score: ${avgWIS}
Trading Mode: ${session.tradingMode}
${correction ? `\nCORRECTION: ${correction}` : 'No systematic bias detected.'}
===`;
}

export function computeConfidence(predictedCandle, atrValue, instrumentKey, timeframe) {
    const aiConfidence = predictedCandle.confidence ?? 70;
    const predRange    = predictedCandle.high - predictedCandle.low;
    const atr          = atrValue || predRange || 1;
    const rangeRatio   = predRange / atr;
    const entropyPenalty = Math.min(40, Math.max(0, (rangeRatio - 1) * 20));

    const db = _load();
    const session = db[_key(instrumentKey, timeframe)];
    let histWeight = 1.0;
    if (session && session.scores.length >= 3) {
        const daRate = session.scores.reduce((a, b) => a + b.da, 0) / session.scores.length;
        histWeight = 0.5 + daRate;
    }

    return Math.round(Math.max(5, Math.min(99, (aiConfidence - entropyPenalty) * Math.min(histWeight, 1.2))));
}

export function clearPAESession(instrumentKey, timeframe) {
    const db = _load();
    delete db[_key(instrumentKey, timeframe)];
    _save(db);
}

export function getPAESession(instrumentKey, timeframe) {
    const db = _load();
    return db[_key(instrumentKey, timeframe)] || null;
}

// ─────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────

function _key(instrumentKey, timeframe) { return `${instrumentKey}__${timeframe}`; }

function _load() {
    try { return JSON.parse(localStorage.getItem(PAE_STORAGE_KEY) || '{}'); }
    catch { return {}; }
}

function _save(db) {
    try { localStorage.setItem(PAE_STORAGE_KEY, JSON.stringify(db)); }
    catch {
        const keys = Object.keys(db);
        if (keys.length > 0) {
            let oldest = keys.reduce((a, b) => (db[a].storedAt || 0) < (db[b].storedAt || 0) ? a : b);
            delete db[oldest];
            try { localStorage.setItem(PAE_STORAGE_KEY, JSON.stringify(db)); } catch {}
        }
    }
}