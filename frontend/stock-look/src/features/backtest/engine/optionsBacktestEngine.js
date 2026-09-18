/**
 * Institutional Multi-Leg Options Strategy Backtesting Engine
 * 
 * Simulates real-world options trading over historical underlying price series:
 * - Multi-leg strategies: Bull Call Spread, Bear Put Spread, Long/Short Straddle, Iron Condor, Long Call/Put.
 * - Daily Merton Black-Scholes pricing using Abramowitz-Stegun Normal CDF.
 * - Dynamic Greek tracking (Delta, Gamma, Theta, Vega) and theta decay acceleration.
 * - Implied volatility crush / expansion impact.
 * - Expiry cash settlement at true intrinsic value.
 */

import { calculateRoundTripTransactionCosts, INDIAN_INSTRUMENT_TYPES } from './institutionalFeeEngine.js';

export const OPTIONS_STRATEGIES = {
    BULL_CALL_SPREAD: 'BULL_CALL_SPREAD',
    BEAR_PUT_SPREAD: 'BEAR_PUT_SPREAD',
    LONG_STRADDLE: 'LONG_STRADDLE',
    SHORT_STRADDLE: 'SHORT_STRADDLE',
    IRON_CONDOR: 'IRON_CONDOR',
    LONG_CALL: 'LONG_CALL',
    LONG_PUT: 'LONG_PUT',
};

export const DEFAULT_OPTIONS_BACKTEST_CONFIG = {
    strategyType: OPTIONS_STRATEGIES.BULL_CALL_SPREAD,
    targetDte: 14, // Days to Expiration
    riskFreeRatePct: 7.0, // 7% Indian G-Sec
    baselineIvPct: 18.0, // 18% Implied Volatility
    profitTargetPct: 50.0, // Exit at 50% max gain
    stopLossPct: 60.0, // Exit at 60% max loss
    lotSize: 50, // Standard Nifty lot size
};

// ─── High Precision Normal CDF (Abramowitz & Stegun 7.1.26, error < 7.5e-8) ─

function normalCdf(x) {
    const b1 = 0.319381530;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;
    const p = 0.2316419;
    const c = 0.39894228;

    if (x >= 0.0) {
        const t = 1.0 / (1.0 + p * x);
        return 1.0 - c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    } else {
        const t = 1.0 / (1.0 - p * x);
        return c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    }
}

