import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
import socket from '@/shared/utils/socket';
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
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
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

const resolveCardRegistryEntry = (id) => {
    if (!id) return null;
    if (CARD_REGISTRY[id]) return CARD_REGISTRY[id];
    for (const card of Object.values(CARD_REGISTRY)) {
        if (card.legacyIds && card.legacyIds.includes(id)) return card;
        if (card.aliases && card.aliases.includes(id)) return card;
    }
    return null;
};

const resolveCardTitle = (id, config) => {
    const regEntry = resolveCardRegistryEntry(id);
    return regEntry?.displayName || config?.title || formatTitle(config?.id) || formatTitle(id);
};

export function useMasterComposite(selectedInstrument, isIndex, selectedExpiry, livePrices, extraData = {}) {
    const { getMasterSnapshot, registerBulk } = useDataRegistry();
    const [loading, setLoading] = useState(true);
    
    // States for raw data
    const [rawFundamentals, setRawFundamentals] = useState(null);
    const [rawTechnicals, setRawTechnicals] = useState(null);
    const [chainData, setChainData] = useState([]);

    // L1: Pre-populate dbFallbackData from localStorage across all modules.
    // Dedicated pages (useAiSync) and backend cron now authoritatively write to intelCache.
    const [dbFallbackData, setDbFallbackData] = useState(() => {
        if (!selectedInstrument) return {};
        const cached = loadAllIntelScores(selectedInstrument);
        const result = {};
        if (cached.technical?.score != null && !cached.technical.stale)
            result.technical = { composite_score: cached.technical.score, regime_json: cached.technical.regime };
        if (cached.fundamental?.score != null && !cached.fundamental.stale)
            result.fundamental = { composite_score: cached.fundamental.score, regime_json: cached.fundamental.regime };
        if (cached.options?.score != null && !cached.options.stale)
            result.options = { composite_score: cached.options.score };
        if (cached.global?.score != null && !cached.global.stale)
            result.global = { composite_score: cached.global.score, regime_json: cached.global.regime };
        if (cached.events?.score != null && !cached.events.stale)
            result.events = { composite_score: cached.events.score };
        return result;
    });

    const [globalOverrides, setGlobalOverrides] = useState({});
    const [fundState, setFundState] = useState(null);
    const [techState, setTechState] = useState(null);

    // Spot Price for options
    const baseSpotPrice = livePrices?.[selectedInstrument]?.ltp || (isIndex ? (selectedInstrument?.includes('Bank') ? 51000 : 24000) : 2500);

    
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
    const { overrides: fundOverrides } = useManualOverrides('fundamentals', selectedInstrument || 'NSE_INDEX|Nifty 50', {});

    // ── Backend Cron → Master Dashboard Live Bridge ────────────────────────────
    // When the backend cron computes new module scores (EVT, TECH), it broadcasts
    // 'intelligence:snapshot' via socket → DashboardContext writes to intelCache localStorage
    // → dispatches 'praxis:intel:update'. We listen here and update dbFallbackData.
    // IMPORTANT: Only update TECH from localStorage — FUND/OPT/GLOB have stale master-computed
    // values in localStorage and must only be updated from the DB poll (fetchMasterData).
    useEffect(() => {
        const handleIntelUpdate = (e) => {
            if (!selectedInstrument) return;
            const detail = e?.detail;
            const targetKey = detail?.instrument_key;

            // Strictly guard against cross-instrument score pollution
            const isMatch = targetKey === selectedInstrument;
            const isGlobalMacro = targetKey === 'GLOBAL' || targetKey === 'EVENTS';

            // If this socket broadcast belongs to a different stock/index, DO NOT overwrite current dashboard scores!
            if (detail && !isMatch && !isGlobalMacro) {
                return;
            }

            const cached = loadAllIntelScores(selectedInstrument);
            setDbFallbackData(prev => {
                const next = { ...prev };
                const nowIso = new Date().toISOString();
                
                // If detail has direct payload from socket, prioritize it because it contains full counts/tailwinds/risks!
                if (detail) {
                    if (isMatch && detail.technical?.composite_score != null) {
                        next.technical = {
                            ...prev.technical,
                            composite_score: detail.technical.composite_score,
                            regime_json: typeof detail.technical.regime === 'object' ? detail.technical.regime : { label: detail.technical.regime },
                            counts: detail.technical.counts || prev.technical?.counts,
                            tailwinds_json: detail.technical.tailwinds || prev.technical?.tailwinds_json,
                            risks_json: detail.technical.risks || prev.technical?.risks_json,
                            updated_at: nowIso
                        };
                    }
                    if (isMatch && detail.options?.composite_score != null) {
                        next.options = {
                            ...prev.options,
                            composite_score: detail.options.composite_score,
                            regime_json: typeof detail.options.regime === 'object' ? detail.options.regime : { label: detail.options.regime },
                            counts: detail.options.counts || prev.options?.counts,
                            tailwinds_json: detail.options.tailwinds || prev.options?.tailwinds_json,
                            risks_json: detail.options.risks || prev.options?.risks_json,
                            updated_at: nowIso
                        };
                    }
                    if ((isMatch || isGlobalMacro) && detail.global?.composite_score != null) {
                        next.global = {
                            ...prev.global,
                            composite_score: detail.global.composite_score,
                            regime_json: typeof detail.global.regime === 'object' ? detail.global.regime : { label: detail.global.regime },
                            counts: detail.global.counts || prev.global?.counts,
                            tailwinds_json: detail.global.tailwinds || prev.global?.tailwinds_json,
                            risks_json: detail.global.risks || prev.global?.risks_json,
                            updated_at: nowIso
                        };
                    }
                    if ((isMatch || isGlobalMacro) && detail.events?.composite_score != null) {
                        next.events = {
                            ...prev.events,
                            composite_score: detail.events.composite_score,
                            regime_json: typeof detail.events.regime === 'object' ? detail.events.regime : { label: detail.events.regime },
                            counts: detail.events.counts || prev.events?.counts,
                            tailwinds_json: detail.events.tailwinds || prev.events?.tailwinds_json,
                            risks_json: detail.events.risks || prev.events?.risks_json,
                            updated_at: nowIso
                        };
                    }
                    if (isMatch && detail.fundamental?.composite_score != null) {
                        next.fundamental = {
                            ...prev.fundamental,
                            composite_score: detail.fundamental.composite_score,
                            regime_json: typeof detail.fundamental.regime === 'object' ? detail.fundamental.regime : { label: detail.fundamental.regime },
                            counts: detail.fundamental.counts || prev.fundamental?.counts,
                            tailwinds_json: detail.fundamental.tailwinds || prev.fundamental?.tailwinds_json,
                            risks_json: detail.fundamental.risks || prev.fundamental?.risks_json,
                            updated_at: nowIso
                        };
                    }
                    return next;
                }

                // Fallback to localStorage if no socket detail (strictly only TECH and EVENTS — FUND/OPT/GLOB must come from DB poll)
                if (cached.technical?.score != null && !cached.technical.stale)
                    next.technical = { ...prev.technical, composite_score: cached.technical.score, regime_json: cached.technical.regime, updated_at: nowIso };
                
                if (cached.events?.score != null && !cached.events.stale)
                    next.events = { ...prev.events, composite_score: cached.events.score, updated_at: nowIso };
                
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
        const nowIso = new Date().toISOString();
        if (cached.fundamental?.score != null && !cached.fundamental.stale) instantResult.fundamental = { composite_score: cached.fundamental.score, regime_json: cached.fundamental.regime, updated_at: nowIso };
        if (cached.technical?.score != null && !cached.technical.stale)     instantResult.technical   = { composite_score: cached.technical.score,   regime_json: cached.technical.regime, updated_at: nowIso };
        if (cached.options?.score != null && !cached.options.stale)         instantResult.options      = { composite_score: cached.options.score, updated_at: nowIso };
        if (cached.global?.score != null && !cached.global.stale)           instantResult.global       = { composite_score: cached.global.score, updated_at: nowIso };
        if (cached.events?.score != null && !cached.events.stale)           instantResult.events       = { composite_score: cached.events.score, updated_at: nowIso };
        
        setDbFallbackData(instantResult);
        setRawFundamentals(null);
        setRawTechnicals(null);
        setChainData([]);

        const savedTimeframe = typeof window !== 'undefined' ? (localStorage.getItem('praxis_technical_timeframe') || 'day') : 'day';

        const fetchMasterData = async () => {
            try {
                let missingLiveData = [];
                const currentLtp = livePrices?.[selectedInstrument]?.ltp || '';

                // Intelligently resolve options expiry if not provided by context
                let activeExpiry = selectedExpiry;
                if (!activeExpiry && selectedInstrument) {
                    try {
                        const contractsRes = await axiosInstance.get(API_PATHS.OPTIONS.GET_CONTRACTS(selectedInstrument));
                        const contracts = contractsRes.data?.data || contractsRes.data || [];
                        if (Array.isArray(contracts) && contracts.length > 0) {
                            const expList = [...new Set(contracts.map(c => c.expiry || c.expiry_date))]
                                .filter(Boolean)
                                .sort((a, b) => new Date(a) - new Date(b));
                            if (expList.length > 0) activeExpiry = expList[0];
                        }
                    } catch (_) {}
                }

                // Create promises for parallel execution
                const dbPromise = axiosInstance.get(`/api/v1/snapshots/header/${selectedInstrument}`);
                const fundPromise = axiosInstance.get(API_PATHS.FUNDAMENTALS.GET(selectedInstrument));
                const techPromise = axiosInstance.get(`/api/v1/upstox/technicals?instrument=${selectedInstrument}&timeframe=${savedTimeframe}&ltp=${currentLtp}`);
                const optPromise = activeExpiry ? axiosInstance.get(API_PATHS.OPTIONS.GET_CHAIN(selectedInstrument, activeExpiry)) : Promise.resolve(null);

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
                if (optRes.status === 'fulfilled' && optRes.value?.data) {
                        const chainArray = optRes.value.data?.data || optRes.value.data || [];
                        if (Array.isArray(chainArray) && chainArray.length > 0 && isMounted) {
                            const normalized = chainArray.map(c => ({
                                strike: c.strike_price,
                                iv: parseFloat(c.call_options?.option_greeks?.iv) || 0,
                                call: {
                                    oi: parseFloat(c.call_options?.market_data?.oi) || 0,
                                    vol: parseFloat(c.call_options?.market_data?.volume) || 0,
                                    oiChg: parseFloat(c.call_options?.market_data?.oi_change) || 0,
                                    delta: parseFloat(c.call_options?.option_greeks?.delta) || 0,
                                    gamma: parseFloat(c.call_options?.option_greeks?.gamma) || 0,
                                    theta: parseFloat(c.call_options?.option_greeks?.theta) || 0,
                                    vega: parseFloat(c.call_options?.option_greeks?.vega) || 0,
                                    iv: parseFloat(c.call_options?.option_greeks?.iv) || 0
                                },
                                put: {
                                    oi: parseFloat(c.put_options?.market_data?.oi) || 0,
                                    vol: parseFloat(c.put_options?.market_data?.volume) || 0,
                                    oiChg: parseFloat(c.put_options?.market_data?.oi_change) || 0,
                                    delta: parseFloat(c.put_options?.option_greeks?.delta) || 0,
                                    gamma: parseFloat(c.put_options?.option_greeks?.gamma) || 0,
                                    theta: parseFloat(c.put_options?.option_greeks?.theta) || 0,
                                    vega: parseFloat(c.put_options?.option_greeks?.vega) || 0,
                                    iv: parseFloat(c.put_options?.option_greeks?.iv) || 0
                                }
                            }));
                            setChainData(normalized);

                            if (optRes.value.data?.fallback) missingLiveData.push('Options');
                        }
                    } else if (optRes.status === 'rejected') {
                        console.error("Live options failed, relying on DB", optRes.reason);
                        missingLiveData.push('Options');
                    }

                // Silently log if fallback is used for any critical module instead of spamming toasts every 10s
                if (missingLiveData.length > 0 && isMounted) {
                    console.warn(`Live data unavailable for: ${missingLiveData.join(', ')}. Using previous snapshot.`);
                }

            } finally {
                if (isMounted) setLoading(false);
            }
        };

        let timeoutId;
        const scheduleNext = () => {
            if (!isMounted) return;
            timeoutId = setTimeout(async () => {
                if (!isMounted) return;
                await fetchMasterData();
                scheduleNext();
            }, 10000);
        };

        fetchMasterData().finally(() => {
            scheduleNext();
        });

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
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
            silver:         livePrices?.['GLOBAL_INDICATOR|SILVER']?.ltp  || livePrices?.['GLOBAL_INDICATOR|SILV']?.ltp || v('silver'),
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

    const prevStableScoresRef = useRef(null);
    const prevRegimeRef = useRef(null);

    // Final Aggregation
    const masterScores = useMemo(() => {
        // If syncing is actively in progress, hold the previous stable composite scores
        // to prevent violent jumps or intermediate flashes while data pipelines run.
        if (extraData?.isSyncing && prevStableScoresRef.current) {
            return prevStableScoresRef.current;
        }

        // MD-19 Fix: Treat 0 as valid score (crash scenarios), exclude null/undefined/NaN
        const validScore = (v) => (v !== null && v !== undefined && !isNaN(Number(v)) && Number(v) >= 0) ? Number(v) : null;

        const getCardCount = (dbItem) => {
            if (!dbItem) return 0;
            const c = dbItem.counts || dbItem.counts_json;
            if (!c) return 0;
            if (typeof c === 'object') return Object.keys(c).length;
            try { return Object.keys(JSON.parse(c)).length; } catch { return 0; }
        };

        // MD-16 Fix: unparseable timestamp returns false (not assumed fresh)
        const isFresh = (dbItem, maxAgeMinutes = 60) => {
            if (!dbItem) return false;
            if (!dbItem.updated_at) return (dbItem.composite_score !== null && dbItem.composite_score !== undefined && !isNaN(dbItem.composite_score) && dbItem.composite_score >= 0);
            let dateStr = String(dbItem.updated_at);
            if (!dateStr.includes('T') && !dateStr.includes('Z')) dateStr = dateStr.replace(' ', 'T') + 'Z';
            const dbDate = new Date(dateStr);
            if (isNaN(dbDate.getTime())) return false;
            return ((Date.now() - dbDate.getTime()) / 60000) < maxAgeMinutes;
        };

        // MD-14, MD-15, MD-20, MD-21: Audit provenance and prioritize fresh live computation
        const getProvenance = (dbItem, engineScore, moduleType = 'general') => {
            const dbScore = validScore(dbItem?.composite_score);
            const liveScore = validScore(engineScore);
            // MD-14 Fix: Options data staleness threshold tightened to 10 minutes
            const maxAge = moduleType === 'fundamental' ? 1440 : moduleType === 'options' ? 10 : 60;

            let dateStr = dbItem?.updated_at ? String(dbItem.updated_at) : null;
            if (dateStr && !dateStr.includes('T') && !dateStr.includes('Z')) dateStr = dateStr.replace(' ', 'T') + 'Z';
            const dbDate = dateStr ? new Date(dateStr) : null;
            const ageMinutes = (dbDate && !isNaN(dbDate.getTime())) ? Math.round((Date.now() - dbDate.getTime()) / 60000) : null;

            // MD-20 & MD-21 Fix: Fresh live engine computation takes precedence over day-old DB cache
            if (liveScore !== null) {
                return { score: liveScore, source: 'live', ageMinutes: 0 };
            }
            if (isFresh(dbItem, maxAge) && dbScore !== null) {
                return { score: dbScore, source: 'db_fresh', ageMinutes: ageMinutes ?? 0 };
            }
            return { score: dbScore ?? null, source: dbScore !== null ? 'db_stale' : 'missing', ageMinutes };
        };

        const fundProv = getProvenance(dbFallbackData?.fundamental, fundEngine?.compositeScore, 'fundamental');
        const techProv = getProvenance(dbFallbackData?.technical, techEngine?.compositeScore, 'technical');
        const optProv  = getProvenance(dbFallbackData?.options, optionsEngine?.compositeScore, 'options');
        const globProv = getProvenance(dbFallbackData?.global, globalEngine?.compositeScore, 'global');
        const evtProv  = getProvenance(dbFallbackData?.events, evtLiveScore, 'events');

        const fundScore = fundProv.score;
        const techScore = techProv.score;
        const optScore  = optProv.score;
        const globScore = globProv.score;
        const evtScore  = evtProv.score;

        // L1 Cache: Only persist scores that this master actually computed correctly.
        if (selectedInstrument) {
            if (techScore !== null && techScore >= 0) saveIntelScore('tech', selectedInstrument, techScore, techEngine?.regime?.label, 'live');
            if (dbFallbackData?.events?.composite_score !== null && dbFallbackData.events.composite_score !== undefined && dbFallbackData.events.composite_score >= 0)
                saveIntelScore('evt', 'GLOBAL', dbFallbackData.events.composite_score, null, 'live');
        }

        const scores = [
            { id: 'fundamental', label: 'FUND', rawScore: fundScore },
            { id: 'technical',   label: 'TECH', rawScore: techScore },
            { id: 'options',     label: 'OPT',  rawScore: optScore },
            { id: 'events',      label: 'EVT',  rawScore: evtScore },
            { id: 'global',      label: 'GLOB', rawScore: globScore }
        ];

        // MD-19 Fix: Keep scores >= 0 (crash protection)
        const validScores = scores.filter(s => s.rawScore !== null && !isNaN(s.rawScore) && s.rawScore >= 0);
        
        const moduleScoreMap = { TECH: techScore, OPT: optScore, FUND: fundScore, GLOB: globScore, EVT: evtScore };
        const institutionalData = computeInstitutionalComposite(moduleScoreMap, {
            ...extraData,
            tradingMode: extraData.tradingMode || 'swing',
            hasSystemicEvent: extraData.hasSystemicEvent || dbFallbackData?.events?.has_systemic_event || false,
            volatilityPressure: extraData.volatilityPressure || dbFallbackData?.events?.volatility_pressure || 0
        });
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
                    module: resolveCardTitle(id, config),
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

        const dbFundCount = Object.keys(dbFallbackData?.fundamental?.counts || {}).length;
        const mergedFund = dbFundCount >= 20
            ? safeMerge(fundEngine?.cardScores, dbFallbackData?.fundamental?.counts)
            : safeMerge(dbFallbackData?.fundamental?.counts, fundEngine?.cardScores);

        const dbTechCount = Object.keys(dbFallbackData?.technical?.counts || {}).length;
        const mergedTech = dbTechCount >= 18
            ? safeMerge(techEngine?.cardScores, dbFallbackData?.technical?.counts)
            : safeMerge(dbFallbackData?.technical?.counts, techEngine?.cardScores);

        const liveGlobRaw = Object.fromEntries(Object.entries(globalEngine?.cardData || {}).map(([k, v]) => [k, v?.score]));
        const mergedOpt  = safeMerge(dbFallbackData?.options?.counts, optionsEngine?.cardScores);
        const mergedGlob = safeMerge(dbFallbackData?.global?.counts, Object.keys(liveGlobRaw).length > 0 ? liveGlobRaw : null);
        const mergedEvt  = safeMerge(dbFallbackData?.events?.counts, null);

        const activeCounts = {
            fundamental: parseEngineCounts(mergedFund, 'FUND'),
            technical:   parseEngineCounts(mergedTech, 'TECH'),
            options:     parseEngineCounts(mergedOpt, 'OPT'),
            global:      parseEngineCounts(mergedGlob, 'GLOB'),
            events:      parseEngineCounts(mergedEvt, 'EVT')
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

        // Compute missing breakdown from CARD_REGISTRY (master source of truth)
        const activeIds = new Set(aggregatedCards.map(c => c.id));
        const activeTitles = new Set(aggregatedCards.map(c => c.module));
        const missingBreakdown = {};

        const pageToEngine = {
            Fundamentals: 'FUND',
            Technical: 'TECH',
            Options: 'OPT',
            Foreign: 'GLOB',
            Events: 'EVT'
        };

        Object.values(CARD_REGISTRY).forEach(card => {
            if (card.type !== 'card') return; // Exclude passive widgets

            const applies = isIndex
                ? ['indices', 'both', 'n/a'].includes(card.appliesTo)
                : ['company', 'equity', 'both', 'n/a'].includes(card.appliesTo);
            if (!applies) return;

            // Instrument-specific exclusions
            if (isIndex && ['cmf', 'volume_sma', 'obv', 'vwap'].includes(card.id)) return;
            if (!isIndex && ['breadth_ratio', 'mcclellan', 'ad_line', 'nh_nl', 'trin'].includes(card.id)) return;

            // Check if card is already active by id, displayName, legacyIds, or aliases
            const isActive = activeIds.has(card.id) ||
                activeTitles.has(card.displayName) ||
                (card.legacyIds && card.legacyIds.some(lid => activeIds.has(lid))) ||
                (card.aliases && card.aliases.some(alias => activeIds.has(alias)));

            if (!isActive) {
                const engine = pageToEngine[card.page] || 'MISC';
                missingBreakdown[`${engine}||${card.displayName}`] = 1;
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
                if (sec.score === null || sec.score === undefined || isNaN(sec.score) || sec.score === 0) return;
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
            if (score === null || score === undefined || isNaN(score) || score === 0) return;
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

        // MD-11 Fix: Regime Hysteresis to prevent 1-2 point oscillations from flipping labels
        let systemRegime;
        if (praxisComposite === null) {
            systemRegime = { label: "AWAITING DATA", className: "text-slate-400 font-medium", color: "#64748B" };
        } else {
            const roundedComposite = Math.round(praxisComposite);
            const rawRegime = getCompositeState(roundedComposite);
            if (prevRegimeRef.current && prevRegimeRef.current.score !== undefined) {
                const delta = Math.abs(roundedComposite - prevRegimeRef.current.score);
                if (delta <= 1.5 && rawRegime.label !== prevRegimeRef.current.label) {
                    systemRegime = prevRegimeRef.current;
                } else {
                    systemRegime = { ...rawRegime, score: roundedComposite };
                    prevRegimeRef.current = systemRegime;
                }
            } else {
                systemRegime = { ...rawRegime, score: roundedComposite };
                prevRegimeRef.current = systemRegime;
            }
        }

        const activeModulesCount = validScores.length;
        const maxModules = 5;
        const coveragePercent = Math.round((activeModulesCount / maxModules) * 100);

        // MD-17 Fix: Quality-weighted data confidence factoring freshness & coverage
        let qualityConfidence = 0;
        if (validScores.length > 0) {
            const provMap = { fundamental: fundProv, technical: techProv, options: optProv, global: globProv, events: evtProv };
            let weightSum = 0;
            let qualitySum = 0;
            validScores.forEach(vs => {
                const prov = provMap[vs.id];
                const freshnessMultiplier = prov?.source === 'live' ? 1.0 : prov?.source === 'db_fresh' ? 0.85 : 0.40;
                const modWeight = institutionalData.activeWeights?.[vs.label] || 0.20;
                weightSum += modWeight;
                qualitySum += modWeight * freshnessMultiplier;
            });
            qualityConfidence = weightSum > 0 ? Math.round((qualitySum / weightSum) * 100) : 0;
        }

        // MD-15 & MD-22 Fix: Full provenance and audit trail
        const allLive = validScores.length > 0 && validScores.every(s => [fundProv, techProv, optProv, globProv, evtProv].find(p => p.score === s.rawScore)?.source === 'live');
        const integrity = {
            coverageText: `${activeModulesCount}/${maxModules}`,
            coveragePercent,
            missingCards: totalMissing,
            missingBreakdown,
            source: allLive ? "100% Live Engines" : "Hybrid (Live + DB Cache)",
            moduleProvenance: {
                TECH: techProv,
                OPT: optProv,
                FUND: fundProv,
                GLOB: globProv,
                EVT: evtProv
            },
            audit: {
                baseScore: institutionalData.baseScore,
                modifierImpact: institutionalData.modifierImpact,
                modifierBreakdown: institutionalData.modifierBreakdown,
                vixDistressApplied: institutionalData.vixDistressApplied,
                activeWeights: institutionalData.activeWeights,
                tradingMode: extraData.tradingMode || 'swing'
            }
        };

        const result = {
            praxisComposite: praxisComposite !== null ? Math.round(praxisComposite) : null,
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
                            cards: []
                        })) : []
                    };
                })
            },
            regime: {
                label: systemRegime.label,
                description: praxisComposite !== null ? `Aggregated from ${validScores.length} active Praxis modules.` : 'Awaiting market data pipeline initialization.',
                confidence: qualityConfidence,
                color: systemRegime.color
            },
            integrity
        };

        prevStableScoresRef.current = result;
        return result;
    }, [fundEngine, techEngine, optionsEngine, globalEngine, dbFallbackData, selectedInstrument, evtLiveScore, isIndex, extraData?.isSyncing]);

    const isRefreshingRef = useRef(false);

    const refresh = useCallback(async () => {
        if (!selectedInstrument || isRefreshingRef.current) return;
        isRefreshingRef.current = true;
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
            let activeExpiry = selectedExpiry;
            if (!activeExpiry && selectedInstrument) {
                try {
                    const cRes = await axiosInstance.get(API_PATHS.OPTIONS.GET_CONTRACTS(selectedInstrument));
                    const contracts = cRes.data?.data || cRes.data || [];
                    if (Array.isArray(contracts) && contracts.length > 0) {
                        const expList = [...new Set(contracts.map(c => c.expiry || c.expiry_date))].filter(Boolean).sort((a, b) => new Date(a) - new Date(b));
                        if (expList.length > 0) activeExpiry = expList[0];
                    }
                } catch (_) {}
            }
            if (activeExpiry) {
                try {
                    const optRes = await axiosInstance.get(API_PATHS.OPTIONS.GET_CHAIN(selectedInstrument, activeExpiry));
                    const chainArray = optRes.data?.data || optRes.data || [];
                    if (Array.isArray(chainArray) && chainArray.length > 0) {
                        const normalized = chainArray.map(c => ({
                            strike: c.strike_price,
                            iv: parseFloat(c.call_options?.option_greeks?.iv) || 0,
                            call: {
                                oi: parseFloat(c.call_options?.market_data?.oi) || 0,
                                vol: parseFloat(c.call_options?.market_data?.volume) || 0,
                                oiChg: parseFloat(c.call_options?.market_data?.oi_change) || 0,
                                delta: parseFloat(c.call_options?.option_greeks?.delta) || 0,
                                gamma: parseFloat(c.call_options?.option_greeks?.gamma) || 0,
                                theta: parseFloat(c.call_options?.option_greeks?.theta) || 0,
                                vega: parseFloat(c.call_options?.option_greeks?.vega) || 0,
                                iv: parseFloat(c.call_options?.option_greeks?.iv) || 0
                            },
                            put: {
                                oi: parseFloat(c.put_options?.market_data?.oi) || 0,
                                vol: parseFloat(c.put_options?.market_data?.volume) || 0,
                                oiChg: parseFloat(c.put_options?.market_data?.oi_change) || 0,
                                delta: parseFloat(c.put_options?.option_greeks?.delta) || 0,
                                gamma: parseFloat(c.put_options?.option_greeks?.gamma) || 0,
                                theta: parseFloat(c.put_options?.option_greeks?.theta) || 0,
                                vega: parseFloat(c.put_options?.option_greeks?.vega) || 0,
                                iv: parseFloat(c.put_options?.option_greeks?.iv) || 0
                            }
                        }));
                        setChainData(normalized);
                    }
                } catch (_) {}
            }
        } finally {
            setLoading(false);
            isRefreshingRef.current = false;
        }
    }, [selectedInstrument, selectedExpiry]);

    useEffect(() => {
        let debounceTimer = null;
        const handleSyncEvent = (payload) => {
            const target = payload?.instrument || payload?.instrument_key;
            if (target && target !== selectedInstrument && target !== 'GLOBAL' && target !== 'ALL') {
                return;
            }
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                refresh();
            }, 300);
        };
        socket.on('app:sync:complete', handleSyncEvent);
        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            socket.off('app:sync:complete', handleSyncEvent);
        };
    }, [refresh, selectedInstrument]);

    return { ...masterScores, loading, headlessFundCards, headlessTechCards, refresh };
}

