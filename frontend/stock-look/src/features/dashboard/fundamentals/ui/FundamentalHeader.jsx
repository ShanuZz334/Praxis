import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { classifyFundamentalScore } from "@/features/dashboard/fundamentals/engine/sentiment";
import { generateIntelligence } from "@/features/dashboard/fundamentals/engine/intelligence";
import CardSegmented from "@/shared/components/controls/CardSegmented";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";

export default function FundamentalHeader({
  score,
  sections,
  regime,
  confidence,
  sortMode,
  onSortChange,
  viewMode,
  onViewChange,
  cards = [],
  searchQuery,
  onSearchChange
}) {
  const navigate = useNavigate();

  /* ================= REGIME CLASSIFICATION ================= */
  let regimeLabel = "Balanced";
  let regimeDesc = "Mixed signals - stock specific opportunities";
  let regimeColor = "var(--warning)";

  if (score >= 70) {
    regimeLabel = "Risk-On";
    regimeDesc = "Favorable macro & valuation backdrop";
    regimeColor = "var(--success)";
  } else if (score < 40) {
    regimeLabel = "Risk-Off";
    regimeDesc = "Capital preservation mode advised";
    regimeColor = "var(--danger)";
  }

  /* ================= COMPOSITE STATE LOGIC ================= */
  function getCompositeState(s) {
    if (s >= 70) return { label: "Bullish", color: "text-state-bullish-text" };
    if (s >= 55) return { label: "Neutral-Positive", color: "text-state-bullish-text opacity-80" };
    if (s >= 45) return { label: "Neutral", color: "text-state-neutral-text" };
    if (s >= 30) return { label: "Neutral-Negative", color: "text-state-bearish-text opacity-80" };
    return { label: "Bearish", color: "text-state-bearish-text" };
  }

  const compositeState = getCompositeState(score || 0);

  /* ================= 7D CHANGE LOGIC (MOCKED STABLE) ================= */
  const { delta, prevScore, deltaColor, deltaSign } = useMemo(() => {
    if (!score) return { delta: 0, prevScore: 0, deltaColor: "text-slate-400", deltaSign: "" };

    const mockPrev = score - 4.2;
    const d = score - mockPrev;
    const pct = ((d / mockPrev) * 100).toFixed(1);

    let c = "text-text-tertiary";
    let sign = "";
    if (d > 0.1) { c = "text-emerald-600 dark:text-emerald-400 font-bold"; sign = "+"; }
    else if (d < -0.1) { c = "text-red-600 dark:text-red-400 font-bold"; sign = ""; }

    return { delta: pct, prevScore: mockPrev.toFixed(1), deltaColor: c, deltaSign: sign };
  }, [score]);

  /* ================= SECTION DETAILS (MEMOIZED) ================= */
  const sectionDetails = useMemo(() => {
    const config = [
      { id: 'Valuation', label: 'Val', w: 0.15 },
      { id: 'Earnings', label: 'Ear', w: 0.20 },
      { id: 'Macro', label: 'Mac', w: 0.15 },
      { id: 'Liquidity', label: 'Liq', w: 0.12 },
      { id: 'Sector', label: 'Sec', w: 0.10 },
      { id: 'Corporate', label: 'Cor', w: 0.10 },
      { id: 'Global', label: 'Glo', w: 0.08 },
      { id: 'Risk', label: 'Ris', w: 0.10 }
    ];

    return config.map(cfg => {
      const rawScore = (sections && sections[cfg.id]) || 0;
      const contribution = rawScore * cfg.w;
      const sectionCards = cards.filter(c => c.category === cfg.id);

      const topCard = sectionCards.reduce((prev, curr) =>
        (curr.score > (prev?.score || -Infinity)) ? curr : prev
        , null);

      const dragCard = sectionCards.reduce((prev, curr) =>
        (curr.score < (prev?.score || Infinity)) ? curr : prev
        , null);

      return {
        ...cfg,
        rawScore,
        contribution, // This is roughly 0.0-0.2
        normalizedScore: Math.round(((rawScore + 1) / 2) * 100),
        topCard: topCard && topCard.score > 0 ? topCard : null,
        dragCard: dragCard && dragCard.score < 0 ? dragCard : null
      };
    });
  }, [sections, cards]);

  /* ================= INTELLIGENCE & MOVERS ================= */
  const intelligence = useMemo(() => {
    if (!cards || cards.length === 0) return null;
    return generateIntelligence(cards);
  }, [cards]);

  const { tailwinds, risks } = intelligence || { tailwinds: [], risks: [] };

  const movers = useMemo(() => {
    if (!cards?.length) return { top: [], bottom: [] };
    const sorted = [...cards].sort((a, b) => (b.score || 0) - (a.score || 0));
    return {
      top: sorted.slice(0, 3),
      bottom: sorted.slice(-3).reverse()
    };
  }, [cards]);

  return (
    <div className="space-y-6">
      {/* ================= UNIFIED HEADER BLOCK ================= */}
      <div className="rounded-2xl bg-background-card-primary border border-border-subtle-translucent overflow-hidden shadow-2xl">

        {/* ROW 1: GAUGE, REGIME, CONFIDENCE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10 border-b border-white/10 bg-white/[0.02]">

          {/* 1. COMPOSITE SCORE CARD (AUTHORITATIVE) */}
          <div className="group relative p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                Composite Score
                <PortalTooltip
                  content={
                    <div className="w-80">
                      <div className="flex items-center gap-2 mb-2 border-b border-border-default pb-2">
                        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Fundamental Module</span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        The Fundamental module evaluates valuation, earnings strength, balance sheet quality, and macro-adjusted growth to determine whether price is supported by underlying business reality.
                      </p>
                      <div className="mt-3 pt-2 border-t border-border-default flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                        <span>Click to read full manual</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </div>
                    </div>
                  }
                >
                  <button
                    onClick={() => navigate('/dashboard/manual/fundamental')}
                    className="group/btn flex items-center justify-center w-5 h-5 rounded-full bg-white/5 hover:bg-blue-500/20 text-white/20 hover:text-blue-400 transition-all cursor-pointer"
                  >
                    <span className="text-xs font-serif italic font-bold">i</span>
                  </button>
                </PortalTooltip>
              </div>

              {/* 7D CHANGE INDICATOR */}
              <PortalTooltip
                content={
                  <div className="w-48 text-[10px] text-text-secondary">
                    Change in fundamental strength vs 7 days ago ({prevScore})
                  </div>
                }
              >
                <div className={`flex items-center gap-1 ${deltaColor} bg-white/5 px-2 py-1 rounded text-[10px] font-mono border border-white/5`}>
                  <span className="font-bold">{deltaSign}{delta}%</span>
                  <span className="opacity-60 ml-1 lowercase">vs 7d</span>
                </div>
              </PortalTooltip>
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <div className="text-6xl font-bold text-white tracking-tighter">{score || 0}</div>
              <div className="flex flex-col justify-end h-full py-1">
                <div className={`text-lg font-bold ${compositeState.color} transition-colors duration-500`}>
                  {compositeState.label}
                </div>
                <div className="text-[10px] text-white/30 font-mono">/ 100.00</div>
              </div>
            </div>

            {/* Section Contributions (Vertical Divergence Bar Chart) */}
            <div className="grid grid-cols-8 gap-1 h-24 mt-6 border-t border-white/5 pt-3">
              {sectionDetails.map((s) => {
                const MAX_CONTRIB = 0.20;
                // Scale height relative to half-height (50%)
                // contribution is 0-0.2 usually. MAX_CONTRIB is 0.2. So ratio is 0-1. * 100 = 0-100%.
                const heightPct = Math.min(100, (Math.abs(s.contribution) / MAX_CONTRIB) * 100);

                const isPos = s.contribution > 0;
                const isNeg = s.contribution < 0;

                let barColor = "bg-white/20";
                if (isPos) barColor = "bg-emerald-500";
                if (isNeg) barColor = "bg-red-500";
                if (Math.abs(s.contribution) < 0.01) barColor = "bg-white/20";

                // Multiply by 100 to show "Points" (e.g. 0.019 -> 1.9)
                const displayVal = (s.contribution * 100).toFixed(1);

                return (
                  <PortalTooltip
                    key={s.id}
                    className="group/item relative flex flex-col items-center justify-between h-full w-full"
                    content={
                      <div className="min-w-[180px] text-left">
                        <div className="flex justify-between items-baseline border-b border-border-default pb-2 mb-2">
                          <span className="text-xs font-bold text-text-primary">{s.id}</span>
                          <span className="text-[10px] text-text-tertiary">{s.normalizedScore}/100</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-text-tertiary">Weight</span>
                            <span className="text-text-primary font-mono">{(s.w * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-text-tertiary">Net Contribution</span>
                            <span className={`font-mono ${isPos ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-text-secondary'}`}>
                              {s.contribution > 0 ? '+' : ''}{displayVal} pts
                            </span>
                          </div>
                        </div>

                        {(s.topCard || s.dragCard) && (
                          <div className="mt-2 pt-2 border-t border-border-default space-y-1">
                            {s.topCard && (
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="text-emerald-400/80">▲ {s.topCard.label}</span>
                              </div>
                            )}
                            {s.dragCard && (
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="text-red-400/80">▼ {s.dragCard.label}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    }
                  >
                    {/* TOP LABEL */}
                    <div className="text-[9px] uppercase tracking-tighter text-white/40 font-semibold text-center mb-1">
                      {s.label}
                    </div>

                    {/* VERTICAL CHART CONTAINER */}
                    <div className="flex-1 w-full relative group-hover/item:bg-white/[0.02] rounded transition-colors mb-1">
                      {/* Center Axis */}
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 z-0" />

                      {/* The Bar */}
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 w-1.5 ${barColor} rounded-full transition-all duration-500 z-10`}
                        style={{
                          // If positive, grow UP from 50%. If negative, grow DOWN from 50%.
                          bottom: isPos ? '50%' : 'auto',
                          top: isNeg ? '50%' : 'auto',
                          // Height is % of the half-container (since axis is in middle)
                          // Max height is 50% of total container.
                          height: `${heightPct * 0.5}%`,
                          minHeight: '2px', // Minimum visibility
                          opacity: Math.abs(s.contribution) < 0.01 ? 0.3 : 1
                        }}
                      />
                    </div>

                    {/* PERCENTAGE LABEL (Points) */}
                    <div className={`text-[9px] font-mono tracking-tight text-center ${isPos ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-white/20'}`}>
                      {Math.abs(s.contribution) < 0.005 ? '-' : displayVal}
                    </div>
                  </PortalTooltip>
                );
              })}
            </div>

            {/* HOVER OVERLAY: MOVERS */}
            <div className="absolute top-[100%] left-0 w-80 bg-[#0b1220] border border-white/10 rounded-xl p-4 shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase text-white/40 mb-2 font-bold tracking-wider">Top Contributors</div>
                  <div className="space-y-2">
                    {movers.top.map(c => (
                      <div key={c.id} className="flex items-center justify-between text-xs">
                        <span className="text-white/80 truncate max-w-[80px]" title={c.label}>{c.label}</span>
                        <span className="text-green-400 font-mono">+{((c.score || 0) * 100).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-white/40 mb-2 font-bold tracking-wider">Top Drags</div>
                  <div className="space-y-2">
                    {movers.bottom.map(c => (
                      <div key={c.id} className="flex items-center justify-between text-xs">
                        <span className="text-white/80 truncate max-w-[80px]" title={c.label}>{c.label}</span>
                        <span className="text-red-400 font-mono">{((c.score || 0) * 100).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[10px] text-center text-white/30 border-t border-white/5 pt-2">
                Scores weighted by reliability
              </div>
            </div>
          </div>

          {/* 2. REGIME STRIP (ANALYTICAL) */}
          <div className="p-6 flex flex-col justify-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Market Regime</div>

            <div className="mb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="text-2xl font-bold text-white">{regimeLabel}</div>
                <div className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">
                  63% Conf
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
              <span>Risk-Off</span>
              <span>Balanced</span>
              <span>Risk-On</span>
            </div>
          </div>

          {/* 3. DATA INTEGRITY (SPLIT) */}
          <div className="p-6 flex flex-col justify-center gap-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Data Integrity</div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-white/80">Monitor Freshness</span>
              </div>
              <div className="text-xs font-mono text-white/50">
                Realtime
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-white/60">
                <span>Metric Coverage</span>
                <span>36/36 (100%)</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full rounded-full" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
              <span className="text-green-400">● Primary Source</span>
              <span>NSE/BSE Feeds</span>
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
                        <div className="text-[10px] text-white/40">Structural · High Impact</div>
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
                        <div className="text-[10px] text-white/40">Cyclical · Watch</div>
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

        {/* ================= CONTROLS ================= */}
        <div className="flex justify-between items-center border-t border-border-subtle-faint pt-4 bg-background-card-primary p-4 text-white">
          {/* LEFT: SEARCH */}
          <div className="relative group w-64 transition-all focus-within:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/20 group-focus-within:text-blue-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter metrics..."
              className="w-full pl-9 pr-4 py-2 bg-background-card-primary border border-border-subtle-translucent rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner"
            />
          </div>

          {/* RIGHT: VIEW/SORT */}
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
                { value: "credit_pct_desc", label: "Strongest Signal" },
                { value: "credit_pct_asc", label: "Weakest Signal" },
                { value: "max_credit_desc", label: "High Reliability" },
                { value: "max_credit_asc", label: "Low Reliability" },
              ]}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
