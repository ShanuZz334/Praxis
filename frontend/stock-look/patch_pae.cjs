const fs = require('fs');
const path = 'c:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\utils\\predictionAccuracyEngine.js';
let content = fs.readFileSync(path, 'utf8');

// Replace storePrediction, scoreClosedCandle, getPAESession, clearPAESession
content = content.replace(
    /export function storePrediction[\s\S]*?export function computeConfidence/i,
    `export function storePrediction(instrumentKey, timeframe, tradingMode, candles, bias, risk, times, modelUsed) {
    const db = _load();
    const key = _key(instrumentKey, timeframe);
    if (!Array.isArray(db[key])) db[key] = db[key] ? [db[key]] : [];
    
    const session = {
        id: Date.now().toString(),
        instrumentKey, timeframe, tradingMode,
        candles,   // predicted
        bias,
        risk,
        times,
        modelUsed,
        scores: [],
        storedAt: Date.now(),
    };
    db[key].push(session);
    
    // Keep max 10 past predictions per timeframe to avoid local storage bloat
    if (db[key].length > 10) db[key].shift();
    
    _save(db);
    return session;
}

export function getAllPAESessions(instrumentKey, timeframe) {
    const db = _load();
    const arr = db[_key(instrumentKey, timeframe)];
    return Array.isArray(arr) ? arr : (arr ? [arr] : []);
}

export function scoreClosedCandle(instrumentKey, timeframe, barIndex, realCandle, sessionId) {
    const db = _load();
    const arr = db[_key(instrumentKey, timeframe)];
    if (!Array.isArray(arr)) return null;
    
    const session = arr.find(s => s.id === sessionId) || arr[arr.length - 1]; // fallback to latest
    if (!session || !session.candles[barIndex]) return null;

    const pred = session.candles[barIndex];
    const real = realCandle;

    const realDir = Math.sign(real.close - real.open);
    const predDir = Math.sign(pred.close - pred.open);
    const da      = realDir === predDir ? 1 : 0;

    const mape = Math.abs((pred.close - real.close) / real.close);
    const predRange = pred.high - pred.low;
    const realRange = real.high - real.low;
    const hlError = Math.abs(predRange - realRange) / (realRange || 1);
    const cBias = pred.close - real.close;
    
    const inRange = (real.close >= pred.low && real.close <= pred.high) ? 1 : 0;
    const intervalScore = (pred.high - pred.low) + 
        (2 / ALPHA) * (pred.low - real.close) * (real.close < pred.low ? 1 : 0) +
        (2 / ALPHA) * (real.close - pred.high) * (real.close > pred.high ? 1 : 0);

    const s = { da, mape, hlError, cBias, inRange, is: intervalScore, realClose: real.close };
    session.scores[barIndex] = s;

    _save(db);
    return s;
}

export function getPAESession(instrumentKey, timeframe, sessionId) {
    const db = _load();
    const arr = db[_key(instrumentKey, timeframe)];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return sessionId ? arr.find(s => s.id === sessionId) : arr[arr.length - 1];
}

export function clearPAESession(instrumentKey, timeframe) {
    // Only used to clear active state, we don't actually delete from history anymore
    // (We want them permanently stored)
}

export function deletePAESession(instrumentKey, timeframe, sessionId) {
    const db = _load();
    const key = _key(instrumentKey, timeframe);
    const arr = db[key];
    if (Array.isArray(arr)) {
        db[key] = arr.filter(s => s.id !== sessionId);
        _save(db);
    }
}

export function computeConfidence`
);

fs.writeFileSync(path, content);
