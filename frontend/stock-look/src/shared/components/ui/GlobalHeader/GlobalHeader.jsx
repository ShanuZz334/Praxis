import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, ArrowDown, HelpCircle, ArrowRight } from "lucide-react";
import CardSegmented from "@/shared/components/controls/CardSegmented";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";
import { getCompositeState, getSignalState } from "@/shared/global/logic/signals";
import { typography } from "@/shared/global/styles/typography";

/* --------------------------------------------------------------------------
   GLOBAL HEADER (The Master Header)
   Standardized layout for all intelligence pages (Fundamental, Technical, etc.)
-------------------------------------------------------------------------- */

const STYLES = {
    BORDER_OUTER: "border-white/15",       // 5% (Matches Card)
    BORDER_INNER: "border-white/15",  // 5% (Badges, Inputs, Hovers)
    DIVIDE: "divide-white/[0.05]",        // 2% (Grid Dividers)
    BORDER_DIVIDER: "border-white/[0.05]" // 2% (Section Separators)
};

export default function GlobalHeader({
    // Core Data
    title = "Composite Score",
    score = 0,
    prevScore = 0,

    // Context
    regime = { label: "Neutral", desc: "No clear dominance", confidence: 0, color: "text-slate-200" },
    integrity = { coverage: "100%", source: "Primary", freshness: "Realtime" },

    // Components
    sections = [], // [{ id, label, score, contribution, w }]
    tailwinds = [],
    risks = [],

    // Info / Manual
    infoContent = (
        <div className="w-80 p-4 bg-[#0b1220] border border-white/10 rounded-xl shadow-2xl">
            <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">System Composite</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
                The Stocky Composite Score aggregates real-time data from Technical (30%), Options (25%), Fundamental (20%), Global Macro (15%), and Events (10%) engines into a single directional signal.
            </p>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                <span>Click to read full manual</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
        </div>
    ),
    manualLink = "/dashboard/manual/dashboard",

    // Credit System
    totalCredits = 0, // Total credits for this page (e.g. 300)
    creditBreakdown = null, // { Technical: 500, Options: 120... }
    creditLabel = "Credits", // Customizable label (e.g. "News", "Stocks")
    cards = [],        // All cards to calculate signal counts
    enableBreakdown = false, // Toggle to show hover details (Dashboard only)

    // Controls
    controls = {
        search: "",
        onSearchChange: () => { },
        viewMode: "sectioned",
        onViewChange: () => { },
        sortMode: "score_desc",
        onSortChange: () => { },
        matchCount: 0
    }
}) {
    const navigate = useNavigate();

    // 1. Composite Logic
    const compositeState = getCompositeState(score);

    // 2. Delta Logic
    const deltaVal = (score - (prevScore || score)).toFixed(1);
    const deltaSign = deltaVal > 0 ? "+" : "";
    const deltaColor = deltaVal > 0 ? "text-emerald-400" : deltaVal < 0 ? "text-red-400" : "text-slate-400";

    // 3. Signal Counts (Bulls, Bears, Neutrals)
    const signalCounts = useMemo(() => {
        const counts = {
            bulls: 0, bears: 0, neutrals: 0,
            breakdown: { bulls: {}, bears: {}, neutrals: {} }
        };

        if (!cards || cards.length === 0) return counts;

        cards.forEach(card => {
            const mod = card.module || "Items";
            const state = getSignalState(card.normalized || 0);

            if (state.label === 'Bullish') {
                counts.bulls++;
                counts.breakdown.bulls[mod] = (counts.breakdown.bulls[mod] || 0) + 1;
            } else if (state.label === 'Bearish') {
                counts.bears++;
                counts.breakdown.bears[mod] = (counts.breakdown.bears[mod] || 0) + 1;
            } else {
                counts.neutrals++;
                counts.breakdown.neutrals[mod] = (counts.breakdown.neutrals[mod] || 0) + 1;
            }
        });

        return counts;
    }, [cards]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* MAIN BLOCK */}
            <div className={`relative rounded-2xl border ${STYLES.BORDER_OUTER} shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden bg-background-card`}>

                {/* TOP ROW: GAUGE | REGIME | INTEGRITY */}
                <div className={`grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x ${STYLES.DIVIDE} border-b ${STYLES.BORDER_DIVIDER} bg-background-surface min-h-[220px]`}>

                    {/* A. GAUGE */}
                    <div className="p-4 md:p-6 group relative flex flex-col md:block">
                        <div className="flex justify-between items-start mb-2">
                            <div className={`${typography.label.sm} flex items-center gap-2`}>
                                {title}
                                <PortalTooltip content={infoContent}>
                                    <button
                                        onClick={() => navigate(manualLink)}
                                        className="text-white/40 hover:text-blue-400 transition-colors cursor-pointer"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                    </button>
                                </PortalTooltip>
                            </div>

                            {/* Delta Pill */}
                            <div className={`flex items-center gap-1 ${deltaColor} bg-background-surface px-2 py-1 rounded text-[10px] font-mono border ${STYLES.BORDER_INNER}`}>
                                <span className="font-bold">{deltaSign}{deltaVal}%</span>
                                <span className="text-text-tertiary ml-1">vs prev</span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center md:items-baseline gap-1 md:gap-3 mb-4 text-center md:text-left">
                            <div className={`${typography.number.giant} md:text-6xl text-7xl`}>{score.toFixed(0)}</div>
                            <div className="flex flex-col justify-end h-full py-1">
                                <div className={`text-lg font-bold ${compositeState.className} transition-colors duration-500`}>
                                    {compositeState.label}
                                </div>
                                <div className="text-[10px] text-text-tertiary font-mono">/ 100.00</div>
                            </div>
                        </div>

                        {/* Sections Bar (Divergence Chart) - Hidden on Mobile */}
                        <div className="hidden md:block">
                            <SectionBar sections={sections} />
                        </div>
                    </div>

                    {/* B. REGIME */}
                    <div className="hidden md:flex p-6 flex-col justify-center">
                        <div className={`${typography.label.sm} mb-3`}>Market Regime</div>
                        <div className="mb-4">
                            <div className="flex items-center gap-3 mb-1">
                                <div className={`text-2xl font-bold ${regime.color || "text-white"}`}>{regime.label}</div>
                                <div className="text-xs px-1.5 py-0.5 rounded bg-background-surface text-text-secondary font-mono">
                                    {regime.confidence}% Conf
                                </div>
                            </div>
                            <div className="text-xs text-text-tertiary">{regime.desc}</div>
                        </div>
                        {/* Simple Linear Scale */}
                        <div className="relative h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-80">
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-background-app rounded-full shadow-lg transition-all duration-1000"
                                style={{ left: `${Math.max(5, Math.min(95, score))}%` }}
                            />
                        </div>
                    </div>

                    {/* C. INTEGRITY */}
                    <div className="p-6 flex flex-col justify-between gap-2">
                        <div className={typography.label.sm}>Signal Integrity</div>

                        {/* TOP SECTION: Signal Status */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm text-text-primary">Monitor Active</span>
                                </div>
                                <div className="text-xs font-mono text-text-secondary">{integrity.freshness}</div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-text-secondary">
                                    <span>Coverage</span>
                                    <span>{integrity.coverage}</span>
                                </div>
                                <div className="h-1.5 bg-background-surface rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-full rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM SECTION: Credit Distribution (Larger Values) */}
                        {totalCredits > 0 && (
                            <div className={`grid grid-cols-4 gap-3 pt-4 border-t ${STYLES.BORDER_DIVIDER}`}>
                                <StatBlock
                                    label={creditLabel}
                                    value={totalCredits}
                                    color="text-white/90"
                                    breakdown={enableBreakdown ? creditBreakdown : null}
                                />
                                <StatBlock
                                    label="Bulls"
                                    value={signalCounts.bulls}
                                    color="text-emerald-400"
                                    breakdown={enableBreakdown ? signalCounts.breakdown.bulls : null}
                                />
                                <StatBlock
                                    label="Bears"
                                    value={signalCounts.bears}
                                    color="text-red-400"
                                    breakdown={enableBreakdown ? signalCounts.breakdown.bears : null}
                                />
                                <StatBlock
                                    label="Neutral"
                                    value={signalCounts.neutrals}
                                    color="text-yellow-400"
                                    breakdown={enableBreakdown ? signalCounts.breakdown.neutrals : null}
                                />
                            </div>
                        )}
                    </div>


                </div>

                {/* MIDDLE ROW: TAILWINDS & RISKS */}
                <div className={`hidden md:grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x ${STYLES.DIVIDE} border-t ${STYLES.BORDER_DIVIDER}`}>
                    <ImpactList title="Top Tailwinds" items={tailwinds} type="bull" />
                    <ImpactList title="Key Risks" items={risks} type="bear" />
                </div>

                {/* BOTTOM ROW: CONTROLS (Integrated) */}
                {controls && <HeaderControls controls={controls} />}

            </div>
        </div>
    );
}

