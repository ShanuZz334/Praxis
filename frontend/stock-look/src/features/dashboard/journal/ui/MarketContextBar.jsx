/**
 * @file MarketContextBar.jsx
 * @purpose Renders specific market context data (Regime, Volatility, etc.).
 * @responsibilities
 * - Displays the current date in a stylized format.
 * - Shows key environmental metrics (Regime, Options Flow, Global Risk).
 * @key_exports
 * - MarketContextBar (Default Component)
 * @dependencies
 * - None
 * @lifecycle
 * - Rendered by JournalPage.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";

// =============================
// Helper Components
// =============================

function ContextItem({ label, value, color }) {
    return (
        <div className="flex items-center gap-2 bg-background-card border border-border-default pl-2 pr-1 py-1 rounded-lg shadow-sm">
            <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-wide">{label}</span>
            <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-background-surface border border-border-default ${color}`}>
                {value}
            </div>
        </div>
    );
}

// =============================
// Main Component
// =============================

export default function MarketContextBar({ context }) {
    if (!context) return null;

    return (
        <div className="w-full flex items-center justify-between py-2.5 text-xs select-none animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">

            {/* DATE */}
            <div className="flex items-center gap-2">
                <div className="h-1 w-1 bg-text-tertiary rounded-full" />
                <div className="font-mono text-text-tertiary uppercase tracking-widest text-[10px] font-bold">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
                </div>
            </div>

            {/* CONTEXT METRICS */}
            <div className="hidden md:flex items-center gap-4">
                <ContextItem label="Market Regime" value={context.regime} color="text-text-secondary" />
                <ContextItem label="Options Flow" value={context.optionsRegime} color="text-blue-400" />
                <ContextItem label="Global Risk" value={context.globalRisk} color="text-emerald-400" />
                <ContextItem label="Vol Bias" value={context.volBias} color="text-amber-400" />
            </div>

        </div>
    );
}
