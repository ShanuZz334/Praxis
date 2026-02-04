/**
 * @file technicalConfigAdapter.js
 * @purpose Adapter to merge centralized weights/credits with indicator metadata.
 * @responsibilities
 * - Imports weights and credits from config
 * - Merges with existing indicator metadata
 * - Provides mode-aware configuration getter
 * @key_exports
 * - getTechnicalConfig - Gets complete config with mode-specific weights/credits
 * @date 2026-02-04
 */

import { technicalIndicatorsConfig } from './indicatorsConfig.js';
import { getTechnicalWeights } from '../../../../config/weights/index.js';
import { getTechnicalCredits } from '../../../../config/credits/index.js';
import { getCurrentMode } from '../../../../config/tradingModes.js';

/**
 * Gets technical indicators config with mode-specific weights and credits
 * @param {Object} userPreferences - User preferences object
 * @returns {Array} Complete indicator configuration
 */
export const getTechnicalConfig = (userPreferences = null) => {
    const mode = getCurrentMode(userPreferences);
    const weights = getTechnicalWeights(mode);
    const credits = getTechnicalCredits(mode);

    return technicalIndicatorsConfig.map(indicator => ({
        ...indicator,
        weight: weights[indicator.id] || indicator.weight,
        creditAllocation: credits[indicator.id] || indicator.creditAllocation
    }));
};

export default getTechnicalConfig;
