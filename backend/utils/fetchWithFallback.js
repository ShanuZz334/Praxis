import { getSourceConfig } from '../config/sourceRegistry.js';
import db from '../config/localDb.js';

/**
 * Executes a fetch function with fallback logic based on the Source Registry tiering.
 * @param {string} instrumentKey - The instrument identifier.
 * @param {string} cardId - The card/field identifier.
 * @param {Function} fetchFn - The async function that performs the actual API fetch.
 * @returns {Promise<{value: any, sourcePipeline: string}>}
 */
export async function fetchWithFallback(instrumentKey, cardId, fetchFn) {
    const config = getSourceConfig(cardId);
    let value = null;
    let sourcePipeline = '';

    try {
        // Attempt primary fetch
        value = await fetchFn();
        
        if (value !== null && value !== undefined) {
            sourcePipeline = config.sourceType === 'official_api' ? 'upstox' : 
                             config.sourceType === 'calculated' ? 'headless' : 
                             'unofficial_scrape';
            return { value, sourcePipeline };
        }
    } catch (error) {
        console.warn(`[Fallback Warning] Fetch failed for ${cardId} (${instrumentKey}):`, error.message);
    }

    // Fallback logic
    console.log(`[Fallback Triggered] Engaging fallback chain for ${cardId}:`, config.fallbackChain);
    
    for (const strategy of config.fallbackChain) {
        if (strategy === 'last_known_good') {
            try {
                const stmt = db.prepare(`
                    SELECT gauge_score as raw_value
                    FROM card_score_history 
                    WHERE instrument_key = ? AND card_name = ?
                    ORDER BY timestamp DESC LIMIT 1
                `);
                const row = stmt.get(instrumentKey, cardId);
                if (row && row.raw_value !== null) {
                    return { value: row.raw_value, sourcePipeline: 'fallback' };
                }
            } catch (dbErr) {
                console.error(`[Fallback Error] last_known_good failed for ${cardId}:`, dbErr.message);
            }
        }
        
        if (strategy === 'manual_override') {
            try {
                // Read from SQLite user_overrides (replaced MongoDB InstrumentOverride)
                const row = db.prepare(`
                    SELECT value FROM user_overrides
                    WHERE instrument_key = ? AND field_key = ?
                    ORDER BY updated_at DESC LIMIT 1
                `).get(instrumentKey, cardId);
                if (row && row.value !== undefined && row.value !== '') {
                    return { value: row.value, sourcePipeline: 'manual' };
                }
            } catch (sqliteErr) {
                console.error(`[Fallback Error] manual_override (SQLite) failed for ${cardId}:`, sqliteErr.message);
            }
        }
    }

    // If all fail, return null
    return { value: null, sourcePipeline: 'missing' };
}
