/**
 * @file testEnsembleIntegration.js
 * @purpose Verification script for Node.js -> Python Ensemble microservice on port 7074
 */

import { getEnsembleReadiness, getEnsembleMembers, callEnsembleService } from '../services/ensembleService.js';

async function main() {
    console.log('====================================================');
    console.log('🧪 TESTING NODE.JS -> PYTHON ENSEMBLE INTEGRATION');
    console.log('====================================================');

    console.log('\n[1/3] Testing getEnsembleReadiness()...');
    const readiness = await getEnsembleReadiness();
    console.log('  Online:', readiness.online);
    console.log('  Status:', readiness.status);
    console.log('  Members:');
    for (const m of readiness.members) {
        console.log(`    - ${m.model_id}: ready=${m.is_ready}, default_weight=${m.weight}`);
    }
    if (!readiness.online) {
        throw new Error('Ensemble service is not reachable on port 7074');
    }

    console.log('\n[2/3] Testing getEnsembleMembers()...');
    const members = await getEnsembleMembers();
    console.log(`  Received ${members.length} registered members`);

    console.log('\n[3/3] Testing callEnsembleService() full forecast round-trip...');
    // Create 30 synthetic candles
    const candles = [];
    let price = 22000.0;
    for (let i = 1; i <= 30; i++) {
        candles.push({
            timestamp: `2026-03-${String(i).padStart(2, '0')}T09:15:00Z`,
            open: price - 20,
            high: price + 50,
            low: price - 60,
            close: price + 10,
            volume: 100000
        });
        price += 15;
    }

    const forecast = await callEnsembleService({
        instrument: 'NSE_INDEX|Nifty 50',
        timeframe: 'day',
        candles,
        horizon: 3
    });

    console.log('  Success:', forecast.success);
    console.log('  Regime:', forecast.regime);
    console.log('  Total latency:', forecast.total_ms, 'ms');
    console.log('  Combined Ensemble n_members:', forecast.ensemble?.n_members);
    console.log('  Member weights used:', forecast.ensemble?.member_weights);
    console.log('  Combined Candle 1 Close Quantiles:');
    console.log('   ', forecast.ensemble?.candles[0]?.close);

    if (!forecast.success || !forecast.ensemble) {
        throw new Error(`Ensemble forecast failed: ${forecast.error}`);
    }

    console.log('\n====================================================');
    console.log('🎉 NODE.JS ENSEMBLE INTEGRATION PASSED 100%! 🎉');
    console.log('====================================================');
}

main().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
