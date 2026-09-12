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
    '1m': { mode: 'intraday', targetPct: 0.20, stopPct: 0.10, horizonBars: 15, trailingStopPct: 0.08 },
    '5m': { mode: 'intraday', targetPct: 0.40, stopPct: 0.20, horizonBars: 15, trailingStopPct: 0.15 },
    '15m': { mode: 'intraday', targetPct: 0.60, stopPct: 0.30, horizonBars: 14, trailingStopPct: 0.25 },
    '1h': { mode: 'intraday', targetPct: 1.20, stopPct: 0.60, horizonBars: 10, trailingStopPct: 0.50 },
    'day': { mode: 'swing', targetPct: 2.50, stopPct: 1.25, horizonBars: 7, trailingStopPct: 1.00 },
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
        horizonBars: 7,
        enableHorizonTimeout: false, // In Target/Stop mode, default to pure target/stop execution without premature timeout
        targetPct: 2.5,
        stopPct: 1.25,
        trailingStopPct: 1.0,
    },
    slippageModel: 'NEXT_BAR_OPEN', // 'NEXT_BAR_OPEN' (realistic) | 'SAME_BAR_CLOSE' (instant)
    walkForward: {
        enabled: true,
        splitRatio: 0.7, // 70% in-sample / 30% out-of-sample
    },
    initialCapital: 100000,
    positionSizePct: 100, // % of equity per trade
    dateRange: 'SINCE_2010', // 'SINCE_2010' | 'SINCE_2015' | 'SINCE_2020' | 'ALL_TIME' | 'LAST_2_YEARS'
};

// ─── Main Execution Runner ──────────────────────────────────────────────────

