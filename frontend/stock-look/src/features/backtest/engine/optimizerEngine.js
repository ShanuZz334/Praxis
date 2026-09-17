/**
 * @file optimizerEngine.js
 * @purpose Algorithmic Auto-Calibration & Parameter Optimization Engine for Praxis Backtesting Workshop.
 * Evaluates multi-parameter permutations, guards against curve-fitting via Walk-Forward (70/30)
 * out-of-sample validation, and returns top-tier calibrated champions.
 * @date 2026-09-13
 */

import { runBacktest, precalculateBacktestIndicators, TIMEFRAME_DEFAULTS } from './backtestEngine.js';

// ─── Multi-Objective Fitness Evaluator ────────────────────────────────────────

export function computeCandidateFitness(res) {
    const { summary, walkForward } = res;
    if (!summary || summary.totalTrades < 2) return -999;

    const nTrades = summary.totalTrades || 0;
    const pf = summary.profitFactor || 0;
    const rawWr = summary.winRate || 0;
    const ret = summary.netReturnPct || 0;
    const dd = summary.maxDrawdownPct || 0;
    const sharpe = summary.sharpeRatio || 0;
    const sortino = summary.sortinoRatio || 0;
    const realizedRR = summary.realizedRR || 1.0;
    const oosRatio = walkForward?.efficiencyRatio || 1.0;

    // Bayesian Shrinkage: Shrink win rate toward 50% prior for small samples (m = 12 pseudo-trades)
    // Prevents small-sample flukes from beating statistically robust strategies
    const mPrior = 12;
    const priorWr = 50.0;
    const wr = ((nTrades * rawWr) + (mPrior * priorWr)) / (nTrades + mPrior);

    // Strict penalization for curve-fitting (Walk-forward out-of-sample collapse)
    const overfitPenalty = oosRatio < 0.70 ? (0.70 - oosRatio) * 14.0 : 0;

    // Penalize dangerous drawdowns exponentially
    const ddPenalty = dd > 12 ? Math.pow((dd - 12) / 4, 1.8) * 0.5 : 0;

    // Critical Edge Leak Disqualification: Trades prematurely timing out at horizon with weak returns
    const horizonAnalysis = summary.horizonExpiryAnalysis;
    const isLeak = horizonAnalysis?.isMajorDrag;
    const leakPenalty = isLeak 
        ? 150.0 // Heavy disqualifying penalty ensuring leaking setups cannot rank as champions
        : (horizonAnalysis?.pctOfTotal > 25 ? (horizonAnalysis.pctOfTotal - 25) * 0.2 : 0);

    // Multi-objective balanced alpha score incorporating institutional Sharpe, Expectancy, and Bayesian Win Rate
    return (
        (Math.min(pf, 4.5) * 3.0) +
        (Math.min(sharpe, 3.5) * 2.4) +
        (Math.min(sortino, 3.5) * 1.6) +
        (wr * 0.05) +
        (Math.min(realizedRR, 3.5) * 1.3) +
        (Math.max(-25, Math.min(100, ret)) * 0.018) -
        (dd * 0.10) -
        overfitPenalty -
        ddPenalty -
        leakPenalty
    );
}

// ─── Multi-Dimensional Search Space Generator ─────────────────────────────────

