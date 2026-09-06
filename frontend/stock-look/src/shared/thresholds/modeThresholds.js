/**
 * @file modeThresholds.js
 * @purpose Mode-specific score adjustments applied AFTER raw individual card scoring.
 *
 * Design: Scores are always computed by scoringEngine.js using the calibrated
 * base thresholds. THEN applyModeAdjustment() tweaks the result based on the
 * active trading mode — keeping the two concerns fully separate.
 *
 * Adjustment types per metric per mode:
 *   lock_neutral: true  → always return score=50, bias='Neutral' (metric irrelevant)
 *   shift: N            → add N to score (positive = more lenient, negative = stricter)
 *   amplify: X          → amplify deviation from 50 by X  (>1 = stronger signal)
 *   dampen: X           → dampen deviation from 50 by X  (<1 = weaker signal toward neutral)
 */

import { applyBiasMap, DEFAULT_BIAS_MAP } from './fundamentalThresholds.js';

// ─── Adjustment Maps ──────────────────────────────────────────────────────────

const MODE_SCORE_ADJUSTMENTS = {

    // ── POSITIONAL ────────────────────────────────────────────────────────────
    // More lenient on valuation (you can hold through near-term overvaluation).
    // Dampen short-term flow noise.
    positional: {
        // Valuation: more lenient — long-term investors accept higher multiples
        pe_ratio:           { shift: +8  },
        pb_ratio:           { shift: +5  },
        ev_ebitda:          { shift: +5  },
        forward_pe:         { shift: +3  },

        // Balance sheet: also slightly more lenient (time to deleverage)
        debt_to_equity:     { shift: +5  },
        interest_coverage:  { shift: +3  },

        // Flows: dampen — monthly/quarterly horizon absorbs daily noise
        fii_dii_flow:       { dampen: 0.70 },
        fii_flow:           { dampen: 0.70 },
        dii_flow:           { dampen: 0.70 },
    },

    // ── SWING (baseline) ─────────────────────────────────────────────────────
    // No adjustments — raw engine output is the signal.
    swing: {},

    // ── INTRADAY (Fundamentals) ───────────────────────────────────────────────
    // Trailing valuation and quality metrics become irrelevant for same-day trades.
    // Institutional flows and risk environment are amplified.
    intraday: {
        // Trailing valuation → lock to neutral (day traders don't care about PE/PB)
        pe_ratio:           { lock_neutral: true },
        pb_ratio:           { lock_neutral: true },
        ev_ebitda:          { lock_neutral: true },

        // Forward PE still slightly directional (guidance = catalyst)
        forward_pe:         { shift: -3 },

        // Historical quality metrics → lock to neutral (doesn't affect today's price)
        roe:                { lock_neutral: true },
        roce:               { lock_neutral: true },
        roa:                { lock_neutral: true },

        // Balance sheet: tighten — don't want leveraged exposure on overnight risk
        debt_to_equity:     { shift: -8 },
        interest_coverage:  { lock_neutral: true },
        current_ratio:      { shift: -5 },

        // Institutional flows: amplify — today's buying/selling IS the signal
        fii_dii_flow:       { amplify: 1.25 },
        fii_flow:           { amplify: 1.20 },
        dii_flow:           { amplify: 1.20 },

        // ── TECHNICAL (INTRADAY) ─────────────────────────────────────────────
        // Long-term MAs are secondary context on a 5m/15m chart
        ema_200:            { dampen: 0.60 },
        sma_200:            { dampen: 0.60 },
        ema_50:             { dampen: 0.70 },
        sma_50:             { dampen: 0.70 },
        ema_20:             { dampen: 0.85 },

        // Fibonacci becomes less actionable on intraday charts
        fibonacci:          { lock_neutral: true },

        // Momentum oscillators amplified — tape reading is primary
        rsi:                { amplify: 1.25 },
        stoch_rsi:          { amplify: 1.20 },
        macd:               { amplify: 1.20 },
        williams_r:         { amplify: 1.20 },

        // Volume and VWAP dominate intraday sessions
        vwap:               { amplify: 1.30 },
        volume_sma:         { amplify: 1.25 },
        obv:                { amplify: 1.20 },
        cmf:                { amplify: 1.20 },

        // Breadth cards amplified for index intraday trades
        breadth_ratio:      { amplify: 1.20 },
        ad_line:            { amplify: 1.15 },
        trin:               { amplify: 1.20 },

        // Keltner Channels (volatility breakout) amplified for intraday entries
        kc:                 { amplify: 1.15 },

        // ADX and Supertrend are still relevant but slightly less so
        adx:                { dampen: 0.90 },
        supertrend:         { dampen: 0.85 },

        // Structure / S&R are less precise on intraday timeframes
        support:            { dampen: 0.80 },
        resistance:         { dampen: 0.80 },
        trendline:          { dampen: 0.75 },
        pivot:              { amplify: 1.10 },  // Pivot points ARE used intraday

        // Beta correlation irrelevant for intraday trading
        beta_correlation:   { lock_neutral: true },
    },
};

