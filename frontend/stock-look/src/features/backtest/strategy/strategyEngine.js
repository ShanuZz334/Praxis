/**
 * @file strategyEngine.js
 * @purpose High-performance combinational multi-factor backtest engine.
 * Computes individual indicator series and evaluates compound Boolean logic chains (AND/OR)
 * to simulate authentic trade entries, exits, slippage, and institutional scorecards.
 * Supports built-in indicators and sandboxed custom lab indicators.
 * @date 2026-09-17
 */

import { SIGNAL_DEFINITIONS } from './strategySignalDefinitions.js';
import { 
    evaluateTradeExit, 
    closeTrade, 
    computeBacktestMetrics 
} from '../engine/backtestEngine.js';
import { 
    getCustomIndicators,
    getCompiledLabFunction,
    evaluateCustomLabSeries 
} from '../lab/customIndicatorRegistry.js';

export { getCompiledLabFunction, evaluateCustomLabSeries };

const EXTRACTED_RULES_CACHE = new Map();


/**
 * Pre-computes all indicator series required by the rules in a single pass.
 * @param {Array} candles 
 * @param {Array} rules 
 * @param {Object} [customLabSeriesMap={}] Map of custom lab indicator ID -> series
 * @param {Array} [customLabModels=[]] Optional list of custom indicator model definitions
 * @param {string} [strategyMode='swing'] Active strategy mode: 'intraday' | 'swing' | 'positional'
 * @returns {Object} Map of indicatorId -> computed series array
 */
export function precalculateStrategySeries(candles, rules, customLabSeriesMap = {}, customLabModels = [], strategyMode = 'swing') {
    const seriesMap = {};

    for (const rule of rules) {
        if (!rule || !rule.indicatorId) continue;

        const def = SIGNAL_DEFINITIONS[rule.indicatorId];
        if (def && typeof def.compute === 'function') {
            try {
                const computed = def.compute(candles, rule.params || def.defaultParams || {});
                if (rule.id) seriesMap[rule.id] = computed;
                if (!seriesMap[rule.indicatorId]) seriesMap[rule.indicatorId] = computed;
            } catch (err) {
                console.warn(`[strategyEngine] Error computing indicator ${rule.indicatorId}:`, err);
                const nullSeries = new Array(candles.length).fill(null);
                if (rule.id) seriesMap[rule.id] = nullSeries;
                if (!seriesMap[rule.indicatorId]) seriesMap[rule.indicatorId] = nullSeries;
            }
        } else {
            // Check if available in customLabSeriesMap
            if (customLabSeriesMap[rule.indicatorId]) {
                const s = customLabSeriesMap[rule.indicatorId];
                if (rule.id) seriesMap[rule.id] = s;
                if (!seriesMap[rule.indicatorId]) seriesMap[rule.indicatorId] = s;
            } else {
                // Look for model object in customLabModels or window/localStorage
                const model = (customLabModels || []).find(m => m.id === rule.indicatorId);
                if (model && (model.code || typeof model.calculate === 'function')) {
                    const computed = evaluateCustomLabSeries(candles, model, strategyMode);
                    if (rule.id) seriesMap[rule.id] = computed;
                    if (!seriesMap[rule.indicatorId]) seriesMap[rule.indicatorId] = computed;
                }
            }
        }
    }

    return seriesMap;
}

/**
 * Evaluates a single rule at candle index i.
 * @param {number} i 
 * @param {Array} candles 
 * @param {Object} rule 
 * @param {Array} indicatorSeries 
 * @param {string} direction 'LONG' | 'SHORT'
 * @param {string} [strategyMode='swing'] 'intraday' | 'swing' | 'positional'
 * @param {Array} [customLabModels=[]]
 * @returns {boolean}
 */
