/**
 * @file MasterDashboard.jsx
 * @purpose The central command center for the "Stocky Composite" dashboard.
 * @responsibilities
 * - Aggregates scores from all major feature modules (Technical, Fundamental, Options, Global, Events).
 * - Calculates a unified "Stocky Score" and determines the market regime.
 * - Displays a high-level summary header (GlobalHeader) with key metrics.
 * - Renders specific snapshot grids and readiness panels.
 * @key_exports
 * - MasterDashboard (Default Component)
 * @dependencies
 * - React, useMemo
 * - GlobalHeader, ModuleSnapshotGrid, TradeReadinessPanel, SignalAlignmentMatrix, ProDeskPicks (UI)
 * - masterData, stockyEngine (Engine/Data)
 * - Feature-specific engines (Technical, Fundamental, Options, Events, Global)
 * @lifecycle
 * - Main route component for the Dashboard.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useMemo } from "react";

// Shared UI
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";

// Local UI
import ModuleSnapshotGrid from "./ModuleSnapshotGrid";
import TradeReadinessPanel from "./TradeReadinessPanel";
import SignalAlignmentMatrix from "./SignalAlignmentMatrix";
import ProDeskPicks from "./ProDeskPicks";

// Engine & Data
import { MOCK_MASTER_DATA } from "../data/masterData";
import { calculateStockyScore, deriveMasterRegime, getRegimeColor } from "../engine/stockyEngine";

// Technical
import { generateLiveTechnicalData, TOTAL_TECHNICAL_CREDITS } from "@/features/dashboard/technical/engine/indicatorsConfig";
import { calculateTechnicalComposite } from "@/features/dashboard/technical/engine/technicalHelper";

// Fundamentals
import { TOTAL_FUNDAMENTAL_CREDITS } from "@/features/dashboard/fundamentals/engine/cards.config";
import { useFundamentals } from "@/features/dashboard/fundamentals/hooks/useFundamentals";
import { evaluateFundamentals } from "@/features/dashboard/fundamentals/engine";

// Foreign / Global
import { GLOBAL_STRUCTURE_CARDS, TOTAL_GLOBAL_CREDITS } from "@/features/dashboard/foreign/data/globalData";
import { calculateGlobalComposite } from "@/features/dashboard/foreign/engine/globalHelper";

// Options
import { generateOptionsDashboardData, TOTAL_OPTIONS_CREDITS } from "@/features/dashboard/options/engine/optionsSimulator";
import { calculatePositioningScore } from "@/features/dashboard/options/engine/optionsHelper";

// Events
import { MOCK_EVENTS, TOTAL_EVENTS_CREDITS } from "@/features/dashboard/events/data/eventsData";
import { MOCK_NEWS } from "@/features/dashboard/events/data/newsData";
import { calculateNewsImpact } from "@/features/dashboard/events/engine/newsScoring";

// =============================
// Main Component
// =============================

export default function MasterDashboard() {

    // --- 1. Data Aggregation ---

    // Technical
    const technicalCards = useMemo(() => generateLiveTechnicalData(), []);

    // Fundamental
    const { marketData } = useFundamentals();
    const fundamentalCards = useMemo(() => {
        if (!marketData) return [];
        return evaluateFundamentals(marketData)?.cards || [];
    }, [marketData]);

    // Options
    const optionsData = useMemo(() => generateOptionsDashboardData(), []);
    const optionsCards = optionsData.cards || [];

    // Global
    const globalCards = GLOBAL_STRUCTURE_CARDS;

    // Events (News Processing)
    const eventCards = useMemo(() => {
        return MOCK_NEWS.map(n => {
            const impact = n.impactScore || calculateNewsImpact(n);
            return {
                ...n,
                impactScore: impact,
                normalized: (impact || 0) / 4
            };
        });
    }, []);

    // --- 2. Score Calculation ---

    // Technical Score
    const technicalScore = useMemo(() => calculateTechnicalComposite(technicalCards), [technicalCards]);

    // Fundamental Score
    const fundamentalScore = useMemo(() => {
        if (!marketData) return 50;
        const intel = evaluateFundamentals(marketData);
        return intel ? intel.gauge : 50;
    }, [marketData]);

    // Options Score
    const optionsScore = useMemo(() => {
        if (!optionsData || !optionsData.metrics) return 50;
        return calculatePositioningScore(optionsData.metrics).score;
    }, [optionsData]);

    // Global Score
    const globalScore = useMemo(() => calculateGlobalComposite(globalCards), [globalCards]);

    // Events Score (Sentiment-based)
    const eventsScore = useMemo(() => {
        const newsImpactSum = eventCards.reduce((acc, curr) => acc + (curr.impactScore || 0), 0);
        const netSentiment = Math.round(newsImpactSum * 1.5);
        return Math.max(0, Math.min(100, 50 + (netSentiment / 2)));
    }, [eventCards]);

    // Dynamic Components Object
    const dynamicComponents = useMemo(() => ({
        technical: technicalScore,
        fundamental: fundamentalScore,
        options: optionsScore,
        global: globalScore,
        events: eventsScore
    }), [technicalScore, fundamentalScore, optionsScore, globalScore, eventsScore]);

    // --- 3. Master Gauge & Regime ---

    const stockyScore = useMemo(() => calculateStockyScore(dynamicComponents), [dynamicComponents]);
    const masterRegime = useMemo(() => deriveMasterRegime(stockyScore, MOCK_MASTER_DATA.riskMonitor.volatility), [stockyScore]);

    // --- 4. Unified Card Stream ---

    const allCards = useMemo(() => [
        ...technicalCards.map(c => ({ ...c, module: "Technical" })),
        ...fundamentalCards.map(c => ({ ...c, module: "Fundamental" })),
        ...globalCards.map(c => ({ ...c, module: "Global Macro" })),
        ...optionsCards.map(c => ({ ...c, module: "Options" })),
        ...eventCards.map(c => ({ ...c, module: "Events" }))
    ], [technicalCards, fundamentalCards, globalCards, optionsCards, eventCards]);

    // --- 5. Metrics & Config ---

    const totalCredits = TOTAL_TECHNICAL_CREDITS + TOTAL_FUNDAMENTAL_CREDITS + TOTAL_GLOBAL_CREDITS + TOTAL_OPTIONS_CREDITS + eventCards.length;

    const creditBreakdown = {
        "Technical": TOTAL_TECHNICAL_CREDITS,
        "Fundamental": TOTAL_FUNDAMENTAL_CREDITS,
        "Options": TOTAL_OPTIONS_CREDITS,
        "Global Macro": TOTAL_GLOBAL_CREDITS,
        "Events": eventCards.length
    };

    const globalSections = useMemo(() => [
        { id: 'tech', label: 'TECH', normalizedScore: dynamicComponents.technical, rawScore: dynamicComponents.technical },
        { id: 'fund', label: 'FUND', normalizedScore: dynamicComponents.fundamental, rawScore: dynamicComponents.fundamental },
        { id: 'opt', label: 'OPT', normalizedScore: dynamicComponents.options, rawScore: dynamicComponents.options },
        { id: 'glob', label: 'GLOB', normalizedScore: dynamicComponents.global, rawScore: dynamicComponents.global },
        { id: 'evt', label: 'EVT', normalizedScore: dynamicComponents.events, rawScore: dynamicComponents.events },
    ], [dynamicComponents]);

    const tailwinds = useMemo(() => {
        return MOCK_MASTER_DATA.readiness.do.instruments.map((inst, i) => ({
            id: `tw-${i}`, label: inst, value: 85, sub: "High Conviction"
        }));
    }, []);

    const risks = useMemo(() => {
        const rm = MOCK_MASTER_DATA.riskMonitor;
        return [
            { id: 'vol', label: 'Volatility', value: rm.volatility === "Stable" ? 20 : 80, sub: rm.volatility },
            { id: 'evt', label: 'Event Risk', value: 90, sub: rm.eventRisk },
            { id: 'liq', label: 'Liquidity', value: rm.liquidity === "Healthy" ? 10 : 60, sub: rm.liquidity },
        ];
    }, []);

    // --- Render ---

    return (
        <div className="p-4 sm:p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto h-full space-y-4 md:space-y-6">

            {/* Global Header / Composite Gauge */}
            <GlobalHeader
                title="Stocky Composite"
                score={stockyScore}
                prevScore={stockyScore - 4.2}
                regime={{
                    label: masterRegime,
                    desc: "Algorithmically determined market phase",
                    color: getRegimeColor(masterRegime),
                    confidence: 89
                }}
                integrity={{ coverage: "5/5 Engines", source: "Cross-Asset", freshness: "Realtime" }}
                sections={globalSections}
                tailwinds={tailwinds}
                risks={risks}
                totalCredits={totalCredits}
                creditBreakdown={creditBreakdown}
                enableBreakdown={true}
                cards={allCards}
                controls={null}
            />

            {/* Feature Module Snapshots */}
            <ModuleSnapshotGrid snapshots={MOCK_MASTER_DATA.snapshots} />

            {/* Trading Plan & Readiness */}
            <TradeReadinessPanel readiness={MOCK_MASTER_DATA.readiness} />

            {/* Pro Desk & Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SignalAlignmentMatrix alerts={MOCK_MASTER_DATA.alerts} />
                <ProDeskPicks data={MOCK_MASTER_DATA.proDeskPicks} />
            </div>

        </div>
    );
}