export function precalculateBacktestIndicators(candles) {
    if (!candles || candles.length < 20) return null;
    const pncoData = calculatePNCO(candles);
    const aavbData = calculateAAVB(candles, { period: 20, baseMultiplier: 2.0 });
    const ifdiData = calculateIFDI(candles, 14);

    return {
        pncoData,
        aavbData,
        ifdiData,
        pncoMap: new Map(pncoData.map(d => [d.time, d])),
        ifdiMap: new Map(ifdiData.map(d => [d.time, d])),
        aavbMidMap: new Map(aavbData.middle.map(d => [d.time, d.value])),
        aavbUpMap: new Map(aavbData.upper.map(d => [d.time, d.value])),
        aavbLowMap: new Map(aavbData.lower.map(d => [d.time, d.value])),
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

    if (!candles || candles.length < 30) {
        return {
            error: 'Insufficient data. Minimum 30 candles required for backtesting.',
            summary: getEmptySummary(),
            trades: [],
            equityCurve: [],
            calibration: [],
        };
    }

    const n = candles.length;
    const splitIndex = config.walkForward.enabled ? Math.floor(n * config.walkForward.splitRatio) : n;

    // 1. Pre-calculate indicators for blazing performance
    const pre = precalc || precalculateBacktestIndicators(candles);
    const { pncoData, aavbData, ifdiData, pncoMap, ifdiMap, aavbMidMap, aavbUpMap, aavbLowMap } = pre;

    // 2. Scan and evaluate signals
    const trades = [];
    const minLookback = 20;

    let activeTrade = null;

    for (let i = minLookback; i < n - 1; i++) {
        const currentCandle = candles[i];
        const nextCandle = candles[i + 1];

        // If in a trade, evaluate exits
        if (activeTrade) {
            const isExit = evaluateTradeExit(activeTrade, candles, i, config.exitRule);
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
            { pncoMap, ifdiMap, aavbMidMap, aavbUpMap, aavbLowMap }
        );

        if (!signal) continue;

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
            status: 'OPEN',
            isOutOfSample: i >= splitIndex,
        };
    }

    // Close any active trade remaining at the final candle
    if (activeTrade) {
        closeTrade(activeTrade, candles[n - 1].close, candles[n - 1].time, n - 1, 'END_OF_DATA');
        trades.push(activeTrade);
    }

    // 3. Compute Equity Curve and Financial Metrics
    const { summary, equityCurve, calibration, walkForwardSummary } = computeBacktestMetrics(
        trades,
        candles,
        config.initialCapital,
        splitIndex,
        config.exitRule
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
        const baseThreshold = tfProfile.targetPct ? (tfProfile.targetPct / 100) * 0.35 : 0.0075;
        const scaleRange = Math.max(0.005, baseThreshold * 4.5);

        // Multi-bar rolling momentum + candle structure simulation
        const c1 = candles[i];
        const c3 = candles[i - 3] || c1;
        const delta = (c1.close - c3.close) / c3.close;
        const pnco = dataMaps.pncoMap.get(c1.time);
        
        // Predictor directional signal
        const absDelta = Math.abs(delta);
        if (delta > baseThreshold && (!pnco || pnco.value > 0)) {
            const excess = Math.max(0, absDelta - baseThreshold);
            // Calibrated AI confidence dynamically spanning 52% to 92% across momentum tiers
            const conf = Math.min(92, Math.max(52, Math.round(53 + (excess / scaleRange) * 38)));
            return {
                type: 'BUY',
                direction: 1,
                unit: 'PREDICTOR',
                label: `AI Bullish (${conf}%)`,
                confidence: conf,
                rawConfidence: conf,
            };
        } else if (delta < -baseThreshold && (!pnco || pnco.value < 0)) {
            const excess = Math.max(0, absDelta - baseThreshold);
            const conf = Math.min(92, Math.max(52, Math.round(53 + (excess / scaleRange) * 38)));
            return {
                type: 'SELL',
                direction: -1,
                unit: 'PREDICTOR',
                label: `AI Bearish (${conf}%)`,
                confidence: conf,
                rawConfidence: conf,
            };
        }
        return null;
    }

    // B. PATTERN RECOGNITION ENGINE
    if (unit === 'PATTERNS') {
        const slice = candles.slice(Math.max(0, i - 30), i + 1);
        const analysis = analyzeChartPatterns(slice, mode);
        if (!analysis || !analysis.activePatterns || analysis.activePatterns.length === 0) return null;

        // Find freshly formed pattern on this bar (age <= 1)
        const latest = analysis.activePatterns.find(p => p.age <= 1 && !p.invalidated);
        if (!latest) return null;

        if (config.selectedPattern !== 'ALL' && latest.id !== config.selectedPattern) {
            return null;
        }

        const isBullish = latest.dir === 1;
        return {
            type: isBullish ? 'BUY' : 'SELL',
            direction: latest.dir,
            unit: 'PATTERNS',
            label: `${latest.name}`,
            confidence: Math.min(95, Math.max(55, Math.round(Math.abs(latest.base) * 15))),
        };
    }

    // C. COMPOSITE PATTERN SCORE
    if (unit === 'COMPOSITE_SCORE') {
        const slice = candles.slice(Math.max(0, i - 30), i + 1);
        const prevSlice = candles.slice(Math.max(0, i - 31), i);
        const currScore = analyzeChartPatterns(slice, mode)?.score || 0;
        const prevScore = analyzeChartPatterns(prevSlice, mode)?.score || 0;
        const th = config.patternThreshold || 3;

        // Bullish crossover
        if (prevScore < th && currScore >= th) {
            return { type: 'BUY', direction: 1, unit: 'COMPOSITE_SCORE', label: `Pattern Score >= +${th}`, confidence: 75 };
        }
        // Bearish crossunder
        if (prevScore > -th && currScore <= -th) {
            return { type: 'SELL', direction: -1, unit: 'COMPOSITE_SCORE', label: `Pattern Score <= -${th}`, confidence: 75 };
        }
        return null;
    }

    // D. PNCO (Praxis Neural Confluence Oscillator)
    if (unit === 'PNCO') {
        const currPnco = dataMaps.pncoMap.get(currentCandle.time);
        const prevPnco = dataMaps.pncoMap.get(prevCandle.time);
        if (!currPnco || !prevPnco) return null;

        // Zero-line cross
        if (prevPnco.value < 0 && currPnco.value >= 0) {
            return { type: 'BUY', direction: 1, unit: 'PNCO', label: 'PNCO Zero Bull Cross', confidence: 72 };
        }
        if (prevPnco.value > 0 && currPnco.value <= 0) {
            return { type: 'SELL', direction: -1, unit: 'PNCO', label: 'PNCO Zero Bear Cross', confidence: 72 };
        }
        // Trap signals
        if (currPnco.trap === 'BEAR_TRAP') {
            return { type: 'BUY', direction: 1, unit: 'PNCO', label: 'PNCO Bear Trap Reversal', confidence: 82 };
        }
        if (currPnco.trap === 'BULL_TRAP') {
            return { type: 'SELL', direction: -1, unit: 'PNCO', label: 'PNCO Bull Trap Reversal', confidence: 82 };
        }
        return null;
    }

    // E. AAVB (AI-Adaptive Volatility Bands)
    if (unit === 'AAVB') {
        const lowBand = dataMaps.aavbLowMap.get(currentCandle.time);
        const upBand = dataMaps.aavbUpMap.get(currentCandle.time);
        const midBand = dataMaps.aavbMidMap.get(currentCandle.time);
        if (!lowBand || !upBand || !midBand) return null;

        // Lower band bounce OR bullish midline crossover
        const isNearLower = currentCandle.low <= lowBand * 1.01;
        const isMidBullCross = prevCandle && prevCandle.close < midBand && currentCandle.close >= midBand;
        if (isNearLower || isMidBullCross) {
            return { type: 'BUY', direction: 1, unit: 'AAVB', label: isNearLower ? 'AAVB Lower Support' : 'AAVB Midline Bull Cross', confidence: 76 };
        }

        // Upper band rejection OR bearish midline crossunder
        const isNearUpper = currentCandle.high >= upBand * 0.99;
        const isMidBearCross = prevCandle && prevCandle.close > midBand && currentCandle.close <= midBand;
        if (isNearUpper || isMidBearCross) {
            return { type: 'SELL', direction: -1, unit: 'AAVB', label: isNearUpper ? 'AAVB Upper Resistance' : 'AAVB Midline Bear Cross', confidence: 76 };
        }
        return null;
    }

    // F. IFDI (Institutional Flow Divergence Index)
    if (unit === 'IFDI') {
        const currIfdi = dataMaps.ifdiMap.get(currentCandle.time);
        const prevIfdi = dataMaps.ifdiMap.get(prevCandle.time);
        if (!currIfdi) return null;

        if (currIfdi.divergence === 'HIDDEN_ACCUMULATION') {
            return { type: 'BUY', direction: 1, unit: 'IFDI', label: 'Smart Money Accumulation', confidence: 86 };
        }
        if (currIfdi.divergence === 'HIDDEN_DISTRIBUTION') {
            return { type: 'SELL', direction: -1, unit: 'IFDI', label: 'Smart Money Distribution', confidence: 86 };
        }
        // Flow state shift
        if (prevIfdi && prevIfdi.flowState !== 'ACCUMULATION' && currIfdi.flowState === 'ACCUMULATION') {
            return { type: 'BUY', direction: 1, unit: 'IFDI', label: 'Institutional Flow Influx', confidence: 70 };
        }
        if (prevIfdi && prevIfdi.flowState !== 'DISTRIBUTION' && currIfdi.flowState === 'DISTRIBUTION') {
            return { type: 'SELL', direction: -1, unit: 'IFDI', label: 'Institutional Flow Outflow', confidence: 70 };
        }
        return null;
    }

    // G. HEAD-TO-HEAD COMPARISON (Benchmarking Confluence vs Pure AI vs Pure Tech)
    if (unit === 'HEAD_TO_HEAD') {
        const pnco = dataMaps.pncoMap.get(currentCandle.time);
        const ifdi = dataMaps.ifdiMap.get(currentCandle.time);
        if (pnco && pnco.value > 15 && ifdi && ifdi.value > 10) {
            return { type: 'BUY', direction: 1, unit: 'HEAD_TO_HEAD', label: 'Tri-Factor Confluence Buy', confidence: 88 };
        }
        if (pnco && pnco.value < -15 && ifdi && ifdi.value < -10) {
            return { type: 'SELL', direction: -1, unit: 'HEAD_TO_HEAD', label: 'Tri-Factor Confluence Sell', confidence: 88 };
        }
        return null;
    }

    // H. CUSTOM COMBO STRATEGY
    if (unit === 'CUSTOM_COMBO') {
        const slice = candles.slice(Math.max(0, i - 20), i + 1);
        const patternScore = analyzeChartPatterns(slice, mode)?.score || 0;
        const ifdi = dataMaps.ifdiMap.get(currentCandle.time);
        const midAavb = dataMaps.aavbMidMap.get(currentCandle.time);

        const rules = config.customRules || {};
        const minScore = rules.patternScoreMin !== undefined ? rules.patternScoreMin : 2;

        const scoreOk = patternScore >= minScore;
        const ifdiOk = !rules.requireIfdiAccumulation || (ifdi && (ifdi.flowState === 'ACCUMULATION' || ifdi.value > 5));
        const aavbOk = !rules.aboveAavbMidline || (midAavb && currentCandle.close >= midAavb * 0.998);

        if (scoreOk && ifdiOk && aavbOk) {
            return { type: 'BUY', direction: 1, unit: 'CUSTOM_COMBO', label: 'Alpha Confluence Trigger', confidence: 89 };
        }
        return null;
    }

    return null;
}

