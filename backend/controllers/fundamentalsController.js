import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import localDb from "../config/localDb.js";
import { getCache, setCache } from "../services/cacheService.js";
import { yahooFinanceService } from "../services/yahooFinanceService.js";
import { fredApiService } from "../services/fredApiService.js";

const UPSTOX_FUNDAMENTALS_URL = "https://api.upstox.com/v2/fundamentals";

export const getFundamentals = async (req, res) => {
    try {
        const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
        if (!auth || !auth.accessToken) {
            return res.status(401).json({ error: "Upstox is not authenticated" });
        }

        const instrumentKey = req.query.instrument_key;
        if (!instrumentKey) return res.status(400).json({ error: "instrument_key is required" });

        const cacheKey = `fundamentals_v8_${instrumentKey}`;
        let payload = getCache(cacheKey);

        if (!payload) {
            // Lookup ISIN and trading symbol from local DB
            const row = localDb.prepare("SELECT isin, trading_symbol FROM instruments WHERE instrument_key = ?").get(instrumentKey);
            
            let isin = row ? row.isin : null;
            let tradingSymbol = row ? row.trading_symbol : null;

            if (!isin) {
                // Indices don't have an ISIN or fundamental data via this Upstox API
                payload = { ratios: [], income: [], balanceSheet: [], cashFlow: [], holdings: [], calculated_at: Date.now() };
            } else {
                const headers = {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${auth.accessToken}`
                };

                // Fetch all endpoints concurrently. Mark error: true if they fail.
                const endpoints = [
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/key-ratios`, { headers }).catch(e => { console.log('Ratios Error:', e.response?.data || e.message); return { error: true, data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/income-statement?type=consolidated&time_period=yearly&fs=true`, { headers }).catch(e => { console.log('Income Error:', e.response?.data || e.message); return { error: true, data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/balance-sheet?type=consolidated&fs=true`, { headers }).catch(e => { console.log('Balance Error:', e.response?.data || e.message); return { error: true, data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/cash-flow?type=consolidated&fs=true`, { headers }).catch(e => { console.log('CashFlow Error:', e.response?.data || e.message); return { error: true, data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/share-holdings`, { headers }).catch(e => { console.log('Holdings Error:', e.response?.data || e.message); return { error: true, data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/corporate-actions`, { headers }).catch(e => { console.log('CorpActions Error:', e.response?.data || e.message); return { error: true, data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/profile`, { headers }).catch(e => { console.log('Profile Error:', e.response?.data || e.message); return { error: true, data: { data: {} }}; })
                ];

                const [ratiosRes, incomeRes, balanceRes, cashRes, holdingsRes, corpActionsRes, profileRes] = await Promise.all(endpoints);

                // If critical endpoints failed, throw error to trigger SQLite fallback and avoid poisoning cache
                if (ratiosRes.error && incomeRes.error && balanceRes.error) {
                    throw new Error("Upstox API critical fundamental endpoints failed. Triggering fallback.");
                }

                payload = {
                    ratios: ratiosRes.data?.data || [],
                    income: incomeRes.data?.data || {},
                    balanceSheet: balanceRes.data?.data || {},
                    cashFlow: cashRes.data?.data || {},
                    holdings: holdingsRes.data?.data || [],
                    corporate_actions: corpActionsRes.data?.data || [],
                    company_profile: profileRes.data?.data || {},   // full object: sector, sector_market_cap_inr, etc.
                    calculated_at: Date.now()
                };
            }

            // --- FETCH YAHOO EXTERNAL METRICS LIVE ---
            if (!tradingSymbol && isin) {
                try {
                    tradingSymbol = await yahooFinanceService.searchByIsin(isin);
                } catch (e) {
                    console.error("Live Yahoo ISIN search failed:", e.message);
                }
            }

            if (tradingSymbol) {
                let analystConsensus = null;
                try {
                    analystConsensus = await yahooFinanceService.getAnalystConsensus(tradingSymbol);
                } catch (e) {
                    console.error("Failed to fetch Analyst Consensus:", e.message);
                }

                let gdpGrowth = null;
                try {
                    gdpGrowth = await fredApiService.getGDPGrowth();
                } catch (e) {
                    console.error("Failed to fetch GDP Growth live:", e.message);
                }

                let dividendYield = null;
                try {
                    dividendYield = await yahooFinanceService.getDividendYield(tradingSymbol);
                } catch (e) {
                    console.error("Failed to fetch Dividend Yield live:", e.message);
                }
                
                let marketCap = null;
                try {
                    marketCap = await yahooFinanceService.getMarketCap(tradingSymbol);
                } catch (e) {
                    console.error("Failed to fetch Market Cap live:", e.message);
                }

                let ccc = null;
                try {
                    ccc = await yahooFinanceService.getCashConversionCycle(tradingSymbol);
                } catch (e) {
                    console.error("Failed to fetch CCC live:", e.message);
                }

                let interestCoverage = null;
                try {
                    interestCoverage = await yahooFinanceService.getInterestCoverage(tradingSymbol);
                } catch (e) {
                    console.error("Failed to fetch Interest Coverage live:", e.message);
                }

                payload.analystConsensus = analystConsensus;
                payload.gdpGrowth = gdpGrowth;
                payload.dividendYield = dividendYield;
                payload.marketCap = marketCap;
                payload.cashConversionCycle = ccc;
                payload.interestCoverage = interestCoverage;
            }

            setCache(cacheKey, payload, 86400); // 24 hours TTL

            // --- SQLITE DB WRITE (BACKGROUND) ---
            try {
                localDb.prepare(`
                    INSERT INTO fundamentals_data (instrument_key, raw_json, updated_at) 
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(instrument_key) DO UPDATE SET 
                        raw_json=excluded.raw_json, 
                        updated_at=CURRENT_TIMESTAMP
                `).run(instrumentKey, JSON.stringify(payload));
            } catch (dbErr) {
                console.error("Failed to save fundamental data to SQLite:", dbErr.message);
            }
        }

        // Live Global India VIX Injection (Fetched from local high-frequency DB)
        const vixQuote = localDb.prepare("SELECT ltp, updated_at FROM quotes WHERE instrument_key = 'NSE_INDEX|India VIX'").get();
        if (vixQuote && vixQuote.ltp) {
            payload.india_vix = vixQuote.ltp;
            if (vixQuote.updated_at) payload.vix_updated_at = vixQuote.updated_at;
        }

        return res.json({ status: "success", data: payload, cached: !!getCache(cacheKey) });

    } catch (error) {
        console.error("Error fetching fundamentals:", error?.response?.data || error.message);
        
        // --- SQLITE FALLBACK ---
        try {
            const row = localDb.prepare("SELECT raw_json FROM fundamentals_data WHERE instrument_key = ?").get(req.query.instrument_key);
            if (row && row.raw_json) {
                console.log(`Using SQLite Fallback for fundamentals data: ${req.query.instrument_key}`);
                const payload = JSON.parse(row.raw_json);
                return res.json({ status: "success", data: payload, cached: false, fallback: true });
            }
        } catch (dbErr) {
            console.error("SQLite Fallback failed for fundamentals:", dbErr.message);
        }

        res.status(500).json({ error: "Internal server error while fetching fundamentals" });
    }
};
