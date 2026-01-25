import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";

/* ----------------------------------------
   Technical Card (Adapter)
   Now strictly inherits from GlobalCard to ensure identical sizing and layout.
---------------------------------------- */
export default function TechnicalCard({ card, onClick }) {
    if (!card) return null;

    const {
        id,
        label,
        raw,
        unit,
        normalized, // -1 to 1
        creditScore, // Reliability
        trendState // Specific to Technical
    } = card;

    // Trend Context -> Global Reason
    // Maps "Accelerating" etc to the italic text slot
    const reason = trendState || "Stable";

    return (
        <GlobalCard
            onClick={onClick}
            label={label}
            raw={raw}
            unit={unit}
            reason={reason}
            normalized={normalized}
            creditScore={creditScore}
            creditAllocation={card.creditAllocation}
            totalPageCredits={200}
        // Signal and Color are auto-derived by GlobalCard from normalized score
        // unless we want to override. GlobalCard logic > 0.2 is Bullish. Technical was > 0.3.
        // Using Global logic for consistency.
        />
    );
}
