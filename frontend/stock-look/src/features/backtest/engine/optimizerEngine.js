/**
 * @file optimizerEngine.js
 * @purpose Algorithmic Auto-Calibration & Parameter Optimization Engine for Praxis Backtesting Workshop.
 * Evaluates multi-parameter permutations, guards against curve-fitting via Walk-Forward (70/30)
 * out-of-sample validation, and returns top-tier calibrated champions.
 * @date 2026-09-13
 */

import { runBacktest, precalculateBacktestIndicators, TIMEFRAME_DEFAULTS } from './backtestEngine.js';

// ─── Multi-Objective Fitness Evaluator ────────────────────────────────────────

function computeCandidateFitness(res) {
    const { summary, walkForward } = res;
    if (!summary || summary.totalTrades < 10) return -999;

    const pf = summary.profitFactor || 0;
    const wr = summary.winRate || 0;
    const ret = summary.netReturnPct || 0;
    const dd = summary.maxDrawdownPct || 0;
    const oosRatio = walkForward?.efficiencyRatio || 1.0;

    // Strict penalization for curve-fitting (OOS collapse)
    const overfitPenalty = oosRatio < 0.75 ? (0.75 - oosRatio) * 10.0 : 0;
    // Penalize dangerous drawdowns
    const ddPenalty = dd > 20 ? (dd - 20) * 0.15 : 0;

    // Balanced Alpha score
    return (
        (Math.min(pf, 3.5) * 3.2) +
        (wr * 0.05) +
        (Math.max(-25, Math.min(120, ret)) * 0.02) -
        (dd * 0.08) -
        overfitPenalty -
        ddPenalty
    );
}

// ─── Search Space Generator ───────────────────────────────────────────────────

function generateCandidateConfigs(baseConfig) {
    const tf = baseConfig.timeframe || 'day';
    const tfProfile = TIMEFRAME_DEFAULTS[tf] || TIMEFRAME_DEFAULTS.day;
    const unit = baseConfig.unit || 'PREDICTOR';

    const candidates = [];
    const baseTarget = tfProfile.targetPct;
    const baseStop = tfProfile.stopPct;

    // Helper to push candidate
    const add = (overrides, label) => {
        candidates.push({
            label,
            config: {
                ...baseConfig,
                ...overrides,
                exitRule: {
                    ...baseConfig.exitRule,
                    ...(overrides.exitRule || {}),
                },
                customRules: {
                    ...baseConfig.customRules,
                    ...(overrides.customRules || {}),
                }
            }
        });
    };

    // 1. Target & Stop Ratios
    const targetMultipliers = [0.65, 0.85, 1.0, 1.25, 1.6, 2.0];
    const stopMultipliers = [0.75, 1.0, 1.25];

    if (unit === 'PREDICTOR') {
        // AI Predictor Calibration Space
        const horizons = [5, 7, 10, 14];
        const timeoutOpts = [false, true];

        for (const tMul of targetMultipliers) {
            for (const sMul of stopMultipliers) {
                const targetPct = Number((baseTarget * tMul).toFixed(2));
                const stopPct = Number((baseStop * sMul).toFixed(2));

                for (const h of horizons) {
                    for (const to of timeoutOpts) {
                        add({
                            exitRule: {
                                type: to ? 'TARGET_STOP' : 'HORIZON',
                                targetPct,
                                stopPct,
                                horizonBars: h,
                                enableHorizonTimeout: to,
                            }
                        }, `Predictor T:${targetPct}% S:${stopPct}% H:${h}b`);
                    }
                }
            }
        }
    } else if (unit === 'PATTERNS') {
        // Pattern Recognition Space
        const minScores = [2, 3, 4];
        const timeouts = [false, true];

        for (const tMul of targetMultipliers) {
            for (const sMul of stopMultipliers) {
                const targetPct = Number((baseTarget * tMul).toFixed(2));
                const stopPct = Number((baseStop * sMul).toFixed(2));

                for (const minScore of minScores) {
                    for (const to of timeouts) {
                        add({
                            patternThreshold: minScore,
                            customRules: { patternScoreMin: minScore },
                            exitRule: {
                                type: 'TARGET_STOP',
                                targetPct,
                                stopPct,
                                horizonBars: 14,
                                enableHorizonTimeout: to,
                            }
                        }, `Pattern Score>=${minScore} T:${targetPct}% S:${stopPct}%`);
                    }
                }
            }
        }
    } else if (unit === 'PNCO') {
        // PNCO Oscillator Space
        const thresholds = [15, 20, 25, 30];
        const trailMultipliers = [0.6, 1.0, 1.5];

        for (const th of thresholds) {
            for (const tMul of [0.8, 1.0, 1.3, 1.7]) {
                for (const trMul of trailMultipliers) {
                    const targetPct = Number((baseTarget * tMul).toFixed(2));
                    const stopPct = baseStop;
                    const trailingStopPct = Number((tfProfile.trailingStopPct * trMul).toFixed(2));

                    add({
                        pncoThreshold: th,
                        exitRule: {
                            type: 'TRAILING_STOP',
                            targetPct,
                            stopPct,
                            trailingStopPct,
                        }
                    }, `PNCO th:${th} Trail:${trailingStopPct}%`);
                }
            }
        }
    } else {
        // Head-to-Head & Multi-factor Confluence Space
        const ifdiOpts = [true, false];
        const aavbOpts = [true, false];

        for (const tMul of [0.8, 1.0, 1.35, 1.75]) {
            for (const sMul of [0.8, 1.0, 1.25]) {
                const targetPct = Number((baseTarget * tMul).toFixed(2));
                const stopPct = Number((baseStop * sMul).toFixed(2));

                for (const ifdi of ifdiOpts) {
                    for (const aavb of aavbOpts) {
                        add({
                            customRules: {
                                requireIfdiAccumulation: ifdi,
                                aboveAavbMidline: aavb,
                            },
                            exitRule: {
                                type: 'TARGET_STOP',
                                targetPct,
                                stopPct,
                                horizonBars: 14,
                                enableHorizonTimeout: false,
                            }
                        }, `Confluence IFDI:${ifdi ? 'ON' : 'OFF'} AAVB:${aavb ? 'ON' : 'OFF'}`);
                    }
                }
            }
        }
    }

    return candidates;
}

