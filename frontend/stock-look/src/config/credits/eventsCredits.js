/**
 * @file eventsCredits.js
 * @purpose Credit configuration for Events page.
 * @responsibilities
 * - Defines total credits baseline for events
 * - Provides mode-specific credit multipliers for event categories
 * @key_exports
 * - TOTAL_EVENTS_CREDITS - Total credits for events system
 * - EVENT_CATEGORY_MULTIPLIERS - Category-specific multipliers
 * @date 2026-02-04
 * @note Events page uses dynamic credit allocation based on impact scores
 */

import { TRADING_MODES } from '../tradingModes.js';

// =============================
// Base Events Credits
// =============================

/**
 * Total credits allocated for events system
 * Events use dynamic allocation based on impact scores
 */
export const TOTAL_EVENTS_CREDITS = 100;

// =============================
// Event Category Multipliers
// =============================

/**
 * Multipliers for different event categories based on trading mode
 */
export const EVENT_CATEGORY_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        'Macro': 1.0,
        'Policy': 1.0,
        'Corporate': 1.0,
        'Global': 1.0
    },

    [TRADING_MODES.AGGRESSIVE]: {
        'Corporate': 1.4,  // Focus on earnings events
        'Global': 1.3,     // Global catalysts
        'Macro': 1.1,
        'Policy': 0.8      // Less policy focus
    },

    [TRADING_MODES.CONSERVATIVE]: {
        'Policy': 1.5,     // Focus on policy events
        'Macro': 1.3,      // Macro indicators
        'Global': 1.2,     // Global risks
        'Corporate': 0.7   // Less earnings focus
    }
};

export default {
    TOTAL_EVENTS_CREDITS,
    EVENT_CATEGORY_MULTIPLIERS
};