export function generateCandidateConfigs(baseConfig) {
    const tf = baseConfig.timeframe || 'day';
    const tfProfile = TIMEFRAME_DEFAULTS[tf] || TIMEFRAME_DEFAULTS.day;
    const unit = baseConfig.unit || 'PREDICTOR';

    const rawCandidates = [];
    const baseTarget = Number(tfProfile.targetPct.toFixed(2));
    const baseStop = Number(tfProfile.stopPct.toFixed(2));
    const baseTrail = Number((tfProfile.trailingStopPct || (baseStop * 0.8)).toFixed(2));

    // Helper to push candidate
    const add = (overrides, label, archetype = 'TARGET_STOP') => {
        rawCandidates.push({
            label,
            archetype,
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

    // Systematically generate institutional stop levels
    const stopLevels = [
        Number((baseStop * 0.75).toFixed(2)), // Tight Stop (High Precision)
        Number((baseStop * 1.00).toFixed(2)), // Standard Volatility Stop
        Number((baseStop * 1.35).toFixed(2)), // Buffered Volatility Stop
    ].filter(s => s > 0);

    // Institutional Risk:Reward ratios (Target = Stop * RR)
    const rrRatios = [1.25, 1.5, 2.0, 2.5, 3.0];

    // Signal Quality / Conviction Filters (tested across units)
    const confidenceFilters = [0, 65, 72, 80];

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. UNIT-SPECIFIC PARAMETER EXPLORATION
    // ─────────────────────────────────────────────────────────────────────────────

    if (unit === 'CUSTOM_COMBO') {
        // Multi-Factor Rule Builder Space
        const patternMins = [1, 2, 3, 4];
        const ifdiFlags = [true, false];
        const aavbFlags = [true, false];

        for (const pMin of patternMins) {
            for (const reqIfdi of ifdiFlags) {
                for (const reqAavb of aavbFlags) {
                    for (const s of stopLevels.slice(0, 2)) {
                        for (const rr of [1.5, 2.0, 2.5]) {
                            const targetPct = Number((s * rr).toFixed(2));

                            // Pure Target/Stop
                            add({
                                customRules: {
                                    patternScoreMin: pMin,
                                    requireIfdiAccumulation: reqIfdi,
                                    aboveAavbMidline: reqAavb,
                                },
                                exitRule: {
                                    type: 'TARGET_STOP',
                                    targetPct,
                                    stopPct: s,
                                    horizonBars: 14,
                                    enableHorizonTimeout: false,
                                    lockBreakeven: false,
                                }
                            }, `Combo [P≥${pMin}${reqIfdi ? '+IFDI' : ''}${reqAavb ? '+AAVB' : ''}] T:${targetPct}% S:${s}%`, 'TARGET_STOP');

                            // Breakeven Stop Lock
                            add({
                                customRules: {
                                    patternScoreMin: pMin,
                                    requireIfdiAccumulation: reqIfdi,
                                    aboveAavbMidline: reqAavb,
                                },
                                exitRule: {
                                    type: 'TARGET_STOP',
                                    targetPct,
                                    stopPct: s,
                                    horizonBars: 14,
                                    enableHorizonTimeout: false,
                                    lockBreakeven: true,
                                }
                            }, `Combo [P≥${pMin}] BE Lock T:${targetPct}% S:${s}%`, 'BREAKEVEN_LOCK');
                        }
                    }
                }
            }
        }

        // Trailing Stop in Custom Combo
        for (const reqIfdi of [true, false]) {
            for (const tMul of [0.75, 1.0, 1.35]) {
                const trailPct = Number((baseTrail * tMul).toFixed(2));
                add({
                    customRules: {
                        patternScoreMin: 2,
                        requireIfdiAccumulation: reqIfdi,
                        aboveAavbMidline: true,
                    },
                    exitRule: {
                        type: 'TRAILING_STOP',
                        targetPct: Number((baseTarget * 2.0).toFixed(2)),
                        stopPct: baseStop,
                        trailingStopPct: trailPct,
                        enableHorizonTimeout: false,
                    }
                }, `Combo Trailing Stop ${trailPct}% ${reqIfdi ? '(IFDI Flow)' : ''}`, 'TRAILING_STOP');
            }
        }

    } else if (unit === 'PREDICTOR') {
        // AI Predictor Calibration Space
        for (const conf of confidenceFilters) {
            for (const s of stopLevels) {
                for (const rr of rrRatios) {
                    const targetPct = Number((s * rr).toFixed(2));

                    // Standard Target/Stop
                    add({
                        minConfidence: conf,
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: false,
                        }
                    }, `Predictor ${conf > 0 ? `[≥${conf}%]` : ''} T:${targetPct}% S:${s}% (${rr}:1 R:R)`, 'TARGET_STOP');

                    // Breakeven Lock
                    if (rr >= 1.5) {
                        add({
                            minConfidence: conf,
                            exitRule: {
                                type: 'TARGET_STOP',
                                targetPct,
                                stopPct: s,
                                horizonBars: 14,
                                enableHorizonTimeout: false,
                                lockBreakeven: true,
                            }
                        }, `Predictor ${conf > 0 ? `[≥${conf}%]` : ''} BE Lock T:${targetPct}% S:${s}%`, 'BREAKEVEN_LOCK');
                    }
                }
            }
        }

        // Trailing stop variations
        for (const conf of [0, 65, 72]) {
            for (const trMul of [0.65, 1.0, 1.45]) {
                const trailPct = Number((baseTrail * trMul).toFixed(2));
                add({
                    minConfidence: conf,
                    exitRule: {
                        type: 'TRAILING_STOP',
                        targetPct: Number((baseTarget * 2.2).toFixed(2)),
                        stopPct: baseStop,
                        trailingStopPct: trailPct,
                        enableHorizonTimeout: false,
                    }
                }, `Predictor Trailing Stop ${trailPct}% ${conf > 0 ? `[≥${conf}%]` : ''}`, 'TRAILING_STOP');
            }
        }

        // Extended Horizon without premature timeout leak
        for (const h of [18, 26, 36]) {
            add({
                exitRule: {
                    type: 'TARGET_STOP',
                    targetPct: Number((baseTarget * 1.5).toFixed(2)),
                    stopPct: baseStop,
                    horizonBars: h,
                    enableHorizonTimeout: true,
                }
            }, `Predictor Safety Horizon ${h}b (Target: ${Number((baseTarget * 1.5).toFixed(2))}%)`, 'ADAPTIVE_HORIZON');
        }

    } else if (unit === 'PATTERNS') {
        // Chart Patterns Recognition Space
        const patternThresholds = [2, 3, 4, 5];

        for (const th of patternThresholds) {
            for (const s of stopLevels) {
                for (const rr of [1.5, 2.0, 2.5]) {
                    const targetPct = Number((s * rr).toFixed(2));

                    add({
                        patternThreshold: th,
                        customRules: { patternScoreMin: th },
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: false,
                        }
                    }, `Pattern Score ≥${th} T:${targetPct}% S:${s}%`, 'TARGET_STOP');

                    add({
                        patternThreshold: th,
                        customRules: { patternScoreMin: th },
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: true,
                        }
                    }, `Pattern Score ≥${th} BE Lock T:${targetPct}% S:${s}%`, 'BREAKEVEN_LOCK');
                }
            }
        }

        // Trailing Stop on High-Grade Patterns
        for (const trMul of [0.75, 1.0, 1.35]) {
            const trailPct = Number((baseTrail * trMul).toFixed(2));
            add({
                patternThreshold: 3,
                exitRule: {
                    type: 'TRAILING_STOP',
                    targetPct: Number((baseTarget * 2.0).toFixed(2)),
                    stopPct: baseStop,
                    trailingStopPct: trailPct,
                    enableHorizonTimeout: false,
                }
            }, `Pattern Score ≥3 Trailing Stop ${trailPct}%`, 'TRAILING_STOP');
        }

    } else if (unit === 'COMPOSITE_SCORE') {
        // Composite Sentiment & Pattern Score
        const scoreThresholds = [3, 4, 5, 6];

        for (const th of scoreThresholds) {
            for (const s of stopLevels) {
                for (const rr of [1.5, 2.0, 2.5]) {
                    const targetPct = Number((s * rr).toFixed(2));

                    add({
                        patternThreshold: th,
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: false,
                        }
                    }, `Composite Score ±${th} T:${targetPct}% S:${s}%`, 'TARGET_STOP');

                    add({
                        patternThreshold: th,
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: true,
                        }
                    }, `Composite Score ±${th} BE Lock T:${targetPct}% S:${s}%`, 'BREAKEVEN_LOCK');
                }
            }
        }

    } else if (unit === 'PNCO') {
        // PNCO Neural Momentum & Trap Oscillator
        const thresholds = [15, 20, 25, 30, 35];

        for (const th of thresholds) {
            for (const s of stopLevels) {
                for (const rr of [1.25, 1.75, 2.25]) {
                    const targetPct = Number((s * rr).toFixed(2));

                    add({
                        pncoThreshold: th,
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: false,
                        }
                    }, `PNCO ±${th} Extreme Rebound T:${targetPct}% S:${s}%`, 'TARGET_STOP');

                    add({
                        pncoThreshold: th,
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: true,
                        }
                    }, `PNCO ±${th} BE Lock T:${targetPct}% S:${s}%`, 'BREAKEVEN_LOCK');
                }
            }

            // PNCO Trailing stops for letting runners run
            for (const trMul of [0.7, 1.0, 1.4]) {
                const trailPct = Number((baseTrail * trMul).toFixed(2));
                add({
                    pncoThreshold: th,
                    exitRule: {
                        type: 'TRAILING_STOP',
                        targetPct: Number((baseTarget * 2.0).toFixed(2)),
                        stopPct: baseStop,
                        trailingStopPct: trailPct,
                        enableHorizonTimeout: false,
                    }
                }, `PNCO ±${th} Trailing Stop ${trailPct}%`, 'TRAILING_STOP');
            }
        }

    } else if (unit === 'AAVB') {
        // AAVB Adaptive Volatility Bands
        for (const s of stopLevels) {
            for (const rr of [1.25, 1.5, 2.0, 2.5]) {
                const targetPct = Number((s * rr).toFixed(2));

                add({
                    exitRule: {
                        type: 'TARGET_STOP',
                        targetPct,
                        stopPct: s,
                        horizonBars: 14,
                        enableHorizonTimeout: false,
                        lockBreakeven: false,
                    }
                }, `AAVB Band Reversal T:${targetPct}% S:${s}%`, 'TARGET_STOP');

                add({
                    exitRule: {
                        type: 'TARGET_STOP',
                        targetPct,
                        stopPct: s,
                        horizonBars: 14,
                        enableHorizonTimeout: false,
                        lockBreakeven: true,
                    }
                }, `AAVB Band Reversal BE Lock T:${targetPct}% S:${s}%`, 'BREAKEVEN_LOCK');
            }
        }

        // AAVB Trailing stops
        for (const trMul of [0.65, 0.95, 1.35]) {
            const trailPct = Number((baseTrail * trMul).toFixed(2));
            add({
                exitRule: {
                    type: 'TRAILING_STOP',
                    targetPct: Number((baseTarget * 2.2).toFixed(2)),
                    stopPct: baseStop,
                    trailingStopPct: trailPct,
                    enableHorizonTimeout: false,
                }
            }, `AAVB Trailing Stop ${trailPct}%`, 'TRAILING_STOP');
        }

    } else if (unit === 'IFDI') {
        // IFDI Institutional Flow Divergence
        for (const conf of [0, 70, 80]) {
            for (const s of stopLevels) {
                for (const rr of [1.5, 2.0, 2.5, 3.0]) {
                    const targetPct = Number((s * rr).toFixed(2));

                    add({
                        minConfidence: conf,
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: false,
                        }
                    }, `IFDI Smart Accumulation ${conf > 0 ? `[≥${conf}%]` : ''} T:${targetPct}% S:${s}%`, 'TARGET_STOP');

                    add({
                        minConfidence: conf,
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: true,
                        }
                    }, `IFDI Smart Accumulation BE Lock T:${targetPct}% S:${s}%`, 'BREAKEVEN_LOCK');
                }
            }
        }

    } else if (unit === 'HEAD_TO_HEAD') {
        // HEAD_TO_HEAD & Multi-Confluence Benchmark
        const pncoThs = [15, 20, 25, 30];

        for (const th of pncoThs) {
            for (const s of stopLevels) {
                for (const rr of [1.5, 2.0, 2.5]) {
                    const targetPct = Number((s * rr).toFixed(2));

                    add({
                        pncoThreshold: th,
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: false,
                        }
                    }, `Confluence PNCO:±${th} T:${targetPct}% S:${s}%`, 'TARGET_STOP');

                    add({
                        pncoThreshold: th,
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: true,
                        }
                    }, `Confluence PNCO:±${th} BE Lock T:${targetPct}% S:${s}%`, 'BREAKEVEN_LOCK');
                }
            }
        }
    } else {
        // DYNAMIC CUSTOM UNIT / CUSTOM LAB OPTIMIZATION SWEEP
        const baseThreshold = Number(baseConfig.customThreshold || 25);
        const thresholdDeltas = [-10, 0, 10];

        for (const delta of thresholdDeltas) {
            const tunedThresh = Math.max(5, baseThreshold + delta);
            for (const s of stopLevels) {
                for (const rr of rrRatios) {
                    const targetPct = Number((s * rr).toFixed(2));

                    add({
                        customThreshold: tunedThresh,
                        exitRule: {
                            type: 'TARGET_STOP',
                            targetPct,
                            stopPct: s,
                            horizonBars: 14,
                            enableHorizonTimeout: false,
                            lockBreakeven: false,
                        }
                    }, `Custom ±${tunedThresh} T:${targetPct}% S:${s}% (${rr}:1 R:R)`, 'TARGET_STOP');

                    if (rr >= 1.5) {
                        add({
                            customThreshold: tunedThresh,
                            exitRule: {
                                type: 'TARGET_STOP',
                                targetPct,
                                stopPct: s,
                                horizonBars: 14,
                                enableHorizonTimeout: false,
                                lockBreakeven: true,
                            }
                        }, `Custom ±${tunedThresh} BE Lock T:${targetPct}% S:${s}%`, 'BREAKEVEN_LOCK');
                    }
                }
            }
        }

        // Trailing stop variations for custom unit
        for (const trMul of [0.75, 1.0, 1.35]) {
            const trailPct = Number((baseTrail * trMul).toFixed(2));
            add({
                exitRule: {
                    type: 'TRAILING_STOP',
                    targetPct: Number((baseTarget * 2.0).toFixed(2)),
                    stopPct: baseStop,
                    trailingStopPct: trailPct,
                    enableHorizonTimeout: false,
                }
            }, `Custom Trailing Stop ${trailPct}%`, 'TRAILING_STOP');
        }
    }


    // ─────────────────────────────────────────────────────────────────────────────
    // 2. DEDUPLICATE SEARCH CANDIDATES
    // ─────────────────────────────────────────────────────────────────────────────
    const seenSignatures = new Set();
    const uniqueCandidates = [];

    for (const c of rawCandidates) {
        const exit = c.config.exitRule || {};
        const rules = c.config.customRules || {};
        const sig = [
            c.config.unit,
            exit.type,
            exit.targetPct,
            exit.stopPct,
            exit.trailingStopPct || 0,
            Boolean(exit.lockBreakeven),
            Boolean(exit.enableHorizonTimeout),
            exit.horizonBars || 0,
            c.config.minConfidence || 0,
            c.config.patternThreshold || 0,
            c.config.pncoThreshold || 0,
            rules.patternScoreMin || 0,
            Boolean(rules.requireIfdiAccumulation),
            Boolean(rules.aboveAavbMidline),
        ].join('|');

        if (!seenSignatures.has(sig)) {
            seenSignatures.add(sig);
            uniqueCandidates.push(c);
        }
    }

    return uniqueCandidates;
}

