import { getSourceConfig } from '../config/sourceRegistry.js';
import db from '../config/localDb.js';
import InstrumentOverride from '../models/InstrumentOverride.js';

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
                // Try to get the latest snapshot from SQLite card_score_history or ai_card_store
                const stmt = db.prepare(`
                    SELECT gauge_score as raw_value
                    FROM card_score_history 
                    WHERE instrument_key = ? AND card_name = ?
                    ORDER BY timestamp DESC LIMIT 1
                `);
                
                // Note: card_name in db needs to match cardId mapping
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
                // Read from MongoDB InstrumentOverride
                const override = await InstrumentOverride.findOne({ instrumentKey });
                if (override && override.overrides && override.overrides[cardId] !== undefined) {
                    return { value: override.overrides[cardId], sourcePipeline: 'manual' };
                }
            } catch (mongoErr) {
                console.error(`[Fallback Error] manual_override failed for ${cardId}:`, mongoErr.message);
            }
        }
    }

    // If all fail, return null
    return { value: null, sourcePipeline: 'missing' };
}
