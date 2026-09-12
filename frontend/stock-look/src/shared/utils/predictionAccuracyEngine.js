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
    const key = _key(instrumentKey, timeframe);
    let arr = db[key];
    if (!Array.isArray(arr)) {
        arr = arr ? [arr] : [];
        db[key] = arr;
    }
    
    const session = {
        id: Date.now().toString(),
        instrumentKey, timeframe, tradingMode,
        candles,
        bias,
        risk,
        times,
        modelUsed,
        scores: [],
        storedAt: Date.now(),
    };
    
    arr.push(session);
    // 90-day retention policy (auto-delete older predictions)
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    arr = arr.filter(s => (now - s.storedAt) < NINETY_DAYS);
    db[key] = arr;
    
    _save(db);
    return session;
}

export function getAllPAESessions(instrumentKey, timeframe) {
    const db = _load();
    const arr = db[_key(instrumentKey, timeframe)];
    const sessions = Array.isArray(arr) ? arr : (arr ? [arr] : []);
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return sessions.filter(s => {
        const t = s.storedAt || Number(s.id) || 0;
        return (now - t) < NINETY_DAYS;
    });
}

export function scoreClosedCandle(instrumentKey, timeframe, barIndex, realCandle) {
    const db = _load();
    const key = _key(instrumentKey, timeframe);
    let arr = db[key];
    if (!Array.isArray(arr)) return null;
    const session = arr[arr.length - 1];
    if (!session || !session.candles[barIndex] || session.candles[barIndex].deleted) return null;

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

    // Institutional composite accuracy score (0-100)
    // 1. Directional alignment (weight: 40%)
    // 2. Close price proximity to predicted close relative to the predicted volatility range (weight: 60%)
    const range = Math.max(pred.high - pred.low, real.high - real.low, 0.01);
    const closeError = Math.abs(real.close - pred.close);
    // If close error is 0, precision is 60. If close error is equal to the full range, precision is 0.
    const precisionScore = Math.max(0, 60 - (closeError / range) * 60);
    const compositeScore = (da === 1 ? 40 : 0) + precisionScore;

    const barScore = {
        barIndex,
        da,
        mapeClose: mapeClose * 100,
        hlError:   hlError   * 100,
        closeBias,
        wis,
        compositeScore,
        realCandle: { open: real.open, high: real.high, low: real.low, close: real.close },
        predCandle: { open: pred.open, high: pred.high, low: pred.low, close: pred.close },
        scoredAt: Date.now(),
    };

    session.scores.push(barScore);
    session.candles[barIndex].score = barScore; // Mark it scored!
    arr[arr.length - 1] = session;
    db[key] = arr;
    _save(db);
    return barScore;
}

/**
 * storeLiveErrors — Persists the live in-progress per-candle MAPE into the active session.
 * Called on every real market tick so the next auto-generation can read accurate error context.
 * @param {string} instrumentKey
 * @param {string} timeframe
 * @param {number} barIndex      - which predicted candle is forming right now
 * @param {number} mape          - current MAPE % for that bar
 * @param {object} liveCandle    - the live candle tick
 * @param {object} predictedCandle - the ghost candle prediction at that bar
 */
export function storeLiveErrors(instrumentKey, timeframe, barIndex, mape, liveCandle, predictedCandle) {
    const db = _load();
    const key = _key(instrumentKey, timeframe);
    let arr = db[key];
    if (!Array.isArray(arr) || arr.length === 0) return;
    const session = arr[arr.length - 1];
    if (!session) return;

    if (!session.liveErrors) session.liveErrors = [];

    // Overwrite existing entry for this bar so we only keep latest tick
    const existingIdx = session.liveErrors.findIndex(e => e.barIndex === barIndex);
    const entry = {
        barIndex,
        mape: parseFloat(mape.toFixed(3)),
        closeDrift: parseFloat((liveCandle.close - predictedCandle.close).toFixed(2)),
        directionMatch: Math.sign(liveCandle.close - liveCandle.open) === Math.sign(predictedCandle.close - predictedCandle.open),
        updatedAt: Date.now()
    };

    if (existingIdx >= 0) {
        session.liveErrors[existingIdx] = entry;
    } else {
        session.liveErrors.push(entry);
    }

    db[key] = arr;
    _save(db);
}

