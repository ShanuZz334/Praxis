/**
 * @file FundamentalCard.jsx
 * @purpose Adapter component to render a Fundamental Indicator using `GlobalCard`.
 * @responsibilities
 * - Maps fundamental-specific data (normalized scores, credit allocations) to `GlobalCard` props.
 * - Handles sentiment color mapping.
 * - Generates "Reason" labels based on z-scores.
 * @key_exports
 * - FundamentalCard (Default Component)
 * @dependencies
 * - GlobalCard: Shared reusable card.
 * - sentiment.js: For color/zone logic.
 * @lifecycle
 * - Rendered by FundamentalGrid.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";
import { getSentiment } from "@/features/dashboard/fundamentals/engine/sentiment";

// =============================
// Helpers
// =============================
function collapseLabel(zone) {
  if (zone.startsWith("bull")) return "Bullish";
  if (zone.startsWith("bear")) return "Bearish";
  return "Neutral";
}

function getReasonLabel(normalized) {
  if (normalized > 0.5) return "Top Decile";
  if (normalized > 0.2) return "Above 5Y Mean";
  if (normalized < -0.5) return "Bottom Decile";
  if (normalized < -0.2) return "Below 5Y Mean";
  return "In line with avg";
}

// =============================
// Main Component
// =============================
export default function FundamentalCard({ card, onClick }) {
  if (!card) return null;

  const {
    label,
    raw,
    unit,
    normalized,
    creditScore,
    creditAllocation,
    id
  } = card;

  // derived props
  const { zone, color } = getSentiment(normalized);
  const signal = collapseLabel(zone);
  const reason = getReasonLabel(normalized);

  return (
    <GlobalCard
      onClick={onClick}
      label={label}
      raw={raw}
      unit={unit}
      reason={reason}
      normalized={normalized}
      creditScore={creditScore}
      creditAllocation={creditAllocation}
      totalPageCredits={300}
      signal={signal}
      color={color}
    />
  );
}
