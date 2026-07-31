import React from 'react';

// Today's date string in YYYY-MM-DD format (computed once)
const TODAY = new Date().toISOString().slice(0, 10);

export default function CalendarDay({ date, dayData, dayNum, onClick }) {
  const { state, pnl, holidayReason } = dayData || { state: 'no-trade' };
  const isToday = date === TODAY;

  let styles      = '';
  let textStyles  = '';
  let tooltipText = '';

  // ── Today gets its own treatment (blue filled square) ────────────
  if (isToday) {
    styles     = 'bg-blue-500 border-2 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)] hover:bg-blue-400 hover:shadow-[0_0_18px_rgba(59,130,246,0.8)] rounded-md';
    textStyles = 'text-[9px] font-mono font-black text-white';
    tooltipText = state === 'profit' ? `Today · Profit`
                : state === 'loss'   ? `Today · Loss`
                : 'Today';
  } else if (state === 'profit') {
    styles     = 'rounded-full bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:bg-emerald-500/30 hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]';
    textStyles = 'text-[10px] font-mono font-bold text-emerald-400 group-hover/day:text-emerald-300 transition-colors duration-300';
    tooltipText = `Profit`;
  } else if (state === 'loss') {
    styles     = 'rounded-full bg-red-500/20 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:bg-red-500/30 hover:border-red-400/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]';
    textStyles = 'text-[10px] font-mono font-bold text-red-400 group-hover/day:text-red-300 transition-colors duration-300';
    tooltipText = `Loss`;
  } else if (state === 'holiday') {
    styles     = 'rounded-full bg-amber-500/10 border border-amber-500/20 cursor-default shadow-[0_0_8px_rgba(245,158,11,0.1)] hover:bg-amber-500/20 hover:border-amber-500/40';
    textStyles = 'text-[9px] font-mono font-bold text-amber-500/70 group-hover/day:text-amber-400 transition-colors duration-300';
    tooltipText = `Holiday: ${holidayReason}`;
  } else if (state === 'weekend') {
    styles     = 'rounded-full bg-transparent cursor-default';
    textStyles = 'text-[9px] font-mono text-text-tertiary opacity-30';
    tooltipText = 'Weekend';
  } else {
    // no-trade — neutral, light border, blue on hover
    styles     = 'rounded-full bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] hover:bg-black/[0.05] dark:hover:bg-white/[0.1] hover:border-blue-400/40 dark:hover:border-blue-400/30';
    textStyles = 'text-[9px] font-mono text-text-secondary opacity-80 group-hover/day:!text-blue-500 group-hover/day:opacity-100 transition-colors duration-300';
    tooltipText = 'No Trades Recorded';
  }

  const isClickable = state !== 'holiday' && state !== 'weekend';

  return (
    <div
      className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center relative group/day transition-all duration-300 ${styles} ${isClickable ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
      onClick={() => isClickable && onClick && onClick()}
    >
      <span className={textStyles}>{dayNum}</span>

      {/* ── Tooltip ───────────────────────────────────────────── */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-background-card border border-border-default text-text-primary text-[10px] whitespace-nowrap rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.4)] opacity-0 invisible group-hover/day:opacity-100 group-hover/day:visible transition-all duration-200 z-[100] pointer-events-none flex flex-col gap-1 min-w-[130px]">

        {isToday && (
          <div className="flex items-center gap-1.5 mb-1 border-b border-border-default pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            <span className="font-bold text-blue-400 text-[10px]">Today</span>
          </div>
        )}

        {(state === 'profit' || state === 'loss') ? (
          <>
            <div className="flex justify-between items-center gap-4 mb-1 border-b border-white/5 pb-1">
              <span className="text-text-secondary font-semibold">{state === 'profit' ? 'Net Profit' : 'Net Loss'}</span>
              <span className={`font-bold font-mono ${state === 'profit' ? 'text-emerald-400' : 'text-red-400'}`}>
                {state === 'profit' ? '+' : '-'}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-text-tertiary">Trades</span>
              <span className="font-mono text-text-secondary">{dayData?.tradesCount ?? 0}</span>
            </div>
          </>
        ) : (
          <div className="text-center font-medium text-text-secondary py-1">{tooltipText}</div>
        )}

        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-border-default" />
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[5px] border-transparent border-t-background-card" />
      </div>
    </div>
  );
}
