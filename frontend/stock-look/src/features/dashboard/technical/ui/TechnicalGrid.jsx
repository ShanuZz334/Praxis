/**
 * @file TechnicalGrid.jsx
 * @purpose Renders the grid of technical indicator cards.
 * @responsibilities
 * - Displays cards in Sectioned (grouped) or Flat layout.
 * - Handles sorting (Strength, Weakness, Credit).
 * - Provides mobile navigation for sections.
 * @key_exports
 * - TechnicalGrid (Default)
 * @dependencies
 * - TechnicalCard
 * @lifecycle
 * - Rendered by TechnicalPage.
 * @date 2026-02-03
 */

import React from "react";
import TechnicalCard from "./TechnicalCard";
import { technicalSections } from "@/features/dashboard/technical/engine/technicalHelper";
import RSICard from './RSICard';
import MACDCard from './MACDCard';
import StochRSICard from './StochRSICard';
import WilliamsRCard from './WilliamsRCard';
import BBCard from "./BBCard";
import ATRCard from "./ATRCard";
import KCCard from "./KCCard";
import CmfCard from "./CmfCard";
import VolumeSmaCard from "./VolumeSmaCard";
import ObvCard from "./ObvCard";
import VwapCard from "./VwapCard";
import SupportCard from "./SupportCard";
import ResistanceCard from "./ResistanceCard";
import TrendlineCard from "./TrendlineCard";
import PivotCard from "./PivotCard";
import FibonacciCard from "./FibonacciCard";

import EMA20Card from "./EMA20Card";
import EMA50Card from "./EMA50Card";
import EMA200Card from "./EMA200Card";
import SMA50Card from "./SMA50Card";
import SMA200Card from "./SMA200Card";
import ADXCard from "./ADXCard";
import SupertrendCard from "./SupertrendCard";
import BreadthRatioCard from "./BreadthRatioCard";
import McClellanCard from "./McClellanCard";
import ADLineCard from "./ADLineCard";
import NhnlCard from "./NhnlCard";
import VixCard from "./VixCard";
import TrinCard from "./TrinCard";
// =============================
// Component
// =============================

