/**
 * @file CardSegmented.jsx
 * @purpose Premium segmented control switch.
 * @responsibilities
 * - Renders a horizontal list of toggleable options.
 * - Provides visual feedback for active/inactive states.
 * - Supports controlled input management.
 * @key_exports
 * - CardSegmented (Default)
 * @dependencies
 * - React
 * @lifecycle
 * - Used in Filters, View Toggles, and Settings.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from "react";

// =============================
// Component
// =============================

export default function CardSegmented({
  value,
  onChange,
  options = [],
  size = "sm",
}) {
  return (
    <div
      className="
        inline-flex
        rounded-xl
        bg-background-surface
        border border-border-default
        backdrop-blur
        p-1
      "
    >
      {options.map((opt) => {
        const active = value === opt.value;

        return (
          <button
            key={opt.value}
            onClick={() => onChange?.(opt.value)}
            className={`
              px-3
              ${size === "sm" ? "py-1 text-xs" : "py-2 text-sm"}
              rounded-lg
              transition-all
              ${active
                ? "bg-background-card text-text-primary shadow-sm ring-1 ring-border-default"
                : "text-text-tertiary hover:text-text-primary hover:bg-background-card/50"
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
