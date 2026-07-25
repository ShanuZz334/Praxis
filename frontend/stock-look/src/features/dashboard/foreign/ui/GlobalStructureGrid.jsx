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

    // 1. SECTIONED VIEW
    if (viewMode === "sectioned" && sections) {
        return (
            <div className="space-y-8">
                {Object.entries(sections).map(([key, section]) => {
                    const filteredSectionCards = GLOBAL_STRUCTURE_CARDS.filter(card => card.category === section.label && !card.id?.startsWith('dummy_'));
                    
                    // Sort section cards
                    const sortedSectionCards = sortCards(filteredSectionCards, sortMode);

                    if (sortedSectionCards.length === 0) return null;

                    return (
                        <div key={key} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Section Header */}
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-text-primary uppercase tracking-widest">{section.label}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                                        {sortedSectionCards.length}
                                    </span>
                                </div>
                            </div>
                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-start">
                                {sortedSectionCards.map((card) => {
                                    if (card.id?.startsWith('dummy_')) return null;
                                    return (
                                        <GenericGlobalCard 
                                            key={card.id} 
                                            id={card.id} 
                                            label={card.label} 
                                            engineData={cardData[card.id]} 
                                            isLive={liveData[card.id] !== undefined && liveData[card.id] !== null}
                                            resolveTime={(isLive) => resolveTime(isLive, isLive ? null : card.id)}
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
    const dynamicCards = GLOBAL_STRUCTURE_CARDS.filter(card => !card.id?.startsWith('dummy_')).map(card => {
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
                engineData={cardData[card.id]}
                resolveTime={(isLive) => resolveTime(isLive, isLive ? null : card.id)}
                isLive={isLiveVal}
            />
        };
    });

    const filteredFlatWithData = dynamicCards.filter(item => {
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
