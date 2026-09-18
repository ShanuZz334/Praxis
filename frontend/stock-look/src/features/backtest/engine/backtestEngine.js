/**
 * @file backtestEngine.js
 * @purpose Production-grade walk-forward backtesting simulation engine for:
 *  - 7-Candle AI Predictor (Directional calibration & confidence curves)
 *  - Pattern Recognition Engine (Per-pattern win rates & holding horizons)
 *  - Composite Pattern Sentiment (Score threshold crossover validation)
 *  - Proprietary Indicators (PNCO, AAVB, IFDI)
 *  - Head-to-Head component benchmarking
 *  - Custom Multi-factor Strategy Combos
 * @date 2026-09-12
 */

import { analyzeChartPatterns } from '../../../shared/utils/patternEngine.js';
import { calculatePNCO, calculateAAVB, calculateIFDI } from '../../dashboard/technical/engine/praxisIndicatorsEngine.js';
import { getCustomIndicators, evaluateCustomLabSeries } from '../lab/customIndicatorRegistry.js';
import { SIGNAL_DEFINITIONS } from '../strategy/strategySignalDefinitions.js';
import { evaluateStrategyRulesAtBar, precalculateStrategySeries } from '../strategy/strategyEngine.js';
import { calculateRoundTripTransactionCosts, INDIAN_INSTRUMENT_TYPES } from './institutionalFeeEngine.js';
import { runMonteCarloSimulation } from './monteCarloEngine.js';
import { analyzeRegimePerformance } from './marketRegimeEngine.js';
import { runOptionsStrategyBacktest } from './optionsBacktestEngine.js';
import { evaluateInstitutionalAudit } from './quantitativeAuditEngine.js';

// ─── Timeframe Volatility Profiles ─────────────────────────────────────────

export const TIMEFRAME_DEFAULTS = {
    '1m': { mode: 'intraday', targetPct: 0.25, stopPct: 0.12, horizonBars: 20, trailingStopPct: 0.10 },
    '1minute': { mode: 'intraday', targetPct: 0.25, stopPct: 0.12, horizonBars: 20, trailingStopPct: 0.10 },
    '5m': { mode: 'intraday', targetPct: 0.45, stopPct: 0.22, horizonBars: 20, trailingStopPct: 0.18 },
    '5minute': { mode: 'intraday', targetPct: 0.45, stopPct: 0.22, horizonBars: 20, trailingStopPct: 0.18 },
    '15m': { mode: 'intraday', targetPct: 0.75, stopPct: 0.38, horizonBars: 18, trailingStopPct: 0.30 },
    '15minute': { mode: 'intraday', targetPct: 0.75, stopPct: 0.38, horizonBars: 18, trailingStopPct: 0.30 },
    '30m': { mode: 'intraday', targetPct: 1.00, stopPct: 0.50, horizonBars: 16, trailingStopPct: 0.40 },
    '30minute': { mode: 'intraday', targetPct: 1.00, stopPct: 0.50, horizonBars: 16, trailingStopPct: 0.40 },
    '1h': { mode: 'intraday', targetPct: 1.40, stopPct: 0.70, horizonBars: 14, trailingStopPct: 0.55 },
    '1hour': { mode: 'intraday', targetPct: 1.40, stopPct: 0.70, horizonBars: 14, trailingStopPct: 0.55 },
    'day': { mode: 'swing', targetPct: 2.50, stopPct: 1.25, horizonBars: 10, trailingStopPct: 1.00 },
    'week': { mode: 'positional', targetPct: 5.00, stopPct: 2.50, horizonBars: 12, trailingStopPct: 2.00 },
};

// ─── Default Config ────────────────────────────────────────────────────────

export const DEFAULT_BACKTEST_CONFIG = {
    unit: 'PREDICTOR', // 'PREDICTOR' | 'PATTERNS' | 'COMPOSITE_SCORE' | 'PNCO' | 'AAVB' | 'IFDI' | 'HEAD_TO_HEAD' | 'CUSTOM_COMBO'
    mode: 'swing',     // 'intraday' | 'swing' | 'positional'
    selectedPattern: 'ALL',
    patternThreshold: 5,
    pncoThreshold: 25,
    minConfidence: 0,
    customRules: {
        patternScoreMin: 4,
        requireIfdiAccumulation: true,
        aboveAavbMidline: true,
    },
    exitRule: {
        type: 'TARGET_STOP', // 'HORIZON' | 'TARGET_STOP' | 'TRAILING_STOP'
        horizonBars: 14,
        enableHorizonTimeout: false, // In Target/Stop mode, default to pure target/stop execution without premature timeout
        targetPct: 2.5,
        stopPct: 1.25,
        trailingStopPct: 1.0,
        lockBreakeven: false, // Move stop loss to entry price once trade reaches 50% of target
    },
    slippageModel: 'NEXT_BAR_OPEN', // 'NEXT_BAR_OPEN' (realistic) | 'SAME_BAR_CLOSE' (instant)
    costModel: 'INDIAN_REALISTIC',  // 'NONE' | 'INDIAN_REALISTIC' (0.03% brokerage + STT + turnover charges)
    walkForward: {
        enabled: true,
        splitRatio: 0.7, // 70% in-sample / 30% out-of-sample
    },
    initialCapital: 100000,
    positionSizePct: 100, // % of equity allocated per trade
    sizingModel: 'PERCENT_EQUITY', // 'PERCENT_EQUITY' | 'KELLY' | 'ATR_RISK'
    dateRange: 'SINCE_2010', // 'SINCE_2010' | 'SINCE_2015' | 'SINCE_2020' | 'ALL_TIME' | 'LAST_2_YEARS'
};

// ─── Helper: ATR (Average True Range) ─────────────────────────────────────────

export function calculateATR(candles, period = 14) {
    if (!candles || candles.length < 2) return [];
    const trs = [candles[0].high - candles[0].low];
    for (let i = 1; i < candles.length; i++) {
        const c = candles[i];
        const prev = candles[i - 1];
        const tr = Math.max(
            c.high - c.low,
            Math.abs(c.high - prev.close),
            Math.abs(c.low - prev.close)
        );
        trs.push(tr);
    }

    const atrs = new Array(candles.length);
    let sum = 0;
    for (let i = 0; i < Math.min(period, trs.length); i++) {
        sum += trs[i];
        atrs[i] = sum / (i + 1);
    }
    for (let i = period; i < candles.length; i++) {
        atrs[i] = (atrs[i - 1] * (period - 1) + trs[i]) / period;
    }
    return atrs;
}

// ─── Main Precalculator ──────────────────────────────────────────────────────

export function precalculateBacktestIndicators(candles) {
    if (!candles || candles.length < 20) return null;
    const pncoData = calculatePNCO(candles) || [];
    const aavbData = calculateAAVB(candles, { period: 20, baseMultiplier: 2.0 }) || { middle: [], upper: [], lower: [] };
    const ifdiData = calculateIFDI(candles, 14) || [];
    const atrValues = calculateATR(candles, 14);

    return {
        pncoData,
        aavbData,
        ifdiData,
        atrValues,
        pncoMap: new Map(Array.isArray(pncoData) ? pncoData.map(d => [d.time, d]) : []),
        ifdiMap: new Map(Array.isArray(ifdiData) ? ifdiData.map(d => [d.time, d]) : []),
        aavbMidMap: new Map(Array.isArray(aavbData?.middle) ? aavbData.middle.map(d => [d.time, d.value]) : []),
        aavbUpMap: new Map(Array.isArray(aavbData?.upper) ? aavbData.upper.map(d => [d.time, d.value]) : []),
        aavbLowMap: new Map(Array.isArray(aavbData?.lower) ? aavbData.lower.map(d => [d.time, d.value]) : []),
        atrMap: new Map(candles.map((c, i) => [c.time, atrValues[i] || (c.high - c.low)])),
        patternCache: new Map(),
    };
}

export function sanitizeCandles(rawCandles) {
    if (!Array.isArray(rawCandles) || rawCandles.length === 0) return { candles: [], integrityScore: 100, badBarsCount: 0 };

    const sorted = [...rawCandles].sort((a, b) => {
        const ta = typeof a.time === 'number' && a.time < 1e11 ? a.time * 1000 : new Date(a.time).getTime();
        const tb = typeof b.time === 'number' && b.time < 1e11 ? b.time * 1000 : new Date(b.time).getTime();
        return ta - tb;
    });

    const seenTimes = new Set();
    const clean = [];
    let badBars = 0;

    for (let i = 0; i < sorted.length; i++) {
        const c = sorted[i];
        if (!c || c.close === undefined || c.close === null || isNaN(c.close) || c.close <= 0) {
            badBars++;
            continue;
        }

        const t = c.time;
        if (seenTimes.has(t)) {
            badBars++;
            continue;
        }
        seenTimes.add(t);

        const open = Number(c.open) || c.close;
        const close = Number(c.close);
        const high = Math.max(Number(c.high) || close, open, close);
        const low = Math.min(Number(c.low) || close, open, close);
        const volume = Math.max(0, Number(c.volume) || 0);

        clean.push({
            ...c,
            time: t,
            open,
            high,
            low,
            close,
            volume,
        });
    }

    const integrityScore = sorted.length > 0 ? Math.round(((sorted.length - badBars) / sorted.length) * 1000) / 10 : 100;
    return { candles: clean, integrityScore, badBarsCount: badBars };
}

/**
 * Executes a full backtest simulation on an OHLCV candlestick dataset.
 *
 * @param {Array} rawCandles - OHLCV array
 * @param {Object} userConfig - Configuration options
 * @param {Object} [precalc=null] - Optional precalculated indicators cache
 * @returns {Object} Full backtest results { summary, trades, equityCurve, calibration, walkForward, indicators }
 */
