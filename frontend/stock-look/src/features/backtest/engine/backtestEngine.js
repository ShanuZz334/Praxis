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

// ─── Timeframe Volatility Profiles ─────────────────────────────────────────

export const TIMEFRAME_DEFAULTS = {
    '1m': { mode: 'intraday', targetPct: 0.25, stopPct: 0.12, horizonBars: 20, trailingStopPct: 0.10 },
    '5m': { mode: 'intraday', targetPct: 0.45, stopPct: 0.22, horizonBars: 20, trailingStopPct: 0.18 },
    '15m': { mode: 'intraday', targetPct: 0.75, stopPct: 0.38, horizonBars: 18, trailingStopPct: 0.30 },
    '1h': { mode: 'intraday', targetPct: 1.40, stopPct: 0.70, horizonBars: 14, trailingStopPct: 0.55 },
    'day': { mode: 'swing', targetPct: 2.50, stopPct: 1.25, horizonBars: 10, trailingStopPct: 1.00 },
};

// ─── Default Config ────────────────────────────────────────────────────────

export const DEFAULT_BACKTEST_CONFIG = {
    unit: 'PREDICTOR', // 'PREDICTOR' | 'PATTERNS' | 'COMPOSITE_SCORE' | 'PNCO' | 'AAVB' | 'IFDI' | 'HEAD_TO_HEAD' | 'CUSTOM_COMBO'
    mode: 'swing',     // 'intraday' | 'swing' | 'positional'
    selectedPattern: 'ALL',
    patternThreshold: 5,
    pncoThreshold: 25,
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
    };
}

/**
 * Executes a full backtest simulation on an OHLCV candlestick dataset.
 *
 * @param {Array} candles - OHLCV array
 * @param {Object} userConfig - Configuration options
 * @param {Object} [precalc=null] - Optional precalculated indicators cache
 * @returns {Object} Full backtest results { summary, trades, equityCurve, calibration, walkForward, indicators }
 */
