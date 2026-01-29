import React from "react";
import Card from "@/shared/components/common/Card";
import { cn } from "@/lib/utils";
import { getReliabilityConfig, getSignalState } from "@/shared/global/logic/signals";

/* ----------------------------------
   GLOBAL CARD (Refactored to match TechnicalCard)
---------------------------------- */
export function GlobalCard({
    // Content Props
    label = "Metric Label",
    raw,          // The main number/text displayed
    unit,         // Unit next to raw value
    reason,       // Italic text (context)

    // Visual Props
    normalized = 0, // -1 to 1 range for bar
    score,          // 0-100 (alternative to normalized)
    creditScore = 0.8, // 0-1 (Reliability)
    creditAllocation,  // Integer credit score for this card

    // Overrides
    signal,       // Explicit signal text ("Bullish")
    color,        // Explicit color hex/class

    // Interaction
    onClick,
    className
}) {

    // --- 1. Reliability Logic (Global) ---
    const reliability = getReliabilityConfig(creditScore);

    // --- 2. Color / Signal Logic (Global) ---
    const derivedScore = score !== undefined ? score : Math.round(((normalized + 1) / 2) * 100);
    const globalSignal = getSignalState(normalized); // Logic fallback

    let derivedColor = color || globalSignal.color;
    let derivedSignal = signal || globalSignal.label;

    // Fallback if specific styling overrides needed normalization logic
    // (Already handled by helper, but preserving prop overrides)

    return (
        <Card
            className={cn(
                "relative group transition-all duration-300 hover:border-border-hover h-[160px]",
                reliability.label === 'Low' ? 'opacity-80 hover:opacity-100' : '',
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
                        {/* LEFT: Title & Value */}
                        <div className="flex-1 min-h-[56px] flex flex-col justify-center">
                            <div className="text-sm font-semibold text-text-primary line-clamp-2 pr-2 leading-tight">
                                {label}
                            </div>

                            {/* Value Block */}
                            {(raw !== undefined || unit || reason) && (
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-xs text-text-secondary font-mono">
                                        {typeof raw === 'number' ? raw.toFixed(2) : raw}
                                        {unit && <span className="text-[10px] text-text-tertiary ml-1">{unit}</span>}
                                    </span>
                                    {reason && (
                                        <span className="hidden md:block text-[9px] text-text-tertiary italic transform translate-y-px truncate max-w-[80px]">
                                            {reason}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Credit Score Badge */}
                        <div className="shrink-0 text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border border-[var(--border-hover)] bg-[var(--bg-card)] text-[var(--text-secondary)]">
                            {creditAllocation || '?'}
                        </div>
                    </div>

                    {/* BAR */}
                    <div className="h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden mb-2 mt-2 border border-[var(--border-main)]">
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${derivedScore}%`,
                                backgroundColor: derivedColor,
                            }}
                        />
                    </div>
                </div>

                {/* FOOTER: Signal & Score */}
                <div className="flex justify-between items-center text-xs mt-auto">
                    <div className="font-medium" style={{ color: derivedColor }}>{derivedSignal}</div>
                    <div className="text-[var(--text-muted)] font-mono">{derivedScore}/100</div>
                </div>
            </div>
        </Card>
    );
}

// Ensure no other exports exist to avoid confusion
