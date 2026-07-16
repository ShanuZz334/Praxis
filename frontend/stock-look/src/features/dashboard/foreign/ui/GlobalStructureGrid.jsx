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
import { useDashboardContext } from "@/shared/context/DashboardContext";
import GenericGlobalCard from "./GenericGlobalCard";
import { TOTAL_GLOBAL_CREDITS, GLOBAL_STRUCTURE_CARDS } from "../data/globalData";
import SpFuturesCard from "./SpFuturesCard";
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
export default function GlobalStructureGrid({ cards, viewMode, sortMode, sections, onCardClick, cardData = {}, resolveTime, liveData = {}, controls }) {
    const { livePrices } = useDashboardContext();
    const isConnecting = !livePrices || Object.keys(livePrices).length === 0;

    // Helper: Sort Logic
    const sortCards = (list, mode) => {
        const arr = [...list];
        switch (mode) {
            case 'score_desc': // Strongest
                return arr.sort((a, b) => (b.score || 0) - (a.score || 0));
            case 'score_asc': // Weakest
                return arr.sort((a, b) => (a.score || 0) - (b.score || 0));
            case 'rel_desc': // High Credit
                return arr.sort((a, b) => (b.creditAllocation || 0) - (a.creditAllocation || 0));
            case 'rel_asc': // Low Credit
                return arr.sort((a, b) => (a.creditAllocation || 0) - (b.creditAllocation || 0));
            default:
                return arr;
        }
    };

    const excludeIds = ['sp_futures', 'nasdaq_futures', 'dow_futures', 'brent_crude_oil', 'crude', 'gold', 'silver', 'vix', 'bitcoin', 'usd_inr', 'dxy', 'us_10y_yield'];
    const safeCards = cards ? cards.filter(c => !excludeIds.includes(c.id)) : [];

    // Removed early bailout because global macro cards are statically placed in the grid even without dynamic data.

    // 1. SECTIONED VIEW
    if (viewMode === "sectioned" && sections) {
        return (
            <div className="space-y-8">
                {Object.entries(sections).map(([key, section]) => {
                    const filteredSectionCards = section.cards ? section.cards.filter(card => !excludeIds.includes(card.id)) : [];

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
                                        <SpFuturesCard cardData={cardData.sp_futures} resolveTime={resolveTime} isLive={isConnecting || liveData.sp_futures !== null} />
                                        <NasdaqFuturesCard cardData={cardData.nasdaq_futures} resolveTime={resolveTime} isLive={isConnecting || liveData.nasdaq_futures !== null} />
                                        <DowFuturesCard cardData={cardData.dow_futures} resolveTime={resolveTime} isLive={isConnecting || liveData.dow_futures !== null} />
                                    </>
                                )}
                                {isCurrency && (
                                    <>
                                        <DxyCard cardData={cardData.dxy} resolveTime={resolveTime} isLive={isConnecting || liveData.dxy !== null} />
                                        <UsdInrCard cardData={cardData.usd_inr} resolveTime={resolveTime} isLive={isConnecting || liveData.usd_inr !== null} />
                                    </>
                                )}
                                {isRates && <Us10yYieldCard cardData={cardData.us_10y_yield} resolveTime={resolveTime} isLive={isConnecting || liveData.us_10y_yield !== null} />}
                                {isCommodities && (
                                    <>
                                        <BrentCrudeOilCard cardData={cardData.crude} resolveTime={resolveTime} isLive={isConnecting || liveData.crude !== null} />
                                        <GoldCard cardData={cardData.gold} resolveTime={resolveTime} isLive={isConnecting || liveData.gold !== null} />
                                        <SilverCard cardData={cardData.silver} resolveTime={resolveTime} isLive={isConnecting || liveData.silver !== null} />
                                    </>
                                )}
                                {isVolatility && (
                                    <VixCard cardData={cardData.vix} resolveTime={resolveTime} isLive={isConnecting || liveData.vix !== null} />
                                )}
                                {isDigitalAssets && (
                                    <BitcoinCard cardData={cardData.bitcoin} resolveTime={resolveTime} isLive={isConnecting || liveData.bitcoin !== null} />
                                )}
                                {sortedSectionCards.map((card) => {
                                    const excludeIds = ['sp_futures', 'nasdaq_futures', 'dow_futures', 'usd_inr', 'dxy', 'us_10y_yield', 'crude', 'brent_crude_oil', 'gold', 'silver', 'vix', 'bitcoin'];
                                    if (excludeIds.includes(card.id) || card.id?.startsWith('dummy_')) return null;
                                    const isLiveVal = isConnecting || (liveData[card.id] !== null && liveData[card.id] !== undefined);
                                    return (
                                        <GenericGlobalCard
                                            key={card.id}
                                            id={card.id}
                                            label={card.label}
                                            cardData={cardData[card.id]}
                                            resolveTime={resolveTime}
                                            isLive={isLiveVal}
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

    // 2. FLAT VIEW
    const renderList = [];
    renderList.push({ id: 'sp_futures', node: <SpFuturesCard cardData={cardData.sp_futures} resolveTime={resolveTime} isLive={liveData.sp_futures !== null} /> });
    renderList.push({ id: 'nasdaq_futures', node: <NasdaqFuturesCard cardData={cardData.nasdaq_futures} resolveTime={resolveTime} isLive={liveData.nasdaq_futures !== null} /> });
    renderList.push({ id: 'dow_futures', node: <DowFuturesCard cardData={cardData.dow_futures} resolveTime={resolveTime} isLive={liveData.dow_futures !== null} /> });
    renderList.push({ id: 'usd_inr', node: <UsdInrCard cardData={cardData.usd_inr} resolveTime={resolveTime} isLive={liveData.usd_inr !== null} /> });
    renderList.push({ id: 'dxy', node: <DxyCard cardData={cardData.dxy} resolveTime={resolveTime} isLive={liveData.dxy !== null} /> });
    renderList.push({ id: 'us_10y_yield', node: <Us10yYieldCard cardData={cardData.us_10y_yield} resolveTime={resolveTime} isLive={liveData.us_10y_yield !== null} /> });
    renderList.push({ id: 'crude', node: <BrentCrudeOilCard cardData={cardData.crude} resolveTime={resolveTime} isLive={liveData.crude !== null} /> });
    renderList.push({ id: 'gold', node: <GoldCard cardData={cardData.gold} resolveTime={resolveTime} isLive={liveData.gold !== null} /> });
    renderList.push({ id: 'silver', node: <SilverCard cardData={cardData.silver} resolveTime={resolveTime} isLive={liveData.silver !== null} /> });
    renderList.push({ id: 'vix', node: <VixCard cardData={cardData.vix} resolveTime={resolveTime} isLive={liveData.vix !== null} /> });
    renderList.push({ id: 'bitcoin', node: <BitcoinCard cardData={cardData.bitcoin} resolveTime={resolveTime} isLive={liveData.bitcoin !== null} /> });

    const renderExcludeIds = renderList.map(item => item.id);

    const flatWithData = renderList.map(item => {
        const cData = GLOBAL_STRUCTURE_CARDS.find(c => c.id === item.id) || { creditAllocation: 0, normalized: 0 };
        const hData = cards?.find(c => c.id === item.id);
        return { ...item, ...cData, ...hData };
    });

    const dynamicCards = GLOBAL_STRUCTURE_CARDS.filter(card => !renderExcludeIds.includes(card.id) && !card.id?.startsWith('dummy_')).map(card => {
        const hData = cards?.find(c => c.id === card.id);
        const isLiveVal = isConnecting || (liveData[card.id] !== null && liveData[card.id] !== undefined);
        return {
            id: card.id,
            ...card,
            ...hData,
            node: <GenericGlobalCard
                key={card.id}
                id={card.id}
                label={card.label}
                cardData={cardData[card.id]}
                resolveTime={resolveTime}
                isLive={isLiveVal}
            />
        };
    });

    flatWithData.push(...dynamicCards);

    const filteredFlatWithData = flatWithData.filter(item => {
        if (!controls?.search) return true;
        const searchTarget = (item.label || item.id || '').toLowerCase();
        return searchTarget.includes(controls.search.toLowerCase());
    });

    const sortedFlat = sortCards(filteredFlatWithData, sortMode);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-start">
            {sortedFlat.map(item => (
                <React.Fragment key={item.id}>{item.node}</React.Fragment>
            ))}
        </div>
    );
}