export function runBacktest(rawCandles, userConfig = {}, precalc = null) {
    const config = { ...DEFAULT_BACKTEST_CONFIG, ...userConfig };
    config.exitRule = { ...DEFAULT_BACKTEST_CONFIG.exitRule, ...(userConfig.exitRule || {}) };
    config.walkForward = { ...DEFAULT_BACKTEST_CONFIG.walkForward, ...(userConfig.walkForward || {}) };
    config.customRules = { ...DEFAULT_BACKTEST_CONFIG.customRules, ...(userConfig.customRules || {}) };

    const { candles, integrityScore, badBarsCount } = sanitizeCandles(rawCandles);

    if (!candles || candles.length < 20) {
        return {
            summary: getEmptySummary(),
            trades: [],
            equityCurve: [],
            calibration: [],
            walkForward: null,
            indicators: {},
        };
    }

    const n = candles.length;
    const splitIndex = config.walkForward.enabled ? Math.floor(n * (config.walkForward.splitRatio || 0.7)) : n;

    // 1. Pre-calculate indicators
    const pre = precalc || precalculateBacktestIndicators(candles);
    const { pncoData, aavbData, ifdiData, pncoMap, ifdiMap, aavbMidMap, aavbUpMap, aavbLowMap, atrMap } = pre;
    const patternCache = pre?.patternCache || new Map();

    const customLabMap = (config.customLabSeries && Array.isArray(config.customLabSeries))
        ? new Map(config.customLabSeries.map(d => [d.time, d.value]))
        : null;

    // Dynamic custom unit support (e.g. custom indicators selected from Unit Under Test grid)
    let customUnitMap = customLabMap;
    let customUnitDef = config.customUnitDef || null;

    if (!customUnitMap && config.unit && !['PREDICTOR', 'PATTERNS', 'COMPOSITE_SCORE', 'PNCO', 'AAVB', 'IFDI', 'HEAD_TO_HEAD', 'CUSTOM_COMBO'].includes(config.unit)) {
        try {
            const allCustom = getCustomIndicators();
            customUnitDef = allCustom.find(ind => ind.id === config.unit || ind.id === config.indicatorId) || null;
            if (customUnitDef) {
                const activeMode = config.mode || 'swing';
                const computedSeries = evaluateCustomLabSeries(candles, customUnitDef, activeMode);
                if (Array.isArray(computedSeries) && computedSeries.length > 0) {
                    customUnitMap = new Map();
                    computedSeries.forEach((d, idx) => {
                        const candle = candles[idx];
                        if (!candle) return;
                        if (d !== null && typeof d === 'object' && d.time !== undefined) {
                            customUnitMap.set(d.time, d);
                        } else {
                            customUnitMap.set(candle.time, typeof d === 'number' ? { value: d } : d);
                        }
                    });
                }
            }
        } catch (err) {
            console.warn('[backtestEngine] Failed to precalculate dynamic custom unit:', err);
        }
    }

    // Standard indicator or strategy unit support
    let standardIndicatorSeries = null;
    let standardIndicatorDef = null;
    let strategyRules = null;
    let strategyComputedSeries = null;

    const indDef = SIGNAL_DEFINITIONS[config.unit] || (config.indicatorId && SIGNAL_DEFINITIONS[config.indicatorId]);
    if (indDef) {
        standardIndicatorDef = indDef;
        try {
            standardIndicatorSeries = indDef.compute(candles, config.params || indDef.defaultParams || {});
        } catch (err) {
            console.warn('[backtestEngine] Failed to compute standard indicator:', err);
        }
    } else if (config.unit?.startsWith('strat_') || customUnitDef?.type === 'STRATEGY' || config.strategyRules) {
        try {
            let strat = customUnitDef;
            if (!strat) {
                const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('praxis_strategies') : null;
                const strats = raw ? JSON.parse(raw) : [];
                strat = strats.find(s => s.id === config.unit);
            }
            const rules = config.strategyRules || strat?.rules;
            if (rules && rules.length > 0) {
                strategyRules = rules;
                strategyComputedSeries = precalculateStrategySeries(candles, rules, {}, [], config.mode || 'swing');
            }
        } catch (err) {
            console.warn('[backtestEngine] Failed to precalculate strategy series:', err);
        }
    }

    // 2. Scan and evaluate signals
    const trades = [];
    const directionalSignals = [];
    const minLookback = 20;

    let activeTrade = null;
    let lastPatternScore = 0;

    for (let i = minLookback; i < n; i++) {
        const currentCandle = candles[i];
        const nextCandle = i + 1 < n ? candles[i + 1] : null;

        // If currently in a trade, evaluate exits
        if (activeTrade) {
            const isExit = evaluateTradeExit(activeTrade, candles, i, config.exitRule, config.costModel, config.mode, config.timeframe, nextCandle);
            if (isExit) {
                trades.push(activeTrade);
                activeTrade = null;
            }
            continue; // Prevent overlapping trade re-entry on same bar
        }

        // On the final candle (i === n - 1), do not generate new orders if NEXT_BAR_OPEN requires i + 1
        if (i >= n - 1 && config.slippageModel === 'NEXT_BAR_OPEN') {
            continue;
        }

        // Generate signal at bar i
        const signal = detectSignalAtBar(
            i,
            candles,
            config,
            { pncoMap, ifdiMap, aavbMidMap, aavbUpMap, aavbLowMap, atrMap, lastPatternScore, customLabMap, customUnitMap, customUnitDef, patternCache, standardIndicatorDef, standardIndicatorSeries, strategyRules, strategyComputedSeries }
        );

        if (signal?.currentScore !== undefined) {
            lastPatternScore = signal.currentScore;
        }

        if (!signal || signal.dummy) continue;

        // Record detected directional signal for multi-leg options modeling & signal tracking
        directionalSignals.push({
            index: i,
            direction: signal.direction,
            type: signal.type,
            label: signal.label,
            candle: currentCandle,
        });

        // Signal Quality & Conviction Filter (prunes low-confidence noise setups)
        if (config.minConfidence && (signal.confidence || 0) < config.minConfidence) {
            continue;
        }

        // Determine Entry Fill Price
        const entryPrice = config.slippageModel === 'NEXT_BAR_OPEN'
            ? (nextCandle ? nextCandle.open : currentCandle.close)
            : currentCandle.close;

        const entryTime = config.slippageModel === 'NEXT_BAR_OPEN'
            ? (nextCandle ? nextCandle.time : currentCandle.time)
            : currentCandle.time;

        const entryBarIndex = (config.slippageModel === 'NEXT_BAR_OPEN' && nextCandle) ? i + 1 : i;

        activeTrade = {
            id: `trade_${trades.length + 1}`,
            signalType: signal.type,
            direction: signal.direction, // 1 for BUY (Long), -1 for SELL (Short)
            unit: signal.unit,
            sourceDetail: signal.label,
            confidence: signal.confidence || 65,
            entryBarIndex,
            entryTime,
            entryPrice,
            barsHeld: 0,
            highestPrice: entryPrice,
            lowestPrice: entryPrice,
            mfePct: 0,
            maePct: 0,
            status: 'OPEN',
            isOutOfSample: i >= splitIndex,
        };
    }

    // Close any active trade remaining at the final candle
    if (activeTrade) {
        closeTrade(activeTrade, candles[n - 1].close, candles[n - 1].time, n - 1, 'END_OF_DATA', config.costModel);
        trades.push(activeTrade);
    }

    // 3. Compute Equity Curve and Financial Metrics
    const { summary, equityCurve, calibration, walkForwardSummary } = computeBacktestMetrics(
        trades,
        candles,
        config.initialCapital || 100000,
        splitIndex,
        config
    );

    // 4. Monte Carlo Robustness Resampling (2,000 Resamples, Block Resampling)
    const initialCapital = config.initialCapital || 100000;
    const monteCarlo = runMonteCarloSimulation(trades, initialCapital, {
        iterations: config.mcIterations || 2000,
        blockSize: config.mcBlockSize || 5,
    });

    // 5. Market Regime Analysis (Bull/Bear/Chop/Crisis/Low-Vol Matrix)
    const marketRegimes = analyzeRegimePerformance(candles, trades);

    // 6. Options Strategy Backtest (Merton BSM Multi-Leg Replication)
    const optStratType = config.optionsStrategyType || (summary.shortCount > summary.longCount ? 'BEAR_PUT_SPREAD' : 'BULL_CALL_SPREAD');
    const optionsBacktest = runOptionsStrategyBacktest(candles, directionalSignals, {
        strategyType: optStratType,
        targetDte: config.optionsTargetDte || 14,
        baselineIvPct: config.optionsIvPct || 18.0,
        lotSize: config.optionsLotSize || 50,
        riskFreeRatePct: config.riskFreeRatePct || 7.0,
        profitTargetPct: config.optionsProfitTargetPct || 50.0,
        stopLossPct: config.optionsStopLossPct || 60.0,
    });

    // 7. Full 500-Point Institutional Quantitative Audit across 28 Categories
    const quantitativeAudit = evaluateInstitutionalAudit({
        summary,
        trades,
        equityCurve,
        walkForward: walkForwardSummary,
        monteCarlo,
        marketRegimes,
        optionsBacktest,
        config,
    });

    return {
        config,
        summary,
        walkForward: walkForwardSummary,
        trades,
        equityCurve,
        calibration,
        monteCarlo,
        marketRegimes,
        optionsBacktest,
        quantitativeAudit,
        indicators: {
            pnco: pncoData,
            aavb: aavbData,
            ifdi: ifdiData,
            customLab: config.customLabSeries || (customUnitMap ? Array.from(customUnitMap.entries()).map(([time, v]) => ({ time, value: typeof v === 'object' ? (v?.value ?? v?.val ?? 0) : Number(v) })) : null),
        },
    };
}

// ─── Signal Detection Logic ────────────────────────────────────────────────