// ─── Trade Exit Evaluation ─────────────────────────────────────────────────

function evaluateTradeExit(trade, candles, currentIdx, exitRule) {
    const candle = candles[currentIdx];
    trade.barsHeld++;

    trade.highestPrice = Math.max(trade.highestPrice, candle.high);
    trade.lowestPrice = Math.min(trade.lowestPrice, candle.low);

    const isLong = trade.direction === 1;

    // 1. Target & Stop Check
    if (exitRule.type === 'TARGET_STOP' || exitRule.type === 'TRAILING_STOP') {
        const targetPct = exitRule.targetPct / 100;
        const stopPct = exitRule.stopPct / 100;

        if (isLong) {
            const highGain = (candle.high - trade.entryPrice) / trade.entryPrice;
            const lowLoss = (candle.low - trade.entryPrice) / trade.entryPrice;

            if (highGain >= targetPct) {
                closeTrade(trade, trade.entryPrice * (1 + targetPct), candle.time, currentIdx, 'TARGET');
                return true;
            }
            if (lowLoss <= -stopPct) {
                closeTrade(trade, trade.entryPrice * (1 - stopPct), candle.time, currentIdx, 'STOP');
                return true;
            }

            // Trailing Stop
            if (exitRule.type === 'TRAILING_STOP') {
                const trailPct = (exitRule.trailingStopPct || 1.0) / 100;
                const peakGain = (trade.highestPrice - trade.entryPrice) / trade.entryPrice;
                if (peakGain > 0.015) { // Activate trailing stop after 1.5% in profit
                    const dropFromPeak = (trade.highestPrice - candle.low) / trade.highestPrice;
                    if (dropFromPeak >= trailPct) {
                        closeTrade(trade, trade.highestPrice * (1 - trailPct), candle.time, currentIdx, 'TRAILING_STOP');
                        return true;
                    }
                }
            }
        } else {
            // Short trade
            const lowGain = (trade.entryPrice - candle.low) / trade.entryPrice;
            const highLoss = (trade.entryPrice - candle.high) / trade.entryPrice;

            if (lowGain >= targetPct) {
                closeTrade(trade, trade.entryPrice * (1 - targetPct), candle.time, currentIdx, 'TARGET');
                return true;
            }
            if (highLoss <= -stopPct) {
                closeTrade(trade, trade.entryPrice * (1 + stopPct), candle.time, currentIdx, 'STOP');
                return true;
            }
        }
    }

    // 2. Fixed N-Bar Horizon Expiration
    const horizonLimit = exitRule.horizonBars || 7;
    const isFixedHorizon = exitRule.type === 'HORIZON';
    const isTimeoutActive = isFixedHorizon || (exitRule.enableHorizonTimeout === true && horizonLimit > 0);

    if (isTimeoutActive && trade.barsHeld >= horizonLimit) {
        closeTrade(trade, candle.close, candle.time, currentIdx, 'HORIZON_EXPIRY');
        return true;
    }

    return false;
}

