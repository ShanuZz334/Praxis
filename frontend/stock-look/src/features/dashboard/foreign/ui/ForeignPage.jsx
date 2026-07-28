/**
 * @file ForeignPage.jsx
 * @purpose Main entry point for the Global Macro / Foreign Intelligence feature.
 * @responsibilities
 * - Renders GlobalHeader for the Global module.
 * - Renders GlobalStructureGrid.
 * - Manages view/sort/search controls.
 * - Integrates manual overrides for global indicators with live Upstox data fallbacks.
 * @lifecycle
 * - Route: /dashboard/global
 */

import React, { useState, useMemo } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import GlobalStructureGrid from "./GlobalStructureGrid";
import GlobalStructureModal from "./GlobalStructureModal";
import { GLOBAL_SECTIONS, TOTAL_GLOBAL_CREDITS } from "../data/globalData";
import { useDashboardContext } from "@/shared/context/DashboardContext";
import { useManualOverrides } from "@/shared/hooks/useManualOverrides";
import { DebouncedOverrideInput } from "@/shared/components/ui/Inputs/DebouncedOverrideInput";
import { useGlobalComposite, ID_TO_TITLE_GLOBAL } from "../engine/useGlobalComposite";
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { useDataFreshness } from '@/shared/hooks/useDataFreshness';
import { useAiSync } from "@/shared/hooks/useAiSync";
import { computeCardConfidence, computeHeaderConfidence } from "@/shared/engine/confidenceEngine";
import { useGlobalApiData } from "../data/useGlobalApiData";

const DEFAULT_OVERRIDES = {
    dxy: null,
    usd_inr: null,
    crude: null,
    gold: null,
    silver: null,
    us_10y_yield: null,
    sp_futures: null,
    nasdaq_futures: null,
    dow_futures: null,
    vix: null,
    bitcoin: null,
    eurusd: null,
    usdjpy: null,
    nikkei: null,
    ftse: null,
    dax: null,
    hangseng: null,
    shanghai: null,
    cac40: null,
    eurostoxx: null,
    copper: null,
    natgas: null,
    wheat: null,
    aluminum: null,
    move: null
};

