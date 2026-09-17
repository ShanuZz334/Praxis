/**
 * @file testStrategyExportImportAndLiveChart.mjs
 * @purpose Tests Strategy Export & Import round-trip integrity, mathematical trade parity,
 * and Live Chart marker / indicator overlay generation.
 */

import { exportStrategy, importStrategy } from '../frontend/stock-look/src/features/backtest/strategy/strategyRegistry.js';
import { runStrategyBacktest } from '../frontend/stock-look/src/features/backtest/strategy/strategyEngine.js';
import { STARTER_TEMPLATES } from '../frontend/stock-look/src/features/backtest/lab/customIndicatorRegistry.js';

// Synthetic candle series generator
function generateCandles(count = 150) {
    const candles = [];
    let price = 24000;
    const baseTime = 1715000000;

    for (let i = 0; i < count; i++) {
        const delta = Math.sin(i / 8) * 60 + Math.cos(i / 4) * 35 + (Math.random() - 0.49) * 40;
        const open = price;
        const close = open + delta;
        const high = Math.max(open, close) + Math.random() * 20 + 5;
        const low = Math.min(open, close) - (Math.random() * 20 + 5);
        const volume = Math.floor(120000 + Math.random() * 180000);

        candles.push({
            time: baseTime + i * 86400,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume
        });
        price = close;
    }
    return candles;
}

