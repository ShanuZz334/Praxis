/**
 * @file technicalSectionWeights.js
 * @purpose Section weight configurations for the Technical page.
 * @responsibilities
 * - Defines the section-level weight distribution for the composite score.
 * - Provides mode-specific profiles (Positional, Swing, Intraday).
 * @key_exports
 * - TECHNICAL_SECTION_WEIGHTS - Base section weights (Swing / default)
 * - TECHNICAL_SECTION_MODE_PROFILES - Full weight profiles per mode
 * - getTechnicalSectionWeights - Gets resolved section weights for a mode
 * @date 2026-08-14
 */

import { TRADING_MODES, getCurrentMode } from '../tradingModes.js';

// =============================
// Base Section Weights (Swing — balanced default)
// =============================

export const TECHNICAL_SECTION_WEIGHTS = {
    // 30% — Trend is the primary signal (direction of the market)
    Trend: 0.30,

    // 25% — Momentum confirms trend velocity
    Momentum: 0.25,

    // 15% — Volatility context (squeeze vs expansion)
    Volatility: 0.15,

    // 15% — Structure (S/R, Fibonacci, Trendlines)
    Structure: 0.15,

    // 15% — Volume (Company) OR Breadth (Index)
    Volume: 0.15,
    Breadth: 0.15,
};

// =============================
// Full Mode Profiles
// Weights are absolute (not multipliers) so they are clear and readable.
// Each mode's values must logically sum near 1.0 (normalized by engine anyway).
// =============================

export const TECHNICAL_SECTION_MODE_PROFILES = {

    // ── POSITIONAL ──────────────────────────────────────────────────────────
    // Holding for weeks to months. Trend alignment + structural integrity are
    // critical. Short-term oscillator noise is dampened. Volume/Breadth
    // gives context but isn't the primary driver.
    [TRADING_MODES.POSITIONAL]: {
        Trend:      0.40,   // Must be above key MAs and in a confirmed uptrend
        Momentum:   0.15,   // Oscillators less critical on weekly timeframe
        Volatility: 0.10,   // Context only
        Structure:  0.20,   // S/R, Fibonacci levels matter for entries/exits
        Volume:     0.15,   // Volume context on positional chart
        Breadth:    0.15,   // Market participation still matters for index trades
    },

    // ── SWING (Baseline) ────────────────────────────────────────────────────
    // Holding for days to weeks. Balanced across all indicators.
    // This is the default — no adjustments needed.
    [TRADING_MODES.SWING]: {
        Trend:      0.30,
        Momentum:   0.25,
        Volatility: 0.15,
        Structure:  0.15,
        Volume:     0.15,
        Breadth:    0.15,
    },

    // ── INTRADAY ────────────────────────────────────────────────────────────
    // Same-day hold. Momentum oscillators + Volume/Breadth tape dominate.
    // Long-term trend is secondary context. Fibonacci/structure less relevant
    // on a 5m or 15m chart. VWAP + Opening Range + Breadth are primary.
    [TRADING_MODES.INTRADAY]: {
        Trend:      0.20,   // Still need trend context but less dominant
        Momentum:   0.30,   // RSI, MACD, Williams %R are primary signals
        Volatility: 0.15,   // ATR / BB squeeze determines trade size
        Structure:  0.10,   // Pivots matter; Fib less so on 5m
        Volume:     0.25,   // VWAP, CMF, Volume SMA are intraday gospel
        Breadth:    0.25,   // Breadth confirms index trade direction
    },
};

// =============================
// Utility Function
// =============================

/**
 * Gets resolved section weights for a given trading mode.
 * Falls back to SWING (balanced) if mode is unrecognized.
 *
 * @param {Object|string} userPreferencesOrMode - User preferences object OR mode string
 * @returns {Object} Section weight map { Trend, Momentum, Volatility, Structure, Volume, Breadth }
 */
export const getTechnicalSectionWeights = (userPreferencesOrMode = null) => {
    let mode;
    if (typeof userPreferencesOrMode === 'string') {
        mode = userPreferencesOrMode;
    } else {
        mode = getCurrentMode(userPreferencesOrMode);
    }

    return TECHNICAL_SECTION_MODE_PROFILES[mode] || TECHNICAL_SECTION_WEIGHTS;
};

export default {
    TECHNICAL_SECTION_WEIGHTS,
    TECHNICAL_SECTION_MODE_PROFILES,
    getTechnicalSectionWeights,
};