function detectSignalAtBar(i, candles, config, dataMaps) {
    const currentCandle = candles[i];
    const prevCandle = candles[i - 1];
    const { unit, mode } = config;

    // A. 7-CANDLE PREDICTOR EVALUATION
    if (unit === 'PREDICTOR') {
        const tfProfile = TIMEFRAME_DEFAULTS[config.timeframe] || TIMEFRAME_DEFAULTS.day;
        const modeMultiplier = mode === 'intraday' ? 0.75 : mode === 'positional' ? 1.35 : 1.0;
        const baseThreshold = (tfProfile.targetPct ? (tfProfile.targetPct / 100) * 0.30 : 0.006) * modeMultiplier;
        
        // Full 7-Candle Rolling Sequence (candles[i-6] to candles[i])
        const lookback = Math.min(6, i);
        const startCandle = candles[i - lookback];
        const netDelta = (currentCandle.close - startCandle.close) / startCandle.close;
        const absDelta = Math.abs(netDelta);

        // Body dominance and momentum structure across the 7 bars
        let bullBars = 0;
        let bearBars = 0;
        let totalRange = 0;
        let bodySum = 0;

        for (let j = i - lookback; j <= i; j++) {
            const c = candles[j];
            const body = Math.abs(c.close - c.open);
            const range = Math.max(0.0001, c.high - c.low);
            totalRange += range;
            bodySum += body;
            if (c.close >= c.open) bullBars++;
            else bearBars++;
        }

        const bodyRatio = totalRange > 0 ? bodySum / totalRange : 0.5;
        const pnco = dataMaps.pncoMap?.get(currentCandle.time);
        const ifdi = dataMaps.ifdiMap?.get(currentCandle.time);

        // Bullish Signal Evaluation
        if (netDelta > baseThreshold && (!pnco || pnco.value > -10)) {
            const momentumScore = Math.min(40, (absDelta / (baseThreshold * 3.5)) * 40);
            const structureScore = (bullBars / (lookback + 1)) * 25;
            const bodyScore = Math.min(15, bodyRatio * 20);
            const indicatorBonus = (pnco && pnco.value > 0 ? 10 : 0) + (ifdi && ifdi.value > 0 ? 10 : 0);

            const totalScore = momentumScore + structureScore + bodyScore + indicatorBonus;
            const conf = Math.min(92, Math.max(54, Math.round(52 + (totalScore / 100) * 40)));

            return {
                type: 'BUY',
                direction: 1,
                unit: 'PREDICTOR',
                label: `AI Bullish 7b (${conf}%)`,
                confidence: conf,
                rawConfidence: conf,
            };
        } 
        // Bearish Signal Evaluation
        else if (netDelta < -baseThreshold && (!pnco || pnco.value < 10)) {
            const momentumScore = Math.min(40, (absDelta / (baseThreshold * 3.5)) * 40);
            const structureScore = (bearBars / (lookback + 1)) * 25;
            const bodyScore = Math.min(15, bodyRatio * 20);
            const indicatorBonus = (pnco && pnco.value < 0 ? 10 : 0) + (ifdi && ifdi.value < 0 ? 10 : 0);

            const totalScore = momentumScore + structureScore + bodyScore + indicatorBonus;
            const conf = Math.min(92, Math.max(54, Math.round(52 + (totalScore / 100) * 40)));

            return {
                type: 'SELL',
                direction: -1,
                unit: 'PREDICTOR',
                label: `AI Bearish 7b (${conf}%)`,
                confidence: conf,
                rawConfidence: conf,
            };
        }
        return null;
    }

    // B. PATTERN RECOGNITION ENGINE
    if (unit === 'PATTERNS') {
        const cacheKey = `pat_${i}_${mode}`;
        let analysis;
        if (dataMaps.patternCache && dataMaps.patternCache.has(cacheKey)) {
            analysis = dataMaps.patternCache.get(cacheKey);
        } else {
            const slice = candles.slice(Math.max(0, i - 60), i + 1);
            analysis = analyzeChartPatterns(slice, mode);
            if (dataMaps.patternCache) dataMaps.patternCache.set(cacheKey, analysis);
        }
        if (!analysis || !analysis.activePatterns || analysis.activePatterns.length === 0) return null;

        // Find freshly formed pattern on this bar (single-bar age <= 1, structural age <= pivotLen + 1)
        const pivotLen = mode === 'positional' ? 10 : mode === 'swing' ? 5 : 3;
        const latest = analysis.activePatterns.find(p => {
            if (p.invalidated) return false;
            const maxAllowedAge = (p.len > 2 || p.stopLevel !== undefined) ? (pivotLen + 1) : 1;
            return p.age <= maxAllowedAge;
        });
        if (!latest) return null;

        if (config.selectedPattern !== 'ALL' && latest.id !== config.selectedPattern) {
            return null;
        }

        const isBullish = latest.dir === 1;
        const patternBase = Math.abs(latest.base || 4);
        const conf = Math.min(92, Math.max(56, Math.round(55 + (patternBase / 6) * 35)));

        return {
            type: isBullish ? 'BUY' : 'SELL',
            direction: latest.dir,
            unit: 'PATTERNS',
            label: `${latest.name}`,
            confidence: conf,
        };
    }

    // C. COMPOSITE PATTERN SCORE
    if (unit === 'COMPOSITE_SCORE') {
        const cacheKey = `comp_${i}_${mode}`;
        let analysis;
        if (dataMaps.patternCache && dataMaps.patternCache.has(cacheKey)) {
            analysis = dataMaps.patternCache.get(cacheKey);
        } else {
            const slice = candles.slice(Math.max(0, i - 45), i + 1);
            analysis = analyzeChartPatterns(slice, mode);
            if (dataMaps.patternCache) dataMaps.patternCache.set(cacheKey, analysis);
        }
        const currScore = Number(analysis?.score || 0);
        const prevScore = dataMaps.lastPatternScore !== undefined ? dataMaps.lastPatternScore : 0;
        const th = config.patternThreshold || 4;

        let res = null;
        // Bullish crossover
        if (prevScore < th && currScore >= th) {
            const conf = Math.min(90, Math.max(60, Math.round(62 + (currScore - th) * 6)));
            res = { type: 'BUY', direction: 1, unit: 'COMPOSITE_SCORE', label: `Pattern Score >= +${th}`, confidence: conf, currentScore: currScore };
        }
        // Bearish crossunder
        else if (prevScore > -th && currScore <= -th) {
            const conf = Math.min(90, Math.max(60, Math.round(62 + (Math.abs(currScore) - th) * 6)));
            res = { type: 'SELL', direction: -1, unit: 'COMPOSITE_SCORE', label: `Pattern Score <= -${th}`, confidence: conf, currentScore: currScore };
        }

        return res ? res : { currentScore: currScore, dummy: true };
    }

    // D. PNCO (Praxis Neural Confluence Oscillator)
    if (unit === 'PNCO') {
        const currPnco = dataMaps.pncoMap?.get(currentCandle.time);
        const prevPnco = dataMaps.pncoMap?.get(prevCandle.time);
        if (!currPnco || !prevPnco) return null;
        const th = config.pncoThreshold || 25;

        // Zero-line cross
        if (prevPnco.value < 0 && currPnco.value >= 0) {
            return { type: 'BUY', direction: 1, unit: 'PNCO', label: 'PNCO Zero Bull Cross', confidence: 70 };
        }
        if (prevPnco.value > 0 && currPnco.value <= 0) {
            return { type: 'SELL', direction: -1, unit: 'PNCO', label: 'PNCO Zero Bear Cross', confidence: 70 };
        }
        // Momentum Extreme Threshold Reversal
        if (prevPnco.value < -th && currPnco.value >= -th) {
            return { type: 'BUY', direction: 1, unit: 'PNCO', label: `PNCO Oversold Bounce (>-${th})`, confidence: 76 };
        }
        if (prevPnco.value > th && currPnco.value <= th) {
            return { type: 'SELL', direction: -1, unit: 'PNCO', label: `PNCO Overbought Pullback (<+${th})`, confidence: 76 };
        }
        // Trap signals
        if (currPnco.trap === 'BEAR_TRAP') {
            return { type: 'BUY', direction: 1, unit: 'PNCO', label: 'PNCO Bear Trap Reversal', confidence: 84 };
        }
        if (currPnco.trap === 'BULL_TRAP') {
            return { type: 'SELL', direction: -1, unit: 'PNCO', label: 'PNCO Bull Trap Reversal', confidence: 84 };
        }
        return null;
    }

    // E. AAVB (AI-Adaptive Volatility Bands)
    if (unit === 'AAVB') {
        const lowBand = dataMaps.aavbLowMap?.get(currentCandle.time);
        const upBand = dataMaps.aavbUpMap?.get(currentCandle.time);
        const midBand = dataMaps.aavbMidMap?.get(currentCandle.time);
        if (!lowBand || !upBand || !midBand) return null;

        const isNearLower = currentCandle.low <= lowBand * 1.008;
        const isMidBullCross = prevCandle && prevCandle.close < midBand && currentCandle.close >= midBand;
        if (isNearLower || isMidBullCross) {
            return { 
                type: 'BUY', 
                direction: 1, 
                unit: 'AAVB', 
                label: isNearLower ? 'AAVB Lower Support' : 'AAVB Midline Bull Cross', 
                confidence: isNearLower ? 78 : 72 
            };
        }

        const isNearUpper = currentCandle.high >= upBand * 0.992;
        const isMidBearCross = prevCandle && prevCandle.close > midBand && currentCandle.close <= midBand;
        if (isNearUpper || isMidBearCross) {
            return { 
                type: 'SELL', 
                direction: -1, 
                unit: 'AAVB', 
                label: isNearUpper ? 'AAVB Upper Resistance' : 'AAVB Midline Bear Cross', 
                confidence: isNearUpper ? 78 : 72 
            };
        }
        return null;
    }

    // F. IFDI (Institutional Flow Divergence Index)
    if (unit === 'IFDI') {
        const currIfdi = dataMaps.ifdiMap?.get(currentCandle.time);
        const prevIfdi = dataMaps.ifdiMap?.get(prevCandle.time);
        if (!currIfdi) return null;

        if (currIfdi.divergence === 'HIDDEN_ACCUMULATION') {
            return { type: 'BUY', direction: 1, unit: 'IFDI', label: 'Smart Money Accumulation', confidence: 86 };
        }
        if (currIfdi.divergence === 'HIDDEN_DISTRIBUTION') {
            return { type: 'SELL', direction: -1, unit: 'IFDI', label: 'Smart Money Distribution', confidence: 86 };
        }
        if (prevIfdi && prevIfdi.flowState !== 'ACCUMULATION' && currIfdi.flowState === 'ACCUMULATION') {
            return { type: 'BUY', direction: 1, unit: 'IFDI', label: 'Flow State Influx', confidence: 70 };
        }
        if (prevIfdi && prevIfdi.flowState !== 'DISTRIBUTION' && currIfdi.flowState === 'DISTRIBUTION') {
            return { type: 'SELL', direction: -1, unit: 'IFDI', label: 'Flow State Outflow', confidence: 70 };
        }
        return null;
    }

    // G. HEAD-TO-HEAD COMPARISON
    if (unit === 'HEAD_TO_HEAD') {
        const pnco = dataMaps.pncoMap?.get(currentCandle.time);
        const ifdi = dataMaps.ifdiMap?.get(currentCandle.time);
        const th = config.pncoThreshold || 20;

        if (pnco && pnco.value > th && ifdi && ifdi.value > 10) {
            return { type: 'BUY', direction: 1, unit: 'HEAD_TO_HEAD', label: 'Tri-Factor Confluence Buy', confidence: 88 };
        }
        if (pnco && pnco.value < -th && ifdi && ifdi.value < -10) {
            return { type: 'SELL', direction: -1, unit: 'HEAD_TO_HEAD', label: 'Tri-Factor Confluence Sell', confidence: 88 };
        }
        return null;
    }

    // H. CUSTOM COMBO STRATEGY
    if (unit === 'CUSTOM_COMBO') {
        const slice = candles.slice(Math.max(0, i - 20), i + 1);
        const patternScore = analyzeChartPatterns(slice, mode)?.score || 0;
        const ifdi = dataMaps.ifdiMap?.get(currentCandle.time);
        const midAavb = dataMaps.aavbMidMap?.get(currentCandle.time);

        const rules = config.customRules || {};
        const minScore = rules.patternScoreMin !== undefined ? rules.patternScoreMin : 2;

        const scoreLongOk = patternScore >= minScore;
        const ifdiLongOk = !rules.requireIfdiAccumulation || (ifdi && (ifdi.flowState === 'ACCUMULATION' || ifdi.value > 5));
        const aavbLongOk = !rules.aboveAavbMidline || (midAavb && currentCandle.close >= midAavb * 0.998);

        if (scoreLongOk && ifdiLongOk && aavbLongOk) {
            return { type: 'BUY', direction: 1, unit: 'CUSTOM_COMBO', label: 'Alpha Confluence Long', confidence: 88 };
        }

        const scoreShortOk = patternScore <= -minScore;
        const ifdiShortOk = !rules.requireIfdiAccumulation || (ifdi && (ifdi.flowState === 'DISTRIBUTION' || ifdi.value < -5));
        const aavbShortOk = !rules.aboveAavbMidline || (midAavb && currentCandle.close <= midAavb * 1.002);

        if (scoreShortOk && ifdiShortOk && aavbShortOk) {
            return { type: 'SELL', direction: -1, unit: 'CUSTOM_COMBO', label: 'Alpha Confluence Short', confidence: 88 };
        }
        return null;
    }

    // I. MASTER STANDARD INDICATORS (27 OHLCV Algorithms)
    if (dataMaps.standardIndicatorDef && dataMaps.standardIndicatorSeries) {
        const indDef = dataMaps.standardIndicatorDef;
        const series = dataMaps.standardIndicatorSeries;
        const cond = indDef.presetConditions?.[0];
        if (cond) {
            const thresh = cond.hasThreshold ? (config.customThreshold ?? cond.thresholdConfig?.defaultThreshold) : undefined;
            const isBuy = typeof cond.checkBuy === 'function' && cond.checkBuy(series[i], series[i - 1], currentCandle, prevCandle, thresh);
            const isSell = typeof cond.checkSell === 'function' && cond.checkSell(series[i], series[i - 1], currentCandle, prevCandle, thresh);

            if (isBuy) {
                return {
                    type: 'BUY',
                    direction: 1,
                    unit: config.unit,
                    label: `${indDef.label}: ${cond.label}`,
                    confidence: 78,
                };
            }
            if (isSell) {
                return {
                    type: 'SELL',
                    direction: -1,
                    unit: config.unit,
                    label: `${indDef.label}: ${cond.label}`,
                    confidence: 78,
                };
            }
        }
        return null;
    }

    // J. COMPOUND MULTI-FACTOR STRATEGY (Confluence Chain)
    if (dataMaps.strategyRules && dataMaps.strategyComputedSeries) {
        const isLong = evaluateStrategyRulesAtBar(i, candles, dataMaps.strategyRules, dataMaps.strategyComputedSeries, 'LONG', config.mode || 'swing', [], config.volatileTimer || 3);
        if (isLong) {
            return {
                type: 'BUY',
                direction: 1,
                unit: config.unit,
                label: `${dataMaps.customUnitDef?.label || 'Strategy'}: Long Confluence`,
                confidence: 85,
            };
        }
        const isShort = evaluateStrategyRulesAtBar(i, candles, dataMaps.strategyRules, dataMaps.strategyComputedSeries, 'SHORT', config.mode || 'swing', [], config.volatileTimer || 3);
        if (isShort) {
            return {
                type: 'SELL',
                direction: -1,
                unit: config.unit,
                label: `${dataMaps.customUnitDef?.label || 'Strategy'}: Short Confluence`,
                confidence: 85,
            };
        }
        return null;
    }

    // K. DYNAMIC CUSTOM UNIT / CUSTOM LAB MODEL
    const isBuiltin = ['PREDICTOR', 'PATTERNS', 'COMPOSITE_SCORE', 'PNCO', 'AAVB', 'IFDI', 'HEAD_TO_HEAD', 'CUSTOM_COMBO'].includes(unit);
    if (!isBuiltin || unit === 'CUSTOM_LAB' || dataMaps.customUnitMap) {
        const map = dataMaps.customUnitMap || dataMaps.customLabMap;
        if (!map) return null;

        const curr = map.get(currentCandle.time);
        const prev = map.get(prevCandle.time);
        if (curr === undefined || curr === null || prev === undefined || prev === null) return null;

        const currVal = (curr !== null && typeof curr === 'object') ? (curr.value ?? curr.val ?? (typeof curr[Object.keys(curr)[0]] === 'number' ? curr[Object.keys(curr)[0]] : 0)) : Number(curr);
        const prevVal = (prev !== null && typeof prev === 'object') ? (prev.value ?? prev.val ?? (typeof prev[Object.keys(prev)[0]] === 'number' ? prev[Object.keys(prev)[0]] : 0)) : Number(prev);

        const customDef = dataMaps.customUnitDef;
        const activeMode = config.mode || 'swing';
        const modeParams = (customDef?.modes && customDef.modes[activeMode]) ? customDef.modes[activeMode] : (customDef?.modes?.swing || {});
        const defaultThreshold = Number(modeParams.threshold ?? 20);
        const threshold = Number(config.customThreshold !== undefined ? config.customThreshold : defaultThreshold);

        // 1. Check baked rules if present on custom definition
        if (customDef?.rules && Array.isArray(customDef.rules) && customDef.rules.length > 0) {
            for (const r of customDef.rules) {
                if (typeof r.checkBuy === 'function') {
                    try {
                        if (r.checkBuy(currVal, prevVal, currentCandle, prevCandle)) {
                            return {
                                type: 'BUY',
                                direction: 1,
                                unit: unit,
                                label: `${customDef.nickname || customDef.name}: ${r.label || 'Buy Rule'}`,
                                confidence: 82,
                            };
                        }
                    } catch (e) {}
                }
                if (typeof r.checkSell === 'function') {
                    try {
                        if (r.checkSell(currVal, prevVal, currentCandle, prevCandle)) {
                            return {
                                type: 'SELL',
                                direction: -1,
                                unit: unit,
                                label: `${customDef.nickname || customDef.name}: ${r.label || 'Sell Rule'}`,
                                confidence: 82,
                            };
                        }
                    } catch (e) {}
                }
            }
        }

        // 2. Threshold crossover and crossunder
        const crossAbove = config.customLabSignal?.crossAbove ?? (threshold !== 0 ? threshold : 0);
        const crossBelow = config.customLabSignal?.crossBelow ?? (threshold !== 0 ? -threshold : 0);
        const label = config.customLabName || customDef?.name || 'Custom Unit';

        if (prevVal < crossAbove && currVal >= crossAbove) {
            return { 
                type: 'BUY', 
                direction: 1, 
                unit, 
                label: `${customDef?.nickname || label} Cross Above ${crossAbove}`, 
                confidence: 80 
            };
        }
        if (prevVal > crossBelow && currVal <= crossBelow) {
            return { 
                type: 'SELL', 
                direction: -1, 
                unit, 
                label: `${customDef?.nickname || label} Cross Below ${crossBelow}`, 
                confidence: 80 
            };
        }
        return null;
    }


    return null;
}

