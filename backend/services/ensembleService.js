/**
 * @file ensembleService.js
 * @purpose HTTP client for the Praxis Python Ensemble microservice (port 7174).
 *
 * This service is the Node.js bridge that calls the Python ensemble service.
 * It is designed to fail gracefully — if the Python service is down, the caller
 * falls back to the 2-member FutureVision + baseline combiner already in
 * futureVisionService.js.
 *
 * Endpoints called:
 *   GET  http://localhost:7174/readiness  — health check
 *   GET  http://localhost:7174/members   — list model readiness
 *   POST http://localhost:7174/forecast  — run full ensemble prediction
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESEARCH_DIR = path.resolve(__dirname, '..', '..', '..', 'praxis-research');
const isWin = process.platform === 'win32';
const PYTHONW_EXE = path.join(RESEARCH_DIR, '.venv', isWin ? 'Scripts' : 'bin', isWin ? 'pythonw.exe' : 'python3');
const PYTHON_CONSOLE_EXE = path.join(RESEARCH_DIR, '.venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python3');
const PYTHON_EXE = (isWin && fs.existsSync(PYTHONW_EXE)) ? PYTHONW_EXE : PYTHON_CONSOLE_EXE;
const RUN_SCRIPT = path.join(RESEARCH_DIR, 'run_ensemble.py');

const LAG_LLAMA_PYTHONW = path.join(RESEARCH_DIR, 'lag_llama_venv', isWin ? 'Scripts' : 'bin', isWin ? 'pythonw.exe' : 'python3');
const LAG_LLAMA_PYTHON_CONSOLE = path.join(RESEARCH_DIR, 'lag_llama_venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python3');
const LAG_LLAMA_PYTHON = (isWin && fs.existsSync(LAG_LLAMA_PYTHONW)) ? LAG_LLAMA_PYTHONW : LAG_LLAMA_PYTHON_CONSOLE;
const LAG_LLAMA_SCRIPT = path.join(RESEARCH_DIR, 'run_lag_llama.py');

const ENSEMBLE_BASE_URL = process.env.ENSEMBLE_URL || 'http://127.0.0.1:7174';
const FORECAST_TIMEOUT_MS = 120_000; // 2 minutes — CPU inference is slow

let _spawnPromise = null;
let _lastFailedSpawn = 0;

/**
 * Ensures the isolated Lag-Llama microservice is running on port 7175.
 */
export async function ensureLagLlamaRunning() {
    try {
        const res = await fetch('http://127.0.0.1:7175/health', { signal: AbortSignal.timeout(1500) });
        if (res.ok) return true;
    } catch {}

    if (fs.existsSync(LAG_LLAMA_PYTHON) && fs.existsSync(LAG_LLAMA_SCRIPT)) {
        try {
            console.log('[EnsembleService] Auto-starting Lag-Llama microservice on port 7175...');
            const logFd = fs.openSync(path.join(RESEARCH_DIR, 'lag_llama.log'), 'a');
            const child = spawn(LAG_LLAMA_PYTHON, [LAG_LLAMA_SCRIPT], {
                cwd: RESEARCH_DIR,
                detached: true,
                stdio: ['ignore', logFd, logFd],
                windowsHide: true,
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
            });
            child.unref();
        } catch (err) {
            console.warn('[EnsembleService] Could not auto-start Lag-Llama service:', err.message);
        }
    }
}

/**
 * Ensures the Python ensemble microservice is running.
 * If offline, auto-spawns it and polls until healthy.
 */
