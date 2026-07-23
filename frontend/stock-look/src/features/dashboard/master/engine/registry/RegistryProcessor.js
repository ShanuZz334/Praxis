import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { registryManager } from './RegistryManager';
import { resolveCard } from './Resolver';
import { validateRegistry } from '@/shared/utils/RegistryValidator';

/**
 * RegistryProcessor
 * The core orchestration engine. Executes a single pass over the entire CARD_REGISTRY,
 * resolves each card's state using raw market data, mutates the live RegistryManager,
 * and validates the final registry output.
 */
class RegistryProcessor {
    /**
     * Executes the main polling pipeline.
     * @param {object} rawData - Combined raw data from all upstream APIs
     */
    process(rawData) {
        const startTime = performance.now();
        let liveCount = 0;
        let missingCount = 0;

        // 1. Loop through every card deterministically
        Object.values(CARD_REGISTRY).forEach(cardDef => {
            // 2. Resolve the card strictly functionally
            const result = resolveCard(cardDef, rawData);

            if (result && result.hasLiveData) liveCount++;
            else missingCount++;

            // 3. Register it via the manager (overwrite logic)
            const pageId = cardDef.page ? cardDef.page.toLowerCase() : 'master';
            registryManager.register(pageId, cardDef.id, {
                ...result,
                displayName: cardDef.displayName
            });
        });

        // 4. Validate completeness
        const snapshot = registryManager.getMasterSnapshot();
        const validation = validateRegistry(snapshot);

        if (validation.coverage < 100) {
            console.warn(`[RegistryProcessor] Incomplete Coverage: ${validation.coverage}%. Missing:`, validation.missing);
        }

        const endTime = performance.now();
        
        // Output audit log (dev only)
        if (process.env.NODE_ENV === 'development') {
            console.log(`[RegistryProcessor] Cycle complete in ${(endTime - startTime).toFixed(2)}ms`);
            console.log(`[RegistryProcessor] Registry Size: ${validation.actual} | Coverage: ${validation.coverage}%`);
            console.log(`[RegistryProcessor] Live: ${liveCount} | Missing/Pending: ${missingCount}`);
        }
    }
}

export const registryProcessor = new RegistryProcessor();