export function runBacktest(candles, userConfig = {}, precalc = null) {
    const config = { ...DEFAULT_BACKTEST_CONFIG, ...userConfig };
    config.exitRule = { ...DEFAULT_BACKTEST_CONFIG.exitRule, ...(userConfig.exitRule || {}) };
    config.walkForward = { ...DEFAULT_BACKTEST_CONFIG.walkForward, ...(userConfig.walkForward || {}) };
    config.customRules = { ...DEFAULT_BACKTEST_CONFIG.customRules, ...(userConfig.customRules || {}) };

    if (!candles || candles.length < 30) {
        return {
            error: 'Insufficient data. Minimum 30 candles required for backtesting.',
            summary: getEmptySummary(config.initialCapital),
            trades: [],
            equityCurve: [],
            calibration: [],
        };
    }

    const n = candles.length;
    const splitIndex = config.walkForward.enabled ? Math.floor(n * (config.walkForward.splitRatio || 0.7)) : n;

    // 1. Pre-calculate indicators
    const pre = precalc || precalculateBacktestIndicators(candles);
    const { pncoData, aavbData, ifdiData, pncoMap, ifdiMap, aavbMidMap, aavbUpMap, aavbLowMap, atrMap } = pre;

    // 2. Scan and evaluate signals
    const trades = [];
    const minLookback = 20;

    let activeTrade = null;
    let lastPatternScore = 0;

    for (let i = minLookback; i < n - 1; i++) {
        const currentCandle = candles[i];
        const nextCandle = candles[i + 1];

        // If currently in a trade, evaluate exits
        if (activeTrade) {
            const isExit = evaluateTradeExit(activeTrade, candles, i, config.exitRule, config.costModel, config.mode, config.timeframe, nextCandle);
            if (isExit) {
                trades.push(activeTrade);
                activeTrade = null;
            }
            continue; // Prevent overlapping trade re-entry on same bar
        }

        // Generate signal at bar i
        const signal = detectSignalAtBar(
            i,
            candles,
            config,
            { pncoMap, ifdiMap, aavbMidMap, aavbUpMap, aavbLowMap, atrMap, lastPatternScore }
        );

        if (signal?.currentScore !== undefined) {
            lastPatternScore = signal.currentScore;
        }

        if (!signal || signal.dummy) continue;

        // Determine Entry Fill Price
        const entryPrice = config.slippageModel === 'NEXT_BAR_OPEN'
            ? nextCandle.open
            : currentCandle.close;

        const entryTime = config.slippageModel === 'NEXT_BAR_OPEN'
            ? nextCandle.time
            : currentCandle.time;

        const entryBarIndex = config.slippageModel === 'NEXT_BAR_OPEN' ? i + 1 : i;

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

    return {
        config,
        summary,
        walkForward: walkForwardSummary,
        trades,
        equityCurve,
        calibration,
        indicators: {
            pnco: pncoData,
            aavb: aavbData,
            ifdi: ifdiData,
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
        const slice = candles.slice(Math.max(0, i - 60), i + 1);
        const analysis = analyzeChartPatterns(slice, mode);
        if (!analysis || !analysis.activePatterns || analysis.activePatterns.length === 0) return null;

        // Find freshly formed pattern on this bar (age <= 1)
        const latest = analysis.activePatterns.find(p => p.age <= 1 && !p.invalidated);
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
        const slice = candles.slice(Math.max(0, i - 45), i + 1);
        const currScore = Number(analyzeChartPatterns(slice, mode)?.score || 0);
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

        const scoreOk = patternScore >= minScore;
        const ifdiOk = !rules.requireIfdiAccumulation || (ifdi && (ifdi.flowState === 'ACCUMULATION' || ifdi.value > 5));
        const aavbOk = !rules.aboveAavbMidline || (midAavb && currentCandle.close >= midAavb * 0.998);

        if (scoreOk && ifdiOk && aavbOk) {
            return { type: 'BUY', direction: 1, unit: 'CUSTOM_COMBO', label: 'Alpha Confluence Long', confidence: 88 };
        }
        return null;
    }

    return null;
}

// ─── Trade Exit Evaluation ─────────────────────────────────────────────────

function evaluateTradeExit(trade, candles, currentIdx, exitRule, costModel = 'INDIAN_REALISTIC', mode = 'swing', timeframe = 'day', nextCandle = null) {
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
        trade.maePct = Math.min(trade.maePct || 0, -Math.abs(currLowPct));
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

            // A. True Gap Openings Execution (fills at actual market open if gapped beyond level)
            if (candle.open <= stopPrice) {
                closeTrade(trade, candle.open, candle.time, currentIdx, stopPct === 0 ? 'BREAKEVEN' : 'STOP', costModel);
                return true;
            }
            if (candle.open >= targetPrice) {
                closeTrade(trade, candle.open, candle.time, currentIdx, 'TARGET', costModel);
                return true;
            }

            // B. Intra-Bar Price Range Check
            const isTargetHit = candle.high >= targetPrice;
            const isStopHit = candle.low <= stopPrice;

            // Conflict resolution: if both touched within same candle
            if (isTargetHit && isStopHit) {
                const distToStop = Math.abs(candle.open - stopPrice);
                const distToTarget = Math.abs(targetPrice - candle.open);
                if (distToStop <= distToTarget && candle.close < candle.open) {
                    closeTrade(trade, stopPrice, candle.time, currentIdx, stopPct === 0 ? 'BREAKEVEN' : 'STOP', costModel);
                } else {
                    closeTrade(trade, targetPrice, candle.time, currentIdx, 'TARGET', costModel);
                }
                return true;
            }

            if (isTargetHit) {
                closeTrade(trade, targetPrice, candle.time, currentIdx, 'TARGET', costModel);
                return true;
            }
            if (isStopHit) {
                closeTrade(trade, stopPrice, candle.time, currentIdx, stopPct === 0 ? 'BREAKEVEN' : 'STOP', costModel);
                return true;
            }

            // C. Trailing Stop (Long) — Sequence: test prior established peak first, then update
            if (exitRule.type === 'TRAILING_STOP') {
                const trailPct = (exitRule.trailingStopPct || 1.0) / 100;
                const priorPeak = trade.highestPrice;
                const peakGain = (priorPeak - trade.entryPrice) / trade.entryPrice;

                if (peakGain >= Math.max(0.01, trailPct * 0.8)) {
                    const trailStopPrice = priorPeak * (1 - trailPct);
                    if (candle.open <= trailStopPrice) {
                        closeTrade(trade, candle.open, candle.time, currentIdx, 'TRAILING_STOP', costModel);
                        return true;
                    }
                    const dropFromPeak = (priorPeak - candle.low) / priorPeak;
                    if (dropFromPeak >= trailPct) {
                        closeTrade(trade, trailStopPrice, candle.time, currentIdx, 'TRAILING_STOP', costModel);
                        return true;
                    }
                }

                trade.highestPrice = Math.max(trade.highestPrice, candle.high);
                trade.lowestPrice = Math.min(trade.lowestPrice, candle.low);
            } else {
                trade.highestPrice = Math.max(trade.highestPrice, candle.high);
                trade.lowestPrice = Math.min(trade.lowestPrice, candle.low);
            }
        } else {
            // Short trade
            const targetPrice = trade.entryPrice * (1 - targetPct);
            const stopPrice = trade.entryPrice * (1 + stopPct);

            // A. True Gap Openings Execution
            if (candle.open >= stopPrice) {
                closeTrade(trade, candle.open, candle.time, currentIdx, stopPct === 0 ? 'BREAKEVEN' : 'STOP', costModel);
                return true;
            }
            if (candle.open <= targetPrice) {
                closeTrade(trade, candle.open, candle.time, currentIdx, 'TARGET', costModel);
                return true;
            }

            // B. Intra-Bar Price Range Check
            const isTargetHit = candle.low <= targetPrice;
            const isStopHit = candle.high >= stopPrice;

            if (isTargetHit && isStopHit) {
                const distToStop = Math.abs(stopPrice - candle.open);
                const distToTarget = Math.abs(candle.open - targetPrice);
                if (distToStop <= distToTarget && candle.close > candle.open) {
                    closeTrade(trade, stopPrice, candle.time, currentIdx, stopPct === 0 ? 'BREAKEVEN' : 'STOP', costModel);
                } else {
                    closeTrade(trade, targetPrice, candle.time, currentIdx, 'TARGET', costModel);
                }
                return true;
            }

            if (isTargetHit) {
                closeTrade(trade, targetPrice, candle.time, currentIdx, 'TARGET', costModel);
                return true;
            }
            if (isStopHit) {
                closeTrade(trade, stopPrice, candle.time, currentIdx, stopPct === 0 ? 'BREAKEVEN' : 'STOP', costModel);
                return true;
            }

            // C. Trailing Stop (Short)
            if (exitRule.type === 'TRAILING_STOP') {
                const trailPct = (exitRule.trailingStopPct || 1.0) / 100;
                const priorTrough = trade.lowestPrice;
                const peakGain = (trade.entryPrice - priorTrough) / trade.entryPrice;

                if (peakGain >= Math.max(0.01, trailPct * 0.8)) {
                    const trailStopPrice = priorTrough * (1 + trailPct);
                    if (candle.open >= trailStopPrice) {
                        closeTrade(trade, candle.open, candle.time, currentIdx, 'TRAILING_STOP', costModel);
                        return true;
                    }
                    const bounceFromTrough = (candle.high - priorTrough) / priorTrough;
                    if (bounceFromTrough >= trailPct) {
                        closeTrade(trade, trailStopPrice, candle.time, currentIdx, 'TRAILING_STOP', costModel);
                        return true;
                    }
                }

                trade.highestPrice = Math.max(trade.highestPrice, candle.high);
                trade.lowestPrice = Math.min(trade.lowestPrice, candle.low);
            } else {
                trade.highestPrice = Math.max(trade.highestPrice, candle.high);
                trade.lowestPrice = Math.min(trade.lowestPrice, candle.low);
            }
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
    const d1 = typeof t1 === 'string' ? t1.slice(0, 10) : new Date(t1 * 1000).toISOString().slice(0, 10);
    const d2 = typeof t2 === 'string' ? t2.slice(0, 10) : new Date(t2 * 1000).toISOString().slice(0, 10);
    return d1 === d2;
}

function closeTrade(trade, exitPrice, exitTime, exitBarIndex, reason, costModel = 'INDIAN_REALISTIC') {
    trade.status = 'CLOSED';
    const validExitPrice = (typeof exitPrice === 'number' && exitPrice > 0 && isFinite(exitPrice)) ? exitPrice : trade.entryPrice;
    trade.exitPrice = Math.round(validExitPrice * 100) / 100;
    trade.exitTime = exitTime;
    trade.exitBarIndex = exitBarIndex;
    trade.exitReason = reason;

    // Calculate Friction / Transaction Cost
    let frictionPct = 0;
    if (costModel === 'INDIAN_REALISTIC') {
        frictionPct = 0.08; 
    }

    const rawReturn = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * trade.direction;
    trade.rawReturnPct = Math.round(rawReturn * 100) / 100;
    trade.frictionPct = frictionPct;
    trade.returnPct = Math.round((rawReturn - frictionPct) * 100) / 100;

    if (trade.returnPct > 0) trade.outcome = 'WIN';
    else if (trade.returnPct === 0) trade.outcome = 'BREAKEVEN';
    else trade.outcome = 'LOSS';
}

// ─── Scorecard & Performance Metrics Calculation ───────────────────────────

function computeBacktestMetrics(trades, candles, initialCapital = 100000, splitIndex, config = {}) {
    if (!trades || trades.length === 0) {
        return {
            summary: getEmptySummary(initialCapital),
            equityCurve: [],
            calibration: [],
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

        const allocatedBase = isFixedSizing ? initialCapital : capital;
        const allocated = Math.max(0, allocatedBase * (posSizePct / 100));
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
    const winRate = decisiveTrades > 0 ? (wins / decisiveTrades) * 100 : 0;
    const profitFactor = grossLosses > 0 ? grossGains / grossLosses : grossGains > 0 ? 99.9 : 0;
    const netReturnPct = ((capital - initialCapital) / initialCapital) * 100;
    
    // Trade win / loss return averages
    const winTrades = trades.filter(t => t.outcome === 'WIN');
    const lossTrades = trades.filter(t => t.outcome === 'LOSS');
    const avgWinPct = winTrades.length > 0 ? winTrades.reduce((acc, t) => acc + t.returnPct, 0) / winTrades.length : 0;
    const avgLossPct = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((acc, t) => acc + t.returnPct, 0) / lossTrades.length) : 0;
    const realizedRR = avgLossPct > 0 ? avgWinPct / avgLossPct : avgWinPct > 0 ? 99.9 : 1.0;

    // Mathematical Expectancy
    const winProb = winRate / 100;
    const lossProb = decisiveTrades > 0 ? losses / decisiveTrades : 0;
    const expectancy = (winProb * avgWinPct) - (lossProb * avgLossPct);

    // Fractional Half-Kelly Criterion Recommendation (capped at 25% max risk)
    const rawKelly = realizedRR > 0 ? (winProb - ((1 - winProb) / realizedRR)) : 0;
    const kellyPct = Math.max(0, Math.min(25, Math.round(rawKelly * 0.5 * 100)));

    // Time horizon in years
    const startMs = new Date(typeof candles[0].time === 'number' && candles[0].time < 1e11 ? candles[0].time * 1000 : candles[0].time).getTime();
    const endMs = new Date(typeof candles[candles.length - 1].time === 'number' && candles[candles.length - 1].time < 1e11 ? candles[candles.length - 1].time * 1000 : candles[candles.length - 1].time).getTime();
    const years = Math.max(0.1, (endMs - startMs) / (365.25 * 24 * 3600 * 1000));

    // Periodic Daily Mark-to-Market Sharpe & Sortino (annualized by sqrt(252))
    const periodicReturns = [];
    if (equityCurve.length > 1) {
        for (let k = 1; k < equityCurve.length; k++) {
            const prevEq = equityCurve[k - 1].equity;
            const currEq = equityCurve[k].equity;
            if (prevEq > 0) {
                periodicReturns.push(((currEq - prevEq) / prevEq) * 100);
            }
        }
    }

    const periodicMean = periodicReturns.length > 0
        ? periodicReturns.reduce((acc, r) => acc + r, 0) / periodicReturns.length
        : 0;
    const periodicVar = periodicReturns.length > 1
        ? periodicReturns.reduce((acc, r) => acc + Math.pow(r - periodicMean, 2), 0) / (periodicReturns.length - 1)
        : 0;
    const periodicStd = Math.sqrt(periodicVar);

    const rfAnnual = 7.0; // 7.0% Indian G-Sec Risk-Free rate
    const tradesPerYear = years > 0 ? totalTrades / years : 0;
    // Adapt annualization factor to trading frequency: sqrt(trades/year) bounded to [1, 252]
    const annualizationFactor = Math.sqrt(Math.max(1, Math.min(252, tradesPerYear)));
    const rfPerTrade = tradesPerYear > 0 ? rfAnnual / Math.max(1, tradesPerYear) : (rfAnnual / 252);

    const sharpeRatio = periodicStd > 0
        ? Math.round(((periodicMean - rfPerTrade) / periodicStd) * annualizationFactor * 100) / 100
        : 0;

    const downsideVar = periodicReturns.length > 1
        ? periodicReturns.reduce((acc, r) => acc + (r < rfPerTrade ? Math.pow(r - rfPerTrade, 2) : 0), 0) / (periodicReturns.length - 1)
        : 0;
    const downsideStd = Math.sqrt(downsideVar);

    const sortinoRatio = downsideStd > 0
        ? Math.round(((periodicMean - rfPerTrade) / downsideStd) * annualizationFactor * 100) / 100
        : 0;

    // CAGR (Compound Annual Growth Rate) with safety bounds for short durations (< 180 days)
    let cagr = 0;
    if (years >= 0.5 && initialCapital > 0 && capital > 0) {
        cagr = Math.round((Math.pow(capital / initialCapital, 1 / years) - 1) * 1000) / 10;
        cagr = Math.max(-100, Math.min(1000, cagr));
    } else if (initialCapital > 0) {
        // Report non-annualized period return for horizons under 6 months
        cagr = Math.round(netReturnPct * 10) / 10;
    }

    // Calmar Ratio
    const calmarRatio = maxDrawdownPct > 0 ? Math.round((cagr / maxDrawdownPct) * 100) / 100 : cagr > 0 ? 99.9 : 0;

    const avgTradeReturn = trades.reduce((acc, t) => acc + t.returnPct, 0) / totalTrades;
    const bestTrade = Math.max(...trades.map(t => t.returnPct));
    const worstTrade = Math.min(...trades.map(t => t.returnPct));
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

    // Calibration chart array with Wilson Score Confidence Intervals
    const calibration = Object.entries(calibBuckets).map(([bucket, b]) => {
        const predWin = b.total > 0 ? Math.round(b.sumConf / b.total) : (b.min + b.max) / 2;
        const actWin = b.total > 0 ? Math.round((b.wins / b.total) * 100) : null;
        const isReliable = b.total >= 15;
        const overconfidenceGap = isReliable && actWin !== null ? predWin - actWin : null;

        // Wilson Score 95% Confidence Interval
        let ciLower = null;
        let ciUpper = null;
        if (b.total > 0 && actWin !== null) {
            const p = b.wins / b.total;
            const z = 1.96;
            const denom = 1 + (z * z) / b.total;
            const center = (p + (z * z) / (2 * b.total)) / denom;
            const margin = (z * Math.sqrt((p * (1 - p) / b.total) + (z * z) / (4 * b.total * b.total))) / denom;
            ciLower = Math.max(0, Math.round((center - margin) * 100));
            ciUpper = Math.min(100, Math.round((center + margin) * 100));
        }

        return {
            bucket,
            sampleSize: b.total,
            predictedWinRate: predWin,
            actualWinRate: actWin,
            ciLower,
            ciUpper,
            isReliable,
            status: !isReliable ? 'INSUFFICIENT_SAMPLE' : 'VALIDATED',
            overconfidenceGap,
        };
    });

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
            winRate: Math.round((w / (w + l || 1)) * 1000) / 10,
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
        profitFactor: Math.round(profitFactor * 100) / 100,
        sharpeRatio,
        sortinoRatio,
        cagr,
        calmarRatio,
        realizedRR: Math.round(realizedRR * 100) / 100,
        expectancy: Math.round(expectancy * 100) / 100,
        kellyPct,
        maxConsecutiveWins,
        maxConsecutiveLosses,
        netReturnPct: Math.round(netReturnPct * 10) / 10,
        maxDrawdownPct: Math.round(maxDrawdownPct * 10) / 10,
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
        // Edge Leak Analysis for Horizon Expiries
        horizonExpiryAnalysis: (() => {
            const h = exitBreakdown.find(e => e.reason === 'HORIZON_EXPIRY');
            if (!h || h.count === 0) return null;
            // A "leak" only occurs when the user is in TARGET_STOP mode but has
            // enableHorizonTimeout ON — meaning trades are prematurely timing out
            // instead of hitting their intended profit targets/stop losses.
            // In pure HORIZON mode, 100% HORIZON_EXPIRY exits is intentional
            // and correct — it must NEVER be flagged as a leak.
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
                // Only flag as drag if: user is in TARGET_STOP mode with timeout enabled,
                // more than 25% of exits timed out prematurely, AND avg return is below 0.5%
                isMajorDrag: isPrematureTimeoutActive && h.pctOfTotal > 25 && h.avgReturnPct < 0.5,
            };
        })(),
        // Guardrail: Flag statistical edge validity
        isSampleReliable: totalTrades >= 20,
        guardrailWarning: totalTrades < 20 ? `Low sample size (N = ${totalTrades} < 20). Results are not statistically verified.` : null,
    };

    const walkForwardSummary = {
        inSample: calcSubset(inSampleTrades),
        outOfSample: calcSubset(outSampleTrades),
        efficiencyRatio: outSampleTrades.length && inSampleTrades.length
            ? Math.round((calcSubset(outSampleTrades).winRate / (calcSubset(inSampleTrades).winRate || 1)) * 100) / 100
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
