import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import { upsertAiCardStore } from "../config/localDb.js";
import { processNewsItems } from "./newsAutoProcessor.js";
import { getNifty50Keys } from "../utils/nifty50.js";

const UPSTOX_BASE_URL = "https://api.upstox.com/v2/market";

const getAuthToken = async () => {
    const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
    if (!auth || !auth.accessToken) throw new Error("Upstox is not authenticated");
    return auth.accessToken;
};

// ============================================================================
// Rotating Tracking Lists for Market News
// ============================================================================
let currentTrackingIndex = 0;
const TRACKING_LISTS = [
    // Bucket 1: Entire Nifty 50 (All 50 components)
    getNifty50Keys(),
    
    // Bucket 2: Major Indices & Benchmarks
    [
        'NSE_INDEX|Nifty 50', 
        'NSE_INDEX|Nifty Bank', 
        'NSE_INDEX|India VIX', 
        'NSE_INDEX|Nifty Fin Service', 
        'NSE_INDEX|Nifty IT',
        'NSE_INDEX|Nifty Midcap 100',
        'BSE_INDEX|SENSEX'
    ],
    
    // Bucket 4: Volatile Midcaps & Other Key Assets (Gold, Crude Proxy, etc.)
    [
        'MCX_FO|CRUDEOIL',
        'MCX_FO|GOLD',
        'NSE_EQ|INE011A01019', // HDFC AMC
        'NSE_EQ|INE151A01013', // Trent
        'NSE_EQ|INE423A01024', // Adani Ent (midcap/volatile)
        'NSE_EQ|INE036A01016', // Zomato
        'NSE_EQ|INE758T01015', // IRFC
        'NSE_EQ|INE172A01027', // Castrol
        'NSE_EQ|INE121E01018', // Chola Inv
        'NSE_EQ|INE669E01016', // Vodafone Idea
        'NSE_EQ|INE245A01021', // Tata Power
        'NSE_EQ|INE196A01026', // TVS Motor
        'NSE_EQ|INE002A01018', // Reliance (Keep anchor in this bucket too)
    ]
];

export const fetchFiiDiiFlow = async () => {
    try {
        const token = await getAuthToken();
        const headers = { "Accept": "application/json", "Authorization": `Bearer ${token}` };

        const fiiDataTypes = "NSE_FO|INDEX_FUTURES,NSE_FO|STOCK_FUTURES,NSE_FO|INDEX_OPTIONS,NSE_FO|STOCK_OPTIONS,NSE_EQ|CASH";
        const diiDataTypes = "NSE_EQ|CASH";

        const fiiPromise = axios.get(`${UPSTOX_BASE_URL}/fii?interval=1D&data_type=${encodeURIComponent(fiiDataTypes)}`, { headers })
            .then(res => res.data?.data)
            .catch(err => { console.error("FII fetch error:", err.response?.data?.errors || err.message); return null; });

        const diiPromise = axios.get(`${UPSTOX_BASE_URL}/dii?interval=1D&data_type=${encodeURIComponent(diiDataTypes)}`, { headers })
            .then(res => res.data?.data)
            .catch(err => { console.error("DII fetch error:", err.response?.data?.errors || err.message); return null; });

        const [fiiRes, diiRes] = await Promise.all([fiiPromise, diiPromise]);
        
        // Asynchronously sync the 30-day historical window into MongoDB
        syncHistoricalFlows(fiiRes, diiRes).catch(console.error);

        const processSegments = (data) => {
            if (!data) return {};
            const result = {};
            for (const [segment, arr] of Object.entries(data)) {
                if (arr && arr[0]) {
                    result[segment] = {
                        buy_amount: arr[0].buy_amount || 0,
                        sell_amount: arr[0].sell_amount || 0,
                        net: (arr[0].buy_amount || 0) - (arr[0].sell_amount || 0),
                        timestamp: arr[0].time_stamp
                    };
                }
            }
            return result;
        };

        const fiiSegments = processSegments(fiiRes);
        const diiSegments = processSegments(diiRes);

        let lastUpdated = null;
        Object.values(fiiSegments).forEach(s => { if (s.timestamp > lastUpdated) lastUpdated = s.timestamp; });
        Object.values(diiSegments).forEach(s => { if (s.timestamp > lastUpdated) lastUpdated = s.timestamp; });

        return {
            fii: fiiSegments,
            dii: diiSegments,
            timestamp: lastUpdated
        };

    } catch (error) {
        console.error("❌ Failed to fetch FII/DII data:", error?.message);
        return null;
    }
};

