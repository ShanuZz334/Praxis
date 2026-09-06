import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
import { saveIntelScore, loadAllIntelScores, saveAllIntelScores } from '@/shared/utils/intelCache';

// Engines
import { computeCompanyComposite, computeIndexComposite } from '../../fundamentals/engine/FundamentalCompositeEngine';
import { computeTechnicalComposite } from '../../technical/engine/TechnicalCompositeEngine';
import { useOptionsComposite } from '../../options/engine/useOptionsComposite';
import { useOptionsCompositeScore } from '../../options/engine/useOptionsCompositeScore';
import { useGlobalComposite } from '../../foreign/engine/useGlobalComposite';
import { computeInstitutionalComposite } from './masterScoringEngine';
import { FundamentalEngine } from '../../fundamentals/engine/headlessFundamentalParser';
import { useDataRegistry } from '@/shared/context/DataRegistryContext';
import { TechnicalEngine } from '../../technical/engine/headlessTechnicalParser';
import { getCompositeState } from '@/shared/global/logic/signals';
import { getIndicatorConfig, INDICATOR_CONFIG } from '@/shared/config/indicatorConfig';
import { validateRegistry } from '@/shared/utils/RegistryValidator';
import { toast } from 'sonner';
import { useManualOverrides } from '@/shared/hooks/useManualOverrides';
import { computePortfolioMetrics } from '@/shared/global/logic/eventsEngine';

