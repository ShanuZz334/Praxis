/**
 * @file FundamentalHeader.jsx
 * @purpose (DEPRECATED) Legacy Header component for Fundamental Dashboard.
 * @note This component has been superseded by `GlobalHeader` in `FundamentalPage.jsx`.
 *       It is maintained here for reference integrity but is not actively used.
 * @responsibilities
 * - Rendered the composite score, regime strip, and movers.
 * - Contained inline logic now moved to `GlobalHeader`.
 * @key_exports
 * - FundamentalHeader (Default Component)
 * @lifecycle
 * - UNUSED / DEPRECATED
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { generateIntelligence } from "@/features/dashboard/fundamentals/engine/intelligence";
import CardSegmented from "@/shared/components/controls/CardSegmented";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";
import AiInsightSection from "@/shared/components/ui/AiInsightSection";

// =============================
// Main Component
// =============================
export default function FundamentalHeader({
  score,
  sections,
  cards = [],
  searchQuery,
  onSearchChange,
  viewMode,
  onViewChange,
  sortMode,
  onSortChange,
}) {
  const navigate = useNavigate();

  // --- Regime Logic ---
  let regimeLabel = "Balanced";
  let regimeDesc = "Mixed signals - stock specific opportunities";
  if (score >= 70) {
    regimeLabel = "Risk-On";
    regimeDesc = "Favorable macro & valuation backdrop";
  } else if (score < 40) {
    regimeLabel = "Risk-Off";
    regimeDesc = "Capital preservation mode advised";
  }

  // --- Composite State ---
  function getCompositeState(s) {
    if (s >= 70) return { label: "Bullish", color: "text-state-bullish-text" };
    if (s >= 55) return { label: "Neutral-Positive", color: "text-state-bullish-text opacity-80" };
    if (s >= 45) return { label: "Neutral", color: "text-state-neutral-text" };
    if (s >= 30) return { label: "Neutral-Negative", color: "text-state-bearish-text opacity-80" };
    return { label: "Bearish", color: "text-state-bearish-text" };
  }
  const compositeState = getCompositeState(score || 0);

  // --- 7D Change (Mock) ---
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

  // --- Section Details ---
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
      return {
        ...cfg,
        rawScore,
        contribution,
        normalizedScore: Math.round(((rawScore + 1) / 2) * 100),
      };
    });
  }, [sections]);

  // --- Intelligence ---
  const intelligence = useMemo(() => {
    if (!cards || cards.length === 0) return null;
    return generateIntelligence(cards);
  }, [cards]);
  const { tailwinds, risks } = intelligence || { tailwinds: [], risks: [] };

  return (
    <div className="space-y-6 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
      <div className="bg-red-500/10 border border-red-500/20 p-2 text-center text-red-400 text-xs uppercase font-bold">
        Deprecated Component (See GlobalHeader)
      </div>

      <div className="rounded-2xl bg-background-card-primary border border-border-subtle-translucent overflow-hidden shadow-2xl">
        {/* ROW 1: GAUGE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10 border-b border-white/10 bg-white/[0.02]">

          <div className="p-6">
            <div className="flex items-baseline gap-3 mb-4">
              <div className="text-6xl font-bold text-white tracking-tighter">{score || 0}</div>
              <div className="flex flex-col justify-end h-full py-1">
                <div className={`text-lg font-bold ${compositeState.color}`}>
                  {compositeState.label}
                </div>
                <div className="text-[10px] text-white/30 font-mono">/ 100.00</div>
              </div>
            </div>
            {/* Section contributions bar chart omitted for brevity in deprecated file */}
          </div>

          <div className="p-0 flex flex-col justify-center">
            <AiInsightSection 
                actionType={regimeLabel}
            />
          </div>

          <div className="p-6 flex flex-col justify-center gap-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Data Integrity</div>
            <div className="text-sm text-white/80">Monitor Freshness: Realtime</div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex justify-between items-center border-t border-border-subtle-faint pt-4 bg-background-card-primary p-4 text-white">
          <CardSegmented
            value={viewMode}
            onChange={onViewChange}
            options={[{ value: "sectioned", label: "Sectioned" }, { value: "flat", label: "Flat" }]}
          />
        </div>
      </div>
    </div>
  );
}
