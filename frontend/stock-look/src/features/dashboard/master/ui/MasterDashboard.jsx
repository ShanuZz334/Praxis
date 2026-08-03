/**
 * @file MasterDashboard.jsx
 * @purpose The central command center for the Praxis Composite dashboard.
 */

import React, { useState, useEffect } from "react";

import { Frame } from 'lucide-react';

// Shared UI
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import { useDashboardContext } from "@/shared/context/DashboardContext";
import { useDataRegistry } from "@/shared/context/DataRegistryContext";
import { useAiSync } from "@/shared/hooks/useAiSync";
import { CARD_REGISTRY } from "@/shared/config/cardRegistry";
import Loader from "@/shared/components/ui/Loader";

import LiveMarketTicker from "./LiveMarketTicker";
import MarketHeatmap from "./MarketHeatmap";
import ChartSlot from "./ChartSlot";
import FiiDiiFlow from "./FiiDiiFlow";
import OptionsPulse from "./OptionsPulse";
import SectorRotation from "./SectorRotation";
import VolumeShockers from "./VolumeShockers";
import CatalystCalendar from "./CatalystCalendar";

import { useMasterComposite } from "../engine/useMasterComposite";
import { getCompositeColor } from "@/shared/config/scoreColors";
import { FO_INDICES, FO_EQUITIES } from "@/shared/utils/foInstruments";
import { getNifty50Keys, NIFTY_50_SYMBOLS } from "../data/nifty50";
import { PlusCircle, X, PlusSquare } from 'lucide-react';
import UiverseDropdown from "@/shared/components/ui/UiverseDropdown";
import InstrumentSelectorModal from "@/features/trading/ui/InstrumentSelectorModal";
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';

// =============================
// Main Component
// =============================

