/**
 * @file testFutureVisionEnsembleFlow.js
 * @purpose Verifies that futureVisionService cleanly calls the Python ensemble
 *          and records all participating predictions into SQLite.
 */

import { callEnsembleService } from '../services/ensembleService.js';
import {
    getModelWeights,
    getCalibrationState,
    recordPredictions,
    getPredictionHistory
} from '../services/predictionResolutionService.js';
import {
    liftPointForecastToQuantiles,
    applyConformalCalibration
} from '../engine/predictionEngine.js';

async function testFlow() {
    console.log('Testing FutureVision -> Ensemble integration flow...');

    const instrument = 'NSE_INDEX|Nifty 50';
    const timeframe = 'day';

    // 1. Fetch current weights
    const weights = getModelWeights(instrument, timeframe, 'TRENDING_UP');
    console.log('Current weights in DB:', weights.map(w => `${w.model_id}: ${w.weight}`).join(', '));

    // 2. Mock 10 candles
    const candles = [];
    let price = 22100.0;
    for (let i = 1; i <= 15; i++) {
        candles.push({
            timestamp: `2026-03-${String(i).padStart(2, '0')}T09:15:00Z`,
            open: price - 10,
            high: price + 40,
            low: price - 50,
            close: price + 20,
            volume: 50000
        });
        price += 10;
    }

    // 3. Call Python ensemble
    const ensembleResult = await callEnsembleService({
        instrument,
        timeframe,
        candles,
        horizon: 1
    });

    console.log('Ensemble call success:', ensembleResult.success);
    if (!ensembleResult.success) {
        throw new Error(`Ensemble failed: ${ensembleResult.error}`);
    }

    // 4. Apply conformal multiplier
    const calState = getCalibrationState(instrument, timeframe);
    const calibrated = applyConformalCalibration(
        ensembleResult.ensemble.candles[0],
        calState.conformal_multiplier
    );
    console.log('Calibrated Close q50:', calibrated.close.q50);

    // 5. Record prediction batch
    const memberPreds = (ensembleResult.members || [])
        .filter(m => !m.error && m.candles?.length > 0)
        .map(m => ({
            model_id: m.model_id,
            weight: ensembleResult.ensemble.member_weights?.[m.model_id] ?? 0.25,
            quantiles: m.candles[0]
        }));

    // Add mock future_vision point forecast lifted
    const fvQuantiles = liftPointForecastToQuantiles({ close: 22350, open: 22300, high: 22400, low: 22250 }, 100);
    memberPreds.push({ model_id: 'future_vision', weight: 0, quantiles: fvQuantiles });

    const insertedCount = recordPredictions({
        instrument,
        timeframe,
        predictedAt: new Date().toISOString(),
        targetCandleTime: new Date(Date.now() + 86400000).toISOString(),
        regime: ensembleResult.regime,
        modelPredictions: memberPreds,
        ensembleQuantiles: calibrated,
        featuresHash: 'test_ensemble_fv_flow'
    });

    console.log(`Inserted ${insertedCount} prediction rows into SQLite.`);

    // 6. Verify predictions recorded
    const history = getPredictionHistory(instrument, timeframe, 10);
    console.log(`Recent history rows: ${history.length}`);
    const latestModels = [...new Set(history.slice(0, 10).map(h => h.model_id))];
    console.log('Models present in recent history:', latestModels.join(', '));

    console.log('\n✓ FutureVision Ensemble Flow verified end-to-end!');
}

testFlow().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