export default function ForeignPage() {
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCard, setSelectedCard] = useState(null);

    const { livePrices } = useDashboardContext();
    const { overrides: manualOverrides, lastUpdated: manualLastUpdated, handleChange: handleOverrideChange, handleClearAll } = useManualOverrides('global', 'global_macro', DEFAULT_OVERRIDES);

    // Extract Upstox live data
    const liveData = useMemo(() => {
        return {
            dxy: livePrices?.["GLOBAL_INDICATOR|DXY"]?.ltp || null,
            usd_inr: livePrices?.["GLOBAL_INDICATOR|USDINR"]?.ltp || null,
            crude: livePrices?.["GLOBAL_INDICATOR|BZUSD"]?.ltp || null,
            gold: livePrices?.["GLOBAL_INDICATOR|GOLD"]?.ltp || null,
            silver: livePrices?.["GLOBAL_INDICATOR|SILVER"]?.ltp || null,
            us_10y_yield: null, // Upstox doesn't stream this
            sp_futures: null,
            nasdaq_futures: null,
            dow_futures: null,
            vix: null,
            bitcoin: null
        };
    }, [livePrices]);

    const liveApiData = useGlobalApiData();

    // Merge Upstox and Yahoo/CoinGecko live data
    const mergedLiveData = useMemo(() => {
        return {
            ...liveApiData,
            ...liveData
        };
    }, [liveApiData, liveData]);

    const compositeData = useGlobalComposite(manualOverrides, mergedLiveData);

    const getISTDateTime = () => {
        const date = new Date();
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        return new Date(utc + (3600000 * 5.5)); // UTC+5.5 (IST)
    };
  
    const isMarketOpen = () => {
        const now = getISTDateTime();
        const day = now.getDay(); 
        if (day === 0 || day === 6) return false;
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeNum = hours * 100 + minutes;
        // Global markets have different timings, but we'll stick to Indian standard hours for the main clock, 
        // or just return true to always treat it as live. Let's return true for now.
        return true; 
    };
  
    const formatTime = (ts) => {
        if (!ts) return null;
        return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    // Calculate freshness correctly based on whether we have live data or manual overrides
    const resolveTime = useDataFreshness(liveData, manualOverrides, manualLastUpdated, isMarketOpen, formatTime, "1m");

    const globalManualForm = (
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
                When Upstox does not provide data for a specific global indicator, it falls back to the manual overrides configured here.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                <div className="space-y-3">
                    <div className="text-xs font-bold text-emerald-500 mb-3 border-b border-border-default pb-2">Currency</div>
                    {!liveData.dxy && <DebouncedOverrideInput label="US Dollar Index (DXY) (Points)" overrideKey="dxy" value={manualOverrides.dxy} onChange={handleOverrideChange} />}
                    {!liveData.usd_inr && <DebouncedOverrideInput label="USD/INR Rate (₹)" overrideKey="usd_inr" value={manualOverrides.usd_inr} onChange={handleOverrideChange} />}
                    {!liveData.eurusd && <DebouncedOverrideInput label="EUR/USD ($)" overrideKey="eurusd" value={manualOverrides.eurusd} onChange={handleOverrideChange} />}
                    {!liveData.usdjpy && <DebouncedOverrideInput label="USD/JPY (¥)" overrideKey="usdjpy" value={manualOverrides.usdjpy} onChange={handleOverrideChange} />}
                </div>
                
                <div className="space-y-3">
                    <div className="text-xs font-bold text-yellow-500 mb-3 border-b border-border-default pb-2">Commodities</div>
                    {!liveData.crude && <DebouncedOverrideInput label="Brent Crude Oil ($/bbl)" overrideKey="crude" value={manualOverrides.crude} onChange={handleOverrideChange} />}
                    {!liveData.gold && <DebouncedOverrideInput label="Gold ($/oz)" overrideKey="gold" value={manualOverrides.gold} onChange={handleOverrideChange} />}
                    {!liveData.silver && <DebouncedOverrideInput label="Silver ($/oz)" overrideKey="silver" value={manualOverrides.silver} onChange={handleOverrideChange} />}
                    {!liveData.copper && <DebouncedOverrideInput label="Copper ($/lb)" overrideKey="copper" value={manualOverrides.copper} onChange={handleOverrideChange} />}
                    {!liveData.natgas && <DebouncedOverrideInput label="Natural Gas ($/MMBtu)" overrideKey="natgas" value={manualOverrides.natgas} onChange={handleOverrideChange} />}
                    {!liveData.wheat && <DebouncedOverrideInput label="Wheat ($/bu)" overrideKey="wheat" value={manualOverrides.wheat} onChange={handleOverrideChange} />}
                    {!liveData.aluminum && <DebouncedOverrideInput label="Aluminum ($/ton)" overrideKey="aluminum" value={manualOverrides.aluminum} onChange={handleOverrideChange} />}
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold text-purple-500 mb-3 border-b border-border-default pb-2">Rates & Volatility</div>
                    {!liveData.us_10y_yield && <DebouncedOverrideInput label="US 10-Year Yield (%)" overrideKey="us_10y_yield" value={manualOverrides.us_10y_yield} onChange={handleOverrideChange} />}
                    {!liveData.vix && <DebouncedOverrideInput label="CBOE VIX (Absolute)" overrideKey="vix" value={manualOverrides.vix} onChange={handleOverrideChange} />}
                    {!liveData.move && <DebouncedOverrideInput label="MOVE Index" overrideKey="move" value={manualOverrides.move} onChange={handleOverrideChange} />}
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold text-blue-500 mb-3 border-b border-border-default pb-2">US Markets</div>
                    {!liveData.sp_futures && <DebouncedOverrideInput label="S&P 500 Futures ($/Points)" overrideKey="sp_futures" value={manualOverrides.sp_futures} onChange={handleOverrideChange} />}
                    {!liveData.nasdaq_futures && <DebouncedOverrideInput label="Nasdaq Futures ($/Points)" overrideKey="nasdaq_futures" value={manualOverrides.nasdaq_futures} onChange={handleOverrideChange} />}
                    {!liveData.dow_futures && <DebouncedOverrideInput label="Dow Jones Futures ($/Points)" overrideKey="dow_futures" value={manualOverrides.dow_futures} onChange={handleOverrideChange} />}
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold text-orange-400 mb-3 border-b border-border-default pb-2">Digital Assets</div>
                    {!liveData.bitcoin && <DebouncedOverrideInput label="Bitcoin ($)" overrideKey="bitcoin" value={manualOverrides.bitcoin} onChange={handleOverrideChange} />}
                </div>
                <div className="space-y-3">
                    <div className="text-xs font-bold text-indigo-400 mb-3 border-b border-border-default pb-2">Global Indices</div>
                    {!liveData.nikkei && <DebouncedOverrideInput label="Nikkei 225 (¥ JPY)" overrideKey="nikkei" value={manualOverrides.nikkei} onChange={handleOverrideChange} />}
                    {!liveData.ftse && <DebouncedOverrideInput label="FTSE 100 (£ GBP)" overrideKey="ftse" value={manualOverrides.ftse} onChange={handleOverrideChange} />}
                    {!liveData.dax && <DebouncedOverrideInput label="DAX 40 (€ EUR)" overrideKey="dax" value={manualOverrides.dax} onChange={handleOverrideChange} />}
                    {!liveData.hangseng && <DebouncedOverrideInput label="Hang Seng (HK$ HKD)" overrideKey="hangseng" value={manualOverrides.hangseng} onChange={handleOverrideChange} />}
                    {!liveData.shanghai && <DebouncedOverrideInput label="Shanghai Comp (¥ CNY)" overrideKey="shanghai" value={manualOverrides.shanghai} onChange={handleOverrideChange} />}
                    {!liveData.cac40 && <DebouncedOverrideInput label="CAC 40 (€ EUR)" overrideKey="cac40" value={manualOverrides.cac40} onChange={handleOverrideChange} />}
                    {!liveData.eurostoxx && <DebouncedOverrideInput label="Euro Stoxx 50 (€ EUR)" overrideKey="eurostoxx" value={manualOverrides.eurostoxx} onChange={handleOverrideChange} />}
                </div>
            </div>
        </div>
    );

    // Dynamic Coverage & Credits Calculation
    const maxCards = 25;
    const activeCardsCount = Object.values(compositeData.rawScores || {}).filter(v => v !== null && v !== undefined && !isNaN(v)).length;
    const coveragePercent = Math.min(100, Math.round((activeCardsCount / maxCards) * 100));

    const cardsForHeader = Object.entries(compositeData.rawScores || {})
        .filter(([_, score]) => score !== null && score !== undefined && !isNaN(score))
        .map(([id, score]) => {
            let normalized = 0;
            if (score > 70) normalized = 1;  // Bullish
            else if (score < 30) normalized = -1; // Bearish

            const cardName = ID_TO_TITLE_GLOBAL[id] || id;
            const configId = id === 'crude' ? 'brent_crude_oil' : id;
            const configData = getIndicatorConfig(configId);
            const credit = configData?.creditScore ?? 5;
            const allocated = (score / 100) * credit;

            const isManual = manualOverrides && manualOverrides[id] !== undefined && manualOverrides[id] !== null && manualOverrides[id] !== '';
            const isLive = liveData && liveData[id] !== undefined && liveData[id] !== null;
            const cardMeta = {
                hasLiveData: isLive,
                isManual: isManual,
                lastUpdated: resolveTime(isLive, isManual ? null : id) ? new Date(resolveTime(isLive, isManual ? null : id)).getTime() : Date.now(),
                sourcePipeline: isLive ? 'upstox' : (isManual ? 'manual' : 'fallback')
            };
            const cCard = computeCardConfidence(cardMeta, 'foreign');

            return { id, module: cardName, normalized, credit, creditAllocation: allocated, score, cCard };
        });

    const totalCredits = cardsForHeader.reduce((acc, c) => acc + c.credit, 0);
    const headerConfidence = computeHeaderConfidence(cardsForHeader, 25, 'foreign');

    const hasLiveOrManualData = Object.values(liveData).some(v => v !== null) || Object.values(manualOverrides).some(v => v !== null);

    // 7. Silently Stream the Snapshot to SQLite backend
    useAiSync(
        "GLOBAL_MACRO", // Generic key for global
        "Global", 
        {
            compositeScore: compositeData.compositeScore,
            regime: compositeData.regime,
            sections: compositeData.sections,
            tailwinds: compositeData.tailwinds,
            risks: compositeData.risks,
            aiInsight: compositeData.aiInsight,
            cards: cardsForHeader
        }
    );

    return (
        <div className="px-4 md:px-6 pt-2 pb-32 animate-in fade-in duration-500 w-full mx-auto min-h-screen space-y-4 md:space-y-6">

            <div className="relative z-50 isolate mb-6 mt-0">
                <GlobalHeader
                    title="Global Composite"
                    score={compositeData.compositeScore}
                    prevScore={null}
                    regime={{ ...compositeData.regime, confidence: headerConfidence }}
                    integrity={{ 
                        coverageText: `${activeCardsCount}/${maxCards}`, 
                        coveragePercent: coveragePercent, 
                        source: hasLiveOrManualData ? "Upstox + Local" : "Disconnected", 
                        freshness: resolveTime(Object.values(liveData).some(v => v !== null))
                    }}
                    sections={compositeData.sections || []}
                    tailwinds={compositeData.tailwinds}
                    risks={compositeData.risks}
                    totalCredits={totalCredits}
                    cards={cardsForHeader}
                    masterPayload={compositeData.nestedTreePayload}
                    syncId={{ instrumentKey: 'GLOBAL', category: 'global' }}
                    infoContent={globalManualForm}
                    enableBreakdown={true}
                    controls={{
                        search: searchQuery,
                        onSearchChange: setSearchQuery,
                        viewMode,
                        onViewChange: setViewMode,
                        sortMode,
                        onSortChange: (m) => { setSortMode(m); setViewMode("flat"); }
                    }}
                />
            </div>

            {/* GRID */}
            <div className="mt-8">
                <GlobalStructureGrid
                    cards={cardsForHeader}
                    viewMode={viewMode}
                    sortMode={sortMode}
                    sections={GLOBAL_SECTIONS}
                    onCardClick={setSelectedCard}
                    cardData={compositeData.cardData}
                    resolveTime={resolveTime}
                    liveData={liveData}
                    controls={{
                        search: searchQuery,
                        onSearchChange: setSearchQuery,
                        viewMode,
                        onViewChange: setViewMode,
                        sortMode,
                        onSortChange: (m) => { setSortMode(m); setViewMode("flat"); }
                    }}
                />
            </div>

            {selectedCard && (
                <GlobalStructureModal
                    open={!!selectedCard}
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </div>
    );
}
