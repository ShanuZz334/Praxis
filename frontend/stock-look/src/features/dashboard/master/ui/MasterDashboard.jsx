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
import { useDashboardContext } from "@/shared/context/DashboardContext";
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';


import LiveMarketTicker from "./LiveMarketTicker";

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
        livePrices
    } = useDashboardContext();

    const isIndex = selectedCategory === 'Indices';
    const { praxisComposite, sectionsForHeader, tailwinds, risks, regime, loading, integrity, totalCredits, aggregatedCards } = useMasterComposite(selectedInstrument, isIndex, selectedExpiry, livePrices);

    const c = getCompositeColor(praxisComposite);
    const gauge = { label: c.label, color: c.hex };

    return (
        <div className="block px-4 sm:px-6 pt-2 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto h-full space-y-4 md:space-y-6">
            {/* DESKTOP VIEW ONLY */}

            {/* Global Header / Composite Gauge */}
            <GlobalHeader
                title="Praxis Composite"
                score={praxisComposite}
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
            />

            {/* Sub-panels cleared — ready for real data */}

        </div>
    );
}
