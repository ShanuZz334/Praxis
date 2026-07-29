import { useState, useEffect, useMemo, useRef } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';

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
    const [dbFallbackData, setDbFallbackData] = useState({});
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
    // Load global overrides from local storage once
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('praxis_manual_overrides_global');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && parsed['global_macro']) {
                        setGlobalOverrides(parsed['global_macro']);
                    }
                }
            } catch(e) {}
        }
    }, []);

    const { overrides: techOverrides } = useManualOverrides('technical', selectedInstrument || 'NIFTY', {});
    const { overrides: fundOverrides } = useManualOverrides('fundamental', selectedInstrument || 'NIFTY', {});

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

        const fetchMasterData = async () => {
            try {
                // 1. Fetch Fallback DB State (for Global, Events, or failsafes)
                let fallbackData = {};
                try {
                    const dbRes = await axiosInstance.get(`/api/v1/snapshots/header/${selectedInstrument}`);
                    if (dbRes.data?.status === 'success' && dbRes.data?.data) {
                        fallbackData = dbRes.data.data;
                        if (isMounted) setDbFallbackData(fallbackData);
                    }
                } catch (e) {
                    console.error("Failed to fetch fallback header state", e);
                }

                let missingLiveData = [];

                // 2. Fetch Live Fundamentals
                try {
                    const fundRes = await axiosInstance.get(API_PATHS.FUNDAMENTALS.GET(selectedInstrument));
                    if (fundRes.data?.success && fundRes.data?.data) {
                        if (isMounted) setRawFundamentals(fundRes.data.data);
                        if (fundRes.data?.fallback) missingLiveData.push('Fundamentals');
                    }
                } catch (e) {
                    console.error("Live fundamentals failed, relying on DB", e);
                    missingLiveData.push('Fundamentals');
                }

                // 3. Fetch Live Technicals
                try {
                    const currentLtp = livePrices?.[selectedInstrument]?.ltp || '';
                    const techRes = await axiosInstance.get(`/api/v1/upstox/technicals?instrument=${selectedInstrument}&timeframe=day&ltp=${currentLtp}`);
                    if (techRes.data?.success && techRes.data?.data) {
                        if (isMounted) setRawTechnicals(techRes.data.data);
                        if (techRes.data?.fallback) missingLiveData.push('Technicals');
                    }
                } catch (e) {
                    console.error("Live technicals failed, relying on DB", e);
                    missingLiveData.push('Technicals');
                }

                // 4. Fetch Live Options Chain (only if expiry is present)
                if (selectedExpiry) {
                    try {
                        const optRes = await axiosInstance.get(API_PATHS.OPTIONS.GET_CHAIN(selectedInstrument, selectedExpiry));
                        const chainArray = optRes.data?.data || optRes.data || [];
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
                            if (optRes.data?.fallback) missingLiveData.push('Options');
                        }
                    } catch (e) {
                        console.error("Live options failed, relying on DB", e);
                        missingLiveData.push('Options');
                    }
                }

                // Toast notification if fallback is used for any critical module
                if (missingLiveData.length > 0 && isMounted) {
                    toast(`Live data unavailable for: ${missingLiveData.join(', ')}. Using previous snapshot.`, { id: 'master-fallback-toast', icon: '⚠️' });
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

    const fundEngine = fundState ? { 
        cardScores: fundState.scores,
        ...(isIndex ? computeIndexComposite(fundState.scores) : computeCompanyComposite(fundState.scores))
    } : null;
    const techEngine = techState ? { 
        cardScores: techState.scores,
        ...computeTechnicalComposite(techState.scores, isIndex)
    } : null;
    const headlessFundCards = fundState?.cards || [];
    const headlessTechCards = techState?.cards || [];


    // Options Engine (Hooks)
    const optionsMetrics = useOptionsComposite(chainData, baseSpotPrice, selectedInstrument, selectedExpiry);
    const optionsEngine = useOptionsCompositeScore(optionsMetrics, selectedInstrument);

    // Global Engine (Hooks)
    const globalLiveData = useMemo(() => {
        return {
            dxy: livePrices?.['GLOBAL_INDICATOR|DXY']?.ltp || null,
            usd_inr: livePrices?.['GLOBAL_INDICATOR|USDINR']?.ltp || null,
            crude: livePrices?.['GLOBAL_INDICATOR|BZUSD']?.ltp || null,
            gold: livePrices?.['GLOBAL_INDICATOR|GOLD']?.ltp || null,
            silver: livePrices?.['GLOBAL_INDICATOR|SILV']?.ltp || null,
            us_10y_yield: livePrices?.['GLOBAL_INDICATOR|US10Y']?.ltp || null,
            sp_futures: livePrices?.['GLOBAL_INDICATOR|ES1']?.ltp || null,
            nasdaq_futures: livePrices?.['GLOBAL_INDICATOR|NQ1']?.ltp || null,
            dow_futures: livePrices?.['GLOBAL_INDICATOR|YM1']?.ltp || null,
            vix: livePrices?.['GLOBAL_INDICATOR|VIX']?.ltp || null,
            bitcoin: livePrices?.['GLOBAL_INDICATOR|BTCUSD']?.ltp || null,
            eurusd: livePrices?.['GLOBAL_INDICATOR|EURUSD']?.ltp || null,
            usdjpy: livePrices?.['GLOBAL_INDICATOR|USDJPY']?.ltp || null,
            nikkei: livePrices?.['GLOBAL_INDICATOR|NIY']?.ltp || null,
            ftse: livePrices?.['GLOBAL_INDICATOR|Z1']?.ltp || null,
            dax: livePrices?.['GLOBAL_INDICATOR|FDAX']?.ltp || null,
            hangseng: livePrices?.['GLOBAL_INDICATOR|HSI']?.ltp || null,
            shanghai: livePrices?.['GLOBAL_INDICATOR|SSEC']?.ltp || null,
            cac40: livePrices?.['GLOBAL_INDICATOR|FCE']?.ltp || null,
            eurostoxx: livePrices?.['GLOBAL_INDICATOR|FESX']?.ltp || null,
            copper: livePrices?.['GLOBAL_INDICATOR|HG1']?.ltp || null,
            natgas: livePrices?.['GLOBAL_INDICATOR|NG1']?.ltp || null,
            wheat: livePrices?.['GLOBAL_INDICATOR|ZW1']?.ltp || null,
            aluminum: livePrices?.['GLOBAL_INDICATOR|ALI1']?.ltp || null,
            move: livePrices?.['GLOBAL_INDICATOR|MOVE']?.ltp || null
        };
    }, [livePrices]);
    
    const globalEngine = useGlobalComposite(globalOverrides, globalLiveData);


    // Final Aggregation
    const masterScores = useMemo(() => {
        const fundScore = fundEngine?.compositeScore ?? dbFallbackData?.fundamental?.composite_score ?? null;
        const techScore = techEngine?.compositeScore ?? dbFallbackData?.technical?.composite_score ?? null;
        const optScore = optionsEngine?.compositeScore ?? dbFallbackData?.options?.composite_score ?? null;
        const globScore = globalEngine?.compositeScore ?? dbFallbackData?.global?.composite_score ?? null;
        const evtScore = dbFallbackData?.events?.composite_score ?? null;

        const scores = [
            { id: 'technical',   label: 'TECH', rawScore: techScore },
            { id: 'fundamental', label: 'FUND', rawScore: fundScore },
            { id: 'options',     label: 'OPT',  rawScore: optScore },
            { id: 'global',      label: 'GLOB', rawScore: globScore },
            { id: 'events',      label: 'EVT',  rawScore: evtScore }
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
        const mergedFund = safeMerge(dbFallbackData?.fundamental?.counts, fundEngine?.cardScores);
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
                totalCredits += counts.totalCredits || 0;
                totalBulls += counts.bulls || 0;
                totalBears += counts.bears || 0;
                totalNeutrals += counts.neutrals || 0;
                
                const engineTagMap = { fundamental: 'FUND', technical: 'TECH', options: 'OPT', global: 'GLOB', events: 'EVT' };
                const engineTag = engineTagMap[engineName] || engineName.substring(0, 4).toUpperCase();

                if (counts.cards && Array.isArray(counts.cards)) {
                    aggregatedCards = aggregatedCards.concat(counts.cards);
                } else if (counts.breakdown) {
                    // Reconstruct from DB cache breakdown mapping!
                    if (counts.breakdown.bulls) {
                        Object.entries(counts.breakdown.bulls).forEach(([mod, qty]) => {
                            aggregatedCards.push(...Array(qty).fill({ normalized: 1, module: mod, engine: engineTag }));
                        });
                    }
                    if (counts.breakdown.bears) {
                        Object.entries(counts.breakdown.bears).forEach(([mod, qty]) => {
                            aggregatedCards.push(...Array(qty).fill({ normalized: -1, module: mod, engine: engineTag }));
                        });
                    }
                    if (counts.breakdown.neutrals) {
                        Object.entries(counts.breakdown.neutrals).forEach(([mod, qty]) => {
                            aggregatedCards.push(...Array(qty).fill({ normalized: 0, module: mod, engine: engineTag }));
                        });
                    }
                } else {
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
                // Native engine section weights usually range from 10 to 35
                const weight = sec.weight || 15; 
                const strength = deviation * weight;
                rankedSections.push({
                    id: sec.id,
                    label: sec.label || sec.shortLabel || formatTitle(sec.id),
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
        const evtRaw = validScores.find(s => s.id === 'events')?.rawScore;
        
        addMacroSection('GLOB', globRaw);
        addMacroSection('EVT', evtRaw);

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

    }, [fundEngine, techEngine, optionsEngine, dbFallbackData]);

    return { ...masterScores, loading, headlessFundCards, headlessTechCards };
}
