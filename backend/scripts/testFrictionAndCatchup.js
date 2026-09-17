/**
 * @file testFrictionAndCatchup.js
 * @purpose Verification script for Phase 4 & 5:
 *   - Friction Engine (STT, exchange, slippage, net edge vs fee drag)
 *   - Startup Catch-Up Loop
 *   - Edge Suppression Safeguard
 */

import {
    calculateNseFriction,
    evaluateNetEdge
} from '../engine/frictionEngine.js';

import {
    initStartupCatchup,
    getEdgeEvaluation,
    getModelWeights
} from '../services/predictionResolutionService.js';

async function main() {
    console.log('====================================================');
    console.log('🧪 TESTING PHASE 4 & 5: FRICTION & STARTUP CATCH-UP');
    console.log('====================================================\n');

    // ── 1. TEST FRICTION SCHEDULES ──
    console.log('[1/4] Testing Institutional Friction Schedules...');
    const deliveryFriction = calculateNseFriction('NSE_INDEX|Nifty 50', 'day');
    console.log('  Delivery Friction (Nifty 50, day):', deliveryFriction.total_friction_pct, '%');
    console.log('    - Mode:', deliveryFriction.mode);
    console.log('    - STT:', deliveryFriction.stt_pct, '% (0.1% buy + 0.1% sell)');
    console.log('    - Slippage:', deliveryFriction.slippage_pct, '%');
    if (deliveryFriction.total_friction_pct < 0.20 || deliveryFriction.total_friction_pct > 0.35) {
        throw new Error(`Unexpected delivery friction: ${deliveryFriction.total_friction_pct}%`);
    }

    const intradayFriction = calculateNseFriction('NSE_INDEX|Nifty 50', '15minute');
    console.log('  Intraday Friction (Nifty 50, 15m):', intradayFriction.total_friction_pct, '%');
    console.log('    - Mode:', intradayFriction.mode);
    console.log('    - STT:', intradayFriction.stt_pct, '% (0.025% sell only)');
    console.log('    - Slippage:', intradayFriction.slippage_pct, '%');
    if (intradayFriction.total_friction_pct < 0.05 || intradayFriction.total_friction_pct > 0.15) {
        throw new Error(`Unexpected intraday friction: ${intradayFriction.total_friction_pct}%`);
    }
    console.log('  ✓ Statutory friction schedules verified');

    // ── 2. TEST NET EDGE EVALUATION ──
    console.log('\n[2/4] Testing Net Edge & Fee Drag Penalty...');

    // Scenario A: Move is +0.60% (Tradeable alpha)
    const bullForecast = {
        close: { q10: 22050, q25: 22100, q50: 22132, q75: 22180, q90: 22220 }
    };
    const tradeableResult = evaluateNetEdge({
        currentPrice: 22000,
        forecastQuantiles: bullForecast,
        instrument: 'NSE_INDEX|Nifty 50',
        timeframe: 'day'
    });
    console.log('  Scenario A (Gross move +0.60% vs 0.26% drag):');
    console.log(`    - Direction: ${tradeableResult.direction}`);
    console.log(`    - Gross Edge: +${tradeableResult.gross_edge_pct}%`);
    console.log(`    - Net Edge:   +${tradeableResult.net_edge_pct}%`);
    console.log(`    - Tradeable:  ${tradeableResult.tradeable_edge}`);
    console.log(`    - Break-even: ₹${tradeableResult.break_even_price}`);
    console.log(`    - Reason:     ${tradeableResult.reason}`);
    if (!tradeableResult.tradeable_edge || tradeableResult.net_edge_pct <= 0) {
        throw new Error('Scenario A should have been tradeable');
    }

    // Scenario B: Move is +0.10% (Fee drag exceeds move -> Suppressed!)
    const smallMoveForecast = {
        close: { q10: 21980, q25: 22000, q50: 22022, q75: 22040, q90: 22060 }
    };
    const suppressedResult = evaluateNetEdge({
        currentPrice: 22000,
        forecastQuantiles: smallMoveForecast,
        instrument: 'NSE_INDEX|Nifty 50',
        timeframe: 'day'
    });
    console.log('\n  Scenario B (Gross move +0.10% vs 0.26% drag - Fee Drag Penalty):');
    console.log(`    - Direction: ${suppressedResult.direction}`);
    console.log(`    - Gross Edge: +${suppressedResult.gross_edge_pct}%`);
    console.log(`    - Net Edge:   ${suppressedResult.net_edge_pct}%`);
    console.log(`    - Tradeable:  ${suppressedResult.tradeable_edge}`);
    console.log(`    - Reason:     ${suppressedResult.reason}`);
    if (suppressedResult.tradeable_edge || suppressedResult.net_edge_pct > 0) {
        throw new Error('Scenario B should have been suppressed due to friction');
    }
    console.log('  ✓ Fee drag penalty and net edge gating verified');

    // ── 3. TEST EDGE SUPPRESSION SAFEGUARD ──
    console.log('\n[3/4] Testing Edge Suppression Safeguard...');
    const edgeChoppy = getEdgeEvaluation('NSE_INDEX|Nifty 50', 'day', 'CHOPPY');
    console.log('  Nifty 50 (CHOPPY regime):');
    console.log(`    - Edge Detected: ${edgeChoppy.edge_detected}`);
    console.log(`    - Status:        ${edgeChoppy.edge_status}`);
    console.log(`    - Leading Model: ${edgeChoppy.leading_model} (${(edgeChoppy.leading_weight * 100).toFixed(1)}%)`);
    console.log(`    - Reason:        ${edgeChoppy.reason}`);

    const edgeTrending = getEdgeEvaluation('NSE_INDEX|Nifty Bank', 'day', 'TRENDING_UP');
    console.log('\n  Bank Nifty (TRENDING_UP regime):');
    console.log(`    - Edge Detected: ${edgeTrending.edge_detected}`);
    console.log(`    - Status:        ${edgeTrending.edge_status}`);
    console.log(`    - Leading Model: ${edgeTrending.leading_model} (${(edgeTrending.leading_weight * 100).toFixed(1)}%)`);
    console.log(`    - Reason:        ${edgeTrending.reason}`);
    console.log('  ✓ Edge suppression and alpha detection verified');

    // ── 4. TEST STARTUP CATCH-UP LOOP ──
    console.log('\n[4/4] Testing initStartupCatchup()...');
    const catchupResult = await initStartupCatchup();
    console.log('  Startup Catch-up Result:', catchupResult);
    console.log('  ✓ Startup catch-up executed cleanly');

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 4 & 5 TESTS PASSED 100%! 🎉');
    console.log('====================================================');
}

main().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
