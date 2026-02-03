/**
 * @file EmptyState.jsx
 * @purpose Renders a placeholder state when no data is available.
 * @responsibilities
 * - Displays a pulsing loading text or message.
 * @key_exports
 * - EmptyState (Default Component)
 * @lifecycle
 * - Rendered by FundamentalPage/Grid.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";

// =============================
// Main Component
// =============================
export default function EmptyState({ label = "Loading fundamentals…" }) {
  return (
    <div className="w-full py-24 flex items-center justify-center">
      <span className="text-sm text-white/50 animate-pulse">
        {label}
      </span>
    </div>
  );
}
