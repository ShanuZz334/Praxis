import React, { useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { DayTradeOverview } from './DayTradeOverview';
import { DayJournalEditor } from './DayJournalEditor';
import dayjs from 'dayjs';

export function DayPanel({ date, dayData, onClose }) {
  // Prevent body scroll while panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!date) return null;

  const formattedDate = dayjs(date).format('dddd, MMMM D, YYYY');
  const pnl          = dayData?.pnl ?? 0;
  const isPositive   = pnl >= 0;
  const tradeCount   = dayData?.tradesCount ?? 0;

  return (
    // Panel — no internal backdrop; JournalPage provides the overlay
    <div className="h-full flex flex-col bg-background-surface">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-background-card shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Icon badge */}
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>

          {/* Date + meta */}
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">{formattedDate}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                pnl > 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : pnl < 0
                    ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                    : 'bg-white/5 text-text-tertiary border border-border-default'
              }`}>
                {pnl >= 0 ? '+' : '-'}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-text-tertiary bg-white/5 border border-border-default px-2 py-0.5 rounded-full">
                {tradeCount} {tradeCount === 1 ? 'Trade' : 'Trades'}
              </span>
            </div>
          </div>
        </div>

        {/* ✕ Close — always visible, correct z-layer */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-white/8 border border-transparent hover:border-border-default transition-all duration-200 cursor-pointer"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Scrollable Body ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
        {/* Trade Overview */}
        <div className="animate-in slide-in-from-right-4 duration-400">
          <DayTradeOverview date={date} />
        </div>

        {/* Journal Editor */}
        <div className="flex-1 flex flex-col min-h-[400px] animate-in slide-in-from-right-8 duration-600">
          <DayJournalEditor date={date} />
        </div>
      </div>
    </div>
  );
}