// ─── Technical Positional Adjustments ─────────────────────────────────────────
// Separated for readability. These are merged into MODE_SCORE_ADJUSTMENTS.positional
const TECHNICAL_POSITIONAL_ADJUSTMENTS = {
    // Oscillators dampened — weekly holders don't trade every RSI crossover
    rsi:                { dampen: 0.80 },
    stoch_rsi:          { dampen: 0.75 },
    williams_r:         { dampen: 0.75 },
    macd:               { dampen: 0.85 },

    // Long-term MAs amplified — price must be above 200 EMA/SMA for positional
    ema_200:            { amplify: 1.30 },
    sma_200:            { amplify: 1.30 },
    ema_50:             { amplify: 1.15 },
    sma_50:             { amplify: 1.10 },

    // Structure amplified — S/R and Fibonacci matter for positional entries
    support:            { amplify: 1.20 },
    resistance:         { amplify: 1.20 },
    trendline:          { amplify: 1.15 },
    fibonacci:          { amplify: 1.15 },

    // Supertrend and ADX amplified — trend confirmation critical
    supertrend:         { amplify: 1.20 },
    adx:                { amplify: 1.15 },

    // Volume/breadth cards dampened — weekly chart volume less signal-rich
    vwap:               { dampen: 0.70 },
    volume_sma:         { dampen: 0.75 },
    cmf:                { dampen: 0.75 },
    obv:                { dampen: 0.80 },

    // Bollinger Bands dampened — squeeze less relevant on weekly holding
    bb_20_2:            { dampen: 0.85 },

    // Beta correlation amplified — positional traders need to know index sensitivity
    beta_correlation:   { amplify: 1.15 },
};

// Merge technical positional adjustments into the main map
Object.assign(MODE_SCORE_ADJUSTMENTS.positional, TECHNICAL_POSITIONAL_ADJUSTMENTS);

// ─── Options Adjustments ──────────────────────────────────────────────────────
// Positional: IV metrics amplified (premium assessment critical), Greeks dampened
const OPTIONS_POSITIONAL_ADJUSTMENTS = {
    // Volatility metrics — knowing if IV is cheap/expensive is key for entries
    iv_rank:        { amplify: 1.30 },
    iv_percentile:  { amplify: 1.25 },
    atm_iv:         { amplify: 1.20 },
    // Max Pain highly relevant for expiry-week positional trades
    max_pain:       { amplify: 1.20 },
    // PCR OI more meaningful than volume PCR over multi-day holds
    pcr_oi:         { amplify: 1.15 },
    pcr_volume:     { dampen: 0.80 },
    // Short-term Greeks less relevant for weekly holding periods
    delta:          { dampen: 0.75 },
    gamma:          { dampen: 0.70 },
};
Object.assign(MODE_SCORE_ADJUSTMENTS.positional, OPTIONS_POSITIONAL_ADJUSTMENTS);

// Intraday: Greeks + volume PCR dominate, slow metrics dampened
const OPTIONS_INTRADAY_ADJUSTMENTS = {
    // Greeks amplified — live price movement is the signal
    delta:          { amplify: 1.40 },
    gamma:          { amplify: 1.35 },
    theta:          { amplify: 1.20 },
    vega:           { amplify: 1.15 },
    // Volume PCR is the real-time tape signal intraday
    pcr_volume:     { amplify: 1.30 },
    pcr_oi:         { dampen: 0.85 },
    // OI change most actionable intraday
    oi_change:      { amplify: 1.25 },
    // IV Rank and Percentile are slow metrics — not intraday signals
    iv_rank:        { dampen: 0.70 },
    iv_percentile:  { dampen: 0.65 },
    // Max Pain is an expiry-week metric, not useful intraday
    max_pain:       { lock_neutral: true },
};
Object.assign(MODE_SCORE_ADJUSTMENTS.intraday, OPTIONS_INTRADAY_ADJUSTMENTS);