function normalPdf(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Merton Black-Scholes analytical option pricer with Greeks.
 */
export function calculateBlackScholes(spot, strike, dteDays, riskFreePct, ivPct, isCall = true) {
    const S = Math.max(0.01, spot);
    const K = Math.max(0.01, strike);
    const T = Math.max(0.0001, dteDays / 365.25);
    const r = (riskFreePct || 7.0) / 100;
    const sigma = Math.max(0.01, (ivPct || 18.0) / 100);

    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    let price = 0;
    let delta = 0;
    let theta = 0;

    const discount = Math.exp(-r * T);

    if (isCall) {
        price = S * normalCdf(d1) - K * discount * normalCdf(d2);
        delta = normalCdf(d1);
        theta = (-(S * normalPdf(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * discount * normalCdf(d2)) / 365.25;
    } else {
        price = K * discount * normalCdf(-d2) - S * normalCdf(-d1);
        delta = normalCdf(d1) - 1.0;
        theta = (-(S * normalPdf(d1) * sigma) / (2 * Math.sqrt(T)) + r * K * discount * normalCdf(-d2)) / 365.25;
    }

    const gamma = normalPdf(d1) / (S * sigma * Math.sqrt(T));
    const vega = (S * Math.sqrt(T) * normalPdf(d1)) / 100;

    return {
        price: Math.max(0.05, Math.round(price * 100) / 100),
        delta: Math.round(delta * 1000) / 1000,
        gamma: Math.round(gamma * 100000) / 100000,
        theta: Math.round(theta * 100) / 100,
        vega: Math.round(vega * 100) / 100,
    };
}

/**
 * Runs an institutional Options Backtest on historical candles.
 * 
 * @param {Array} candles - OHLCV historical candle array
 * @param {Array} directionalSignals - Array of directional triggers { index, direction: 1|-1, label }
 * @param {Object} [customConfig={}] - Options setup parameters
 * @returns {Object} Comprehensive options strategy backtest results
 */
export function runOptionsStrategyBacktest(candles, directionalSignals = [], customConfig = {}) {
    const config = { ...DEFAULT_OPTIONS_BACKTEST_CONFIG, ...customConfig };
    if (!candles || candles.length < 20 || !directionalSignals.length) {
        return getEmptyOptionsBacktestResult();
    }

    const n = candles.length;
    const trades = [];
    let activeTrade = null;

    // Estimate historical rolling volatility for dynamic IV proxy
    const closes = candles.map(c => c.close);
    const rollingVols = computeRollingVolatility(closes, 20);

    for (let i = 0; i < n; i++) {
        const c = candles[i];
        const spot = c.close;
        const iv = Math.max(10, Math.min(60, (rollingVols[i] || config.baselineIvPct)));

        // 1. Evaluate open active trade
        if (activeTrade) {
            const barsElapsed = i - activeTrade.entryBarIndex;
            const remainingDte = Math.max(0, config.targetDte - barsElapsed);

            // Re-price all legs at current market bar
            let currentTotalValue = 0;
            let netDelta = 0;
            let netGamma = 0;
            let netTheta = 0;
            let netVega = 0;

            activeTrade.legs.forEach(leg => {
                let legPrice = 0;
                if (remainingDte <= 0) {
                    // Expiry settlement: cash settlement at pure intrinsic value
                    legPrice = leg.isCall ? Math.max(0, spot - leg.strike) : Math.max(0, leg.strike - spot);
                } else {
                    const bs = calculateBlackScholes(spot, leg.strike, remainingDte, config.riskFreeRatePct, iv, leg.isCall);
                    legPrice = bs.price;
                    netDelta += bs.delta * leg.quantity;
                    netGamma += bs.gamma * leg.quantity;
                    netTheta += bs.theta * leg.quantity;
                    netVega += bs.vega * leg.quantity;
                }
                currentTotalValue += legPrice * leg.quantity;
            });

            const currentPnl = (currentTotalValue - activeTrade.initialCost) * config.lotSize;
            const currentReturnPct = activeTrade.initialCost !== 0 
                ? (currentPnl / (Math.abs(activeTrade.initialCost) * config.lotSize)) * 100 
                : 0;

            const isExpired = remainingDte <= 0;
            const isTargetHit = currentReturnPct >= config.profitTargetPct;
            const isStopHit = currentReturnPct <= -config.stopLossPct;

            if (isExpired || isTargetHit || isStopHit || i === n - 1) {
                // Close options trade
                const exitReason = isTargetHit ? 'TARGET' : isStopHit ? 'STOP' : isExpired ? 'EXPIRY' : 'LAST_BAR';
                
                // Calculate Indian statutory options transaction fees
                const feeData = calculateRoundTripTransactionCosts({
                    entryPrice: Math.abs(activeTrade.initialCost),
                    exitPrice: Math.abs(currentTotalValue),
                    quantity: config.lotSize,
                    direction: 1,
                }, { instrumentType: INDIAN_INSTRUMENT_TYPES.OPTIONS });

                const netPnl = Math.round(currentPnl - feeData.totalCostRupees);
                const finalReturnPct = Math.round((netPnl / (Math.abs(activeTrade.initialCost) * config.lotSize)) * 1000) / 10;

                trades.push({
                    id: `opt_${trades.length + 1}`,
                    strategy: config.strategyType,
                    entryTime: activeTrade.entryTime,
                    entryBarIndex: activeTrade.entryBarIndex,
                    exitTime: c.time,
                    exitBarIndex: i,
                    barsHeld: barsElapsed,
                    entrySpot: activeTrade.entrySpot,
                    exitSpot: spot,
                    initialPremium: Math.round(activeTrade.initialCost * 100) / 100,
                    finalPremium: Math.round(currentTotalValue * 100) / 100,
                    pnl: netPnl,
                    returnPct: finalReturnPct,
                    outcome: netPnl > 0 ? 'WIN' : netPnl < 0 ? 'LOSS' : 'BREAKEVEN',
                    exitReason,
                    fees: feeData.totalCostRupees,
                    initialDelta: Math.round(activeTrade.initialDelta * 100) / 100,
                    initialTheta: Math.round(activeTrade.initialTheta * 100) / 100,
                });

                activeTrade = null;
            }
        }

        // 2. Evaluate new signal entry if no active trade
        if (!activeTrade && i < n - 5) {
            const sig = directionalSignals.find(s => s.index === i);
            if (sig) {
                activeTrade = initializeOptionsTrade(sig, spot, i, c.time, config, iv);
            }
        }
    }

    return computeOptionsBacktestMetrics(trades);
}

function initializeOptionsTrade(signal, spot, barIdx, time, config, iv) {
    const isBull = signal.direction > 0;
    const stepSize = spot > 10000 ? 100 : spot > 2000 ? 50 : spot > 500 ? 20 : 5;
    const atmStrike = Math.round(spot / stepSize) * stepSize;
    const otmCallStrike = atmStrike + stepSize;
    const otmPutStrike = atmStrike - stepSize;

    const legs = [];
    let strat = config.strategyType;

    if (strat === OPTIONS_STRATEGIES.BULL_CALL_SPREAD) {
        // Buy ATM Call (+1), Sell OTM Call (-1)
        legs.push({ strike: atmStrike, isCall: true, quantity: 1 });
        legs.push({ strike: otmCallStrike, isCall: true, quantity: -1 });
    } else if (strat === OPTIONS_STRATEGIES.BEAR_PUT_SPREAD) {
        // Buy ATM Put (+1), Sell OTM Put (-1)
        legs.push({ strike: atmStrike, isCall: false, quantity: 1 });
        legs.push({ strike: otmPutStrike, isCall: false, quantity: -1 });
    } else if (strat === OPTIONS_STRATEGIES.LONG_STRADDLE) {
        // Buy ATM Call (+1), Buy ATM Put (+1)
        legs.push({ strike: atmStrike, isCall: true, quantity: 1 });
        legs.push({ strike: atmStrike, isCall: false, quantity: 1 });
    } else if (strat === OPTIONS_STRATEGIES.SHORT_STRADDLE) {
        // Sell ATM Call (-1), Sell ATM Put (-1)
        legs.push({ strike: atmStrike, isCall: true, quantity: -1 });
        legs.push({ strike: atmStrike, isCall: false, quantity: -1 });
    } else if (strat === OPTIONS_STRATEGIES.IRON_CONDOR) {
        legs.push({ strike: otmCallStrike, isCall: true, quantity: -1 });
        legs.push({ strike: otmCallStrike + stepSize, isCall: true, quantity: 1 });
        legs.push({ strike: otmPutStrike, isCall: false, quantity: -1 });
        legs.push({ strike: otmPutStrike - stepSize, isCall: false, quantity: 1 });
    } else {
        // Default directional single leg
        legs.push({ strike: atmStrike, isCall: isBull, quantity: 1 });
    }

    let initialCost = 0;
    let initialDelta = 0;
    let initialTheta = 0;

    legs.forEach(l => {
        const bs = calculateBlackScholes(spot, l.strike, config.targetDte, config.riskFreeRatePct, iv, l.isCall);
        initialCost += bs.price * l.quantity;
        initialDelta += bs.delta * l.quantity;
        initialTheta += bs.theta * l.quantity;
    });

    return {
        entryBarIndex: barIdx,
        entryTime: time,
        entrySpot: spot,
        legs,
        initialCost,
        initialDelta,
        initialTheta,
    };
}

function computeOptionsBacktestMetrics(trades) {
    if (!trades || !trades.length) return getEmptyOptionsBacktestResult();

    const totalTrades = trades.length;
    const wins = trades.filter(t => t.outcome === 'WIN').length;
    const losses = trades.filter(t => t.outcome === 'LOSS').length;
    const winRate = Math.round((wins / totalTrades) * 1000) / 10;

    let grossGains = 0;
    let grossLosses = 0;
    let totalPnl = 0;

    trades.forEach(t => {
        totalPnl += t.pnl;
        if (t.pnl > 0) grossGains += t.pnl;
        else grossLosses += Math.abs(t.pnl);
    });

    const profitFactor = grossLosses > 0 ? Math.round((grossGains / grossLosses) * 100) / 100 : (grossGains > 0 ? 99.9 : 0);

    const averageInitialDelta = Math.round((trades.reduce((a, t) => a + (t.initialDelta || 0), 0) / (totalTrades || 1)) * 100) / 100;
    const averageInitialTheta = Math.round((trades.reduce((a, t) => a + (t.initialTheta || 0), 0) / (totalTrades || 1)) * 100) / 100;

    return {
        totalTrades,
        wins,
        losses,
        winRate,
        profitFactor,
        netPnl: Math.round(totalPnl),
        averageInitialDelta,
        averageInitialTheta,
        trades,
    };
}

function getEmptyOptionsBacktestResult() {
    return {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        profitFactor: 0,
        netPnl: 0,
        trades: [],
    };
}

function computeRollingVolatility(closes, period = 20) {
    const vols = new Array(closes.length).fill(18.0);
    if (closes.length < period + 1) return vols;

    const logReturns = [];
    for (let i = 1; i < closes.length; i++) {
        logReturns.push(Math.log(closes[i] / closes[i - 1]));
    }

    for (let i = period; i < closes.length; i++) {
        const slice = logReturns.slice(i - period, i);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (period - 1);
        const dailyStd = Math.sqrt(variance);
        // Annualize with sqrt(252)
        vols[i] = Math.round(dailyStd * Math.sqrt(252) * 1000) / 10;
    }

    return vols;
}
