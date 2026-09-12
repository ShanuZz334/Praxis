import React, { useEffect, useCallback } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { DayTradeOverview } from './DayTradeOverview';
import { DayJournalEditor } from './DayJournalEditor';
import dayjs from 'dayjs';

export function DayPanel({ date, dayData, onClose, onNavigateDate }) {
  // Prevent body scroll while panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handlePrevDay = useCallback(() => {
    if (onNavigateDate && date) {
      const prev = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
      onNavigateDate(prev);
    }
  }, [date, onNavigateDate]);

  const handleNextDay = useCallback(() => {
    if (onNavigateDate && date) {
      const next = dayjs(date).add(1, 'day').format('YYYY-MM-DD');
      onNavigateDate(next);
    }
  }, [date, onNavigateDate]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
        if (e.key === 'ArrowLeft') handlePrevDay();
        if (e.key === 'ArrowRight') handleNextDay();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, handlePrevDay, handleNextDay]);

  if (!date) return null;

  const dayObj = dayjs(date);
  const formattedDate = dayObj.format('dddd, MMMM D, YYYY');
  const monthAbbr = dayObj.format('MMM').toUpperCase();
  const dayNum = dayObj.format('D');
  
  const state = dayData?.state || 'no-trade';
  const isHoliday = state === 'holiday';
  const isOffDay = state === 'weekend' || isHoliday;
  const pnl = dayData?.pnl ?? 0;
  const isPositive = pnl > 0;
  const isNegative = pnl < 0;
  const tradeCount = dayData?.tradesCount ?? 0;

  return (
    <div className="h-full flex flex-col bg-background-app dark:bg-[#050811] text-text-primary select-text">
      {/* ── Institutional Frosted Header ─────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-default/50 bg-white/90 dark:bg-background-card/90 backdrop-blur-2xl shrink-0 z-20 shadow-xs relative">
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 right-1/4 w-72 h-12 rounded-full blur-3xl pointer-events-none opacity-10 dark:opacity-20 ${
          isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-blue-500'
        }`} />

        <div className="flex items-center gap-4 min-w-0">
          {/* Calendar Badge */}
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-background-elevated dark:to-background-surface border border-border-default flex flex-col items-center justify-center shrink-0 shadow-sm">
            <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 tracking-wider leading-none uppercase">{monthAbbr}</span>
            <span className="text-base font-black text-text-primary leading-tight font-mono">{dayNum}</span>
          </div>

          {/* Date & Session Meta */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight truncate leading-tight">
                {formattedDate}
              </h2>

              {/* Day Paging Controls */}
              {onNavigateDate && (
                <div className="flex items-center gap-0.5 ml-1 bg-white/80 dark:bg-background-elevated/80 border border-border-default/60 rounded-lg p-0.5 shrink-0 shadow-xs">
                  <button
                    onClick={handlePrevDay}
                    className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    title="Previous Day (←)"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNextDay}
                    className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    title="Next Day (→)"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Micro Session Badges */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {isHoliday ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                  Market Holiday
                </span>
              ) : isOffDay ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Weekend Review
                </span>
              ) : (
                <>
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 ${
                    isPositive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : isNegative
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                        : 'bg-white dark:bg-background-elevated text-text-secondary border border-border-default'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isPositive ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : isNegative ? 'bg-rose-500 dark:bg-rose-400' : 'bg-text-tertiary'
                    }`} />
                    {pnl >= 0 ? '+' : '-'}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>

                  <span className="text-[10px] font-semibold text-text-secondary bg-white/80 dark:bg-background-elevated/60 border border-border-default px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Activity className="w-3 h-3 text-text-tertiary" />
                    {tradeCount} {tradeCount === 1 ? 'Execution' : 'Executions'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/8 border border-transparent hover:border-border-default transition-all duration-200 cursor-pointer shrink-0 ml-2"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Scrollable Body ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6 flex flex-col gap-5 custom-scrollbar">
        {/* Trade Overview */}
        {!isOffDay && (
          <div className="animate-in fade-in slide-in-from-right-3 duration-300">
            <DayTradeOverview date={date} />
          </div>
        )}

        {/* Journal Editor */}
        {isHoliday ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-background-card/80 backdrop-blur-xl rounded-2xl border border-border-default/60 shadow-lg my-auto">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-3 shadow-inner">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-1">National Market Holiday</h3>
            <p className="text-xs text-text-secondary max-w-sm">
              Markets were officially closed for <strong>{dayData?.holidayReason || 'Holiday'}</strong>. Zero executions were processed.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-[460px] animate-in fade-in slide-in-from-right-4 duration-400">
            <DayJournalEditor date={date} isOffDay={isOffDay} />
          </div>
        )}
      </div>
    </div>
  );
}