export default function TechnicalGrid({
    cards,
    onCardClick,
    viewMode = "sectioned",
    sortMode = "score_desc",
    searchQuery = "",
    controls
}) {

    // =============================
    // Helper Functions
    // =============================

    const sortCards = (list, mode) => {
        const arr = [...list];
        switch (mode) {
            case 'score_desc':
                return arr.sort((a, b) => (b.normalized || 0) - (a.normalized || 0));
            case 'score_asc':
                return arr.sort((a, b) => (a.normalized || 0) - (b.normalized || 0));
            case 'rel_desc':
                return arr.sort((a, b) => (b.creditAllocation || 0) - (a.creditAllocation || 0));
            case 'rel_asc':
                return arr.sort((a, b) => (a.creditAllocation || 0) - (b.creditAllocation || 0));
            default:
                return arr;
        }
    };

    // Group by section
    const grouped = React.useMemo(() => {
        const map = {};
        cards.forEach((card) => {
            const sec = card.category || "Other";
            if (!map[sec]) map[sec] = [];
            map[sec].push(card);
        });
        return map;
    }, [cards]);

    // Section Order (using the config from helper or indicatorConfig orders)
    const SECTION_ORDER = technicalSections.map(s => s.id);

    // =============================
    // Render Layer
    // =============================

    return (
        <div className="space-y-6">
            {/* Category Navigator (Mobile/Tablet Only) */}
            {viewMode === "sectioned" && (
                <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 custom-scrollbar-hidden sticky top-0 bg-background-app/80 backdrop-blur-md z-30 py-3">
                    {SECTION_ORDER.map(section => {
                        if (!grouped[section]?.length) return null;
                        return (
                            <button
                                key={section}
                                onClick={() => {
                                    const el = document.getElementById(`section-${section}`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="shrink-0 px-3 py-1.5 rounded-full bg-background-elevated border border-border-subtle text-[11px] font-bold text-text-secondary hover:text-text-primary hover:border-border-default transition-all whitespace-nowrap"
                            >
                                {section}
                            </button>
                        );
                    })}
                </div>
            )}

            {viewMode === "flat" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 items-start">
                    <RSICard />
                    <MACDCard />
                    <StochRSICard />
                    <WilliamsRCard />
                    <BBCard />
                    <ATRCard />
                    <KCCard />
                    <CmfCard />
                    <VolumeSmaCard />
                    <ObvCard />
                    <VwapCard />
                    <SupportCard />
                    <ResistanceCard />
                    <TrendlineCard />
                    <PivotCard />
                    <FibonacciCard />
                    <EMA20Card />
                    <EMA50Card />
                    <EMA200Card />
                    <SMA50Card />
                    <SMA200Card />
                    <ADXCard />
                    <SupertrendCard />
                    <BreadthRatioCard />
                    <McClellanCard />
                    <ADLineCard />
                    <NhnlCard />
                    <VixCard />
                    <TrinCard />
                    {cards.length === 0 && searchQuery ? (
                        <div className="col-span-4 p-12 text-center text-text-tertiary italic">No technicals found for "{searchQuery}"</div>
                    ) : (
                        sortCards(cards, sortMode).map((card) => {
                            const excludeIds = ['rsi', 'macd', 'stoch_rsi', 'williams_r', 'bb_20_2', 'atr', 'kc', 'cmf', 'volume_sma', 'obv', 'vwap', 'support', 'resistance', 'trendline', 'pivot', 'fibonacci', 'ema_20', 'ema_50', 'ema_200', 'sma_50', 'sma_200', 'adx', 'supertrend', 'breadth_ratio', 'mcclellan', 'ad_line', 'nh_nl', 'india_vix', 'trin'];
                            if (excludeIds.includes(card.id) || card.id.startsWith('dummy_')) return null;
                            return (
                                <TechnicalCard
                                    key={card.id}
                                    card={card}
                                    onClick={() => onCardClick(card)}
                                />
                            );
                        })
                    )}
                </div>
            ) : (
                <div className="space-y-6 md:space-y-10">
                    {SECTION_ORDER.map((section) => {
                        const hardcodedCounts = {
                            'Trend': 7,
                            'Momentum': 4,
                            'Volatility': 4,
                            'Volume': 4,
                            'Structure': 5,
                            'Breadth': 5
                        };
                        const hardcodedCount = hardcodedCounts[section] || 0;
                        const rawList = grouped[section];
                        const validDynamicCards = rawList ? rawList.filter(c => !c.id?.startsWith('dummy_')) : [];

                        if (hardcodedCount === 0 && validDynamicCards.length === 0) return null;

                        // Sort within section
                        const sectionCards = sortCards(validDynamicCards, sortMode);

                        return (
                            <div key={section} id={`section-${section}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-20">
                                {/* Section Header (Matched to Fundamental) */}
                                <div className="flex items-center justify-center gap-4 mb-3 md:mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-text-primary uppercase tracking-widest">{section}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                                            {sectionCards.length + hardcodedCount}
                                        </span>
                                    </div>
                                </div>

                                {/* Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 items-start">
                                    {section === 'Trend' && (
                                        <>
                                            <EMA20Card />
                                            <EMA50Card />
                                            <EMA200Card />
                                            <SMA50Card />
                                            <SMA200Card />
                                            <ADXCard />
                                            <SupertrendCard />
                                        </>
                                    )}
                                    {section === 'Momentum' && (
                                        <>
                                            <RSICard />
                                            <MACDCard />
                                            <StochRSICard />
                                            <WilliamsRCard />
                                        </>
                                    )}
                                    {section === 'Volatility' && (
                                        <>
                                            <BBCard />
                                            <ATRCard />
                                            <KCCard />
                                            <VixCard />
                                        </>
                                    )}
                                    {section === 'Volume' && (
                                        <>
                                            <CmfCard />
                                            <VolumeSmaCard />
                                            <ObvCard />
                                            <VwapCard />
                                        </>
                                    )}
                                    {section === 'Structure' && (
                                        <>
                                            <SupportCard />
                                            <ResistanceCard />
                                            <TrendlineCard />
                                            <PivotCard />
                                            <FibonacciCard />
                                        </>
                                    )}
                                    {section === 'Breadth' && (
                                        <>
                                            <ADLineCard />
                                            <NhnlCard />
                                            <BreadthRatioCard />
                                            <TrinCard />
                                            <McClellanCard />
                                        </>
                                    )}
                                    {sectionCards.map((card) => {
                                        const excludeIds = ['rsi', 'macd', 'stoch_rsi', 'williams_r', 'bb_20_2', 'atr', 'kc', 'cmf', 'volume_sma', 'obv', 'vwap', 'support', 'resistance', 'trendline', 'pivot', 'fibonacci', 'ema_20', 'ema_50', 'ema_200', 'sma_50', 'sma_200', 'adx', 'supertrend', 'breadth_ratio', 'mcclellan', 'ad_line', 'nh_nl', 'india_vix', 'trin'];
                                        if (excludeIds.includes(card.id) || card.id.startsWith('dummy_')) return null;
                                        return (
                                            <TechnicalCard
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
            )}
        </div>
    );
}