const syncHistoricalFlows = async (fiiData, diiData) => {
    if (!fiiData && !diiData) return;
    
    const flowMap = new Map();
    
    // Process FII
    if (fiiData) {
        for (const [segment, arr] of Object.entries(fiiData)) {
            for (const entry of arr) {
                if (!flowMap.has(entry.time_stamp)) flowMap.set(entry.time_stamp, { fii: {}, dii: {} });
                flowMap.get(entry.time_stamp).fii[segment] = {
                    buy_amount: entry.buy_amount || 0,
                    sell_amount: entry.sell_amount || 0,
                    net: (entry.buy_amount || 0) - (entry.sell_amount || 0)
                };
            }
        }
    }
    
    // Process DII
    if (diiData) {
        for (const [segment, arr] of Object.entries(diiData)) {
            for (const entry of arr) {
                if (!flowMap.has(entry.time_stamp)) flowMap.set(entry.time_stamp, { fii: {}, dii: {} });
                flowMap.get(entry.time_stamp).dii[segment] = {
                    buy_amount: entry.buy_amount || 0,
                    sell_amount: entry.sell_amount || 0,
                    net: (entry.buy_amount || 0) - (entry.sell_amount || 0)
                };
            }
        }
    }
    
    // Upsert each day into SQLite
    for (const [ts, data] of flowMap.entries()) {
        const timestampIso = new Date(ts).toISOString();
        upsertAiCardStore(
            "GLOBAL", 
            "Dashboard", 
            "InstitutionalFlow", 
            "FiiDiiSegmented", 
            timestampIso, 
            { fii: data.fii, dii: data.dii }
        );
    }
};

export const fetchSmartlist = async (assetType, category, type = "options") => {
    try {
        const token = await getAuthToken();
        const headers = { "Accept": "application/json", "Authorization": `Bearer ${token}` };
        
        const url = `${UPSTOX_BASE_URL}/smartlist/${type}?asset_type=${assetType}&category=${category}&page_number=1&page_size=20`;
        const res = await axios.get(url, { headers });
        const list = res.data?.data?.smartlist || [];
        return list.map(item => ({ ...item, category }));
    } catch (error) {
        // Mute 400 errors if the category doesn't exist, just return empty
        if (error?.response?.status !== 400) {
            console.error(`❌ Failed to fetch ${type} smartlist (${category}):`, error?.message);
        }
        return [];
    }
};

import { broadcast } from "./socketBroadcast.js";

export let cachedFlowData = null;
export let cachedSmartlists = null;
export let cachedSectors = null;
export let cachedNews = null;

