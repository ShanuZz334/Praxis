/**
 * @file finetuneService.js
 * @purpose Service for querying auto-fine-tuning readiness states, history,
 *          and triggering non-blocking retraining subprocesses.
 */

import db from '../config/localDb.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { normalizeTimeframe } from './predictionResolutionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Anchored paths to python venv and worker script
// services -> backend (1) -> Praxis (2) -> ALLBACKUP (3) -> praxis-research
const RESEARCH_DIR = path.resolve(__dirname, '..', '..', '..', 'praxis-research');
const PYTHON_EXE = path.join(RESEARCH_DIR, '.venv', 'Scripts', 'python.exe');
const WORKER_SCRIPT = path.join(RESEARCH_DIR, 'praxis-ensemble', 'finetune', 'worker.py');

const DEFAULT_MODELS = ['kronos', 'chronos_bolt', 'lag_llama'];

/**
 * Ensure readiness_state rows exist for this asset and timeframe.
 */
function _ensureReadinessSeed(instrument, timeframe) {
    try {
        const check = db.prepare(`SELECT COUNT(*) as cnt FROM readiness_state WHERE instrument = ? AND timeframe = ?`).get(instrument, timeframe);
        if (check && check.cnt > 0) return;

        const insert = db.prepare(`
            INSERT OR IGNORE INTO readiness_state 
            (model_id, instrument, timeframe, data_pct, train_pct, validation_pct, calibration_pct, overall_pct, stage, eta_text, updated_at)
            VALUES (?, ?, ?, 100.0, 0.0, 0.0, 0.0, 30.0, 'READY_TO_TRAIN', 'Ready to Train', CURRENT_TIMESTAMP)
        `);

        for (const m of DEFAULT_MODELS) {
            insert.run(m, instrument, timeframe);
        }
    } catch (err) {
        console.warn('[FinetuneService] Readiness seed warning:', err.message);
    }
}

/**
 * Retrieve current readiness state for all models on a given asset.
 */
export function getFinetuneStatus(instrument = 'NSE_INDEX|Nifty 50', rawTimeframe = 'day') {
    const timeframe = normalizeTimeframe(rawTimeframe);
    try {
        _ensureReadinessSeed(instrument, timeframe);

        const stmt = db.prepare(`
            SELECT 
                rs.model_id, rs.instrument, rs.timeframe, rs.latest_finetune_version_id,
                rs.data_pct, rs.train_pct, rs.validation_pct, rs.calibration_pct, rs.overall_pct,
                rs.stage, rs.blocker, rs.eta_text, rs.updated_at,
                fv.version_num, fv.status as version_status, fv.val_pinball_loss, fv.zero_shot_pinball_loss,
                fv.improvement_vs_zero_shot_pct, fv.val_coverage_80, fv.error_breakdown,
                av.active_version_id,
                (
                    SELECT AVG(weight) FROM model_weights mw 
                    WHERE mw.model_id = rs.model_id AND mw.instrument = rs.instrument AND mw.timeframe = rs.timeframe
                ) as current_weight,
                (
                    SELECT MAX(is_probation) FROM model_weights mw 
                    WHERE mw.model_id = rs.model_id AND mw.instrument = rs.instrument AND mw.timeframe = rs.timeframe
                ) as is_probation
            FROM readiness_state rs
            LEFT JOIN finetune_versions fv ON rs.latest_finetune_version_id = fv.id
            LEFT JOIN active_versions av ON rs.model_id = av.model_id AND rs.instrument = av.instrument AND rs.timeframe = av.timeframe
            WHERE rs.instrument = ? AND rs.timeframe = ?
            ORDER BY rs.model_id ASC
        `);

        let rows = stmt.all(instrument, timeframe);
        if (!rows || rows.length === 0) {
            // Fallback: seed and re-query
            _ensureReadinessSeed(instrument, timeframe);
            rows = stmt.all(instrument, timeframe);
        }

        return {
            instrument,
            timeframe,
            models: (rows && rows.length > 0) ? rows.map(r => ({
                model_id: r.model_id,
                stage: r.stage,
                overall_pct: r.overall_pct,
                data_pct: r.data_pct,
                train_pct: r.train_pct,
                validation_pct: r.validation_pct,
                calibration_pct: r.calibration_pct,
                blocker: r.blocker,
                eta_text: r.eta_text,
                current_weight: r.current_weight || 0.25,
                is_probation: Boolean(r.is_probation),
                active_version: r.active_version_id ? {
                    version_num: r.version_num,
                    status: r.version_status,
                    val_loss: r.val_pinball_loss,
                    zero_shot_loss: r.zero_shot_pinball_loss,
                    improvement_pct: r.improvement_vs_zero_shot_pct,
                    coverage_80: r.val_coverage_80,
                    error_breakdown: r.error_breakdown ? JSON.parse(r.error_breakdown) : null
                } : null,
                updated_at: r.updated_at
            })) : []
        };
    } catch (err) {
        console.error('[FinetuneService] Error getting finetune status:', err.message);
        return { instrument, timeframe, models: [], error: err.message };
    }
}

