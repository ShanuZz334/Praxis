/**
 * @file weights/index.js
 * @purpose Main export for all weight configurations with mode selection.
 * @responsibilities
 * - Exports all weight configurations
 * - Provides unified interface for getting weights by mode
 * - Integrates with user preferences
 * @key_exports
 * - getWeights - Gets weights for any page/feature by mode
 * - TECHNICAL_WEIGHTS, FUNDAMENTAL_WEIGHTS, etc.
 * @date 2026-02-04
 */

import { getCurrentMode, TRADING_MODES } from '../tradingModes.js';
import { getTechnicalWeights, TECHNICAL_WEIGHTS } from './technicalWeights.js';
import { MASTER_WEIGHTS } from './masterWeights.js';

// =============================
// Unified Weight Getter
// =============================

/**
 * Gets weights for a specific feature/page based on trading mode
 * @param {string} feature - Feature name ('technical', 'fundamental', 'options', etc.)
 * @param {Object} userPreferences - User preferences object
 * @returns {Object} Weight configuration
 */
export const getWeights = (feature, userPreferences = null) => {
    const mode = getCurrentMode(userPreferences);

    switch (feature.toLowerCase()) {
        case 'master':
            return MASTER_WEIGHTS;
        case 'technical':
            return getTechnicalWeights(mode);
        // Add other features as they're implemented
        default:
            console.warn(`Unknown feature: ${feature}, returning technical weights`);
            return getTechnicalWeights(mode);
    }
};

// =============================
// Direct Exports
// =============================

export {
    TECHNICAL_WEIGHTS,
    getTechnicalWeights,
    MASTER_WEIGHTS
};

export default {
    getWeights,
    TECHNICAL_WEIGHTS,
    getTechnicalWeights,
    MASTER_WEIGHTS
};