/* --------------------------------------------------------------------------
   SUB-COMPONENTS (Internal)
-------------------------------------------------------------------------- */

// Helper for Stat Tooltip
function StatBlock({ label, value, color, breakdown }) {
    const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;

    const Content = (
        <div className="text-center group/stat cursor-default">
            <div className="text-[9px] text-white/40 uppercase mb-1.5 tracking-wide group-hover/stat:text-white/60 transition-colors">{label}</div>
            <div className={`text-lg font-bold ${color} font-mono group-hover/stat:scale-105 transition-transform`}>{value}</div>
        </div>
    );

    if (!hasBreakdown) return Content;

    return (
        <PortalTooltip
            content={
                <div className="w-48 bg-[#0b1220] border border-white/10 rounded-lg shadow-xl p-3">
                    <div className="text-[10px] font-bold text-white/50 uppercase border-b border-white/5 pb-1 mb-2 tracking-wider">
                        {label} Breakdown
                    </div>
                    <div className="space-y-1.5">
                        {Object.entries(breakdown).map(([mod, count]) => (
                            <div key={mod} className="flex justify-between items-center text-xs">
                                <span className="text-white/70">{mod}</span>
                                <span className={`font-mono font-bold ${color}`}>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            }
        >
            {Content}
        </PortalTooltip>
    );
}

function SectionBar({ sections }) {
    if (!sections || !sections.length) return null;

    return (
        <div className={`grid grid-cols-5 md:grid-cols-8 gap-1 h-24 mt-6 border-t ${STYLES.BORDER_DIVIDER} pt-3`}>
            {sections.map(s => {
                const heightPct = Math.min(100, Math.abs(s.normalizedScore || 0)); // Simplified for visual
                const isPos = (s.rawScore || 0) > 0; // Assuming rawScore determines direction? Or normalize?
                // Fallback logic purely visual for now
                const barColor = isPos ? "bg-emerald-500" : "bg-red-500";

                return (
                    <div key={s.id} className="relative flex flex-col items-center justify-end h-full group">
                        <div className={`w-2 rounded-full bg-background-surface h-full relative overflow-hidden border ${STYLES.BORDER_INNER}`}>
                            <div
                                className={`absolute bottom-0 w-full ${barColor} transition-all duration-500`}
                                style={{ height: `${heightPct}%` }}
                            />
                        </div>
                        <div className="mt-2 text-[9px] uppercase font-bold text-text-tertiary">{s.label}</div>
                    </div>
                );
            })}
        </div>
    );
}

function ImpactList({ title, items, type }) {
    const isBull = type === 'bull';
    const colorClass = isBull ? "text-green-500" : "text-red-500";
    const bgClass = isBull ? "bg-state-bullish-surface" : "bg-state-bearish-surface";
    const badgeText = isBull ? "BULLISH DRIVERS" : "BEARISH DRIVERS";
    const valColor = isBull ? "text-green-400" : "text-red-400";

    return (
        <div className={`p-5 ${bgClass} h-[240px] flex flex-col`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`${colorClass} text-xs font-bold uppercase tracking-wider`}>{title}</span>
                    <span className={`text-[10px] text-text-tertiary px-1 border ${STYLES.BORDER_INNER} rounded`}>{badgeText}</span>
                </div>
            </div>
            <div className="space-y-2">
                {items.length > 0 ? items.map((item, i) => (
                    <div key={item.id || i} className={`flex items-center justify-between p-2 rounded hover:bg-background-surface transition-colors border border-transparent hover:${STYLES.BORDER_INNER}`}>
                        <div>
                            <div className="text-sm text-text-primary font-medium leading-none mb-1">{item.label}</div>
                            <div className="text-[10px] text-text-tertiary">{item.sub || "High Impact"}</div>
                        </div>
                        <div className={`text-xs font-bold ${valColor} font-mono`}>
                            {type === 'bull' ? '+' : ''}{item.value}%
                        </div>
                    </div>
                )) : (
                    <div className="text-xs text-white/40 italic">No significant items</div>
                )}
            </div>
        </div>
    );
}

function HeaderControls({ controls }) {
    return (
        <div className={`flex flex-col md:flex-row justify-between items-center border-t ${STYLES.BORDER_DIVIDER} pt-4 p-4 text-text-primary bg-background-card`}>
            {/* LEFT: Search */}
            <div className="relative group w-full md:w-64 transition-all focus-within:md:w-80 mb-4 md:mb-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                    type="text"
                    value={controls.search}
                    onChange={(e) => controls.onSearchChange(e.target.value)}
                    placeholder="Filter metrics..."
                    className={`w-full pl-9 pr-4 py-2 bg-background-app border ${STYLES.BORDER_INNER} rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner`}
                />
            </div>

            {/* RIGHT: Toggles (Hidden on Mobile) */}
            <div className="hidden md:flex gap-4">
                {/* View Mode Toggle */}
                {controls.onViewChange && (
                    <CardSegmented
                        value={controls.viewMode}
                        onChange={controls.onViewChange}
                        options={[
                            { value: "sectioned", label: "Sections" },
                            { value: "flat", label: "Flat View" },
                        ]}
                    />
                )}

                {/* Sort Mode Toggle */}
                {controls.onSortChange && (
                    <CardSegmented
                        value={controls.sortMode}
                        onChange={controls.onSortChange}
                        options={controls.sortOptions || [
                            { value: "score_desc", label: "Strongest" },
                            { value: "score_asc", label: "Weakest" },
                            { value: "rel_desc", label: "High Credit" },
                            { value: "rel_asc", label: "Low Credit" },
                        ]}
                    />
                )}
            </div>
        </div>
    );
}