// ─── Trade Exit Evaluation ─────────────────────────────────────────────────

export function evaluateTradeExit(trade, candles, currentIdx, exitRule, costModel = 'INDIAN_REALISTIC', mode = 'swing', timeframe = 'day', nextCandle = null) {
    const candle = candles[currentIdx];
    trade.barsHeld++;

    const isLong = trade.direction === 1;

    // Track intra-trade MAE and MFE percentages
    if (isLong) {
        const currHighPct = ((candle.high - trade.entryPrice) / trade.entryPrice) * 100;
        const currLowPct = ((candle.low - trade.entryPrice) / trade.entryPrice) * 100;
        trade.mfePct = Math.max(trade.mfePct || 0, currHighPct);
        trade.maePct = Math.min(trade.maePct || 0, currLowPct);
    } else {
        const currHighPct = ((trade.entryPrice - candle.low) / trade.entryPrice) * 100;
        const currLowPct = ((trade.entryPrice - candle.high) / trade.entryPrice) * 100;
        trade.mfePct = Math.max(trade.mfePct || 0, currHighPct);
        trade.maePct = Math.min(trade.maePct || 0, Math.min(0, currLowPct));
    }

    // 1. Target & Stop Check
    if (exitRule.type === 'TARGET_STOP' || exitRule.type === 'TRAILING_STOP') {
        const targetPct = exitRule.targetPct / 100;
        let stopPct = exitRule.stopPct / 100;

        // Breakeven stop lock logic: if MFE >= 50% of target, move stop to entry (0% loss)
        if (exitRule.lockBreakeven && trade.mfePct >= (exitRule.targetPct * 0.5)) {
            stopPct = 0; // Lock stop loss at entry price
        }

        if (isLong) {
            const targetPrice = trade.entryPrice * (1 + targetPct);
            const stopPrice = trade.entryPrice * (1 - stopPct);

            let trailStopPrice = null;
            if (exitRule.type === 'TRAILING_STOP') {
                const trailPct = (exitRule.trailingStopPct || 1.0) / 100;
                const priorPeak = trade.highestPrice;
                const peakGain = (priorPeak - trade.entryPrice) / trade.entryPrice;
                if (peakGain >= Math.max(0.01, trailPct * 0.8)) {
                    trailStopPrice = priorPeak * (1 - trailPct);
                }
            }

            const isTrailingActive = trailStopPrice !== null && trailStopPrice > stopPrice;
            const effectiveStopPrice = isTrailingActive ? trailStopPrice : stopPrice;
            const stopExitReason = isTrailingActive ? 'TRAILING_STOP' : (stopPct === 0 ? 'BREAKEVEN' : 'STOP');

            // A. True Gap Openings Execution (fills at actual market open if gapped beyond level)
            if (candle.open <= effectiveStopPrice) {
                closeTrade(trade, candle.open, candle.time, currentIdx, stopExitReason, costModel);
                return true;
            }
            if (candle.open >= targetPrice) {
                closeTrade(trade, candle.open, candle.time, currentIdx, 'TARGET', costModel);
                return true;
            }

            // B. Intra-Bar Price Range Check
            const isTargetHit = candle.high >= targetPrice;
            const isStopHit = candle.low <= effectiveStopPrice;

            // Conflict resolution: if both touched within same candle
            // Institutional conservative worst-case execution: Stop Loss takes priority to eliminate look-ahead optimism bias
            if (isTargetHit && isStopHit) {
                closeTrade(trade, effectiveStopPrice, candle.time, currentIdx, stopExitReason, costModel);
                return true;
            }

            if (isTargetHit) {
                closeTrade(trade, targetPrice, candle.time, currentIdx, 'TARGET', costModel);
                return true;
            }
            if (isStopHit) {
                closeTrade(trade, effectiveStopPrice, candle.time, currentIdx, stopExitReason, costModel);
                return true;
            }

            trade.highestPrice = Math.max(trade.highestPrice, candle.high);
            trade.lowestPrice = Math.min(trade.lowestPrice, candle.low);
        } else {
            // Short trade
            const targetPrice = trade.entryPrice * (1 - targetPct);
            const stopPrice = trade.entryPrice * (1 + stopPct);

            let trailStopPrice = null;
            if (exitRule.type === 'TRAILING_STOP') {
                const trailPct = (exitRule.trailingStopPct || 1.0) / 100;
                const priorTrough = trade.lowestPrice;
                const peakGain = (trade.entryPrice - priorTrough) / trade.entryPrice;
                if (peakGain >= Math.max(0.01, trailPct * 0.8)) {
                    trailStopPrice = priorTrough * (1 + trailPct);
                }
            }

            const isTrailingActive = trailStopPrice !== null && trailStopPrice < stopPrice;
            const effectiveStopPrice = isTrailingActive ? trailStopPrice : stopPrice;
            const stopExitReason = isTrailingActive ? 'TRAILING_STOP' : (stopPct === 0 ? 'BREAKEVEN' : 'STOP');

            // A. True Gap Openings Execution
            if (candle.open >= effectiveStopPrice) {
                closeTrade(trade, candle.open, candle.time, currentIdx, stopExitReason, costModel);
                return true;
            }
            if (candle.open <= targetPrice) {
                closeTrade(trade, candle.open, candle.time, currentIdx, 'TARGET', costModel);
                return true;
            }

            // B. Intra-Bar Price Range Check
            const isTargetHit = candle.low <= targetPrice;
            const isStopHit = candle.high >= effectiveStopPrice;

            if (isTargetHit && isStopHit) {
                closeTrade(trade, effectiveStopPrice, candle.time, currentIdx, stopExitReason, costModel);
                return true;
            }

            if (isTargetHit) {
                closeTrade(trade, targetPrice, candle.time, currentIdx, 'TARGET', costModel);
                return true;
            }
            if (isStopHit) {
                closeTrade(trade, effectiveStopPrice, candle.time, currentIdx, stopExitReason, costModel);
                return true;
            }

            trade.highestPrice = Math.max(trade.highestPrice, candle.high);
            trade.lowestPrice = Math.min(trade.lowestPrice, candle.low);
        }
    } else {
        trade.highestPrice = Math.max(trade.highestPrice, candle.high);
        trade.lowestPrice = Math.min(trade.lowestPrice, candle.low);
    }

    // 2. Fixed N-Bar Horizon Expiration
    const horizonLimit = exitRule.horizonBars || 14;
    const isFixedHorizon = exitRule.type === 'HORIZON';
    const isTimeoutActive = isFixedHorizon || (exitRule.enableHorizonTimeout === true && horizonLimit > 0);

    if (isTimeoutActive && trade.barsHeld >= horizonLimit) {
        closeTrade(trade, candle.close, candle.time, currentIdx, 'HORIZON_EXPIRY', costModel);
        return true;
    }

    // 3. Intraday End-of-Day (EOD) Square-Off Guard
    if (mode === 'intraday' && timeframe !== 'day' && nextCandle) {
        if (!isSameTradingDay(candle.time, nextCandle.time)) {
            closeTrade(trade, candle.close, candle.time, currentIdx, 'EOD_SQUAREOFF', costModel);
            return true;
        }
    }

    return false;
}

