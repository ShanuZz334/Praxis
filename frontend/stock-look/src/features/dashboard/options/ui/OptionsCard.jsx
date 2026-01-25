import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard/GlobalCard";
import { TOTAL_OPTIONS_CREDITS } from "@/features/dashboard/options/engine/optionsSimulator";

/* ----------------------------------------
   Options Card (Wrapper for GlobalCard)
---------------------------------------- */
export default function OptionsCard({ card, onClick }) {
    if (!card) return null;

    return (
        <GlobalCard
            // 1. Content Mapping
            label={card.label}
            raw={card.value}
            unit={card.unit}
            reason={card.interpretation}

            // 2. Visuals
            normalized={card.normalized}
            creditAllocation={card.creditAllocation || 10}
            totalPageCredits={TOTAL_OPTIONS_CREDITS}

            // 3. Optional overrides
            trend={card.change} // Used for badge text if supported

            // 4. Interaction
            onClick={onClick}
        />
    );
}
