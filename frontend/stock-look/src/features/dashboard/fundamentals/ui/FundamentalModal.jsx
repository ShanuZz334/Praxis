import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import FundamentalInterpretationDesk from "./FundamentalInterpretationDesk";
import FundamentalMetricsDesk from "./FundamentalMetricsDesk";
import FundamentalHistoryChart from "./FundamentalHistoryChart";

export default function FundamentalModal({ open, onClose, card }) {
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

  // Reliability tier for footer (matched logic)
  const relVal = card.creditScore ? card.creditScore * 10 : 8.5;
  let relTier = 'Low';
  let relColor = 'text-[var(--text-muted)]';
  if (relVal >= 8) { relTier = 'High'; relColor = 'text-[var(--success)]'; }
  else if (relVal >= 6) { relTier = 'Medium'; relColor = 'text-[var(--warning)]'; }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* MODAL LAYOUT */}
      <div className="relative flex items-start justify-center gap-6 max-w-[1600px] w-full max-h-[95vh] pointer-events-none">

        {/* ⬅ LEFT FLOAT: INTERPRETATION DESK */}
        <div className="hidden lg:block w-[300px] pointer-events-auto">
          <FundamentalInterpretationDesk card={card} />
        </div>

        {/* 🧱 CENTER: POPUP CARD */}
        <div
          className="
            flex-1 min-w-0 max-w-3xl pointer-events-auto
            flex flex-col
            bg-[var(--bg-card)]
            border border-[var(--border-main)]
            rounded-2xl
            shadow-2xl
            overflow-hidden
            max-h-[85vh]
            backdrop-blur-xl
          "
        >
          {/* FIXED HEADER */}
          <div className="relative shrink-0 p-6 border-b border-[var(--border-main)] flex justify-between items-start bg-[var(--bg-surface)]/80 z-10 select-none">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] leading-tight pr-8">
                {card.label}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono text-[var(--success)] bg-[var(--success)]/10 px-1.5 py-0.5 rounded border border-[var(--success)]/20">LIVE</span>
                <span className="text-sm text-[var(--text-muted)] border-l border-[var(--border-main)] pl-2">
                  {card.desc || `Fundamental ID: ${card.id}`}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="
                group
                absolute top-5 right-5
                w-8 h-8
                flex items-center justify-center
                rounded-full
                bg-[var(--glass-bg)]
                text-[var(--text-muted)]
                hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]
                hover:scale-105 active:scale-95
                transition-all duration-200
                border border-[var(--border-main)]
              "
            >
              <span className="group-hover:rotate-90 transition-transform duration-300">✕</span>
            </button>
          </div>

          {/* SCROLLABLE CONTENT (CHART AREA) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[url('/grid.svg')] bg-[length:20px_20px] bg-fixed">
            {/* ACTUAL CHART CONTAINER */}
            <div className="
              w-full min-h-[400px] h-[450px]
              border border-[var(--border-main)] rounded-xl 
              bg-gradient-to-b from-[var(--glass-bg)] to-transparent
              p-4 relative
              shadow-inner 
              group
            ">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--border-main)] to-transparent opacity-50" />

              <div className="w-full h-full rounded-lg overflow-hidden relative z-10">
                <FundamentalHistoryChart
                  trend={card.signal}
                  baseValue={card.raw}
                  label={card.label}
                />

                {/* WATERMARK */}
                <div className="
                  absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                  text-[var(--text-primary)] opacity-[0.03] text-7xl font-black tracking-[0.2em] 
                  pointer-events-none select-none
                  whitespace-nowrap blur-[1px] -z-10
                ">
                  STOCKY PRO
                </div>
              </div>
            </div>
          </div>

          {/* FIXED FOOTER */}
          <div className="shrink-0 p-5 border-t border-[var(--border-main)] bg-[var(--bg-surface)]/80 backdrop-blur-xl z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-[var(--text-muted)] uppercase tracking-wider mb-1">Raw Value</div>
                <div className="font-mono text-[var(--text-primary)] text-sm font-bold">
                  {card.raw} <span className="text-[10px] font-normal text-[var(--text-muted)]">{card.unit}</span>
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)] uppercase tracking-wider mb-1">Reliability</div>
                <div className={`font-medium ${relColor}`}>{relTier} ({relVal.toFixed(1)}/10)</div>
              </div>
              <div>
                <div className="text-[var(--text-muted)] uppercase tracking-wider mb-1">Impact Weight</div>
                <div className="font-mono text-[var(--text-primary)]">{(card.weight || 1).toFixed(2)}x</div>
              </div>
              <div>
                <div className="text-[var(--text-muted)] uppercase tracking-wider mb-1">Category</div>
                <div className="text-[var(--text-primary)]">{card.category}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ➡ RIGHT FLOAT: METRICS DESK (ACTION SIGNAL) */}
        <div className="hidden lg:block w-[240px] pointer-events-auto">
          <FundamentalMetricsDesk card={card} />
        </div>

      </div>
    </div>,
    document.body
  );
}
