/**
 * @file MasterDashboard.jsx
 * @purpose The central command center for the Praxis Composite dashboard.
 */

import React, { useState, useEffect } from "react";

// Shared UI
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import { useDashboardContext } from "@/shared/context/DashboardContext";
import { useDataRegistry } from "@/shared/context/DataRegistryContext";
import { useAiSync } from "@/shared/hooks/useAiSync";
import { CARD_REGISTRY } from "@/shared/config/cardRegistry";

import LiveMarketTicker from "./LiveMarketTicker";
import MarketHeatmap from "./MarketHeatmap";
import AdvancedCandlestickChart from "@/shared/components/charts/AdvancedCandlestickChart";
import { useHistoricalCandles } from "@/shared/hooks/useHistoricalCandles";
import FiiDiiFlow from "./FiiDiiFlow";
import OptionsPulse from "./OptionsPulse";
import SectorRotation from "./SectorRotation";
import VolumeShockers from "./VolumeShockers";
import CatalystCalendar from "./CatalystCalendar";

import { useMasterComposite } from "../engine/useMasterComposite";
import { getCompositeColor } from "@/shared/config/scoreColors";
import { FO_INDICES, FO_EQUITIES } from "@/shared/utils/foInstruments";
import { getNifty50Keys, NIFTY_50_SYMBOLS } from "../data/nifty50";

// =============================
// Main Component
// =============================

export default function MasterDashboard() {
    // Persist timeframe in localStorage — synced with TechnicalPage
    const [selectedTimeframe, setSelectedTimeframe] = useState(() => {
        return localStorage.getItem('praxis_technical_timeframe') || 'day';
    });

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
        fiiDiiFlow
    } = useDashboardContext();

    const isIndex = selectedCategory === 'Indices';
    const activeOpts = smartlists?.['MOST_ACTIVE'] || [];
    
    // Compute Market Heatmap Data for AI Payload
    const heatmapKeys = getNifty50Keys();
    const marketHeatmapData = NIFTY_50_SYMBOLS.map((symbol, index) => {
        const tick = livePrices[heatmapKeys[index]];
        return { symbol, pctChange: tick?.pctChange || 0 };
    });

    const { praxisComposite, modifierImpact, sectionsForHeader, tailwinds, risks, regime, loading, integrity, totalCredits, aggregatedCards, nestedTreePayload } = useMasterComposite(selectedInstrument, isIndex, selectedExpiry, livePrices, {
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

    const instKey = selectedInstrument?.value || selectedInstrument || 'NSE_INDEX|Nifty 50';
    const { data: candleData, loading: candlesLoading, isBackfilling, liveCandle } = useHistoricalCandles(instKey, selectedTimeframe);

    const getReadableName = (inst) => {
        if (!inst) return 'NIFTY 50';
        const val = typeof inst === 'string' ? inst : inst.value;
        if (!val) return 'NIFTY 50';
        const all = [...(FO_INDICES || []), ...(FO_EQUITIES || [])];
        const found = all.find(i => i.value === val || i.value.includes(val) || val.includes(i.value));
        return found ? found.label : val.split('|').pop().replace('NSE_EQ:', '').replace('NSE_INDEX:', '');
    };

    const chartBackside = (
        <div className="w-full h-full min-h-[350px] bg-background-card rounded-2xl flex flex-col p-2 relative">
            <div className="flex justify-between items-center mb-2 px-2 pt-2 z-10 relative">
                <div className="text-[15px] font-black text-text-primary uppercase tracking-widest drop-shadow-sm">
                    {getReadableName(selectedInstrument)}
                </div>
                <div className="flex bg-transparent rounded-lg p-[2px] mr-12 border border-border-subtle shadow-sm pointer-events-auto">
                    {['1minute', '5minute', '15minute', '1hour', 'day', 'week'].map((tf) => (
                        <button
                            key={tf}
                            onPointerDown={(e) => e.stopPropagation()} // prevent the flip
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
            <div className="flex-1 w-full relative flex flex-col">
                {candlesLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background-app/80 z-20 backdrop-blur-md rounded-xl border border-border-subtle">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg" />
                        <div className="mt-3 text-xs font-semibold text-text-secondary tracking-widest uppercase">Loading Chart...</div>
                    </div>
                )}
                {(!candlesLoading || candleData?.length > 0) && (
                    <AdvancedCandlestickChart 
                        key={`${instKey}-${selectedTimeframe}`}
                        data={candleData} 
                        liveCandle={liveCandle}
                        showValuationBands={false} 
                        showEvents={false}
                        isBackfilling={isBackfilling}
                        instrumentKey={selectedInstrument || 'NSE:NIFTY50-INDEX'}
                        timeframe={selectedTimeframe}
                    />
                )}
            </div>
        </div>
    );

    return (
        <div className="block px-4 sm:px-6 pt-2 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto h-full space-y-4 md:space-y-6">
            
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
                risks={risks}
                totalCredits={totalCredits}
                enableBreakdown={true}
                cards={aggregatedCards}
                masterPayload={masterPayload}
                controls={{ customComponent: <LiveMarketTicker /> }}
                customBackContent={chartBackside}
            />

            {/* Tier 1 Grid */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-8 h-full">
                    <MarketHeatmap />
                </div>
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                    <div className="h-[250px]">
                        <FiiDiiFlow />
                    </div>
                    <div className="h-[300px]">
                        <OptionsPulse />
                    </div>
                </div>
            </div>

            {/* Tier 2 Grid */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-4 h-[350px]">
                    <SectorRotation />
                </div>
                <div className="col-span-12 lg:col-span-4 h-[350px]">
                    <VolumeShockers />
                </div>
                <div className="col-span-12 lg:col-span-4 h-[350px]">
                    <CatalystCalendar />
                </div>
            </div>

        </div>
    );
}
