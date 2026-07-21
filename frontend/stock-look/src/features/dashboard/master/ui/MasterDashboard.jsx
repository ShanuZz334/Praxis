/**
 * @file MasterDashboard.jsx
 * @purpose The central command center for the Praxis Composite dashboard.
 */

import React, { useState, useEffect } from "react";

// Shared UI
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import { useDashboardContext } from "@/shared/context/DashboardContext";
import { useAiSync } from "@/shared/hooks/useAiSync";

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
    
    const { praxisComposite, modifierImpact, sectionsForHeader, tailwinds, risks, regime, loading, integrity, totalCredits, aggregatedCards } = useMasterComposite(selectedInstrument, isIndex, selectedExpiry, livePrices, {
        sectors,
        activeOpts,
        fiiDiiFlow
    });

    const c = getCompositeColor(praxisComposite);
    const gauge = { label: c.label, color: c.hex };

    // Silently Stream the Snapshot to SQLite backend
    useAiSync(
        selectedInstrument?.value || selectedInstrument,
        "Master", 
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
    const { data: candleData, loading: candlesLoading, isBackfilling } = useHistoricalCandles(instKey, selectedTimeframe);

    const chartBackside = (
        <div className="w-full h-full min-h-[350px] bg-background-card rounded-2xl flex flex-col p-2 relative">
            <div className="flex justify-between items-center mb-2 px-2 pt-2 z-10 relative">
                <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {typeof selectedInstrument === 'string' 
                        ? selectedInstrument.split('|').pop() 
                        : (selectedInstrument?.label || 'NIFTY 50').split('|').pop()}
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
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm rounded-lg">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <AdvancedCandlestickChart 
                    data={candleData} 
                    showValuationBands={false} 
                    showEvents={false}
                    isBackfilling={isBackfilling}
                    instrumentKey={selectedInstrument || 'NSE:NIFTY50-INDEX'}
                    timeframe={selectedTimeframe}
                />

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
