import axios from "axios";
import { NseIndia } from 'stock-nse-india';
import UpstoxAuth from "../models/UpstoxAuth.js";
import localDb from "../config/localDb.js";
import { getCache, setCache } from "../services/cacheService.js";
import { yahooFinanceService } from "../services/yahooFinanceService.js";
import { fredApiService } from "../services/fredApiService.js";
import { rbiApiService } from "../services/rbiApiService.js";

import { getUpstoxLiveToken } from "../utils/upstoxAuthHelper.js";

const UPSTOX_FUNDAMENTALS_URL = "https://api.upstox.com/v2/fundamentals";

export const getFundamentals = async (req, res) => {
    try {
        let liveToken;
        try {
            liveToken = await getUpstoxLiveToken();
        } catch (authErr) {
            return res.status(401).json({ error: "Upstox is not authenticated for live market data" });
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
                
                // Attempt to fetch index fundamentals via stock-nse-india
                try {
                    const nse = new NseIndia();
                    const allIndices = await nse.getAllIndices();
                    
                    let lookupName = instrumentKey.split('|')[1]?.toUpperCase();
                    if (lookupName === "NIFTY 50") lookupName = "NIFTY 50";
                    // Fallbacks for other names if necessary, e.g. "NIFTY BANK"
                    
                    const indexData = allIndices.data.find(d => d.indexSymbol === lookupName || d.index === lookupName);
                    
                    if (indexData) {
                        const pe = parseFloat(indexData.pe);
                        const pb = parseFloat(indexData.pb);
                        const dy = parseFloat(indexData.dy);
                        
                        if (!isNaN(pe)) payload.ratios.push({ name: 'p/e', company_value: pe });
                        if (!isNaN(pb)) payload.ratios.push({ name: 'p/b', company_value: pb });
                        if (!isNaN(dy)) payload.ratios.push({ name: 'dividend yield', company_value: dy });
                        if (!isNaN(pe) && pe > 0) payload.ratios.push({ name: 'earnings yield', company_value: parseFloat(((1 / pe) * 100).toFixed(2)) });
                    }
                } catch (nseErr) {
                    console.log('Failed to fetch NSE index fundamentals:', nseErr.message);
                }
            } else {
                const headers = {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${liveToken}`
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
                // Fetch Yahoo External Metrics Live in PARALLEL to prevent 120s ECONNABORTED timeouts
                const [
                    analystRes,
                    divRes,
                    capRes,
                    bookRes,
                    cccRes,
                    covRes
                ] = await Promise.allSettled([
                    yahooFinanceService.getAnalystConsensus(tradingSymbol),
                    yahooFinanceService.getDividendYield(tradingSymbol),
                    yahooFinanceService.getMarketCap(tradingSymbol),
                    yahooFinanceService.getBookValue(tradingSymbol),
                    yahooFinanceService.getCashConversionCycle(tradingSymbol),
                    yahooFinanceService.getInterestCoverage(tradingSymbol)
                ]);

                payload.analystConsensus = analystRes.status === 'fulfilled' ? analystRes.value : null;
                payload.dividendYield = divRes.status === 'fulfilled' ? divRes.value : null;
                payload.marketCap = capRes.status === 'fulfilled' ? capRes.value : null;
                payload.bookValue = bookRes.status === 'fulfilled' ? bookRes.value : null;
                payload.cashConversionCycle = cccRes.status === 'fulfilled' ? cccRes.value : null;
                payload.interestCoverage = covRes.status === 'fulfilled' ? covRes.value : null;
                
                if (analystRes.status === 'rejected') console.error("Failed to fetch Analyst Consensus:", analystRes.reason?.message);
            }

            // --- FETCH MACRO EXTERNAL METRICS LIVE ---
            let gdpGrowth = null, cpiInflation = null, repoRate = null, fiscalDeficit = null;
            let systemLiquidity = null, mfFlows = null, fiiTrend = null;
            try {
                gdpGrowth = await fredApiService.getGDPGrowth();
            } catch (e) { console.error("Failed to fetch GDP:", e.message); }
            try {
                cpiInflation = await fredApiService.getCPIInflation();
            } catch (e) { console.error("Failed to fetch CPI:", e.message); }
            try {
                repoRate = await fredApiService.getRepoRate();
            } catch (e) { console.error("Failed to fetch Repo Rate:", e.message); }
            try {
                fiscalDeficit = await fredApiService.getFiscalDeficit();
            } catch (e) { console.error("Failed to fetch Fiscal Deficit:", e.message); }

            try {
                const fiiRows = localDb.prepare(`
                    SELECT data_payload, timestamp FROM ai_card_store
                    WHERE instrument_key = 'GLOBAL' 
                    AND page_name = 'Dashboard' 
                    AND section_name = 'InstitutionalFlow' 
                    AND card_name = 'FiiDiiSegmented'
                    ORDER BY timestamp DESC
                    LIMIT 30
                `).all();

                if (fiiRows && fiiRows.length > 0) {
                    let persistence = 0;
                    let trendDirection = 0;
                    
                    for (const row of fiiRows) {
                        const payloadData = JSON.parse(row.data_payload);
                        const netCashFii = payloadData?.fii?.['NSE_EQ|CASH']?.net || 0;
                        
                        if (trendDirection === 0) {
                            if (netCashFii === 0) break;
                            trendDirection = netCashFii > 0 ? 1 : -1;
                            persistence = trendDirection;
                        } else {
                            if ((netCashFii > 0 && trendDirection === 1) || (netCashFii < 0 && trendDirection === -1)) {
                                persistence += trendDirection;
                            } else {
                                break;
                            }
                        }
                    }
                    fiiTrend = persistence;
                }
            } catch (e) { console.error("Failed to calculate FII Trend:", e.message); }
            try {
                systemLiquidity = await fredApiService.getGlobalLiquidity();
            } catch (e) { console.error("Failed to fetch Global Liquidity:", e.message); }

            payload.gdpGrowth = gdpGrowth;
            payload.cpiInflation = cpiInflation;
            payload.repoRate = repoRate;
            payload.fiscalDeficit = fiscalDeficit;
            payload.global_liq = systemLiquidity;
            payload.systemLiquidity = systemLiquidity; // for backwards compatibility
            payload.mfFlows = mfFlows;
            payload.fiiTrend = fiiTrend;

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

            // --- SQLITE COLUMN-LEVEL WRITE (fundamentals_cache) ---
            // Extract well-known scalar fields from payload for fast column queries
            try {
                const ratios = Array.isArray(payload.ratios) ? payload.ratios : [];
                const getR = (name) => { const r = ratios.find(r => r.name?.toLowerCase().replace(/[^a-z0-9]/g,'').includes(name)); return r ? parseFloat(r.company_value) || null : null; };

                // Sanitizer: coerce any object/array/NaN to null so better-sqlite3
                // never sees a non-primitive in a positional ? parameter.
                const toNum = (v) => {
                    if (v === null || v === undefined) return null;
                    if (typeof v === 'object') return null;
                    const n = parseFloat(v);
                    return isNaN(n) ? null : n;
                };
                const toStr = (v) => (v === null || v === undefined || typeof v === 'object') ? null : String(v);

                const promoterHolding = (() => {
                    const h = Array.isArray(payload.holdings) ? payload.holdings : [];
                    const p = h.find(x => x.category?.toLowerCase().includes('promot'));
                    return p ? toNum(p.holding_percentage) : null;
                })();

                localDb.prepare(`
                    INSERT INTO fundamentals_cache (
                        instrument_key,
                        pe_ratio, forward_pe, pb_ratio, ev_ebitda, earnings_yield, dividend_yield,
                        roe, roce, roa,
                        debt_to_equity, current_ratio, interest_coverage, free_cash_flow, cash_conversion,
                        promoter_holding,
                        gdp_growth, cpi, repo_rate, fiscal_deficit,
                        fii_flow, dii_flow, fii_trend,
                        india_vix, crude, global_liq,
                        analyst_consensus,
                        yahoo_raw_json,
                        updated_at
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
                    )
                    ON CONFLICT(instrument_key) DO UPDATE SET
                        pe_ratio=excluded.pe_ratio, forward_pe=excluded.forward_pe,
                        pb_ratio=excluded.pb_ratio, ev_ebitda=excluded.ev_ebitda,
                        earnings_yield=excluded.earnings_yield, dividend_yield=excluded.dividend_yield,
                        roe=excluded.roe, roce=excluded.roce, roa=excluded.roa,
                        debt_to_equity=excluded.debt_to_equity, current_ratio=excluded.current_ratio,
                        interest_coverage=excluded.interest_coverage, free_cash_flow=excluded.free_cash_flow,
                        cash_conversion=excluded.cash_conversion, promoter_holding=excluded.promoter_holding,
                        gdp_growth=excluded.gdp_growth, cpi=excluded.cpi, repo_rate=excluded.repo_rate,
                        fiscal_deficit=excluded.fiscal_deficit,
                        fii_flow=excluded.fii_flow, dii_flow=excluded.dii_flow, fii_trend=excluded.fii_trend,
                        india_vix=excluded.india_vix, crude=excluded.crude, global_liq=excluded.global_liq,
                        analyst_consensus=excluded.analyst_consensus,
                        yahoo_raw_json=excluded.yahoo_raw_json,
                        updated_at=CURRENT_TIMESTAMP
                `).run(
                    instrumentKey,
                    toNum(getR('pe') ?? getR('priceearning')),
                    toNum(getR('forwardpe') ?? getR('forward')),
                    toNum(getR('pb') ?? getR('pricebook')),
                    toNum(getR('evebitda')),
                    toNum(getR('earningsyield')),
                    toNum(payload.dividendYield),
                    toNum(getR('roe') ?? getR('returnonequity')),
                    toNum(getR('roce') ?? getR('returncapital')),
                    toNum(getR('roa') ?? getR('returnasset')),
                    toNum(getR('debtequity') ?? getR('debt')),
                    toNum(getR('currentratio')),
                    toNum(payload.interestCoverage),
                    null, // free_cash_flow — extracted separately if needed
                    toNum(payload.cashConversionCycle),
                    promoterHolding,
                    toNum(payload.gdpGrowth),
                    toNum(payload.cpiInflation),
                    toNum(payload.repoRate),
                    toNum(payload.fiscalDeficit),
                    toNum(payload.liquidity?.fii_net),
                    toNum(payload.liquidity?.dii_net),
                    toStr(payload.fiiTrend),
                    toNum(payload.india_vix),
                    null, // crude — fetched via globalData
                    toNum(payload.global_liq),
                    toStr(payload.analystConsensus),
                    payload.yahoo_raw ? JSON.stringify(payload.yahoo_raw) : null
                );
            } catch (colErr) {
                console.warn("Failed to write to fundamentals_cache:", colErr.message);
            }
        }

        // Live Global India VIX Injection (Fetched from local high-frequency DB)
        const vixQuote = localDb.prepare("SELECT ltp, updated_at FROM quotes WHERE instrument_key = 'NSE_INDEX|India VIX'").get();
        if (vixQuote && vixQuote.ltp) {
            payload.india_vix = vixQuote.ltp;
            if (vixQuote.updated_at) payload.vix_updated_at = vixQuote.updated_at;
        }

        // Live Daily High/Low Injection from Upstox API directly
        try {
            const quoteRes = await axios.get(`https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(instrumentKey)}`, {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${liveToken}` }
            });
            const quoteData = quoteRes.data?.data || {};
            const quoteObj = Object.values(quoteData)[0];
            if (quoteObj && quoteObj.ohlc) {
                if (!payload.quote) payload.quote = {};
                payload.quote.ohlc = { high: quoteObj.ohlc.high, low: quoteObj.ohlc.low };
                if (!payload.quote.last_price) payload.quote.last_price = quoteObj.last_price;
            }
        } catch (e) {
            console.error("Failed to fetch Live Quote for High/Low:", e.message);
        }

        // Live FII/DII, Advance/Decline, and Sector Dashboard Injection
        try {
            const nse = new NseIndia();
            
            // FII/DII
            const fiiData = await nse.getDataByEndpoint('/api/fiidiiTradeReact');
            if (Array.isArray(fiiData) && fiiData.length > 0) {
                let fii_net = null;
                let dii_net = null;
                for (const item of fiiData) {
                    if (item.category === 'FII/FPI') fii_net = parseFloat(item.netValue);
                    if (item.category === 'DII') dii_net = parseFloat(item.netValue);
                }
                payload.liquidity = { fii_net, dii_net, updated_at: fiiData[0].date };
            }

            // Advance / Decline & Sector Dashboard
            const indicesData = await nse.getAllIndices();
            if (indicesData && indicesData.data) {
                const nifty50 = indicesData.data.find(x => x.indexSymbol === 'NIFTY 50');
                if (nifty50) {
                    payload.advance_decline = {
                        advances: parseInt(nifty50.advances),
                        declines: parseInt(nifty50.declines),
                        updated_at: new Date().toISOString()
                    };
                }

                // Sector Dashboard
                const sectors = ['NIFTY BANK', 'NIFTY IT', 'NIFTY AUTO', 'NIFTY FMCG', 'NIFTY METAL', 'NIFTY PHARMA'];
                const sectorData = {};
                for (const sector of sectors) {
                    const sec = indicesData.data.find(x => x.indexSymbol === sector);
                    if (sec) {
                        sectorData[sector] = parseFloat(sec.percentChange);
                    }
                }
                payload.sector_dashboard = sectorData;
            }

        } catch (e) {
            console.error("Failed to fetch NSE live data:", e.message);
        }

        // Live RBI Scraper Attempt
        try {
            const creditGrowth = await rbiApiService.getCreditGrowth();
            if (creditGrowth !== null) payload.credit_growth = creditGrowth;
        } catch (e) {
            console.error("RBI Scraper (Credit Growth) Failed, fallback engaged:", e.message);
        }

        try {
            const corpDebt = await rbiApiService.getCorporateDebt();
            if (corpDebt !== null) payload.corporate_debt = corpDebt;
        } catch (e) {
            console.error("RBI Scraper (Corp Debt) Failed, fallback engaged:", e.message);
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
