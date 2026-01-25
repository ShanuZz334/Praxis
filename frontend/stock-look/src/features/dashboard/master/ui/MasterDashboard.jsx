import React, { useMemo } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import ModuleSnapshotGrid from "./ModuleSnapshotGrid";
import TradeReadinessPanel from "./TradeReadinessPanel";
import SignalAlignmentMatrix from "./SignalAlignmentMatrix";
import ProDeskPicks from "./ProDeskPicks";

import { MOCK_MASTER_DATA } from "../data/masterData";
import { calculateStockyScore, deriveMasterRegime } from "../engine/stockyEngine";

// --- DATA SOURCE COMPOSITION ---
// --- DATA SOURCE COMPOSITION ---
import { generateLiveTechnicalData, TOTAL_TECHNICAL_CREDITS } from "@/features/dashboard/technical/engine/indicatorsConfig";
import { calculateTechnicalComposite } from "@/features/dashboard/technical/engine/technicalHelper";

import { TOTAL_FUNDAMENTAL_CREDITS } from "@/features/dashboard/fundamentals/engine/cards.config";
import { useFundamentals } from "@/features/dashboard/fundamentals/hooks/useFundamentals";
import { evaluateFundamentals } from "@/features/dashboard/fundamentals/engine";

import { GLOBAL_STRUCTURE_CARDS, TOTAL_GLOBAL_CREDITS } from "@/features/dashboard/foreign/data/globalData";
import { calculateGlobalComposite } from "@/features/dashboard/foreign/engine/globalHelper";

import { generateOptionsDashboardData, TOTAL_OPTIONS_CREDITS } from "@/features/dashboard/options/engine/optionsSimulator";
import { calculatePositioningScore } from "@/features/dashboard/options/engine/optionsHelper";

import { MOCK_EVENTS, TOTAL_EVENTS_CREDITS } from "@/features/dashboard/events/data/eventsData";
import { MOCK_NEWS } from "@/features/dashboard/events/data/newsData";
import { calculateNewsImpact } from "@/features/dashboard/events/engine/newsScoring";