export default function MasterDashboard() {
    // Persist timeframe in localStorage — synced with TechnicalPage
    const [selectedTimeframe, setSelectedTimeframe] = useState(() => {
        return localStorage.getItem('praxis_technical_timeframe') || 'day';
    });

    const [isAddChartOpen, setIsAddChartOpen] = useState(false);
    const [addChartCategory, setAddChartCategory] = useState("Indices");
    const [optionContracts, setOptionContracts] = useState([]);
    const [optionsLoading, setOptionsLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('praxis_technical_timeframe', selectedTimeframe);
    }, [selectedTimeframe]);

    const {
        selectedCategory,
        selectedInstrument,
        selectedExpiry,
        livePrices,
        sectors,
        smartlists,
        fiiDiiFlow,
        marketNews,
        additionalCharts,
        setAdditionalCharts,
        setGlobalOrderTicket
    } = useDashboardContext();

    useEffect(() => {
        const instKey = selectedInstrument?.value || selectedInstrument || null;
        if (addChartCategory === "Options" && instKey) {
            setOptionsLoading(true);
            axiosInstance.get(API_PATHS.OPTIONS.GET_CONTRACTS(instKey))
                .then(res => {
                    const contracts = res.data?.data || res.data || [];
                    
                    const sorted = contracts.sort((a, b) => {
                        const dateA = new Date(a.expiry || a.expiry_date || 0);
                        const dateB = new Date(b.expiry || b.expiry_date || 0);
                        if (dateA.getTime() !== dateB.getTime()) {
                            return dateA - dateB;
                        }
                        const strikeA = a.strike || a.strike_price || 0;
                        const strikeB = b.strike || b.strike_price || 0;
                        return strikeA - strikeB;
                    });

                    const formatted = sorted.map(c => ({
                        label: c.trading_symbol || c.name || c.instrument_key,
                        value: c.instrument_key,
                        badge: 'NFO'
                    }));
                    setOptionContracts(formatted);
                })
                .catch(err => console.error(err))
                .finally(() => setOptionsLoading(false));
        }
    }, [addChartCategory, selectedInstrument]);

    const isIndex = selectedCategory === 'Indices';
    const activeOpts = smartlists?.['MOST_ACTIVE'] || [];
    
    // Compute Market Heatmap Data for AI Payload
    const heatmapKeys = getNifty50Keys();
    const marketHeatmapData = NIFTY_50_SYMBOLS.map((symbol, index) => {
        const tick = livePrices[heatmapKeys[index]];
        return { symbol, pctChange: tick?.pctChange || 0 };
    });

    const instKeyForEngine = selectedInstrument?.value || selectedInstrument || null;
    const { praxisComposite, modifierImpact, sectionsForHeader, tailwinds, risks, regime, loading, integrity, totalCredits, aggregatedCards, nestedTreePayload } = useMasterComposite(instKeyForEngine, isIndex, selectedExpiry, livePrices, {
        sectors,
        activeOpts,
        fiiDiiFlow
    });

    const { getMasterSnapshot, registerBulk, register } = useDataRegistry();

    // Register fallback cards globally so autocomplete has live values for unmounted cards
    useEffect(() => {
        if (aggregatedCards && aggregatedCards.length > 0) {
            registerBulk('master', aggregatedCards);
        }

        // Also register Master Widgets into the registry so @mentions in chat can resolve their live data
        if (fiiDiiFlow) register('master', CARD_REGISTRY.fii_dii_flow_master.id, { value: JSON.stringify(fiiDiiFlow) });
        if (sectors) register('master', CARD_REGISTRY.sector_rotation.id, { value: JSON.stringify(sectors) });
        if (activeOpts) register('master', CARD_REGISTRY.options_pulse.id, { value: JSON.stringify(activeOpts) });
        if (marketHeatmapData) register('master', CARD_REGISTRY.market_heatmap.id, { value: JSON.stringify(marketHeatmapData) });
    }, [aggregatedCards, registerBulk, register, fiiDiiFlow, sectors, activeOpts, marketHeatmapData]);

    const masterPayload = nestedTreePayload ? {
        ...nestedTreePayload,
        // Live card-level data from all pages — used by AI for richer insights
        // and by summarizePageData() on the backend
        liveCardData: getMasterSnapshot(),
        master_widgets: {
            [CARD_REGISTRY.fii_dii_flow_master.id]: fiiDiiFlow || null,
            [CARD_REGISTRY.sector_rotation.id]: sectors || null,
            [CARD_REGISTRY.options_pulse.id]: activeOpts || null,
            [CARD_REGISTRY.market_heatmap.id]: marketHeatmapData || null
        }
    } : null;

    const c = getCompositeColor(praxisComposite);
    const gauge = { label: c.label, color: c.hex };

    // Silently Stream the Snapshot to SQLite backend
    useAiSync(
        selectedInstrument?.value || selectedInstrument,
        CARD_REGISTRY.praxis_composite_header.id, 
        {
            compositeScore: praxisComposite,
            regime: regime,
            sections: sectionsForHeader,
            tailwinds: tailwinds,
            risks: risks,
            aiInsight: null, // Master doesn't generate a text insight yet
            cards: aggregatedCards
        }
    );

    if (loading && aggregatedCards.length === 0) {
        return (
            <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-background-base animate-in fade-in duration-500">
                <Loader size="lg" color="blue" />
                <p className="text-text-secondary mt-8 font-mono text-[11px] tracking-[0.2em] animate-pulse uppercase">
                    Synchronizing Master Pipeline...
                </p>
            </div>
        );
    }

    const getReadableName = (val) => {
        if (!val) return 'NO INSTRUMENT';
        const strVal = typeof val === 'string' ? val : val.value;
        if (!strVal) return 'NO INSTRUMENT';
        const all = [...(FO_INDICES || []), ...(FO_EQUITIES || []), ...optionContracts];
        const found = all.find(i => i.value === strVal || i.value.includes(strVal) || strVal.includes(i.value));
        return found ? found.label : strVal.split('|').pop().replace('NSE_EQ:', '').replace('NSE_INDEX:', '');
    };

    const instKey = selectedInstrument?.value || selectedInstrument || null;
    const combinedCharts = instKey ? [{ value: instKey, label: getReadableName(instKey) }, ...additionalCharts] : [];
    
    // Grid layout logic
    const gridColsClass = combinedCharts.length > 1 ? 'grid-cols-2' : 'grid-cols-1';
    const gridRowsClass = combinedCharts.length > 2 ? 'grid-rows-2' : 'grid-rows-1';

    const handleAddChart = (selected) => {
        const val = selected?.value || selected?.instrument_token;
        const label = selected?.tradingsymbol || selected?.label || selected?.name || val?.split('|').pop();
        
        if (val && additionalCharts.length < 3 && !additionalCharts.some(c => c.value === val) && val !== instKey) {
            setAdditionalCharts([...additionalCharts, { value: val, label }]);
        }
        setIsAddChartOpen(false);
    };

    const handleRemoveChart = (keyToRemove) => {
        setAdditionalCharts(additionalCharts.filter(c => c.value !== keyToRemove));
    };

    const chartBackside = (
        <div className="w-full h-full min-h-[500px] bg-background-card rounded-2xl flex flex-col p-2 relative">
            {!instKey ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
                    <Frame className="w-12 h-12 mb-3 opacity-20" />
                    <span className="text-sm font-medium tracking-wide">NO INSTRUMENT SELECTED</span>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-2 px-2 pt-2 z-50 relative pointer-events-none">
                        <div className="text-[15px] font-black text-text-primary uppercase tracking-widest drop-shadow-sm flex items-center gap-4 pointer-events-auto">
                            {combinedCharts.length === 1 ? (
                                <div className="flex items-center gap-2">
                                    <span>{getReadableName(selectedInstrument)}</span>
                                    <button 
                                        onClick={() => setGlobalOrderTicket({ type: 'QUICK', data: { instrument_token: selectedInstrument?.value || selectedInstrument, tradingsymbol: getReadableName(selectedInstrument), side: 'BUY' }})} 
                                        className="px-2 py-[2px] bg-blue-600/15 text-blue-500 hover:bg-blue-600 hover:text-white border border-blue-500/30 rounded-[4px] text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                                        title="Quick Buy"
                                    >
                                        B
                                    </button>
                                    <button 
                                        onClick={() => setGlobalOrderTicket({ type: 'QUICK', data: { instrument_token: selectedInstrument?.value || selectedInstrument, tradingsymbol: getReadableName(selectedInstrument), side: 'SELL' }})} 
                                        className="px-2 py-[2px] bg-red-500/15 text-[#eb4b4b] hover:bg-[#eb4b4b] hover:text-white border border-red-500/30 rounded-[4px] text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                                        title="Quick Sell"
                                    >
                                        S
                                    </button>
                                </div>
                            ) : 'MULTI-CHART VIEW'}
                            
                            {/* Add Chart UI */}
                            {combinedCharts.length < 4 && (
                                <div className="relative flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsAddChartOpen(!isAddChartOpen)}
                                        className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors border border-transparent hover:border-border-subtle"
                                        title="Compare Instrument"
                                    >
                                        <PlusSquare size={15} />
                                    </button>
                                    
                                    {isAddChartOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-[300px] h-[380px] z-[99999]">
                                            <InstrumentSelectorModal
                                                isOpen={isAddChartOpen}
                                                onClose={() => setIsAddChartOpen(false)}
                                                currentInstrument={null}
                                                onSelect={handleAddChart}
                                                mode="select"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex bg-transparent rounded-lg p-[2px] mr-12 border border-border-subtle shadow-sm pointer-events-auto">
                            {['1minute', '5minute', '15minute', '30minute', '1hour', 'day', 'week'].map((tf) => (
                                <button
                                    key={tf}
                                    onPointerDown={(e) => e.stopPropagation()} 
                                    onClick={(e) => { e.stopPropagation(); setSelectedTimeframe(tf); }}
                                    className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
                                        selectedTimeframe === tf 
                                            ? 'bg-background-card border border-border-default shadow-sm text-text-primary' 
                                            : 'text-text-secondary border border-transparent hover:text-text-primary hover:bg-background-subtle'
                                    }`}
                                >
                                    {tf.replace('minute', 'm').replace('hour', 'h').replace('day', 'Daily').replace('week', '1W')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`flex-1 w-full relative grid ${gridColsClass} ${gridRowsClass} gap-2 p-1`}>
                        {combinedCharts.map((chartItem, index) => {
                            const key = chartItem.value;
                            return (
                                <ChartSlot
                                    key={`${key}-${selectedTimeframe}`}
                                    instrumentKey={key}
                                    label={chartItem.label}
                                    lotSize={chartItem.lot_size}
                                    timeframe={selectedTimeframe}
                                    isPrimary={index === 0}
                                    isSingle={combinedCharts.length === 1}
                                    onClose={() => handleRemoveChart(key)}
                                    onQuickOrder={(data) => setGlobalOrderTicket({ type: 'QUICK', data })}
                                    className={
                                        combinedCharts.length === 3 && index === 0 
                                            ? "col-span-2 order-last" 
                                            : ""
                                    }
                                />
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="block px-4 sm:px-6 pt-2 pb-32 animate-in fade-in duration-500 w-full mx-auto h-full space-y-4 md:space-y-6">
            
            <GlobalHeader
                title="Praxis Composite"
                score={praxisComposite}
                scoreModifier={modifierImpact}
                prevScore={null}
                gauge={gauge}
                regime={regime}
                integrity={integrity}
                sections={sectionsForHeader}
                tailwinds={tailwinds}
                headwinds={risks}
                totalCredits={totalCredits}
                enableBreakdown={true}
                cards={aggregatedCards}
                masterPayload={masterPayload}
                controls={{ customComponent: <LiveMarketTicker livePrices={livePrices} /> }}
                customBackContent={chartBackside}
            />

            {/* Tier 1 Grid */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-8 h-full">
                    <MarketHeatmap livePrices={livePrices} />
                </div>
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                    <div className="h-[250px]">
                        <FiiDiiFlow liveFiiDiiFlow={fiiDiiFlow} />
                    </div>
                    <div className="h-[300px]">
                        <OptionsPulse smartlists={smartlists} />
                    </div>
                </div>
            </div>

            {/* Tier 2 Grid */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-4 h-[350px]">
                    <SectorRotation sectors={sectors} />
                </div>
                <div className="col-span-12 lg:col-span-4 h-[350px]">
                    <VolumeShockers smartlists={smartlists} />
                </div>
                <div className="col-span-12 lg:col-span-4 h-[350px]">
                    <CatalystCalendar marketNews={marketNews} />
                </div>
            </div>
            
        </div>
    );
}