const formatTitle = (str) => {
    if (!str) return '';
    return str.split('_').map(word => {
        if (word.match(/^(ema|sma|rsi|macd|pcr|adx|atr|vix|gdp|pb|pe|eps)$/i)) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
};

export function useMasterComposite(selectedInstrument, isIndex, selectedExpiry, livePrices, extraData = {}) {
    const { getMasterSnapshot, registerBulk } = useDataRegistry();
    const [loading, setLoading] = useState(true);
    
    // States for raw data
    const [rawFundamentals, setRawFundamentals] = useState(null);
    const [rawTechnicals, setRawTechnicals] = useState(null);
    const [chainData, setChainData] = useState([]);

    // L1: Pre-populate dbFallbackData from localStorage ONLY for TECH (master computes correctly).
    // FUND/OPT/GLOB must NOT be pre-loaded from localStorage — master previously wrote wrong
    // values there (37, 38, 59 from incomplete headless engines). Those stale values would
    // flash the wrong score before the 10s DB poll fills in the correct page-written values.
    const [dbFallbackData, setDbFallbackData] = useState(() => {
        if (!selectedInstrument) return {};
        const cached = loadAllIntelScores(selectedInstrument);
        const result = {};
        // TECH only: master's TechnicalEngine is complete and produces the correct score
        if (cached.technical?.score != null && !cached.technical.stale)
            result.technical = { composite_score: cached.technical.score, regime_json: cached.technical.regime };
        // FUND, OPT, GLOB, EVT: loaded from DB poll (10s) to avoid stale master-computed values
        return result;
    });

    const [globalOverrides, setGlobalOverrides] = useState({});
    const [fundState, setFundState] = useState(null);
    const [techState, setTechState] = useState(null);

    // Spot Price for options
    const baseSpotPrice = livePrices?.[selectedInstrument]?.ltp || 24000;

    
    // Engine Refs
    const fundEngineRef = useRef(new FundamentalEngine());
    const techEngineRef = useRef(new TechnicalEngine());
    const baseSpotPriceRef = useRef(baseSpotPrice);
    
    // Update baseSpotPriceRef whenever it changes
    useEffect(() => {
        baseSpotPriceRef.current = baseSpotPrice;
    }, [baseSpotPrice]);
    // Load global overrides from SQLite (replaces direct localStorage.getItem)
    useEffect(() => {
        fetch('/api/v1/overrides/global/global_macro')
            .then(r => r.json())
            .then(res => {
                if (res.status === 'success' && res.data) {
                    const loaded = {};
                    for (const [fieldKey, entry] of Object.entries(res.data)) {
                        loaded[fieldKey] = entry.value;
                    }
                    if (Object.keys(loaded).length > 0) setGlobalOverrides(loaded);
                }
            })
            .catch(() => {});
    }, []);

    const { overrides: techOverrides } = useManualOverrides('technical', selectedInstrument || 'NSE_INDEX|Nifty 50', {});
    const { overrides: fundOverrides } = useManualOverrides('fundamental', selectedInstrument || 'NSE_INDEX|Nifty 50', {});

    // ── Backend Cron → Master Dashboard Live Bridge ────────────────────────────
    // When the backend cron computes new module scores (EVT, TECH), it broadcasts
    // 'intelligence:snapshot' via socket → DashboardContext writes to intelCache localStorage
    // → dispatches 'praxis:intel:update'. We listen here and update dbFallbackData.
    // IMPORTANT: Only update TECH from localStorage — FUND/OPT/GLOB have stale master-computed
    // values in localStorage and must only be updated from the DB poll (fetchMasterData).
    useEffect(() => {
        const handleIntelUpdate = () => {
            if (!selectedInstrument) return;
            const cached = loadAllIntelScores(selectedInstrument);
            setDbFallbackData(prev => {
                const next = { ...prev };
                // TECH: master engine is authoritative — localStorage value is correct
                if (cached.technical?.score != null && !cached.technical.stale)
                    next.technical = { ...prev.technical, composite_score: cached.technical.score };
                // EVT: cron's market_events AI score is authoritative — accept from socket
                if (cached.events?.score != null && !cached.events.stale)
                    next.events = { ...prev.events, composite_score: cached.events.score };
                // FUND, OPT, GLOB: NOT updated from localStorage — stale cron/master values
                // live there. These are updated exclusively via the 10s DB poll in fetchMasterData.
                return next;
            });
        };
        window.addEventListener('praxis:intel:update', handleIntelUpdate);
        return () => window.removeEventListener('praxis:intel:update', handleIntelUpdate);
    }, [selectedInstrument]);

    useEffect(() => {
        if (techEngineRef.current) {
            techEngineRef.current.setOverrides(techOverrides);
        }
    }, [techOverrides]);

    useEffect(() => {
        if (fundEngineRef.current) {
            fundEngineRef.current.setOverrides(fundOverrides);
        }
    }, [fundOverrides]);

    // Fetch all real-time data + fallback
    useEffect(() => {
        if (!selectedInstrument) return;

        let isMounted = true;
        setLoading(true);

        // INSTANT L1 CACHE SWITCH: Immediately load the new instrument's scores from localStorage 
        // and clear the old raw data, preventing the UI from showing the previous instrument.
        const cached = loadAllIntelScores(selectedInstrument);
        const instantResult = {};
        if (cached.fundamental?.score != null && !cached.fundamental.stale) instantResult.fundamental = { composite_score: cached.fundamental.score, regime_json: cached.fundamental.regime };
        if (cached.technical?.score != null && !cached.technical.stale)     instantResult.technical   = { composite_score: cached.technical.score,   regime_json: cached.technical.regime };
        if (cached.options?.score != null && !cached.options.stale)         instantResult.options      = { composite_score: cached.options.score };
        if (cached.global?.score != null && !cached.global.stale)           instantResult.global       = { composite_score: cached.global.score };
        if (cached.events?.score != null && !cached.events.stale)           instantResult.events       = { composite_score: cached.events.score };
        
        setDbFallbackData(instantResult);
        setRawFundamentals(null);
        setRawTechnicals(null);
        setChainData([]);

        const savedTimeframe = typeof window !== 'undefined' ? (localStorage.getItem('praxis_technical_timeframe') || 'day') : 'day';

        const fetchMasterData = async () => {
            try {
                let missingLiveData = [];
                const currentLtp = livePrices?.[selectedInstrument]?.ltp || '';

                // Create promises for parallel execution
                const dbPromise = axiosInstance.get(`/api/v1/snapshots/header/${selectedInstrument}`);
                const fundPromise = axiosInstance.get(API_PATHS.FUNDAMENTALS.GET(selectedInstrument));
                const techPromise = axiosInstance.get(`/api/v1/upstox/technicals?instrument=${selectedInstrument}&timeframe=${savedTimeframe}&ltp=${currentLtp}`);
                const optPromise = selectedExpiry ? axiosInstance.get(API_PATHS.OPTIONS.GET_CHAIN(selectedInstrument, selectedExpiry)) : Promise.resolve(null);

                // Wait for all to complete simultaneously
                const [dbRes, fundRes, techRes, optRes] = await Promise.allSettled([dbPromise, fundPromise, techPromise, optPromise]);

                // 1. Fetch Fallback DB State — SMART MERGE (never overwrite live engine scores)
                // The live FundamentalEngine and TechnicalEngine compute authoritative scores.
                // We only use the DB value for a module when the live engine has nothing yet.
                // For OPT/GLOB/EVT there are no live engines on the Master Dashboard —
                // those always come from the DB (backend cron) or socket.
                if (dbRes.status === 'fulfilled' && dbRes.value?.data?.status === 'success' && dbRes.value?.data?.data) {
                    const dbData = dbRes.value.data.data;
                    if (isMounted) {
                        setDbFallbackData(prev => {
                            const merged = { ...prev };
                            // FUND: only use DB value if it's positive (backend cron may produce 0) AND live engine hasn't resolved yet
                            if (dbData.fundamental?.composite_score > 0)
                                merged.fundamental = dbData.fundamental;
                            // TECH: only use DB value if it's positive AND live engine hasn't resolved yet
                            if (dbData.technical?.composite_score > 0)
                                merged.technical = dbData.technical;
                            // OPT/GLOB/EVT: no live engines — always accept DB values if they're valid
                            if (dbData.options?.composite_score != null)
                                merged.options = dbData.options;
                            if (dbData.global?.composite_score != null)
                                merged.global = dbData.global;
                            if (dbData.events?.composite_score != null)
                                merged.events = dbData.events;
                            return merged;
                        });
                    }
                } else if (dbRes.status === 'rejected') {
                    console.error("Failed to fetch fallback header state", dbRes.reason);
                }

                // 2. Fetch Live Fundamentals — feed directly into the FundamentalEngine
                // The engine has its own poll() loop but if that silently fails (e.g. token expired),
                // fundState never updates. Here we bypass the engine's own poll by directly
                // calling parse+publish with the data we already fetched in this cycle.
                if (fundRes.status === 'fulfilled' && (fundRes.value?.data?.success || fundRes.value?.data?.status === 'success') && fundRes.value?.data?.data) {
                    const fundData = fundRes.value.data.data;
                    if (isMounted) {
                        setRawFundamentals(fundData);
                        // Directly parse + publish so fundState is always up to date
                        // regardless of whether the engine's own poll succeeded
                        const engine = fundEngineRef.current;
                        if (engine) {
                            engine.lastRawData = fundData;
                            engine.parse(fundData, engine.manualOverrides || {});
                            engine.publish();
                        }
                    }
                    if (fundRes.value.data.fallback) missingLiveData.push('Fundamentals');
                } else {
                    console.error("Live fundamentals failed, relying on DB", fundRes.reason || 'Missing data');
                    missingLiveData.push('Fundamentals');
                }

                // 3. Fetch Live Technicals
                if (techRes.status === 'fulfilled' && (techRes.value?.data?.success || techRes.value?.data?.status === 'success') && techRes.value?.data?.data) {
                    if (isMounted) setRawTechnicals(techRes.value.data.data);
                    if (techRes.value.data.fallback) missingLiveData.push('Technicals');
                } else {
                    console.error("Live technicals failed, relying on DB", techRes.reason || 'Missing data');
                    missingLiveData.push('Technicals');
                }

                // 4. Fetch Live Options Chain
                if (selectedExpiry) {
                    if (optRes.status === 'fulfilled' && optRes.value?.data) {
                        const chainArray = optRes.value.data?.data || optRes.value.data || [];
                        if (Array.isArray(chainArray) && chainArray.length > 0 && isMounted) {
                            const normalized = chainArray.map(c => ({
                                strike: c.strike_price,
                                iv: 0,
                                call: {
                                    oi: parseFloat(c.call_options?.market_data?.oi) || 0,
                                    vol: parseFloat(c.call_options?.market_data?.volume) || 0,
                                    delta: 0, gamma: 0, theta: 0, vega: 0
                                },
                                put: {
                                    oi: parseFloat(c.put_options?.market_data?.oi) || 0,
                                    vol: parseFloat(c.put_options?.market_data?.volume) || 0,
                                    delta: 0, gamma: 0, theta: 0, vega: 0
                                }
                            }));
                            setChainData(normalized);
                            if (optRes.value.data?.fallback) missingLiveData.push('Options');
                        }
                    } else if (optRes.status === 'rejected') {
                        console.error("Live options failed, relying on DB", optRes.reason);
                        missingLiveData.push('Options');
                    }
                }

                // Silently log if fallback is used for any critical module instead of spamming toasts every 10s
                if (missingLiveData.length > 0 && isMounted) {
                    console.warn(`Live data unavailable for: ${missingLiveData.join(', ')}. Using previous snapshot.`);
                }

            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchMasterData();
        
        // Master Dashboard doesn't need 1s polling, 10s is sufficient for high-level composite
        const intervalId = setInterval(fetchMasterData, 10000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [selectedInstrument, selectedExpiry, isIndex]);

    // Engine Lifecycles
    useEffect(() => {
        if (!selectedInstrument) return;

        const fEngine = fundEngineRef.current;
        const tEngine = techEngineRef.current;

        fEngine.start(selectedInstrument, {
            registerBulk,
            initialOverrides: fundOverrides,
            onUpdate: (state) => setFundState({ ...state })
        });

        tEngine.start(selectedInstrument, {
            registerBulk,
            getLtp: () => baseSpotPriceRef.current,
            initialOverrides: techOverrides,
            onUpdate: (state) => setTechState({ ...state })
        });

        return () => {
            fEngine.stop();
            tEngine.stop();
        };
    }, [selectedInstrument, registerBulk]);

    // ------------------------------------------------------------------------
    // Engine State Mappers (Transforms raw parser states into composite results)
    // ------------------------------------------------------------------------
    const fundEngine = fundState ? { 
        cardScores: fundState.scores,
        ...(isIndex ? computeIndexComposite(fundState.scores, extraData.tradingMode) : computeCompanyComposite(fundState.scores, extraData.tradingMode))
    } : null;
    const techEngine = techState ? { 
        cardScores: techState.scores,
        ...computeTechnicalComposite(techState.scores, isIndex, extraData.tradingMode)
    } : null;
    const headlessFundCards = fundState?.cards || [];
    const headlessTechCards = techState?.cards || [];


    // Options Engine (Hooks)
    const optionsMetrics = useOptionsComposite(chainData, baseSpotPrice, selectedInstrument, selectedExpiry);
    const optionsEngine = useOptionsCompositeScore(optionsMetrics, selectedInstrument, null, null, null, true); // disableSync=true

    // Global Engine (Hooks)
    const globalLiveData = useMemo(() => {
        const g = extraData.globalData || {}; // { dxy: { value, hi52, lo52, pctChange }, crude: {...}, ... }
        const v = (key) => g[key]?.value ?? null;
        return {
            dxy:            livePrices?.['GLOBAL_INDICATOR|DXY']?.ltp     || v('dxy'),
            usd_inr:        livePrices?.['GLOBAL_INDICATOR|USDINR']?.ltp  || v('usd_inr'),
            crude:          livePrices?.['GLOBAL_INDICATOR|BZUSD']?.ltp   || v('crude'),
            gold:           livePrices?.['GLOBAL_INDICATOR|GOLD']?.ltp    || v('gold'),
            silver:         livePrices?.['GLOBAL_INDICATOR|SILV']?.ltp    || v('silver'),
            us_10y_yield:   livePrices?.['GLOBAL_INDICATOR|US10Y']?.ltp   || v('us_10y_yield'),
            sp_futures:     livePrices?.['GLOBAL_INDICATOR|ES1']?.ltp     || v('sp_futures'),
            nasdaq_futures: livePrices?.['GLOBAL_INDICATOR|NQ1']?.ltp     || v('nasdaq_futures'),
            dow_futures:    livePrices?.['GLOBAL_INDICATOR|YM1']?.ltp     || v('dow_futures'),
            vix:            livePrices?.['GLOBAL_INDICATOR|VIX']?.ltp     || v('vix'),
            bitcoin:        livePrices?.['GLOBAL_INDICATOR|BTCUSD']?.ltp  || v('bitcoin'),
            eurusd:         livePrices?.['GLOBAL_INDICATOR|EURUSD']?.ltp  || v('eurusd'),
            usdjpy:         livePrices?.['GLOBAL_INDICATOR|USDJPY']?.ltp  || v('usdjpy'),
            nikkei:         livePrices?.['GLOBAL_INDICATOR|NIY']?.ltp     || v('nikkei'),
            ftse:           livePrices?.['GLOBAL_INDICATOR|Z1']?.ltp      || v('ftse'),
            dax:            livePrices?.['GLOBAL_INDICATOR|FDAX']?.ltp    || v('dax'),
            hangseng:       livePrices?.['GLOBAL_INDICATOR|HSI']?.ltp     || v('hangseng'),
            shanghai:       livePrices?.['GLOBAL_INDICATOR|SSEC']?.ltp    || v('shanghai'),
            cac40:          livePrices?.['GLOBAL_INDICATOR|FCE']?.ltp     || v('cac40'),
            eurostoxx:      livePrices?.['GLOBAL_INDICATOR|FESX']?.ltp    || v('eurostoxx'),
            copper:         livePrices?.['GLOBAL_INDICATOR|HG1']?.ltp     || v('copper'),
            natgas:         livePrices?.['GLOBAL_INDICATOR|NG1']?.ltp     || v('natgas'),
            wheat:          livePrices?.['GLOBAL_INDICATOR|ZW1']?.ltp     || v('wheat'),
            aluminum:       livePrices?.['GLOBAL_INDICATOR|ALI1']?.ltp    || v('aluminum'),
            move:           livePrices?.['GLOBAL_INDICATOR|MOVE']?.ltp    || v('move'),
        };
    }, [livePrices, extraData.globalData]);
    
    const globalEngine = useGlobalComposite(globalOverrides, globalLiveData, {}, extraData.tradingMode, true); // disableSync=true

    // EVT: Compute live from marketNews (from DashboardContext socket feed)
    const evtLiveScore = useMemo(() => {
        const news = extraData.marketNews;
        if (!Array.isArray(news) || news.length === 0) return null;
        const tradingMode = extraData.tradingMode || 'swing';
        try {
            const metrics = computePortfolioMetrics(news, tradingMode);
            return metrics?.compositeScore != null ? Math.round(metrics.compositeScore) : null;
        } catch { return null; }
    }, [extraData.marketNews, extraData.tradingMode]);

    // Final Aggregation
    const masterScores = useMemo(() => {
        // Guard helper: treat 0 and null as absent — both mean "no real data yet"
        const validScore = (v) => (v != null && v > 0) ? v : null;

        // Time-aware freshness check: if DB is older than 60 mins, prefer LIVE engine computation
        const isFresh = (dbItem) => {
            if (!dbItem || !dbItem.updated_at) return false;
            let dateStr = dbItem.updated_at;
            // Handle SQLite CURRENT_TIMESTAMP (YYYY-MM-DD HH:MM:SS) vs ISO strings
            if (!dateStr.includes('T') && !dateStr.includes('Z')) dateStr = dateStr.replace(' ', 'T') + 'Z';
            const dbDate = new Date(dateStr);
            return ((Date.now() - dbDate.getTime()) / 60000) < 60;
        };

        const getBestScore = (dbItem, engineScore) => {
            const dbScore = validScore(dbItem?.composite_score);
            const liveScore = validScore(engineScore);
            // 1. If DB is fresh and valid, use it (it's the authoritative score from individual pages)
            if (isFresh(dbItem) && dbScore) return dbScore;
            // 2. Otherwise, if we have a live computation, use it (better to be slightly off than ancient)
            if (liveScore) return liveScore;
            // 3. Fallback to stale DB score if nothing else exists
            return dbScore ?? null;
        };

        // FUND: Headless parser is incomplete (37 vs 52), but live 37 is better than a stale DB 20 from weeks ago.
        const fundScore = getBestScore(dbFallbackData?.fundamental, fundEngine?.compositeScore);

        // TECH: ENGINE-FIRST always (parser is 100% complete)
        const rawTechScore = techEngine?.compositeScore;
        const techScore = (rawTechScore != null && rawTechScore > 0)
            ? rawTechScore
            : validScore(dbFallbackData?.technical?.composite_score) ?? null;

        // OPT: DB-FIRST if fresh (51 vs 38 due to expiry differences), otherwise live engine
        const optScore = getBestScore(dbFallbackData?.options, optionsEngine?.compositeScore);

        // GLOB: DB-FIRST if fresh (52 vs 59), otherwise live engine
        const globScore = getBestScore(dbFallbackData?.global, globalEngine?.compositeScore);
        // EVT: backend cron uses AI-enriched market_events (authoritative). evtLiveScore uses
        // raw Upstox news which is noisier and scores differently. 
        // DB-FIRST if fresh, otherwise live engine.
        const evtScore = getBestScore(dbFallbackData?.events, evtLiveScore);

        // L1 Cache: Only persist scores that this master actually computed correctly.
        // DO NOT write FUND or OPT — the master's headless engines produce wrong values for those
        // and would poison the cache, overwriting the correct values the actual pages wrote.
        if (selectedInstrument) {
            // TECH: master engine is correct and authoritative (same parser as Technical page)
            if (techScore != null && techScore > 0) saveIntelScore('tech', selectedInstrument, techScore, techEngine?.regime?.label, 'live');
            // EVT: only save if we got a real value from DB (not the raw news fallback)
            if (dbFallbackData?.events?.composite_score != null && dbFallbackData.events.composite_score > 0)
                saveIntelScore('evt', 'GLOBAL', dbFallbackData.events.composite_score, null, 'live');
            // NOTE: FUND, OPT, GLOB are NOT written here — master's headless engines compute
            // with different/incomplete data. The individual pages are authoritative via useAiSync.
        }

        const scores = [
            { id: 'fundamental', label: 'FUND', rawScore: fundScore },
            { id: 'technical',   label: 'TECH', rawScore: techScore },
            { id: 'options',     label: 'OPT',  rawScore: optScore },
            { id: 'events',      label: 'EVT',  rawScore: evtScore },
            { id: 'global',      label: 'GLOB', rawScore: globScore }
        ];


        const validScores = scores.filter(s => s.rawScore !== null && !isNaN(s.rawScore) && s.rawScore > 0);
        
        const moduleScoreMap = { TECH: techScore, OPT: optScore, FUND: fundScore, GLOB: globScore, EVT: evtScore };
        const institutionalData = computeInstitutionalComposite(moduleScoreMap, extraData);
        let praxisComposite = institutionalData.compositeScore;

        const getNormalized = (score) => {
            if (score > 70) return 1;
            if (score < 30) return -1;
            return 0;
        };

        const sectionsForHeader = scores.map(s => ({
            id: s.id,
            name: s.label, // Added name so AiInsightSection can resolve it
            module: s.label,
            shortLabel: s.label,
            normalized: s.rawScore ? getNormalized(s.rawScore) : 0,
            credit: 5,
            creditAllocation: s.rawScore ? (s.rawScore / 100) * 5 : 0,
            score: s.rawScore || 0
        }));

        // Tailwinds and Risks will be computed algorithmically later

        const parseEngineCounts = (engineRawScores, engineName) => {
            if (!engineRawScores || Object.keys(engineRawScores).length === 0) return null;
            let credits = 0;
            let bulls = 0;
            let bears = 0;
            let neutrals = 0;
            let missing = 0;
            const cards = [];

            Object.entries(engineRawScores).forEach(([id, score]) => {
                // If it's literally null/undef or not a number or is the placeholder string
                if (score === null || score === undefined || isNaN(score) || score === '--') {
                    missing++;
                    return;
                }
                const config = getIndicatorConfig(id);
                const credit = config?.creditScore ?? 5;
                credits += credit;
                
                let normalized = 0;
                if (score > 70) { bulls++; normalized = 1; }
                else if (score < 30) { bears++; normalized = -1; }
                else { neutrals++; normalized = 0; }

                cards.push({
                    id,
                    module: config?.title || formatTitle(config?.id) || formatTitle(id),
                    normalized,
                    credit,
                    engine: engineName,
                    score: Number(score)
                });
            });

            return { totalCredits: credits, bulls, bears, neutrals, missing, cards };
        };

        // Aggregate Signal Counts and Credits from Live Engines AND DB Fallback
        let totalCredits = 0;
        let totalBulls = 0;
        let totalBears = 0;
        let totalNeutrals = 0;
        let aggregatedCards = [];

        const safeMerge = (fallback, live) => {
            const result = { ...(fallback || {}) };
            if (live) {
                Object.entries(live).forEach(([k, v]) => {
                    if (v !== null && v !== undefined && !isNaN(v) && v !== '--') {
                        result[k] = v;
                    }
                });
            }
            return result;
        };

        const mergedTech = safeMerge(dbFallbackData?.technical?.counts, techEngine?.cardScores);
        const mergedFund = safeMerge(dbFallbackData?.fundamental?.counts, fundEngine?.rawScores);
        const mergedOpt = safeMerge(dbFallbackData?.options?.counts, optionsEngine?.cardScores);

        const activeCounts = {
            fundamental: parseEngineCounts(mergedFund, 'FUND'),
            technical: parseEngineCounts(mergedTech, 'TECH'),
            options: parseEngineCounts(mergedOpt, 'OPT'),
            global: parseEngineCounts(Object.fromEntries(Object.entries(globalEngine?.cardData || {}).map(([k, v]) => [k, v?.score])), 'GLOB', globalEngine?.cards) || dbFallbackData?.global?.counts,
            events: dbFallbackData?.events?.counts
        };

        Object.entries(activeCounts).forEach(([engineName, counts]) => {
            if (counts) {
                // Prevent 'events' engine from blowing out R CREDITS, because its 'totalCredits' is actually the raw mathematical NLP Total Weight.
                if (engineName !== 'events') {
                    totalCredits += counts.totalCredits || 0;
                }
                totalBulls += counts.bulls || 0;
                totalBears += counts.bears || 0;
                totalNeutrals += counts.neutrals || 0;
                
                const engineTagMap = { fundamental: 'FUND', technical: 'TECH', options: 'OPT', global: 'GLOB', events: 'EVT' };
                const engineTag = engineTagMap[engineName] || engineName.substring(0, 4).toUpperCase();

                if (counts.cards && Array.isArray(counts.cards)) {
                    aggregatedCards = aggregatedCards.concat(counts.cards);
                } else {
                    // Fallback for modules that don't have detailed card structures yet
                    aggregatedCards.push(...Array(counts.bulls || 0).fill({ normalized: 1, module: `${engineTag} Signal`, engine: engineTag }));
                    aggregatedCards.push(...Array(counts.bears || 0).fill({ normalized: -1, module: `${engineTag} Signal`, engine: engineTag }));
                    aggregatedCards.push(...Array(counts.neutrals || 0).fill({ normalized: 0, module: `${engineTag} Signal`, engine: engineTag }));
                }
            }
        });
        // Total missing is calculated dynamically after the missingBreakdown generation.

        // Compute missing breakdown
        const activeIds = new Set(aggregatedCards.map(c => c.id));
        const activeTitles = new Set(aggregatedCards.map(c => c.module));
        const missingBreakdown = {};
        Object.entries(INDICATOR_CONFIG).forEach(([id, config]) => {
            const title = config.title || formatTitle(config.id) || formatTitle(id);
            if (!activeIds.has(id) && !activeTitles.has(title)) {
                let skip = false;
                // Index-specific exclusions for Technicals
                if (isIndex && ['cmf', 'volume_sma', 'obv', 'vwap'].includes(id)) skip = true;
                if (!isIndex && ['breadth_ratio', 'mcclellan', 'ad_line', 'nh_nl', 'trin'].includes(id)) skip = true;
                
                // Index-specific exclusions for Fundamentals
                const fundIndexOnly = ['advance_decline', 'sector_dashboard', 'india_vix', 'mcap_gdp', 'nifty_pe', 'nifty_pb'];
                const fundStockOnly = ['forward_pe', 'ev_ebitda', 'earnings_yield', 'relative_valuation', 'earnings_trend', 'revenue_growth', 'profit_growth', 'roe', 'roce', 'roa', 'net_margin', 'operating_margin', 'debt_to_equity', 'interest_coverage', 'free_cash_flow', 'current_ratio', 'promoter_holding', 'smart_money_flow', 'earnings_quality', 'peer_comparison', 'analyst_consensus', 'corporate_actions', 'cash_conversion'];
                
                if (isIndex && fundStockOnly.includes(id)) skip = true;
                if (!isIndex && fundIndexOnly.includes(id)) skip = true;
                
                if (!skip) {
                    let engine = 'MISC';
                    const cat = config.category || '';
                    const str = id.toLowerCase();
                    
                    // Strict Exact Matches for Global Dashboard (25 Cards)
                    const GLOB_CARDS = ['dxy', 'usd_inr', 'crude', 'brent_crude_oil', 'gold', 'silver', 'us_10y_yield', 'sp_futures', 'nasdaq_futures', 'dow_futures', 'vix', 'bitcoin', 'eurusd', 'usdjpy', 'nikkei', 'ftse', 'dax', 'hangseng', 'shanghai', 'cac40', 'eurostoxx', 'copper', 'natgas', 'wheat', 'aluminum', 'move'];

                    if (GLOB_CARDS.includes(str)) engine = 'GLOB';
                    else if (str.includes('atm_iv') || str.includes('iv_rank') || str.includes('iv_percentile') || str.includes('pcr') || str.includes('max_pain') || str.match(/oi|delta|gamma|theta|vega/)) engine = 'OPT';
                    else if (cat.includes('Technical') || cat.includes('Oscillator') || str.match(/sma|ema|rsi|macd|bollinger|bb_|kc|adx|atr|vwap|obv|stoch|supertrend|cmf|trendline|pivot|fibonacci|breadth|mcclellan|ad_line|nh_nl|trin/)) engine = 'TECH';
                    else engine = 'FUND'; 

                    missingBreakdown[`${engine}||${title}`] = 1;
                }
            }
        });

        // The total missing number MUST dynamically match the length of the breakdown list!
        const totalMissing = Object.keys(missingBreakdown).length;

        // ==========================================
        // INSTITUTIONAL MASTER DRIVER ALGORITHM (SECTION LEVEL)
        // ==========================================
        const rankedSections = [];

        // 1. Gather all macro sections from the live engines
        const extractSections = (engineType, fallbackTree) => {
            if (fallbackTree && Array.isArray(fallbackTree.engines) && fallbackTree.engines.length > 0) {
                return fallbackTree.engines[0].sections || [];
            }
            return [];
        };

        const engineSections = [
            { engine: 'FUND', sections: fundEngine?.sections || extractSections('FUND', dbFallbackData?.fundamental?.tree_payload) },
            { engine: 'TECH', sections: techEngine?.sections || extractSections('TECH', dbFallbackData?.technical?.tree_payload) },
            { engine: 'OPT',  sections: optionsEngine?.sections || extractSections('OPT', dbFallbackData?.options?.tree_payload) }
        ];

        engineSections.forEach(({ engine, sections }) => {
            if (!Array.isArray(sections)) return;
            sections.forEach(sec => {
                if (sec.score === null || sec.score === undefined || isNaN(sec.score)) return;
                const deviation = sec.score - 50;
                let weight = sec.weight || 15; 
                // Native engine section weights are mixed between 0.15 and 15
                if (weight <= 1) weight = weight * 100;
                const strength = deviation * weight;
                rankedSections.push({
                    id: sec.id || sec.name,
                    label: sec.label || sec.name || sec.shortLabel || formatTitle(sec.id),
                    value: sec.score,
                    strength,
                    engine: engine
                });
            });
        });

        // 2. Treat Global and Events entire dashboards as Macro Sections
        const addMacroSection = (engineName, score, weight = 25) => {
            if (score === null || score === undefined || isNaN(score)) return;
            const deviation = score - 50;
            const strength = deviation * weight;
            rankedSections.push({
                id: engineName.toLowerCase(),
                label: engineName === 'GLOB' ? 'Global Macro' : 'Catalysts & Events',
                value: score,
                strength,
                engine: engineName
            });
        };
        
        // Use live scores from validScores if available, else DB fallback
        const globRaw = validScores.find(s => s.id === 'global')?.rawScore;
        
        addMacroSection('GLOB', globRaw);
        // Exclude Events from Top Tailwinds/Headwinds aggregation as per user request

        // 3. Sort by Absolute Macro Strength
        rankedSections.sort((a, b) => b.strength - a.strength);

        // Top 3 Tailwinds
        const allTailwinds = rankedSections
            .filter(r => r.strength > 0 && r.value >= 60) // Must be bullish
            .slice(0, 3)
            .map(r => ({
                id: r.id,
                label: r.label,
                value: Math.round(r.value),
                sub: `Impact Score: ${(r.strength / 100).toFixed(1)}x · [${r.engine}]`
            }));

        // Bottom 3 Risks
        const allRisks = [...rankedSections]
            .filter(r => r.strength < 0 && r.value <= 40) // Must be bearish
            .sort((a, b) => a.strength - b.strength) // Sort ascending for risks (most negative first)
            .slice(0, 3)
            .map(r => ({
                id: r.id,
                label: r.label,
                value: Math.round(r.value),
                sub: `Impact Score: ${(Math.abs(r.strength) / 100).toFixed(1)}x · [${r.engine}]`
            }));

        const systemRegime = getCompositeState(Math.round(praxisComposite));

        const activeModulesCount = validScores.length;
        const maxModules = 5;
        const coveragePercent = Math.round((activeModulesCount / maxModules) * 100);

        const integrity = {
            coverageText: `${activeModulesCount}/${maxModules}`,
            coveragePercent,
            missingCards: totalMissing,
            missingBreakdown,
            source: "Live Engines + DB Cache"
        };

        return {
            praxisComposite: Math.round(praxisComposite),
            modifierImpact: institutionalData.modifierImpact,
            moduleScores: scores,
            sectionsForHeader,
            tailwinds: allTailwinds,
            risks: allRisks,
            totalCredits,
            aggregatedCards,
            nestedTreePayload: {
                engines: validScores.map(vs => {
                    const engineData = engineSections.find(es => {
                        if (vs.id === 'fundamental') return es.engine === 'FUND';
                        if (vs.id === 'technical') return es.engine === 'TECH';
                        if (vs.id === 'options') return es.engine === 'OPT';
                        return false;
                    });
                    return {
                        name: formatTitle(vs.id),
                        score: vs.rawScore,
                        sections: engineData ? engineData.sections.map(s => ({
                            name: s.name || s.label || s.shortLabel || formatTitle(s.id),
                            score: s.score,
                            cards: [] // We don't have individual cards at the master level nested tree to save space, backend can summarize sections
                        })) : []
                    };
                })
            },
            regime: {
                label: systemRegime.label,
                description: `Aggregated from ${validScores.length} active Praxis modules.`,
                confidence: Math.round((validScores.length / 5) * 100),
                color: systemRegime.color
            },
            integrity
        };

    }, [fundEngine, techEngine, optionsEngine, globalEngine, dbFallbackData, selectedInstrument, evtLiveScore, isIndex]);

    const refresh = useCallback(async () => {
        if (!selectedInstrument) return;
        setLoading(true);
        const savedTimeframe = typeof window !== 'undefined' ? (localStorage.getItem('praxis_technical_timeframe') || 'day') : 'day';
        const currentLtp = baseSpotPriceRef.current || '';

        try {
            // Parallel fetch: DB header + fundamentals + technicals
            const [dbRes, fundRes, techRes] = await Promise.allSettled([
                axiosInstance.get(`/api/v1/snapshots/header/${selectedInstrument}`),
                axiosInstance.get(API_PATHS.FUNDAMENTALS.GET(selectedInstrument)),
                axiosInstance.get(`/api/v1/upstox/technicals?instrument=${selectedInstrument}&timeframe=${savedTimeframe}&ltp=${currentLtp}`)
            ]);

            // 1. DB fallback — SMART MERGE (same logic as fetchMasterData)
            if (dbRes.status === 'fulfilled' && dbRes.value?.data?.status === 'success' && dbRes.value?.data?.data) {
                const dbData = dbRes.value.data.data;
                setDbFallbackData(prev => {
                    const merged = { ...prev };
                    if (dbData.fundamental?.composite_score > 0)   merged.fundamental = dbData.fundamental;
                    if (dbData.technical?.composite_score > 0)     merged.technical   = dbData.technical;
                    if (dbData.options?.composite_score  != null)  merged.options     = dbData.options;
                    if (dbData.global?.composite_score   != null)  merged.global      = dbData.global;
                    if (dbData.events?.composite_score   != null)  merged.events      = dbData.events;
                    return merged;
                });
            }

            // 2. Fundamentals — feed directly into engine (same as fetchMasterData)
            if (fundRes.status === 'fulfilled' && (fundRes.value?.data?.success || fundRes.value?.data?.status === 'success') && fundRes.value?.data?.data) {
                const fundData = fundRes.value.data.data;
                setRawFundamentals(fundData);
                const engine = fundEngineRef.current;
                if (engine) {
                    engine.lastRawData = fundData;
                    engine.parse(fundData, engine.manualOverrides || {});
                    engine.publish();
                }
            }

            // 3. Technicals — feed directly into engine
            if (techRes.status === 'fulfilled' && (techRes.value?.data?.success || techRes.value?.data?.status === 'success') && techRes.value?.data?.data) {
                setRawTechnicals(techRes.value.data.data);
                if (techEngineRef.current) techEngineRef.current.poll();
            }

            // 4. Options
            if (selectedExpiry) {
                try {
                    const optRes = await axiosInstance.get(API_PATHS.OPTIONS.GET_CHAIN(selectedInstrument, selectedExpiry));
                    if (optRes.data?.success) {
                        setChainData(optRes.data.data?.chain || []);
                    }
                } catch { /* options are optional */ }
            }
        } finally {
            setLoading(false);
        }
    }, [selectedInstrument, selectedExpiry]);

    return { ...masterScores, loading, headlessFundCards, headlessTechCards, refresh };
}