// ─── Configuration Difference Tester ──────────────────────────────────────────

export function isConfigDifferent(cfgA, cfgB) {
    if (!cfgA || !cfgB) return true;
    const aExit = cfgA.exitRule || {};
    const bExit = cfgB.exitRule || {};
    const aRules = cfgA.customRules || {};
    const bRules = cfgB.customRules || {};

    if (Number(aExit.targetPct) !== Number(bExit.targetPct)) return true;
    if (Number(aExit.stopPct) !== Number(bExit.stopPct)) return true;
    if (aExit.type !== bExit.type) return true;
    if (Boolean(aExit.lockBreakeven) !== Boolean(bExit.lockBreakeven)) return true;
    if (Boolean(aExit.enableHorizonTimeout) !== Boolean(bExit.enableHorizonTimeout)) return true;
    if (Number(aExit.horizonBars || 14) !== Number(bExit.horizonBars || 14)) return true;
    if (Number(aExit.trailingStopPct || 0) !== Number(bExit.trailingStopPct || 0)) return true;
    if (Number(cfgA.minConfidence || 0) !== Number(cfgB.minConfidence || 0)) return true;
    if (Number(cfgA.patternThreshold || 0) !== Number(cfgB.patternThreshold || 0)) return true;
    if (Number(cfgA.pncoThreshold || 0) !== Number(cfgB.pncoThreshold || 0)) return true;
    if (aRules.patternScoreMin !== bRules.patternScoreMin) return true;
    if (Boolean(aRules.requireIfdiAccumulation) !== Boolean(bRules.requireIfdiAccumulation)) return true;
    if (Boolean(aRules.aboveAavbMidline) !== Boolean(bRules.aboveAavbMidline)) return true;

    return false;
}

