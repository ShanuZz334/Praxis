import db from '../config/localDb.js';

/**
 * Storage Guardrail Service for Praxis SQLite Engine
 * Enforces Single-Timeframe Intraday Storage Policy, prevents storage sabotage,
 * prunes redundant pre-aggregated bars, purges unread ticks, and manages compaction.
 * Strictly adheres to zero-emoji and non-destructive guidelines (never drops tables).
 */

/**
 * Prunes redundant pre-aggregated intraday candles for instruments
 * that already have native 1-minute historical data stored.
 */
export const pruneRedundantCandles = () => {
    try {
        // 1. Identify instruments that have at least 500 1-minute candles
        const candidates = db.prepare(`
            SELECT instrument_key, COUNT(*) as cnt_1m 
            FROM candles 
            WHERE timeframe = '1minute' 
            GROUP BY instrument_key 
            HAVING cnt_1m >= 500
        `).all();

        if (!candidates || candidates.length === 0) {
            return { prunedRows: 0, affectedInstruments: 0 };
        }

        // Only prune legacy deprecated shorthand timeframe aliases ('1m', '15m'),
        // preserving canonical 5minute, 15minute, 30minute, 1hour required by Prediction Resolution & Technical Services
        const deleteRedundantStmt = db.prepare(`
            DELETE FROM candles 
            WHERE instrument_key = ? 
            AND timeframe IN ('1m', '15m', '3m', '10m')
        `);

        const deleteRedundantStateStmt = db.prepare(`
            DELETE FROM backfill_state 
            WHERE instrument_key = ? 
            AND timeframe IN ('1m', '15m', '3m', '10m')
        `);

        let totalPruned = 0;
        let affected = 0;

        const pruneTransaction = db.transaction((instruments) => {
            for (const item of instruments) {
                const res = deleteRedundantStmt.run(item.instrument_key);
                if (res.changes > 0) {
                    totalPruned += res.changes;
                    affected++;
                    deleteRedundantStateStmt.run(item.instrument_key);
                }
            }
        });

        pruneTransaction(candidates);

        if (totalPruned > 0) {
            console.log(`[Storage Guardrail] Pruned ${totalPruned} redundant intraday candles across ${affected} instruments.`);
        }

        return { prunedRows: totalPruned, affectedInstruments: affected };
    } catch (err) {
        console.error("[Storage Guardrail] Candle pruning error:", err.message);
        return { prunedRows: 0, affectedInstruments: 0, error: err.message };
    }
};

/**
 * Prunes volatile, unread, or historical cache tables to prevent disk sabotage.
 */
export const pruneVolatileStorage = () => {
    try {
        let ticksDeleted = 0;
        let aiDeleted = 0;
        let scoresDeleted = 0;

        // 1. Truncate unread market_ticks table (14M+ dead tick rows)
        try {
            const tickRes = db.prepare("DELETE FROM market_ticks").run();
            ticksDeleted = tickRes.changes;
        } catch (e) {
            console.warn("[Storage Guardrail] market_ticks purge warning:", e.message);
        }

        // 2. Retention policy: Prune ai_card_store older than 14 days
        try {
            const aiRes = db.prepare("DELETE FROM ai_card_store WHERE timestamp < datetime('now', '-14 days')").run();
            aiDeleted = aiRes.changes;
        } catch (e) {
            console.warn("[Storage Guardrail] ai_card_store purge warning:", e.message);
        }

        // 3. Retention policy: Prune card_score_history older than 14 days
        try {
            const scoreRes = db.prepare("DELETE FROM card_score_history WHERE timestamp < datetime('now', '-14 days')").run();
            scoresDeleted = scoreRes.changes;
        } catch (e) {
            console.warn("[Storage Guardrail] card_score_history purge warning:", e.message);
        }

        console.log(`[Storage Guardrail] Volatile tables pruned: ${ticksDeleted} ticks, ${aiDeleted} AI cards, ${scoresDeleted} score history entries.`);
        return { ticksDeleted, aiDeleted, scoresDeleted };
    } catch (err) {
        console.error("[Storage Guardrail] Volatile storage pruning error:", err.message);
        return { error: err.message };
    }
};

/**
 * Checkpoints the SQLite WAL file and optionally runs a full VACUUM to reclaim OS disk space.
 */
export const compactStorage = (fullVacuum = false) => {
    try {
        // WAL Checkpoint with TRUNCATE resets the -wal log file to 0 bytes
        db.pragma('wal_checkpoint(TRUNCATE)');
        console.log("[Storage Guardrail] WAL checkpoint TRUNCATE executed.");

        if (fullVacuum) {
            console.log("[Storage Guardrail] Executing full VACUUM (rebuilding SQLite file)...");
            const start = Date.now();
            db.exec("VACUUM;");
            console.log(`[Storage Guardrail] Full VACUUM completed in ${((Date.now() - start) / 1000).toFixed(2)}s.`);
        }

        return { success: true };
    } catch (err) {
        console.error("[Storage Guardrail] Storage compaction error:", err.message);
        return { success: false, error: err.message };
    }
};

/**
 * Returns current database disk metrics, page allocations, and table row counts.
 */
export const getStorageHealthReport = () => {
    try {
        const pageCount = db.pragma("page_count", { simple: true });
        const pageSize = db.pragma("page_size", { simple: true });
        const freelistCount = db.pragma("freelist_count", { simple: true });
        const dbSizeBytes = pageCount * pageSize;
        const freeSizeBytes = freelistCount * pageSize;

        const tableCounts = {};
        const tables = [
            'candles', 'quotes', 'instruments', 'ai_card_store', 
            'card_score_history', 'market_ticks', 'option_chain', 
            'backfill_state', 'historical_backfill_meta'
        ];

        for (const tbl of tables) {
            try {
                const r = db.prepare(`SELECT COUNT(*) as cnt FROM ${tbl}`).get();
                tableCounts[tbl] = r?.cnt || 0;
            } catch (_) {
                tableCounts[tbl] = null;
            }
        }

        const candleDistribution = db.prepare(`
            SELECT timeframe, COUNT(*) as candles, COUNT(DISTINCT instrument_key) as instruments 
            FROM candles 
            GROUP BY timeframe 
            ORDER BY candles DESC
        `).all();

        return {
            databaseSizeMB: Number((dbSizeBytes / (1024 * 1024)).toFixed(2)),
            freelistSizeMB: Number((freeSizeBytes / (1024 * 1024)).toFixed(2)),
            pageCount,
            pageSize,
            freelistCount,
            tableCounts,
            candleDistribution,
            timestamp: new Date().toISOString()
        };
    } catch (err) {
        console.error("[Storage Guardrail] Failed to build storage report:", err.message);
        return { error: err.message };
    }
};

/**
 * Orchestrates complete storage maintenance:
 * 1. Prunes redundant intraday bars
 * 2. Prunes volatile/dead cache tables
 * 3. Checkpoints WAL and optionally vacuums
 */
export const runStorageMaintenance = async (vacuum = false) => {
    console.log("[Storage Guardrail] Starting storage maintenance...");
    const candleResult = pruneRedundantCandles();
    const volatileResult = pruneVolatileStorage();
    const compactResult = compactStorage(vacuum);
    const healthReport = getStorageHealthReport();

    console.log(`[Storage Guardrail] Maintenance complete. Current DB Size: ${healthReport.databaseSizeMB} MB.`);
    return {
        candleResult,
        volatileResult,
        compactResult,
        healthReport
    };
};
