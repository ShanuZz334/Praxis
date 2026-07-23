import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

/**
 * RegistryManager is the single source of truth for the live state of all cards in the dashboard.
 * It is a pure JS singleton that stores the results from the RegistryProcessor.
 * DataRegistryContext wraps this for the React tree.
 */
class RegistryManager {
    constructor() {
        this.registry = {
            fundamentals: {},
            technical: {},
            options: {},
            foreign: {},
            master: {}
        };
        // We will pre-populate the registry based on CARD_REGISTRY to guarantee fixed size
        this._initializeRegistry();
    }

    _initializeRegistry() {
        Object.values(CARD_REGISTRY).forEach(card => {
            const pageId = card.page ? card.page.toLowerCase() : 'master';
            if (this.registry[pageId]) {
                this.registry[pageId][card.id] = {
                    id: card.id,
                    status: 'pending',
                    hasLiveData: false,
                    reason: 'Awaiting first poll',
                    _registeredAt: Date.now()
                };
            }
        });
    }

    /**
     * @param {string} pageId - e.g. 'fundamentals', 'technical'
     * @param {string} cardId 
     * @param {object} snapshot 
     */
    register(pageId, cardId, snapshot) {
        if (!this.registry[pageId]) this.registry[pageId] = {};
        // Overwrite - no deep merge, ensuring strict replacement
        this.registry[pageId][cardId] = {
            ...snapshot,
            _registeredAt: Date.now()
        };
    }

    /**
     * Bulk register multiple cards to a page
     * @param {string} pageId 
     * @param {Array<object>} cardsArray 
     */
    registerBulk(pageId, cardsArray) {
        if (!Array.isArray(cardsArray)) return;
        cardsArray.forEach(card => {
            if (card && card.id) {
                this.register(pageId, card.id, card);
            }
        });
    }

    getSnapshot(pageId) {
        return this.registry[pageId] || {};
    }

    getMasterSnapshot() {
        return this.registry;
    }
    
    getFlatSnapshot() {
        let flat = {};
        Object.values(this.registry).forEach(page => {
            flat = { ...flat, ...page };
        });
        return flat;
    }
}

export const registryManager = new RegistryManager();
