import React from "react";
import Card from "@/shared/components/common/Card";
import { cn } from "@/lib/utils";
import { getReliabilityConfig, getSignalState } from "@/shared/global/logic/signals";

export function GlobalCard({
  label = "Metric Label",
  raw,
  unit,
  reason,

  normalized = 0,
  score,
  creditScore = 0.8,
  creditAllocation,

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
        "relative group h-[160px]",

        /* Light mode hover (unchanged) */
        "hover:border-border-hover",

        /* Dark mode FIX — stop thick borders */
        "dark:hover:border-border-subtle-translucent",

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
            <div className="flex-1 min-h-[56px] flex flex-col justify-center">
              <div className="text-sm font-semibold text-text-primary line-clamp-2 pr-2 leading-tight">
                {label}
              </div>

              {(raw !== undefined || unit || reason) && (
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xs text-text-secondary font-mono">
                    {typeof raw === "number" ? raw.toFixed(2) : raw}
                    {unit && (
                      <span className="text-[10px] text-text-tertiary ml-1">
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

            {/* RIGHT: Credit */}
            <div className="shrink-0 text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border border-border-subtle bg-background-surface text-text-secondary">
              {creditAllocation || "?"}
            </div>
          </div>

          {/* BAR */}
          <div className="h-1.5 bg-background-surface rounded-full overflow-hidden mb-2 mt-2 border border-border-subtle">
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
        <div className="flex justify-between items-center text-xs mt-auto">
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
