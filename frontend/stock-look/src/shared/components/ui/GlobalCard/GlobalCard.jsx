/**
 * @file GlobalCard.jsx
 * @purpose Generic dashboard metric card with embedded signal logic.
 * @responsibilities
 * - Displays key metrics with visual credit/confidence indicators.
 * - Handles reliability dimming based on credit score.
 * - Visualizes progress bars and trend signals (Bullish/Bearish).
 * - Adapts to Light/Dark modes with specific border treatments.
 * @key_exports
 * - GlobalCard (Default)
 * @dependencies
 * - Card (Wrapper)
 * - getReliabilityConfig, getSignalState (Logic)
 * - cn (Utils)
 * @lifecycle
 * - Rendered by Fundamental/Technical grids to show specific data points.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from "react";
import Card from "@/shared/components/common/Card";
import { cn } from "@/lib/utils";
import { getReliabilityConfig, getSignalState } from "@/shared/global/logic/signals";

// =============================
// Component
// =============================

export function GlobalCard({
  label = "Metric Label",
  raw,
  unit,
  reason,

  normalized = 0,
  score,
  creditScore = 0.8,
  creditAllocation,
  multiplier = 1,
  isFocused = false,

  signal,
  color,

  onClick,
  className
}) {
  /* ------------------------------
     Reliability
  ------------------------------ */
  const reliability = getReliabilityConfig(creditScore);

  /* ------------------------------
     Signal Logic
  ------------------------------ */
  const derivedScore =
    score !== undefined
      ? score
      : Math.round(((normalized + 1) / 2) * 100);

  const globalSignal = getSignalState(normalized);

  const derivedColor = color || globalSignal.color;
  const derivedSignal = signal || globalSignal.label;

  return (
    <Card
      className={cn(
        "relative group h-[140px] md:h-[160px] transition-all duration-300",

        /* Light mode hover (unchanged) */
        "hover:border-border-hover",

        /* Dark mode FIX — stop thick borders */
        "dark:hover:border-border-subtle-translucent",

        /* FOCUS STYLE: For mode-aware emphasis */
        isFocused && "border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.2)] dark:border-blue-400/40 dark:shadow-[0_0_15px_rgba(59,130,246,0.15)]",

        /* Reliability dim */
        reliability.label === "Low" && "opacity-80 hover:opacity-100",

        className
      )}
    >
      <div
        onClick={onClick}
        className={cn(
          "h-full flex flex-col justify-between",
          onClick && "cursor-pointer"
        )}
      >
        {/* HEADER */}
        <div>
          <div className="flex items-start justify-between mb-2">
            {/* LEFT */}
            <div className="flex-1 min-h-[48px] md:min-h-[56px] flex flex-col justify-center">
              <div className="text-xs md:text-sm font-semibold text-text-primary line-clamp-2 pr-1 md:pr-2 leading-tight">
                {label}
              </div>

              {(raw !== undefined || unit || reason) && (
                <div className="flex items-baseline gap-1.5 md:gap-2 mt-0.5 md:mt-1">
                  <span className="text-[10px] md:text-xs text-text-secondary font-mono">
                    {typeof raw === "number" ? raw.toFixed(2) : raw}
                    {unit && (
                      <span className="text-[9px] md:text-[10px] text-text-tertiary ml-0.5 md:ml-1">
                        {unit}
                      </span>
                    )}
                  </span>

                  {reason && (
                    <span className="hidden md:block text-[9px] text-text-tertiary italic truncate max-w-[90px]">
                      {reason}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: Credit & Multiplier */}
            <div className="flex flex-col items-end gap-1">
              <div className="shrink-0 text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border border-border-default bg-background-elevated text-text-primary shadow-sm">
                {creditAllocation || "?"}
              </div>
              {multiplier !== 1 && (
                <div className={cn(
                  "text-[9px] font-bold px-1 rounded flex items-center gap-0.5",
                  multiplier > 1 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
                )}>
                  {multiplier > 1 ? "↑" : "↓"}
                  x{multiplier.toFixed(1)}
                </div>
              )}
            </div>
          </div>

          {/* BAR */}
          <div className="h-1 md:h-1.5 bg-background-surface rounded-full overflow-hidden mb-1.5 md:mb-2 mt-1.5 md:mt-2 border border-border-subtle">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${derivedScore}%`,
                backgroundColor: derivedColor,
              }}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center text-[10px] md:text-xs mt-auto">
          <div className="font-medium" style={{ color: derivedColor }}>
            {derivedSignal}
          </div>
          <div className="text-text-tertiary font-mono">
            {derivedScore}/100
          </div>
        </div>
      </div>
    </Card>
  );
}
