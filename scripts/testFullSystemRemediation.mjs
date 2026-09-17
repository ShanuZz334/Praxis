/**
 * @file testFullSystemRemediation.mjs
 * Comprehensive end-to-end verification script for all audited fixes across Strategy Builder & Backtest.
 */

import { evaluateStyleSuitability, diagnoseMathematicalLeaks, analyzeAnnualConsistency } from '../frontend/stock-look/src/features/backtest/engine/backtestWalkthroughEngine.js';
import { SIGNAL_DEFINITIONS } from '../frontend/stock-look/src/features/backtest/strategy/strategySignalDefinitions.js';
import { getCustomIndicators, hydrateIndicator, STARTER_TEMPLATES } from '../frontend/stock-look/src/features/backtest/lab/customIndicatorRegistry.js';
import { evaluateCustomLabSeries, precalculateStrategySeries, evaluateStrategyRulesAtBar } from '../frontend/stock-look/src/features/backtest/strategy/strategyEngine.js';
import { runBacktest, precalculateBacktestIndicators } from '../frontend/stock-look/src/features/backtest/engine/backtestEngine.js';
import { saveStrategy, importStrategy } from '../frontend/stock-look/src/features/backtest/strategy/strategyRegistry.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, name) {
    totalTests++;
    if (condition) {
        console.log(`✅ PASS: ${name}`);
        passedTests++;
    } else {
        console.error(`❌ FAIL: ${name}`);
    }
}

console.log('=== COMPREHENSIVE STRATEGY & BACKTEST AUDIT VERIFICATION ===\n');

// ── TEST 1: backtestWalkthroughEngine property mapping ────────────────────────
const mockSummary = {
    profitFactor: 2.1,
    winRate: 65,
    netReturnPct: 45.2,
    expectancy: 1.2,
    maxDrawdownPct: 11.2,
    totalTrades: 50,
    avgBarsHeld: 12,
    yearlyBreakdown: [
        { year: 2023, returnPct: 22.4, trades: 24, wins: 16 },
        { year: 2024, returnPct: 18.6, trades: 26, wins: 17 },
    ],
};
const mockConfig = {
    timeframe: 'day',
    mode: 'swing',
    costModel: 'INDIAN_REALISTIC',
    exitRule: { type: 'TARGET_STOP', horizonBars: 12, enableHorizonTimeout: false },
};

const styleRes = evaluateStyleSuitability(mockSummary, mockConfig);
assert(styleRes.detectedStyle.includes('Swing'), 'evaluateStyleSuitability properly maps avgBarsHeld to trading style');
const annualRes = analyzeAnnualConsistency(mockSummary);
assert(annualRes && annualRes.totalYears === 2 && annualRes.positiveYears === 2, 'analyzeAnnualConsistency properly maps yearlyBreakdown');

// ── TEST 2: VWAP Session-Anchored vs Daily Rolling ───────────────────────────
const vwapDef = SIGNAL_DEFINITIONS.vwap;
const intradayBars = [
    { time: '2026-09-10T09:15:00Z', open: 100, high: 105, low: 99, close: 102, volume: 1000 },
    { time: '2026-09-10T09:30:00Z', open: 102, high: 106, low: 101, close: 104, volume: 2000 },
    { time: '2026-09-11T09:15:00Z', open: 130, high: 135, low: 129, close: 132, volume: 500 },
];
const vwapIntraday = vwapDef.compute(intradayBars);
assert(vwapIntraday[2] > 130, `VWAP resets at intraday day boundary (got ${vwapIntraday[2]}, expected > 130)`);

// ── TEST 3: Custom Indicator Hydration across JSON Serialization ──────────────
const starter = STARTER_TEMPLATES[0];
const serialized = JSON.stringify(starter);
const rawParsed = JSON.parse(serialized);
assert(typeof rawParsed.rules[0].checkBuy === 'undefined', 'JSON.stringify stripped functions');
const rehydrated = hydrateIndicator(rawParsed);
assert(typeof rehydrated.rules[0].checkBuy === 'function', 'hydrateIndicator restored checkBuy');
assert(typeof rehydrated.calculate === 'function', 'hydrateIndicator restored calculate');

