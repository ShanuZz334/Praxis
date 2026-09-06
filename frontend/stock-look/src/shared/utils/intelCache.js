/**
 * @file intelCache.js
 * @purpose L1 localStorage cache for Praxis module composite scores.
 * 
 * Storage hierarchy:
 *   L1: localStorage (instant, zero-network, survives page refresh)
 *   L2: SQLite via header_data (durable, survives localStorage wipe)
 *   L3: Live engine computation (freshest, overrides everything)
 *
 * Keys: praxis_intel_<module>_<instrumentKey>
 * Modules: 'tech', 'fund', 'opt', 'glob', 'evt'
 * Special instrumentKey: 'GLOBAL' for glob and evt modules
 */

const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Save a module's composite score to localStorage.
 * @param {'tech'|'fund'|'opt'|'glob'|'evt'} module
 * @param {string} instrumentKey
 * @param {number|null} score
 * @param {string|null} regime
 * @param {'live'|'backend'|'socket'} source
 */
export function saveIntelScore(module, instrumentKey, score, regime = null, source = 'live') {
    if (score === null || score === undefined || isNaN(score)) return;
    try {
        const key = `praxis_intel_${module}_${instrumentKey}`;
        localStorage.setItem(key, JSON.stringify({
            score: Number(score),
            regime: regime || null,
            source,
            updatedAt: Date.now()
        }));
    } catch (e) {
        // localStorage full or blocked — silently skip
    }
}

/**
 * Load a module's composite score from localStorage.
 * Returns null if not found. Returns object with `stale: true` if older than threshold.
 * @param {'tech'|'fund'|'opt'|'glob'|'evt'} module
 * @param {string} instrumentKey
 * @returns {{ score: number, regime: string|null, source: string, updatedAt: number, stale: boolean }|null}
 */
export function loadIntelScore(module, instrumentKey) {
    try {
        const key = `praxis_intel_${module}_${instrumentKey}`;
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.score === undefined) return null;
        const stale = Date.now() - parsed.updatedAt > STALE_THRESHOLD_MS;
        return { ...parsed, stale };
    } catch {
        return null;
    }
}

/**
 * Clear a module's cached score (e.g. when instrument changes).
 */
export function clearIntelScore(module, instrumentKey) {
    try {
        localStorage.removeItem(`praxis_intel_${module}_${instrumentKey}`);
    } catch {
        // ignore
    }
}

/**
 * Load ALL 5 module scores for a given instrument at once.
 * Used to pre-populate state on Master Dashboard mount.
 */
export function loadAllIntelScores(instrumentKey) {
    return {
        fundamental: loadIntelScore('fund', instrumentKey),
        technical:   loadIntelScore('tech', instrumentKey),
        options:     loadIntelScore('opt',  instrumentKey),
        global:      loadIntelScore('glob', 'GLOBAL'),
        events:      loadIntelScore('evt',  'GLOBAL'),
    };
}

/**
 * Save all 5 module scores in one call (from socket intelligence:snapshot payload).
 */
export function saveAllIntelScores(instrumentKey, payload) {
    if (payload.technical)   saveIntelScore('tech', instrumentKey, payload.technical.composite_score,   payload.technical.regime,   'socket');
    if (payload.fundamental) saveIntelScore('fund', instrumentKey, payload.fundamental.composite_score, payload.fundamental.regime, 'socket');
    if (payload.options)     saveIntelScore('opt',  instrumentKey, payload.options.composite_score,     null,                       'socket');
    if (payload.global)      saveIntelScore('glob', 'GLOBAL',      payload.global.composite_score,      null,                       'socket');
    if (payload.events)      saveIntelScore('evt',  'GLOBAL',      payload.events.composite_score,      null,                       'socket');
}
