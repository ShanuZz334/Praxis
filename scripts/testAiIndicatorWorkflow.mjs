/**
 * @file testAiIndicatorWorkflow.mjs
 * @purpose End-to-end verification of generating an indicator with the Praxis AI Prompt Template,
 * parsing it with extractIndicatorDefinition, compiling in VM sandbox across 3 modes,
 * and backtesting with baked confluence rules.
 */

import vm from 'node:vm';
import { extractIndicatorDefinition } from '../frontend/stock-look/src/features/backtest/lab/customIndicatorRegistry.js';
import { runStrategyBacktest } from '../frontend/stock-look/src/features/backtest/strategy/strategyEngine.js';

// 1. Generate 120 synthetic historical bars with alternating regimes
function generateCandles(count = 120) {
    const candles = [];
    let price = 22000;
    const baseTime = 1715000000;

    for (let i = 0; i < count; i++) {
        const trend = Math.sin(i / 10) * 80 + (Math.random() - 0.48) * 45;
        const open = price;
        const close = open + trend;
        const high = Math.max(open, close) + Math.random() * 25 + 5;
        const low = Math.min(open, close) - (Math.random() * 25 + 5);
        const volume = Math.floor(100000 + Math.random() * 150000);

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

// 2. Simulated LLM Output generated strictly according to getAiPromptTemplate()
const AI_GENERATED_INDICATOR_CODE = `
/**
 * PRAXIS DYNAMIC INDICATOR SPECIFICATION v2
 * @name Fractal Adaptive Momentum Oscillator
 * @nickname FAMO
 * @description Volatility-normalized price momentum oscillator measuring cycle velocity.
 */
function indicator() {
    return {
        name: "Fractal Adaptive Momentum Oscillator",
        nickname: "FAMO",
        description: "Volatility-normalized price momentum oscillator measuring cycle velocity.",

        modes: {
            intraday: {
                period: 7,
                threshold: 12,
                exitTargetPct: 0.8,
                exitStopPct: 0.4,
                horizonBars: 6
            },
            swing: {
                period: 14,
                threshold: 22,
                exitTargetPct: 2.4,
                exitStopPct: 1.2,
                horizonBars: 14
            },
            positional: {
                period: 28,
                threshold: 32,
                exitTargetPct: 5.5,
                exitStopPct: 2.2,
                horizonBars: 26
            }
        },

        rules: [
            {
                id: "famo_threshold_cross",
                label: "Threshold Crossover Momentum",
                description: "Fires when oscillator crosses threshold levels",
                checkBuy: (curr, prev, modeParams) => prev <= modeParams.threshold && curr > modeParams.threshold,
                checkSell: (curr, prev, modeParams) => prev >= -modeParams.threshold && curr < -modeParams.threshold
            },
            {
                id: "famo_zero_cross",
                label: "Zero-Line Regime Flip",
                description: "Fires when oscillator crosses above or below 0",
                checkBuy: (curr, prev) => prev <= 0 && curr > 0,
                checkSell: (curr, prev) => prev >= 0 && curr < 0
            }
        ],

        calculate: function(candles, modeParams = {}) {
            if (!candles || candles.length < 5) return [];
            const period = modeParams.period || 14;

            return candles.map((c, i) => {
                if (i < period) return { time: c.time, value: 0 };
                const prev = candles[i - period];
                const rawPct = ((c.close - prev.close) / prev.close) * 100;
                
                // ATR proxy for volatility normalization
                let trSum = 0;
                for (let k = i - period + 1; k <= i; k++) {
                    const high = candles[k].high;
                    const low = candles[k].low;
                    const prevClose = candles[k - 1].close;
                    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
                    trSum += tr;
                }
                const atr = trSum / period;
                const volFactor = (atr / c.close) * 100;
                const normalizedVal = volFactor > 0 ? (rawPct / volFactor) * 10 : rawPct;

                return {
                    time: c.time,
                    value: parseFloat(normalizedVal.toFixed(2))
                };
            });
        }
    };
}
`;

async function runTests() {
    console.log("=================================================");
    console.log("TEST SUITE: AI Custom Indicator Generation & Parsing");
    console.log("=================================================");

    const candles = generateCandles(120);
    console.log(`Generated ${candles.length} synthetic candles.`);

    // ── TEST 1: Browser-Safe Metadata Extraction ──
    console.log("\n[1] Testing extractIndicatorDefinition()...");
    const extracted = extractIndicatorDefinition(AI_GENERATED_INDICATOR_CODE, 'swing');

    if (!extracted || !extracted.isV2) {
        throw new Error("Failed: extractIndicatorDefinition did not detect v2 specification!");
    }
    console.log(`[OK] Detected v2: ${extracted.isV2}`);
    console.log(`[OK] Name: "${extracted.name}"`);
    console.log(`[OK] Nickname: "${extracted.nickname}"`);
    console.log(`[OK] Modes available:`, Object.keys(extracted.modes || {}));
    console.log(`[OK] Baked rules count: ${extracted.rules?.length}`);

    if (extracted.name !== "Fractal Adaptive Momentum Oscillator") throw new Error("Name mismatch");
    if (extracted.nickname !== "FAMO") throw new Error("Nickname mismatch");
    if (!extracted.modes?.intraday || !extracted.modes?.swing || !extracted.modes?.positional) {
        throw new Error("Missing 3-mode profile configurations");
    }
    if (extracted.rules?.length !== 2) throw new Error("Expected 2 baked rules");

    // ── TEST 2: Node.js VM Sandbox Execution across all 3 Modes ──
    console.log("\n[2] Testing Backend VM Sandbox across all 3 modes...");

    function executeInSandbox(code, candles, mode) {
        const safeContext = {
            candles,
            Math: Math,
            Array, Number, String, Boolean, Date, parseInt, parseFloat, isNaN, isFinite
        };
        const vmContext = vm.createContext(safeContext);
        const runnableCode = `
${code}
(function() {
    const inst = indicator(candles);
    const activeMode = "${mode}";
    const modeParams = (inst.modes && inst.modes[activeMode]) ? inst.modes[activeMode] : (inst.modes?.swing || {});
    return inst.calculate(candles, modeParams);
})()`;
        const script = new vm.Script(runnableCode);
        return script.runInContext(vmContext, { timeout: 2000 });
    }

    const intradaySeries = executeInSandbox(AI_GENERATED_INDICATOR_CODE, candles, 'intraday');
    const swingSeries = executeInSandbox(AI_GENERATED_INDICATOR_CODE, candles, 'swing');
    const positionalSeries = executeInSandbox(AI_GENERATED_INDICATOR_CODE, candles, 'positional');

    console.log(`[OK] Intraday series output bars: ${intradaySeries.length}`);
    console.log(`[OK] Swing series output bars: ${swingSeries.length}`);
    console.log(`[OK] Positional series output bars: ${positionalSeries.length}`);

    if (intradaySeries.length !== candles.length) throw new Error("Intraday length mismatch");
    if (swingSeries.length !== candles.length) throw new Error("Swing length mismatch");
    if (positionalSeries.length !== candles.length) throw new Error("Positional length mismatch");

    const barIdx = 45;
    console.log(`Bar #${barIdx} values:`);
    console.log(`  - Intraday (period 7):   ${intradaySeries[barIdx].value}`);
    console.log(`  - Swing (period 14):     ${swingSeries[barIdx].value}`);
    console.log(`  - Positional (period 28): ${positionalSeries[barIdx].value}`);

    if (intradaySeries[barIdx].value === swingSeries[barIdx].value && swingSeries[barIdx].value === positionalSeries[barIdx].value) {
        throw new Error("Values across modes should be mathematically distinct!");
    }
    console.log("[OK] Mathematical differentiation across 3 modes confirmed!");

    // ── TEST 3: Multi-Factor Strategy Simulation with Baked Rules ──
    console.log("\n[3] Testing Backtest Simulation with Baked Rules across modes...");

    const customModel = {
        id: 'custom_famo_01',
        name: extracted.name,
        nickname: extracted.nickname,
        code: AI_GENERATED_INDICATOR_CODE,
        modes: extracted.modes,
        rules: extracted.rules
    };

    const strategyConfig = {
        name: "FAMO Adaptive Strategy",
        nickname: "FAS",
        entryDirection: "LONG",
        exitRule: { type: "TARGET_STOP", targetPct: 2.5, stopPct: 1.25, horizonBars: 14 },
        rules: [
            {
                id: "rule_famo_1",
                indicatorId: "custom_famo_01",
                conditionId: "famo_threshold_cross",
                logic: "AND"
            }
        ],
        customLabModels: [customModel]
    };

    const resIntraday = runStrategyBacktest(candles, { ...strategyConfig, mode: 'intraday' });
    const resSwing = runStrategyBacktest(candles, { ...strategyConfig, mode: 'swing' });
    const resPositional = runStrategyBacktest(candles, { ...strategyConfig, mode: 'positional' });

    console.log(`[OK] Intraday Mode:   ${resIntraday.trades?.length || 0} trades, Win Rate: ${resIntraday.summary?.winRatePct || 0}%`);
    console.log(`[OK] Swing Mode:      ${resSwing.trades?.length || 0} trades, Win Rate: ${resSwing.summary?.winRatePct || 0}%`);
    console.log(`[OK] Positional Mode: ${resPositional.trades?.length || 0} trades, Win Rate: ${resPositional.summary?.winRatePct || 0}%`);

    console.log("\n=================================================");
    console.log("ALL AI CUSTOM INDICATOR TESTS PASSED CLEANLY!");
    console.log("=================================================");
}

runTests().catch(err => {
    console.error("TEST SUITE FAILED:", err);
    process.exit(1);
});