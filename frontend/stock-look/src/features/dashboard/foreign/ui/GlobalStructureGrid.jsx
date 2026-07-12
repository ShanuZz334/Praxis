/**
 * @file GlobalStructureGrid.jsx
 * @purpose Main grid layout for interacting with Global Market Cards.
 * @responsibilities
 * - Renders a responsive grid of `GlobalCard` components.
 * - Supports multiple view modes (Sectioned vs Flat).
 * - Handles sorting logic (by Score, Name, etc.).
 * - Filters cards based on section associations.
 * @key_exports
 * - GlobalStructureGrid (Default Component)
 * @dependencies
 * - GlobalCard: Shared card component.
 * - globalData: Config/Credits constants.
 * @lifecycle
 * - Rendered by ForeignPage.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";
import { TOTAL_GLOBAL_CREDITS } from "../data/globalData";
import NasdaqFuturesCard from "./NasdaqFuturesCard";
import DowFuturesCard from "./DowFuturesCard";
import BrentCrudeOilCard from "./BrentCrudeOilCard";
import GoldCard from "./GoldCard";
import SilverCard from "./SilverCard";
import VixCard from "./VixCard";
import BitcoinCard from "./BitcoinCard";
import UsdInrCard from './UsdInrCard';
import DxyCard from './DxyCard';
import Us10yYieldCard from './Us10yYieldCard';

// =============================
// Main Component
// =============================
export default function GlobalStructureGrid({ cards, viewMode, sortMode, sections, onCardClick }) {


    // Helper: Sort Logic
    const sortCards = (list, mode) => {
        const arr = [...list];
        switch (mode) {
            case 'score_desc': // Strongest
                return arr.sort((a, b) => (b.normalized || 0) - (a.normalized || 0));
            case 'score_asc': // Weakest
                return arr.sort((a, b) => (a.normalized || 0) - (b.normalized || 0));
            case 'rel_desc': // High Credit
                return arr.sort((a, b) => (b.creditAllocation || 0) - (a.creditAllocation || 0));
            case 'rel_asc': // Low Credit
                return arr.sort((a, b) => (a.creditAllocation || 0) - (b.creditAllocation || 0));
            default:
                return arr;
        }
    };

    const excludeIds = ['sp_futures', 'nasdaq_futures', 'dow_futures', 'brent_crude_oil', 'gold', 'silver', 'vix', 'bitcoin', 'usd_inr', 'dxy', 'us_10y_yield'];
    const safeCards = cards ? cards.filter(c => !excludeIds.includes(c.id)) : [];

    if (safeCards.length === 0 && (!cards || cards.length === 0)) {
        return (
            <div className="text-center py-12 text-text-tertiary">
                No global structure data available
            </div>
        );
    }

    // 1. SECTIONED VIEW
    if (viewMode === "sectioned" && sections) {
        return (
            <div className="space-y-8">
                {Object.entries(sections).map(([key, section]) => {
                    const filteredSectionCards = section.cards ? section.cards.filter(card =>
                        safeCards.some(c => c.id === card.id)
                    ) : [];

                    const isUSMarkets = section.id === 'US Markets' || section.label === 'US Markets' || key === 'us_markets' || key === 'americas';
                    const isCurrency = section.label === "Currency" || key === "currency";
                    const isRates = section.label === "Rates & Volatility" || key === "rates";
                    const isCommodities = section.id === 'Commodities' || section.label === 'Commodities' || key === 'commodities';
                    const isVolatility = section.id === 'Volatility' || section.label === 'Volatility' || key === 'volatility';
                    const isDigitalAssets = section.id === 'Digital Assets' || section.label === 'Digital Assets' || key === 'digital_assets';

                    // Sort section cards
                    const sortedSectionCards = sortCards(filteredSectionCards, sortMode);

                    if (sortedSectionCards.length === 0 && !isCurrency && !isRates && !isUSMarkets && !isCommodities && !isVolatility && !isDigitalAssets) return null;

                    return (
                        <div key={key} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Section Header */}
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-text-primary uppercase tracking-widest">{section.label}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                                        {sortedSectionCards.length + (isUSMarkets ? 3 : 0) + (isCurrency ? 2 : 0) + (isRates ? 1 : 0) + (isCommodities ? 3 : 0) + (isVolatility ? 1 : 0) + (isDigitalAssets ? 1 : 0)}
                                    </span>
                                </div>
                            </div>
                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-start">
                                {isUSMarkets && (
                                    <>
                                        <SpFuturesCard />
                                        <NasdaqFuturesCard />
                                        <DowFuturesCard />
                                    </>
                                )}
                                {isCurrency && <UsdInrCard />}
                                {isCurrency && <DxyCard />}
                                {isRates && <Us10yYieldCard />}
                                {isCommodities && (
                                    <>
                                        <BrentCrudeOilCard />
                                        <GoldCard />
                                        <SilverCard />
                                    </>
                                )}
                                {isVolatility && (
                                    <VixCard />
                                )}
                                {isDigitalAssets && (
                                    <BitcoinCard />
                                )}
                                {sortedSectionCards.map((card) => {
                                    const excludeIds = ['sp_futures', 'nasdaq_futures', 'dow_futures', 'usd_inr', 'dxy', 'us_10y_yield', 'brent_crude', 'gold', 'silver', 'vix', 'bitcoin'];
                                    if (excludeIds.includes(card.id) || card.id?.startsWith('dummy_')) return null;
                                    return (
                                    <GlobalCard
                                        key={card.id}
                                        label={card.label}
                                        raw={card.raw}
                                        unit={card.unit}
                                        normalized={card.normalized}
                                        creditScore={card.creditScore}
                                        creditAllocation={card.creditAllocation}
                                        totalPageCredits={TOTAL_GLOBAL_CREDITS}
                                        reason={card.reason}
                                        multiplier={card.multiplier}
                                        isFocused={card.isFocused}
                                        onClick={() => onCardClick?.(card)}
                                    />
                                )})}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // 2. FLAT VIEW
    const renderList = [];
    renderList.push({ id: 'sp_futures', node: <SpFuturesCard /> });
    renderList.push({ id: 'nasdaq_futures', node: <NasdaqFuturesCard /> });
    renderList.push({ id: 'dow_futures', node: <DowFuturesCard /> });
    renderList.push({ id: 'usd_inr', node: <UsdInrCard /> });
    renderList.push({ id: 'dxy', node: <DxyCard /> });
    renderList.push({ id: 'us_10y_yield', node: <Us10yYieldCard /> });
    renderList.push({ id: 'brent_crude', node: <BrentCrudeOilCard /> });
    renderList.push({ id: 'gold', node: <GoldCard /> });
    renderList.push({ id: 'silver', node: <SilverCard /> });
    renderList.push({ id: 'vix', node: <VixCard /> });
    renderList.push({ id: 'bitcoin', node: <BitcoinCard /> });

    const renderExcludeIds = renderList.map(item => item.id);

    const flatWithData = renderList.map(item => {
        const cData = safeCards.find(c => c.id === item.id) || { creditAllocation: 0, normalized: 0 };
        return { ...item, ...cData };
    });

    const dynamicCards = safeCards.filter(card => !renderExcludeIds.includes(card.id) && !card.id?.startsWith('dummy_')).map(card => ({
        id: card.id,
        ...card,
        node: <GlobalCard
            key={card.id}
            label={card.label}
            raw={card.raw}
            unit={card.unit}
            normalized={card.normalized}
            creditScore={card.creditScore}
            creditAllocation={card.creditAllocation}
            totalPageCredits={TOTAL_GLOBAL_CREDITS}
            reason={card.reason}
            multiplier={card.multiplier}
            isFocused={card.isFocused}
            onClick={() => onCardClick?.(card)}
        />
    }));

    flatWithData.push(...dynamicCards);

    const filteredFlatWithData = flatWithData.filter(item => safeCards.some(c => c.id === item.id));

    const sortedFlat = sortCards(filteredFlatWithData, sortMode);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-start">
            {sortedFlat.map(item => (
                <React.Fragment key={item.id}>{item.node}</React.Fragment>
            ))}
        </div>
    );
}
