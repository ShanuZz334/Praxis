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
import { useTheme } from "@/shared/context/ThemeContext";

// Shared UI
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";

// Local UI
import ModuleSnapshotGrid from "./ModuleSnapshotGrid";
import TradeReadinessPanel from "./TradeReadinessPanel";
import SignalAlignmentMatrix from "./SignalAlignmentMatrix";
import ProDeskPicks from "./ProDeskPicks";

// Engine & Data
import { MOCK_MASTER_DATA } from "../data/masterData";
import { calculateStockyScore, deriveMasterRegime, deriveMasterGauge } from "../engine/stockyEngine";
import { getNonMasterGaugeLabel, getNonMasterRegimeLabel } from "@/shared/global/logic/labelMappings";

import {
    TOTAL_TECHNICAL_CREDITS,
    TOTAL_FUNDAMENTALS_CREDITS,
    TOTAL_OPTIONS_CREDITS,
    TOTAL_FOREIGN_CREDITS,
    TOTAL_EVENTS_CREDITS
} from "@/config/reliability";

// Technical
import { generateLiveTechnicalData } from "@/features/dashboard/technical/engine/indicatorsConfig";
import { calculateTechnicalComposite } from "@/features/dashboard/technical/engine/technicalHelper";

// Fundamentals
import { useFundamentals } from "@/features/dashboard/fundamentals/hooks/useFundamentals";
import { evaluateFundamentals } from "@/features/dashboard/fundamentals/engine";

// Foreign / Global
import { GLOBAL_STRUCTURE_CARDS } from "@/features/dashboard/foreign/data/globalData";
import { calculateGlobalComposite } from "@/features/dashboard/foreign/engine/globalHelper";

// Options
import { generateOptionsDashboardData } from "@/features/dashboard/options/engine/optionsSimulator";
import { calculatePositioningScore } from "@/features/dashboard/options/engine/optionsHelper";

// Events
import { MOCK_EVENTS } from "@/features/dashboard/events/data/eventsData";
import { MOCK_NEWS } from "@/features/dashboard/events/data/newsData";
import { calculateNewsImpact } from "@/features/dashboard/events/engine/newsScoring";

// =============================
// Main Component
// =============================

