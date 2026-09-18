/**
 * @file paceEngine.js
 * @purpose Praxis Adaptive Calibration Engine (PACE)
 *
 * Permanent, compounding reinforcement-style learning for Future Vision.
 * All calibration data stored in SQLite � survives restarts, browser clears, etc.
 *
 * Three learning mechanisms:
 *  1. updateCalibrationProfile() � accumulates bar scores into permanent SQLite DB
 *  2. getCalibrationProfile()    � returns full profile for system prompt injection
 *  3. applyBiasCorrection()      � post-processes raw AI candles before rendering
 *
 * Bayesian shrinkage: correction_strength = min(1.0, bars_scored / 20)
 *   Starts at 0%, ramps to 100% correction after 20 scored bars.
 *   Prevents overcorrection when data is sparse.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH   = path.join(__dirname, '..', 'local_data', 'praxis.db');

function getDb() { return new Database(DB_PATH); }

function ensureTable(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS pace_profiles (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_key  TEXT    NOT NULL,
            timeframe       TEXT    NOT NULL,
            regime          TEXT    NOT NULL DEFAULT 'normal',
            sessions_scored INTEGER NOT NULL DEFAULT 0,
            bars_scored     INTEGER NOT NULL DEFAULT 0,
            sum_close_bias  REAL    NOT NULL DEFAULT 0,
            sum_hl_error    REAL    NOT NULL DEFAULT 0,
            sum_mape        REAL    NOT NULL DEFAULT 0,
            sum_da          REAL    NOT NULL DEFAULT 0,
            bullish_da_sum  REAL    NOT NULL DEFAULT 0,
            bullish_da_n    INTEGER NOT NULL DEFAULT 0,
            bearish_da_sum  REAL    NOT NULL DEFAULT 0,
            bearish_da_n    INTEGER NOT NULL DEFAULT 0,
            last_updated    INTEGER,
            UNIQUE(instrument_key, timeframe, regime)
        );
    `);
}

// --- PUBLIC API -------------------------------------------------------------

/**
 * Update the calibration profile with a newly scored bar.
 * @param {string} instrumentKey
 * @param {string} timeframe
 * @param {object} barScore  � { da, mapeClose, hlError, closeBias }
 * @param {string} regime    � 'calm' | 'normal' | 'volatile'
 */
export function updateCalibrationProfile(instrumentKey, timeframe, barScore, regime = 'normal') {
    const db = getDb();
    ensureTable(db);

    const { da = 0, mapeClose = 0, hlError = 0, closeBias = 0 } = barScore;
    const isBullish = closeBias >= 0;
    const isBearish = closeBias < 0;

    db.prepare(`
        INSERT INTO pace_profiles
            (instrument_key, timeframe, regime, sessions_scored, bars_scored,
             sum_close_bias, sum_hl_error, sum_mape, sum_da,
             bullish_da_sum, bullish_da_n, bearish_da_sum, bearish_da_n, last_updated)
        VALUES (?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(instrument_key, timeframe, regime) DO UPDATE SET
            bars_scored    = bars_scored + 1,
            sum_close_bias = sum_close_bias + excluded.sum_close_bias,
            sum_hl_error   = sum_hl_error   + excluded.sum_hl_error,
            sum_mape       = sum_mape       + excluded.sum_mape,
            sum_da         = sum_da         + excluded.sum_da,
            bullish_da_sum = bullish_da_sum + excluded.bullish_da_sum,
            bullish_da_n   = bullish_da_n   + excluded.bullish_da_n,
            bearish_da_sum = bearish_da_sum + excluded.bearish_da_sum,
            bearish_da_n   = bearish_da_n   + excluded.bearish_da_n,
            last_updated   = excluded.last_updated
    `).run(
        instrumentKey, timeframe, regime,
        closeBias, hlError, mapeClose, da,
        isBullish ? da : 0, isBullish ? 1 : 0,
        isBearish ? da : 0, isBearish ? 1 : 0,
        Date.now()
    );

    db.close();
}

/**
 * Get the full calibration profile for an instrument/timeframe.
 * Returns null if no data yet.
 */
export function getCalibrationProfile(instrumentKey, timeframe) {
    const db = getDb();
    ensureTable(db);

    const overall = db.prepare(`
        SELECT
            SUM(bars_scored)     AS bars_scored,
            SUM(sessions_scored) AS sessions_scored,
            SUM(sum_close_bias)  AS sum_close_bias,
            SUM(sum_hl_error)    AS sum_hl_error,
            SUM(sum_mape)        AS sum_mape,
            SUM(sum_da)          AS sum_da,
            SUM(bullish_da_sum)  AS bullish_da_sum,
            SUM(bullish_da_n)    AS bullish_da_n,
            SUM(bearish_da_sum)  AS bearish_da_sum,
            SUM(bearish_da_n)    AS bearish_da_n
        FROM pace_profiles
        WHERE instrument_key = ? AND timeframe = ?
    `).get(instrumentKey, timeframe);

    const regimes = db.prepare(`
        SELECT regime, bars_scored,
            CASE WHEN bars_scored > 0 THEN sum_close_bias / bars_scored ELSE 0 END AS avg_close_bias,
            CASE WHEN bars_scored > 0 THEN sum_mape / bars_scored ELSE 0 END AS avg_mape
        FROM pace_profiles WHERE instrument_key = ? AND timeframe = ?
    `).all(instrumentKey, timeframe);

    db.close();

    if (!overall?.bars_scored) return null;

    const n = overall.bars_scored;

    return {
        instrumentKey,
        timeframe,
        barsScored:        n,
        sessionsScored:    overall.sessions_scored,
        avgCloseBias:      overall.sum_close_bias / n,
        avgHlError:        overall.sum_hl_error   / n,
        avgMape:           overall.sum_mape        / n,
        avgDa:             (overall.sum_da / n) * 100,
        bullishDa:         overall.bullish_da_n > 0 ? (overall.bullish_da_sum / overall.bullish_da_n * 100).toFixed(1) : null,
        bearishDa:         overall.bearish_da_n > 0 ? (overall.bearish_da_sum / overall.bearish_da_n * 100).toFixed(1) : null,
        correctionStrength: Math.min(1.0, n / 20),
        regimeBreakdown:   regimes,
    };
}

