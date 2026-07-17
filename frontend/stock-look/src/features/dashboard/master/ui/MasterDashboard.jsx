/**
 * @file MasterDashboard.jsx
 * @purpose The central command center for the Praxis Composite dashboard.
 */

import React from "react";

// Shared UI
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import { useDashboardContext } from "@/shared/context/DashboardContext";
import { useAiSync } from "@/shared/hooks/useAiSync";

import LiveMarketTicker from "./LiveMarketTicker";
import MarketHeatmap from "./MarketHeatmap";
import FiiDiiFlow from "./FiiDiiFlow";
import OptionsPulse from "./OptionsPulse";
import SectorRotation from "./SectorRotation";
import VolumeShockers from "./VolumeShockers";
import CatalystCalendar from "./CatalystCalendar";

import { useMasterComposite } from "../engine/useMasterComposite";
import { getCompositeColor } from "@/shared/config/scoreColors";

// =============================
// Main Component
// =============================

export default function MasterDashboard() {
    const {
        selectedCategory,
        selectedInstrument,
        selectedExpiry,
        livePrices,
        sectors,
        smartlists,
        fiiDiiFlow
    } = useDashboardContext();

    const isIndex = selectedCategory === 'Indices';
    const activeOpts = smartlists?.['MOST_ACTIVE'] || [];
    
    const { praxisComposite, modifierImpact, sectionsForHeader, tailwinds, risks, regime, loading, integrity, totalCredits, aggregatedCards } = useMasterComposite(selectedInstrument, isIndex, selectedExpiry, livePrices, {
        sectors,
        activeOpts,
        fiiDiiFlow
    });

    const c = getCompositeColor(praxisComposite);
    const gauge = { label: c.label, color: c.hex };

    // Silently Stream the Snapshot to SQLite backend
    useAiSync(
        selectedInstrument?.value || selectedInstrument,
        "Master", 
        {
            compositeScore: praxisComposite,
            regime: regime,
            sections: sectionsForHeader,
            tailwinds: tailwinds,
            risks: risks,
            aiInsight: null, // Master doesn't generate a text insight yet
            cards: aggregatedCards
        }
    );

    return (
        <div className="block px-4 sm:px-6 pt-2 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto h-full space-y-4 md:space-y-6">
            
            <GlobalHeader
                title="Praxis Composite"
                score={praxisComposite}
                scoreModifier={modifierImpact}
                prevScore={null}
                gauge={gauge}
                regime={regime}
                integrity={integrity}
                sections={sectionsForHeader}
                tailwinds={tailwinds}
                risks={risks}
                totalCredits={totalCredits}
                enableBreakdown={true}
                cards={aggregatedCards}
                controls={{ customComponent: <LiveMarketTicker /> }}
            />

            {/* Tier 1 Grid */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-8 h-full">
                    <MarketHeatmap />
                </div>
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                    <div className="h-[250px]">
                        <FiiDiiFlow />
                    </div>
                    <div className="h-[300px]">
                        <OptionsPulse />
                    </div>
                </div>
            </div>

            {/* Tier 2 Grid */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-4 h-[350px]">
                    <SectorRotation />
                </div>
                <div className="col-span-12 lg:col-span-4 h-[350px]">
                    <VolumeShockers />
                </div>
                <div className="col-span-12 lg:col-span-4 h-[350px]">
                    <CatalystCalendar />
                </div>
            </div>

        </div>
    );
}