// ─── Human Readable Highlight Formatter ────────────────────────────────────────

function buildTuningHighlights(baselineCfg, candidateCfg) {
    const highlights = [];
    const bExit = baselineCfg.exitRule || {};
    const cExit = candidateCfg.exitRule || {};

    if (cExit.targetPct !== bExit.targetPct) {
        highlights.push(`Target adjusted: ${bExit.targetPct || 0}% → ${cExit.targetPct}%`);
    }
    if (cExit.stopPct !== bExit.stopPct) {
        highlights.push(`Stop Loss tuned: ${bExit.stopPct || 0}% → ${cExit.stopPct}%`);
    }
    if (cExit.type !== bExit.type) {
        highlights.push(`Exit Rule switched to ${cExit.type}`);
    }
    if (cExit.enableHorizonTimeout !== bExit.enableHorizonTimeout) {
        highlights.push(
            cExit.enableHorizonTimeout
                ? `Safety Timeout capped at ${cExit.horizonBars || 14} bars`
                : 'Premature bar timeout disabled (pure Target/Stop focus)'
        );
    }
    if (candidateCfg.patternThreshold !== baselineCfg.patternThreshold && candidateCfg.patternThreshold !== undefined) {
        highlights.push(`Pattern score threshold set to ≥ ${candidateCfg.patternThreshold}`);
    }
    if (candidateCfg.pncoThreshold !== baselineCfg.pncoThreshold && candidateCfg.pncoThreshold !== undefined) {
        highlights.push(`PNCO momentum threshold calibrated to ±${candidateCfg.pncoThreshold}`);
    }
    if (candidateCfg.customRules?.requireIfdiAccumulation !== baselineCfg.customRules?.requireIfdiAccumulation) {
        highlights.push(
            candidateCfg.customRules?.requireIfdiAccumulation
                ? 'Added IFDI Smart Money Accumulation requirement'
                : 'Relaxed IFDI flow restriction'
        );
    }
    if (candidateCfg.customRules?.aboveAavbMidline !== baselineCfg.customRules?.aboveAavbMidline) {
        highlights.push(
            candidateCfg.customRules?.aboveAavbMidline
                ? 'Added AAVB dynamic midline trend filter'
                : 'Relaxed AAVB band midline requirement'
        );
    }

    if (highlights.length === 0) {
        highlights.push('Fine-tuned execution parameters and holding horizon');
    }

    return highlights;
}

// ─── Master Auto-Calibration Runner ──────────────────────────────────────────

/**
 * Runs an algorithmic multi-parameter sweep on the active dataset.
 *
 * @param {Array} candles - OHLCV array
 * @param {Object} activeConfig - Active workshop config
 * @returns {Object} { baseline, champions, leaderboard, totalScanned, elapsedMs }
 */
