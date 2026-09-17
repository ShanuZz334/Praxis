/**
 * @file ingestTrainingSamples.js
 * @purpose Generates 512-candle context -> 1-candle target training samples from historical candles
 *          and persists them into the `training_samples` SQLite table.
 *          Provides immediate high-quality NSE data to unlock fine-tuning readiness for Kronos and Chronos-Bolt.
 */

import db from '../config/localDb.js';

function computeWindowRegime(candles) {
    if (candles.length < 50) return 'CHOPPY';
    const recent = candles.slice(-50);
    const first = recent[0].close;
    const last = recent[recent.length - 1].close;
    const pctChange = (last - first) / first;

    // Check volatility via ATR-like high/low spread
    let totalRange = 0;
    for (const c of recent) {
        totalRange += (c.high - c.low) / (c.close || 1);
    }
    const avgRangePct = totalRange / recent.length;

    if (avgRangePct > 0.025) {
        return 'VOLATILE_EXPANSION';
    }
    if (pctChange > 0.05) {
        return 'TRENDING_UP';
    }
    if (pctChange < -0.05) {
        return 'TRENDING_DOWN';
    }
    return 'CHOPPY';
}

export function ingestSamplesForInstrument(instrumentKey, timeframe = 'day', maxSamples = 600) {
    console.log(`\n📦 Processing training samples for [${instrumentKey}] on timeframe [${timeframe}]...`);

    const candlesStmt = db.prepare(`
        SELECT timestamp, open, high, low, close, volume
        FROM candles
        WHERE instrument_key = ? AND timeframe = ?
        ORDER BY timestamp ASC
    `);

    const candles = candlesStmt.all(instrumentKey, timeframe);
    if (candles.length <= 512) {
        console.log(`⚠️ Not enough candles (${candles.length} <= 512) for 512-window context.`);
        return { count: 0, instrument: instrumentKey, timeframe };
    }

    console.log(`Loaded ${candles.length} candles. Generating 512-context sliding windows...`);

    const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO training_samples (
            instrument, timeframe, candle_time, context_window,
            target_o, target_h, target_l, target_c, regime, feature_version, created_at, used_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, '[]')
    `);

    let insertedCount = 0;
    const CONTEXT_LEN = 512;
    // Stride: step 5 for 15m, step 2 for daily to ensure diversity while retaining adequate sample count
    const step = timeframe === '15minute' ? 5 : 2;

    // Collect candidate windows starting from CONTEXT_LEN up to candles.length - 1
    const totalPossible = candles.length - CONTEXT_LEN;
    const startIndex = Math.max(0, totalPossible - (maxSamples * step));

    const insertBatch = db.transaction(() => {
        for (let i = startIndex; i < totalPossible; i += step) {
            const target = candles[i + CONTEXT_LEN];
            if (!target || target.open == null || target.high == null || target.low == null || target.close == null) {
                continue;
            }

            const context = candles.slice(i, i + CONTEXT_LEN).map(c => ({
                open: Number(c.open),
                high: Number(c.high),
                low: Number(c.low),
                close: Number(c.close),
                volume: Number(c.volume || 0),
                amount: Number(c.close) * Number(c.volume || 0),
                timestamp: c.timestamp
            }));

            const regime = computeWindowRegime(context);

            const result = insertStmt.run(
                instrumentKey,
                timeframe,
                target.timestamp,
                JSON.stringify(context),
                target.open,
                target.high,
                target.low,
                target.close,
                regime
            );

            if (result.changes > 0) {
                insertedCount++;
            }
        }
    });

    insertBatch();
    console.log(`✅ Ingested ${insertedCount} unique training samples for [${instrumentKey}] (${timeframe}).`);
    return { count: insertedCount, instrument: instrumentKey, timeframe };
}

export function runSampleIngestion() {
    const targets = [
        { key: 'NSE_INDEX|Nifty 50', tf: 'day', max: 600 },
        { key: 'NSE_INDEX|Nifty Bank', tf: 'day', max: 600 },
        { key: 'NSE_INDEX|Nifty 50', tf: '15minute', max: 600 },
    ];

    let total = 0;
    for (const t of targets) {
        const res = ingestSamplesForInstrument(t.key, t.tf, t.max);
        total += res.count;
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM training_samples`).get();
    console.log(`\n🎉 Total training samples in database now: ${countRow.total}`);
}

// Run directly if invoked
if (process.argv[1] && process.argv[1].includes('ingestTrainingSamples.js')) {
    runSampleIngestion();
}