function isSameTradingDay(t1, t2) {
    if (!t1 || !t2) return true;
    const toDateStr = (t) => {
        if (typeof t === 'string') return t.slice(0, 10);
        const ms = typeof t === 'number' && t < 1e11 ? t * 1000 : t;
        return new Date(ms).toISOString().slice(0, 10);
    };
    return toDateStr(t1) === toDateStr(t2);
}

export function closeTrade(trade, exitPrice, exitTime, exitBarIndex, reason, costModel = 'INDIAN_REALISTIC') {
    trade.status = 'CLOSED';
    const validExitPrice = (typeof exitPrice === 'number' && exitPrice > 0 && isFinite(exitPrice)) ? exitPrice : trade.entryPrice;
    trade.exitPrice = Math.round(validExitPrice * 100) / 100;
    trade.exitTime = exitTime;
    trade.exitBarIndex = exitBarIndex;
    trade.exitReason = reason;

    // Calculate Friction / Transaction Cost via Institutional Indian Fee Model
    let frictionPct = 0;
    let feeBreakdown = null;

    if (costModel === 'INDIAN_REALISTIC' || (costModel && typeof costModel === 'object')) {
        const feeData = calculateRoundTripTransactionCosts({
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            quantity: trade.quantity || 1,
            direction: trade.direction || 1,
            atr: trade.entryAtr || 0,
        }, typeof costModel === 'object' ? costModel : {});

        frictionPct = feeData.totalCostPct;
        feeBreakdown = feeData;
    } else if (costModel === 'NONE') {
        frictionPct = 0;
    }

    const rawReturn = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * trade.direction;
    trade.rawReturnPct = Math.round(rawReturn * 100) / 100;
    trade.frictionPct = frictionPct;
    trade.feeDetails = feeBreakdown;
    trade.returnPct = Math.round((rawReturn - frictionPct) * 100) / 100;

    if (reason === 'BREAKEVEN' || Math.abs(rawReturn) < 0.001) {
        trade.outcome = 'BREAKEVEN';
    } else if (trade.returnPct > 0) {
        trade.outcome = 'WIN';
    } else {
        trade.outcome = 'LOSS';
    }
}

// ─── Scorecard & Performance Metrics Calculation ───────────────────────────

/**
 * Computes Wilson Score 95% Confidence Interval for a proportion.
 */
export function calculateWilsonScoreCI(wins, total, z = 1.96) {
    if (!total || total <= 0) return { ciLower: null, ciUpper: null };
    const p = wins / total;
    const denom = 1 + (z * z) / total;
    const center = (p + (z * z) / (2 * total)) / denom;
    const margin = (z * Math.sqrt((p * (1 - p) / total) + (z * z) / (4 * total * total))) / denom;
    return {
        ciLower: Math.max(0, Math.round((center - margin) * 100)),
        ciUpper: Math.min(100, Math.round((center + margin) * 100)),
    };
}

/**
 * Calculates Expected Calibration Error (ECE):
 * ECE = sum( (N_bucket / N_total) * |acc_bucket - conf_bucket| )
 * Measures the weighted average percentage gap between predicted confidence and observed win rate.
 */
export function calculateExpectedCalibrationError(buckets = []) {
    let weightedErrorSum = 0;
    let countedSamples = 0;
    buckets.forEach((b) => {
        if (b.sampleSize > 0 && b.actualWinRate !== null && b.predictedWinRate !== null) {
            const gap = Math.abs(b.predictedWinRate - b.actualWinRate);
            weightedErrorSum += b.sampleSize * gap;
            countedSamples += b.sampleSize;
        }
    });
    if (countedSamples === 0) return null;
    return Math.round((weightedErrorSum / countedSamples) * 10) / 10;
}

/**
 * Calculates Brier Score:
 * BS = (1 / N) * sum( (probability_i - outcome_i)^2 )
 * Lower is better (0 = perfect foresight, 0.25 = uninformative 50/50 baseline).
 */
export function calculateBrierScore(trades = [], isCalibrated = false, probMapFn = null) {
    if (!trades || trades.length === 0) return 0;
    const resolvedTrades = trades.filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BREAKEVEN');
    if (resolvedTrades.length === 0) return 0;

    let sumSquaredError = 0;
    resolvedTrades.forEach((t) => {
        let prob = (t.confidence || 65) / 100;
        if (isCalibrated && probMapFn && typeof probMapFn === 'function') {
            prob = probMapFn(t) / 100;
        }
        const outcome = t.outcome === 'WIN' ? 1 : 0;
        sumSquaredError += Math.pow(prob - outcome, 2);
    });
    return Math.round((sumSquaredError / resolvedTrades.length) * 1000) / 1000;
}

/**
 * Computes both Fixed Intervals & Adaptive Quantile Tiers for AI confidence calibration.
 * Supports both Raw (heuristic conviction) and Calibrated (empirical probability) curves,
 * alongside ECE, Brier Score, and Momentum Exhaustion Climax detection.
 */
