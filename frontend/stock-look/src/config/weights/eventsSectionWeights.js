/**
 * @file eventsSectionWeights.js
 * @purpose Mode-aware weight multipliers for the Events composite scoring engine.
 * @responsibilities
 *   - Defines per-category multipliers for each trading mode (POSITIONAL / SWING / INTRADAY).
 *   - Defines per-horizon multipliers to amplify or dampen events by their tagged time horizon.
 * @architecture
 *   SWING mode keeps all multipliers at exactly 1.0 — preserves current behavior as baseline.
 *   POSITIONAL: Amplifies macro, policy, structural events. Dampens intraday/corporate noise.
 *   INTRADAY:   Amplifies breaking corporate/earnings catalysts. Dampens slow-moving macro.
 * @rule5_compliance Pure JS — no React imports. Importable by both frontend and Node backend.
 */

import { TRADING_MODES } from '../tradingModes.js';

// ============================================================================================
// CATEGORY WEIGHT MULTIPLIERS
// Applied to each category's accumulated momentum during section building in computePortfolioMetrics.
// ============================================================================================

const EVENT_CATEGORY_MODE_WEIGHTS = {
    [TRADING_MODES.POSITIONAL]: {
        Macro:        1.25, // Structural macro forces — RBI, GDP, CPI — most relevant for long holds
        Policy:       1.20, // Policy-driven shifts take time to transmit but are persistent
        Economy:      1.20, // Economic data & cycles — positional horizon
        Earnings:     1.15, // Long-term earnings compounding matters for positional trades
        Geopolitical: 1.15, // Geopolitical tensions can persist for weeks/months
        Bonds:        1.10, // Bond market signals are long-duration signals
        Global:       1.10, // Global macro backdrop shapes multi-week risk appetite
        Commodities:  1.00, // Commodity cycles — neutral; relevant at all horizons
        Currency:     0.85, // FX moves less relevant for multi-week stock holds
        Corporate:    0.80, // Same-day corporate announcements are noise for positional traders
    },
    [TRADING_MODES.SWING]: {
        // All 1.0 — no distortion from the baseline. Current behavior preserved exactly.
        Macro:        1.00,
        Policy:       1.00,
        Earnings:     1.00,
        Geopolitical: 1.00,
        Global:       1.00,
        Corporate:    1.00,
        Currency:     1.00,
        Commodities:  1.00,
        Bonds:        1.00,
        Economy:      1.00,
    },
    [TRADING_MODES.INTRADAY]: {
        Corporate:    1.30, // Corporate filings, management changes → immediate price action
        Earnings:     1.25, // Breaking earnings results = strongest same-day catalyst
        Geopolitical: 1.20, // Geopolitical shocks trigger immediate risk-off moves
        Policy:       1.10, // Surprise policy decisions fire same-day (e.g. unscheduled RBI)
        Currency:     1.10, // FX moves immediately affect exporters / importers
        Commodities:  1.15, // Commodity price shocks hit sector stocks same session
        Global:       1.10, // Global risk-off/on events move Indian markets intraday
        Macro:        0.80, // Macro data takes weeks to fully transmit — irrelevant for day trades
        Economy:      0.80, // Economic indicators are lagging; not actionable today
        Bonds:        0.80, // Bond market signals play out over days/weeks, not hours
    },
};

// ============================================================================================
// HORIZON WEIGHT MULTIPLIERS
// Applied to each individual event's decay-weighted impact score during aggregation.
// ============================================================================================

const EVENT_HORIZON_MODE_WEIGHTS = {
    [TRADING_MODES.POSITIONAL]: {
        'Intraday':   0.80, // Intraday noise — not actionable for a multi-week positional trade
        'Swing':      0.90, // Swing events give some context but fade quickly
        'Positional': 1.10, // Core horizon: amplify events tagged for the positional timeframe
        'Structural': 1.25, // Structural shifts are the highest-conviction signal for long holds
        'Long Term':  1.30, // Multi-quarter forces carry premium weight in positional analysis
    },
    [TRADING_MODES.SWING]: {
        // All 1.0 — baseline behavior preserved.
        'Intraday':   1.00,
        'Swing':      1.00,
        'Positional': 1.00,
        'Structural': 1.00,
        'Long Term':  1.00,
    },
    [TRADING_MODES.INTRADAY]: {
        'Intraday':   1.30, // Only care about what moves the market today
        'Swing':      1.15, // Swing events can still fire intraday moves
        'Positional': 0.85, // Multi-week events are not actionable for today's trade
        'Structural': 0.70, // Structural shifts take quarters to play out — ignore for intraday
        'Long Term':  0.65, // Completely irrelevant for a trade closing today
    },
};

// ============================================================================================
// ACCESSOR FUNCTIONS
// ============================================================================================

/**
 * Returns the category weight multiplier map for the given trading mode.
 * Falls back to SWING (all 1.0) for any unknown mode.
 * @param {string} mode - One of TRADING_MODES.POSITIONAL | SWING | INTRADAY
 * @returns {Object} Map of category name → multiplier
 */
export function getEventCategoryWeights(mode = TRADING_MODES.SWING) {
    return EVENT_CATEGORY_MODE_WEIGHTS[mode] ?? EVENT_CATEGORY_MODE_WEIGHTS[TRADING_MODES.SWING];
}

/**
 * Returns the horizon weight multiplier map for the given trading mode.
 * Falls back to SWING (all 1.0) for any unknown mode.
 * @param {string} mode - One of TRADING_MODES.POSITIONAL | SWING | INTRADAY
 * @returns {Object} Map of horizon name → multiplier
 */
export function getEventHorizonWeights(mode = TRADING_MODES.SWING) {
    return EVENT_HORIZON_MODE_WEIGHTS[mode] ?? EVENT_HORIZON_MODE_WEIGHTS[TRADING_MODES.SWING];
}

// ============================================================================================
// CANONICAL SECTION DEFINITIONS FOR GLOBAL HEADER
// ============================================================================================

export const EVENT_CATEGORY_META = {
    Macro:        { label: 'Macro',        shortLabel: 'MAC' },
    Policy:       { label: 'Policy',       shortLabel: 'POL' },
    Corporate:    { label: 'Corporate',    shortLabel: 'COR' },
    Earnings:     { label: 'Earnings',     shortLabel: 'ERN' },
    Geopolitical: { label: 'Geopolitical', shortLabel: 'GEO' },
    Global:       { label: 'Global',       shortLabel: 'GLO' },
    Commodities:  { label: 'Commodities',  shortLabel: 'COM' },
    Currency:     { label: 'Currency',     shortLabel: 'CUR' },
    Bonds:        { label: 'Bonds',        shortLabel: 'BND' },
    Economy:      { label: 'Economy',      shortLabel: 'ECO' }
};

export const DEFAULT_EVENT_SECTIONS = ['Macro', 'Policy', 'Corporate', 'Earnings', 'Geopolitical', 'Global'];

