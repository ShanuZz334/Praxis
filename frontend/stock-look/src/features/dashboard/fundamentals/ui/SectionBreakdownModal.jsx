/**
 * @file SectionBreakdownModal.jsx
 * @purpose Displays a detailed breakdown of Fundamental Sections (Valuation, Macro, etc.).
 * @responsibilities
 * - Renders a modal with a breakdown table.
 * - Shows calculated scores, weights, and contributions.
 * @key_exports
 * - SectionBreakdownModal (Default Component)
 * @dependencies
 * - sections.config.js (for weights)
 * @lifecycle
 * - Rendered by FundamentalPage (optional drill-down).
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { SECTION_WEIGHTS } from "../engine/sections.config";

// =============================
// Helpers
// =============================
function getScoreColor(score) {
    if (score >= 70) return "#059669"; // Emerald 600
    if (score >= 40) return "#d97706"; // Amber 600
    return "#dc2626"; // Red 600
}

function getSectionDescription(key) {
    const map = {
        Valuation: "Price vs Earnings, Book, Sales",
        Earnings: "Growth, revisions & quality",
        Macro: "GDP, Rates, Inflation context",
        Liquidity: "DII/FII flows & market depth",
        Sector: "Relative strength & rotation",
        Corporate: "Governance, dividends & buybacks",
        Global: "US/EU market correlation",
        Risk: "VIX, spreads & volatility"
    };
    return map[key] || "General metrics";
}

// =============================
// Main Component
// =============================
export default function SectionBreakdownModal({ open, onClose, sections }) {

    // Scroll Lock
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open || !sections) return null;

    // Logic: Flatten Data
    const breakdown = Object.keys(SECTION_WEIGHTS).map((key) => {
        const rawScore = sections[key] || 0;
        const scorePct = Math.round(((rawScore + 1) / 2) * 100);

        return {
            name: key,
            score: scorePct,
            weight: SECTION_WEIGHTS[key] * 100,
            description: getSectionDescription(key),
        };
    });

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* BACKDROP */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* MODAL */}
            <div className="relative w-full max-w-2xl bg-background-card/85 border border-border-default backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-transparent">
                    <h2 className="text-xl font-bold text-text-primary">Fundamental Score Breakdown</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-background-elevated text-text-tertiary hover:text-text-primary hover:bg-background-subtle transition border border-border-subtle"
                    >
                        ✕
                    </button>
                </div>

                {/* CONTENT */}
                <div className="p-6">
                    {/* TABLE HEADER */}
                    <div className="grid grid-cols-12 text-xs uppercase tracking-widest font-bold text-text-tertiary pb-2 border-b border-border-default mb-2">
                        <div className="col-span-4">Category</div>
                        <div className="col-span-2 text-right">Weight</div>
                        <div className="col-span-2 text-right">Score</div>
                        <div className="col-span-4 pl-4">Contribution</div>
                    </div>

                    {/* ROWS */}
                    <div className="space-y-1">
                        {breakdown.map((item) => (
                            <div key={item.name} className="grid grid-cols-12 items-center py-3 border-b border-border-subtle last:border-0 hover:bg-background-subtle px-2 -mx-2 rounded transition group">
                                {/* Name */}
                                <div className="col-span-4">
                                    <div className="font-bold text-text-primary group-hover:text-accent-primary transition">{item.name}</div>
                                    <div className="text-[10px] text-text-tertiary opacity-70 uppercase tracking-tighter">{item.description}</div>
                                </div>

                                {/* Weight */}
                                <div className="col-span-2 text-right font-mono text-text-secondary">
                                    {item.weight}%
                                </div>

                                {/* Score */}
                                <div className="col-span-2 text-right font-black" style={{ color: getScoreColor(item.score) }}>
                                    {item.score}
                                </div>

                                {/* Bar */}
                                <div className="col-span-4 pl-4">
                                    <div className="h-1.5 bg-background-subtle rounded-full overflow-hidden w-full border border-border-subtle">
                                        <div
                                            className="h-full rounded-full transition-all duration-500 shadow-sm"
                                            style={{
                                                width: `${item.score}%`,
                                                backgroundColor: getScoreColor(item.score)
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 rounded-xl bg-background-elevated/50 border border-border-subtle text-xs text-text-tertiary leading-relaxed italic">
                        The Final Fundamental Score is a weighted average of these section scores.
                        Each section score is derived from the reliability-weighted performance of its underlying metrics.
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
}
