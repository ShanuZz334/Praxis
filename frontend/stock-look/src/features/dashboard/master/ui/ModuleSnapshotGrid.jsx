/**
 * @file ModuleSnapshotGrid.jsx
 * @purpose Displays a grid of snapshot cards for each major dashboard module.
 * @responsibilities
 * - Renders specific intelligence cards using GlobalCard for conformity.
 * - Handles normalization of scores (-1 to 1) for visual indicators.
 * - Maps technical, fundamental, options, events, and global data to card properties.
 * @key_exports
 * - ModuleSnapshotGrid (Default Component)
 * @dependencies
 * - GlobalCard (Shared UI)
 * - Module Credit Constants (from various feature engines)
 * @lifecycle
 * - Rendered by MasterDashboard as the primary navigation/status grid.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";
import { TOTAL_TECHNICAL_CREDITS } from "@/features/dashboard/technical/engine/indicatorsConfig";
import { TOTAL_FUNDAMENTAL_CREDITS } from "@/features/dashboard/fundamentals/engine/cards.config";
import { TOTAL_GLOBAL_CREDITS } from "@/features/dashboard/foreign/data/globalData";
import { TOTAL_OPTIONS_CREDITS } from "@/features/dashboard/options/engine/optionsSimulator";
import { TOTAL_EVENTS_CREDITS } from "@/features/dashboard/events/data/eventsData";

// =============================
// Helper Function
// =============================

const renderCard = (id, label, data, reasonKey, totalModuleCredits) => {
    if (!data) return null;

    const score = data.score || 50;
    // Normalize 0-100 to -1 to 1 for GlobalCard signal logic
    const normalized = (score - 50) / 50;

    // Extract reason text dynamically
    const reason = data[reasonKey] || "Stable";

    return (
        <GlobalCard
            key={id}
            label={label}
            normalized={normalized}
            creditScore={0.9} // High reliability assumption for top-level summaries
            creditAllocation={totalModuleCredits}
            reason={reason}
            onClick={() => { }} // Placeholder for future navigation
        />
    );
};

// =============================
// Main Component
// =============================

export default function ModuleSnapshotGrid({ snapshots }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* 1. Fundamental */}
            {renderCard("fund", "Fundamental", snapshots.fundamental, "regime", TOTAL_FUNDAMENTAL_CREDITS)}

            {/* 2. Technical */}
            {renderCard("tech", "Technical", snapshots.technical, "trend", TOTAL_TECHNICAL_CREDITS)}

            {/* 3. Options */}
            {renderCard("opt", "Options", snapshots.options, "positioning", TOTAL_OPTIONS_CREDITS)}

            {/* 4. Events */}
            {renderCard("evt", "Events", snapshots.events, "nextCatalyst", TOTAL_EVENTS_CREDITS)}

            {/* 5. Global */}
            {renderCard("glob", "Global", snapshots.global, "usTrend", TOTAL_GLOBAL_CREDITS)}

        </div>
    );
}
