import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { SECTION_WEIGHTS } from "../engine/sections.config";

export default function SectionBreakdownModal({ open, onClose, sections }) {
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

    // Convert sections object to array of { name, score, weight }
    const breakdown = Object.keys(SECTION_WEIGHTS).map((key) => {
        // Score is -1 to 1. Convert to 0-100
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
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* MODAL */}
            <div className="relative w-full max-w-2xl bg-[#0b1220] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white">Fundamental Score Breakdown</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 text-xs uppercase tracking-wide text-white/40 pb-2 border-b border-white/10 mb-2">
                        <div className="col-span-4">Category</div>
                        <div className="col-span-2 text-right">Weight</div>
                        <div className="col-span-2 text-right">Score</div>
                        <div className="col-span-4 pl-4">Contribution</div>
                    </div>

                    <div className="space-y-1">
                        {breakdown.map((item) => (
                            <div key={item.name} className="grid grid-cols-12 items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 -mx-2 rounded transition group">
                                {/* Name */}
                                <div className="col-span-4">
                                    <div className="font-medium text-white/90 group-hover:text-blue-400 transition">{item.name}</div>
                                    <div className="text-[10px] text-white/40">{item.description}</div>
                                </div>

                                {/* Weight */}
                                <div className="col-span-2 text-right font-mono text-white/60">
                                    {item.weight}%
                                </div>

                                {/* Score */}
                                <div className="col-span-2 text-right font-bold" style={{ color: getScoreColor(item.score) }}>
                                    {item.score}
                                </div>

                                {/* Bar */}
                                <div className="col-span-4 pl-4">
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden w-full">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
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

                    <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200/80 leading-relaxed">
                        The Final Fundamental Score is a weighted average of these section scores.
                        Each section score is derived from the reliability-weighted performance of its underlying metrics.
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
}

function getScoreColor(score) {
    if (score >= 70) return "#22c55e"; // Success
    if (score >= 40) return "#eab308"; // Warning
    return "#ef4444"; // Danger
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
