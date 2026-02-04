/**
 * @file credits/index.js
 * @purpose Main export for all credit configurations with mode selection.
 * @responsibilities
 * - Exports all credit configurations
 * - Provides unified interface for getting credits by mode
 * - Integrates with user preferences
 * @key_exports
 * - getCredits - Gets credits for any page/feature by mode
 * - TECHNICAL_CREDITS, FUNDAMENTAL_CREDITS, etc.
 * @date 2026-02-04
 */

import { getCurrentMode, TRADING_MODES } from '../tradingModes.js';
import { getTechnicalCredits, TECHNICAL_CREDITS, TOTAL_TECHNICAL_CREDITS } from './technicalCredits.js';

// =============================
// Unified Credit Getter
// =============================

/**
 * Gets credits for a specific feature/page based on trading mode
 * @param {string} feature - Feature name ('technical', 'fundamental', 'options', etc.)
 * @param {Object} userPreferences - User preferences object
 * @returns {Object} Credit configuration
 */
export const getCredits = (feature, userPreferences = null) => {
    const mode = getCurrentMode(userPreferences);

    switch (feature.toLowerCase()) {
        case 'technical':
            return getTechnicalCredits(mode);
        // Add other features as they're implemented
        default:
            console.warn(`Unknown feature: ${feature}, returning technical credits`);
            return getTechnicalCredits(mode);
    }
};

// =============================
// Direct Exports
// =============================

export {
    TECHNICAL_CREDITS,
    TOTAL_TECHNICAL_CREDITS,
    getTechnicalCredits
};

export default {
    getCredits,
    TECHNICAL_CREDITS,
    TOTAL_TECHNICAL_CREDITS,
    getTechnicalCredits
};
