import { calculateTechnicals } from '../services/technicalCalculationService.js';
import { syncCandlesIfStale } from '../services/upstoxHistorical.js';
import { triggerBackfillIfNeeded } from '../services/backfillEngine.js';
import db from '../config/localDb.js';

// In-Memory cache (TTL: 2 seconds)
const technicalsCache = new Map();
const CACHE_TTL_MS = 2000;

export const getTechnicalIndicators = async (req, res) => {
    console.log("[Technicals] HIT /api/technicals", req.query.instrument);
    try {
        const { 
            instrument, timeframe = 'day', ltp,
            adx_period = 14, supertrend_period = 10, supertrend_multiplier = 3,
            rsi_period = 14, macd_fast = 12, macd_slow = 26, macd_signal = 9,
            stoch_rsi_period = 14, stoch_period = 14, stoch_k_period = 3, stoch_d_period = 3,
            williams_period = 14,
            bb_period = 20, bb_stddev = 2, atr_period = 14, kc_period = 20, kc_multiplier = 1.5, kc_atr_period = 10
        } = req.query;
        if (!instrument) {
            return res.status(400).json({ success: false, error: "Instrument key is required" });
        }
        
        const cacheKey = `${instrument}_${timeframe}_${adx_period}_${supertrend_period}_${supertrend_multiplier}_${rsi_period}_${macd_fast}_${macd_slow}_${macd_signal}_${stoch_rsi_period}_${stoch_period}_${stoch_k_period}_${stoch_d_period}_${williams_period}_${bb_period}_${bb_stddev}_${atr_period}_${kc_period}_${kc_multiplier}_${kc_atr_period}`;

        // 1. Check Memory Cache
        const cached = technicalsCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            return res.status(200).json({
                success: true,
                data: {
                    ...cached.data,
                    calculated_at: cached.timestamp
                },
                source: "memory_cache"
            });
        }

        // 2. Smart Sync Historical Data (non-blocking — never crash the response)
        try {
            await syncCandlesIfStale(instrument, timeframe);
        } catch (syncErr) {
            // Sync failed (token expired, rate-limit, etc.) — serve from existing DB data
            console.warn(`[Technicals] Sync skipped for ${instrument}: ${syncErr.message}`);
        }

        // 3. Fetch stitched live quote from DB (Zero API Hit)
        const quoteStmt = db.prepare(`SELECT ltp, open, high, low, close, volume, updated_at FROM quotes WHERE instrument_key = ?`);
        let liveQuote = quoteStmt.get(instrument);

        const validLtp = (ltp && ltp !== "undefined" && !isNaN(parseFloat(ltp))) ? parseFloat(ltp) : null;
        if (!liveQuote && validLtp !== null) {
            liveQuote = { ltp: parseFloat(ltp), close: parseFloat(ltp) };
        } else if (liveQuote && validLtp !== null) {
            liveQuote.ltp = validLtp;
            liveQuote.close = validLtp;
        }

        // 4. Calculate Technicals from whatever is in the DB
        const config = {
            adx_period: parseInt(adx_period, 10),
            supertrend_period: parseInt(supertrend_period, 10),
            supertrend_multiplier: parseFloat(supertrend_multiplier),
            rsi_period: parseInt(rsi_period, 10),
            macd_fast: parseInt(macd_fast, 10),
            macd_slow: parseInt(macd_slow, 10),
            macd_signal: parseInt(macd_signal, 10),
            stoch_rsi_period: parseInt(stoch_rsi_period, 10),
            stoch_period: parseInt(stoch_period, 10),
            stoch_k_period: parseInt(stoch_k_period, 10),
            williams_period: parseInt(williams_period, 10),
            bb_period: parseInt(bb_period, 10),
            bb_stddev: parseFloat(bb_stddev),
            atr_period: parseInt(atr_period, 10),
            kc_period: parseInt(kc_period, 10),
            kc_multiplier: parseFloat(kc_multiplier),
            kc_atr_period: parseInt(kc_atr_period, 10)
        };
        const technicals = calculateTechnicals(instrument, liveQuote, timeframe, config);

        if (!technicals) {
            // --- SQLITE FALLBACK ---
            try {
                const row = db.prepare("SELECT raw_json FROM technicals_data WHERE instrument_key = ?").get(instrument);
                if (row && row.raw_json) {
                    console.log(`Using SQLite Fallback for technicals data: ${instrument}`);
                    const payload = JSON.parse(row.raw_json);
                    return res.status(200).json({ success: true, data: payload, source: "sqlite_fallback", fallback: true });
                }
            } catch (dbErr) {
                console.error("SQLite Fallback failed for technicals:", dbErr.message);
            }
            return res.status(500).json({ success: false, error: "Failed to calculate technicals. Insufficient candle data in DB, and no fallback available." });
        }

        // Add Global India VIX directly into payload
        const vixQuote = quoteStmt.get('NSE_INDEX|India VIX');
        if (vixQuote && vixQuote.ltp) {
            technicals.india_vix = vixQuote.ltp;
        }

        let beta = null;
        try {
            const { yahooFinanceService } = await import('../services/yahooFinanceService.js');
            const row = db.prepare("SELECT trading_symbol, isin FROM instruments WHERE instrument_key = ?").get(instrument);
            let symbolForYahoo = row?.trading_symbol;
            if (!symbolForYahoo && row?.isin) {
                 symbolForYahoo = await yahooFinanceService.searchByIsin(row.isin);
            }
            if (symbolForYahoo) {
                 beta = await yahooFinanceService.getBeta(symbolForYahoo);
            }
        } catch (e) {
            console.error("Failed to fetch Beta from Yahoo:", e.message);
        }

        // Fallback: Calculate Beta Natively if Yahoo doesn't have it
        if (beta === null || beta === undefined) {
            try {
                const { calculateNativeBeta, getHistoricalCandles } = await import('../services/technicalCalculationService.js');
                // Use 1Y (252 trading days) of Daily candles
                const stockCandles = getHistoricalCandles(instrument, 252, 'day');
                const niftyCandles = getHistoricalCandles('NSE_INDEX|Nifty 50', 252, 'day');
                beta = calculateNativeBeta(stockCandles, niftyCandles);
            } catch (e) {
                console.error("Failed to calculate native Beta:", e.message);
            }
        }

        technicals.beta = beta;

        const fallbackTime = technicals.last_candle_timestamp ? new Date(technicals.last_candle_timestamp).getTime() : Date.now();
        const finalData = {
            ...technicals,
            calculated_at: liveQuote && liveQuote.updated_at ? new Date(liveQuote.updated_at).getTime() : fallbackTime
        };

        // 5. Save to in-memory cache
        technicalsCache.set(cacheKey, {
            data: finalData,
            timestamp: Date.now()
        });

        // --- SQLITE DB WRITE (BACKGROUND) ---
        // Write 1: raw JSON blob (for quick full-restore reads)
        try {
            db.prepare(`
                INSERT INTO technicals_data (instrument_key, raw_json, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(instrument_key) DO UPDATE SET 
                    raw_json=excluded.raw_json, 
                    updated_at=CURRENT_TIMESTAMP
            `).run(instrument, JSON.stringify(finalData));
        } catch (dbErr) {
            console.error("Failed to save technical data to SQLite (raw):", dbErr.message);
        }

        // Write 2: column-level fields for queryable technicals_cache (institutional cache layer)
        try {
            // Sanitizer: ensure every value is a primitive number (or null).
            // better-sqlite3 throws "You cannot specify named parameters in two different objects"
            // when an object/array is passed as a positional ? value — this guards against
            // any calculation service returning objects for support, resistance, fibs, etc.
            const toNum = (v) => {
                if (v === null || v === undefined) return null;
                if (typeof v === 'object') return null; // objects → null, never pass to sqlite
                const n = parseFloat(v);
                return isNaN(n) ? null : n;
            };

            db.prepare(`
                INSERT INTO technicals_cache (
                    instrument_key, timeframe, candles_count,
                    ema_20, ema_50, ema_200, sma_50, sma_200,
                    adx, adx_plus_di, adx_minus_di, supertrend, supertrend_direction, beta_correlation,
                    rsi, macd_line, macd_signal, macd_histogram,
                    stoch_rsi, stoch_k, stoch_d, williams_r,
                    bb_upper, bb_middle, bb_lower, bb_pb, atr,
                    kc_upper, kc_middle, kc_lower,
                    volume_sma, obv, cmf, vwap,
                    support, resistance,
                    pivot_p, pivot_r1, pivot_s1, pivot_r2, pivot_s2,
                    fib_0, fib_236, fib_382, fib_500, fib_618, fib_100,
                    trendline_slope, trendline_r2, trendline_std_err,
                    breadth_ratio, ad_line, mcclellan, nh_nl, trin,
                    updated_at
                ) VALUES (
                    ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT(instrument_key) DO UPDATE SET
                    timeframe=excluded.timeframe, candles_count=excluded.candles_count,
                    ema_20=excluded.ema_20, ema_50=excluded.ema_50, ema_200=excluded.ema_200,
                    sma_50=excluded.sma_50, sma_200=excluded.sma_200,
                    adx=excluded.adx, adx_plus_di=excluded.adx_plus_di, adx_minus_di=excluded.adx_minus_di,
                    supertrend=excluded.supertrend, supertrend_direction=excluded.supertrend_direction,
                    beta_correlation=excluded.beta_correlation,
                    rsi=excluded.rsi, macd_line=excluded.macd_line, macd_signal=excluded.macd_signal,
                    macd_histogram=excluded.macd_histogram, stoch_rsi=excluded.stoch_rsi,
                    stoch_k=excluded.stoch_k, stoch_d=excluded.stoch_d, williams_r=excluded.williams_r,
                    bb_upper=excluded.bb_upper, bb_middle=excluded.bb_middle, bb_lower=excluded.bb_lower,
                    bb_pb=excluded.bb_pb, atr=excluded.atr,
                    kc_upper=excluded.kc_upper, kc_middle=excluded.kc_middle, kc_lower=excluded.kc_lower,
                    volume_sma=excluded.volume_sma, obv=excluded.obv, cmf=excluded.cmf, vwap=excluded.vwap,
                    support=excluded.support, resistance=excluded.resistance,
                    pivot_p=excluded.pivot_p, pivot_r1=excluded.pivot_r1, pivot_s1=excluded.pivot_s1,
                    pivot_r2=excluded.pivot_r2, pivot_s2=excluded.pivot_s2,
                    fib_0=excluded.fib_0, fib_236=excluded.fib_236, fib_382=excluded.fib_382,
                    fib_500=excluded.fib_500, fib_618=excluded.fib_618, fib_100=excluded.fib_100,
                    trendline_slope=excluded.trendline_slope, trendline_r2=excluded.trendline_r2,
                    trendline_std_err=excluded.trendline_std_err,
                    breadth_ratio=excluded.breadth_ratio, ad_line=excluded.ad_line,
                    mcclellan=excluded.mcclellan, nh_nl=excluded.nh_nl, trin=excluded.trin,
                    updated_at=CURRENT_TIMESTAMP
            `).run(
                instrument, timeframe, toNum(finalData.candles_count),
                toNum(finalData.ema_20), toNum(finalData.ema_50), toNum(finalData.ema_200),
                toNum(finalData.sma_50), toNum(finalData.sma_200),
                toNum(finalData.adx), toNum(finalData.adx_plus_di), toNum(finalData.adx_minus_di),
                toNum(finalData.supertrend), toNum(finalData.supertrend_direction), toNum(finalData.beta),
                toNum(finalData.rsi), toNum(finalData.macd_line), toNum(finalData.macd_signal),
                toNum(finalData.macd_histogram), toNum(finalData.stoch_rsi),
                toNum(finalData.stoch_k), toNum(finalData.stoch_d), toNum(finalData.williams_r),
                toNum(finalData.bb_upper), toNum(finalData.bb_middle), toNum(finalData.bb_lower),
                toNum(finalData.bb_pb), toNum(finalData.atr),
                toNum(finalData.kc_upper), toNum(finalData.kc_middle), toNum(finalData.kc_lower),
                toNum(finalData.volume_sma), toNum(finalData.obv), toNum(finalData.cmf), toNum(finalData.vwap),
                toNum(finalData.support), toNum(finalData.resistance),
                toNum(finalData.pivot_p), toNum(finalData.pivot_r1), toNum(finalData.pivot_s1),
                toNum(finalData.pivot_r2), toNum(finalData.pivot_s2),
                toNum(finalData.fib_0), toNum(finalData.fib_236), toNum(finalData.fib_382),
                toNum(finalData.fib_500), toNum(finalData.fib_618), toNum(finalData.fib_100),
                toNum(finalData.trendline_slope), toNum(finalData.trendline_r2), toNum(finalData.trendline_std_err),
                toNum(finalData.breadth_ratio), toNum(finalData.ad_line),
                toNum(finalData.mcclellan), toNum(finalData.nh_nl), toNum(finalData.trin)
            );
        } catch (dbErr) {
            console.error("Failed to save technical data to SQLite (column-level):", dbErr.message);
        }


        res.status(200).json({
            success: true,
            data: finalData,
            source: "calculated"
        });
    } catch (error) {
        console.error("Technicals endpoint error:", error);

        // --- SQLITE FALLBACK ---
        try {
            const row = db.prepare("SELECT raw_json FROM technicals_data WHERE instrument_key = ?").get(req.query.instrument);
            if (row && row.raw_json) {
                console.log(`Using SQLite Fallback for technicals data (Catch Block): ${req.query.instrument}`);
                const payload = JSON.parse(row.raw_json);
                return res.status(200).json({ success: true, data: payload, source: "sqlite_fallback", fallback: true });
            }
        } catch (dbErr) {
            console.error("SQLite Fallback failed for technicals:", dbErr.message);
        }

        res.status(500).json({ success: false, error: "Internal server error", details: error.message, stack: error.stack });
    }
};

