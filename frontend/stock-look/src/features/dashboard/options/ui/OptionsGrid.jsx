/**
 * @file OptionsGrid.jsx
 * @purpose Layout engine for Options Intelligence cards.
 * @responsibilities
 * - Renders a collection of OptionsCard components in a grid layout.
 * - Supports "Sectioned" view (grouped by Category) vs "Flat" view.
 * - Handles internal sorting logic based on props (Strongest, Weakest, etc.).
 * - Provides mobile navigation buttons for quick section jumping.
 * @key_exports
 * - OptionsGrid (Default Component)
 * @dependencies
 * - OptionsCard: Child component.
 * - optionsSections: Metadata for categories.
 * @lifecycle
 * - Rendered by OptionsPage.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useMemo } from "react";
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import OptionsCard from "./OptionsCard";
import { optionsSections } from "@/features/dashboard/options/engine/optionsHelper";

import AtmIvCard from "./AtmIvCard";
import IvRankCard from "./IvRankCard";
import IvPercentileCard from "./IvPercentileCard";

import TotalCallOpenInterestCard from "./TotalCallOpenInterestCard";
import TotalPutOpenInterestCard from "./TotalPutOpenInterestCard";
import OpenInterestChangeCard from "./OpenInterestChangeCard";
import DeltaCard from "./DeltaCard";
import GammaCard from "./GammaCard";
import ThetaCard from "./ThetaCard";
import VegaCard from "./VegaCard";
import PcrOiCard from "./PcrOiCard";
import PcrVolumeCard from "./PcrVolumeCard";
import MaxPainCard from "./MaxPainCard";

// =============================
// Main Component
// =============================
export default function OptionsGrid({
    cards,
    compositeData,
    onCardClick,
    viewMode = "sectioned",
    sortMode = "score_desc",
    controls,
    manualOverrides,
    resolveTime
}) {

    // =============================
    // Helper Logic
    // =============================

    const sortCards = (list, mode) => {
        const arr = [...list];
        const hasScore = (c) => c.score !== undefined && c.score !== null && !isNaN(c.score);

        return arr.sort((a, b) => {
            const aValid = hasScore(a);
            const bValid = hasScore(b);

            // Always push un-scored items to the bottom
            if (aValid && !bValid) return -1;
            if (!aValid && bValid) return 1;
            switch (mode) {
                case 'score_desc': {
                    if (!aValid && !bValid) return 0;
                    const diff1 = b.score - a.score;
                    return diff1 !== 0 ? diff1 : (b.creditAllocation || 0) - (a.creditAllocation || 0);
                }
                case 'score_asc': {
                    if (!aValid && !bValid) return 0;
                    const diff2 = a.score - b.score;
                    return diff2 !== 0 ? diff2 : (b.creditAllocation || 0) - (a.creditAllocation || 0);
                }
                case 'rel_desc': {
                    const diff3 = (b.creditAllocation || 0) - (a.creditAllocation || 0);
                    if (diff3 !== 0) return diff3;
                    if (!aValid && !bValid) return 0;
                    return b.score - a.score;
                }
                case 'rel_asc': {
                    const diff4 = (a.creditAllocation || 0) - (b.creditAllocation || 0);
                    if (diff4 !== 0) return diff4;
                    if (!aValid && !bValid) return 0;
                    return a.score - b.score;
                }
                default:
                    return 0;
            }
        });
    };

    // Exclude our hardcoded cards
    const excludeIds = ["total_call_oi", "total_put_oi", "oi_change", "delta", "gamma", "theta", "vega", "pcr_oi", "pcr_volume", "max_pain"];
    const filteredCards = cards.filter(c => !excludeIds.includes(c.id));

    // Memoize categorization
    const grouped = useMemo(() => {
        const map = { 'Open Interest': [], 'Greeks': [] }; // Ensure sections with hardcoded cards exist
        filteredCards.forEach((card) => {
            const sec = card.category || "Other";
            if (!map[sec]) map[sec] = [];
            map[sec].push(card);
        });
        return map;
    }, [cards]);

    // =============================
    // Render: Flat View
    // =============================
    if (viewMode === 'flat') {
        const renderList = [];
        renderList.push({ id: 'atm_iv', node: <AtmIvCard /> });
        renderList.push({ id: 'iv_rank', node: <IvRankCard /> });
        renderList.push({ id: 'iv_percentile', node: <IvPercentileCard /> });
        renderList.push({ id: 'total_call_oi', node: <TotalCallOpenInterestCard /> });
        renderList.push({ id: 'total_put_oi', node: <TotalPutOpenInterestCard /> });
        renderList.push({ id: 'oi_change', node: <OpenInterestChangeCard /> });
        renderList.push({ id: 'delta', node: <DeltaCard /> });
        renderList.push({ id: 'gamma', node: <GammaCard /> });
        renderList.push({ id: 'theta', node: <ThetaCard /> });
        renderList.push({ id: 'vega', node: <VegaCard /> });
        renderList.push({ id: 'pcr_oi', node: <PcrOiCard /> });
        renderList.push({ id: 'pcr_volume', node: <PcrVolumeCard /> });
        renderList.push({ id: 'max_pain', node: <MaxPainCard /> });

        const excludeIds = renderList.map(item => item.id);

        const flatWithData = renderList.map(item => {
            const cData = cards.find(c => c.id === item.id);
            const fallbackCredit = getIndicatorConfig(item.id)?.creditScore ?? 5;
            
            // Map composite live data to the cards
            let liveData = null;
            if (item.id === 'total_call_oi' && compositeData?.totalCallOI) liveData = compositeData.totalCallOI;
            if (item.id === 'total_put_oi' && compositeData?.totalPutOI) liveData = compositeData.totalPutOI;
            if (item.id === 'oi_change' && compositeData?.oiChange) liveData = compositeData.oiChange;
            if (item.id === 'pcr_oi' && compositeData?.pcrOi) liveData = compositeData.pcrOi;
            if (item.id === 'pcr_volume' && compositeData?.pcrVolume) liveData = compositeData.pcrVolume;
            if (item.id === 'delta' && compositeData?.atmGreeks?.delta) liveData = compositeData.atmGreeks.delta;
            if (item.id === 'gamma' && compositeData?.atmGreeks?.gamma) liveData = compositeData.atmGreeks.gamma;
            if (item.id === 'theta' && compositeData?.atmGreeks?.theta) liveData = compositeData.atmGreeks.theta;
            if (item.id === 'theta' && compositeData?.atmGreeks?.theta) liveData = compositeData.atmGreeks.theta;
            if (item.id === 'vega' && compositeData?.atmGreeks?.vega) liveData = compositeData.atmGreeks.vega;
            if (item.id === 'atm_iv' && compositeData?.volatility?.atmIv) liveData = compositeData.volatility.atmIv;
            if (item.id === 'iv_rank' && compositeData?.volatility?.ivRank) liveData = { ...compositeData.volatility.ivRank, lookback: compositeData.volatility.lookback };
            if (item.id === 'iv_percentile' && compositeData?.volatility?.ivPercentile) liveData = { ...compositeData.volatility.ivPercentile, lookback: compositeData.volatility.lookback };
            if (item.id === 'max_pain' && compositeData?.maxPain) liveData = compositeData.maxPain;

            const manualOverride = manualOverrides ? manualOverrides[item.id] : undefined;
            const clonedNode = React.cloneElement(item.node, { 
                liveData, 
                manualOverride,
                lastUpdated: (isLive) => resolveTime ? resolveTime(isLive, isLive ? null : item.id) : null 
            });

            return { 
                ...item, 
                ...(cData || { normalized: 0 }),
                creditAllocation: cData?.creditAllocation ?? fallbackCredit,
                liveData,
                node: clonedNode
            };
        });

        const dynamicCards = cards.filter(card => !excludeIds.includes(card.id) && !card.id.startsWith('dummy_')).map(card => ({
            id: card.id,
            ...card,
            node: <OptionsCard key={card.id} card={card} onClick={() => onCardClick(card)} />
        }));
        
        flatWithData.push(...dynamicCards);

        const filteredFlatWithData = flatWithData.filter(item => cards.some(c => c.id === item.id));

        const sortedFlat = sortCards(filteredFlatWithData, sortMode);

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-start animate-in fade-in duration-500">
                {sortedFlat.map(item => (
                    <React.Fragment key={item.id}>{item.node}</React.Fragment>
                ))}
            </div>
        );
    }

    // =============================
    // Render: Sectioned View
    // =============================
    return (
        <div className="space-y-6 md:space-y-10">

            {/* Mobile Category Navigation (Pill Bar) */}
            <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 custom-scrollbar-hidden sticky top-0 bg-background-app/80 backdrop-blur-md z-30 py-3">
                {optionsSections.map(section => {
                    const hasHardcoded = ['Open Interest', 'Volatility', 'Greeks', 'Put-Call Ratio', 'Market Positioning'].includes(section.id);
                    if (!hasHardcoded && !grouped[section.id]?.length) return null;
                    return (
                        <button
                            key={section.id}
                            onClick={() => {
                                const el = document.getElementById(`section-${section.id}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="shrink-0 px-3 py-1.5 rounded-full bg-background-elevated border border-border-subtle text-[11px] font-bold text-text-secondary hover:text-text-primary hover:border-border-default transition-all whitespace-nowrap"
                        >
                            {section.label}
                        </button>
                    );
                })}
            </div>

            {/* Sections Loop */}
            {optionsSections.map((section) => {
                const rawList = grouped[section.id];
                const validDynamicCards = rawList ? rawList.filter(c => !c.id?.startsWith('dummy_')) : [];
                const hasHardcoded = ['Open Interest', 'Volatility', 'Greeks', 'Put-Call Ratio', 'Market Positioning'].includes(section.id);
                
                if (!hasHardcoded && validDynamicCards.length === 0) return null;

                const sortedSectionCards = sortCards(validDynamicCards, sortMode);

                return (
                    <div key={section.id} id={`section-${section.id}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-20">
                        {/* Header */}
                        <div className="mb-3 md:mb-4 flex items-center justify-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-text-secondary uppercase tracking-widest">
                                    {section.label}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                                    {validDynamicCards.length + (section.id === 'Open Interest' ? 3 : section.id === 'Volatility' ? 3 : section.id === 'Greeks' ? 4 : section.id === 'Put-Call Ratio' ? 2 : section.id === 'Market Positioning' ? 1 : 0)}
                                </span>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-start">
                            {section.id === 'Open Interest' && (
                                <>
                                    <TotalCallOpenInterestCard liveData={compositeData?.totalCallOI} manualOverride={manualOverrides?.total_call_oi} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'total_call_oi') : null} />
                                    <TotalPutOpenInterestCard liveData={compositeData?.totalPutOI} manualOverride={manualOverrides?.total_put_oi} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'total_put_oi') : null} />
                                    <OpenInterestChangeCard liveData={compositeData?.oiChange} manualOverride={manualOverrides?.oi_change} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'oi_change') : null} />
                                </>
                            )}
                            {section.id === 'Volatility' && (
                                <>
                                    <AtmIvCard liveData={compositeData?.volatility?.atmIv} manualOverride={manualOverrides?.atm_iv} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'atm_iv') : null} />
                                    <IvRankCard liveData={compositeData?.volatility?.ivRank ? { ...compositeData.volatility.ivRank, lookback: compositeData.volatility.lookback } : null} manualOverride={manualOverrides?.iv_rank} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'iv_rank') : null} />
                                    <IvPercentileCard liveData={compositeData?.volatility?.ivPercentile ? { ...compositeData.volatility.ivPercentile, lookback: compositeData.volatility.lookback } : null} manualOverride={manualOverrides?.iv_percentile} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'iv_percentile') : null} />
                                </>
                            )}
                            {section.id === 'Greeks' && (
                                <>
                                    <DeltaCard liveData={compositeData?.atmGreeks?.delta} manualOverride={manualOverrides?.delta} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'delta') : null} />
                                    <GammaCard liveData={compositeData?.atmGreeks?.gamma} manualOverride={manualOverrides?.gamma} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'gamma') : null} />
                                    <ThetaCard liveData={compositeData?.atmGreeks?.theta} manualOverride={manualOverrides?.theta} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'theta') : null} />
                                    <VegaCard liveData={compositeData?.atmGreeks?.vega} manualOverride={manualOverrides?.vega} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'vega') : null} />
                                </>
                            )}
                            {section.id === 'Put-Call Ratio' && (
                                <>
                                    <PcrOiCard liveData={compositeData?.pcrOi} manualOverride={manualOverrides?.pcr_oi} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'pcr_oi') : null} />
                                    <PcrVolumeCard liveData={compositeData?.pcrVolume} manualOverride={manualOverrides?.pcr_volume} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'pcr_volume') : null} />
                                </>
                            )}
                            {section.id === 'Market Positioning' && (
                                <MaxPainCard liveData={compositeData?.maxPain} manualOverride={manualOverrides?.max_pain} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : 'max_pain') : null} />
                            )}
                            {sortedSectionCards.map((card) => {
                                if (excludeIds.includes(card.id) || card.id.startsWith('dummy_')) return null;
                                return (
                                    <OptionsCard
                                        key={card.id}
                                        card={card}
                                        onClick={() => onCardClick(card)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
