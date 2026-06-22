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
import React, { useState, useEffect } from "react";
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
import axiosInstance from "@/shared/utils/axiosInstance";
import { API_PATHS } from "@/shared/utils/apiPaths";

// =============================
// Main Component
// =============================

export default function JournalPage() {
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [realLogs, setRealLogs] = useState([]);
    const [realAnalytics, setRealAnalytics] = useState(null);
    const [realNotes, setRealNotes] = useState({});

    // Fetch Real Journal Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [logsRes, analyticsRes, notesRes] = await Promise.all([
                    axiosInstance.get(API_PATHS.JOURNAL.GET_LOGS),
                    axiosInstance.get(API_PATHS.JOURNAL.ANALYTICS),
                    axiosInstance.get(API_PATHS.JOURNAL.GET_NOTES)
                ]);

                if (logsRes.data && Array.isArray(logsRes.data)) {
                    setRealLogs(logsRes.data);
                }
                if (analyticsRes.data) {
                    setRealAnalytics(analyticsRes.data);
                }
                if (notesRes.data) {
                    setRealNotes(notesRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch journal data:", err);
            }
        };
        fetchData();
    }, []);

    // Merge Real Data with Mock Fallbacks
    const displayTrades = realLogs.length > 0 ? realLogs : MOCK_JOURNAL_DATA.trades;
    // Map backend analytics to frontend structure if needed, or use mock if null
    // Here we assume backend analytics might need mapping or just use mock for complex nested structures initially
    // For simplicity, we'll keep using mock analytics structure but override values if we had a mapper.
    // Given the simple backed analytics, we might just stick to displayTrades for the table for now.

    // Notes Merge (Favor Real)
    const displayNotes = Object.keys(realNotes).length > 0 ? realNotes : MOCK_JOURNAL_DATA.dailyNotes;

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
                            trades={displayTrades}
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
                        trades={displayTrades}
                        notes={displayNotes}
                        onClose={() => setIsNotesOpen(false)}
                        onNotesUpdate={setRealNotes} // Pass updater to refresh state locally if needed
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
