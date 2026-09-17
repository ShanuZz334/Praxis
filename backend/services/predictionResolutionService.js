/**
 * @file predictionResolutionService.js
 * @purpose Service for recording, scoring, and updating multi-model predictions
 *          via the Hedge multiplicative-weights algorithm and Conformal calibration.
 */

import db from '../config/localDb.js';
import {
    QUANTILE_LEVELS,
    DEFAULT_ETA,
    MIN_WEIGHT_FLOOR,
    computeCandlePinballLoss,
    computeIntervalScore,
    computeConformityScore,
    updateHedgeWeights,
    fitConformalMultiplier,
    combineQuantiles
} from '../engine/predictionEngine.js';

// The 4 active Hedge ensemble members.
// future_vision is scored independently but NOT in this Hedge pool.
const DEFAULT_MODELS = ['naive_baseline', 'kronos', 'chronos_bolt', 'lag_llama'];

// Starting weights per user specification:
//   baseline at 0.30 (lowest cold-start variance, always available)
//   lag_llama at 0.20 (higher cold-start variance on NSE, calibrates over time)
const DEFAULT_WEIGHTS = {
    naive_baseline: 0.30,
    kronos:         0.25,
    chronos_bolt:   0.25,
    lag_llama:      0.20,
};

/**
 * Normalize timeframe strings across different conventions (e.g. '1d' vs 'day').
 */
export function normalizeTimeframe(tf) {
    if (!tf) return 'day';
    const s = String(tf).toLowerCase().trim();
    if (s === '1d' || s === 'd' || s === 'daily') return 'day';
    if (s === '15m' || s === '15min') return '15minute';
    if (s === '1m' || s === '1min') return '1minute';
    if (s === '5m' || s === '5min') return '5minute';
    if (s === '1w' || s === 'w' || s === 'weekly') return 'week';
    return s;
}

/**
 * Retrieve current normalized Hedge weights for a given instrument, timeframe, and regime.
 * 
 * @param {string} instrument - e.g. "NSE_INDEX|Nifty 50"
 * @param {string} timeframe - e.g. "day", "15minute"
 * @param {string} regime - e.g. "CHOPPY", "TRENDING_UP", "TRENDING_DOWN", "VOLATILE_EXPANSION"
 * @returns {Array<{ model_id: string, weight: number }>}
 */
