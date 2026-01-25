import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";
import { getSentiment } from "@/features/dashboard/fundamentals/engine/sentiment";

/* ----------------------------------------
   Helpers
---------------------------------------- */
function collapseLabel(zone) {
  if (zone.startsWith("bull")) return "Bullish";
  if (zone.startsWith("bear")) return "Bearish";
  return "Neutral";
}

/* ----------------------------------------
   Fundamental Card (Adapter)
---------------------------------------- */
export default function FundamentalCard({ card, onClick }) {
  if (!card) return null;

  const {
    id,
    label,
    raw,
    unit,
    normalized,
    creditScore,
  } = card;

  // Sentiment Logic specific to Fundamentals
  const { zone, color } = getSentiment(normalized, id);
  const signal = collapseLabel(zone);

  // Mock "Reason" logic
  let reason = "In line with avg";
  if (normalized > 0.5) reason = "Top Decile";
  else if (normalized > 0.2) reason = "Above 5Y Mean";
  else if (normalized < -0.5) reason = "Bottom Decile";
  else if (normalized < -0.2) reason = "Below 5Y Mean";

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
      totalPageCredits={300}
      signal={signal}
      color={color}
    />
  );
}
