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


import LiveMarketTicker from "./LiveMarketTicker";

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
        <div className="block p-4 sm:p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto h-full space-y-4 md:space-y-6">
            {/* DESKTOP VIEW ONLY */}

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
    );
}
