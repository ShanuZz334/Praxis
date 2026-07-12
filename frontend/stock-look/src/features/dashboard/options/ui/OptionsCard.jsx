/**
 * @file OptionsCard.jsx
 * @purpose Wrapper component for displaying Option intelligence cards.
 * @responsibilities
 * - Adapts the common `GlobalCard` for options-specific data.
 * - Maps dashboard metrics (e.g., PCR, Max Pain, Net Delta) to visual cards.
 * - Handles user interaction for drill-down.
 * @key_exports
 * - OptionsCard (Default Component)
 * @dependencies
 * - GlobalCard: Shared UI component.
 * - optionsSimulator: For credit allocation constants.
 * @lifecycle
 * - Rendered by OptionsGrid.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard/GlobalCard";

const TOTAL_OPTIONS_CREDITS = 1000;

// =============================
// Main Component
// =============================
export default function OptionsCard({ card, onClick }) {
    if (!card) return null;

    return (
        <GlobalCard
            // Content Mapping
            label={card.label}
            raw={card.value}
            unit={card.unit}
            reason={card.interpretation}

            // Visual Metrics
            normalized={card.normalized}
            creditAllocation={card.creditAllocation || 10}
            totalPageCredits={TOTAL_OPTIONS_CREDITS}
            multiplier={card.multiplier}
            isFocused={card.isFocused}

            // Trend Indicator (Optional)
            trend={card.change}

            // Interaction
            onClick={onClick}
        />
    );
}
