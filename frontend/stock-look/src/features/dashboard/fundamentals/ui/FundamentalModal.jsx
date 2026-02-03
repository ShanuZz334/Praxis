/**
 * @file FundamentalModal.jsx
 * @purpose Detailed Modal View for a specific Fundamental Indicator.
 * @responsibilities
 * - Orchestrates the modal layout with Backdrop, Header, Footer.
 * - Integrates `InterpretationDesk`, `MetricsDesk`, and `HistoryChart`.
 * - Manages scroll lock and keyboard dismissal.
 * @key_exports
 * - FundamentalModal (Default Component)
 * @dependencies
 * - FundamentalInterpretationDesk
 * - FundamentalMetricsDesk
 * - FundamentalHistoryChart
 * @lifecycle
 * - Rendered by FundamentalPage when a card is selected.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/shared/context/ThemeContext";
import FundamentalInterpretationDesk from "./FundamentalInterpretationDesk";
import FundamentalMetricsDesk from "./FundamentalMetricsDesk";
import FundamentalHistoryChart from "./FundamentalHistoryChart";

// =============================
// Main Component
// =============================
export default function FundamentalModal({ open, onClose, card }) {
  const { theme } = useTheme();

  // --- Effect: Scroll Lock & Escape Key ---
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

  if (!open || !card) return null;

  // --- Logic: Footer Tier ---
  const relVal = card.creditScore ? card.creditScore * 10 : 8.5;
  let relTier = 'Low';
  let relColor = 'text-text-tertiary';
  if (relVal >= 8) { relTier = 'High'; relColor = 'text-state-bullish-text'; }
  else if (relVal >= 6) { relTier = 'Medium'; relColor = 'text-amber-600'; }

  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 ${theme}`}>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* MODAL LAYOUT */}
      <div className="relative flex items-start justify-center gap-6 max-w-[1600px] w-full max-h-[95vh] pointer-events-none">

        {/* ⬅ LEFT PANEL */}
        <div className="hidden lg:block w-[300px] pointer-events-auto">
          <FundamentalInterpretationDesk card={card} />
        </div>

        {/* 🧱 CENTER PANEL */}
        <div className="
          flex-1 min-w-0 max-w-3xl pointer-events-auto
          flex flex-col
          bg-background-tooltip border border-border-default
          rounded-2xl shadow-2xl overflow-hidden
          max-h-[92vh] md:max-h-[85vh]
        ">

          {/* HEADER */}
          <div className="relative shrink-0 p-4 md:p-6 border-b border-border-subtle flex justify-between items-start bg-transparent z-10 select-none">
            <div>
              <h2 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-text-primary via-text-primary/90 to-text-primary/60 leading-tight pr-10 md:pr-8">
                {card.label}
              </h2>
              <div className="flex items-center gap-2 mt-1 md:mt-2">
                <span className="text-[10px] font-mono text-state-bullish-text bg-state-bullish-surface px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                <span className="text-xs md:text-sm text-text-tertiary border-l border-border-subtle pl-2">
                  {card.desc || `Fundamental ID: ${card.id}`}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="
                group absolute top-3 right-3 md:top-5 md:right-5
                w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full
                bg-background-elevated text-text-tertiary
                hover:text-text-primary hover:bg-background-subtle
                hover:scale-105 active:scale-95 transition-all duration-200
                border border-border-subtle hover:border-border-default
              "
            >
              <span className="group-hover:rotate-90 transition-transform duration-300">✕</span>
            </button>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

            {/* CHART AREA */}
            <div className="
              w-full min-h-[300px] md:min-h-[400px] h-[350px] md:h-[450px]
              border border-border-subtle rounded-xl 
              bg-background-elevated/40
              p-3 md:p-4 relative group
            ">
              <div className="w-full h-full rounded-lg overflow-hidden relative z-10">
                <FundamentalHistoryChart
                  trend={card.signal}
                  baseValue={card.raw}
                  label={card.label}
                />
              </div>
            </div>

            {/* MOBILE STACK */}
            <div className="lg:hidden space-y-6 mt-6">
              <FundamentalInterpretationDesk card={card} />
              <FundamentalMetricsDesk card={card} />
            </div>
          </div>

          {/* FOOTER */}
          <div className="shrink-0 p-4 md:p-5 border-t border-border-subtle bg-background-card/75 backdrop-blur-xl z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-[10px] md:text-xs text-text-primary">
              <div>
                <div className="text-text-tertiary uppercase tracking-wider mb-1">Raw Value</div>
                <div className="font-mono text-text-primary text-xs md:text-sm font-bold">
                  {card.raw} <span className="text-[9px] md:text-[10px] font-normal text-text-tertiary">{card.unit}</span>
                </div>
              </div>
              <div>
                <div className="text-text-tertiary uppercase tracking-wider mb-1">Reliability</div>
                <div className={`font-medium ${relColor}`}>
                  {relTier} ({relVal.toFixed(1)}/10)
                </div>
              </div>
              <div>
                <div className="text-text-tertiary uppercase tracking-wider mb-1 md:mb-1">Impact</div>
                <div className="font-mono text-text-primary">{(card.weight || 1).toFixed(2)}x</div>
              </div>
              <div>
                <div className="text-text-tertiary uppercase tracking-wider mb-1">Category</div>
                <div className="text-text-primary truncate">{card.category}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ➡ RIGHT PANEL */}
        <div className="hidden lg:block w-[240px] pointer-events-auto">
          <FundamentalMetricsDesk card={card} />
        </div>

      </div>
    </div>,
    document.body
  );
}