function evaluateSingleRule(i, candles, rule, indicatorSeries, direction = 'LONG', strategyMode = 'swing', customLabModels = []) {
    if (!rule || !rule.indicatorId) return false;

    const currentCandle = candles[i];
    const prevCandle = i > 0 ? candles[i - 1] : currentCandle;

    const currVal = indicatorSeries ? indicatorSeries[i] : null;
    const prevVal = (indicatorSeries && i > 0) ? indicatorSeries[i - 1] : currVal;

    const def = SIGNAL_DEFINITIONS[rule.indicatorId];

    // Custom Lab evaluation
    if (!def || rule.indicatorId.startsWith('custom_') || rule.indicatorId.startsWith('ind_')) {
        const model = (customLabModels || []).find(m => m.id === rule.indicatorId);

        // 1. Try baked v2 rules first
        if (model) {
            let bakedRules = model.rules;
            if ((!bakedRules || bakedRules.length === 0 || typeof bakedRules[0]?.checkBuy !== 'function') && model.code) {
                if (EXTRACTED_RULES_CACHE.has(model.code)) {
                    bakedRules = EXTRACTED_RULES_CACHE.get(model.code);
                } else {
                    try {
                        const fn = new Function(`${model.code}\nreturn indicator();`);
                        const inst = fn();
                        if (inst?.rules) {
                            bakedRules = inst.rules;
                            EXTRACTED_RULES_CACHE.set(model.code, inst.rules);
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            }

            if (Array.isArray(bakedRules) && bakedRules.length > 0) {
                const activeRule = bakedRules.find(r => r.id === rule.conditionId) || bakedRules[0];
                const modeParams = (model.modes && model.modes[strategyMode]) ? model.modes[strategyMode] : (model.modes?.swing || {});

                const numCurr = typeof currVal === 'object' && currVal !== null ? currVal.value : Number(currVal);
                const numPrev = typeof prevVal === 'object' && prevVal !== null ? prevVal.value : Number(prevVal);

                const evalBaked = direction === 'SHORT'
                    ? (typeof activeRule.checkSell === 'function' ? activeRule.checkSell : activeRule.checkBuy)
                    : (typeof activeRule.checkBuy === 'function' ? activeRule.checkBuy : activeRule.checkSell);
                if (typeof evalBaked === 'function') {
                    return Boolean(evalBaked(numCurr, numPrev, modeParams, currentCandle, prevCandle));
                }
            }
        }

        // 2. Fallback to basic threshold crossover if model has no baked rules
        const threshold = Number(rule.threshold ?? rule.customThreshold ?? 0);
        const numCurr = typeof currVal === 'object' && currVal !== null ? currVal.value : Number(currVal);
        const numPrev = typeof prevVal === 'object' && prevVal !== null ? prevVal.value : Number(prevVal);

        if (numCurr == null || isNaN(numCurr) || numPrev == null || isNaN(numPrev)) return false;

        const condId = rule.conditionId || 'lab_cross_above';
        if (condId === 'lab_cross_above') {
            return direction === 'SHORT' ? (numPrev >= threshold && numCurr < threshold) : (numPrev <= threshold && numCurr > threshold);
        } else if (condId === 'lab_cross_below') {
            return direction === 'SHORT' ? (numPrev <= threshold && numCurr > threshold) : (numPrev >= threshold && numCurr < threshold);
        } else if (condId === 'lab_above') {
            return direction === 'SHORT' ? numCurr <= threshold : numCurr >= threshold;
        } else if (condId === 'lab_below') {
            return direction === 'SHORT' ? numCurr >= threshold : numCurr <= threshold;
        }

        if (direction === 'SHORT') {
            return numPrev > threshold && numCurr <= threshold;
        }
        return numPrev < threshold && numCurr >= threshold;
    }

    // 1. Check custom threshold condition
    if (rule.conditionId === 'rsi_custom' || rule.conditionId === 'custom_threshold' || rule.isCustom) {
        const target = Number(rule.threshold ?? rule.customThreshold ?? 50);
        const comp = rule.comparison || (direction === 'SHORT' ? '<' : '>');
        const num = typeof currVal === 'number' ? currVal : currVal?.value;
        if (num === undefined || num === null || isNaN(num)) return false;

        if (comp === '>') return num > target;
        if (comp === '<') return num < target;
        if (comp === '>=') return num >= target;
        if (comp === '<=') return num <= target;
        return num === target;
    }

    // 2. Preset institutional conditions from definition
    const cond = def.presetConditions?.find(c => c.id === rule.conditionId);
    if (!cond) return false;

    // Use rule-specified threshold, falling back to condition default
    const threshold = (rule.threshold != null && rule.threshold !== '')
        ? Number(rule.threshold) 
        : ((rule.customThreshold != null && rule.customThreshold !== '')
            ? Number(rule.customThreshold) 
            : cond.thresholdConfig?.defaultThreshold ?? 0);

    const activeParams = rule.params || def.defaultParams || {};

    const evalCond = direction === 'SHORT'
        ? (typeof cond.checkSell === 'function' ? cond.checkSell : cond.checkBuy)
        : (typeof cond.checkBuy === 'function' ? cond.checkBuy : cond.checkSell);
    if (typeof evalCond === 'function') {
        return Boolean(evalCond(currVal, prevVal, currentCandle, prevCandle, threshold, activeParams));
    }

    return false;
}

/**
 * Evaluates the full chain of rules at bar i using Boolean logic (AND/OR)
 * and confluence tolerance window (volatileTimer / Signal Life).
 * @param {number} i 
 * @param {Array} candles 
 * @param {Array} rules 
 * @param {Object} computedSeries Map of indicatorId -> array
 * @param {string} direction 'LONG' | 'SHORT'
 * @param {string} [strategyMode='swing']
 * @param {Array} [customLabModels=[]]
 * @param {number} [volatileTimer=1] Confluence lookback window in bars (Signal Life)
 * @returns {boolean}
 */
export function evaluateStrategyRulesAtBar(i, candles, rules, computedSeries, direction = 'LONG', strategyMode = 'swing', customLabModels = [], volatileTimer = 1) {
    if (!rules || rules.length === 0) return false;

    const windowBars = Math.max(1, Number(volatileTimer) || 1);

    // 1. Single bar / single rule fast path
    if (windowBars <= 1 || rules.length === 1) {
        let totalResult = null;
        for (let r = 0; r < rules.length; r++) {
            const rule = rules[r];
            const series = computedSeries[rule.id] || computedSeries[rule.indicatorId];
            const ruleResult = evaluateSingleRule(i, candles, rule, series, direction, strategyMode, customLabModels);

            if (totalResult === null) {
                totalResult = ruleResult;
            } else {
                const logic = rule.logic || 'AND';
                if (logic === 'OR') {
                    totalResult = totalResult || ruleResult;
                } else {
                    totalResult = totalResult && ruleResult;
                }
            }
        }
        return Boolean(totalResult);
    }

    // 2. Confluence window (Signal Life / volatileTimer)
    // At least one rule must be true on bar i (current trigger event).
    // All AND-chained rules must be true within the lookback window [i - windowBars + 1 ... i].
    let anyRuleCurrent = false;
    let totalResult = null;

    for (let r = 0; r < rules.length; r++) {
        const rule = rules[r];
        const series = computedSeries[rule.id] || computedSeries[rule.indicatorId];
        
        const currentResult = evaluateSingleRule(i, candles, rule, series, direction, strategyMode, customLabModels);
        if (currentResult) anyRuleCurrent = true;

        let ruleActiveInWindow = currentResult;
        if (!ruleActiveInWindow) {
            const startK = Math.max(0, i - windowBars + 1);
            for (let k = startK; k < i; k++) {
                if (evaluateSingleRule(k, candles, rule, series, direction, strategyMode, customLabModels)) {
                    ruleActiveInWindow = true;
                    break;
                }
            }
        }

        if (totalResult === null) {
            totalResult = ruleActiveInWindow;
        } else {
            const logic = rule.logic || 'AND';
            if (logic === 'OR') {
                totalResult = totalResult || ruleActiveInWindow;
            } else {
                totalResult = totalResult && ruleActiveInWindow;
            }
        }
    }

    return Boolean(anyRuleCurrent && totalResult);
}

/**
 * Main Institutional Backtest Execution Runner.
 * Simulates portfolio trajectory, orders, walk-forward out-of-sample metrics,
 * and produces equity curve + trade log.
 * 
 * @param {Array} candles Historical OHLCV candle series
 * @param {Object} strategy Strategy definition
 * @param {Object} [customLabSeriesMap={}] Optional custom indicator series
 * @returns {Object} Backtest execution report
 */
export function runStrategyBacktest(candles, strategy, customLabSeriesMap = {}) {
    if (!candles || candles.length < 30) {
        return {
            strategy,
            summary: null,
            trades: [],
            equityCurve: [],
            calibration: null,
            error: "Insufficient historical bars. At least 30 candles required for backtesting."
        };
    }

    const {
        rules = [],
        entryDirection = 'LONG',
        exitRule = { type: 'TARGET_STOP', targetPct: 3.0, stopPct: 1.5, horizonBars: 10 },
        costModel = { feePerOrderPct: 0.03, slippagePct: 0.02 },
        initialCapital = 100000,
        timeframe = 'day',
        slippageModel = 'NEXT_BAR_OPEN',
        customLabModels = [],
        mode: strategyMode = 'swing',
        volatileTimer = 5,
    } = strategy;

    const directionStr = String(entryDirection).toUpperCase();
    const isShort = directionStr === 'SHORT';
    const directionMultiplier = isShort ? -1 : 1;
    const mode = isShort ? 'sell' : 'buy';

    if (rules.length === 0) {
        return {
            strategy,
            summary: null,
            trades: [],
            equityCurve: [],
            calibration: null,
            error: "Strategy has zero active confluence rules. Please add at least 1 rule."
        };
    }

    const n = candles.length;
    const splitRatio = strategy.walkForward?.splitRatio || 0.7;
    const splitIndex = strategy.walkForward?.enabled ? Math.floor(n * splitRatio) : n;

    // 1. Pre-calculate all required indicator series in a single vectorized pass
    const effectiveCustomModels = (Array.isArray(customLabModels) && customLabModels.length > 0)
        ? customLabModels
        : (typeof getCustomIndicators === 'function' ? getCustomIndicators() : []);

    const computedSeries = precalculateStrategySeries(candles, rules, customLabSeriesMap, effectiveCustomModels, strategyMode);

    // 2. Bar-by-bar simulation loop
    const trades = [];
    const minLookback = 20;
    let activeTrade = null;

    for (let i = minLookback; i < n; i++) {
        const currentCandle = candles[i];
        const nextCandle = i + 1 < n ? candles[i + 1] : null;

        // Exit evaluation for open positions
        if (activeTrade) {
            const isExit = evaluateTradeExit(activeTrade, candles, i, exitRule, costModel, strategyMode, timeframe, nextCandle);
            if (isExit) {
                trades.push(activeTrade);
                activeTrade = null;
            }
            continue;
        }

        // On final candle (i === n - 1), do not generate new orders if NEXT_BAR_OPEN requires i + 1
        if (i >= n - 1 && slippageModel === 'NEXT_BAR_OPEN') {
            continue;
        }

        // Evaluate Strategy Compound Rules
        const isTriggered = evaluateStrategyRulesAtBar(i, candles, rules, computedSeries, directionStr, strategyMode, effectiveCustomModels, volatileTimer);

        if (isTriggered) {
            const entryPrice = slippageModel === 'NEXT_BAR_OPEN' ? (nextCandle ? nextCandle.open : currentCandle.close) : currentCandle.close;
            const entryTime = slippageModel === 'NEXT_BAR_OPEN' ? (nextCandle ? nextCandle.time : currentCandle.time) : currentCandle.time;
            const entryBarIndex = (slippageModel === 'NEXT_BAR_OPEN' && nextCandle) ? i + 1 : i;

            activeTrade = {
                id: `trade_${trades.length + 1}`,
                signalType: directionStr === 'SHORT' ? 'SELL' : 'BUY',
                direction: directionMultiplier,
                unit: 'STRATEGY',
                sourceDetail: strategy.nickname || strategy.name || 'Multi-Factor Strategy',
                confidence: 82,
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
    }

    // Close any position remaining open at final bar
    if (activeTrade) {
        closeTrade(activeTrade, candles[n - 1].close, candles[n - 1].time, n - 1, 'END_OF_DATA', costModel);
        trades.push(activeTrade);
    }

    // 3. Compute Institutional Metrics & Reliability
    const { summary, equityCurve, calibration, walkForwardSummary } = computeBacktestMetrics(
        trades,
        candles,
        initialCapital,
        splitIndex,
        {
            unit: 'STRATEGY',
            exitRule,
            sizingModel: 'PERCENT_EQUITY',
            positionSizePct: 100,
        }
    );

    return {
        strategy,
        summary,
        walkForward: walkForwardSummary,
        trades,
        equityCurve,
        calibration,
        computedSeries,
    };
}
