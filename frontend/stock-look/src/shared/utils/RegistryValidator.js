import { CARD_REGISTRY } from '../config/cardRegistry';

/**
 * Validates the Live Registry against the Master CARD_REGISTRY definitions.
 * Read-only, no side effects.
 * 
 * @param {Object} liveRegistry - The full snapshot from DataRegistryContext (e.g., getMasterSnapshot())
 * @param {boolean} isIndex - Whether the current instrument is an index (true) or equity (false)
 */
export function validateRegistry(liveRegistry, isIndex) {
    const currentInstrumentType = isIndex ? 'indices' : 'company';
    
    const missing = [];
    const duplicates = [];
    const invalid = []; // Will hold wrong appliesTo, wrong category, and unknown IDs

    const liveKeys = new Set();
    const idToPages = {};

    // 1. Analyze live registry
    for (const [pageId, cards] of Object.entries(liveRegistry || {})) {
        for (const [cardId, data] of Object.entries(cards || {})) {
            liveKeys.add(cardId);
            
            if (!idToPages[cardId]) idToPages[cardId] = [];
            idToPages[cardId].push(pageId);

            const def = CARD_REGISTRY[cardId];
            
            // Check Unknown
            if (!def) {
                invalid.push({ id: cardId, reason: 'Unknown ID (Not in CARD_REGISTRY)' });
                continue;
            }

            // Check Wrong Category
            // Allow 'master' as a valid fallback cache page, but otherwise page must match
            if (def.page && pageId.toLowerCase() !== 'master' && pageId.toLowerCase() !== def.page.toLowerCase()) {
                invalid.push({ 
                    id: cardId, 
                    reason: `Wrong category. Expected '${def.page.toLowerCase()}', found in '${pageId}'` 
                });
            }

            // Check Wrong appliesTo
            if (def.appliesTo && def.appliesTo !== 'both' && def.appliesTo !== 'n/a') {
                if (currentInstrumentType === 'indices' && def.appliesTo === 'company') {
                    invalid.push({ id: cardId, reason: `Wrong appliesTo. Card is for 'company' but current is 'indices'` });
                }
                if (currentInstrumentType === 'company' && def.appliesTo === 'indices') {
                    invalid.push({ id: cardId, reason: `Wrong appliesTo. Card is for 'indices' but current is 'company'` });
                }
            }
        }
    }

    // Check Duplicates (appears in multiple pages)
    for (const [cardId, pages] of Object.entries(idToPages)) {
        if (pages.length > 1) {
            duplicates.push({ id: cardId, pages });
        }
    }

    // 2. Check Missing IDs
    let expectedCount = 0;
    Object.values(CARD_REGISTRY).forEach(def => {
        let applies = true;
        if (currentInstrumentType === 'indices' && def.appliesTo === 'company') applies = false;
        if (currentInstrumentType === 'company' && def.appliesTo === 'indices') applies = false;

        if (applies) {
            expectedCount++;
            if (!liveKeys.has(def.id)) {
                missing.push(def.id);
            }
        }
    });

    const coveragePct = expectedCount > 0 ? ((expectedCount - missing.length) / expectedCount) * 100 : 100;
    const coverage = coveragePct.toFixed(2) + '%';

    const report = {
        coverage,
        missing,
        duplicates,
        invalid
    };

    if (coveragePct < 100 || missing.length > 0 || duplicates.length > 0 || invalid.length > 0) {
        console.warn('⚠️ Registry Validation Warning:', report);
    } else {
        console.log('✅ Registry Validation Passed: 100% Coverage', report);
    }

    return report;
}