export function getPAEReport(instrumentKey, timeframe) {
    const db = _load();
    const key = _key(instrumentKey, timeframe);
    let arr = db[key];
    const session = Array.isArray(arr) ? arr[arr.length - 1] : arr;
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

    // Build live errors section (in-progress candles being tracked in real-time)
    let liveErrorsBlock = '';
    if (session.liveErrors && session.liveErrors.length > 0) {
        const sorted = [...session.liveErrors].sort((a, b) => a.barIndex - b.barIndex);
        const liveLines = sorted.map(e => {
            const dirStr = e.directionMatch ? '✓ MATCH' : '✗ MISMATCH';
            const driftStr = e.closeDrift >= 0 ? `+₹${e.closeDrift}` : `-₹${Math.abs(e.closeDrift)}`;
            return `  Bar ${e.barIndex + 1}: MAPE=${e.mape.toFixed(2)}% | Close Drift=${driftStr} | Direction=${dirStr}`;
        }).join('\n');
        liveErrorsBlock = `\n\nLIVE IN-PROGRESS CANDLE ERRORS (use these for immediate self-correction):\n${liveLines}\nINSTRUCTION: The live errors above show where your LAST prediction is currently drifting from reality RIGHT NOW. When generating the NEXT set, self-correct by adjusting close prices in the OPPOSITE direction of the drift shown above.`;
    }

    return `=== PREVIOUS PREDICTION ACCURACY REPORT (PAE) ===
Bars Scored: ${n}
Directional Accuracy: ${daRate}%
MAPE on Close: ${mape}%
HL Range Error: ${hlErr}%
Systematic Close Bias: ${avgBias > 0 ? '+' : ''}${avgBias.toFixed(2)} (${biasDir})
Weighted Interval Score: ${avgWIS}
Trading Mode: ${session.tradingMode}
${correction ? `\nCORRECTION: ${correction}` : 'No systematic bias detected.'}${liveErrorsBlock}
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

/**
 * Normalizes any timestamp representation (number, string, or { year, month, day } BusinessDay object)
 * into a canonical, comparable string key.
 */
export function normalizeTimeKey(t) {
    if (!t) return '';
    if (typeof t === 'number') return String(t < 10000000000 ? t * 1000 : t);
    if (typeof t === 'string') return t.split('T')[0];
    if (t && typeof t === 'object' && t.year) {
        const m = String(t.month).padStart(2, '0');
        const d = String(t.day).padStart(2, '0');
        return `${t.year}-${m}-${d}`;
    }
    return String(t);
}

/**
 * Builds a continuous, non-overlapping 3-month timeline of all undeleted predicted candles.
 * 
 * - Strictly ignores deleted candles.
 * - Resolves overlapping timestamps by prioritizing the fresher session.
 * - Sorts chronologically across all formats (intraday seconds/ms, strings, BusinessDay objects).
 */
export function buildContinuousTimeline(allSessions) {
    if (!allSessions || !Array.isArray(allSessions) || allSessions.length === 0) {
        return { candles: [], times: [] };
    }

    const candleMap = new Map();

    for (const session of allSessions) {
        if (!session.candles || !session.times) continue;
        const len = Math.min(session.candles.length, session.times.length);

        for (let i = 0; i < len; i++) {
            const c = session.candles[i];
            const t = session.times[i];

            // Strictly filter out deleted or invalid candles
            if (!c || !t || c.deleted) continue;

            const key = normalizeTimeKey(t);
            // More recent session takes precedence for overlapping timestamps
            candleMap.set(key, { candle: c, time: t });
        }
    }

    const getSortMs = (t) => {
        if (!t) return 0;
        if (typeof t === 'number') return t < 10000000000 ? t * 1000 : t;
        if (typeof t === 'string') return new Date(t).getTime();
        if (t && typeof t === 'object' && t.year) return new Date(t.year, t.month - 1, t.day).getTime();
        return 0;
    };

    const sortedEntries = Array.from(candleMap.values()).sort((a, b) => getSortMs(a.time) - getSortMs(b.time));
    return {
        candles: sortedEntries.map(e => e.candle),
        times: sortedEntries.map(e => e.time)
    };
}

export function clearPAESession(instrumentKey, timeframe) {
    const db = _load();
    const k = _key(instrumentKey, timeframe);
    if (db[k]) {
        // Purge ALL sessions for this instrument/timeframe to ensure permanent deletion
        delete db[k];
        _save(db);
    }
}

export function deletePAECandleByTime(instrumentKey, timeframe, targetTime) {
    const db = _load();
    const k = _key(instrumentKey, timeframe);
    if (!db[k]) return;
    
    let arr = Array.isArray(db[k]) ? db[k] : [db[k]];
    let modified = false;
    const targetKey = normalizeTimeKey(targetTime);
    
    for (let s = 0; s < arr.length; s++) {
        const session = arr[s];
        if (!session.times || !session.candles) continue;
        
        for (let i = session.times.length - 1; i >= 0; i--) {
            const st = session.times[i];
            if (normalizeTimeKey(st) === targetKey) {
                // Permanently remove the candle and timestamp from the session
                session.candles.splice(i, 1);
                session.times.splice(i, 1);
                if (session.scores && Array.isArray(session.scores)) {
                    session.scores = session.scores.filter(sc => sc.barIndex !== i);
                }
                if (session.liveErrors && Array.isArray(session.liveErrors)) {
                    session.liveErrors = session.liveErrors.filter(le => le.barIndex !== i);
                }
                modified = true;
            }
        }
    }
    
    // Filter out completely empty sessions
    arr = arr.filter(s => s.candles && s.candles.length > 0 && s.candles.some(c => !c.deleted));
    
    if (arr.length === 0) {
        delete db[k];
    } else {
        db[k] = arr;
    }
    
    if (modified) _save(db);
}

export function deletePAESessionByTime(instrumentKey, timeframe, targetTime) {
    const db = _load();
    const k = _key(instrumentKey, timeframe);
    if (!db[k]) return;
    
    let arr = Array.isArray(db[k]) ? db[k] : [db[k]];
    let modified = false;
    const targetKey = normalizeTimeKey(targetTime);
    
    for (let s = arr.length - 1; s >= 0; s--) {
        const session = arr[s];
        if (!session.times || !session.candles) continue;
        
        const hasTime = session.times.some(st => normalizeTimeKey(st) === targetKey);
        if (hasTime) {
            arr.splice(s, 1);
            modified = true;
            break;
        }
    }
    
    if (arr.length === 0) {
        delete db[k];
    } else {
        db[k] = arr;
    }
    
    if (modified) _save(db);
}

export function updatePAEAutoMode(instrumentKey, timeframe, autoMode) {
    const db = _load();
    const k = _key(instrumentKey, timeframe);
    if (db[k]) {
        if (Array.isArray(db[k]) && db[k].length > 0) {
            db[k][db[k].length - 1].autoMode = autoMode;
        } else if (!Array.isArray(db[k])) {
            db[k].autoMode = autoMode;
        }
        _save(db);
    }
}

export function getPAESession(instrumentKey, timeframe) {
    const db = _load();
    const arr = db[_key(instrumentKey, timeframe)];
    return Array.isArray(arr) ? arr[arr.length - 1] : arr;
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
    try { 
        localStorage.setItem(PAE_STORAGE_KEY, JSON.stringify(db)); 
    } catch (e) {
        // Safe session-level pruning: remove oldest individual session instead of wiping whole symbols
        console.warn('PAE Storage Quota Exceeded. Pruning oldest individual session...');
        try {
            let oldestSessionTime = Infinity;
            let targetKey = null;
            let targetIdx = -1;

            for (const [k, sessions] of Object.entries(db)) {
                if (Array.isArray(sessions)) {
                    sessions.forEach((s, idx) => {
                        const t = s.storedAt || Number(s.id) || 0;
                        if (t < oldestSessionTime) {
                            oldestSessionTime = t;
                            targetKey = k;
                            targetIdx = idx;
                        }
                    });
                }
            }

            if (targetKey && targetIdx >= 0) {
                db[targetKey].splice(targetIdx, 1);
                if (db[targetKey].length === 0) delete db[targetKey];
                localStorage.setItem(PAE_STORAGE_KEY, JSON.stringify(db));
            }
        } catch (innerErr) {
            console.error('Failed to prune PAE storage:', innerErr);
        }
    }
}