/**
 * Apply mathematical bias correction to raw AI-output candles BEFORE rendering.
 * This is deterministic and permanent � does not depend on the AI model.
 */
export function applyBiasCorrection(candles, profile) {
    if (!profile || !candles?.length) return candles;

    const { avgCloseBias, avgHlError, correctionStrength } = profile;
    const closeDelta  = -(avgCloseBias * correctionStrength);

    // Range correction factor � clamp between 50% and 200% to avoid extremes
    const rangeFactor = avgHlError > 0
        ? Math.max(0.5, 1 - (avgHlError / 100) * correctionStrength)
        : Math.min(2.0, 1 + (Math.abs(avgHlError) / 100) * correctionStrength);

    return candles.map(c => {
        const corrClose = parseFloat((c.close + closeDelta).toFixed(2));
        const corrOpen  = parseFloat((c.open  + closeDelta).toFixed(2));
        const rawHalf   = Math.max(0.01, (c.high - c.low) / 2);
        const newHalf   = rawHalf * rangeFactor;
        const mid       = (corrClose + corrOpen) / 2;
        const corrHigh  = parseFloat(Math.max(mid + newHalf, corrOpen, corrClose).toFixed(2));
        const corrLow   = parseFloat(Math.min(mid - newHalf, corrOpen, corrClose).toFixed(2));

        return {
            ...c,
            open:  corrOpen,
            high:  corrHigh,
            low:   corrLow,
            close: corrClose,
            _paceApplied: true,
            _correctionStrength: correctionStrength,
        };
    });
}

/**
 * Format profile as a string block for AI system prompt injection (Block 0).
 */
export function formatProfileForPrompt(profile) {
    if (!profile) return 'No calibration data yet � this is the first prediction for this instrument/timeframe.';

    const { instrumentKey, timeframe, barsScored, sessionsScored,
            avgCloseBias, avgHlError, avgMape, avgDa,
            bullishDa, bearishDa, correctionStrength, regimeBreakdown } = profile;

    const biasDir = avgCloseBias >  0.2 ? `Model historically tends to OVERESTIMATE by +${avgCloseBias.toFixed(2)} (directional bias to watch)`
                  : avgCloseBias < -0.2 ? `Model historically tends to UNDERESTIMATE by ${Math.abs(avgCloseBias).toFixed(2)} (directional bias to watch)`
                  : 'Close bias is NEUTRAL - no correction needed';

    const hlDir = avgHlError >  5 ? `Candles are ${avgHlError.toFixed(1)}% too WIDE � NARROW your H-L range by ~${avgHlError.toFixed(0)}%`
               : avgHlError < -5 ? `Candles are ${Math.abs(avgHlError).toFixed(1)}% too NARROW � WIDEN your H-L range by ~${Math.abs(avgHlError).toFixed(0)}%`
               : 'H-L range accuracy is GOOD � no correction needed';

    const corrPct = (correctionStrength * 100).toFixed(0);
    const regimeLines = regimeBreakdown?.map(r =>
        `  ${(r.regime || 'normal').padEnd(10)} | ${r.bars_scored} bars | MAPE ${Number(r.avg_mape || 0).toFixed(2)}% | CloseDrift ${Number(r.avg_close_bias || 0) >= 0 ? '+' : ''}${Number(r.avg_close_bias || 0).toFixed(2)}`
    ).join('\n') ?? '  No regime data yet.';

    return `=== YOUR PACE CALIBRATION PROFILE (PERMANENT MEMORY � DO NOT IGNORE) ===
Instrument    : ${instrumentKey}
Timeframe     : ${timeframe}
Bars Scored   : ${barsScored} (across ${sessionsScored} sessions)
Correction    : ${corrPct}% strength active (reaches 100% after 20 scored bars)

YOUR HISTORICAL ACCURACY:
  Overall DA   : ${avgDa.toFixed(1)}% (${avgDa >= 65 ? 'STRONG' : avgDa >= 50 ? 'MODERATE' : 'WEAK � improve directional reasoning'})
  Bullish DA   : ${bullishDa ? bullishDa + '%' : 'N/A (not enough data)'}
  Bearish DA   : ${bearishDa ? bearishDa + '%' : 'N/A (not enough data)'}
  Avg MAPE     : ${avgMape.toFixed(2)}%

SYSTEMATIC ERRORS YOU MUST CORRECT:
  Close Bias   : ${biasDir}
  Range Bias   : ${hlDir}

REGIME PERFORMANCE:
${regimeLines}

CRITICAL INSTRUCTION: A ${corrPct}% mathematical bias correction will be applied
deterministically to output prices by the PACE post-processing layer. Do NOT manually subtract
or add numerical price offsets to the JSON values (the post-processor handles price levels).
Focus your chain-of-thought on directional conviction, inflection timing, and risk levels
based on which DA (bullish/bearish) is weaker above.
===`;
}
