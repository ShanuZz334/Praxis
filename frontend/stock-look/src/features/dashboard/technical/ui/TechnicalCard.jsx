/**
 * @file TechnicalCard.jsx
 * @purpose Renders a single technical indicator card using GlobalCard.
 * @responsibilities
 * - Adapts technical data format to GlobalCard props.
 * - Displays trend context (reason) and reliability.
 * @key_exports
 * - TechnicalCard (Default)
 * @dependencies
 * - GlobalCard
 * @lifecycle
 * - Rendered by TechnicalGrid.
 * @date 2026-02-03
 */

import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";

// =============================
// Component
// =============================

export default function TechnicalCard({ card, onClick }) {
    if (!card) return null;

    const {
        id,
        label,
        raw,
        unit,
        normalized,
        creditScore,
        trendState,
        multiplier,
        isFocused
    } = card;

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
            multiplier={multiplier}
            isFocused={isFocused}
        />
    );
}