export function getModelWeights(instrument, timeframe, regime = 'CHOPPY') {
    const tf = normalizeTimeframe(timeframe);
    try {
        const stmt = db.prepare(`
            SELECT model_id, weight, n_resolved, rolling_loss_20
            FROM model_weights
            WHERE instrument = ? AND timeframe = ? AND regime = ?
        `);
        const rows = stmt.all(instrument, tf, regime);

        if (rows.length > 0) {
            // Renormalize stored weights
            const total = rows.reduce((s, r) => s + (r.weight || 0), 0);
            return rows.map(r => ({
                model_id: r.model_id,
                weight: total > 0 ? Number((r.weight / total).toFixed(4)) : (1.0 / rows.length),
                n_resolved: r.n_resolved,
                rolling_loss_20: r.rolling_loss_20
            }));
        }

        // Initialize default weights if no records exist yet (use DEFAULT_WEIGHTS, not uniform)
        const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO model_weights (model_id, instrument, timeframe, regime, weight, n_resolved)
            VALUES (?, ?, ?, ?, ?, 0)
        `);

        for (const mId of DEFAULT_MODELS) {
            const w = DEFAULT_WEIGHTS[mId] ?? (1.0 / DEFAULT_MODELS.length);
            insertStmt.run(mId, instrument, tf, regime, w);
        }

        return DEFAULT_MODELS.map(mId => ({
            model_id: mId,
            weight: DEFAULT_WEIGHTS[mId] ?? (1.0 / DEFAULT_MODELS.length),
            n_resolved: 0,
            rolling_loss_20: 0
        }));
    } catch (err) {
        console.error('[PredictionService] Error getting model weights:', err.message);
        return DEFAULT_MODELS.map(mId => ({
            model_id: mId,
            weight: DEFAULT_WEIGHTS[mId] ?? (1.0 / DEFAULT_MODELS.length),
            n_resolved: 0
        }));
    }
}

/**
 * Retrieve current calibration state (conformal multiplier and coverage).
 * 
 * @param {string} instrument 
 * @param {string} timeframe 
 * @returns {object}
 */
export function getCalibrationState(instrument, timeframe) {
    const tf = normalizeTimeframe(timeframe);
    try {
        const stmt = db.prepare(`
            SELECT conformal_multiplier, coverage_actual_80, window_size, updated_at
            FROM calibration_state
            WHERE instrument = ? AND timeframe = ?
        `);
        const row = stmt.get(instrument, tf);

        if (row) {
            return {
                instrument,
                timeframe: tf,
                conformal_multiplier: row.conformal_multiplier || 1.0,
                coverage_actual_80: row.coverage_actual_80 || 0.80,
                window_size: row.window_size || 200,
                updated_at: row.updated_at
            };
        }

        return {
            instrument,
            timeframe: tf,
            conformal_multiplier: 1.0,
            coverage_actual_80: 0.80,
            window_size: 200,
            updated_at: null
        };
    } catch (err) {
        console.error('[PredictionService] Error getting calibration state:', err.message);
        return {
            instrument,
            timeframe: tf,
            conformal_multiplier: 1.0,
            coverage_actual_80: 0.80,
            window_size: 200
        };
    }
}

/**
 * Persist a batch of model predictions and their combined ensemble forecast into SQLite.
 * 
 * @param {object} params
 * @param {string} params.instrument
 * @param {string} params.timeframe
 * @param {Date|string} params.predictedAt
 * @param {Date|string} params.targetCandleTime
 * @param {string} params.regime
 * @param {Array<{ model_id: string, weight: number, quantiles: object }>} params.modelPredictions
 * @param {object} params.ensembleQuantiles
 * @param {string} [params.featuresHash]
 * @returns {Array<number>} Array of inserted prediction IDs
 */
export function recordPredictions({
    instrument,
    timeframe,
    predictedAt = new Date().toISOString(),
    targetCandleTime,
    regime = 'CHOPPY',
    modelPredictions = [],
    ensembleQuantiles = null,
    featuresHash = null
}) {
    const tf = normalizeTimeframe(timeframe);
    const pAt = new Date(predictedAt).toISOString();
    const tTime = new Date(targetCandleTime).toISOString();

    const insertStmt = db.prepare(`
        INSERT INTO predictions (
            instrument, timeframe, predicted_at, target_candle_time, model_id,
            q10_o, q25_o, q50_o, q75_o, q90_o,
            q10_h, q25_h, q50_h, q75_h, q90_h,
            q10_l, q25_l, q50_l, q75_l, q90_l,
            q10_c, q25_c, q50_c, q75_c, q90_c,
            regime_at_prediction, weight_used, features_hash, status
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, 'PENDING'
        )
    `);

    const insertedIds = [];

    const insertTransaction = db.transaction(() => {
        // 1. Insert individual model predictions
        for (const mp of modelPredictions) {
            const q = mp.quantiles || {};
            const info = insertStmt.run(
                instrument, tf, pAt, tTime, mp.model_id,
                q.q10_o || null, q.q25_o || null, q.q50_o || null, q.q75_o || null, q.q90_o || null,
                q.q10_h || null, q.q25_h || null, q.q50_h || null, q.q75_h || null, q.q90_h || null,
                q.q10_l || null, q.q25_l || null, q.q50_l || null, q.q75_l || null, q.q90_l || null,
                q.q10_c || null, q.q25_c || null, q.q50_c || null, q.q75_c || null, q.q90_c || null,
                regime, mp.weight || 1.0, featuresHash
            );
            insertedIds.push(info.lastInsertRowid);
        }

        // 2. Insert ensemble combined quantiles if present
        if (ensembleQuantiles) {
            const eq = ensembleQuantiles;
            const info = insertStmt.run(
                instrument, tf, pAt, tTime, 'ensemble',
                eq.q10_o || null, eq.q25_o || null, eq.q50_o || null, eq.q75_o || null, eq.q90_o || null,
                eq.q10_h || null, eq.q25_h || null, eq.q50_h || null, eq.q75_h || null, eq.q90_h || null,
                eq.q10_l || null, eq.q25_l || null, eq.q50_l || null, eq.q75_l || null, eq.q90_l || null,
                eq.q10_c || null, eq.q25_c || null, eq.q50_c || null, eq.q75_c || null, eq.q90_c || null,
                regime, 1.0, featuresHash
            );
            insertedIds.push(info.lastInsertRowid);
        }
    });

    try {
        insertTransaction();
        return insertedIds;
    } catch (err) {
        console.error('[PredictionService] Failed to record predictions:', err.message);
        return [];
    }
}

/**
 * Resolve all pending predictions whose target candle has closed.
 * Fetches realized candle, scores pinball loss & conformity, and executes Hedge weight update.
 * 
 * @returns {Promise<{ resolvedCount: number, errorCount: number }>}
 */
export async function resolvePendingPredictions() {
    const nowIso = new Date().toISOString();

    // Query pending predictions where target_candle_time <= now
    const pendingQuery = db.prepare(`
        SELECT * FROM predictions
        WHERE status = 'PENDING' AND target_candle_time <= ?
        ORDER BY target_candle_time ASC
        LIMIT 200
    `);

    const pending = pendingQuery.all(nowIso);
    if (pending.length === 0) {
        return { resolvedCount: 0, errorCount: 0 };
    }

    let resolvedCount = 0;
    let errorCount = 0;

    // Group by (instrument, timeframe, target_candle_time) to resolve together
    const grouped = {};
    for (const pred of pending) {
        const key = `${pred.instrument}___${pred.timeframe}___${pred.target_candle_time}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(pred);
    }

    for (const [groupKey, preds] of Object.entries(grouped)) {
        const first = preds[0];
        const instrument = first.instrument;
        const timeframe = first.timeframe;
        const targetTime = first.target_candle_time;
        const regime = first.regime_at_prediction || 'CHOPPY';

        // 1. Fetch realized candle for this target time
        const actualCandle = _findRealizedCandle(instrument, timeframe, targetTime);
        if (!actualCandle) {
            // Candle hasn't arrived in DB yet, continue waiting unless it's older than 7 days
            const ageMs = Date.now() - new Date(targetTime).getTime();
            if (ageMs > 7 * 86400000) {
                db.prepare(`UPDATE predictions SET status = 'ORPHANED' WHERE id IN (${preds.map(p => p.id).join(',')})`).run();
            }
            continue;
        }

        // 2. Score each prediction independently
        const modelScores = [];

        const resolveTx = db.transaction(() => {
            const insertResolution = db.prepare(`
                INSERT OR REPLACE INTO resolutions (
                    prediction_id, actual_o, actual_h, actual_l, actual_c,
                    pinball_loss, interval_score, inside_80_interval, conformity_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const updateStatus = db.prepare(`UPDATE predictions SET status = 'RESOLVED' WHERE id = ?`);

            for (const pred of preds) {
                const loss = computeCandlePinballLoss(actualCandle, pred);
                const q10 = pred.q10_c || pred.q50_c;
                const q90 = pred.q90_c || pred.q50_c;
                const q50 = pred.q50_c || actualCandle.close;

                const intScore = computeIntervalScore(actualCandle.close, q10, q90, 0.20);
                const inside = (actualCandle.close >= q10 && actualCandle.close <= q90) ? 1 : 0;
                const confScore = computeConformityScore(actualCandle.close, q50, q10, q90);

                insertResolution.run(
                    pred.id,
                    actualCandle.open,
                    actualCandle.high,
                    actualCandle.low,
                    actualCandle.close,
                    loss,
                    intScore,
                    inside,
                    confScore
                );

                updateStatus.run(pred.id);
                resolvedCount++;

                if (pred.model_id !== 'ensemble') {
                    modelScores.push({
                        model_id: pred.model_id,
                        loss,
                        weight: pred.weight_used
                    });
                }
            }

            // 3. Update Hedge weights for this (instrument, timeframe, regime)
            if (modelScores.length > 0) {
                _applyHedgeUpdate(instrument, timeframe, regime, modelScores);
            }

            // 4. Update Conformal Calibration multiplier for this (instrument, timeframe)
            _updateCalibrationState(instrument, timeframe);
        });

        try {
            resolveTx();

            // 5. Automatically record continuous training sample from resolved candle
            _recordTrainingSampleFromResolution(instrument, timeframe, actualCandle, regime);

            // 6. Check live performance drift for each resolved model -> auto-revert if rolling loss > val loss * 1.25
            for (const ms of modelScores) {
                checkLiveDrift(ms.model_id, instrument, timeframe);
            }
        } catch (err) {
            console.error(`[PredictionService] Error resolving group ${groupKey}:`, err.message);
            errorCount++;
        }
    }

    return { resolvedCount, errorCount };
}

/**
 * Automatically record a training sample when a candle resolves,
 * maintaining the continuous training data pipeline.
 */
function _recordTrainingSampleFromResolution(instrument, timeframe, actualCandle, regime) {
    try {
        const tf = normalizeTimeframe(timeframe);
        const stmt = db.prepare(`
            SELECT open, high, low, close, volume, timestamp
            FROM candles
            WHERE instrument_key = ? AND timeframe = ? AND timestamp < ?
            ORDER BY timestamp DESC
            LIMIT 512
        `);
        const preceding = stmt.all(instrument, tf, actualCandle.timestamp);
        if (preceding.length < 512) return; // Need full 512 lookback window

        preceding.reverse(); // Chronological order: oldest to newest
        const context = preceding.map(c => ({
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
            volume: Number(c.volume || 0),
            amount: Number(c.close) * Number(c.volume || 0),
            timestamp: c.timestamp
        }));

        db.prepare(`
            INSERT OR IGNORE INTO training_samples (
                instrument, timeframe, candle_time, context_window,
                target_o, target_h, target_l, target_c, regime, feature_version, created_at, used_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, '[]')
        `).run(
            instrument,
            tf,
            actualCandle.timestamp,
            JSON.stringify(context),
            actualCandle.open,
            actualCandle.high,
            actualCandle.low,
            actualCandle.close,
            regime || 'CHOPPY'
        );
    } catch (err) {
        console.error('[PredictionService] Error recording training sample from resolution:', err.message);
    }
}

/**
 * Retrieve realized candle from localDb candles table.
 * Supports exact or nearest preceding candle within candle interval.
 */
function _findRealizedCandle(instrument, timeframe, targetTime) {
    try {
        const tf = normalizeTimeframe(timeframe);

        // First attempt: exact timestamp match
        let stmt = db.prepare(`
            SELECT open, high, low, close, timestamp
            FROM candles
            WHERE instrument_key = ? AND timeframe = ? AND timestamp = ?
            LIMIT 1
        `);
        let row = stmt.get(instrument, tf, targetTime);
        if (row) return row;

        // Second attempt: candle matching date or close in range
        const targetDate = targetTime.substring(0, 10);
        stmt = db.prepare(`
            SELECT open, high, low, close, timestamp
            FROM candles
            WHERE instrument_key = ? AND timeframe = ? AND timestamp LIKE ?
            ORDER BY timestamp DESC
            LIMIT 1
        `);
        row = stmt.get(instrument, tf, `${targetDate}%`);
        if (row) return row;

        // Third attempt: check quotes table if this is today's current session
        const todayStr = new Date().toISOString().substring(0, 10);
        if (targetDate === todayStr) {
            const qStmt = db.prepare(`SELECT open, high, low, close FROM quotes WHERE instrument_key = ?`);
            const qRow = qStmt.get(instrument);
            if (qRow && qRow.close > 0) {
                return {
                    open: qRow.open || qRow.close,
                    high: qRow.high || qRow.close,
                    low: qRow.low || qRow.close,
                    close: qRow.close,
                    timestamp: targetTime
                };
            }
        }

        return null;
    } catch (err) {
        console.error('[PredictionService] Error finding realized candle:', err.message);
        return null;
    }
}

/**
 * Internal: Apply Hedge weight update and persist to model_weights.
 */
function _applyHedgeUpdate(instrument, timeframe, regime, modelScores) {
    try {
        const currentWeights = getModelWeights(instrument, timeframe, regime);
        const weightMap = new Map(currentWeights.map(w => [w.model_id, w.weight]));

        const modelsForUpdate = modelScores.map(ms => ({
            model_id: ms.model_id,
            weight: weightMap.get(ms.model_id) || (1.0 / modelScores.length),
            loss: ms.loss
        }));

        const newWeights = updateHedgeWeights(modelsForUpdate, DEFAULT_ETA);

        const updateStmt = db.prepare(`
            INSERT INTO model_weights (model_id, instrument, timeframe, regime, weight, updated_at, rolling_loss_20, n_resolved)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 1)
            ON CONFLICT(model_id, instrument, timeframe, regime)
            DO UPDATE SET
                weight = excluded.weight,
                updated_at = CURRENT_TIMESTAMP,
                rolling_loss_20 = (rolling_loss_20 * 0.8) + (excluded.rolling_loss_20 * 0.2),
                n_resolved = n_resolved + 1
        `);

        for (const nw of newWeights) {
            const scoreObj = modelScores.find(s => s.model_id === nw.model_id);
            const lossVal = scoreObj ? scoreObj.loss : 0;
            updateStmt.run(nw.model_id, instrument, timeframe, regime, nw.weight, lossVal);
            // Check for live performance drift against validation baseline
            checkLiveDrift(nw.model_id, instrument, timeframe);
        }
    } catch (err) {
        console.error('[PredictionService] Error applying Hedge update:', err.message);
    }
}

/**
 * Internal: Recompute conformal multiplier and coverage over rolling 200 resolved samples.
 */
function _updateCalibrationState(instrument, timeframe) {
    try {
        const historyStmt = db.prepare(`
            SELECT r.conformity_score, r.inside_80_interval
            FROM resolutions r
            JOIN predictions p ON r.prediction_id = p.id
            WHERE p.instrument = ? AND p.timeframe = ? AND p.model_id = 'ensemble'
            ORDER BY r.resolved_at DESC
            LIMIT 200
        `);

        const rows = historyStmt.all(instrument, timeframe);
        if (rows.length < 5) return;

        const scores = rows.map(r => r.conformity_score);
        const multiplier = fitConformalMultiplier(scores, 0.80);
        const actualCoverage = rows.reduce((s, r) => s + r.inside_80_interval, 0) / rows.length;

        db.prepare(`
            INSERT INTO calibration_state (instrument, timeframe, conformal_multiplier, coverage_actual_80, window_size, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(instrument, timeframe)
            DO UPDATE SET
                conformal_multiplier = excluded.conformal_multiplier,
                coverage_actual_80 = excluded.coverage_actual_80,
                window_size = excluded.window_size,
                updated_at = CURRENT_TIMESTAMP
        `).run(instrument, timeframe, multiplier, Number(actualCoverage.toFixed(4)), rows.length);
    } catch (err) {
        console.error('[PredictionService] Error updating calibration state:', err.message);
    }
}

/**
 * Retrieve prediction history joined with resolutions.
 * 
 * @param {string} instrument 
 * @param {string} timeframe 
 * @param {number} limit 
 */
export function getPredictionHistory(instrument, timeframe, limit = 50) {
    try {
        const tf = normalizeTimeframe(timeframe);
        const stmt = db.prepare(`
            SELECT 
                p.id, p.instrument, p.timeframe, p.predicted_at, p.target_candle_time, p.model_id,
                p.q10_c, p.q50_c, p.q90_c, p.weight_used, p.status, p.regime_at_prediction,
                r.actual_c, r.pinball_loss, r.interval_score, r.inside_80_interval, r.conformity_score, r.resolved_at
            FROM predictions p
            LEFT JOIN resolutions r ON p.id = r.prediction_id
            WHERE p.instrument = ? AND p.timeframe = ?
            ORDER BY p.target_candle_time DESC
            LIMIT ?
        `);
        return stmt.all(instrument, tf, limit);
    } catch (err) {
        console.error('[PredictionService] Error getting prediction history:', err.message);
        return [];
    }
}

/**
 * Catch-up resolution pass on server startup.
 * Finds all PENDING predictions whose target_candle_time has passed while the app was offline,
 * and resolves them against closed candles in SQLite or quotes.
 */
export async function initStartupCatchup() {
    try {
        const pending = db.prepare(`
            SELECT COUNT(*) as count
            FROM predictions
            WHERE status = 'PENDING' AND target_candle_time <= CURRENT_TIMESTAMP
        `).get();

        if (pending && pending.count > 0) {
            console.log(`[StartupCatchup] Found ${pending.count} overdue pending predictions from offline period. Resolving...`);
            const result = await resolvePendingPredictions();
            console.log(`[StartupCatchup] Completed catch-up resolution: ${result.resolvedCount} resolved, ${result.errorCount} skipped.`);
            return result;
        } else {
            console.log('[StartupCatchup] No overdue pending predictions found.');
            return { resolvedCount: 0, errorCount: 0 };
        }
    } catch (err) {
        console.error('[StartupCatchup] Error during startup catch-up resolution:', err.message);
        return { error: err.message };
    }
}

/**
 * Evaluate if an actionable statistical edge exists over the naive random-walk baseline.
 * 
 * If naive_baseline has the highest Hedge weight and n_resolved >= 20,
 * directional edge is suppressed (edge_detected: false).
 * 
 * @param {string} instrument 
 * @param {string} timeframe 
 * @param {string} regime 
 * @returns {{
 *   edge_detected: boolean,
 *   edge_status: 'ALPHA_EDGE_DETECTED' | 'BASELINE_DOMINATES' | 'COLD_START',
 *   leading_model: string,
 *   baseline_weight: number,
 *   leading_weight: number,
 *   total_resolved: number,
 *   reason: string
 * }}
 */
export function getEdgeEvaluation(instrument, timeframe, regime = 'CHOPPY') {
    const weights = getModelWeights(instrument, timeframe, regime);
    if (!weights || weights.length === 0) {
        return {
            edge_detected: false,
            edge_status: 'COLD_START',
            leading_model: 'none',
            baseline_weight: 0,
            leading_weight: 0,
            total_resolved: 0,
            reason: 'No model weights found for this asset and regime'
        };
    }

    const baseline = weights.find(w => w.model_id === 'naive_baseline');
    const baselineWeight = baseline ? baseline.weight : 0;
    const sorted = [...weights].sort((a, b) => b.weight - a.weight);
    const leading = sorted[0];
    const maxResolved = Math.max(...weights.map(w => w.n_resolved || 0));

    // If cold start (under 20 resolutions)
    if (maxResolved < 20) {
        return {
            edge_detected: true,
            edge_status: 'COLD_START',
            leading_model: leading.model_id,
            baseline_weight: baselineWeight,
            leading_weight: leading.weight,
            total_resolved: maxResolved,
            reason: `Warm-up phase (${maxResolved}/20 resolved). Equal weighting initialized.`
        };
    }

    // If baseline has the highest weight
    if (leading.model_id === 'naive_baseline') {
        return {
            edge_detected: false,
            edge_status: 'BASELINE_DOMINATES',
            leading_model: 'naive_baseline',
            baseline_weight: baselineWeight,
            leading_weight: leading.weight,
            total_resolved: maxResolved,
            reason: `Baseline random-walk dominates with ${(leading.weight * 100).toFixed(1)}% weight in ${regime} regime. Statistical edge over noise is currently absent.`
        };
    }

    return {
        edge_detected: true,
        edge_status: 'ALPHA_EDGE_DETECTED',
        leading_model: leading.model_id,
        baseline_weight: baselineWeight,
        leading_weight: leading.weight,
        total_resolved: maxResolved,
        reason: `Alpha edge detected: ${leading.model_id} leads with ${(leading.weight * 100).toFixed(1)}% weight vs baseline ${(baselineWeight * 100).toFixed(1)}%.`
    };
}

/**
 * Retrieve active fine-tuned version info for a model, instrument, and timeframe.
 * Returns null if the model is currently using base weights.
 */
export function getActiveVersion(model_id, instrument, timeframe) {
    const tf = normalizeTimeframe(timeframe);
    try {
        const stmt = db.prepare(`
            SELECT av.model_id, av.instrument, av.timeframe, av.active_version_id, av.promoted_at,
                   fv.version_num, fv.status, fv.checkpoint_path, fv.val_pinball_loss, fv.zero_shot_pinball_loss
            FROM active_versions av
            JOIN finetune_versions fv ON av.active_version_id = fv.id
            WHERE av.model_id = ? AND av.instrument = ? AND av.timeframe = ?
        `);
        return stmt.get(model_id, instrument, tf) || null;
    } catch (err) {
        console.error('[PredictionService] Error getting active version:', err.message);
        return null;
    }
}

/**
 * Evaluate if live performance has drifted significantly from the candidate's validation score.
 * If rolling 20-loss exceeds validation loss by > 25% (after >= 50 resolved samples),
 * triggers automatic rollback to eternal zero-shot base weights.
 */
export function checkLiveDrift(model_id, instrument, timeframe) {
    const tf = normalizeTimeframe(timeframe);
    try {
        const active = getActiveVersion(model_id, instrument, tf);
        if (!active || !active.active_version_id) {
            return; // Model is using base weights, nothing to revert
        }

        const weightsStmt = db.prepare(`
            SELECT regime, rolling_loss_20, n_resolved
            FROM model_weights
            WHERE model_id = ? AND instrument = ? AND timeframe = ?
        `);
        const regimeWeights = weightsStmt.all(model_id, instrument, tf);
        if (!regimeWeights || regimeWeights.length === 0) return;

        const maxResolved = Math.max(...regimeWeights.map(w => w.n_resolved || 0));
        if (maxResolved < 50) return; // Need at least 50 live resolved predictions before judging drift

        const valLoss = active.val_pinball_loss;
        if (!valLoss || valLoss <= 0) return;

        // Check if rolling loss in any active regime exceeds val loss by 25%
        for (const rw of regimeWeights) {
            const rLoss = rw.rolling_loss_20 || 0;
            if ((rw.n_resolved || 0) >= 20 && rLoss > valLoss * 1.25) {
                const reason = `Live drift detected in [${rw.regime}]: rolling 20-loss (${rLoss.toFixed(4)}) > val loss * 1.25 (${(valLoss * 1.25).toFixed(4)})`;
                revertToBase(model_id, instrument, tf, reason, rLoss, valLoss);
                return;
            }
        }
    } catch (err) {
        console.error('[PredictionService] Error in checkLiveDrift:', err.message);
    }
}

/**
 * Revert a fine-tuned model back to base zero-shot weights.
 * Clears active_versions, marks version DRIFT_REVERTED, resets weights, and logs incident.
 */
export function revertToBase(model_id, instrument, timeframe, reason, rollingLoss20 = 0, valLoss = 0) {
    const tf = normalizeTimeframe(timeframe);
    const REGIMES = ['CHOPPY', 'TRENDING_UP', 'TRENDING_DOWN', 'VOLATILE_EXPANSION'];
    try {
        console.warn(`⚠️ [PredictionService] REVERTING ${model_id} on ${instrument} ${tf} TO BASE: ${reason}`);

        const tx = db.transaction(() => {
            const activeRow = db.prepare(`
                SELECT active_version_id FROM active_versions
                WHERE model_id = ? AND instrument = ? AND timeframe = ?
            `).get(model_id, instrument, tf);

            if (activeRow && activeRow.active_version_id) {
                db.prepare(`
                    UPDATE finetune_versions
                    SET status = 'DRIFT_REVERTED', retired_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(activeRow.active_version_id);
            }

            db.prepare(`
                INSERT INTO active_versions (model_id, instrument, timeframe, active_version_id, reverted_at, revert_reason)
                VALUES (?, ?, ?, NULL, CURRENT_TIMESTAMP, ?)
                ON CONFLICT(model_id, instrument, timeframe)
                DO UPDATE SET
                    active_version_id = NULL,
                    reverted_at = CURRENT_TIMESTAMP,
                    revert_reason = excluded.revert_reason
            `).run(model_id, instrument, tf, reason);

            const defaultWeight = DEFAULT_WEIGHTS[model_id] || 0.25;
            for (const r of REGIMES) {
                db.prepare(`
                    INSERT INTO model_weights (model_id, instrument, timeframe, regime, weight, is_probation, probation_started_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, 0, NULL, CURRENT_TIMESTAMP)
                    ON CONFLICT(model_id, instrument, timeframe, regime)
                    DO UPDATE SET weight = excluded.weight, is_probation = 0, probation_started_at = NULL, updated_at = CURRENT_TIMESTAMP
                `).run(model_id, instrument, tf, r, defaultWeight);
            }

            db.prepare(`
                INSERT INTO readiness_state (model_id, instrument, timeframe, stage, blocker, updated_at)
                VALUES (?, ?, ?, 'DRIFT_REVERTED', ?, CURRENT_TIMESTAMP)
                ON CONFLICT(model_id, instrument, timeframe)
                DO UPDATE SET
                    stage = 'DRIFT_REVERTED',
                    blocker = excluded.blocker,
                    updated_at = CURRENT_TIMESTAMP
            `).run(model_id, instrument, tf, reason);

            db.prepare(`
                INSERT INTO finetune_incidents (model_id, instrument, timeframe, reason, rolling_loss_20, val_loss, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(model_id, instrument, tf, reason, rollingLoss20, valLoss);
        });

        tx();
        return { success: true, reverted: true, reason };
    } catch (err) {
        console.error('[PredictionService] Error reverting to base:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Promote a candidate fine-tune version to live inference on probation.
 * Sets probation weight (0.10), updates active_versions and readiness_state.
 */
export function promoteCandidateVersion(versionId, probationWeight = 0.10) {
    try {
        const vStmt = db.prepare(`SELECT * FROM finetune_versions WHERE id = ?`);
        const version = vStmt.get(versionId);
        if (!version) throw new Error(`Fine-tune version ${versionId} not found`);

        const { model_id, instrument, timeframe, version_num } = version;
        const tf = normalizeTimeframe(timeframe);
        const REGIMES = ['CHOPPY', 'TRENDING_UP', 'TRENDING_DOWN', 'VOLATILE_EXPANSION'];

        const tx = db.transaction(() => {
            db.prepare(`
                UPDATE finetune_versions
                SET status = 'PROMOTED', promoted_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(versionId);

            db.prepare(`
                INSERT INTO active_versions (model_id, instrument, timeframe, active_version_id, promoted_at, reverted_at, revert_reason)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, NULL, NULL)
                ON CONFLICT(model_id, instrument, timeframe)
                DO UPDATE SET
                    active_version_id = excluded.active_version_id,
                    promoted_at = CURRENT_TIMESTAMP,
                    reverted_at = NULL,
                    revert_reason = NULL
            `).run(model_id, instrument, tf, versionId);

            for (const r of REGIMES) {
                db.prepare(`
                    INSERT INTO model_weights (model_id, instrument, timeframe, regime, weight, is_probation, probation_started_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ON CONFLICT(model_id, instrument, timeframe, regime)
                    DO UPDATE SET weight = excluded.weight, is_probation = 1, probation_started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                `).run(model_id, instrument, tf, r, probationWeight);
            }

            db.prepare(`
                INSERT INTO readiness_state (
                    model_id, instrument, timeframe, latest_finetune_version_id,
                    data_pct, train_pct, validation_pct, calibration_pct, overall_pct,
                    stage, blocker, eta_text, updated_at
                )
                VALUES (?, ?, ?, ?, 100, 100, 100, 100, 100, 'PROMOTED', NULL, 'Live on Probation', CURRENT_TIMESTAMP)
                ON CONFLICT(model_id, instrument, timeframe)
                DO UPDATE SET
                    latest_finetune_version_id = excluded.latest_finetune_version_id,
                    data_pct = 100,
                    train_pct = 100,
                    validation_pct = 100,
                    calibration_pct = 100,
                    overall_pct = 100,
                    stage = 'PROMOTED',
                    blocker = NULL,
                    eta_text = 'Live on Probation',
                    updated_at = CURRENT_TIMESTAMP
            `).run(model_id, instrument, tf, versionId);
        });

        tx();
        console.log(`🚀 [PredictionService] Version ${version_num} of ${model_id} PROMOTED to live on probation (weight=${probationWeight}).`);
        return { success: true, promotedVersionId: versionId };
    } catch (err) {
        console.error('[PredictionService] Error promoting version:', err.message);
        return { success: false, error: err.message };
    }
}

