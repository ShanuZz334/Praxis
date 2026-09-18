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
import { useDataFreshness } from '@/shared/hooks/useDataFreshness';
import { useAiSync } from "@/shared/hooks/useAiSync";
import { useDataRegistry } from "@/shared/context/DataRegistryContext";
import { computeCardConfidence, computeHeaderConfidence } from "@/shared/engine/confidenceEngine";
import { useGlobalApiData } from "../data/useGlobalApiData";
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import Loader from "@/shared/components/ui/Loader";
import { useTheme } from '@/shared/context/ThemeContext';
import { formatTimestampWithDate } from '@/shared/utils/formatters';

const DEFAULT_OVERRIDES = {
    dxy: null,
    usd_inr: null,
    crude: null,
    gold: null,
    silver: null,
    us_10y_yield: null,
    sp_futures: null,
    nasdaq_futures: null,
    dow_jones: null,
    vix: null,
    bitcoin: null,
    ethereum: null,
    usdjpy: null,
    nikkei: null,
    ftse: null,
    dax: null,
    hangseng: null,
    shanghai: null,
    copper: null,
    natgas: null,
    move: null
};

// Wrapper defined outside render function to prevent focus loss (Rule 2)
const TimerOverrideInput = ({ overrideKey, manualLastUpdated, expiryConfigs, ...props }) => {
    return (
        <DebouncedOverrideInput
            {...props}
            overrideKey={overrideKey}
            lastUpdatedTimestamp={manualLastUpdated?.[overrideKey]}
            expiryDuration={expiryConfigs?.[overrideKey] || expiryConfigs?.global_default}
            instrument="global_macro"
            moduleKey="global"
        />
    );
};

