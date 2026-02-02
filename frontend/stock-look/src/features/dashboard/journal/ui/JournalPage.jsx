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

export default function JournalPage() {
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    return (
        <div className="pb-20 animate-in fade-in duration-500 min-h-screen font-sans">
            {/* 1. SYSTEM MONITOR STRIP (Full Width, Slim) */}
            <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
                <JournalAIInsights onToggleNotes={() => setIsNotesOpen(true)} />

                {/* 2. KPI GRID (Account & Process) */}
                <JournalHeader
                    capital={MOCK_JOURNAL_DATA.account}
                    score={MOCK_JOURNAL_DATA.executionScore}
                />

                {/* 3. MARKET CONTEXT RIBBON */}
                <div className="hidden md:block">
                    <MarketContextBar context={MOCK_JOURNAL_DATA.marketContext} />
                </div>

                {/* 4. MAIN WORKSPACE (Log + Sidebar) */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                    {/* LEFT: EXECUTION LOG (75%) */}
                    <div className="xl:col-span-3">
                        <TradeLogTable
                            trades={MOCK_JOURNAL_DATA.trades}
                            onSelectTrade={setSelectedTrade}
                        />
                    </div>

                    {/* RIGHT: ANALYTICS STACK (25%) - Visible on mobile now, stacked below */}
                    <div className="col-span-1 xl:col-span-1 space-y-6">
                        <PerformanceAnalytics analytics={MOCK_JOURNAL_DATA.analytics} />
                        <PsychologyTracker psychology={MOCK_JOURNAL_DATA.psychology} />
                    </div>
                </div>
            </div>

            {/* MODALS WINDOW SYSTEM */}
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
