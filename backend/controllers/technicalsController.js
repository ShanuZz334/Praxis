import { calculateTechnicals } from '../services/technicalCalculationService.js';
import { syncCandlesIfStale } from '../services/upstoxHistorical.js';
import db from '../config/localDb.js';

// In-Memory cache (TTL: 2 seconds)
const technicalsCache = new Map();
const CACHE_TTL_MS = 2000;

export const getTechnicalIndicators = async (req, res) => {
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
            return res.status(500).json({ success: false, error: "Failed to calculate technicals. Insufficient candle data in DB." });
        }

        // Add Global India VIX directly into payload
        const vixQuote = quoteStmt.get('NSE_INDEX|India VIX');
        if (vixQuote && vixQuote.ltp) {
            technicals.india_vix = vixQuote.ltp;
        }

        // 5. Save to in-memory cache
        technicalsCache.set(cacheKey, {
            data: technicals,
            timestamp: Date.now()
        });

        const fallbackTime = technicals.last_candle_timestamp ? new Date(technicals.last_candle_timestamp).getTime() : Date.now();
        
        res.status(200).json({
            success: true,
            data: {
                ...technicals,
                calculated_at: liveQuote && liveQuote.updated_at ? new Date(liveQuote.updated_at).getTime() : fallbackTime
            },
            source: "calculated"
        });
    } catch (error) {
        console.error("Technicals endpoint error:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};