export async function ensureEnsembleRunning() {
    // Also ensure the isolated Lag-Llama satellite is alive
    ensureLagLlamaRunning().catch(() => {});

    const check = await getEnsembleReadiness();
    if (check.online) return check;

    // Cooldown: Do not spam respawn attempts if it failed or timed out within the last 60 seconds
    if (Date.now() - _lastFailedSpawn < 60_000) {
        return { online: false, status: 'cooling_down', members: [] };
    }

    if (_spawnPromise) return _spawnPromise;

    _spawnPromise = (async () => {
        try {
            if (!fs.existsSync(PYTHON_EXE) || !fs.existsSync(RUN_SCRIPT)) {
                console.warn(`[EnsembleService] Cannot auto-start ensemble: python or run_ensemble.py not found at ${RESEARCH_DIR}`);
                return { online: false, status: 'missing_files', members: [] };
            }

            console.log(`[EnsembleService] Auto-starting Python foundation model ensemble service on port 7174...`);
            const logPath = path.join(RESEARCH_DIR, 'ensemble.log');
            const logFd = fs.openSync(logPath, 'a');

            const child = spawn(PYTHON_EXE, [RUN_SCRIPT], {
                cwd: RESEARCH_DIR,
                detached: true,
                stdio: ['ignore', logFd, logFd],
                windowsHide: true
            });
            child.unref();

            for (let i = 0; i < 50; i++) {
                await new Promise(r => setTimeout(r, 1000));
                const ready = await getEnsembleReadiness();
                if (ready.online) {
                    console.log(`[EnsembleService] Python foundation model ensemble service is ONLINE on port 7174 (${ready.status})`);
                    return ready;
                }
            }
            console.warn('[EnsembleService] Python ensemble service auto-start timed out waiting for readiness.');
            _lastFailedSpawn = Date.now();
            return { online: false, status: 'timeout', members: [] };
        } catch (err) {
            console.error('[EnsembleService] Failed to auto-start python ensemble:', err.message);
            _lastFailedSpawn = Date.now();
            return { online: false, status: 'error', error: err.message, members: [] };
        } finally {
            _spawnPromise = null;
        }
    })();

    return _spawnPromise;
}

/**
 * Check if the Python ensemble service is online and healthy.
 * @returns {Promise<{online: boolean, status: string, members: Array}>}
 */
export async function getEnsembleReadiness() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${ENSEMBLE_BASE_URL}/readiness`, {
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
            return { online: false, status: 'error', members: [] };
        }

        const data = await res.json();
        return {
            online: true,
            status: data.status,     // 'ok' or 'degraded'
            members: data.members || [],
        };
    } catch {
        return { online: false, status: 'offline', members: [] };
    }
}

/**
 * Get the list of registered ensemble members and their readiness.
 * @returns {Promise<Array<{model_id: string, is_ready: boolean, default_weight: number}>>}
 */
export async function getEnsembleMembers() {
    try {
        const res = await fetch(`${ENSEMBLE_BASE_URL}/members`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.members || [];
    } catch {
        return [];
    }
}

/**
 * Call the Python ensemble service to get quantile forecasts from all 4 members.
 *
 * @param {object} params
 * @param {string} params.instrument    — e.g. "NSE_INDEX|Nifty 50"
 * @param {string} params.timeframe     — e.g. "day", "15minute"
 * @param {Array}  params.candles       — [{timestamp, open, high, low, close, volume}]
 * @param {number} params.horizon       — steps ahead (default 1)
 * @param {object} [params.weights]     — optional override Hedge weights {model_id: weight}
 *
 * @returns {Promise<{
 *   success: boolean,
 *   ensemble: object|null,     — EnsembleForecast (candles, member_weights, regime, n_members)
 *   members: Array,            — per-member ModelForecast results
 *   regime: string,
 *   total_ms: number,
 *   error: string|null,
 * }>}
 */
export async function callEnsembleService({ instrument, timeframe, candles, horizon = 1, weights }, retry = true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FORECAST_TIMEOUT_MS);

    try {
        const body = {
            instrument,
            timeframe,
            candles,
            horizon,
            ...(weights ? { weights } : {}),
        };

        const res = await fetch(`${ENSEMBLE_BASE_URL}/forecast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
            const text = await res.text();
            return {
                success: false,
                ensemble: null,
                members: [],
                regime: 'CHOPPY',
                total_ms: 0,
                error: `Ensemble service HTTP ${res.status}: ${text}`,
            };
        }

        const data = await res.json();
        return {
            success: true,
            ensemble: data.ensemble,
            members: data.members || [],
            regime: data.regime || 'CHOPPY',
            total_ms: data.total_ms || 0,
            error: null,
        };

    } catch (err) {
        clearTimeout(timeout);
        const isTimeout = err.name === 'AbortError';
        
        // Auto-heal: If offline and retry enabled, start service and try once more
        if (!isTimeout && retry) {
            console.log(`[EnsembleService] Microservice offline (${err.message}). Attempting auto-heal...`);
            const ready = await ensureEnsembleRunning();
            if (ready.online) {
                return callEnsembleService({ instrument, timeframe, candles, horizon, weights }, false);
            }
        }

        return {
            success: false,
            ensemble: null,
            members: [],
            regime: 'CHOPPY',
            total_ms: 0,
            error: isTimeout
                ? `Ensemble service timed out after ${FORECAST_TIMEOUT_MS / 1000}s`
                : `Ensemble service unreachable: ${err.message}`,
        };
    }
}
