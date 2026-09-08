const fs = require('fs');
const path = 'c:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\utils\\predictionAccuracyEngine.js';
let content = fs.readFileSync(path, 'utf8');

// We will do precise replacements to avoid destroying the file.

content = content.replace(
    /export function storePrediction[\s\S]*?_save\(db\);\s*\}/,
    `export function storePrediction(instrumentKey, timeframe, tradingMode, candles, bias, risk, times, modelUsed) {
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
    if (arr.length > 10) arr.shift();
    _save(db);
    return session;
}

export function getAllPAESessions(instrumentKey, timeframe) {
    const db = _load();
    const arr = db[_key(instrumentKey, timeframe)];
    return Array.isArray(arr) ? arr : (arr ? [arr] : []);
}`
);

content = content.replace(
    /export function scoreClosedCandle\(instrumentKey, timeframe, barIndex, realCandle\) \{[\s\S]*?const session = db\[_key\(instrumentKey, timeframe\)\];/i,
    `export function scoreClosedCandle(instrumentKey, timeframe, barIndex, realCandle) {
    const db = _load();
    const key = _key(instrumentKey, timeframe);
    let arr = db[key];
    if (!Array.isArray(arr)) return null;
    const session = arr[arr.length - 1];`
);

content = content.replace(
    /export function getPAEReport\(instrumentKey, timeframe\) \{[\s\S]*?const session = db\[_key\(instrumentKey, timeframe\)\];/i,
    `export function getPAEReport(instrumentKey, timeframe) {
    const db = _load();
    const key = _key(instrumentKey, timeframe);
    let arr = db[key];
    const session = Array.isArray(arr) ? arr[arr.length - 1] : arr;`
);

content = content.replace(
    /export function clearPAESession\(instrumentKey, timeframe\) \{[\s\S]*?_save\(db\);\s*\}/i,
    `export function clearPAESession(instrumentKey, timeframe) {
    // We intentionally do not delete from DB anymore to preserve history
}`
);

content = content.replace(
    /export function getPAESession\(instrumentKey, timeframe\) \{[\s\S]*?return db\[_key\(instrumentKey, timeframe\)\] \|\| null;\s*\}/i,
    `export function getPAESession(instrumentKey, timeframe) {
    const db = _load();
    const arr = db[_key(instrumentKey, timeframe)];
    return Array.isArray(arr) ? arr[arr.length - 1] : arr;
}`
);

fs.writeFileSync(path, content);