export const getCandles = async (req, res) => {
    console.log(`[getCandles] Route hit! instrument: ${req.query.instrument}`);
    try {
        const { instrument, timeframe = 'day', limit = 1000 } = req.query;
        if (!instrument) {
            return res.status(400).json({ success: false, error: "Instrument key is required" });
        }

        // Smart Sync Historical Data to ensure latest candles are in DB
        try {
            await syncCandlesIfStale(instrument, timeframe);
            console.log(`[getCandles] Sync completed`);
        } catch (syncErr) {
            console.warn(`[Candles] Sync skipped for ${instrument}: ${syncErr.message}`);
        }

        console.log(`[getCandles] Fetching from DB...`);
        // Fetch from DB
        const stmt = db.prepare(`
            SELECT timestamp, open, high, low, close, volume 
            FROM candles 
            WHERE instrument_key = ? AND timeframe = ? 
            ORDER BY timestamp DESC
            LIMIT ?
        `);
        
        const rows = stmt.all(instrument, timeframe, parseInt(limit, 10));
        rows.reverse();

        // Format for lightweight-charts: { time: 'YYYY-MM-DD' or unix timestamp, open, high, low, close }
        const seenTimes = new Set();
        const formattedData = [];
        for (const row of rows) {
            // lightweight-charts requires time in seconds for intraday, or string for daily
            const dateObj = new Date(row.timestamp);
            const time = timeframe === 'day' || timeframe === 'week' || timeframe === 'month' 
                ? dateObj.toISOString().split('T')[0] 
                : Math.floor(dateObj.getTime() / 1000);
            
            if (!seenTimes.has(time)) {
                seenTimes.add(time);
                formattedData.push({
                    time,
                    open: row.open,
                    high: row.high,
                    low: row.low,
                    close: row.close,
                    volume: row.volume
                });
            }
        }

        // Send response immediately — don't block on backfill
        res.status(200).json({
            success: true,
            data: formattedData
        });

        // Fire-and-forget: silently backfill up to 1 year in the background
        triggerBackfillIfNeeded(instrument, timeframe);
    } catch (error) {
        console.error("Candles endpoint error:", error);
        import("fs").then(fs => fs.appendFileSync("c:/project/ALLBACKUP/Praxis/backend/real_errors.log", new Date().toISOString() + " TechError: " + (error.stack || error.message) + "\n"));
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};


