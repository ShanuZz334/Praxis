import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CardSegmented from "@/shared/components/controls/CardSegmented";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";
import {
    extractTechnicalTailwinds,
    extractTechnicalRisks,
    getTechnicalRegime
} from "@/features/dashboard/technical/engine/technicalHelper";

export default function TechnicalHeader({
    score,
    sections, // { Trend: 0.8, Momentum: 0.5 ... }
    cards = [],
    viewMode,
    onViewChange,
    sortMode,
    onSortChange,
    searchQuery,
    onSearchChange,
    resultCount = 0
}) {
    const navigate = useNavigate();
    /* ================= REGIME CLASSIFICATION ================= */
    const regimeData = useMemo(() => getTechnicalRegime(score || 50), [score]);
    const regimeLabel = regimeData.label;
    const regimeDesc = regimeData.desc;
    const regimeColor = regimeData.color;

    /* ================= COMPOSITE STATE LOGIC ================= */
    function getCompositeState(s) {
        if (s >= 70) return { label: "Bullish", color: "text-emerald-400" };
        if (s >= 55) return { label: "Neutral-Positive", color: "text-emerald-400/80" };
        if (s >= 45) return { label: "Neutral", color: "text-slate-200" };
        if (s >= 30) return { label: "Neutral-Negative", color: "text-orange-400" };
        return { label: "Bearish", color: "text-red-500" };
    }

    const compositeState = getCompositeState(score || 0);

    /* ================= MOCKED DELTA (Stable) ================= */
    const { delta, prevScore, deltaColor, deltaSign } = useMemo(() => {
        if (!score) return { delta: 0, prevScore: 0, deltaColor: "text-slate-400", deltaSign: "" };
        const mockPrev = score - 2.5; // Simulate slight uptrend
        const d = score - mockPrev;
        const pct = ((d / mockPrev) * 100).toFixed(1);
        let c = "text-slate-400";
        let sign = "";
        if (d > 0.1) { c = "text-emerald-400"; sign = "+"; }
        else if (d < -0.1) { c = "text-red-400"; sign = ""; }
        return { delta: pct, prevScore: mockPrev.toFixed(1), deltaColor: c, deltaSign: sign };
    }, [score]);

    /* ================= SECTION DETAILS (Tech Specific) ================= */
    const sectionConfig = [
        { id: 'Trend', label: 'Trn', w: 0.25 },
        { id: 'Momentum', label: 'Mom', w: 0.20 },
        { id: 'Volatility', label: 'Vol', w: 0.15 },
        { id: 'Volume', label: 'Vlm', w: 0.10 },
        { id: 'Breadth', label: 'Bre', w: 0.10 },
        { id: 'Structure', label: 'Str', w: 0.20 }
    ];

    const sectionDetails = useMemo(() => {
        return sectionConfig.map(cfg => {
            const normScore = (sections && sections[cfg.id]) || 0;
            const contribution = normScore * cfg.w;
            const displayScore = Math.round(((normScore + 1) / 2) * 100);

            return {
                ...cfg,
                contribution,
                normalizedScore: displayScore
            };
        });
    }, [sections]);



    /* ================= INTELLIGENCE (Tailwinds & Risks) ================= */
    const { tailwinds, risks } = useMemo(() => {
        return {
            tailwinds: extractTechnicalTailwinds(cards),
            risks: extractTechnicalRisks(cards)
        };
    }, [cards]);


    return (
        <div className="space-y-6">
            {/* ================= UNIFIED HEADER BLOCK ================= */}
            <div className="rounded-2xl bg-[#0b1220] border border-white/10 overflow-hidden shadow-2xl">

                {/* ROW 1: GAUGE, REGIME, INTEGRITY */}
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10 border-b border-white/10 bg-white/[0.02]">

                    {/* 1. COMPOSITE SCORE CARD (Identical to Fundamental) */}
                    <div className="group relative p-6">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                                Technical Composite
                                <PortalTooltip
                                    content={
                                        <div className="w-80 p-4 bg-[#0b1220] border border-white/10 rounded-xl shadow-2xl">
                                            <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">Technical Module</span>
                                            </div>
                                            <p className="text-xs text-white/70 leading-relaxed">
                                                The Technical module aggregates price action, momentum, volatility, and volume indicators to determine the structural health of the trend.
                                            </p>
                                            <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                                                <span>Click to read full manual</span>
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </div>
                                        </div>
                                    }
                                >
                                    <button
                                        onClick={() => navigate('/dashboard/manual/technical')}
                                        className="group/btn flex items-center justify-center w-5 h-5 rounded-full bg-white/5 hover:bg-blue-500/20 text-white/20 hover:text-blue-400 transition-all cursor-pointer"
                                    >
                                        <span className="text-xs font-serif italic font-bold">i</span>
                                    </button>
                                </PortalTooltip>
                            </div>

                            {/* 7D CHANGE */}
                            <PortalTooltip
                                content={
                                    <div className="w-48 p-2 bg-black border border-white/10 rounded text-[10px] text-white/60">
                                        Change in technical strength vs 24h ago ({prevScore})
                                    </div>
                                }
                            >
                                <div className={`flex items-center gap-1 ${deltaColor} bg-white/5 px-2 py-1 rounded text-[10px] font-mono border border-white/5`}>
                                    <span className="font-bold">{deltaSign}{delta}%</span>
                                    <span className="text-white/30 ml-1">vs 24h</span>
                                </div>
                            </PortalTooltip>
                        </div>

                        <div className="flex items-baseline gap-3 mb-4">
                            <div className="text-6xl font-bold text-white tracking-tighter">{score ? score.toFixed(0) : 0}</div>
                            <div className="flex flex-col justify-end h-full py-1">
                                <div className={`text-lg font-bold ${compositeState.color} transition-colors duration-500`}>
                                    {compositeState.label}
                                </div>
                                <div className="text-[10px] text-white/30 font-mono">/ 100.00</div>
                            </div>
                        </div>

                        {/* Section Contributions Bar Chart */}
                        <div className="grid grid-cols-6 gap-1 h-24 mt-6 border-t border-white/5 pt-3">
                            {sectionDetails.map((s) => {
                                const MAX_CONTRIB = 0.25;
                                const heightPct = Math.min(100, (Math.abs(s.contribution) / MAX_CONTRIB) * 100);
                                const isPos = s.contribution > 0;
                                const isNeg = s.contribution < 0;
                                let barColor = "bg-white/20";
                                if (isPos) barColor = "bg-emerald-500";
                                if (isNeg) barColor = "bg-red-500";
                                if (Math.abs(s.contribution) < 0.01) barColor = "bg-white/20";
                                const displayVal = (s.contribution * 100).toFixed(1);

                                return (
                                    <PortalTooltip
                                        key={s.id}
                                        className="group/item relative flex flex-col items-center justify-between h-full w-full"
                                        content={
                                            <div className="min-w-[120px] bg-[#0b1220] border border-white/20 p-3 rounded-xl shadow-2xl text-left">
                                                <div className="flex justify-between items-baseline border-b border-white/10 pb-2 mb-2">
                                                    <span className="text-xs font-bold text-white">{s.id}</span>
                                                    <span className="text-[10px] text-white/50">{s.normalizedScore}/100</span>
                                                </div>
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-white/40">Contrib</span>
                                                    <span className={`font-mono ${isPos ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-white/60'}`}>
                                                        {displayVal} pts
                                                    </span>
                                                </div>
                                            </div>
                                        }
                                    >
                                        <div className="text-[9px] uppercase tracking-tighter text-white/40 font-semibold text-center mb-1">
                                            {s.label}
                                        </div>
                                        <div className="flex-1 w-full relative group-hover/item:bg-white/[0.02] rounded transition-colors mb-1">
                                            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 z-0" />
                                            <div
                                                className={`absolute left-1/2 -translate-x-1/2 w-1.5 ${barColor} rounded-full transition-all duration-500 z-10`}
                                                style={{
                                                    bottom: isPos ? '50%' : 'auto',
                                                    top: isNeg ? '50%' : 'auto',
                                                    height: `${heightPct * 0.5}%`,
                                                    minHeight: '2px',
                                                    opacity: Math.abs(s.contribution) < 0.01 ? 0.3 : 1
                                                }}
                                            />
                                        </div>
                                        <div className={`text-[9px] font-mono tracking-tight text-center ${isPos ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-white/20'}`}>
                                            {Math.abs(s.contribution) < 0.005 ? '-' : displayVal}
                                        </div>
                                    </PortalTooltip>
                                );
                            })}
                        </div>


                    </div>

                    {/* 2. REGIME STRIP (Matched to Fundamental) */}
                    <div className="p-6 flex flex-col justify-center">
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Market Regime</div>
                        <div className="mb-4">
                            <div className="flex items-center gap-3 mb-1">
                                <div className={`text-2xl font-bold ${regimeColor}`}>{regimeLabel}</div>
                                <div className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">
                                    85% Conf
                                </div>
                            </div>
                            <div className="text-xs text-white/40">{regimeDesc}</div>
                        </div>

                        <div className="relative h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-80">
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#0b1220] rounded-full shadow-lg transition-all duration-1000"
                                style={{ left: `${Math.max(5, Math.min(95, score || 50))}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/20 mt-2 font-mono">
                            <span>Bearish</span>
                            <span>Neutral</span>
                            <span>Bullish</span>
                        </div>
                    </div>

                    {/* 3. SIGNAL INTEGRITY (Renamed from Data Integrity) */}
                    <div className="p-6 flex flex-col justify-center gap-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Signal Integrity</div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm text-white/80">Monitor Active</span>
                            </div>
                            <div className="text-xs font-mono text-white/50">
                                Realtime
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-white/60">
                                <span>Signal Coverage</span>
                                <span>200/200 (100%)</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-full rounded-full" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                            <span className="text-green-400">● 15m Candles</span>
                            <span>Primary Feed</span>
                        </div>
                    </div>
                </div>

                {/* ROW 2: TAILWINDS & RISKS (ACTIONABLE) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10 border-t border-white/5">

                    {/* TAILWINDS */}
                    <div className="p-5 bg-green-900/[0.02]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-green-500 text-xs font-bold uppercase tracking-wider">Top Tailwinds</span>
                                <span className="text-[10px] text-white/30 px-1 border border-white/10 rounded">BULLISH DRIVERS</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {tailwinds.length > 0 ? (
                                tailwinds.map((tw) => (
                                    <div key={tw.id} className="group flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-base filter grayscale group-hover:grayscale-0 transition">{tw.icon}</span>
                                            <div>
                                                <div className="text-sm text-white/90 font-medium leading-none mb-1">{tw.label}</div>
                                                <div className="text-[10px] text-white/40">{tw.category} · High Impact</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-green-400 font-mono">+{tw.creditPct.toFixed(0)}%</div>
                                            <div className="text-[9px] text-white/20">Contribution</div>
                                        </div>
                                    </div>
                                ))
                            ) : <div className="text-xs text-white/40 italic">No significant tailwinds</div>}
                        </div>
                    </div>

                    {/* RISKS */}
                    <div className="p-5 bg-red-900/[0.02]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-red-500 text-xs font-bold uppercase tracking-wider">Key Risks</span>
                                <span className="text-[10px] text-white/30 px-1 border border-white/10 rounded">BEARISH DRIVERS</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {risks.length > 0 ? (
                                risks.map((risk) => (
                                    <div key={risk.id} className="group flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-base filter grayscale group-hover:grayscale-0 transition">{risk.icon}</span>
                                            <div>
                                                <div className="text-sm text-white/90 font-medium leading-none mb-1">{risk.label}</div>
                                                <div className="text-[10px] text-white/40">{risk.category} · Watch</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-red-400 font-mono">{risk.creditPct.toFixed(0)}%</div>
                                            <div className="text-[9px] text-white/20">Drag</div>
                                        </div>
                                    </div>
                                ))
                            ) : <div className="text-xs text-white/40 italic">No significant risks</div>}
                        </div>
                    </div>

                </div>

                {/* CONTROLS (Matched) */}
                <div className="flex justify-between items-center border-t border-white/5 pt-4 bg-[#0b1220] p-4 text-white">
                    {/* LEFT: SEARCH */}
                    <div className="relative group w-64 transition-all focus-within:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/20 group-focus-within:text-blue-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Find indicators (e.g. RSI, MACD)..."
                            className="w-full pl-9 pr-20 py-2 bg-[#0b1220] border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner"
                        />

                        {/* RIGHT ACTIONS Inside Input */}
                        <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                            {/* Result Count Badge */}
                            {searchQuery && (
                                <span className="text-[10px] uppercase font-bold text-white/40 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                    {resultCount} matches
                                </span>
                            )}

                            {/* Clear Button */}
                            {searchQuery && (
                                <button
                                    onClick={() => onSearchChange('')}
                                    className="p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <CardSegmented
                            value={viewMode}
                            onChange={onViewChange}
                            options={[
                                { value: "sectioned", label: "Sectioned" },
                                { value: "flat", label: "Flat" },
                            ]}
                        />

                        <CardSegmented
                            value={sortMode}
                            onChange={onSortChange}
                            options={[
                                { value: "score_desc", label: "Strongest Signal" }, // Changed value to match Tech logic
                                { value: "score_asc", label: "Weakest Signal" },
                                { value: "rel_desc", label: "High Credit" },
                                { value: "rel_asc", label: "Low Credit" },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