// ─── Global Macro Adjustments ─────────────────────────────────────────────────
// Positional: Macro regime signals dominate — structural, slow-moving indicators
const GLOBAL_POSITIONAL_ADJUSTMENTS = {
    // Rates & Bond Market — set the regime for multi-week equity direction
    us_10y_yield:   { amplify: 1.40 },  // Bond market regime defines risk appetite
    vix:            { amplify: 1.30 },  // Structural vol regime (not just intraday spike)
    move:           { amplify: 1.25 },  // Bond vol index — macro stress indicator
    // Currency — structural dollar flows drive global capital allocation
    dxy:            { amplify: 1.25 },  // Dollar strength determines EM capital flows
    usd_inr:        { amplify: 1.20 },  // USDINR structural trend = Indian market pressure
    // Safe-havens — regime confirmation signals
    gold:           { amplify: 1.20 },  // Gold trend as macro hedge signal
    // US Equity Futures — short-term momentum, less relevant positionally
    nasdaq_futures: { dampen: 0.80 },
    // Agricultural/industrial commodities — slow macro signals
    natgas:         { dampen: 0.80 },
    wheat:          { dampen: 0.75 },
    aluminum:       { dampen: 0.75 },
    // Crypto — high noise, low signal for positional macro analysis
    bitcoin:        { dampen: 0.60 },
};
Object.assign(MODE_SCORE_ADJUSTMENTS.positional, GLOBAL_POSITIONAL_ADJUSTMENTS);

// Intraday: Price-action signals — fastest-moving assets dominate
const GLOBAL_INTRADAY_ADJUSTMENTS = {
    // US Futures — primary intraday global market direction signal
    sp_futures:     { amplify: 1.40 },  // S&P futures lead Indian market intraday
    nasdaq_futures: { amplify: 1.35 },  // Nasdaq drives intraday tech sentiment
    dow_futures:    { amplify: 1.25 },
    // Volatility — instant risk-on/off read
    vix:            { amplify: 1.35 },  // VIX spike = immediate risk-off globally
    // Currency — FX pairs are among the fastest intraday movers
    usd_inr:        { amplify: 1.25 },  // USDINR is the fastest intraday Indian signal
    dxy:            { amplify: 1.20 },
    // Bitcoin — high intraday vol, useful as sentiment proxy
    bitcoin:        { amplify: 1.15 },
    // Slow macro signals — do not move meaningfully intraday
    us_10y_yield:   { dampen: 0.70 },   // Yield barely shifts intraday
    move:           { dampen: 0.65 },   // MOVE index is a weekly metric
    // Agricultural/industrial — irrelevant intraday
    wheat:          { dampen: 0.60 },
    aluminum:       { dampen: 0.60 },
    natgas:         { dampen: 0.70 },
    // European markets closed by Indian afternoon session
    cac40:          { dampen: 0.80 },
    eurostoxx:      { dampen: 0.80 },
};
Object.assign(MODE_SCORE_ADJUSTMENTS.intraday, GLOBAL_INTRADAY_ADJUSTMENTS);


// ─── Core Adjustment Function ─────────────────────────────────────────────────

/**
 * Apply mode-specific adjustment to a raw score result from scoringEngine.
 * Adjusts both score and bias together to keep them in sync.
 *
 * @param {Object} scoreResult  - { score, bias, confidence, ...rest } from scoringEngine
 * @param {string} metricId     - Card metric ID e.g. 'pe_ratio', 'roe'
 * @param {string} mode         - 'positional' | 'swing' | 'intraday'
 * @returns {Object}            - Adjusted { score, bias, confidence, ...rest }
 */
export function applyModeAdjustment(scoreResult, metricId, mode = 'swing') {
    if (!scoreResult) return scoreResult;
    if (scoreResult.score === null || scoreResult.score === undefined) return scoreResult;
    if (mode === 'swing') return scoreResult; // baseline — no adjustment needed

    const adj = MODE_SCORE_ADJUSTMENTS[mode]?.[metricId];
    if (!adj) return scoreResult;           // metric has no adjustment for this mode

    // Lock to neutral — metric is irrelevant for this trading mode
    if (adj.lock_neutral) {
        return {
            ...scoreResult,
            score: 50,
            bias: 'Neutral',
            _modeAdjusted: true,
            _mode: mode,
        };
    }

    let adjusted = scoreResult.score;

    if (adj.shift   !== undefined) adjusted = adjusted + adj.shift;
    if (adj.amplify !== undefined) adjusted = 50 + (adjusted - 50) * adj.amplify;
    if (adj.dampen  !== undefined) adjusted = 50 + (adjusted - 50) * adj.dampen;

    const finalScore = Math.round(Math.max(0, Math.min(100, adjusted)));
    const finalBias  = applyBiasMap(finalScore, DEFAULT_BIAS_MAP);

    return {
        ...scoreResult,
        score: finalScore,
        bias:  finalBias,
        _modeAdjusted: true,
        _mode: mode,
    };
}

/**
 * Convenience: apply adjustment when you only have a raw score number (not a result object).
 * Returns the adjusted score number.
 */
export function applyModeScoreOnly(score, metricId, mode = 'swing') {
    if (score === null || score === undefined || isNaN(score)) return score;
    const result = applyModeAdjustment({ score, bias: 'Neutral' }, metricId, mode);
    return result.score;
}