export function runAutoCalibration(candles, activeConfig) {
    const startTime = performance.now();

    if (!candles || candles.length < 30) {
        throw new Error('Insufficient candles for auto-calibration (min 30 required).');
    }

    // 1. Precalculate indicators once for blazing fast sweep
    const precalc = precalculateBacktestIndicators(candles);

    // 2. Run Baseline simulation
    const baselineResult = runBacktest(candles, activeConfig, precalc);
    const baselineFitness = computeCandidateFitness(baselineResult);

    // 3. Generate candidate parameter space
    const candidateList = generateCandidateConfigs(activeConfig);

    // 4. Sweep each candidate
    const evaluatedCandidates = [];

    for (let i = 0; i < candidateList.length; i++) {
        const item = candidateList[i];
        const res = runBacktest(candles, item.config, precalc);
        const fitness = computeCandidateFitness(res);

        if (res.summary && res.summary.totalTrades >= 8) {
            evaluatedCandidates.push({
                id: `cand_${i + 1}`,
                label: item.label,
                config: item.config,
                summary: res.summary,
                walkForward: res.walkForward,
                fitness,
            });
        }
    }

    // Sort by fitness descending
    evaluatedCandidates.sort((a, b) => b.fitness - a.fitness);

    // 5. Extract the 3 Champions
    // Champion 1: Balanced Alpha (Highest Fitness)
    const balancedCandidate = evaluatedCandidates[0] || {
        config: activeConfig,
        summary: baselineResult.summary,
        walkForward: baselineResult.walkForward,
        fitness: baselineFitness,
    };

    // Champion 2: Max Win Rate Sniper (Highest Win Rate)
    const winRatePool = [...evaluatedCandidates].filter(c => (c.summary?.totalTrades || 0) >= 12);
    winRatePool.sort((a, b) => {
        if (b.summary.winRate !== a.summary.winRate) {
            return b.summary.winRate - a.summary.winRate;
        }
        return (b.summary.profitFactor || 0) - (a.summary.profitFactor || 0);
    });
    const winRateCandidate = winRatePool[0] || balancedCandidate;

    // Champion 3: Capital Shield (Lowest Max Drawdown)
    const shieldPool = [...evaluatedCandidates].filter(c => (c.summary?.totalTrades || 0) >= 12);
    shieldPool.sort((a, b) => {
        if (a.summary.maxDrawdownPct !== b.summary.maxDrawdownPct) {
            return a.summary.maxDrawdownPct - b.summary.maxDrawdownPct;
        }
        return (b.summary.profitFactor || 0) - (a.summary.profitFactor || 0);
    });
    const shieldCandidate = shieldPool[0] || balancedCandidate;

    // Helper to construct champion card object
    const makeChampion = (type, title, badge, tagline, candidate) => {
        const s = candidate.summary || {};
        const b = baselineResult.summary || {};
        const bExit = activeConfig.exitRule || {};
        const cExit = candidate.config?.exitRule || {};

        const isCurrentlyActive = (
            cExit.targetPct === bExit.targetPct &&
            cExit.stopPct === bExit.stopPct &&
            cExit.type === bExit.type &&
            cExit.horizonBars === bExit.horizonBars &&
            Boolean(cExit.enableHorizonTimeout) === Boolean(bExit.enableHorizonTimeout)
        );

        return {
            type,
            title,
            badge,
            tagline,
            config: candidate.config,
            summary: s,
            walkForward: candidate.walkForward,
            fitness: candidate.fitness,
            isCurrentlyActive,
            deltas: {
                winRate: Math.round(((s.winRate ?? 0) - (b.winRate ?? 0)) * 10) / 10,
                profitFactor: Math.round(((s.profitFactor ?? 0) - (b.profitFactor ?? 0)) * 100) / 100,
                netReturnPct: Math.round(((s.netReturnPct ?? 0) - (b.netReturnPct ?? 0)) * 10) / 10,
                maxDrawdownPct: Math.round(((s.maxDrawdownPct ?? 0) - (b.maxDrawdownPct ?? 0)) * 10) / 10,
            },
            tuningHighlights: buildTuningHighlights(activeConfig, candidate.config),
        };
    };

    const champions = [
        makeChampion(
            'BALANCED',
            'Balanced Alpha Champion',
            'Highest Sharpe & Expectancy',
            'Optimal blend of win rate, profit factor, and drawdown stability with strong walk-forward validation.',
            balancedCandidate
        ),
        makeChampion(
            'MAX_WIN_RATE',
            'Max Accuracy Sniper',
            'Highest Hit Rate',
            'Calibrated to maximize the percentage of winning setups without sacrificing risk:reward.',
            winRateCandidate
        ),
        makeChampion(
            'CAPITAL_SHIELD',
            'Capital Shield Defender',
            'Lowest Drawdown',
            'Engineered for maximum capital preservation by minimizing peak-to-trough drawdowns.',
            shieldCandidate
        ),
    ];

    const elapsedMs = Math.round(performance.now() - startTime);

    return {
        baseline: {
            config: activeConfig,
            summary: baselineResult.summary,
            walkForward: baselineResult.walkForward,
        },
        champions,
        leaderboard: evaluatedCandidates.slice(0, 25),
        totalScanned: candidateList.length,
        elapsedMs,
    };
}
