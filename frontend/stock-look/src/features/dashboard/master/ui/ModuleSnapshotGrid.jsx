import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";
import { TOTAL_TECHNICAL_CREDITS } from "@/features/dashboard/technical/engine/indicatorsConfig";
import { TOTAL_FUNDAMENTAL_CREDITS } from "@/features/dashboard/fundamentals/engine/cards.config";
import { TOTAL_GLOBAL_CREDITS } from "@/features/dashboard/foreign/data/globalData";
import { TOTAL_OPTIONS_CREDITS } from "@/features/dashboard/options/engine/optionsSimulator";
import { TOTAL_EVENTS_CREDITS } from "@/features/dashboard/events/data/eventsData";

export default function ModuleSnapshotGrid({ snapshots }) {

    // Helper to map snapshot data to GlobalCard format
    const renderCard = (id, label, data, reasonKey, trendState, totalModuleCredits) => {
        if (!data) return null; // Safety check

        const score = data.score || 50;
        // Normalize 0-100 to -1 to 1 for GlobalCard signal logic
        const normalized = (score - 50) / 50;

        // Extract reason text dynamically
        const reason = data[reasonKey] || "Stable";

        return (
            <GlobalCard
                label={label}
                // raw={score}  <-- REMOVED to avoid duplicate "78/100" text
                // unit="/ 100" <-- REMOVED
                normalized={normalized}
                creditScore={0.9} // High reliability for top-level modules
                creditAllocation={totalModuleCredits} // Display Total Module Credits
                reason={reason}
                onClick={() => { }} // Could link to page later
            />
        );
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* 1. Fundamental */}
            {renderCard("fund", "Fundamental", snapshots.fundamental, "regime", null, TOTAL_FUNDAMENTAL_CREDITS)}

            {/* 2. Technical */}
            {renderCard("tech", "Technical", snapshots.technical, "trend", null, TOTAL_TECHNICAL_CREDITS)}

            {/* 3. Options */}
            {renderCard("opt", "Options", snapshots.options, "positioning", null, TOTAL_OPTIONS_CREDITS)}

            {/* 4. Events */}
            {renderCard("evt", "Events", snapshots.events, "nextCatalyst", null, TOTAL_EVENTS_CREDITS)}

            {/* 5. Global */}
            {renderCard("glob", "Global", snapshots.global, "usTrend", null, TOTAL_GLOBAL_CREDITS)}

            {/* 6. Journal (Optional/Mock) */}
            {/* Journal doesn't have a configured total credits constant yet, defaulting to 100 or hiding credits */}
            {renderCard("jrn", "Journal", snapshots.journal, "alert", null, 100)}

        </div>
    );
}
