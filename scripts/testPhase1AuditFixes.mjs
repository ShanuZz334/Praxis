/**
 * @file testPhase1AuditFixes.mjs
 * Test suite to verify all Phase 1 mathematical and logical fixes.
 */

import { evaluateStyleSuitability, diagnoseMathematicalLeaks, analyzeAnnualConsistency, generatePrescriptiveActions } from '../frontend/stock-look/src/features/backtest/engine/backtestWalkthroughEngine.js';
import { SIGNAL_DEFINITIONS } from '../frontend/stock-look/src/features/backtest/strategy/strategySignalDefinitions.js';
import { getCustomIndicators, hydrateIndicator, STARTER_TEMPLATES } from '../frontend/stock-look/src/features/backtest/lab/customIndicatorRegistry.js';
import { evaluateCustomLabSeries } from '../frontend/stock-look/src/features/backtest/strategy/strategyEngine.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
    totalTests++;
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        passedTests++;
    } else {
        console.error(`❌ FAIL: ${testName}`);
    }
}

console.log('=== RUNNING PHASE 1 AUDIT VERIFICATION ===\n');

// 1. backtestWalkthroughEngine property mapping
const mockSummary = {
    profitFactor: 1.8,
    winRate: 62.5,
    netReturnPct: 34.2,
    expectancy: 0.85,
    maxDrawdownPct: 14.5,
    totalTrades: 45,
    avgBarsHeld: 8, // Previously avgTradeDurationCandles
    yearlyBreakdown: [ // Previously annualMatrix
        { year: 2023, returnPct: 18.5, trades: 20, wins: 13 },
        { year: 2024, returnPct: 15.7, trades: 25, wins: 15 }
    ]
};

const mockConfig = {
    timeframe: 'day',
    mode: 'swing',
    costModel: 'INDIAN_REALISTIC',
    exitRule: {
        type: 'TARGET_STOP',
        horizonBars: 14,
        enableHorizonTimeout: false,
    }
};

const style = evaluateStyleSuitability(mockSummary, mockConfig);
assert(style.detectedStyle === 'Medium Swing (Multi-Week)' || style.detectedStyle.includes('Swing'), 'evaluateStyleSuitability correctly reads avgBarsHeld instead of 0');
assert(style.viabilityStatus === 'HIGHLY_SUITABLE', 'evaluateStyleSuitability evaluates high viability');

const annual = analyzeAnnualConsistency(mockSummary);
assert(annual !== null && annual.totalYears === 2, 'analyzeAnnualConsistency correctly reads yearlyBreakdown instead of null');
assert(annual.winRateAnnualPct === 100, 'analyzeAnnualConsistency calculates 100% positive years');

const leaks = diagnoseMathematicalLeaks(mockSummary, mockConfig, [
    { exitReason: 'TARGET', outcome: 'WIN' },
    { exitReason: 'STOP', outcome: 'LOSS' }
]);
const frictionLeak = leaks.find(l => l.id === 'FRICTION_DRAG');
assert(frictionLeak !== undefined, 'diagnoseMathematicalLeaks detects friction drag from costModel INDIAN_REALISTIC');

// 2. VWAP Session-Anchored & Rolling Calculation
const vwapDef = SIGNAL_DEFINITIONS.vwap;
assert(typeof vwapDef?.compute === 'function', 'VWAP definition exists and has compute function');

// Test Intraday (session reset)
const intradayCandles = [
    // Day 1
    { time: '2026-09-10T09:15:00Z', open: 100, high: 105, low: 99, close: 102, volume: 1000 },
    { time: '2026-09-10T09:30:00Z', open: 102, high: 106, low: 101, close: 104, volume: 2000 },
    // Day 2 (should reset)
    { time: '2026-09-11T09:15:00Z', open: 120, high: 125, low: 119, close: 122, volume: 500 },
];
const intradayVwap = vwapDef.compute(intradayCandles);
assert(intradayVwap.length === 3, 'VWAP intraday computed array length 3');
// Day 2 bar 1 typical is (120+125+122)/3 = 122.33; volume 500. Day 2 bar 1 VWAP should be ~122.33, NOT dragged down by Day 1 100-104 prices!
assert(intradayVwap[2] > 120, `VWAP successfully reset on session boundary (got ${intradayVwap[2]}, expected > 120)`);

// 3. Custom Indicator Hydration after JSON.stringify
const rawIndicator = STARTER_TEMPLATES[0]; // PNCO
const serialized = JSON.stringify(rawIndicator);
const deserialized = JSON.parse(serialized);

assert(typeof deserialized.rules[0].checkBuy === 'undefined', 'Confirm JSON.stringify strips functions from rules');
const hydrated = hydrateIndicator(deserialized);
assert(typeof hydrated.rules[0].checkBuy === 'function', 'hydrateIndicator successfully restores checkBuy function');
assert(typeof hydrated.calculate === 'function', 'hydrateIndicator successfully restores calculate function');

// 4. AVSS Template Divergence
const avssTmpl = STARTER_TEMPLATES.find(t => t.nickname === 'AVSS');
const avssRule = avssTmpl.rules.find(r => r.id === 'avss_volume_spike');
assert(avssRule !== undefined, 'AVSS volume spike rule found');

// Bullish candle with spike
const bullCandle = { close: 105 };
const prevCandle = { close: 100 };
const buyResult = avssRule.checkBuy(3.0, 1.0, { threshold: 2.2 }, bullCandle, prevCandle);
const sellResult = avssRule.checkSell(3.0, 1.0, { threshold: 2.2 }, bullCandle, prevCandle);

assert(buyResult === true, 'AVSS spike on bullish bar triggers checkBuy = true');
assert(sellResult === false, 'AVSS spike on bullish bar does NOT trigger checkSell (sellResult = false)');

// 5. Caching performance in evaluateCustomLabSeries
const evalCandles = Array.from({ length: 50 }, (_, i) => ({
    time: i * 60,
    open: 100 + i,
    high: 102 + i,
    low: 99 + i,
    close: 101 + i,
    volume: 1000
}));

const t0 = performance.now();
for (let k = 0; k < 200; k++) {
    evaluateCustomLabSeries(evalCandles, rawIndicator, 'swing');
}
const elapsedMs = performance.now() - t0;
assert(elapsedMs < 50, `200 evaluations with compiled function cache took ${elapsedMs.toFixed(1)}ms (< 50ms)`);

console.log(`\n=== RESULTS: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
if (passedTests === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
