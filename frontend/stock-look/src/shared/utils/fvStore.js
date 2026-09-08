/**
 * @file fvStore.js
 * @purpose Persist Future Vision ghost candle state to localStorage so it
 *   survives page refresh without requiring a fresh AI call.
 */

const STORE_KEY = 'praxis_fv_store';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function _key(instrumentKey, timeframe) {
    return `${instrumentKey}::${timeframe}`;
}

function _load() {
    try {
        return JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    } catch {
        return {};
    }
}

function _save(db) {
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(db));
    } catch {}
}

export function saveFVState(instrumentKey, timeframe, state) {
    const db = _load();
    db[_key(instrumentKey, timeframe)] = { ...state, storedAt: Date.now() };
    _save(db);
}

export function loadFVState(instrumentKey, timeframe) {
    const db = _load();
    const entry = db[_key(instrumentKey, timeframe)];
    if (!entry) return null;
    if (Date.now() - (entry.storedAt || 0) > MAX_AGE_MS) {
        delete db[_key(instrumentKey, timeframe)];
        _save(db);
        return null;
    }
    return entry;
}

export function patchFVState(instrumentKey, timeframe, patch) {
    const db = _load();
    const key = _key(instrumentKey, timeframe);
    if (!db[key]) return;
    db[key] = { ...db[key], ...patch };
    _save(db);
}

export function clearFVState(instrumentKey, timeframe) {
    const db = _load();
    delete db[_key(instrumentKey, timeframe)];
    _save(db);
}

export function getFVMode() {
    try {
        return localStorage.getItem('praxis_fv_mode') || 'manual';
    } catch {
        return 'manual';
    }
}

export function setFVMode(mode) {
    try {
        localStorage.setItem('praxis_fv_mode', mode);
    } catch {}
}