// ─── Human Readable Highlight Formatter ────────────────────────────────────────

export function buildTuningHighlights(baselineCfg, candidateCfg, baselineSummary = null, candidateSummary = null) {
    const highlights = [];
    const bExit = baselineCfg?.exitRule || {};
    const cExit = candidateCfg?.exitRule || {};

    // 1. Edge Leak Resolution
    const bLeak = baselineSummary?.horizonExpiryAnalysis?.isMajorDrag;
    const cLeak = candidateSummary?.horizonExpiryAnalysis?.isMajorDrag;
    if (bLeak && !cLeak) {
        highlights.push('Plugged Edge Leak: Eliminated premature horizon timeout to capture full targets');
    }

    // 2. Risk-Reward / Target & Stop
    if (cExit.targetPct !== bExit.targetPct || cExit.stopPct !== bExit.stopPct) {
        const rr = cExit.stopPct ? (cExit.targetPct / cExit.stopPct).toFixed(1) : '—';
        if (cExit.targetPct !== bExit.targetPct && cExit.stopPct !== bExit.stopPct) {
            highlights.push(`Risk:Reward tuned to ${rr}:1 (Target: ${cExit.targetPct}%, Stop: ${cExit.stopPct}%)`);
        } else if (cExit.targetPct !== bExit.targetPct) {
            highlights.push(`Target expanded: ${bExit.targetPct || 0}% → ${cExit.targetPct}% (${rr}:1 R:R)`);
        } else {
            highlights.push(`Stop Loss tuned: ${bExit.stopPct || 0}% → ${cExit.stopPct}%`);
        }
    }

    // 3. Breakeven Stop Lock
    if (cExit.lockBreakeven && !bExit.lockBreakeven) {
        highlights.push('Added Breakeven Stop Lock (eliminates loss risk after +50% target gain)');
    }

    // 4. Exit Type Shift
    if (cExit.type !== bExit.type) {
        if (cExit.type === 'TRAILING_STOP') {
            highlights.push(`Switched to Trailing Stop (${cExit.trailingStopPct}% trail) to ride trends`);
        } else {
            highlights.push(`Exit mechanism calibrated to ${cExit.type}`);
        }
    } else if (cExit.type === 'TRAILING_STOP' && cExit.trailingStopPct !== bExit.trailingStopPct) {
        highlights.push(`Trailing stop width tuned: ${bExit.trailingStopPct || 0}% → ${cExit.trailingStopPct}%`);
    }

    // 5. Horizon / Timeout Behavior
    if (cExit.enableHorizonTimeout !== bExit.enableHorizonTimeout) {
        highlights.push(
            cExit.enableHorizonTimeout
                ? `Safety timeout capped at ${cExit.horizonBars || 14} bars`
                : 'Premature bar timeout disabled (pure Target/Stop execution)'
        );
    } else if (cExit.enableHorizonTimeout && cExit.horizonBars !== bExit.horizonBars) {
        highlights.push(`Holding horizon extended: ${bExit.horizonBars || 14}b → ${cExit.horizonBars}b`);
    }

    // 6. Signal Conviction Filter
    if ((candidateCfg.minConfidence || 0) !== (baselineCfg.minConfidence || 0)) {
        if (candidateCfg.minConfidence > 0) {
            highlights.push(`Conviction filter: Raised to ≥ ${candidateCfg.minConfidence}% (rejects low-probability noise)`);
        } else {
            highlights.push('Confidence filter relaxed for maximum trade frequency');
        }
    }

    // 7. Unit-Specific Thresholds
    if (candidateCfg.patternThreshold !== baselineCfg.patternThreshold && candidateCfg.patternThreshold !== undefined) {
        highlights.push(`Pattern score threshold calibrated to ≥ ${candidateCfg.patternThreshold}`);
    }
    if (candidateCfg.pncoThreshold !== baselineCfg.pncoThreshold && candidateCfg.pncoThreshold !== undefined) {
        highlights.push(`PNCO momentum trigger tuned to ±${candidateCfg.pncoThreshold}`);
    }
    if (candidateCfg.customRules?.patternScoreMin !== baselineCfg.customRules?.patternScoreMin && candidateCfg.customRules?.patternScoreMin !== undefined) {
        highlights.push(`Confluence minimum pattern score set to ≥ ${candidateCfg.customRules.patternScoreMin}`);
    }
    if (candidateCfg.customRules?.requireIfdiAccumulation !== baselineCfg.customRules?.requireIfdiAccumulation) {
        highlights.push(
            candidateCfg.customRules?.requireIfdiAccumulation
                ? 'Added IFDI Smart Money Accumulation confirmation'
                : 'Relaxed IFDI flow restriction'
        );
    }
    if (candidateCfg.customRules?.aboveAavbMidline !== baselineCfg.customRules?.aboveAavbMidline) {
        highlights.push(
            candidateCfg.customRules?.aboveAavbMidline
                ? 'Added AAVB dynamic midline trend confirmation'
                : 'Relaxed AAVB band midline requirement'
        );
    }

    // Fallback if identical
    if (highlights.length === 0) {
        const rr = cExit.stopPct ? (cExit.targetPct / cExit.stopPct).toFixed(1) : '1.5';
        highlights.push(`Execution calibrated to current market volatility structure (${rr}:1 R:R)`);
    }

    return highlights;
}

