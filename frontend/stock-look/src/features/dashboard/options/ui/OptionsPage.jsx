import React, { useState, useEffect, useMemo } from "react";
import { Settings } from "lucide-react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import OptionsModal from "./OptionsModal";
import OptionsChainLayout from "@/features/dashboard/options/ui/chain/OptionsChainLayout";
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import { generateProDeskPicks } from '../engine/proDeskEngine';
import socket from '@/shared/utils/socket';
import { calculateGreeks, resolveGreeks, timeToExpiry } from '../engine/blackScholesEngine';
import { calculatePCR, calculateMaxPain } from '../engine/optionsMath';
import OptionsStrategyDesk from "./OptionsStrategyDesk";
import OptionsGrid from './OptionsGrid';
import { useDashboardContext } from "@/shared/context/DashboardContext";
import { useAiSync } from "@/shared/hooks/useAiSync";
import { useOptionsComposite } from '../engine/useOptionsComposite';
import { useOptionsCompositeScore } from '../engine/useOptionsCompositeScore';
import { saveDailyOISnapshot, computeLiveOiChange } from '../engine/oiTrackerEngine';
import { useManualOverrides } from "@/shared/hooks/useManualOverrides";
import { useSnapshots } from '@/shared/hooks/useSnapshots';
import { useDataFreshness } from "@/shared/hooks/useDataFreshness";
import { DebouncedOverrideInput } from "@/shared/components/ui/Inputs/DebouncedOverrideInput";
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function OptionsPage() {
    const [selectedCard, setSelectedCard] = useState(null);
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Consume Global Dashboard Context
    const {
        selectedCategory: category,
        selectedInstrument,
        selectedExpiry, setSelectedExpiry,
        expiries,
        livePrices
    } = useDashboardContext();

    // Data state
    const [chainData, setChainData] = useState([]);
    const [baseSpotPrice, setBaseSpotPrice] = useState(24000);
    const spotPrice = livePrices?.[selectedInstrument]?.ltp || baseSpotPrice;
    
    const [loading, setLoading] = useState(false);
    const [manualIvRank, setManualIvRank] = useState(34);

    const [idealPremium, setIdealPremium] = useState(45);

    const DEFAULT_OVERRIDES = {};
    const { overrides: manualOverrides, lastUpdated: manualOverrideTimes, handleClearAll, handleChange: handleOverrideChange } = useManualOverrides('options', selectedInstrument, DEFAULT_OVERRIDES);
    const { historicalSnapshots } = useSnapshots(selectedInstrument?.value || selectedInstrument);


    // Live computed metrics from chain
    const metrics = useMemo(() => {
        if (!chainData || chainData.length === 0) return { pcr: 1.0, maxPain: spotPrice, ivRank: manualIvRank };
        
        const pcr = calculatePCR(chainData);
        const maxPain = calculateMaxPain(chainData);
        
        return { pcr, maxPain, ivRank: manualIvRank };
    }, [chainData, spotPrice, manualIvRank]);

    // 4. WebSocket Listener for Live Greeks
    useEffect(() => {
        const handleMarketUpdate = ({ instrumentKey, data }) => {
            // Accept update even if optionGreeks is missing — we can B-S fallback
            setChainData(prevChain => {
                let updated = false;
                const newChain = prevChain.map(row => {
                    const newRow = { ...row };

                    if (newRow.call.instrument_key === instrumentKey) {
                        const T = timeToExpiry(selectedExpiry);
                        const resolved = resolveGreeks(
                            data.optionGreeks,
                            data.iv,
                            spotPrice || newRow.strike,
                            newRow.strike,
                            T,
                            'call',
                            newRow.call.iv || 15
                        );
                        // Also update live market data (LTP, Vol, OI) only if valid
                        const ltp = data.ltp > 0 ? data.ltp : newRow.call.ltp;
                        const vol = data.volume > 0 ? data.volume : newRow.call.vol;
                        const oi = data.openInterest > 0 ? data.openInterest : newRow.call.oi;
                        
                        // Calculate Price Change % (CHG%)
                        const close = newRow.call.close || ltp;
                        const oiChgPct = close > 0 ? ((ltp - close) / close) * 100 : newRow.call.oiChgPct;

                        // Calculate Live OI Change
                        const oiChg = computeLiveOiChange(selectedInstrument?.value || selectedInstrument, newRow.strike, 'call', parseFloat(oi) || 0);

                        newRow.call = { 
                            ...newRow.call, 
                            ...resolved, 
                            ltp: parseFloat(ltp) || 0, 
                            vol: parseFloat(vol) || 0, 
                            oi: parseFloat(oi) || 0, 
                            oiChgPct: parseFloat(oiChgPct) || 0,
                            oiChg: parseFloat(oiChg) || 0
                        };
                        newRow.iv = resolved.iv || newRow.iv;
                        updated = true;
                    } else if (newRow.put.instrument_key === instrumentKey) {
                        const T = timeToExpiry(selectedExpiry);
                        const resolved = resolveGreeks(
                            data.optionGreeks,
                            data.iv,
                            spotPrice || newRow.strike,
                            newRow.strike,
                            T,
                            'put',
                            newRow.put.iv || 15
                        );
                        const ltp = data.ltp > 0 ? data.ltp : newRow.put.ltp;
                        const vol = data.volume > 0 ? data.volume : newRow.put.vol;
                        const oi = data.openInterest > 0 ? data.openInterest : newRow.put.oi;
                        
                        // Calculate Price Change % (CHG%)
                        const close = newRow.put.close || ltp;
                        const oiChgPct = close > 0 ? ((ltp - close) / close) * 100 : newRow.put.oiChgPct;

                        // Calculate Live OI Change
                        const oiChg = computeLiveOiChange(selectedInstrument?.value || selectedInstrument, newRow.strike, 'put', parseFloat(oi) || 0);

                        newRow.put = { 
                            ...newRow.put, 
                            ...resolved, 
                            ltp: parseFloat(ltp) || 0, 
                            vol: parseFloat(vol) || 0, 
                            oi: parseFloat(oi) || 0, 
                            oiChgPct: parseFloat(oiChgPct) || 0,
                            oiChg: parseFloat(oiChg) || 0
                        };
                        updated = true;
                    }
                    return newRow;
                });
                return updated ? newChain : prevChain;
            });
        };

        socket.on("market:update", handleMarketUpdate);
        return () => socket.off("market:update", handleMarketUpdate);
    }, [selectedExpiry, spotPrice]);

    // 5. Connect Pro Desk picks when Golden Zone is ready
    // 1. Fetch expiries is now handled globally by DashboardContext

    // 2. Fetch chain when instrument or expiry changes
    useEffect(() => {
        const fetchChain = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(API_PATHS.OPTIONS.GET_CHAIN(selectedInstrument, selectedExpiry));
                
                const chainArray = res.data?.data || res.data || [];
                
                if (Array.isArray(chainArray) && chainArray.length > 0) {
                    // Normalize Upstox API response to match UI format
                    const normalizedChain = chainArray.map(c => {
                        const callData = c.call_options?.market_data || {};
                        const putData = c.put_options?.market_data || {};
                        
                        // Safely calculate Price change percentage
                        const calcPriceChgPct = (ltp, close) => {
                            if (!ltp || !close || close === 0) return 0;
                            return ((ltp - close) / close) * 100;
                        };

                        return {
                            strike: c.strike_price,
                            iv: 0, // General IV or placeholder
                            call: {
                                instrument_key: c.call_options?.instrument_key,
                                ltp: parseFloat(callData.ltp) || 0,
                                close: parseFloat(callData.close) || parseFloat(callData.ltp) || 0,
                                oi: parseFloat(callData.oi) || 0,
                                vol: parseFloat(callData.volume) || 0,
                                oiChg: callData.oi_change !== undefined ? parseFloat(callData.oi_change) : 0,
                                oiChgPct: calcPriceChgPct(parseFloat(callData.ltp), parseFloat(callData.close)),
                                delta: 0, gamma: 0, theta: 0, vega: 0, iv: 0
                            },
                            put: {
                                instrument_key: c.put_options?.instrument_key,
                                ltp: parseFloat(putData.ltp) || 0,
                                close: parseFloat(putData.close) || parseFloat(putData.ltp) || 0,
                                oi: parseFloat(putData.oi) || 0,
                                vol: parseFloat(putData.volume) || 0,
                                oiChg: putData.oi_change !== undefined ? parseFloat(putData.oi_change) : 0,
                                oiChgPct: calcPriceChgPct(parseFloat(putData.ltp), parseFloat(putData.close)),
                                delta: 0, gamma: 0, theta: 0, vega: 0, iv: 0
                            }
                        };
                    });

                    // Attempt to extract spot price from the first item if available
                    if (chainArray[0].underlying_spot_price) {
                        setBaseSpotPrice(chainArray[0].underlying_spot_price);
                    }

                    // Save base OI snapshot for intraday change tracking
                    saveDailyOISnapshot(selectedInstrument?.value || selectedInstrument, normalizedChain);

                    setChainData(normalizedChain);  // --- SUBSCRIBE TO WEBSOCKET GREEKS + SEED B-S GREEKS ---
                    try {
                        const spotIndex = normalizedChain.findIndex(c => c.strike >= (chainArray[0].underlying_spot_price || baseSpotPrice));
                        if (spotIndex !== -1) {
                            const start = Math.max(0, spotIndex - 15);
                            const end = Math.min(normalizedChain.length, spotIndex + 16);
                            const keysToFetch = [];

                            // Compute real T from expiry string
                            const T = timeToExpiry(selectedExpiry);

                            // Find ATM IV from the chain (best available IV from near-ATM strikes)
                            // Use the call_options option_greeks IV from the raw API if present
                            let atmIv = 15; // Default fallback
                            const atmRow = chainArray[spotIndex];
                            if (atmRow?.call_options?.option_greeks?.iv) {
                                atmIv = atmRow.call_options.option_greeks.iv;
                            } else if (atmRow?.put_options?.option_greeks?.iv) {
                                atmIv = atmRow.put_options.option_greeks.iv;
                            }

                            for (let i = start; i < end; i++) {
                                if (normalizedChain[i]?.call.instrument_key) keysToFetch.push(normalizedChain[i].call.instrument_key);
                                if (normalizedChain[i]?.put.instrument_key) keysToFetch.push(normalizedChain[i].put.instrument_key);

                                if (normalizedChain[i]) {
                                    const row = normalizedChain[i];

                                    // Use real IV from the raw chain if available, else use ATM IV
                                    const rawRow = chainArray[i];
                                    const callIvRaw = rawRow?.call_options?.option_greeks?.iv || atmIv;
                                    const putIvRaw  = rawRow?.put_options?.option_greeks?.iv  || atmIv;

                                    const callVol = callIvRaw / 100.0;
                                    const putVol  = putIvRaw  / 100.0;

                                    const initialSpot = chainArray[0]?.underlying_spot_price || baseSpotPrice || 24000;
                                    const callGreeks = calculateGreeks(initialSpot, row.strike, T, 0.07, callVol, 'call');
                                    const putGreeks  = calculateGreeks(initialSpot, row.strike, T, 0.07, putVol,  'put');

                                    row.call = { ...row.call, ...callGreeks, iv: callIvRaw };
                                    row.put  = { ...row.put,  ...putGreeks,  iv: putIvRaw  };
                                    row.iv   = callIvRaw;
                                }
                            }

                            if (keysToFetch.length > 0) {
                                socket.emit("subscribe:instruments", { keys: keysToFetch, mode: "option_greeks" });
                            }
                        }
                    } catch (greekErr) {
                        console.error("Failed to seed Greeks:", greekErr);
                    }

                    setChainData(normalizedChain);
                } else {
                    setChainData([]);
                }
            } catch (err) {
                console.error("Failed to fetch chain:", err);
                setChainData([]);
            } finally {
                setLoading(false);
            }
        };
        if (selectedInstrument && selectedExpiry) {
            fetchChain();
        } else {
            setChainData([]);
        }
    }, [selectedInstrument, selectedExpiry]);

    // 3. Generate Pro Desk Picks using the engine
    const proDeskData = useMemo(() => {
        if (!chainData || chainData.length === 0) return { goldenStrikes: [], categories: {} };
        try {
            return generateProDeskPicks(chainData, spotPrice, idealPremium);
        } catch (e) {
            console.error("Error generating pro desk picks:", e);
            return { goldenStrikes: [], categories: {} };
        }
    }, [chainData, spotPrice, idealPremium]);

    const formatExpiryDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const expiryOptions = expiries.length > 0 
        ? expiries.map(exp => ({ label: formatExpiryDate(exp), value: exp }))
        : [{ label: "No expiries", value: "" }];

    // Live cards are now managed centrally by cardsForHeader

    // --- Market Status Helpers ---
    const getISTDateTime = () => {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; 
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc + istOffset);
    };

    const isMarketOpen = () => {
        const now = getISTDateTime();
        const day = now.getDay(); 
        if (day === 0 || day === 6) return false;
        
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeNum = hours * 100 + minutes;
        
        return timeNum >= 915 && timeNum <= 1530; 
    };

    const formatTime = (ts) => {
        if (!ts) return null;
        return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    // Composite Live Engine Scores
    const compositeData = useOptionsComposite(chainData, spotPrice, selectedInstrument?.value, selectedExpiry, manualOverrides, historicalSnapshots);

    // Higher-order composite score (mirrors TechnicalPage pattern)
    const {
        compositeScore,
        gauge: engineGauge,
        regime: engineRegime,
        sections: engineSections,
        tailwinds: engineTailwinds,
        risks: engineRisks,
        aiInsight: engineAiInsight,
        cardScores
    } = useOptionsCompositeScore(compositeData, selectedInstrument);

    const resolveTime = useDataFreshness(chainData?.length > 0, manualOverrides, manualOverrideTimes, isMarketOpen, formatTime, "1s");

    // Build cardsForHeader — mirrors TechnicalPage cardsForHeader logic
    const OPTIONS_CARD_IDS = new Set([
        'total_call_oi', 'total_put_oi', 'oi_change',
        'pcr_oi', 'pcr_volume',
        'delta', 'gamma', 'theta', 'vega',
        'atm_iv', 'iv_rank', 'iv_percentile',
        'max_pain'
    ]);

    const cardsForHeader = Object.entries(cardScores || {})
        .filter(([id, score]) => OPTIONS_CARD_IDS.has(id) && score !== null && score !== undefined && !isNaN(score))
        .map(([id, score]) => {
            let normalized = 0;
            if (score > 70) normalized = 1;
            else if (score < 30) normalized = -1;
            const config = getIndicatorConfig(id);
            const credit = config?.creditScore ?? 5;
            const allocated = (score / 100) * credit;

            const formatTitle = (str) => {
                if (!str) return '';
                return str.split('_').map(word => {
                    if (word.match(/^(oi|pcr|iv)$/i)) return word.toUpperCase();
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }).join(' ');
            };

            return { id, module: config?.title || formatTitle(config?.id) || formatTitle(id), normalized, credit, creditAllocation: allocated, score };
        });

    // 6. Silently stream AI Snapshot to backend SQLite
    useAiSync(
        selectedInstrument?.value || selectedInstrument,
        "Options",
        {
            compositeScore,
            regime: engineRegime,
            sections: engineSections,
            tailwinds: engineTailwinds,
            risks: engineRisks,
            aiInsight: engineAiInsight,
            cards: cardsForHeader
        }
    );

    const totalCredits = cardsForHeader.reduce((acc, c) => acc + c.credit, 0);
    const maxCards = OPTIONS_CARD_IDS.size;
    const activeCardsCount = cardsForHeader.length;
    const coveragePercent = maxCards > 0 ? Math.min(100, Math.round((activeCardsCount / maxCards) * 100)) : 0;

    const hasAtmIv = compositeData?.volatility?.atmIv?.currentValue !== undefined && compositeData?.volatility?.atmIv?.currentValue !== null && !isNaN(compositeData?.volatility?.atmIv?.currentValue);
    const hasMaxPain = compositeData?.maxPain?.currentValue !== undefined && compositeData?.maxPain?.currentValue !== null && !isNaN(compositeData?.maxPain?.currentValue);
    const hasTotalCallOI = compositeData?.totalCallOI?.currentValue !== undefined && compositeData?.totalCallOI?.currentValue !== null && !isNaN(compositeData?.totalCallOI?.currentValue);
    const hasTotalPutOI = compositeData?.totalPutOI?.currentValue !== undefined && compositeData?.totalPutOI?.currentValue !== null && !isNaN(compositeData?.totalPutOI?.currentValue);
    const hasOiChange = compositeData?.oiChange?.currentValue !== undefined && compositeData?.oiChange?.currentValue !== null && !isNaN(compositeData?.oiChange?.currentValue);
    const hasPcrOi = compositeData?.pcrOi?.currentValue !== undefined && compositeData?.pcrOi?.currentValue !== null && !isNaN(compositeData?.pcrOi?.currentValue);
    const hasPcrVolume = compositeData?.pcrVolume?.currentValue !== undefined && compositeData?.pcrVolume?.currentValue !== null && !isNaN(compositeData?.pcrVolume?.currentValue);
    const hasDelta = compositeData?.atmGreeks?.delta?.currentValue !== undefined && compositeData?.atmGreeks?.delta?.currentValue !== null && !isNaN(compositeData?.atmGreeks?.delta?.currentValue);
    const hasGamma = compositeData?.atmGreeks?.gamma?.currentValue !== undefined && compositeData?.atmGreeks?.gamma?.currentValue !== null && !isNaN(compositeData?.atmGreeks?.gamma?.currentValue);
    const hasTheta = compositeData?.atmGreeks?.theta?.currentValue !== undefined && compositeData?.atmGreeks?.theta?.currentValue !== null && !isNaN(compositeData?.atmGreeks?.theta?.currentValue);
    const hasVega = compositeData?.atmGreeks?.vega?.currentValue !== undefined && compositeData?.atmGreeks?.vega?.currentValue !== null && !isNaN(compositeData?.atmGreeks?.vega?.currentValue);

    const optionsManualForm = (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-3 mb-4">
                <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-text-primary tracking-wider uppercase flex items-center gap-2">
                        MANUAL DATA OVERRIDES
                    </div>
                    <button 
                        onClick={handleClearAll}
                        className="px-2 py-0.5 text-[10px] font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded border border-rose-500/20 transition-colors"
                    >
                        Clear All
                    </button>
                </div>
            </div>
            <p className="text-xs text-text-tertiary mb-6">Enter values for options metrics when live streaming data is unavailable.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                <div className="space-y-2">
                    <div className="text-xs font-bold text-emerald-500 mb-2">Volatility Settings</div>
                    <DebouncedOverrideInput label="IV Rank (%)" overrideKey="iv_rank" value={manualOverrides.iv_rank} onChange={handleOverrideChange} />
                    <DebouncedOverrideInput label="IV Percentile (%)" overrideKey="iv_percentile" value={manualOverrides.iv_percentile} onChange={handleOverrideChange} />
                    <DebouncedOverrideInput label="Lookback (Days)" overrideKey="iv_lookback" value={manualOverrides.iv_lookback} onChange={handleOverrideChange} />
                    {!hasAtmIv && <DebouncedOverrideInput label="ATM IV (%)" overrideKey="atm_iv" value={manualOverrides.atm_iv} onChange={handleOverrideChange} />}
                </div>

                {(!hasTotalCallOI || !hasTotalPutOI || !hasOiChange || !hasMaxPain || !hasPcrOi || !hasPcrVolume) && (
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-blue-500 mb-2">Open Interest & Positioning</div>
                        {!hasTotalCallOI && <DebouncedOverrideInput label="Total Call OI" overrideKey="total_call_oi" value={manualOverrides.total_call_oi} onChange={handleOverrideChange} />}
                        {!hasTotalPutOI && <DebouncedOverrideInput label="Total Put OI" overrideKey="total_put_oi" value={manualOverrides.total_put_oi} onChange={handleOverrideChange} />}
                        {!hasOiChange && <DebouncedOverrideInput label="OI Change" overrideKey="oi_change" value={manualOverrides.oi_change} onChange={handleOverrideChange} />}
                        {!hasPcrOi && <DebouncedOverrideInput label="PCR (OI)" overrideKey="pcr_oi" value={manualOverrides.pcr_oi} onChange={handleOverrideChange} />}
                        {!hasPcrVolume && <DebouncedOverrideInput label="PCR (Volume)" overrideKey="pcr_volume" value={manualOverrides.pcr_volume} onChange={handleOverrideChange} />}
                        {!hasMaxPain && <DebouncedOverrideInput label="Max Pain Strike" overrideKey="max_pain" value={manualOverrides.max_pain} onChange={handleOverrideChange} />}
                    </div>
                )}

                {(!hasDelta || !hasGamma || !hasTheta || !hasVega) && (
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-purple-500 mb-2">Option Greeks</div>
                        {!hasDelta && <DebouncedOverrideInput label="Delta" overrideKey="delta" value={manualOverrides.delta} onChange={handleOverrideChange} />}
                        {!hasGamma && <DebouncedOverrideInput label="Gamma" overrideKey="gamma" value={manualOverrides.gamma} onChange={handleOverrideChange} />}
                        {!hasTheta && <DebouncedOverrideInput label="Theta" overrideKey="theta" value={manualOverrides.theta} onChange={handleOverrideChange} />}
                        {!hasVega && <DebouncedOverrideInput label="Vega" overrideKey="vega" value={manualOverrides.vega} onChange={handleOverrideChange} />}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="px-4 md:px-6 pt-2 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen space-y-4 md:space-y-6">

            {/* Global Header - Wrapped in z-50 so dropdowns float above the table */}
            <div className="relative z-50">
                <GlobalHeader
                    title="Options Sentiment"
                    score={compositeScore || 50}
                    prevScore={null}
                    gauge={engineGauge}
                    regime={{ ...(engineRegime || {}), description: engineAiInsight || 'Awaiting signals', confidence: engineSections ? Math.round((engineSections.filter(s => s.score !== null).length / Math.max(1, engineSections.length)) * 100) : 0 }}
                    integrity={{
                        coverageText: `${activeCardsCount}/${maxCards}`,
                        coveragePercent: coveragePercent,
                        source: chainData.length > 0 ? 'Live Upstox' : 'Manual',
                        freshness: resolveTime(!!(chainData.length > 0)),
                        snapshotTime: chainData.length > 0 ? `Live: ${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` : null
                    }}
                    sections={engineSections || []}
                    tailwinds={engineTailwinds || []}
                    risks={engineRisks || []}
                    totalCredits={totalCredits}
                    creditLabel="R Credits"
                    cards={cardsForHeader}
                    enableBreakdown={true}
                    syncId={{ instrumentKey: selectedInstrument?.value || selectedInstrument, category: 'options' }}
                    infoContent={optionsManualForm}
                    backsideContent={optionsManualForm}
                    controls={{
                        search: searchQuery,
                        onSearchChange: setSearchQuery,
                        viewMode,
                        onViewChange: setViewMode,
                        sortMode,
                        onSortChange: (m) => { setSortMode(m); setViewMode('flat'); },
                        matchCount: cardsForHeader.length,
                        customComponent: (
                            <div className="flex gap-2">
                                <UiverseDropdown
                                    placeholder="Sweet Spot"
                                    value={idealPremium}
                                    onChange={(v) => setIdealPremium(Number(v))}
                                    options={[
                                        { label: "Deep OTM (₹15)", value: 15 },
                                        { label: "Retail Sweet (₹30)", value: 30 },
                                        { label: "Balanced (₹45)", value: 45 },
                                        { label: "High Delta (₹80)", value: 80 },
                                        { label: "ITM Safe (₹150)", value: 150 }
                                    ]}
                                />
                            </div>
                        )
                    }}
                />
            </div>

            {/* Main Chain Layout Component */}
            {chainData.length > 0 ? (
                <OptionsChainLayout 
                    chain={chainData} 
                    picks={proDeskData.categories} 
                    spotPrice={spotPrice}
                    baseSpotPrice={baseSpotPrice} 
                    metrics={metrics} 
                    goldenZone={proDeskData.goldenStrikes}
                    manualIvRank={manualIvRank}
                    setManualIvRank={setManualIvRank}
                />
            ) : (
                <div className="flex items-center justify-center p-12 text-text-tertiary">
                    {loading ? "Loading Options Data..." : "No Options Data Available"}
                </div>
            )}

            {/* Live Metrics Grid */}
            {chainData.length > 0 && (
                <>
                    <div className="w-full h-px bg-white/5 my-6" />
                    <OptionsGrid
                        cards={cardsForHeader}
                        compositeData={compositeData}
                        onCardClick={setSelectedCard}
                        viewMode={viewMode}
                        sortMode={sortMode}
                        manualOverrides={manualOverrides}
                        resolveTime={resolveTime}
                        controls={{
                            search: searchQuery,
                            onSearchChange: setSearchQuery,
                            viewMode,
                            onViewChange: setViewMode,
                            sortMode,
                            onSortChange: (m) => { setSortMode(m); setViewMode("flat"); },
                            matchCount: cardsForHeader.length
                        }}
                    />
                </>
            )}

            {/* Detail Modal */}
            <OptionsModal
                open={!!selectedCard}
                onClose={() => setSelectedCard(null)}
                card={selectedCard}
            />
        </div>
    );
}