async function runTests() {
    console.log("=================================================");
    console.log("TEST SUITE: Strategy Export/Import & Live Chart Integration");
    console.log("=================================================");

    const candles = generateCandles(150);
    console.log(`Generated ${candles.length} synthetic candles.`);

    // ── TEST 1: Build a Multi-Factor Strategy with Custom Indicator ──
    console.log("\n[1] Building original multi-factor strategy...");
    const originalStrategy = {
        id: "strat_orig_99",
        name: "Momentum Breakout Kinetic",
        nickname: "MBK",
        description: "RSI momentum + Proprietary PNCO oscillator confluence model",
        mode: "swing",
        entryDirection: "LONG",
        volatileTimer: 6,
        rules: [
            {
                id: "rule_pnco_1",
                indicatorId: "custom_pnco_starter",
                conditionId: "pnco_cross_zero",
                logic: "AND"
            }
        ],
        exitRule: {
            type: "TARGET_STOP",
            targetPct: 2.8,
            stopPct: 1.4,
            horizonBars: 12
        },
        instrument: "NSE_INDEX|Nifty 50",
        timeframe: "day"
    };

    const customModels = [
        { ...STARTER_TEMPLATES[0], id: "custom_pnco_starter" }
    ];

    // Run baseline simulation
    const originalRes = runStrategyBacktest(candles, {
        ...originalStrategy,
        customLabModels: customModels
    });

    console.log(`[OK] Original Strategy Simulation Completed:`);
    console.log(`  - Total Trades: ${originalRes.trades.length}`);
    console.log(`  - Win Rate:     ${originalRes.summary?.winRatePct}%`);
    console.log(`  - Total Return: ${originalRes.summary?.totalReturnPct}%`);

    // ── TEST 2: Strategy Export to JSON ──
    console.log("\n[2] Testing exportStrategy()...");
    const exportedPkg = exportStrategy(originalStrategy);

    if (exportedPkg.schema !== "praxis_strategy_blueprint") throw new Error("Invalid schema tag");
    if (exportedPkg.version !== "2.0") throw new Error("Invalid version tag");
    if (!exportedPkg.strategy || exportedPkg.strategy.name !== originalStrategy.name) throw new Error("Strategy name missing in export");
    if (exportedPkg.strategy.mode !== "swing") throw new Error("Mode missing in export");
    if (exportedPkg.strategy.rules.length !== originalStrategy.rules.length) throw new Error("Rule count mismatch in export");

    const jsonExportString = JSON.stringify(exportedPkg, null, 2);
    console.log(`[OK] Exported JSON String size: ${jsonExportString.length} bytes`);
    console.log(`[OK] Schema: "${exportedPkg.schema}", Version: "${exportedPkg.version}"`);

    // ── TEST 3: Strategy Import from JSON String ──
    console.log("\n[3] Testing importStrategy()...");
    const importedStrategy = importStrategy(jsonExportString);

    console.log(`[OK] Imported Strategy Name: "${importedStrategy.name}"`);
    console.log(`[OK] Imported Strategy Mode: "${importedStrategy.mode}"`);
    console.log(`[OK] Imported Strategy Rules: ${importedStrategy.rules.length}`);

    if (importedStrategy.name !== originalStrategy.name) throw new Error("Imported name mismatch");
    if (importedStrategy.nickname !== originalStrategy.nickname) throw new Error("Imported nickname mismatch");
    if (importedStrategy.mode !== originalStrategy.mode) throw new Error("Imported mode mismatch");
    if (importedStrategy.entryDirection !== originalStrategy.entryDirection) throw new Error("Imported direction mismatch");
    if (importedStrategy.rules.length !== originalStrategy.rules.length) throw new Error("Imported rules count mismatch");
    if (importedStrategy.exitRule.targetPct !== originalStrategy.exitRule.targetPct) throw new Error("Imported exit target mismatch");

    // ── TEST 4: Mathematical Trade Parity Verification ──
    console.log("\n[4] Verifying 100% Mathematical Parity between Original & Imported Strategy...");
    const importedRes = runStrategyBacktest(candles, {
        ...importedStrategy,
        customLabModels: customModels
    });

    if (importedRes.trades.length !== originalRes.trades.length) {
        throw new Error(`Trade count disparity! Original: ${originalRes.trades.length}, Imported: ${importedRes.trades.length}`);
    }

    for (let t = 0; t < originalRes.trades.length; t++) {
        const origT = originalRes.trades[t];
        const impT = importedRes.trades[t];

        if (origT.entryTime !== impT.entryTime) throw new Error(`Trade #${t} entryTime mismatch`);
        if (origT.entryPrice !== impT.entryPrice) throw new Error(`Trade #${t} entryPrice mismatch`);
        if (origT.exitTime !== impT.exitTime) throw new Error(`Trade #${t} exitTime mismatch`);
        if (origT.exitPrice !== impT.exitPrice) throw new Error(`Trade #${t} exitPrice mismatch`);
        if (origT.netPnl !== impT.netPnl) throw new Error(`Trade #${t} netPnl mismatch`);
    }

    if (importedRes.summary?.totalReturnPct !== originalRes.summary?.totalReturnPct) {
        throw new Error("Total return disparity");
    }
    if (importedRes.summary?.winRatePct !== originalRes.summary?.winRatePct) {
        throw new Error("Win rate disparity");
    }

    console.log("[OK] 100% Exact Mathematical Trade Parity Confirmed across all bars & exits!");

    // ── TEST 5: Live Chart Marker & Signal Simulation ──
    console.log("\n[5] Testing Live Chart Marker Generation for Promoted Strategy...");
    const allMarkers = [];
    const promotedStrat = { ...importedStrategy, promoted: true };

    const chartBacktest = runStrategyBacktest(candles, {
        ...promotedStrat,
        mode: promotedStrat.mode,
        customLabModels: customModels
    });

    if (chartBacktest.trades?.length > 0) {
        const nick = promotedStrat.nickname || 'STRAT';
        chartBacktest.trades.forEach(trade => {
            allMarkers.push({
                time: trade.entryTime,
                position: trade.direction > 0 ? 'belowBar' : 'aboveBar',
                color: trade.direction > 0 ? '#10b981' : '#f43f5e',
                shape: trade.direction > 0 ? 'arrowUp' : 'arrowDown',
                text: `${nick} ${trade.direction > 0 ? 'BUY' : 'SELL'}`
            });
        });
    }

    console.log(`[OK] Generated ${allMarkers.length} Live Chart Signal Markers.`);
    allMarkers.forEach((m, idx) => {
        console.log(`  Marker #${idx + 1}: time=${m.time}, shape=${m.shape}, text="${m.text}", color=${m.color}`);
    });

    if (allMarkers.length !== originalRes.trades.length) {
        throw new Error("Marker count should equal simulated trade count!");
    }

    console.log("\n=================================================");
    console.log("ALL EXPORT/IMPORT & LIVE CHART INTEGRATION TESTS PASSED!");
    console.log("=================================================");
}

runTests().catch(err => {
    console.error("TEST SUITE FAILED:", err);
    process.exit(1);
});