import React, { useState } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import TechnicalGrid from "./TechnicalGrid";
import TechnicalModal from "./TechnicalModal";
import { DebouncedOverrideInput } from "@/shared/components/ui/Inputs/DebouncedOverrideInput";
import { useTechnicalComposite } from "../engine/useTechnicalComposite";
import { useDataFreshness } from '@/shared/hooks/useDataFreshness';
import { useTechnicalsData } from "../data/useTechnicalsData";
import { technicalSections } from "../engine/technicalHelper";
import CardSegmented from "@/shared/components/controls/CardSegmented";
import IndicatorSettingsModal from "@/shared/components/ui/IndicatorCard/IndicatorSettingsModal";
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { useDashboardContext } from "@/shared/context/DashboardContext";
import { useManualOverrides } from "@/shared/hooks/useManualOverrides";

const DEFAULT_OVERRIDES = {
    ad_line: null, mcclellan: null, nh_nl: null, trin: null,
    support: null, resistance: null, trendline: null, fibonacci: null, pivot: null,
    kc: null, cmf: null, breadth_ratio: null
};

export default function TechnicalPage() {
    const { selectedCategory, selectedInstrument, livePrices } = useDashboardContext();
    const isIndex = selectedCategory === 'Indices';

    const cards = [
        // Trend
        { id: "ema_20", category: "Trend" },
        { id: "ema_50", category: "Trend" },
        { id: "ema_200", category: "Trend" },
        { id: "sma_50", category: "Trend" },
        { id: "sma_200", category: "Trend" },
        { id: "adx", category: "Trend" },
        { id: "supertrend", category: "Trend" },
        // Momentum
        { id: "rsi", category: "Momentum" },
        { id: "macd", category: "Momentum" },
        { id: "stoch_rsi", category: "Momentum" },
        { id: "williams_r", category: "Momentum" },
        // Volatility
        { id: "bb_20_2", category: "Volatility" },
        { id: "atr", category: "Volatility" },
        { id: "kc", category: "Volatility" },
        // Volume / Breadth
        ...(!isIndex ? [
            { id: "cmf", category: "Volume" },
            { id: "volume_sma", category: "Volume" },
            { id: "obv", category: "Volume" },
            { id: "vwap", category: "Volume" }
        ] : [
            { id: "breadth_ratio", category: "Breadth" },
            { id: "mcclellan", category: "Breadth" },
            { id: "ad_line", category: "Breadth" },
            { id: "nh_nl", category: "Breadth" },
            { id: "trin", category: "Breadth" }
        ]),
        // Structure
        { id: "support", category: "Structure" },
        { id: "resistance", category: "Structure" },
        { id: "trendline", category: "Structure" },
        { id: "pivot", category: "Structure" },
        { id: "fibonacci", category: "Structure" }
    ];


    
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState("day");

    // Unified persistent overrides hook
    const { overrides: manualOverrides, lastUpdated: manualOverrideTimes, handleChange: handleOverrideChange, handleClearAll } = useManualOverrides('technical', selectedInstrument || 'NIFTY', DEFAULT_OVERRIDES);
    
    // Indicator Settings State
    const [indicatorParams, setIndicatorParams] = useState({ 
        adx_period: 14, 
        supertrend_period: 10, 
        supertrend_multiplier: 3,
        rsi_period: 14,
        macd_fast: 12, macd_slow: 26, macd_signal: 9,
        stoch_rsi_period: 14, stoch_period: 14, stoch_k_period: 3, stoch_d_period: 3,
        williams_period: 14,
        bb_period: 20, bb_stddev: 2, atr_period: 14, kc_period: 20, kc_multiplier: 1.5, kc_atr_period: 10
    });
    const [activeSettingsConfig, setActiveSettingsConfig] = useState(null);

    // Fetch Upstox data via 1-second polling hook
    const { liveData: rawTechnicalsData, loading: isLoading, error } = useTechnicalsData(selectedTimeframe, indicatorParams);

    // Inject real-time data if backend DB missed it
    const technicalsData = React.useMemo(() => {
        return { ...(rawTechnicalsData || {}) };
    }, [rawTechnicalsData, livePrices]);

    // Merge live technical data with manual overrides. Overrides take precedence if present.
    const activeData = React.useMemo(() => {
        const base = technicalsData || {};
        const merged = { ...base };
        
        // Manual overrides overwrite live data if the user explicitly types something
        Object.keys(manualOverrides).forEach(key => {
            if (manualOverrides[key] !== null && manualOverrides[key] !== undefined) {
                merged[key] = manualOverrides[key];
            }
        });
        
        return merged;
    }, [manualOverrides, technicalsData]);

    // Engine: Process the data
    const { 
        compositeScore,
        regime: engineRegime,
        sections,
        tailwinds, 
        risks, 
        aiInsight,
        cardScores
    } = useTechnicalComposite(activeData, isIndex);

    // --- cardsForHeader: mirrors FundamentalPage exactly ---
    // Only include keys that exist in the static cards registry to prevent
    // extra API/alias keys from inflating coverage (e.g. raw Upstox keys alongside aliases)
    const validCardIds = new Set(cards.map(c => c.id));
    const cardsForHeader = Object.entries(cardScores || {})
        .filter(([id, score]) =>
            validCardIds.has(id) &&
            score !== null && score !== undefined && !isNaN(score)
        )
        .map(([id, score]) => {
            let normalized = 0;
            if (score > 70) normalized = 1;       // Bullish
            else if (score < 30) normalized = -1;  // Bearish

            const config = getIndicatorConfig(id);
            const credit = config?.creditScore ?? 5;

            return {
                id,
                module: config?.title || id,
                normalized,
                credit,
                creditAllocation: credit,
                score,
            };
        });

    const totalCredits = cardsForHeader.reduce((acc, c) => acc + c.credit, 0);

    // maxCards: total cards in the registry (static list above)
    const maxCards = cards.length;
    const activeCardsCount = cardsForHeader.length;
    const coveragePercent = maxCards > 0 ? Math.min(100, Math.round((activeCardsCount / maxCards) * 100)) : 0;

    const hasData = (key) => technicalsData && technicalsData[key] !== undefined && technicalsData[key] !== null;

    // Manual Data Overrides Form (rendered on the backside of GlobalHeader)
    const technicalManualForm = (
        <div className="w-full h-full">
            <div className="flex items-center justify-between gap-2 mb-4 border-b border-border-default pb-2 pr-8 md:pr-10">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Manual Data Overrides</span>
                    <button 
                        onClick={handleClearAll}
                        className="px-2 py-0.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 rounded text-[10px] font-medium transition-colors border border-red-900/50"
                    >
                        Clear All
                    </button>
                </div>
            </div>
            <p className="text-[10px] text-text-secondary mb-4">
                Enter values for technical indicators when live streaming data is unavailable.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                {/* Structure & Breadth */}
                {((isIndex && (!hasData('ad_line') || !hasData('mcclellan') || !hasData('nh_nl') || !hasData('trin'))) || !hasData('support') || !hasData('resistance') || !hasData('trendline') || !hasData('fibonacci') || !hasData('pivot')) && (
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-yellow-500 mb-2">Structure & Breadth</div>
                        {isIndex && (
                            <>
                                {!hasData('breadth_ratio') && <DebouncedOverrideInput label="Breadth Ratio" overrideKey="breadth_ratio" value={manualOverrides.breadth_ratio} onChange={handleOverrideChange} />}
                                {!hasData('ad_line') && <DebouncedOverrideInput label="A/D Line" overrideKey="ad_line" value={manualOverrides.ad_line} onChange={handleOverrideChange} />}
                                {!hasData('mcclellan') && <DebouncedOverrideInput label="McClellan Osc" overrideKey="mcclellan" value={manualOverrides.mcclellan} onChange={handleOverrideChange} />}
                                {!hasData('nh_nl') && <DebouncedOverrideInput label="New Highs / Lows" overrideKey="nh_nl" value={manualOverrides.nh_nl} onChange={handleOverrideChange} />}
                                {!hasData('trin') && <DebouncedOverrideInput label="TRIN (Arms Index)" overrideKey="trin" value={manualOverrides.trin} onChange={handleOverrideChange} />}
                            </>
                        )}
                        {!hasData('support') && <DebouncedOverrideInput label="Support" overrideKey="support" value={manualOverrides.support} onChange={handleOverrideChange} />}
                        {!hasData('resistance') && <DebouncedOverrideInput label="Resistance" overrideKey="resistance" value={manualOverrides.resistance} onChange={handleOverrideChange} />}
                        {!hasData('trendline') && <DebouncedOverrideInput label="Trendline" overrideKey="trendline" value={manualOverrides.trendline} onChange={handleOverrideChange} />}
                        {!hasData('fibonacci') && <DebouncedOverrideInput label="Fibonacci" overrideKey="fibonacci" value={manualOverrides.fibonacci} onChange={handleOverrideChange} />}
                        {!hasData('pivot') && <DebouncedOverrideInput label="Pivot Points" overrideKey="pivot" value={manualOverrides.pivot} onChange={handleOverrideChange} />}
                    </div>
                )}
 
                {/* Volatility & Custom */}
                {(!hasData('kc') || (!isIndex && !hasData('cmf'))) && (
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-purple-500 mb-2">Volatility & Advanced</div>
                        {!hasData('kc') && <DebouncedOverrideInput label="Keltner Channels" overrideKey="kc" value={manualOverrides.kc} onChange={handleOverrideChange} />}
                        {!isIndex && !hasData('cmf') && <DebouncedOverrideInput label="CMF" overrideKey="cmf" value={manualOverrides.cmf} onChange={handleOverrideChange} />}
                    </div>
                )}
            </div>
        </div>
    );
 
    const getISTDateTime = () => {
        const date = new Date();
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        return new Date(utc + (3600000 * 5.5)); // UTC+5.5 (IST)
    };

    const isMarketOpen = () => {
        const now = getISTDateTime();
        const day = now.getDay(); // 0 is Sunday, 6 is Saturday
        if (day === 0 || day === 6) return false;
        
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeNum = hours * 100 + minutes;
        
        return timeNum >= 915 && timeNum <= 1530; // 9:15 AM to 3:30 PM IST
    };

    const formatTime = (ts) => {
        if (!ts) return null;
        return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const resolveTime = useDataFreshness(technicalsData, manualOverrides, manualOverrideTimes, isMarketOpen, formatTime, "1s");
 
    return (
        <div className="px-4 md:px-6 pt-2 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen space-y-4 md:space-y-6">
 
            {/* GLOBAL HEADER */}
            <GlobalHeader
                title="Technical Composite"
                score={compositeScore || 50}
                prevScore={null} // Hide delta pill until historical data is wired
                gauge={engineRegime}
                regime={{ ...(engineRegime || {}), description: aiInsight || "Awaiting signals", confidence: sections ? Math.round((sections.filter(s => s.score !== null).length / Math.max(1, sections.length)) * 100) : 0 }}
                integrity={{ 
                    coverageText: `${activeCardsCount}/${maxCards}`, 
                    coveragePercent: coveragePercent,
                    source: technicalsData ? "Live Upstox" : "Manual", 
                    freshness: resolveTime(!!technicalsData) 
                }}
                sections={sections || []}
                tailwinds={tailwinds || []}
                risks={risks || []}
                totalCredits={totalCredits}
                cards={cardsForHeader}
                infoContent={technicalManualForm}
                controls={{
                    search: searchQuery,
                    onSearchChange: setSearchQuery,
                    viewMode,
                    onViewChange: setViewMode,
                    sortMode,
                    onSortChange: (m) => { setSortMode(m); setViewMode("flat"); },
                    matchCount: cardsForHeader.length,
                    customComponent: (
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider hidden lg:block">Timeframe</span>
                            <CardSegmented
                                value={selectedTimeframe}
                                onChange={setSelectedTimeframe}
                                options={[
                                    { value: "1minute", label: "1m" },
                                    { value: "30minute", label: "30m" },
                                    { value: "day", label: "Daily" },
                                ]}
                            />
                        </div>
                    )
                }}
                backsideContent={technicalManualForm}
            />

            {/* GRID */}
            <TechnicalGrid
                manualOverrides={manualOverrides}
                resolveTime={resolveTime}
                cards={cardsForHeader.map(c => ({...c, creditAllocation: c.credit}))}
                onCardClick={setSelectedCard}
                viewMode={viewMode}
                sortMode={sortMode}
                searchQuery={searchQuery}
                controls={null}
                data={activeData}
                indicatorParams={indicatorParams}
                onOpenSettings={setActiveSettingsConfig}
                isIndex={isIndex}
            />

            {/* MODAL */}
            <TechnicalModal
                open={!!selectedCard}
                onClose={() => setSelectedCard(null)}
                card={selectedCard}
            />

            {activeSettingsConfig && (
                <IndicatorSettingsModal 
                    config={activeSettingsConfig}
                    currentParams={indicatorParams}
                    onSave={(newParams) => {
                        setIndicatorParams(prev => ({ ...prev, ...newParams }));
                        setActiveSettingsConfig(null);
                    }}
                    onClose={() => setActiveSettingsConfig(null)}
                />
            )}
        </div>
    );
}