export default function ForeignPage() {
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCard, setSelectedCard] = useState(null);

    const { livePrices } = useDashboardContext();
    const { tradingMode } = useTheme();
    const { overrides: manualOverrides, lastUpdated: manualLastUpdated, expiryConfigs, handleChange: handleOverrideChange, handleClearAll } = useManualOverrides('global', 'global_macro', DEFAULT_OVERRIDES);

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
            vix: null,
            bitcoin: null
        };
    }, [livePrices]);

    const { data: liveApiData, ranges: liveRangeData, loading } = useGlobalApiData();

    // Merge Upstox and Yahoo/CoinGecko live data
    const mergedLiveData = useMemo(() => {
        // Only merge Upstox data if it actually exists, to prevent overwriting valid API data with nulls
        const validLiveData = Object.fromEntries(
            Object.entries(liveData).filter(([_, v]) => v !== null && v !== undefined)
        );
        return {
            ...liveApiData,
            ...validLiveData
        };
    }, [liveApiData, liveData]);

    const compositeData = useGlobalComposite(manualOverrides, mergedLiveData, liveRangeData, tradingMode);

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
        return formatTimestampWithDate(ts, { includeSeconds: false });
    };

    // Calculate freshness correctly based on whether we have live data or manual overrides
    const resolveTime = useDataFreshness(mergedLiveData, manualOverrides, manualLastUpdated, isMarketOpen, formatTime, "1m");

    const showCurrency = !mergedLiveData.dxy || !mergedLiveData.usd_inr || !mergedLiveData.usdjpy;
    const showCommodities = !mergedLiveData.crude || !mergedLiveData.gold || !mergedLiveData.silver || !mergedLiveData.copper || !mergedLiveData.natgas;
    const showRates = !mergedLiveData.us_10y_yield || !mergedLiveData.vix || !mergedLiveData.move;
    const showUSMarkets = !mergedLiveData.sp_futures || !mergedLiveData.nasdaq_futures || !mergedLiveData.dow_jones;
    const showDigitalAssets = !mergedLiveData.bitcoin || !mergedLiveData.ethereum;
    const showGlobalIndices = !mergedLiveData.nikkei || !mergedLiveData.ftse || !mergedLiveData.dax || !mergedLiveData.hangseng || !mergedLiveData.shanghai;
    
    const showAnyManual = showCurrency || showCommodities || showRates || showUSMarkets || showDigitalAssets || showGlobalIndices;

    const manualForm = (
        <div className="text-left w-full h-full max-w-7xl mx-auto flex flex-col p-6 overflow-y-auto no-scrollbar">
            {showAnyManual ? (
                <>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Manual Data Overrides</h2>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleClearAll(); }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-text-tertiary mb-6 max-w-3xl leading-relaxed">
                        When live data is unavailable for a specific global indicator, you can manually override it here.
                    </p>
                </>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-text-tertiary italic">All data pipelines are online. No manual overrides required.</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                {showCurrency && (
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-emerald-500 mb-3 border-b border-border-default pb-2">Currency</div>
                        {!mergedLiveData.dxy && <TimerOverrideInput label="US Dollar Index (DXY) (Points)" overrideKey="dxy" value={manualOverrides.dxy} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.usd_inr && <TimerOverrideInput label="USD/INR Rate (₹)" overrideKey="usd_inr" value={manualOverrides.usd_inr} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.usdjpy && <TimerOverrideInput label="USD/JPY (¥)" overrideKey="usdjpy" value={manualOverrides.usdjpy} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                    </div>
                )}
                
                {showCommodities && (
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-yellow-500 mb-3 border-b border-border-default pb-2">Commodities</div>
                        {!mergedLiveData.crude && <TimerOverrideInput label="Brent Crude Oil ($/bbl)" overrideKey="crude" value={manualOverrides.crude} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.gold && <TimerOverrideInput label="Gold ($/oz)" overrideKey="gold" value={manualOverrides.gold} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.silver && <TimerOverrideInput label="Silver ($/oz)" overrideKey="silver" value={manualOverrides.silver} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.copper && <TimerOverrideInput label="Copper ($/lb)" overrideKey="copper" value={manualOverrides.copper} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.natgas && <TimerOverrideInput label="Natural Gas ($/MMBtu)" overrideKey="natgas" value={manualOverrides.natgas} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                    </div>
                )}

                {showRates && (
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-purple-500 mb-3 border-b border-border-default pb-2">Rates & Volatility</div>
                        {!mergedLiveData.us_10y_yield && <TimerOverrideInput label="US 10-Year Yield (%)" overrideKey="us_10y_yield" value={manualOverrides.us_10y_yield} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.vix && <TimerOverrideInput label="CBOE VIX (Absolute)" overrideKey="vix" value={manualOverrides.vix} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.move && <TimerOverrideInput label="MOVE Index" overrideKey="move" value={manualOverrides.move} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                    </div>
                )}

                {showUSMarkets && (
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-blue-500 mb-3 border-b border-border-default pb-2">US Markets</div>
                        {!mergedLiveData.sp_futures && <TimerOverrideInput label="S&P 500 Futures ($/Points)" overrideKey="sp_futures" value={manualOverrides.sp_futures} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.nasdaq_futures && <TimerOverrideInput label="Nasdaq Futures ($/Points)" overrideKey="nasdaq_futures" value={manualOverrides.nasdaq_futures} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.dow_jones && <TimerOverrideInput label="Dow Jones Futures ($/Points)" overrideKey="dow_jones" value={manualOverrides.dow_jones} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                    </div>
                )}

                {showDigitalAssets && (
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-orange-400 mb-3 border-b border-border-default pb-2">Digital Assets</div>
                        {!mergedLiveData.bitcoin && <TimerOverrideInput label="Bitcoin ($)" overrideKey="bitcoin" value={manualOverrides.bitcoin} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.ethereum && <TimerOverrideInput label="Ethereum ($)" overrideKey="ethereum" value={manualOverrides.ethereum} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                    </div>
                )}

                {showGlobalIndices && (
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-indigo-400 mb-3 border-b border-border-default pb-2">Global Indices</div>
                        {!mergedLiveData.nikkei && <TimerOverrideInput label="Nikkei 225 (¥ JPY)" overrideKey="nikkei" value={manualOverrides.nikkei} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.ftse && <TimerOverrideInput label="FTSE 100 (£ GBP)" overrideKey="ftse" value={manualOverrides.ftse} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.dax && <TimerOverrideInput label="DAX 40 (€ EUR)" overrideKey="dax" value={manualOverrides.dax} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.hangseng && <TimerOverrideInput label="Hang Seng (HK$ HKD)" overrideKey="hangseng" value={manualOverrides.hangseng} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                        {!mergedLiveData.shanghai && <TimerOverrideInput label="Shanghai Comp (¥ CNY)" overrideKey="shanghai" value={manualOverrides.shanghai} onChange={handleOverrideChange} manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} />}
                    </div>
                )}
            </div>
        </div>
    );

    // Dynamic Coverage & Credits Calculation
    const maxCards = 21;
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
            const isLive = mergedLiveData && mergedLiveData[id] !== undefined && mergedLiveData[id] !== null;
            const cardMeta = {
                hasLiveData: isLive,
                isManual: isManual,
                lastUpdated: isManual ? (manualLastUpdated ? manualLastUpdated[id] : Date.now()) : Date.now(),
                sourcePipeline: isLive ? 'upstox' : (isManual ? 'manual' : 'fallback')
            };
            const cCard = computeCardConfidence(cardMeta, 'foreign');

            return { id, module: cardName, normalized, credit, creditAllocation: allocated, score, cCard };
        });

    const totalCredits = cardsForHeader.reduce((acc, c) => acc + c.credit, 0);
    const headerConfidence = computeHeaderConfidence(cardsForHeader, maxCards, 'foreign');

    const hasLiveOrManualData = Object.values(mergedLiveData).some(v => v !== null && v !== undefined) || Object.values(manualOverrides).some(v => v !== null);

    // 7. Silently Stream the Snapshot to SQLite backend
    useAiSync(
        "GLOBAL_MACRO", // Generic key for global
        "Global", 
        {
            ...compositeData,
            cards: cardsForHeader
        }
    );

    const { registerBulk } = useDataRegistry();

    // Register all Global Macro cards with DataRegistry for Future Vision telemetry syncer
    React.useEffect(() => {
        if (cardsForHeader && cardsForHeader.length > 0 && typeof registerBulk === 'function') {
            const snapshots = {};
            cardsForHeader.forEach(c => {
                const rawVal = mergedLiveData[c.id]?.value ?? mergedLiveData[c.id] ?? manualOverrides[c.id] ?? null;
                snapshots[c.id] = {
                    displayName: c.module,
                    score: c.score,
                    value: rawVal,
                    signal: c.normalized === 1 ? 'BULLISH' : c.normalized === -1 ? 'BEARISH' : 'NEUTRAL',
                    credit: c.credit
                };
            });
            registerBulk('foreign', snapshots);
        }
    }, [cardsForHeader, mergedLiveData, manualOverrides, registerBulk]);

    if (loading && Object.keys(liveApiData || {}).length === 0 && !hasLiveOrManualData) {
        return (
            <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-background-base animate-in fade-in duration-500">
                <Loader size="lg" color="indigo" />
                <p className="text-text-secondary mt-8 font-mono text-[11px] tracking-[0.2em] animate-pulse uppercase">
                    Synchronizing Global Pipeline...
                </p>
            </div>
        );
    }

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
                        source: hasLiveOrManualData ? "Upstox + Yahoo" : "Disconnected", 
                        freshness: resolveTime(Object.values(mergedLiveData).some(v => v !== null && v !== undefined))
                    }}
                    sections={compositeData.sections || []}
                    tailwinds={compositeData.tailwinds}
                    headwinds={compositeData.risks}
                    totalCredits={totalCredits}
                    cards={cardsForHeader}
                    masterPayload={compositeData.nestedTreePayload}
                    syncId={{ instrumentKey: 'GLOBAL', category: 'global' }}
                    infoContent={manualForm}
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
                    liveData={mergedLiveData}
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