/**
 * Retrieve historical fine-tuning runs across versions.
 */
export function getFinetuneHistory(instrument = 'NSE_INDEX|Nifty 50', rawTimeframe = 'day', limit = 20) {
    const timeframe = normalizeTimeframe(rawTimeframe);
    try {
        const stmt = db.prepare(`
            SELECT 
                fv.id, fv.model_id, fv.instrument, fv.timeframe, fv.version_num, fv.status,
                fv.epochs_total, fv.epochs_completed, fv.val_pinball_loss, fv.zero_shot_pinball_loss,
                fv.live_baseline_pinball_loss, fv.improvement_vs_zero_shot_pct, fv.val_coverage_80,
                fv.rejection_reason, fv.started_at, fv.finished_at, fv.promoted_at,
                (av.active_version_id IS NOT NULL AND av.active_version_id = fv.id) as is_currently_active
            FROM finetune_versions fv
            LEFT JOIN active_versions av ON fv.id = av.active_version_id
            WHERE fv.instrument = ? AND fv.timeframe = ?
            ORDER BY fv.started_at DESC
            LIMIT ?
        `);

        return stmt.all(instrument, timeframe, limit);
    } catch (err) {
        console.error('[FinetuneService] Error getting finetune history:', err.message);
        return [];
    }
}

/**
 * Trigger an asynchronous, non-blocking fine-tuning run via worker.py subprocess.
 */
export function triggerFinetuneJob(model_id, instrument = 'NSE_INDEX|Nifty 50', rawTimeframe = 'day') {
    const timeframe = normalizeTimeframe(rawTimeframe);
    return new Promise((resolve, reject) => {
        try {
            if (!fs.existsSync(PYTHON_EXE)) {
                return reject(new Error(`Python virtual environment not found at: ${PYTHON_EXE}`));
            }
            if (!fs.existsSync(WORKER_SCRIPT)) {
                return reject(new Error(`Fine-tune worker script not found at: ${WORKER_SCRIPT}`));
            }

            // Check if training is already in progress
            const inProgress = db.prepare(`
                SELECT id, version_num FROM finetune_versions 
                WHERE model_id = ? AND instrument = ? AND timeframe = ? AND status = 'TRAINING'
            `).get(model_id, instrument, timeframe);

            if (inProgress) {
                return resolve({
                    success: false,
                    error: `Training for ${model_id} on ${instrument} (${timeframe}) is already in progress (Version v${inProgress.version_num}).`
                });
            }

            console.log(`[FinetuneService] Spawning fine-tune worker for ${model_id} on ${instrument}...`);
            const child = spawn(
                PYTHON_EXE,
                [
                    WORKER_SCRIPT,
                    '--trigger-model', model_id,
                    '--instrument', instrument,
                    '--timeframe', timeframe,
                ],
                { detached: true, stdio: 'ignore' }
            );

            child.on('error', (err) => {
                console.error('[FinetuneService] Subprocess failed to spawn:', err.message);
                try {
                    db.prepare(`
                        UPDATE readiness_state
                        SET stage = 'READY_TO_TRAIN', blocker = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE model_id = ? AND instrument = ? AND timeframe = ?
                    `).run(`Spawn failed: ${err.message}`, model_id, instrument, timeframe);
                } catch (_) {}
            });

            child.unref();

            resolve({
                success: true,
                message: `Retraining job initiated in isolated background worker for ${model_id}.`,
                model_id,
                instrument,
                timeframe
            });
        } catch (err) {
            console.error('[FinetuneService] Error triggering fine-tune job:', err.message);
            reject(err);
        }
    });
}