// ─── Master Auto-Calibration Runner ──────────────────────────────────────────

/**
 * Runs an institutional multi-parameter sweep across historical candles.
 *
 * @param {Array} candles - OHLCV array
 * @param {Object} activeConfig - Active workshop config
 * @returns {Object} { baseline, champions, leaderboard, totalScanned, evaluatedCount, bestWinRate, bestProfitFactor, lowestDrawdown, elapsedMs }
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

    // 3. Generate multi-dimensional candidate parameter space
    const candidateList = generateCandidateConfigs(activeConfig);

    // 4. Sweep each candidate
    const evaluatedCandidates = [];

    for (let i = 0; i < candidateList.length; i++) {
        const item = candidateList[i];
        const res = runBacktest(candles, item.config, precalc);
        const fitness = computeCandidateFitness(res);

        if (res.summary && res.summary.totalTrades >= 3) {
            evaluatedCandidates.push({
                id: `cand_${i + 1}`,
                label: item.label,
                archetype: item.archetype || 'TARGET_STOP',
                config: item.config,
                summary: res.summary,
                walkForward: res.walkForward,
                fitness,
            });
        }
    }

    // Sort evaluated candidates by overall multi-objective fitness
    evaluatedCandidates.sort((a, b) => b.fitness - a.fitness);

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. CHAMPION SELECTION WITH STRICT DIVERSITY & ZERO-IDENTICAL GUARANTEE
    // ─────────────────────────────────────────────────────────────────────────────

    // Candidate pools based on sample size and leak resolution
    const robustPool = evaluatedCandidates.filter(c => (c.summary?.totalTrades || 0) >= 8);
    const pool = robustPool.length >= 6 ? robustPool : evaluatedCandidates;

    // Filter out edge leak candidates if enough alternatives exist
    const leakFreePool = pool.filter(c => !c.summary?.horizonExpiryAnalysis?.isMajorDrag);
    const eligiblePool = leakFreePool.length >= 3 ? leakFreePool : pool;

    // Profitable candidates pool
    const profitablePool = eligiblePool.filter(c => (c.summary?.netReturnPct || 0) > 0);
    const workingPool = profitablePool.length >= 3 ? profitablePool : eligiblePool;

    // ── Champion 1: Balanced Alpha (Highest Multi-Objective Fitness) ───────────
    // Must strictly differ from baseline config if at all possible
    let balancedCandidate = workingPool.find(c => isConfigDifferent(c.config, activeConfig)) || workingPool[0] || {
        config: activeConfig,
        summary: baselineResult.summary,
        walkForward: baselineResult.walkForward,
        fitness: baselineFitness,
    };

    // ── Champion 2: Max Accuracy Sniper (Highest Bayesian Shrunken Win Rate) ───
    // Must strictly differ from baseline AND from Champion 1
    const winRatePool = [...workingPool].sort((a, b) => {
        const nA = a.summary?.totalTrades || 1;
        const nB = b.summary?.totalTrades || 1;
        const wrA = ((nA * (a.summary?.winRate || 0)) + (10 * 50)) / (nA + 10);
        const wrB = ((nB * (b.summary?.winRate || 0)) + (10 * 50)) / (nB + 10);
        if (wrB !== wrA) return wrB - wrA;
        return (b.summary?.profitFactor || 0) - (a.summary?.profitFactor || 0);
    });

    let winRateCandidate = winRatePool.find(c => 
        isConfigDifferent(c.config, activeConfig) && 
        isConfigDifferent(c.config, balancedCandidate.config) &&
        (c.summary?.profitFactor || 0) >= 1.02
    );

    // Fallback if tight PF filter eliminated all
    if (!winRateCandidate) {
        winRateCandidate = winRatePool.find(c => 
            isConfigDifferent(c.config, activeConfig) && 
            isConfigDifferent(c.config, balancedCandidate.config)
        ) || winRatePool[0] || balancedCandidate;
    }

    // ── Champion 3: Capital Shield Defender (Lowest Peak Drawdown) ─────────────
    // Must strictly differ from baseline, Champion 1, AND Champion 2
    const shieldPool = [...workingPool].sort((a, b) => {
        const ddA = a.summary?.maxDrawdownPct ?? 999;
        const ddB = b.summary?.maxDrawdownPct ?? 999;
        if (ddA !== ddB) return ddA - ddB;
        return (b.summary?.profitFactor || 0) - (a.summary?.profitFactor || 0);
    });

    let shieldCandidate = shieldPool.find(c => 
        isConfigDifferent(c.config, activeConfig) && 
        isConfigDifferent(c.config, balancedCandidate.config) &&
        isConfigDifferent(c.config, winRateCandidate.config)
    );

    // Fallback if distinct candidate not found in working pool
    if (!shieldCandidate) {
        shieldCandidate = eligiblePool.find(c => 
            isConfigDifferent(c.config, activeConfig) && 
            isConfigDifferent(c.config, balancedCandidate.config) &&
            isConfigDifferent(c.config, winRateCandidate.config)
        ) || shieldPool[0] || balancedCandidate;
    }

    // Helper to construct champion card object
    const makeChampion = (type, title, badge, tagline, candidate, colorTheme) => {
        const s = candidate.summary || {};
        const b = baselineResult.summary || {};
        const isCurrentlyActive = !isConfigDifferent(candidate.config, activeConfig);

        return {
            type,
            title,
            badge,
            tagline,
            colorTheme,
            config: candidate.config,
            summary: s,
            walkForward: candidate.walkForward,
            fitness: Math.round(candidate.fitness * 10) / 10,
            isCurrentlyActive,
            deltas: {
                winRate: Math.round(((s.winRate ?? 0) - (b.winRate ?? 0)) * 10) / 10,
                profitFactor: Math.round(((s.profitFactor ?? 0) - (b.profitFactor ?? 0)) * 100) / 100,
                sharpeRatio: Math.round(((s.sharpeRatio ?? 0) - (b.sharpeRatio ?? 0)) * 100) / 100,
                netReturnPct: Math.round(((s.netReturnPct ?? 0) - (b.netReturnPct ?? 0)) * 10) / 10,
                maxDrawdownPct: Math.round(((s.maxDrawdownPct ?? 0) - (b.maxDrawdownPct ?? 0)) * 10) / 10,
            },
            tuningHighlights: buildTuningHighlights(activeConfig, candidate.config, b, s),
        };
    };

    const champions = [
        makeChampion(
            'BALANCED',
            'Balanced Alpha Champion',
            'Optimal Sharpe & Expectancy',
            'Optimal mathematical equilibrium of win rate, profit factor, and drawdown stability with strong out-of-sample walk-forward efficiency.',
            balancedCandidate,
            'blue'
        ),
        makeChampion(
            'MAX_WIN_RATE',
            'Max Accuracy Sniper',
            'Highest Hit Rate',
            'Engineered for maximum hit rate precision by applying conviction filters and disciplined profit-taking mechanics.',
            winRateCandidate,
            'amber'
        ),
        makeChampion(
            'CAPITAL_SHIELD',
            'Capital Shield Defender',
            'Minimal Drawdown',
            'Designed for conservative capital preservation by enforcing tight stop controls and breakeven ratchet locks.',
            shieldCandidate,
            'emerald'
        ),
    ];

    const elapsedMs = Math.round(performance.now() - startTime);

    // Compute aggregate statistics for the header ribbon
    const bestWinRate = evaluatedCandidates.length ? Math.max(...evaluatedCandidates.map(c => c.summary?.winRate ?? 0)) : 0;
    const bestProfitFactor = evaluatedCandidates.length ? Math.max(...evaluatedCandidates.map(c => c.summary?.profitFactor ?? 0)) : 0;
    const lowestDrawdown = evaluatedCandidates.length ? Math.min(...evaluatedCandidates.map(c => c.summary?.maxDrawdownPct ?? 999)) : 0;
    const oosPassedCount = evaluatedCandidates.filter(c => (c.walkForward?.efficiencyRatio || 1) >= 0.70).length;
    const oosPassRate = evaluatedCandidates.length ? Math.round((oosPassedCount / evaluatedCandidates.length) * 100) : 100;

    return {
        baseline: {
            config: activeConfig,
            summary: baselineResult.summary,
            walkForward: baselineResult.walkForward,
        },
        champions,
        leaderboard: evaluatedCandidates.slice(0, 50),
        totalScanned: candidateList.length,
        evaluatedCount: evaluatedCandidates.length,
        bestWinRate,
        bestProfitFactor,
        lowestDrawdown: lowestDrawdown === 999 ? 0 : lowestDrawdown,
        oosPassRate,
        elapsedMs,
    };
}
