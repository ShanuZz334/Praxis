/**
 * @file GlobalHeader.jsx
 * @purpose The Master Header for intelligence pages (Dashboard, Fundamental, Technical).
 * @responsibilities
 * - Displays the primary composite score and market regime.
 * - Visualizes tailwinds, risks, and signal integrity.
 * - Provides global controls for filtering, sorting, and view modes.
 * - Aggregates sub-signals into a unified dashboard view.
 * @key_exports
 * - GlobalHeader (Default)
 * @dependencies
 * - CardSegmented, PortalTooltip
 * - Signal Logic (getCompositeState, getSignalState)
 * - Lucide Icons
 * @lifecycle
 * - Top-level component for primary feature pages.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, ArrowDown, HelpCircle, ArrowRight } from "lucide-react";
import { FlipContainer, FlipTrigger } from "@/shared/components/common/FlipContainer";

import AiInsightSection from "@/shared/components/ui/AiInsightSection";
import CardSegmented from "@/shared/components/controls/CardSegmented";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";
import { getCompositeState, getSignalState } from "@/shared/global/logic/signals";
import { typography } from "@/shared/global/styles/typography";
import { getCompositeColor, getIndicatorColor } from "@/shared/config/scoreColors";

// =============================
// Constants
// =============================

const STYLES = {
    BORDER_OUTER: "border-[var(--border-default)]",
    BORDER_INNER: "border-[var(--border-subtle)]",
    DIVIDE: "divide-[var(--border-subtle)]",
    BORDER_DIVIDER: "border-[var(--border-subtle)]"
};

// =============================
// Component
// =============================

export default function GlobalHeader({
    // Core Data
    title = "Composite Score",
    score = 0,
    prevScore = 0,
    scoreModifier = 0,

    // Context
    gauge = null, // Custom gauge object { label, color, meaning }
    regime = { label: "Neutral", desc: "No clear dominance", confidence: 0, color: "text-text-secondary" },
    integrity = { coverage: "100%", source: "Primary", freshness: "Realtime" },

    // Components
    sections = [], // [{ id, label, score, contribution, w }]
    tailwinds = [],
    risks = [],

    // Info / Manual
    infoContent = (
        <div className="w-80">
            <div className="flex items-center gap-2 mb-2 border-b border-border-default pb-2">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">System Composite</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
                The Stocky Composite Score aggregates real-time data from Technical (30%), Options (25%), Fundamental (20%), Global Macro (15%), and Events (10%) engines into a single directional signal.
            </p>
            <div className="mt-3 pt-2 border-t border-border-default flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                <span>Click to read full manual</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
        </div>
    ),
    manualLink = "/dashboard/manual/dashboard",

    // Credit System
    totalCredits = 0, // Total credits for this page (e.g. 300)
    creditBreakdown = null, // { Technical: 500, Options: 120... }
    creditLabel = "R Credits", // Customizable label (e.g. "R Credits", "Stocks")
    cards = [],        // All cards to calculate signal counts
    enableBreakdown = false, // Toggle to show hover details (Dashboard only)
    enableActionPulse = false, // If true, shows the Trading Action Pulse indicator (Dashboard only)
    syncId = null, // { instrumentKey, category } for DB auto-sync

    // Controls
    controls = {
        search: "",
        onSearchChange: null,
        viewMode: "sectioned",
        onViewChange: null,
        sortMode: "score_desc",
        onSortChange: null,
        matchCount: 0
    },
    
    // Master Payload for AI (Only used in Master Dashboard)
    masterPayload = null,
    
    // Custom Backside
    customBackContent = null
}) {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFlipped, setIsFlipped] = useState(false);
    const [lastFullCoverageTime, setLastFullCoverageTime] = useState(null);

    useEffect(() => {
        if (integrity?.coveragePercent === 100) {
            setLastFullCoverageTime(Date.now());
        }
    }, [integrity?.coveragePercent]);

    const formatFullTime = (ts) => {
        if (!ts) return null;
        return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const displayFreshness = integrity?.coveragePercent === 100
        ? integrity?.freshness
        : (lastFullCoverageTime ? `Last Full Sync: ${formatFullTime(lastFullCoverageTime)}` : "Syncing...");

    // 1. Composite Logic
    const compositeState = getCompositeState(score);

    // 2. Delta Logic — only computed when a real previous score exists
    const scoreNum = Number(score || 0);
    const hasPrevScore = prevScore !== null && prevScore !== undefined;
    const prevScoreNum = hasPrevScore ? Number(prevScore) : scoreNum;
    const deltaRaw = scoreNum - prevScoreNum;
    const deltaVal = Math.abs(deltaRaw).toFixed(1);
    const deltaSign = deltaRaw > 0 ? "+" : deltaRaw < 0 ? "-" : "";
    const deltaColor = deltaRaw > 0 ? "text-emerald-600 dark:text-emerald-400" : deltaRaw < 0 ? "text-red-600 dark:text-red-400" : "text-text-tertiary";

    // 3. Signal Counts (Bulls, Bears, Neutrals)
    const signalCounts = useMemo(() => {
        const counts = {
            bulls: 0, bears: 0, neutrals: 0,
            breakdown: { bulls: {}, bears: {}, neutrals: {} }
        };

        if (!cards || cards.length === 0) return counts;

        cards.forEach(card => {
            const engineKey = card.engine ? `${card.engine}||` : '';
            const mod = `${engineKey}${card.module || "Items"}`;
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

    // DB Sync for Counts (used by MasterDashboard aggregator)
    useEffect(() => {
        if (syncId?.instrumentKey && syncId?.category && typeof window !== 'undefined') {
            import('@/shared/utils/axiosInstance').then(({ default: axiosInstance }) => {
                axiosInstance.post('/api/v1/snapshots/header', {
                    instrument_key: syncId.instrumentKey,
                    category: syncId.category,
                    counts_json: {
                        totalCredits,
                        bulls: signalCounts.bulls,
                        bears: signalCounts.bears,
                        neutrals: signalCounts.neutrals,
                        breakdown: signalCounts.breakdown
                    },
                    ...(masterPayload ? { tree_payload_json: masterPayload } : {})
                }).catch(err => console.error(`Failed to sync ${syncId.category} counts:`, err));
            });
        }
    }, [syncId?.instrumentKey, syncId?.category, totalCredits, signalCounts]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <FlipContainer
                isFlipped={isFlipped}
                className="w-full h-full"
                front={
                    <div className="relative md:rounded-2xl md:border md:border-[var(--border-default)] md:dark:border-[var(--border-default)] md:shadow-[0_8px_24px_rgba(0,0,0,0.45)] md:overflow-visible md:bg-background-card flex flex-col md:block">
                        {/* FLIP BUTTON FRONT */}
                        <div className="absolute top-3 right-1 md:top-3 md:right-1 z-20">
                            <FlipTrigger 
                                onClick={() => setIsFlipped(true)} 
                            />
                        </div>

                {/* TOP ROW: GAUGE | REGIME | INTEGRITY */}
                <div 
                    className="flex flex-col lg:grid lg:grid-cols-3 md:divide-y-0 bg-transparent min-h-0 lg:min-h-[220px] gap-3 md:gap-0 lg:border-b lg:border-border-subtle"
                >

                    {/* A. GAUGE */}
                    <div className="p-3 md:p-6 group relative flex flex-col md:block bg-background-card rounded-2xl border border-border-default shadow-md md:bg-transparent md:border-0 md:shadow-none md:rounded-none lg:border-r lg:border-border-subtle">
                        <div className="flex justify-between items-start mb-2 gap-2">
                            <div className={`${typography.label.sm} flex items-center gap-2 min-w-0 text-[10px] md:text-[11px]`}>
                                <span className="truncate">{title}</span>
                            </div>

                            {/* Delta Pill — only shown when a real previous score exists for this instrument */}
                            {hasPrevScore && (
                                <div className={`flex items-center gap-1 ${deltaColor} bg-background-surface px-1.5 md:px-2 py-1 rounded text-[10px] font-mono border ${STYLES.BORDER_INNER} shrink-0`}>
                                    <span className="font-bold">{deltaSign}{deltaVal}%</span>
                                    <span className="hidden sm:inline opacity-70 ml-1 italic lowercase">vs prev</span>
                                </div>
                            )}
                        </div>

                        {Array.isArray(sections) && sections.length > 0 ? (
                            <FundamentalGaugePanel score={score} regime={regime} sections={sections} scoreModifier={scoreModifier} />
                        ) : (
                            <>
                                <div className="flex flex-row items-center md:items-baseline gap-2 md:gap-3 mb-1 text-left">
                                    <div className={`${typography.number.giant} text-4xl md:text-6xl lg:text-7xl tracking-tighter font-mono`}>{Number(score || 0).toFixed(0)}</div>
                                    <div className="flex flex-col justify-end h-full pb-1">
                                        <div
                                            className={`text-sm md:text-lg font-bold transition-colors duration-500 uppercase tracking-wide`}
                                            style={{ color: gauge?.color || compositeState.color || 'var(--text-primary)' }}
                                        >
                                            {gauge ? gauge.label : compositeState.label}
                                        </div>
                                        <div className="text-[9px] md:text-[10px] text-text-tertiary font-mono tracking-widest opacity-60">/ 100.00</div>
                                    </div>
                                </div>

                                {/* Middle Metrics Row - Only for main dashboard */}
                                {title?.toUpperCase() === "STOCKY COMPOSITE" && (
                                    <div className="hidden md:flex items-center justify-between mt-0 mb-2 border border-border-default bg-background-surface/50 rounded-lg py-1 px-1.5 divide-x divide-border-default max-w-[280px]">
                                        <div className="flex items-center gap-1 px-1.5 first:pl-0 last:pr-0">
                                            <span className="text-text-secondary text-[9px] uppercase font-bold tracking-wider">Trend</span>
                                            <ArrowUp className="w-3 h-3 text-emerald-500" />
                                        </div>
                                        <div className="flex items-center gap-1 px-1.5 first:pl-0 last:pr-0">
                                            <span className="text-text-secondary text-[9px] uppercase font-bold tracking-wider">Momentum</span>
                                            <ArrowRight className="w-3 h-3 text-emerald-500" />
                                        </div>
                                        <div className="flex items-center gap-1 px-1.5 first:pl-0 last:pr-0">
                                            <span className="text-text-secondary text-[9px] uppercase font-bold tracking-wider">Risk</span>
                                            <span className="text-[9px] font-bold text-emerald-500">Low</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-1.5 first:pl-0 last:pr-0">
                                            <span className="text-text-secondary text-[9px] uppercase font-bold tracking-wider">Vol</span>
                                            <span className="text-[9px] font-bold text-amber-500">Med</span>
                                        </div>
                                    </div>
                                )}

                                {/* Mobile Regime Indicator */}
                                <div className="flex lg:hidden items-center gap-2 mt-2 mb-1 px-3 py-1.5 rounded-xl bg-background-surface/50 border border-border-subtle w-fit">
                                    <div className={`text-[11px] font-bold ${regime.color || 'text-text-primary'}`}>{regime.label}</div>
                                    <div className="w-1 h-1 rounded-full bg-text-tertiary opacity-30" />
                                    <div className="text-[10px] text-text-secondary font-mono">
                                        {Number(regime.confidence || 0).toFixed(0)}% Conf
                                    </div>
                                </div>

                                {/* Sections Bar (Divergence Chart) - Hidden on Mobile */}
                                <div className="hidden md:block">
                                    <SectionBar sections={sections} />
                                </div>
                            </>
                        )}
                    </div>

                    {/* B. AI INSIGHT (Replaces Regime) */}
                    <div className="hidden md:block p-0 relative">
                        <AiInsightSection 
                            actionType={regime.label} 
                            confidence={Number(regime.confidence || 0).toFixed(0)} 
                            score={score}
                            regime={regime}
                            bulls={signalCounts.bulls}
                            bears={signalCounts.bears}
                            neutrals={signalCounts.neutrals}
                            stockSymbol={syncId?.instrumentKey || null}
                            isIndex={syncId?.category === 'Indices' || false}
                            coveragePercent={integrity?.coveragePercent ?? 100}
                            cards={cards}
                            sections={sections}
                            masterPayload={masterPayload}
                        />
                    </div>


                    {/* C. INTEGRITY */}
                    <div 
                        className="p-3 md:p-6 flex flex-col justify-between gap-2 md:gap-2 bg-background-card rounded-2xl border border-border-default shadow-md md:bg-transparent md:border-0 md:shadow-none md:rounded-none lg:border-l lg:border-border-subtle"
                    >
                        <div className={`${typography.label.sm} uppercase text-[10px] md:text-[11px]`}>Signal Integrity</div>

                        {/* TOP SECTION: Signal Status */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm text-text-primary">Monitor Active</span>
                                </div>
                                <div className="text-xs font-mono text-text-secondary">{displayFreshness}</div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-text-secondary">
                                    <span>Coverage</span>
                                    <span>{integrity.coverageText || integrity.coverage}</span>
                                </div>
                                <div className="h-1.5 bg-background-surface/50 border border-border-subtle rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out" 
                                        style={{ width: `${integrity.coveragePercent ?? 100}%` }}
                                    />
                                </div>
                                {integrity.snapshotTime && (
                                    <div className="text-[10px] text-text-tertiary text-right mt-1 font-mono">
                                        {integrity.snapshotTime}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BOTTOM SECTION: Credit Distribution (Larger Values) */}
                        <div className={`grid ${integrity?.missingCards > 0 ? 'grid-cols-5' : 'grid-cols-4'} gap-2 md:gap-3 pt-3 md:pt-4 border-t ${STYLES.BORDER_DIVIDER}`}>
                            <StatBlock
                                label={creditLabel}
                                value={totalCredits}
                                color="text-text-primary"
                                breakdown={enableBreakdown ? creditBreakdown : null}
                            />
                            <StatBlock
                                label="Bulls"
                                value={signalCounts.bulls}
                                color="text-emerald-600 dark:text-emerald-400"
                                breakdown={enableBreakdown ? signalCounts.breakdown.bulls : null}
                            />
                            <StatBlock
                                label="Bears"
                                value={signalCounts.bears}
                                color="text-red-600 dark:text-red-400"
                                breakdown={enableBreakdown ? signalCounts.breakdown.bears : null}
                            />
                            <StatBlock
                                label="Neutral"
                                value={signalCounts.neutrals}
                                color="text-amber-500 dark:text-amber-400"
                                breakdown={enableBreakdown ? signalCounts.breakdown.neutrals : null}
                            />
                            {integrity?.missingCards > 0 && (
                                <StatBlock
                                    label="Pending"
                                    value={integrity.missingCards}
                                    color="text-slate-500 dark:text-slate-400"
                                    breakdown={enableBreakdown ? integrity.missingBreakdown : null}
                                />
                            )}
                        </div>
                    </div>


                </div>

                {/* MIDDLE ROW: TAILWINDS & RISKS */}
                <div className={`hidden md:grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x ${STYLES.DIVIDE}`}>
                    <ImpactList title="Top Tailwinds" items={tailwinds} type="bull" />
                    <ImpactList title="Key Risks" items={risks} type="bear" />
                </div>

                {/* BOTTOM ROW: CONTROLS (Integrated) */}
                {controls && (
                    <div className="hidden md:block bg-background-card rounded-2xl p-3 border border-border-default shadow-md md:bg-transparent md:border-0 md:shadow-none md:rounded-none md:p-0 md:border-t md:border-border-subtle mt-3 md:mt-0">
                        <HeaderControls controls={controls} />
                    </div>
                )}
            </div>
            }
            back={
                <div className="relative w-full h-full min-h-[300px] md:rounded-2xl md:border md:border-[var(--border-default)] md:shadow-[0_8px_24px_rgba(0,0,0,0.45)] md:overflow-hidden md:bg-background-card flex flex-col items-center justify-center">
                    <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
                        <FlipTrigger 
                            onClick={() => setIsFlipped(false)} 
                        />
                    </div>
                    <div className="w-full h-full p-0 md:p-0 overflow-hidden relative">
                        {customBackContent || (
                            <div className="w-full h-full p-4 md:p-6 overflow-y-auto custom-scrollbar">
                                {infoContent}
                            </div>
                        )}
                    </div>
                </div>
            }
        />
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
            <div className={`text-[8px] md:text-[9px] uppercase mb-1 md:mb-1.5 tracking-wide transition-colors ${color} opacity-70 group-hover/stat:opacity-100`}>{label}</div>
            <div className={`text-lg md:text-xl font-extrabold ${color} font-mono group-hover/stat:scale-105 transition-transform`}>{value}</div>
        </div>
    );

    if (!hasBreakdown) return Content;

    let isGrouped = false;
    const groupedBreakdown = {};
    if (hasBreakdown) {
        Object.entries(breakdown).forEach(([key, count]) => {
            if (key.includes('||')) {
                isGrouped = true;
                const [engine, mod] = key.split('||');
                if (!groupedBreakdown[engine]) groupedBreakdown[engine] = {};
                groupedBreakdown[engine][mod] = count;
            }
        });
    }

    if (isGrouped) {
        // Grouped render for Master Dashboard
        const totalItems = Object.values(groupedBreakdown).reduce((acc, items) => acc + Object.keys(items).length, 0);
        let colsClass = "columns-1";
        if (totalItems > 45) colsClass = "columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5";
        else if (totalItems > 24) colsClass = "columns-1 sm:columns-2 md:columns-3 lg:columns-4";
        else if (totalItems > 12) colsClass = "columns-1 sm:columns-2 md:columns-3";
        else if (totalItems > 6) colsClass = "columns-1 sm:columns-2";

        return (
            <PortalTooltip
                trigger="click"
                content={
                    <div className="w-max max-w-[95vw] xl:max-w-[1200px] p-2">
                        <div className="text-[10px] font-bold text-text-tertiary uppercase border-b border-border-default pb-1 mb-3 tracking-wider">
                            {label} Breakdown
                        </div>
                        <div className={`${colsClass} gap-x-6 max-h-[60vh] overflow-y-auto p-1 custom-scrollbar-thin`}>
                            {Object.entries(groupedBreakdown).map(([engine, items]) => (
                                <div key={engine} className="mb-5">
                                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest border-b border-border-default/40 pb-1 mb-2 break-after-avoid">{engine}</div>
                                    <div className="space-y-1">
                                        {Object.entries(items).map(([mod, count]) => (
                                            <div key={mod} className="flex justify-between items-center text-xs break-inside-avoid">
                                                <span className="text-text-secondary pr-3 truncate">{mod}</span>
                                                {count > 1 && <span className={`font-mono font-bold ${color} shrink-0`}>{count}</span>}
                                            </div>
                                        ))}
                                    </div>
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

    // Flat render for individual dashboards
    const numItems = Object.keys(breakdown).length;
    let colsClass = "columns-1";
    if (numItems > 24) colsClass = "columns-1 sm:columns-2 md:columns-3 lg:columns-4";
    else if (numItems > 12) colsClass = "columns-1 sm:columns-2 md:columns-3";
    else if (numItems > 6) colsClass = "columns-1 sm:columns-2";

    return (
        <PortalTooltip
            trigger="click"
            content={
                <div className="w-max max-w-[90vw] md:max-w-[800px] p-2">
                    <div className="text-[10px] font-bold text-text-tertiary uppercase border-b border-border-default pb-1 mb-2 tracking-wider">
                        {label} Breakdown
                    </div>
                    <div className={`${colsClass} gap-x-8 space-y-1.5 max-h-[50vh] overflow-y-auto p-1 custom-scrollbar-thin`}>
                        {Object.entries(breakdown).map(([mod, count]) => (
                            <div key={mod} className="flex justify-between items-center text-xs break-inside-avoid mb-1.5">
                                <span className="text-text-secondary pr-3 truncate">{mod}</span>
                                {count > 1 && <span className={`font-mono font-bold ${color} shrink-0`}>{count}</span>}
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
    // Prevent layout shift: Always render the structural block even if empty
    if (!sections || !sections.length) {
        return <div className={`flex w-full gap-1 h-28 mt-0 border-t ${STYLES.BORDER_DIVIDER} pt-2 pb-3`}></div>;
    }

    return (
        <div className={`flex w-full gap-1 h-28 mt-0 border-t ${STYLES.BORDER_DIVIDER} pt-2 pb-3`}>
            {sections.map(s => {
                const sc = s.score;
                const heightPct = sc !== null ? Math.min(100, Math.max(0, sc)) : 0;
                
                // Section tubes use Table 2: Indicator Palette (5 tiers)
                const barHex = getIndicatorColor(sc).hex;

                return (
                    <div key={s.id} className="relative flex-1 flex flex-col items-center justify-end h-full group min-w-[20px]">
                        <div className={`w-2 rounded-full bg-background-surface flex-1 relative overflow-hidden border ${STYLES.BORDER_INNER} shadow-inner`}>
                            <div
                                className="absolute bottom-0 w-full transition-all duration-700 ease-out"
                                style={{ height: `${heightPct}%`, backgroundColor: barHex }}
                            />
                        </div>
                        <div className="mt-1.5 flex flex-col items-center shrink-0">
                            <span 
                                className="text-[9px] font-bold font-mono leading-none" 
                                style={{ color: barHex }}
                            >
                                {sc !== null ? Math.round(sc) : '--'}
                            </span>
                            <span className="text-[8px] uppercase font-bold text-text-tertiary tracking-widest mt-0.5">
                                {s.shortLabel}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function FundamentalGaugePanel({ score, regime, sections, scoreModifier }) {
    // Pure SVG Animated Donut properties
    const size = 120;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;
    
    // Composite number uses Table 1: Composite Score Palette (7 tiers)
    const donutColor = getCompositeColor(score).hex;

    return (
        <div className="flex flex-col w-full h-full justify-between pt-2">
            {/* TOP: Score & Badge */}
            <div className="flex flex-row items-center md:items-baseline gap-2 md:gap-3 mb-1 text-left px-2">
                <div className={`${typography.number.giant} text-5xl md:text-6xl lg:text-7xl tracking-tighter font-mono`} style={{ color: donutColor }}>
                    {Number(score || 0).toFixed(0)}
                </div>
                <div className="flex flex-col justify-end h-full pb-1 md:pb-2">
                    <div
                        className="text-lg md:text-xl font-bold transition-colors duration-500 uppercase tracking-wider flex items-center gap-2"
                        style={{ color: donutColor }}
                    >
                        {regime?.label || "—"}
                        {scoreModifier !== undefined && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                scoreModifier > 0 ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : 
                                scoreModifier < 0 ? 'text-rose-400 border-rose-400/30 bg-rose-400/10' :
                                'text-text-tertiary border-border-default bg-background-surface'
                            } whitespace-nowrap hidden sm:inline-block`}>
                                {scoreModifier > 0 ? '+' : ''}{scoreModifier} ADJ
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] md:text-[11px] text-text-tertiary font-mono tracking-widest opacity-60">/ 100.00</div>
                </div>
            </div>

            {/* BOTTOM: Sections Vertical Bars */}
            <div className="mt-0">
                <SectionBar sections={sections} />
            </div>
        </div>
    );
}

function ImpactList({ title, items, type }) {
    const isBull = type === 'bull';
    const colorClass = isBull ? "text-emerald-700 dark:text-emerald-500" : "text-red-700 dark:text-red-500";
    const bgClass = "bg-transparent";
    const badgeText = isBull ? "BULLISH DRIVERS" : "BEARISH DRIVERS";
    const valColor = isBull ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-red-600 dark:text-red-400 font-bold";

    return (
        <div className={`p-5 ${bgClass} h-[240px] flex flex-col`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`${colorClass} text-[10px] md:text-[11px] font-bold uppercase tracking-wider`}>{title}</span>
                    <span className={`text-[9px] md:text-[10px] text-text-tertiary px-1 border ${STYLES.BORDER_INNER} rounded`}>{badgeText}</span>
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
                    <div className="text-xs text-text-tertiary italic">No significant items</div>
                )}
            </div>
        </div>
    );
}

function HeaderControls({ controls }) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center md:pt-4 md:p-4 text-text-primary bg-transparent">
            {/* LEFT: Search */}
            {controls.onSearchChange && (
                <div className="relative group w-full md:w-64 transition-all focus-within:md:w-80 mb-3 md:mb-0 shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        value={controls.search}
                        onChange={(e) => controls.onSearchChange(e.target.value)}
                        placeholder="Filter metrics..."
                        className={`w-full h-10 pl-9 pr-4 bg-background-app border ${STYLES.BORDER_INNER} rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner`}
                    />
                </div>
            )}

            {/* MIDDLE: Custom Injected Controls (Options/Fundamentals Specific) */}
            {controls.customComponent && (
                <div className="flex-1 md:px-4 flex items-center justify-start gap-3 flex-wrap">
                    {controls.customComponent}
                </div>
            )}

            {/* RIGHT: Toggles (Scrollable on Mobile) */}
            <div className="flex w-full md:w-auto overflow-x-auto md:overflow-visible gap-3 pb-1 md:pb-0 custom-scrollbar-hidden">
                <div className="flex items-center gap-3 shrink-0">
                    {/* View Mode Toggle (Desktop Only) */}
                    {controls.onViewChange && (
                        <div className="hidden md:block">
                            <CardSegmented
                                value={controls.viewMode}
                                onChange={controls.onViewChange}
                                options={[
                                    { value: "sectioned", label: "Sections" },
                                    { value: "flat", label: "Flat View" },
                                ]}
                            />
                        </div>
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
        </div>
    );
}
