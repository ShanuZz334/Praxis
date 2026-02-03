/**
 * @file JournalPage.jsx
 * @purpose Main container for the Trading Journal feature.
 * @responsibilities
 * - Orchestrates the layout of Journal components (Header, Context, Log, Analytics).
 * - Manages state for selected trades and active modals.
 * - Integrates mock data (pending backend integration).
 * @key_exports
 * - JournalPage (Default Component)
 * @dependencies
 * - Framer Motion (AnimatePresence)
 * - JournalHeader, MarketContextBar, TradeLogTable, etc.
 * @lifecycle
 * - Rendered by Routing Logic (Dashboard Layout).
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import JournalAIInsights from "./JournalAIInsights";
import JournalHeader from "./JournalHeader";
import MarketContextBar from "./MarketContextBar";
import TradeLogTable from "./TradeLogTable";
import PerformanceAnalytics from "./PerformanceAnalytics";
import PsychologyTracker from "./PsychologyTracker";
import TradeDeepDive from "./TradeDeepDive";
import TradingNotesModal from "./TradingNotesModal";
import { MOCK_JOURNAL_DATA } from "../data/journalData";

// =============================
// Main Component
// =============================

export default function JournalPage() {
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    return (
        <div className="pb-20 animate-in fade-in duration-500 min-h-screen font-sans">
            {/* --- Main Content Container --- */}
            <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

                {/* 1. AI Insights System */}
                <JournalAIInsights onToggleNotes={() => setIsNotesOpen(true)} />

                {/* 2. Account & Process KPIs */}
                <JournalHeader
                    capital={MOCK_JOURNAL_DATA.account}
                    score={MOCK_JOURNAL_DATA.executionScore}
                />

                {/* 3. Market Context Ribbon */}
                <div className="hidden md:block">
                    <MarketContextBar context={MOCK_JOURNAL_DATA.marketContext} />
                </div>

                {/* 4. Workspace Split (Log vs Analytics) */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                    {/* Left: Execution Log (75%) */}
                    <div className="xl:col-span-3">
                        <TradeLogTable
                            trades={MOCK_JOURNAL_DATA.trades}
                            onSelectTrade={setSelectedTrade}
                        />
                    </div>

                    {/* Right: Analytics Stack (25%) */}
                    <div className="col-span-1 xl:col-span-1 space-y-6">
                        <PerformanceAnalytics analytics={MOCK_JOURNAL_DATA.analytics} />
                        <PsychologyTracker psychology={MOCK_JOURNAL_DATA.psychology} />
                    </div>
                </div>
            </div>

            {/* --- Modal System --- */}
            <AnimatePresence>
                {selectedTrade && (
                    <TradeDeepDive
                        key="trade-modal"
                        trade={selectedTrade}
                        onClose={() => setSelectedTrade(null)}
                    />
                )}

                {isNotesOpen && (
                    <TradingNotesModal
                        key="notes-modal"
                        trades={MOCK_JOURNAL_DATA.trades}
                        notes={MOCK_JOURNAL_DATA.dailyNotes}
                        onClose={() => setIsNotesOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
