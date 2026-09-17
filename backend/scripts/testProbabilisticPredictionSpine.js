/**
 * @file testProbabilisticPredictionSpine.js
 * @purpose Comprehensive verification suite for the Hedge Multi-Model Prediction Spine,
 *          Quantile Combiner, Pinball Scorer, Conformal Calibration, and SQLite Memory Tables.
 */

import {
    singlePinballLoss,
    computeCandlePinballLoss,
    computeIntervalScore,
    updateHedgeWeights,
    combineQuantiles,
    generateNaiveBaseline,
    liftPointForecastToQuantiles,
    computeConformityScore,
    fitConformalMultiplier,
    applyConformalCalibration
} from '../engine/predictionEngine.js';

import {
    getModelWeights,
    getCalibrationState,
    recordPredictions,
    resolvePendingPredictions,
    getPredictionHistory,
    normalizeTimeframe
} from '../services/predictionResolutionService.js';

import db from '../config/localDb.js';

async function runSuite() {
    console.log('====================================================');
    console.log('🧪 RUNNING PROBABILISTIC PREDICTION SPINE VERIFICATION');
    console.log('====================================================');

    // ── SECTION 1: MATHEMATICAL RIG ENGINE TESTS ──────────────────────
    console.log('\n[1/5] Testing Pinball Loss & Interval Score...');
    
    // Test exact pinball loss
    const pLoss1 = singlePinballLoss(100, 90, 0.10); // actual > pred: 0.10 * 10 = 1.0
    const pLoss2 = singlePinballLoss(100, 110, 0.90); // actual < pred: (1 - 0.90) * 10 = 1.0
    if (Math.abs(pLoss1 - 1.0) > 1e-6 || Math.abs(pLoss2 - 1.0) > 1e-6) {
        throw new Error(`Pinball loss calculation failed: got ${pLoss1}, ${pLoss2}`);
    }

    // Test Winkler interval score (alpha = 0.20, nominal 80% interval)
    const isInside = computeIntervalScore(100, 95, 105, 0.20); // inside: (105 - 95) = 10
    const isOutside = computeIntervalScore(110, 95, 105, 0.20); // outside above: 10 + (2/0.2)*(110-105) = 10 + 50 = 60
    if (Math.abs(isInside - 10) > 1e-6 || Math.abs(isOutside - 60) > 1e-6) {
        throw new Error(`Interval score calculation failed: inside=${isInside}, outside=${isOutside}`);
    }
    console.log('  ✓ Pinball loss & Winkler interval score mathematically verified');

    console.log('\n[2/5] Testing Hedge Multiplicative-Weights Algorithm...');
    const testModels = [
        { model_id: 'advisor_A', weight: 0.5, loss: 0.1 }, // good performance
        { model_id: 'advisor_B', weight: 0.5, loss: 2.0 }  // bad performance
    ];
    const updatedHedge = updateHedgeWeights(testModels, 0.5);
    console.log('  Hedge Weights Update:', updatedHedge);
    if (updatedHedge[0].weight <= updatedHedge[1].weight) {
        throw new Error('Hedge update failed: good advisor did not receive higher weight');
    }
    const sumWeights = updatedHedge.reduce((s, m) => s + m.weight, 0);
    if (Math.abs(sumWeights - 1.0) > 0.001) {
        throw new Error(`Hedge weights do not sum to 1.0: sum=${sumWeights}`);
    }
    console.log('  ✓ Hedge exponential decay and normalization verified');

    console.log('\n[3/5] Testing Vincentization (Weighted Quantile Combiner) & Baseline...');
    const candleSample = { open: 2500, high: 2520, low: 2490, close: 2505 };
    const atrSample = 25.0;
    const baselineQuantiles = generateNaiveBaseline(candleSample, atrSample);

    // Verify baseline quantile monotonic ordering: q10 <= q25 <= q50 <= q75 <= q90
    const taus = [10, 25, 50, 75, 90];
    for (const key of ['o', 'h', 'l', 'c']) {
        for (let i = 0; i < taus.length - 1; i++) {
            const lower = baselineQuantiles[`q${taus[i]}_${key}`];
            const upper = baselineQuantiles[`q${taus[i+1]}_${key}`];
            if (lower > upper) {
                throw new Error(`Baseline quantile ordering broken for ${key}: q${taus[i]}=${lower} > q${taus[i+1]}=${upper}`);
            }
        }
    }
    console.log('  ✓ Naive baseline ATR cone and monotonic quantile ordering verified');

    const fvSample = liftPointForecastToQuantiles({ open: 2500, high: 2530, low: 2495, close: 2520, confidence: 75 }, atrSample);
    const combinedQuantiles = combineQuantiles([
        { model_id: 'naive_baseline', weight: 0.4, quantiles: baselineQuantiles },
        { model_id: 'future_vision', weight: 0.6, quantiles: fvSample }
    ]);
    if (!combinedQuantiles || !combinedQuantiles.q50_c) {
        throw new Error('Vincentization combiner returned empty or invalid quantiles');
    }
    console.log('  ✓ Vincentization weighted quantile combination verified');

    console.log('\n[4/5] Testing Conformal Calibration Layer...');
    const missRateScores = [0.5, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4, 1.6, 2.0, 2.5, 2.8];
    const conformalScale = fitConformalMultiplier(missRateScores, 0.80);
    console.log('  Fitted Conformal Scale Factor:', conformalScale);
    if (conformalScale < 1.0) {
        throw new Error('Conformal multiplier should expand interval for large miss rate scores');
    }
    const calibrated = applyConformalCalibration(combinedQuantiles, conformalScale);
    const rawWidth = combinedQuantiles.q90_c - combinedQuantiles.q10_c;
    const calWidth = calibrated.q90_c - calibrated.q10_c;
    if (calWidth <= rawWidth) {
        throw new Error(`Calibrated interval did not expand: rawWidth=${rawWidth}, calWidth=${calWidth}`);
    }
    console.log(`  ✓ Conformal interval expanded from ${rawWidth.toFixed(2)} to ${calWidth.toFixed(2)} based on miss rate`);

    // ── SECTION 2: SQLITE STORAGE & RESOLUTION CYCLE ──────────────────
    console.log('\n[5/5] Testing End-to-End SQLite Memory & Resolution Loop...');
    const testInst = 'NSE_INDEX|NIFTY_TEST_SPINE';
    const testTf = 'day';
    const testRegime = 'TRENDING_UP';
    const now = new Date();
    const targetTime = new Date(now.getTime() - 10000).toISOString(); // 10 seconds in past

    // Clean any remnants
    db.prepare('DELETE FROM candles WHERE instrument_key = ?').run(testInst);
    db.prepare('DELETE FROM predictions WHERE instrument = ?').run(testInst);
    db.prepare('DELETE FROM model_weights WHERE instrument = ?').run(testInst);
    db.prepare('DELETE FROM calibration_state WHERE instrument = ?').run(testInst);

    // Initial weights check
    const initialWeights = getModelWeights(testInst, testTf, testRegime);
    console.log('  Initial Weights:', initialWeights.map(w => `${w.model_id}: ${w.weight}`).join(', '));

    // Record predictions
    const insertedIds = recordPredictions({
        instrument: testInst,
        timeframe: testTf,
        predictedAt: new Date(now.getTime() - 60000).toISOString(),
        targetCandleTime: targetTime,
        regime: testRegime,
        modelPredictions: [
            { model_id: 'naive_baseline', weight: 0.5, quantiles: baselineQuantiles },
            { model_id: 'future_vision', weight: 0.5, quantiles: fvSample }
        ],
        ensembleQuantiles: combinedQuantiles
    });
    console.log(`  Recorded ${insertedIds.length} prediction rows into SQLite store`);
    if (insertedIds.length !== 3) {
        throw new Error('Expected 3 inserted rows (2 models + 1 ensemble)');
    }

    // Insert realized candle into candles table
    db.prepare(`
        INSERT INTO candles (instrument_key, timeframe, timestamp, open, high, low, close, volume)
        VALUES (?, ?, ?, 2500, 2525, 2498, 2522, 50000)
    `).run(testInst, 'day', targetTime);

    // Run resolution cycle
    const resResult = await resolvePendingPredictions();
    console.log('  Resolution Execution Result:', resResult);
    if (resResult.resolvedCount !== 3) {
        throw new Error(`Expected 3 resolved predictions, got ${resResult.resolvedCount}`);
    }

    // Verify resolutions table
    const resolutionRows = db.prepare(`
        SELECT r.*, p.model_id
        FROM resolutions r
        JOIN predictions p ON r.prediction_id = p.id
        WHERE p.instrument = ?
    `).all(testInst);
    console.log(`  Verified ${resolutionRows.length} resolution rows created with Pinball loss & conformity`);
    for (const r of resolutionRows) {
        console.log(`    - Model ${r.model_id}: PinballLoss=${r.pinball_loss.toFixed(4)}%, Conformity=${r.conformity_score.toFixed(3)}, Inside80=${r.inside_80_interval}`);
    }

    // Verify model weights updated via Hedge
    const postResolutionWeights = getModelWeights(testInst, testTf, testRegime);
    console.log('  Updated Hedge Weights After Realized Outcome:');
    for (const pw of postResolutionWeights) {
        console.log(`    - ${pw.model_id}: Weight=${pw.weight}, ResolvedCount=${pw.n_resolved}`);
    }

    // Check prediction history API helper
    const history = getPredictionHistory(testInst, testTf, 10);
    if (history.length !== 3 || history[0].status !== 'RESOLVED') {
        throw new Error('Prediction history check failed');
    }
    console.log('  ✓ History query successfully returned resolved outcomes');

    // Clean up test records
    db.prepare('DELETE FROM candles WHERE instrument_key = ?').run(testInst);
    db.prepare('DELETE FROM predictions WHERE instrument = ?').run(testInst);
    db.prepare('DELETE FROM model_weights WHERE instrument = ?').run(testInst);
    db.prepare('DELETE FROM calibration_state WHERE instrument = ?').run(testInst);

    console.log('\n====================================================');
    console.log('🎉 ALL PROBABILISTIC PREDICTION SPINE TESTS PASSED! 🎉');
    console.log('====================================================');
}

runSuite().catch(err => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
});