export const forceMarketDataPoll = async () => {
    try {
        const flowData = await fetchFiiDiiFlow();
            cachedFlowData = flowData || { fii: {}, dii: {}, timestamp: null };
            broadcast("market:fiidii", cachedFlowData);
            
            const [optOiGainers, optIvSurge, futPremium, optMostActive] = await Promise.all([
                fetchSmartlist("INDEX", "OI_GAINERS", "options"),
                fetchSmartlist("INDEX", "IV_GAINERS", "options"),
                fetchSmartlist("INDEX", "PREMIUM", "futures"),
                fetchSmartlist("INDEX", "MOST_ACTIVE", "options") // For Volume Shockers
            ]);
            
            const optionsSmartlist = [...optOiGainers, ...optIvSurge, ...optMostActive];
            const futuresSmartlist = [...futPremium];
            
            // Enrich with human-readable trading symbols using Upstox Quotes API
            const allItems = [...optionsSmartlist, ...futuresSmartlist];
            const keys = allItems.map(i => i.instrument_key);
            
            if (keys.length > 0) {
                try {
                    const token = await getAuthToken();
                    const headers = { "Accept": "application/json", "Authorization": `Bearer ${token}` };
                    
                    // Chunk keys to avoid too long URI
                    const chunkSize = 100;
                    const symbolMap = {};
                    
                    for (let i = 0; i < keys.length; i += chunkSize) {
                        const chunk = keys.slice(i, i + chunkSize);
                        const url = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(chunk.join(','))}`;
                        const quoteRes = await axios.get(url, { headers });
                        if (quoteRes.data?.data) {
                            Object.values(quoteRes.data.data).forEach(quote => {
                                if (quote.instrument_token && quote.symbol) {
                                    symbolMap[quote.instrument_token] = quote.symbol;
                                }
                            });
                        }
                    }

                    optionsSmartlist.forEach(item => {
                        item.trading_symbol = symbolMap[item.instrument_key] || item.instrument_key;
                    });
                    futuresSmartlist.forEach(item => {
                        item.trading_symbol = symbolMap[item.instrument_key] || item.instrument_key;
                    });
                } catch (err) {
                    console.error("Failed to resolve smartlist symbols via Quotes API:", err.message);
                }
            }

            cachedSmartlists = {
                options: optionsSmartlist,
                futures: futuresSmartlist
            };
            broadcast("market:smartlists", cachedSmartlists);

            // Fetch Sector Indices
            try {
                const sectorKeys = [
                    'NSE_INDEX|Nifty Bank', 'NSE_INDEX|Nifty IT', 'NSE_INDEX|Nifty Auto',
                    'NSE_INDEX|Nifty Pharma', 'NSE_INDEX|Nifty Metal', 'NSE_INDEX|Nifty FMCG',
                    'NSE_INDEX|Nifty Energy', 'NSE_INDEX|Nifty Fin Service', 'NSE_INDEX|Nifty PSE'
                ];
                const token = await getAuthToken();
                const url = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(sectorKeys.join(','))}`;
                const sectorRes = await axios.get(url, { headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` } });
                
                if (sectorRes.data?.data) {
                    const sectors = Object.values(sectorRes.data.data).map(q => ({
                        symbol: q.instrument_token ? q.instrument_token.split('|')[1] : q.symbol,
                        ltp: q.last_price,
                        change: q.net_change,
                        change_pct: (q.net_change / (q.last_price - q.net_change)) * 100
                    }));
                    cachedSectors = sectors;
                    broadcast("market:sectors", cachedSectors);
                }
            } catch (err) {
                console.error("Failed to fetch Sector indices:", err.message);
            }

            // Fetch Market News (Rotating through buckets to cover entire market)
            try {
                // Select the current bucket
                const newsKeys = TRACKING_LISTS[currentTrackingIndex];
                
                // Rotate to the next bucket for the next cycle
                currentTrackingIndex = (currentTrackingIndex + 1) % TRACKING_LISTS.length;

                const token = await getAuthToken();
                const newsUrl = `https://api.upstox.com/v2/news?category=instrument_keys&instrument_keys=${encodeURIComponent(newsKeys.join(','))}&page_size=100`;
                const newsRes = await axios.get(newsUrl, { headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` } });

                if (newsRes.data?.data) {
                    let allNews = [];
                    Object.values(newsRes.data.data).forEach(arr => {
                        if (Array.isArray(arr)) allNews.push(...arr);
                    });
                    // Deduplicate by article_link
                    const uniqueNews = Array.from(new Map(allNews.map(n => [n.article_link, n])).values());
                    // Sort descending by publish time
                    uniqueNews.sort((a, b) => b.published_time - a.published_time);
                    cachedNews = uniqueNews.slice(0, 100); // Keep top 100
                    broadcast("market:news", cachedNews);

                    // ============================================================
                    // Auto-process news into Events pipeline (zero human input)
                    // ============================================================
                    processNewsItems(cachedNews, broadcast).catch(err =>
                        console.error("[AutoProcessor] Pipeline error:", err.message)
                    );
                }
            } catch (err) {
                console.error("Failed to fetch market news:", err.message);
            }
    } catch (e) {
        console.error("Polling error:", e.message);
    }
};

export const startMarketDataPolling = () => {
    console.log("⏱️ Starting Market Data (FII/DII, Smartlists) Polling");
    
    // Poll immediately, then every 5 minutes
    forceMarketDataPoll();

    // Poll every 1 minute for near-continuous updates (Upstox does not provide WebSocket for News)
    setInterval(forceMarketDataPoll, 1 * 60 * 1000);
};
