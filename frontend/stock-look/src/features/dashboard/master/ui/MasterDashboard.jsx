/**
 * @file MasterDashboard.jsx
 * @purpose The central command center for the Praxis Composite dashboard.
 * @responsibilities
 * - Renders the GlobalHeader with the master composite score.
 * - Renders MobileDashboardLayout for mobile viewports.
 * - All sub-panels below the header are cleared — ready for real data.
 * @key_exports
 * - MasterDashboard (Default Component)
 * @lifecycle
 * - Main route component for the Dashboard.
 */

import React from "react";

// Shared UI
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";

// Mobile layout
import MobileDashboardLayout from "./mobile/MobileDashboardLayout";

// =============================
// Main Component
// =============================

export default function MasterDashboard() {

    const score = 0;
    const gauge = { label: "—", color: "#64748B" };
    const regime = { label: "—", description: "No data loaded", color: "#64748B", confidence: 0 };

    const sections = [
        { id: "tech",  label: "TECH",  normalizedScore: 0, rawScore: 0 },
        { id: "fund",  label: "FUND",  normalizedScore: 0, rawScore: 0 },
        { id: "opt",   label: "OPT",   normalizedScore: 0, rawScore: 0 },
        { id: "glob",  label: "GLOB",  normalizedScore: 0, rawScore: 0 },
        { id: "evt",   label: "EVT",   normalizedScore: 0, rawScore: 0 },
    ];

    return (
        <>
        {/* DESKTOP VIEW */}
        <div className="hidden lg:block p-4 sm:p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto h-full space-y-4 md:space-y-6">

            {/* Global Header / Composite Gauge */}
            <GlobalHeader
                title="Praxis Composite"
                score={score}
                prevScore={0}
                gauge={gauge}
                regime={regime}
                integrity={{ coverage: "—", source: "—", freshness: "—" }}
                sections={sections}
                tailwinds={[]}
                risks={[]}
                totalCredits={0}
                enableBreakdown={false}
                cards={[]}
                controls={null}
            />

            {/* Sub-panels cleared — ready for real data */}

        </div>

        {/* MOBILE VIEW */}
        <div className="block lg:hidden">
            <MobileDashboardLayout
                stockyScore={score}
                prevScore={0}
                masterGauge={gauge}
                masterRegime={regime}
                snapshots={{
                    fundamental: { score: 0, regime: "—", gauge: "—", color: "#64748B" },
                    technical:   { score: 0, trend:  "—", gauge: "—", color: "#64748B" },
                    options:     { score: 0, positioning: "—", gauge: "—", color: "#64748B" },
                    events:      { score: 0, nextCatalyst: "—", gauge: "—", color: "#64748B" },
                    global:      { score: 0, usTrend: "—", gauge: "—", color: "#64748B" },
                }}
                totalCredits={0}
                signalCounts={{ bulls: 0, bears: 0, neutrals: 0 }}
                integrity={{ coverage: "—", source: "—", freshness: "—" }}
            />
        </div>
        </>
    );
}