export function computeCalibration(trades = [], calibBuckets = {}) {
    const validTrades = trades.filter(t => t.confidence !== undefined && (t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BREAKEVEN'));
    const sortedTrades = [...validTrades].sort((a, b) => (a.confidence || 60) - (b.confidence || 60));
    const totalValid = sortedTrades.length;

    // Helper: evaluate calibration status label
    const evaluateStatus = (predWin, actWin, isReliable, isTentative, sampleSize) => {
        if (sampleSize === 0) return 'NO_TRADES';
        if (sampleSize < 10) return 'INSUFFICIENT_SAMPLE';
        if (isTentative) return 'TENTATIVE';
        if (actWin === null) return 'INSUFFICIENT_SAMPLE';
        const gap = predWin - actWin;
        if (Math.abs(gap) <= 8) return 'CALIBRATED';
        if (gap > 8) return 'OVERCONFIDENT';
        return 'UNDERCONFIDENT';
    };

    // 1. Raw Fixed Range Bucketing
    const fixedRaw = Object.entries(calibBuckets).map(([bucket, b]) => {
        const predWin = b.total > 0 ? Math.round(b.sumConf / b.total) : (b.min + b.max) / 2;
        const actWin = b.total > 0 ? Math.round((b.wins / b.total) * 100) : null;
        
        const isReliable = b.total >= 20;
        const isTentative = b.total >= 10 && b.total < 20;
        const hasSample = b.total >= 10;
        const { ciLower, ciUpper } = calculateWilsonScoreCI(b.wins, b.total);
        const overconfidenceGap = hasSample && actWin !== null ? predWin - actWin : null;
        const status = evaluateStatus(predWin, actWin, isReliable, isTentative, b.total);

        return {
            bucket,
            min: b.min,
            max: b.max,
            sampleSize: b.total,
            predictedWinRate: predWin,
            actualWinRate: hasSample ? actWin : null,
            rawWinRate: actWin,
            ciLower,
            ciUpper,
            isReliable,
            isTentative,
            status,
            overconfidenceGap,
        };
    });

    // 2. Calibrated Fixed Range Bucketing (Predictions aligned to empirical frequencies)
    const fixedCalibrated = fixedRaw.map((b) => {
        if (b.actualWinRate === null || b.sampleSize === 0) return { ...b };
        const calibPred = b.actualWinRate;
        const gap = calibPred - b.actualWinRate;
        return {
            ...b,
            predictedWinRate: calibPred,
            rawPredictedWinRate: b.predictedWinRate,
            overconfidenceGap: gap,
            status: b.isTentative ? 'TENTATIVE' : 'CALIBRATED',
        };
    });

    // 3. Adaptive Quantile Tiers
    const adaptiveRaw = [];
    const adaptiveCalibrated = [];
    let exhaustionAnomaly = null;

    if (totalValid >= 10) {
        const numTiers = totalValid >= 30 ? 3 : 2;
        const tierNames = numTiers === 3 
            ? ['Low Conviction', 'Mid Conviction', 'High Conviction']
            : ['Moderate Conviction', 'High Conviction'];

        for (let t = 0; t < numTiers; t++) {
            const startIdx = Math.floor((t * totalValid) / numTiers);
            const endIdx = Math.floor(((t + 1) * totalValid) / numTiers);
            const tierTrades = sortedTrades.slice(startIdx, endIdx);
            if (tierTrades.length === 0) continue;

            const minC = Math.round(tierTrades[0].confidence || 60);
            const maxC = Math.round(tierTrades[tierTrades.length - 1].confidence || 60);
            const sumConf = tierTrades.reduce((acc, tr) => acc + (tr.confidence || 60), 0);
            const predWin = Math.round(sumConf / tierTrades.length);
            const wins = tierTrades.filter(tr => tr.outcome === 'WIN').length;
            const actWin = Math.round((wins / tierTrades.length) * 100);
            const isReliable = tierTrades.length >= 20;
            const isTentative = tierTrades.length >= 10 && tierTrades.length < 20;
            const { ciLower, ciUpper } = calculateWilsonScoreCI(wins, tierTrades.length);
            const overconfidenceGap = predWin - actWin;
            const status = evaluateStatus(predWin, actWin, isReliable, isTentative, tierTrades.length);

            const baseTier = {
                bucket: `${tierNames[t]} (${minC}–${maxC}%)`,
                tierLabel: tierNames[t],
                tierIndex: t,
                minConf: minC,
                maxConf: maxC,
                sampleSize: tierTrades.length,
                pctOfTotal: Math.round((tierTrades.length / totalValid) * 1000) / 10,
                predictedWinRate: predWin,
                actualWinRate: actWin,
                ciLower,
                ciUpper,
                isReliable,
                isTentative,
                status,
                overconfidenceGap,
            };

            adaptiveRaw.push(baseTier);

            // Calibrated counterpart (Predicts actual empirical rate)
            adaptiveCalibrated.push({
                ...baseTier,
                predictedWinRate: actWin,
                rawPredictedWinRate: predWin,
                overconfidenceGap: 0,
                status: isTentative ? 'TENTATIVE' : 'CALIBRATED',
            });
        }

        // Detect Conviction Inversion / Exhaustion Climax Anomaly:
        // When High Conviction has lower actual win rate than Mid Conviction
        if (adaptiveRaw.length >= 3) {
            const highTier = adaptiveRaw[adaptiveRaw.length - 1];
            const midTier = adaptiveRaw[adaptiveRaw.length - 2];
            if (
                highTier.actualWinRate !== null &&
                midTier.actualWinRate !== null &&
                highTier.actualWinRate < (midTier.actualWinRate - 3)
            ) {
                const drop = midTier.actualWinRate - highTier.actualWinRate;
                exhaustionAnomaly = {
                    detected: true,
                    dropPct: drop,
                    peakWinRate: midTier.actualWinRate,
                    climaxWinRate: highTier.actualWinRate,
                    peakTier: midTier.tierLabel,
                    climaxTier: highTier.tierLabel,
                    note: `Exhaustion Trap: Win rate dropped ${drop}% at extreme conviction (${highTier.minConf}–${highTier.maxConf}%), indicating late-stage momentum climax.`,
                };
                highTier.isExhaustionAnomaly = true;
                highTier.exhaustionDrop = drop;
                adaptiveCalibrated[adaptiveCalibrated.length - 1].isExhaustionAnomaly = true;
                adaptiveCalibrated[adaptiveCalibrated.length - 1].exhaustionDrop = drop;
            }
        }
    }

    // 4. Summary counts helper
    const countSummary = (items) => {
        let calibrated = 0;
        let overconfident = 0;
        let underconfident = 0;
        let tentative = 0;
        let insufficient = 0;
        let noTrades = 0;

        items.forEach(item => {
            if (item.status === 'CALIBRATED') calibrated++;
            else if (item.status === 'OVERCONFIDENT') overconfident++;
            else if (item.status === 'UNDERCONFIDENT') underconfident++;
            else if (item.status === 'TENTATIVE') tentative++;
            else if (item.status === 'NO_TRADES') noTrades++;
            else insufficient++;
        });

        return { calibrated, overconfident, underconfident, tentative, insufficient, noTrades };
    };

    // 5. Compute ECE and Brier Score
    const eceRaw = calculateExpectedCalibrationError(adaptiveRaw.length > 0 ? adaptiveRaw : fixedRaw);
    const eceCalibrated = calculateExpectedCalibrationError(adaptiveCalibrated.length > 0 ? adaptiveCalibrated : fixedCalibrated);

    // Brier probability mapping function for calibrated trades
    const calibratedProbMap = (t) => {
        const conf = t.confidence || 65;
        if (adaptiveRaw.length > 0) {
            const matchedTier = adaptiveRaw.find(b => conf >= b.minConf && conf <= b.maxConf);
            if (matchedTier && matchedTier.actualWinRate !== null) {
                return matchedTier.actualWinRate;
            }
        }
        return conf;
    };

    const brierRaw = calculateBrierScore(validTrades, false);
    const brierCalibrated = calculateBrierScore(validTrades, true, calibratedProbMap);

    const result = [...adaptiveRaw.length > 0 ? adaptiveRaw : fixedRaw];
    result.fixed = fixedRaw;
    result.adaptive = adaptiveRaw;
    result.raw = {
        fixed: fixedRaw,
        adaptive: adaptiveRaw,
        summary: {
            fixed: countSummary(fixedRaw),
            adaptive: countSummary(adaptiveRaw),
        },
        ece: eceRaw,
        brierScore: brierRaw,
    };
    result.calibrated = {
        fixed: fixedCalibrated,
        adaptive: adaptiveCalibrated,
        summary: {
            fixed: countSummary(fixedCalibrated),
            adaptive: countSummary(adaptiveCalibrated),
        },
        ece: eceCalibrated,
        brierScore: brierCalibrated,
    };
    result.summary = result.raw.summary;
    result.ece = { raw: eceRaw, calibrated: eceCalibrated };
    result.brierScore = { raw: brierRaw, calibrated: brierCalibrated };
    result.exhaustionAnomaly = exhaustionAnomaly;

    return result;
}

// ─── Continuous Mark-to-Market (MTM) & Underwater Drawdown Engine ──────────

export function buildContinuousMTMEquityCurve(trades, candles, initialCapital = 100000, config = {}) {
    const n = candles.length;
    if (n === 0) return { continuousEquity: [], mtmMaxDrawdownPct: 0, ulcerIndex: 0, topDrawdowns: [], dailyReturns: [], benchReturns: [] };

    const firstClose = (candles[0]?.close && candles[0].close > 0) ? candles[0].close : 1;
    const posSizePct = Math.max(5, Math.min(100, config.positionSizePct || 100));
    const sizingModel = config.sizingModel || 'PERCENT_EQUITY';

    const tradesByEntry = new Map();
    trades.forEach(t => tradesByEntry.set(t.entryBarIndex, t));

    let capital = initialCapital;
    let peakCapital = initialCapital;
    let maxDrawdownPct = 0;
    let activeTrade = null;
    let activeAllocated = 0;

    const continuousEquity = [];
    const dailyReturns = [];
    const benchReturns = [];

    let ddSumSq = 0;
    let currentDdStartBar = 0;
    let currentDdTrough = 0;
    let currentDdTroughBar = 0;
    const completedDrawdowns = [];

    for (let i = 0; i < n; i++) {
        const c = candles[i];
        const close = c.close;
        const prevEquity = continuousEquity.length > 0 ? continuousEquity[continuousEquity.length - 1].equity : initialCapital;

        if (activeTrade && activeTrade.exitBarIndex === i) {
            const realizedPnl = activeTrade.realizedPnl !== undefined 
                ? activeTrade.realizedPnl 
                : activeAllocated * (activeTrade.returnPct / 100);
            capital = Math.max(0, capital + realizedPnl);
            activeTrade = null;
            activeAllocated = 0;
        }

        if (!activeTrade && tradesByEntry.has(i)) {
            activeTrade = tradesByEntry.get(i);
            let allocated = capital * (posSizePct / 100);
            if (sizingModel === 'FIXED_CAPITAL' || sizingModel === 'FIXED_CASH') {
                allocated = Math.min(capital, initialCapital * (posSizePct / 100));
            } else if (sizingModel === 'KELLY') {
                const k = 0.15; // standard Half-Kelly allocation
                allocated = capital * k;
            } else if (sizingModel === 'ATR_RISK') {
                const slPct = Math.max(0.005, (config.exitRule?.stopPct || 1.25) / 100);
                allocated = Math.min(capital, (capital * 0.015) / slPct);
            }
            activeAllocated = Math.max(0, allocated);
        }

        let currentEquity = capital;
        if (activeTrade && i >= activeTrade.entryBarIndex && i <= activeTrade.exitBarIndex) {
            const rawReturnPct = ((close - activeTrade.entryPrice) / activeTrade.entryPrice) * 100 * activeTrade.direction;
            const unrealizedPnl = activeAllocated * (rawReturnPct / 100);
            currentEquity = Math.max(0, capital + unrealizedPnl);
        }

        if (currentEquity > peakCapital) {
            if (currentDdTrough > 1.0) {
                completedDrawdowns.push({
                    startBar: currentDdStartBar,
                    startTime: candles[currentDdStartBar]?.time,
                    troughBar: currentDdTroughBar,
                    troughTime: candles[currentDdTroughBar]?.time,
                    recoveryBar: i,
                    recoveryTime: c.time,
                    depthPct: Math.round(currentDdTrough * 10) / 10,
                    durationBars: i - currentDdStartBar,
                });
            }
            peakCapital = currentEquity;
            currentDdStartBar = i;
            currentDdTrough = 0;
            currentDdTroughBar = i;
        }

        const currentDdPct = peakCapital > 0 ? ((peakCapital - currentEquity) / peakCapital) * 100 : 0;
        if (currentDdPct > currentDdTrough) {
            currentDdTrough = currentDdPct;
            currentDdTroughBar = i;
        }
        if (currentDdPct > maxDrawdownPct) maxDrawdownPct = currentDdPct;
        ddSumSq += Math.pow(currentDdPct, 2);

        const benchEquity = Math.round(initialCapital * (close / firstClose));

        if (i > 0) {
            const rDaily = prevEquity > 0 ? ((currentEquity - prevEquity) / prevEquity) * 100 : 0;
            const prevClose = candles[i - 1].close;
            const rBench = prevClose > 0 ? ((close - prevClose) / prevClose) * 100 : 0;
            dailyReturns.push(rDaily);
            benchReturns.push(rBench);
        }

        continuousEquity.push({
            time: c.time,
            equity: Math.round(currentEquity),
            pnlPct: Math.round(((currentEquity - initialCapital) / initialCapital) * 1000) / 10,
            drawdown: Math.round(currentDdPct * 10) / 10,
            benchmarkEquity: benchEquity,
            isTradeOpen: Boolean(activeTrade),
        });
    }

    const ulcerIndex = Math.round(Math.sqrt(ddSumSq / Math.max(1, n)) * 10) / 10;
    const topDrawdowns = completedDrawdowns.sort((a, b) => b.depthPct - a.depthPct).slice(0, 5);

    return {
        continuousEquity,
        mtmMaxDrawdownPct: Math.round(maxDrawdownPct * 10) / 10,
        ulcerIndex,
        topDrawdowns,
        dailyReturns,
        benchReturns,
    };
}

export function computeAdvancedQuantRisk(dailyReturns, benchReturns, cagr, totalTrades) {
    const M = dailyReturns.length;
    if (M < 2) {
        return {
            dailySharpeRatio: 0,
            dailySortinoRatio: 0,
            alpha: 0,
            beta: 1.0,
            rSquared: 0,
            trackingError: 0,
            informationRatio: 0,
            treynorRatio: 0,
            var95: 0,
            var99: 0,
            cvar95: 0,
            tailRatio: 1.0,
            gainToPainRatio: 1.0,
            sqn: 0,
        };
    }

    const rfAnnual = 7.0;
    const rfDaily = rfAnnual / 252;

    const meanD = dailyReturns.reduce((a, b) => a + b, 0) / M;
    const varianceD = dailyReturns.reduce((acc, r) => acc + Math.pow(r - meanD, 2), 0) / (M - 1);
    const stdD = Math.sqrt(varianceD);

    const dailySharpeRatio = stdD > 0
        ? Math.round(((meanD - rfDaily) / stdD) * Math.sqrt(252) * 100) / 100
        : 0;

    const downsideVar = dailyReturns.reduce((acc, r) => acc + (r < rfDaily ? Math.pow(r - rfDaily, 2) : 0), 0) / (M - 1);
    const downsideStd = Math.sqrt(downsideVar);
    const dailySortinoRatio = downsideStd > 0
        ? Math.round(((meanD - rfDaily) / downsideStd) * Math.sqrt(252) * 100) / 100
        : (meanD > rfDaily ? 99.9 : 0);

    const meanB = benchReturns.reduce((a, b) => a + b, 0) / M;
    const varB = benchReturns.reduce((acc, r) => acc + Math.pow(r - meanB, 2), 0) / (M - 1);
    let covPB = 0;
    for (let k = 0; k < M; k++) {
        covPB += (dailyReturns[k] - meanD) * (benchReturns[k] - meanB);
    }
    covPB /= (M - 1);

    const beta = varB > 0 ? Math.round((covPB / varB) * 100) / 100 : 1.0;
    const alpha = Math.round(((meanD - rfDaily) - beta * (meanB - rfDaily)) * 252 * 10) / 10;
    const stdB = Math.sqrt(varB);
    const corr = (stdD > 0 && stdB > 0) ? covPB / (stdD * stdB) : 0;
    const rSquared = Math.round(Math.pow(corr, 2) * 100) / 100;

    const diffs = dailyReturns.map((r, k) => r - (benchReturns[k] || 0));
    const meanDiff = diffs.reduce((a, b) => a + b, 0) / M;
    const varDiff = diffs.reduce((acc, d) => acc + Math.pow(d - meanDiff, 2), 0) / (M - 1);
    const trackingError = Math.round(Math.sqrt(varDiff) * Math.sqrt(252) * 10) / 10;
    const informationRatio = trackingError > 0 ? Math.round(((meanDiff * 252) / trackingError) * 100) / 100 : 0;
    const treynorRatio = beta !== 0 ? Math.round(((cagr - rfAnnual) / beta) * 100) / 100 : 0;

    const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
    const var95 = Math.round(Math.max(0, -(meanD - 1.645 * stdD)) * 10) / 10;
    const var99 = Math.round(Math.max(0, -(meanD - 2.326 * stdD)) * 10) / 10;

    const p5Idx = Math.max(1, Math.floor(M * 0.05));
    const worst5Pct = sortedReturns.slice(0, p5Idx);
    const cvar95 = worst5Pct.length > 0
        ? Math.round(Math.abs(worst5Pct.reduce((a, b) => a + b, 0) / worst5Pct.length) * 10) / 10
        : var95;

    const p95Idx = Math.min(M - 1, Math.floor(M * 0.95));
    const p5Val = Math.abs(sortedReturns[p5Idx] || -0.01);
    const p95Val = Math.abs(sortedReturns[p95Idx] || 0.01);
    const tailRatio = p5Val > 0 ? Math.round((p95Val / p5Val) * 100) / 100 : 1.0;

    const grossGains = dailyReturns.filter(r => r > 0).reduce((a, b) => a + b, 0);
    const grossLosses = Math.abs(dailyReturns.filter(r => r < 0).reduce((a, b) => a + b, 0));
    const gainToPainRatio = grossLosses > 0 ? Math.round((grossGains / grossLosses) * 100) / 100 : 99.9;

    const sqn = (totalTrades >= 3 && stdD > 0)
        ? Math.round((Math.sqrt(totalTrades) * (meanD / stdD)) * 100) / 100
        : 0;

    return {
        dailySharpeRatio,
        dailySortinoRatio,
        alpha,
        beta,
        rSquared,
        trackingError,
        informationRatio,
        treynorRatio,
        var95,
        var99,
        cvar95,
        tailRatio,
        gainToPainRatio,
        sqn,
    };
}

export function computeBacktestMetrics(trades, candles, initialCapital = 100000, splitIndex, config = {}) {
    if (!trades || trades.length === 0) {
        const emptyResult = [];
        emptyResult.fixed = [];
        emptyResult.adaptive = [];
        emptyResult.raw = { fixed: [], adaptive: [], summary: { fixed: {}, adaptive: {} }, ece: 0, brierScore: 0 };
        emptyResult.calibrated = { fixed: [], adaptive: [], summary: { fixed: {}, adaptive: {} }, ece: 0, brierScore: 0 };
        emptyResult.summary = { fixed: {}, adaptive: {} };
        emptyResult.ece = { raw: 0, calibrated: 0 };
        emptyResult.brierScore = { raw: 0, calibrated: 0 };
        emptyResult.exhaustionAnomaly = null;
        return {
            summary: getEmptySummary(initialCapital),
            equityCurve: [],
            calibration: emptyResult,
            walkForwardSummary: null,
        };
    }

    const isFixedSizing = config.sizingModel === 'FIXED_CAPITAL';
    const posSizePct = Math.max(5, Math.min(100, config.positionSizePct || 100));
    let capital = initialCapital;
    let peakCapital = initialCapital;
    let maxDrawdownPct = 0;
    let isBankrupt = false;

    // Buy and Hold Benchmark Tracking
    const firstClose = (candles[0]?.close && candles[0].close > 0) ? candles[0].close : 1;
    const lastClose = (candles[candles.length - 1]?.close && candles[candles.length - 1].close > 0) ? candles[candles.length - 1].close : firstClose;
    const buyAndHoldReturnPct = Math.round(((lastClose - firstClose) / firstClose) * 1000) / 10;
    const buyAndHoldEndingCapital = Math.round(initialCapital * (1 + buyAndHoldReturnPct / 100));

    const equityCurve = [{
        time: candles[0].time,
        equity: initialCapital,
        pnlPct: 0,
        drawdown: 0,
        benchmarkEquity: initialCapital,
    }];

    let grossGains = 0;
    let grossLosses = 0;
    let wins = 0;
    let losses = 0;
    let breakEvens = 0;

    // Confidence calibration tracking for AI Predictor: 5 buckets covering full range
    const calibBuckets = {
        '<50%':   { min: 0,  max: 50,  total: 0, wins: 0, sumConf: 0 },
        '50-60%': { min: 50, max: 60,  total: 0, wins: 0, sumConf: 0 },
        '60-70%': { min: 60, max: 70,  total: 0, wins: 0, sumConf: 0 },
        '70-80%': { min: 70, max: 80,  total: 0, wins: 0, sumConf: 0 },
        '80-100%': { min: 80, max: 100, total: 0, wins: 0, sumConf: 0 },
    };

    // Streaks tracking
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;

    // Yearly performance tracking
    const yearlyMap = {};

    trades.forEach((trade, idx) => {
        if (isBankrupt || capital <= 0) {
            isBankrupt = true;
            trade.realizedPnl = 0;
            trade.runningCapital = 0;
            return;
        }

        const sizingModel = config.sizingModel || 'PERCENT_EQUITY';
        let allocated = 0;
        if (sizingModel === 'FIXED_CAPITAL' || sizingModel === 'FIXED_CASH') {
            allocated = Math.min(capital, initialCapital * (posSizePct / 100));
        } else if (sizingModel === 'KELLY') {
            const wr = idx > 0 ? wins / idx : 0.5;
            const avgW = wins > 0 ? grossGains / wins : 1;
            const avgL = losses > 0 ? grossLosses / losses : 1;
            const b = avgL > 0 ? avgW / avgL : 1;
            const f = Math.max(0.05, Math.min(0.25, (wr * (b + 1) - 1) / b * 0.5));
            allocated = capital * f;
        } else if (sizingModel === 'ATR_RISK') {
            const riskAmount = capital * 0.015;
            const slPct = Math.max(0.005, (config.exitRule?.stopPct || 1.25) / 100);
            allocated = Math.min(capital, riskAmount / slPct);
        } else if (sizingModel === 'VOLATILITY_TARGETING') {
            allocated = Math.min(capital, capital * 0.85);
        } else {
            allocated = Math.max(0, (isFixedSizing ? initialCapital : capital) * (posSizePct / 100));
        }
        const tradePnl = allocated * (trade.returnPct / 100);
        
        capital = Math.max(0, capital + tradePnl);
        if (capital <= 0) isBankrupt = true;

        trade.realizedPnl = Math.round(tradePnl);
        trade.runningCapital = Math.round(capital);

        if (trade.outcome === 'WIN') {
            wins++;
            grossGains += tradePnl;
            currentWinStreak++;
            currentLossStreak = 0;
            if (currentWinStreak > maxConsecutiveWins) maxConsecutiveWins = currentWinStreak;
        } else if (trade.outcome === 'LOSS') {
            losses++;
            grossLosses += Math.abs(tradePnl);
            currentLossStreak++;
            currentWinStreak = 0;
            if (currentLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = currentLossStreak;
        } else {
            breakEvens++;
        }

        if (capital > peakCapital) peakCapital = capital;
        const currentDrawdownPct = peakCapital > 0 ? ((peakCapital - capital) / peakCapital) * 100 : 100;
        if (currentDrawdownPct > maxDrawdownPct) maxDrawdownPct = currentDrawdownPct;

        // Buy & Hold reference equity at trade exit time
        const exitCandle = candles[trade.exitBarIndex] || candles[candles.length - 1];
        const validExitClose = (exitCandle?.close && exitCandle.close > 0) ? exitCandle.close : firstClose;
        const benchEquity = Math.round(initialCapital * (validExitClose / firstClose));

        equityCurve.push({
            time: trade.exitTime,
            equity: Math.round(capital),
            pnlPct: Math.round(((capital - initialCapital) / initialCapital) * 1000) / 10,
            drawdown: Math.round(currentDrawdownPct * 10) / 10,
            benchmarkEquity: benchEquity,
            tradeIndex: idx + 1,
            outcome: trade.outcome,
        });

        // Calibration bucket sorting across full 0-100% range
        const c = trade.confidence || 60;
        for (const [key, b] of Object.entries(calibBuckets)) {
            if (c >= b.min && (c < b.max || (b.max === 100 && c <= 100))) {
                b.total++;
                b.sumConf += c;
                if (trade.outcome === 'WIN') b.wins++;
                break;
            }
        }

        // Yearly grouping
        const rawTime = trade.entryTime;
        const d = new Date(typeof rawTime === 'number' && rawTime < 1e11 ? rawTime * 1000 : rawTime);
        const yr = !isNaN(d.getTime()) ? d.getFullYear() : 'All';
        if (!yearlyMap[yr]) {
            yearlyMap[yr] = { year: yr, trades: 0, wins: 0, losses: 0, returnPct: 0, pnl: 0 };
        }
        yearlyMap[yr].trades++;
        if (trade.outcome === 'WIN') yearlyMap[yr].wins++;
        if (trade.outcome === 'LOSS') yearlyMap[yr].losses++;
        yearlyMap[yr].returnPct += trade.returnPct;
        yearlyMap[yr].pnl += trade.realizedPnl;
    });

    const yearlyBreakdown = Object.values(yearlyMap).map(y => ({
        ...y,
        winRate: y.trades > 0 ? Math.round((y.wins / y.trades) * 1000) / 10 : 0,
        returnPct: Math.round(y.returnPct * 10) / 10,
    }));

    const totalTrades = trades.length;
    const decisiveTrades = wins + losses;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const decisiveWinRate = decisiveTrades > 0 ? (wins / decisiveTrades) * 100 : 0;
    const profitFactor = grossLosses > 0 ? grossGains / grossLosses : grossGains > 0 ? 99.9 : 0;
    const netReturnPct = ((capital - initialCapital) / initialCapital) * 100;
    
    // Trade win / loss return averages
    const winTrades = trades.filter(t => t.outcome === 'WIN');
    const lossTrades = trades.filter(t => t.outcome === 'LOSS');
    const avgWinPct = winTrades.length > 0 ? winTrades.reduce((acc, t) => acc + t.returnPct, 0) / winTrades.length : 0;
    const avgLossPct = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((acc, t) => acc + t.returnPct, 0) / lossTrades.length) : 0;
    const realizedRR = avgLossPct > 0 ? avgWinPct / avgLossPct : avgWinPct > 0 ? 99.9 : 1.0;

    // Mathematical Expectancy (normalized symmetrically across total trades)
    const winProb = totalTrades > 0 ? wins / totalTrades : 0;
    const lossProb = totalTrades > 0 ? losses / totalTrades : 0;
    const expectancy = (winProb * avgWinPct) - (lossProb * avgLossPct);

    // Fractional Half-Kelly Criterion Recommendation (capped at 25% max risk)
    // Using decisive win rate when calculating Kelly ratio to avoid breakeven distortion on payoff odds
    const decisiveWinProb = decisiveTrades > 0 ? wins / decisiveTrades : 0;
    const rawKelly = realizedRR > 0 ? (decisiveWinProb - ((1 - decisiveWinProb) / realizedRR)) : 0;
    const kellyPct = Math.max(0, Math.min(25, Math.round(rawKelly * 0.5 * 100)));

    // Time horizon in years
    const startMs = new Date(typeof candles[0].time === 'number' && candles[0].time < 1e11 ? candles[0].time * 1000 : candles[0].time).getTime();
    const endMs = new Date(typeof candles[candles.length - 1].time === 'number' && candles[candles.length - 1].time < 1e11 ? candles[candles.length - 1].time * 1000 : candles[candles.length - 1].time).getTime();
    const years = Math.max(0.1, (endMs - startMs) / (365.25 * 24 * 3600 * 1000));

    // ─── Continuous MTM Equity Curve & Advanced Quantitative Risk Engine ────
    const { continuousEquity, mtmMaxDrawdownPct, ulcerIndex, topDrawdowns, dailyReturns, benchReturns } = buildContinuousMTMEquityCurve(trades, candles, initialCapital, config);

    // CAGR (Compound Annual Growth Rate) with safety bounds for short durations (< 180 days)
    let cagr = 0;
    if (years >= 0.5 && initialCapital > 0 && capital > 0) {
        cagr = Math.round((Math.pow(capital / initialCapital, 1 / years) - 1) * 1000) / 10;
        cagr = Math.max(-100, Math.min(1000, cagr));
    } else if (initialCapital > 0) {
        cagr = Math.round(netReturnPct * 10) / 10;
    }

    const quantMetrics = computeAdvancedQuantRisk(dailyReturns, benchReturns, cagr, totalTrades);
    const effectiveSharpe = quantMetrics.dailySharpeRatio || 0;
    const effectiveSortino = quantMetrics.dailySortinoRatio || 0;
    const effectiveMaxDd = Math.max(maxDrawdownPct, mtmMaxDrawdownPct);
    const calmarRatio = effectiveMaxDd > 0 ? Math.round((cagr / effectiveMaxDd) * 100) / 100 : cagr > 0 ? 99.9 : 0;
    const martinRatio = ulcerIndex > 0 ? Math.round(((cagr - 7.0) / ulcerIndex) * 100) / 100 : 0;

    // Itemized Indian Statutory Fee Breakdown
    let totalBrokerage = 0, totalStt = 0, totalStampDuty = 0, totalExchangeFees = 0, totalSebi = 0, totalGst = 0, totalSlippage = 0;
    trades.forEach(t => {
        if (t.feeDetails) {
            totalBrokerage += t.feeDetails.brokerage || 0;
            totalStt += t.feeDetails.stt || 0;
            totalStampDuty += t.feeDetails.stampDuty || 0;
            totalExchangeFees += t.feeDetails.exchangeFee || 0;
            totalSebi += t.feeDetails.sebiFee || 0;
            totalGst += t.feeDetails.gst || 0;
            totalSlippage += t.feeDetails.slippageAmount || 0;
        }
    });
    const feeBreakdown = {
        totalBrokerage: Math.round(totalBrokerage * 100) / 100,
        totalStt: Math.round(totalStt * 100) / 100,
        totalStampDuty: Math.round(totalStampDuty * 100) / 100,
        totalExchangeFees: Math.round(totalExchangeFees * 100) / 100,
        totalSebi: Math.round(totalSebi * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        totalSlippage: Math.round(totalSlippage * 100) / 100,
        totalStatutoryCharges: Math.round((totalStt + totalStampDuty + totalExchangeFees + totalSebi + totalGst) * 100) / 100,
        totalTransactionFriction: Math.round((totalBrokerage + totalStt + totalStampDuty + totalExchangeFees + totalSebi + totalGst + totalSlippage) * 100) / 100,
    };

    const avgTradeReturn = trades.reduce((acc, t) => acc + t.returnPct, 0) / totalTrades;
    const bestTrade = trades.reduce((max, t) => t.returnPct > max ? t.returnPct : max, -Infinity);
    const worstTrade = trades.reduce((min, t) => t.returnPct < min ? t.returnPct : min, Infinity);
    const avgBarsHeld = Math.round(trades.reduce((acc, t) => acc + t.barsHeld, 0) / totalTrades);
    const avgMae = Math.round((trades.reduce((acc, t) => acc + (t.maePct || 0), 0) / totalTrades) * 100) / 100;
    const avgMfe = Math.round((trades.reduce((acc, t) => acc + (t.mfePct || 0), 0) / totalTrades) * 100) / 100;

    // Detailed Exit Reason Breakdown
    const exitReasons = {};
    trades.forEach((trade) => {
        const reason = trade.exitReason || 'UNKNOWN';
        if (!exitReasons[reason]) {
            exitReasons[reason] = {
                reason,
                count: 0,
                wins: 0,
                losses: 0,
                totalReturn: 0,
                barsHeldSum: 0,
            };
        }
        const grp = exitReasons[reason];
        grp.count++;
        if (trade.outcome === 'WIN') grp.wins++;
        else if (trade.outcome === 'LOSS') grp.losses++;
        grp.totalReturn += trade.returnPct;
        grp.barsHeldSum += trade.barsHeld;
    });

    const exitBreakdown = Object.values(exitReasons).map(grp => ({
        reason: grp.reason,
        count: grp.count,
        pctOfTotal: Math.round((grp.count / totalTrades) * 1000) / 10,
        winRate: grp.count > 0 ? Math.round((grp.wins / grp.count) * 1000) / 10 : 0,
        avgReturnPct: Math.round((grp.totalReturn / grp.count) * 100) / 100,
        avgBarsHeld: Math.round((grp.barsHeldSum / grp.count) * 10) / 10,
        netReturnContributionPct: Math.round(grp.totalReturn * 10) / 10,
    }));

    // Enhanced Confidence Calibration: Fixed intervals & Adaptive Equal-frequency Quantiles
    const calibration = computeCalibration(trades, calibBuckets);

    // In-Sample vs Out-of-Sample metrics
    const inSampleTrades = trades.filter(t => !t.isOutOfSample);
    const outSampleTrades = trades.filter(t => t.isOutOfSample);

    const calcSubset = (list) => {
        if (!list.length) return { count: 0, winRate: 0, netReturnPct: 0, profitFactor: 0 };
        const w = list.filter(t => t.outcome === 'WIN').length;
        const l = list.filter(t => t.outcome === 'LOSS').length;
        const sumRet = list.reduce((acc, t) => acc + t.returnPct, 0);
        const gains = list.filter(t => t.returnPct > 0).reduce((acc, t) => acc + t.returnPct, 0);
        const losses = Math.abs(list.filter(t => t.returnPct < 0).reduce((acc, t) => acc + t.returnPct, 0));
        return {
            count: list.length,
            winRate: list.length > 0 ? Math.round((w / list.length) * 1000) / 10 : 0,
            netReturnPct: Math.round(sumRet * 10) / 10,
            profitFactor: losses > 0 ? Math.round((gains / losses) * 100) / 100 : gains > 0 ? 99.9 : 0,
        };
    };

    const summary = {
        totalTrades,
        wins,
        losses,
        breakEvens,
        winRate: Math.round(winRate * 10) / 10,
        decisiveWinRate: Math.round(decisiveWinRate * 10) / 10,
        profitFactor: Math.round(profitFactor * 100) / 100,
        sharpeRatio: effectiveSharpe,
        sortinoRatio: effectiveSortino,
        dailySharpeRatio: quantMetrics.dailySharpeRatio,
        dailySortinoRatio: quantMetrics.dailySortinoRatio,
        dailyMtmSharpe: quantMetrics.dailySharpeRatio,
        dailySortino: quantMetrics.dailySortinoRatio,
        cagr,
        calmarRatio,
        martinRatio,
        ulcerIndex,
        realizedRR: Math.round(realizedRR * 100) / 100,
        expectancy: Math.round(expectancy * 100) / 100,
        kellyPct,
        maxConsecutiveWins,
        maxConsecutiveLosses,
        netReturnPct: Math.round(netReturnPct * 10) / 10,
        maxDrawdownPct: Math.round(effectiveMaxDd * 10) / 10,
        mtmMaxDrawdownPct: Math.round(mtmMaxDrawdownPct * 10) / 10,
        alpha: quantMetrics.alpha,
        beta: quantMetrics.beta,
        rSquared: quantMetrics.rSquared,
        trackingError: quantMetrics.trackingError,
        informationRatio: quantMetrics.informationRatio,
        treynorRatio: quantMetrics.treynorRatio,
        var95: quantMetrics.var95,
        var99: quantMetrics.var99,
        cvar95: quantMetrics.cvar95,
        tailRatio: quantMetrics.tailRatio,
        gainToPainRatio: quantMetrics.gainToPainRatio,
        sqn: quantMetrics.sqn,
        topDrawdowns,
        feeBreakdown,
        avgTradeReturn: Math.round(avgTradeReturn * 100) / 100,
        avgWinPct: Math.round(avgWinPct * 100) / 100,
        avgLossPct: Math.round(avgLossPct * 100) / 100,
        bestTrade: Math.round(bestTrade * 100) / 100,
        worstTrade: Math.round(worstTrade * 100) / 100,
        avgBarsHeld,
        avgMae,
        avgMfe,
        initialCapital,
        endingCapital: Math.round(capital),
        buyAndHoldReturnPct,
        buyAndHoldEndingCapital,
        yearsCovered: Math.round(years * 10) / 10,
        exitBreakdown,
        yearlyBreakdown,
        continuousEquity,
        // Edge Leak Analysis for Horizon Expiries
        horizonExpiryAnalysis: (() => {
            const h = exitBreakdown.find(e => e.reason === 'HORIZON_EXPIRY');
            if (!h || h.count === 0) return null;
            const isIntentionalHorizonMode = config.exitRule?.type === 'HORIZON';
            const isPrematureTimeoutActive = config.exitRule?.type === 'TARGET_STOP' && config.exitRule?.enableHorizonTimeout === true;
            return {
                count: h.count,
                pctOfTotal: h.pctOfTotal,
                winRate: h.winRate,
                avgReturnPct: h.avgReturnPct,
                horizonBars: config.exitRule?.horizonBars || 14,
                isIntentionalHorizonMode,
                isPrematureTimeoutActive,
                isMajorDrag: isPrematureTimeoutActive && h.pctOfTotal > 25 && h.avgReturnPct < 0.5,
            };
        })(),
        isSampleReliable: totalTrades >= 20,
        guardrailWarning: totalTrades < 20 ? `Low sample size (N = ${totalTrades} < 20). Results are not statistically verified.` : null,
    };

    const inSampleMetrics = calcSubset(inSampleTrades);
    const outSampleMetrics = calcSubset(outSampleTrades);
    const isPf = (inSampleMetrics.profitFactor > 0 && isFinite(inSampleMetrics.profitFactor)) ? inSampleMetrics.profitFactor : 1;
    const oosPf = (outSampleMetrics.profitFactor > 0 && isFinite(outSampleMetrics.profitFactor)) ? outSampleMetrics.profitFactor : 0;

    const walkForwardSummary = {
        inSample: inSampleMetrics,
        outOfSample: outSampleMetrics,
        efficiencyRatio: outSampleTrades.length && inSampleTrades.length
            ? Math.round((oosPf / isPf) * 100) / 100
            : 1.0,
    };

    return { summary, equityCurve, calibration, walkForwardSummary };
}

function getEmptySummary(initialCapital = 100000) {
    return {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        breakEvens: 0,
        winRate: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        cagr: 0,
        calmarRatio: 0,
        realizedRR: 0,
        expectancy: 0,
        kellyPct: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        netReturnPct: 0,
        maxDrawdownPct: 0,
        avgTradeReturn: 0,
        avgWinPct: 0,
        avgLossPct: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgBarsHeld: 0,
        avgMae: 0,
        avgMfe: 0,
        initialCapital,
        endingCapital: initialCapital,
        buyAndHoldReturnPct: 0,
        buyAndHoldEndingCapital: initialCapital,
        yearsCovered: 0,
        exitBreakdown: [],
        yearlyBreakdown: [],
        isSampleReliable: false,
        guardrailWarning: 'No trades generated with current parameters.',
    };
}