export default function MasterDashboard() {


    // --- AGGREGATE CARD DATA FOR SIGNAL INTEGRITY ---

    // 1. Technical (Live Simulation)
    const technicalCards = useMemo(() => generateLiveTechnicalData(), []);

    // 2. Fundamental (Live Feed Hook)
    const { marketData } = useFundamentals();
    const fundamentalCards = useMemo(() => {
        if (!marketData) return [];
        return evaluateFundamentals(marketData)?.cards || [];
    }, [marketData]);

    // 3. Options (Live Simulation)
    const optionsData = useMemo(() => generateOptionsDashboardData(), []);
    const optionsCards = optionsData.cards || [];

    // 4. Global (Static/Live) & Events (News-Driven)
    const globalCards = GLOBAL_STRUCTURE_CARDS;

    // Process News for Cards (same logic as EventsPage)
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

    // --- SCORE CALCULATION ---

    // 1. Technical Score
    const technicalScore = useMemo(() => calculateTechnicalComposite(technicalCards), [technicalCards]);

    // 2. Fundamental Score
    const fundamentalScore = useMemo(() => {
        if (!marketData) return 50;
        const intel = evaluateFundamentals(marketData);
        return intel ? intel.gauge : 50;
    }, [marketData]);

    // 3. Options Score
    const optionsScore = useMemo(() => {
        if (!optionsData || !optionsData.metrics) return 50;
        return calculatePositioningScore(optionsData.metrics).score;
    }, [optionsData]);

    // 4. Global Score
    const globalScore = useMemo(() => calculateGlobalComposite(globalCards), [globalCards]);

    // 5. Events Score (Net Sentiment -> Market Health Gauge)
    const eventsScore = useMemo(() => {
        const newsImpactSum = eventCards.reduce((acc, curr) => acc + (curr.impactScore || 0), 0);
        const eventImpactSum = 0;
        const netSentiment = Math.round((newsImpactSum + eventImpactSum) * 1.5);
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

    // MAIN GAUGE SCORE
    const stockyScore = useMemo(() => calculateStockyScore(dynamicComponents), [dynamicComponents]);
    const masterRegime = useMemo(() => deriveMasterRegime(stockyScore, MOCK_MASTER_DATA.riskMonitor.volatility), [stockyScore]);

    // Combine all intelligence cards into one unified stream, tagging them
    const allCards = useMemo(() => [
        ...technicalCards.map(c => ({ ...c, module: "Technical" })),
        ...fundamentalCards.map(c => ({ ...c, module: "Fundamental" })),
        ...globalCards.map(c => ({ ...c, module: "Global Macro" })),
        ...optionsCards.map(c => ({ ...c, module: "Options" })),
        ...eventCards.map(c => ({ ...c, module: "Events" }))
    ], [technicalCards, fundamentalCards, globalCards, optionsCards, eventCards]);

    // Calculate Total Credits across the entire platform
    const totalCredits = TOTAL_TECHNICAL_CREDITS + TOTAL_FUNDAMENTAL_CREDITS + TOTAL_GLOBAL_CREDITS + TOTAL_OPTIONS_CREDITS + eventCards.length;

    // Credit Breakdown for Tooltip
    const creditBreakdown = {
        "Technical": TOTAL_TECHNICAL_CREDITS,
        "Fundamental": TOTAL_FUNDAMENTAL_CREDITS,
        "Options": TOTAL_OPTIONS_CREDITS,
        "Global Macro": TOTAL_GLOBAL_CREDITS,
        "Events": eventCards.length
    };

    // Map Components to GlobalHeader Sections (Dynamic)
    const globalSections = useMemo(() => {
        return [
            { id: 'tech', label: 'TECH', normalizedScore: dynamicComponents.technical, rawScore: dynamicComponents.technical },
            { id: 'fund', label: 'FUND', normalizedScore: dynamicComponents.fundamental, rawScore: dynamicComponents.fundamental },
            { id: 'opt', label: 'OPT', normalizedScore: dynamicComponents.options, rawScore: dynamicComponents.options },
            { id: 'glob', label: 'GLOB', normalizedScore: dynamicComponents.global, rawScore: dynamicComponents.global },
            { id: 'evt', label: 'EVT', normalizedScore: dynamicComponents.events, rawScore: dynamicComponents.events },
        ];
    }, [dynamicComponents]);

    // Tailwinds from Readiness
    const tailwinds = useMemo(() => {
        return MOCK_MASTER_DATA.readiness.do.instruments.map((inst, i) => ({
            id: `tw-${i}`, label: inst, value: 85, sub: "High Conviction"
        }));
    }, []);

    // Risks from RiskMonitor
    const risks = useMemo(() => {
        const rm = MOCK_MASTER_DATA.riskMonitor;
        return [
            { id: 'vol', label: 'Volatility', value: rm.volatility === "Stable" ? 20 : 80, sub: rm.volatility },
            { id: 'evt', label: 'Event Risk', value: 90, sub: rm.eventRisk },
            { id: 'liq', label: 'Liquidity', value: rm.liquidity === "Healthy" ? 10 : 60, sub: rm.liquidity },
        ];
    }, []);

    return (
        <div className="p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto h-full space-y-6">

            {/* HEADER AREA */}
            <GlobalHeader
                title="Stocky Composite"
                score={stockyScore}
                prevScore={stockyScore - 4.2}
                regime={{
                    label: masterRegime,
                    desc: "Algorithmically determined market phase",
                    color: masterRegime.includes("Risk-On") ? "text-emerald-400" : "text-slate-200",
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



            <ModuleSnapshotGrid snapshots={MOCK_MASTER_DATA.snapshots} />

            <TradeReadinessPanel readiness={MOCK_MASTER_DATA.readiness} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SignalAlignmentMatrix alerts={MOCK_MASTER_DATA.alerts} />
                <ProDeskPicks data={MOCK_MASTER_DATA.proDeskPicks} />
            </div>

        </div>
    );
}