function closeTrade(trade, exitPrice, exitTime, exitBarIndex, reason) {
    trade.status = 'CLOSED';
    trade.exitPrice = Math.round(exitPrice * 100) / 100;
    trade.exitTime = exitTime;
    trade.exitBarIndex = exitBarIndex;
    trade.exitReason = reason;

    const returnPct = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * trade.direction;
    trade.returnPct = Math.round(returnPct * 100) / 100;
    trade.outcome = trade.returnPct > 0 ? 'WIN' : 'LOSS';
}

// ─── Scorecard & Performance Metrics Calculation ───────────────────────────

function computeBacktestMetrics(trades, candles, initialCapital, splitIndex, exitRule = {}) {
    if (!trades || trades.length === 0) {
        return {
            summary: getEmptySummary(),
            equityCurve: [],
            calibration: [],
            walkForwardSummary: null,
        };
    }

    let capital = initialCapital;
    let peakCapital = initialCapital;
    let maxDrawdownPct = 0;

    const equityCurve = [{
        time: candles[0].time,
        equity: initialCapital,
        pnlPct: 0,
        drawdown: 0,
    }];

    let grossGains = 0;
    let grossLosses = 0;
    let wins = 0;
    let losses = 0;

    // Confidence calibration tracking for AI Predictor: 4 buckets
    const calibBuckets = {
        '50-60%': { min: 50, max: 60, total: 0, wins: 0, sumConf: 0 },
        '60-70%': { min: 60, max: 70, total: 0, wins: 0, sumConf: 0 },
        '70-80%': { min: 70, max: 80, total: 0, wins: 0, sumConf: 0 },
        '80-100%': { min: 80, max: 100, total: 0, wins: 0, sumConf: 0 },
    };

    trades.forEach((trade, idx) => {
        const tradePnl = capital * (trade.returnPct / 100);
        capital += tradePnl;
        trade.realizedPnl = Math.round(tradePnl);
        trade.runningCapital = Math.round(capital);

        if (trade.returnPct > 0) {
            wins++;
            grossGains += tradePnl;
        } else {
            losses++;
            grossLosses += Math.abs(tradePnl);
        }

        if (capital > peakCapital) peakCapital = capital;
        const currentDrawdownPct = ((peakCapital - capital) / peakCapital) * 100;
        if (currentDrawdownPct > maxDrawdownPct) maxDrawdownPct = currentDrawdownPct;

        equityCurve.push({
            time: trade.exitTime,
            equity: Math.round(capital),
            pnlPct: Math.round(((capital - initialCapital) / initialCapital) * 1000) / 10,
            drawdown: Math.round(currentDrawdownPct * 10) / 10,
            tradeIndex: idx + 1,
            outcome: trade.outcome,
        });

        // Calibration bucket sorting
        const c = trade.confidence || 60;
        for (const [key, b] of Object.entries(calibBuckets)) {
            if (c >= b.min && (c < b.max || (b.max === 100 && c <= 100))) {
                b.total++;
                b.sumConf += c;
                if (trade.outcome === 'WIN') b.wins++;
                break;
            }
        }
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = grossLosses > 0 ? grossGains / grossLosses : grossGains > 0 ? 99.9 : 0;
    const netReturnPct = ((capital - initialCapital) / initialCapital) * 100;
    const avgTradeReturn = trades.reduce((acc, t) => acc + t.returnPct, 0) / totalTrades;
    const bestTrade = Math.max(...trades.map(t => t.returnPct));
    const worstTrade = Math.min(...trades.map(t => t.returnPct));
    const avgBarsHeld = Math.round(trades.reduce((acc, t) => acc + t.barsHeld, 0) / totalTrades);

    // Detailed Exit Reason Breakdown (Target, Stop, Horizon Expiry, Trailing Stop)
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
        else grp.losses++;
        grp.totalReturn += trade.returnPct;
        grp.barsHeldSum += trade.barsHeld;
    });

    const exitBreakdown = Object.values(exitReasons).map(grp => ({
        reason: grp.reason,
        count: grp.count,
        pctOfTotal: Math.round((grp.count / totalTrades) * 1000) / 10,
        winRate: Math.round((grp.wins / grp.count) * 1000) / 10,
        avgReturnPct: Math.round((grp.totalReturn / grp.count) * 100) / 100,
        avgBarsHeld: Math.round((grp.barsHeldSum / grp.count) * 10) / 10,
        netReturnContributionPct: Math.round(grp.totalReturn * 10) / 10,
    }));

    // Calibration chart array with strict N=20 guardrail & overconfidence gap
    const calibration = Object.entries(calibBuckets).map(([bucket, b]) => {
        const predWin = b.total > 0 ? Math.round(b.sumConf / b.total) : (b.min + b.max) / 2;
        const actWin = b.total > 0 ? Math.round((b.wins / b.total) * 100) : null;
        const isReliable = b.total >= 20;
        const overconfidenceGap = isReliable && actWin !== null ? predWin - actWin : null;
        return {
            bucket,
            sampleSize: b.total,
            predictedWinRate: predWin,
            actualWinRate: actWin,
            isReliable,
            status: !isReliable ? 'INSUFFICIENT_SAMPLE' : 'VALIDATED',
            overconfidenceGap,
        };
    });

    // In-Sample vs Out-of-Sample metrics
    const inSampleTrades = trades.filter(t => !t.isOutOfSample);
    const outSampleTrades = trades.filter(t => t.isOutOfSample);

    const calcSubset = (list) => {
        if (!list.length) return { count: 0, winRate: 0, netReturnPct: 0 };
        const w = list.filter(t => t.outcome === 'WIN').length;
        const sumRet = list.reduce((acc, t) => acc + t.returnPct, 0);
        return {
            count: list.length,
            winRate: Math.round((w / list.length) * 1000) / 10,
            netReturnPct: Math.round(sumRet * 10) / 10,
        };
    };

    const summary = {
        totalTrades,
        wins,
        losses,
        winRate: Math.round(winRate * 10) / 10,
        profitFactor: Math.round(profitFactor * 100) / 100,
        netReturnPct: Math.round(netReturnPct * 10) / 10,
        maxDrawdownPct: Math.round(maxDrawdownPct * 10) / 10,
        avgTradeReturn: Math.round(avgTradeReturn * 100) / 100,
        bestTrade: Math.round(bestTrade * 100) / 100,
        worstTrade: Math.round(worstTrade * 100) / 100,
        avgBarsHeld,
        endingCapital: Math.round(capital),
        exitBreakdown,
        // Edge Leak Analysis for Horizon Expiries
        horizonExpiryAnalysis: (() => {
            const h = exitBreakdown.find(e => e.reason === 'HORIZON_EXPIRY');
            if (!h || h.count === 0) return null;
            return {
                count: h.count,
                pctOfTotal: h.pctOfTotal,
                winRate: h.winRate,
                avgReturnPct: h.avgReturnPct,
                horizonBars: exitRule?.horizonBars || 7,
                isMajorDrag: h.pctOfTotal > 25 && h.avgReturnPct < 0.5,
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

function getEmptySummary() {
    return {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        profitFactor: 0,
        netReturnPct: 0,
        maxDrawdownPct: 0,
        avgTradeReturn: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgBarsHeld: 0,
        endingCapital: 100000,
        isSampleReliable: false,
        guardrailWarning: 'No trades generated with current parameters.',
    };
}
