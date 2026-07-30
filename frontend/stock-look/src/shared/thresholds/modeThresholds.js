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

    // ── INTRADAY ─────────────────────────────────────────────────────────────
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
    },
};

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