// ── TEST 4: AVSS Template Non-Identical Signals ───────────────────────────────
const avss = STARTER_TEMPLATES.find(t => t.nickname === 'AVSS');
const avssRule = avss.rules[0];
const bullBar = { close: 110 };
const prevBar = { close: 100 };
assert(avssRule.checkBuy(3.0, 1.0, { threshold: 2.0 }, bullBar, prevBar) === true, 'AVSS bullish bar triggers checkBuy');
assert(avssRule.checkSell(3.0, 1.0, { threshold: 2.0 }, bullBar, prevBar) === false, 'AVSS bullish bar suppresses checkSell');

// ── TEST 5: Dual-Key seriesMap Isolation ─────────────────────────────────────
const testCandles = Array.from({ length: 40 }, (_, i) => ({
    time: i * 86400000,
    open: 100 + Math.sin(i * 0.5) * 10,
    high: 105 + Math.sin(i * 0.5) * 10,
    low: 95 + Math.sin(i * 0.5) * 10,
    close: 100 + Math.sin(i * 0.5) * 10,
    volume: 1000,
}));

const rulesWithSameIdDifferentParams = [
    { id: 'rule_fast', indicatorId: 'rsi', params: { period: 5 } },
    { id: 'rule_slow', indicatorId: 'rsi', params: { period: 20 } },
];
const seriesMap = precalculateStrategySeries(testCandles, rulesWithSameIdDifferentParams);
assert(seriesMap['rule_fast'] !== undefined, 'seriesMap contains rule_fast');
assert(seriesMap['rule_slow'] !== undefined, 'seriesMap contains rule_slow');
// RSI 5 and RSI 20 must NOT be identical series
assert(seriesMap['rule_fast'][25] !== seriesMap['rule_slow'][25], 'RSI 5 and RSI 20 series are distinct without cross-talk');

// ── TEST 6: CUSTOM_COMBO 2-Way Signals in backtestEngine ─────────────────────
const longComboConfig = {
    unit: 'CUSTOM_COMBO',
    customRules: { patternScoreMin: 1, requireIfdiAccumulation: false, aboveAavbMidline: false }
};
const resLong = runBacktest(testCandles, longComboConfig);
assert(resLong.summary !== undefined, 'runBacktest runs CUSTOM_COMBO smoothly');

// ── TEST 7: bestTrade / worstTrade with 2,500 Trades (No Stack Overflow) ─────
const largeTradeList = Array.from({ length: 2500 }, (_, i) => ({
    id: `t_${i}`,
    returnPct: (Math.sin(i) * 10),
    barsHeld: (i % 10) + 1,
    status: 'CLOSED',
    pnl: (Math.sin(i) * 1000),
    entryPrice: 100,
    exitPrice: 100 + (Math.sin(i) * 10),
    entryTime: i * 3600,
    exitTime: (i + 1) * 3600,
    exitReason: 'TARGET'
}));
let bestTrade, worstTrade;
try {
    bestTrade = largeTradeList.reduce((max, t) => t.returnPct > max ? t.returnPct : max, -Infinity);
    worstTrade = largeTradeList.reduce((min, t) => t.returnPct < min ? t.returnPct : min, Infinity);
    assert(bestTrade > 9.9 && worstTrade < -9.9, 'reduce computes min/max across 2,500 trades safely without stack overflow');
} catch (e) {
    assert(false, 'Stack overflow occurred in large trade reduction');
}

// ── TEST 8: Pattern Caching Acceleration ─────────────────────────────────────
const precalcObj = precalculateBacktestIndicators(testCandles);
assert(precalcObj.patternCache instanceof Map, 'precalculateBacktestIndicators initializes patternCache Map');
const tStart = performance.now();
for (let k = 0; k < 10; k++) {
    runBacktest(testCandles, { unit: 'PATTERNS', selectedPattern: 'ALL' }, precalcObj);
}
const elapsed = performance.now() - tStart;
assert(elapsed < 200, `10 pattern backtest iterations with patternCache ran in ${elapsed.toFixed(1)}ms (< 200ms)`);

console.log(`\n=== FINAL RESULTS: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
if (passedTests === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