export default function MasterDashboard() {
    const { tradingMode } = useTheme();

    // --- 1. Data Aggregation ---

    // Technical
    const technicalCards = useMemo(() => generateLiveTechnicalData(tradingMode), [tradingMode]);

    // Fundamental
    const { marketData } = useFundamentals();
    const fundamentalCards = useMemo(() => {
        if (!marketData) return [];
        return evaluateFundamentals(marketData, tradingMode)?.cards || [];
    }, [marketData, tradingMode]);

    // Options
    const optionsData = useMemo(() => generateOptionsDashboardData(tradingMode), [tradingMode]);
    const optionsCards = optionsData.cards || [];

    // Global
    const globalCards = GLOBAL_STRUCTURE_CARDS;

    // Events (Combined Events + News)
    const eventCards = useMemo(() => {
        const processedEvents = MOCK_EVENTS.map(e => ({ ...e, module: "Events", type: "event" }));
        const processedNews = MOCK_NEWS.map(n => {
            const aiData = calculateNewsImpact(n);
            return {
                ...n,
                module: "Events",
                type: "news",
                impactScore: aiData.score, // Extract raw score for consistency
                aiData: aiData,           // Store full object for UI
                normalized: (aiData.score || 0) / 4
            };
        });
        return [...processedEvents, ...processedNews];
    }, []);

    // --- 2. Score Calculation ---

    // Technical Score
    const technicalScore = useMemo(() => calculateTechnicalComposite(technicalCards), [technicalCards]);

    // Fundamental Score
    const fundamentalScore = useMemo(() => {
        if (!marketData) return 50;
        const intel = evaluateFundamentals(marketData, tradingMode);
        return intel ? intel.score : 50;
    }, [marketData, tradingMode]);

    // Options Score
    const optionsScore = useMemo(() => {
        if (!optionsData || !optionsData.metrics) return 50;
        return calculatePositioningScore(optionsData.metrics, tradingMode).score;
    }, [optionsData, tradingMode]);

    // Global Score
    const globalScore = useMemo(() => calculateGlobalComposite(globalCards, tradingMode), [globalCards, tradingMode]);

    // Events Score (Blended Event Impact + News Sentiment)
    const eventsScore = useMemo(() => {
        const eventsOnly = eventCards.filter(c => c.type === 'event');
        const newsOnly = eventCards.filter(c => c.type === 'news');

        // 1. Hard Event Impact (Scheduled)
        const eventImpact = eventsOnly.reduce((acc, curr) => acc + ((curr.impactScore || 5) * (curr.reliability || 0.5)), 0) / (eventsOnly.length || 1);

        // 2. News Sentiment (Real-time)
        // Note: impactScore is now the extracted .score number from aiData
        const newsImpactSum = newsOnly.reduce((acc, curr) => acc + (curr.impactScore || 0), 0);
        const newsSentiment = Math.max(-20, Math.min(20, newsImpactSum));

        // 3. Composite Gauge (Directional Score)
        // newsSentiment is -20 to +20. Map it to a 0-100 scale centered at 50, 
        // with eventImpact (0-10) acting as a multiplier for intensity.
        const baseScore = 50;
        const intensity = (eventImpact / 10); // 0.0 to 1.0
        return Math.round(Math.max(0, Math.min(100, baseScore + (newsSentiment * 2.5 * intensity))));
    }, [eventCards]);

    // Dynamic Components Object
    // Dynamic Components Object
    const dynamicComponents = useMemo(() => ({
        technical: technicalScore.score || 50,
        fundamental: fundamentalScore,
        options: optionsScore,
        global: globalScore,
        events: eventsScore
    }), [technicalScore, fundamentalScore, optionsScore, globalScore, eventsScore]);

    // --- 3. Master Gauge & Regime ---

    const stockyIntel = useMemo(() => calculateStockyScore(dynamicComponents), [dynamicComponents]);
    const stockyScore = stockyIntel.score;
    const masterGauge = useMemo(() => deriveMasterGauge(stockyScore), [stockyScore]);
    const masterRegime = useMemo(() => deriveMasterRegime(stockyScore), [stockyScore]);

    // Snapshot Mappings (Live Data for Module Grid)
    const snapshots = useMemo(() => {
        const techScoreNum = technicalScore.score || 50;
        const techReg = getNonMasterRegimeLabel(techScoreNum);
        const techG = getNonMasterGaugeLabel(techScoreNum);

        const fundReg = getNonMasterRegimeLabel(fundamentalScore);
        const fundG = getNonMasterGaugeLabel(fundamentalScore);

        const optReg = getNonMasterRegimeLabel(optionsScore);
        const optG = getNonMasterGaugeLabel(optionsScore);

        const globReg = getNonMasterRegimeLabel(globalScore);
        const globG = getNonMasterGaugeLabel(globalScore);

        const evtReg = getNonMasterRegimeLabel(eventsScore);
        const evtG = getNonMasterGaugeLabel(eventsScore);

        return {
            fundamental: { score: fundamentalScore, regime: fundReg.label, gauge: fundG.label, color: fundG.color },
            technical: { score: techScoreNum, trend: techReg.label, gauge: techG.label, color: techG.color },
            options: { score: optionsScore, positioning: optReg.label, gauge: optG.label, color: optG.color },
            events: { score: eventsScore, nextCatalyst: evtReg.label, gauge: evtG.label, color: evtG.color },
            global: { score: globalScore, usTrend: globReg.label, gauge: globG.label, color: globG.color }
        };
    }, [technicalScore, fundamentalScore, optionsScore, globalScore, eventsScore]);

    // --- 4. Unified Card Stream ---

    const allCards = useMemo(() => [
        ...technicalCards.map(c => ({ ...c, module: "Technical" })),
        ...fundamentalCards.map(c => ({ ...c, module: "Fundamental" })),
        ...globalCards.map(c => ({ ...c, module: "Global Macro" })),
        ...optionsCards.map(c => ({ ...c, module: "Options" })),
        ...eventCards.map(c => ({ ...c, module: "Events" }))
    ], [technicalCards, fundamentalCards, globalCards, optionsCards, eventCards]);

    // --- 5. Metrics & Config ---

    const totalCredits = TOTAL_TECHNICAL_CREDITS + TOTAL_FUNDAMENTALS_CREDITS + TOTAL_FOREIGN_CREDITS + TOTAL_OPTIONS_CREDITS + TOTAL_EVENTS_CREDITS;

    const creditBreakdown = {
        "Technical": TOTAL_TECHNICAL_CREDITS,
        "Fundamental": TOTAL_FUNDAMENTALS_CREDITS,
        "Options": TOTAL_OPTIONS_CREDITS,
        "Global Macro": TOTAL_FOREIGN_CREDITS,
        "Events": TOTAL_EVENTS_CREDITS
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
                prevScore={stockyIntel.prevScore}
                gauge={masterGauge}
                regime={{
                    ...masterRegime,
                    confidence: stockyIntel.confidence
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
            <ModuleSnapshotGrid snapshots={snapshots} />

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
