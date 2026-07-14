import React, { useState, useEffect, useMemo } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import OptionsModal from "./OptionsModal";
import OptionsChainLayout from "@/features/dashboard/options/ui/chain/OptionsChainLayout";
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import { generateProDeskPicks } from '../engine/proDeskEngine';
import { generateLiveCards } from '../engine/optionsEngine';
import socket from '@/shared/utils/socket';
import { calculateGreeks, resolveGreeks, timeToExpiry } from '../engine/blackScholesEngine';
import { calculatePCR, calculateMaxPain } from '../engine/optionsMath';
import OptionsGrid from './OptionsGrid';
import { useDashboardContext } from "@/shared/context/DashboardContext";

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
        expiries
    } = useDashboardContext();

    // Data state
    const [chainData, setChainData] = useState([]);
    const [spotPrice, setSpotPrice] = useState(24000); // Default, will be updated by chain
    const [loading, setLoading] = useState(false);
    
    // Fake metrics for the layout to use
    const [goldenZone, setGoldenZone] = useState(null);
    const [manualIvRank, setManualIvRank] = useState(34);

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
                        newRow.call = { ...newRow.call, ...resolved };
                        newRow.iv = resolved.iv;
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
                        newRow.put = { ...newRow.put, ...resolved };
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
                        
                        // Safely calculate OI change percentage
                        const calcOiPct = (oi, chg) => {
                            if (!oi || !chg) return 0;
                            const prevOi = oi - chg;
                            return prevOi > 0 ? (chg / prevOi) * 100 : 0;
                        };

                        return {
                            strike: c.strike_price,
                            iv: 0, // General IV or placeholder
                            call: {
                                instrument_key: c.call_options?.instrument_key,
                                ltp: callData.ltp || 0,
                                close: callData.close || callData.ltp || 0,
                                oi: callData.oi || 0,
                                vol: callData.volume || 0,
                                oiChg: callData.oi_change || 0,
                                oiChgPct: calcOiPct(callData.oi, callData.oi_change),
                                delta: 0, gamma: 0, theta: 0, vega: 0, iv: 0
                            },
                            put: {
                                instrument_key: c.put_options?.instrument_key,
                                ltp: putData.ltp || 0,
                                close: putData.close || putData.ltp || 0,
                                oi: putData.oi || 0,
                                vol: putData.volume || 0,
                                oiChg: putData.oi_change || 0,
                                oiChgPct: calcOiPct(putData.oi, putData.oi_change),
                                delta: 0, gamma: 0, theta: 0, vega: 0, iv: 0
                            }
                        };
                    });

                    // Attempt to extract spot price from the first item if available
                    let currentSpot = spotPrice;
                    if (chainArray[0].underlying_spot_price) {
                        currentSpot = chainArray[0].underlying_spot_price;
                        setSpotPrice(currentSpot);
                    }

                    let calculatedGoldenZone = null;

                    const spotIndex = normalizedChain.findIndex(c => c.strike >= currentSpot);
                    if (spotIndex !== -1) {
                        // 1. Calculate Golden Zone (12 strikes total: 6 above, 6 below ATM)
                        const startGolden = Math.max(0, spotIndex - 6);
                        const endGolden = Math.min(normalizedChain.length - 1, spotIndex + 5);
                        
                        calculatedGoldenZone = {
                            minStrike: normalizedChain[startGolden].strike,
                            maxStrike: normalizedChain[endGolden].strike
                        };
                        setGoldenZone(calculatedGoldenZone);
                    } else {
                        setGoldenZone(null);
                    }

                    // --- SUBSCRIBE TO WEBSOCKET GREEKS + SEED B-S GREEKS ---
                    try {
                        if (calculatedGoldenZone && spotIndex !== -1) {
                            const start = Math.max(0, spotIndex - 6);
                            const end = Math.min(normalizedChain.length, spotIndex + 6);
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

                                    const callGreeks = calculateGreeks(currentSpot, row.strike, T, 0.07, callVol, 'call');
                                    const putGreeks  = calculateGreeks(currentSpot, row.strike, T, 0.07, putVol,  'put');

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
    const proDeskPicks = useMemo(() => {
        if (!chainData || chainData.length === 0) return { ce: [], pe: [] };
        try {
            return generateProDeskPicks(chainData, spotPrice, goldenZone);
        } catch (e) {
            console.error("Error generating pro desk picks:", e);
            return { ce: [], pe: [] };
        }
    }, [chainData, spotPrice, goldenZone]);

    const expiryOptions = expiries.length > 0 
        ? expiries.map(exp => ({ label: exp, value: exp }))
        : [{ label: "No expiries", value: "" }];

    // 4. Generate Live Cards
    const cards = useMemo(() => {
        return generateLiveCards(chainData, spotPrice, metrics);
    }, [chainData, spotPrice, metrics]);

    return (
        <div className="px-4 md:px-6 pt-2 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen space-y-4 md:space-y-6">

            {/* Global Header - Wrapped in z-50 so dropdowns float above the table */}
            <div className="relative z-50">
                <GlobalHeader
                    title="Options Sentiment"
                    score={0}
                    prevScore={null}
                    gauge={{ label: "—", color: "#64748B" }}
                    regime={{ label: "—", description: "Loading", color: "#64748B", confidence: 0 }}
                    integrity={{ coverage: "—", source: "—", freshness: "—" }}
                    sections={[]}
                    tailwinds={[]}
                    risks={[]}
                    totalCredits={0}
                    cards={cards}
                    creditLabel="Greeks"
                    controls={{
                        search: searchQuery,
                        onSearchChange: setSearchQuery,
                        viewMode,
                        onViewChange: setViewMode,
                        sortMode,
                        onSortChange: setSortMode,
                        matchCount: 0,
                        customComponent: (
                            <div className="flex gap-2">
                                {/* Expiry Date (Kept here per request, synced globally) */}
                                <UiverseDropdown
                                    placeholder={loading && expiries.length === 0 ? "Loading expiries..." : "Expiry"}
                                    value={selectedExpiry}
                                    onChange={setSelectedExpiry}
                                    options={expiryOptions}
                                    disabled={loading || expiries.length === 0}
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
                    picks={proDeskPicks} 
                    spotPrice={spotPrice} 
                    metrics={metrics} 
                    goldenZone={goldenZone}
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
                        cards={cards}
                        onCardClick={setSelectedCard}
                        viewMode={viewMode}
                        sortMode={sortMode}
                        controls={{
                            search: searchQuery,
                            onSearchChange: setSearchQuery,
                            viewMode,
                            onViewChange: setViewMode,
                            sortMode,
                            onSortChange: (m) => { setSortMode(m); setViewMode("flat"); },
                            matchCount: cards.length
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
