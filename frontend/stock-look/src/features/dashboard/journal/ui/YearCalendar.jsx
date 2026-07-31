import React from 'react';
import CalendarDay from './CalendarDay';
import { useJournalCalendar } from '../data/useJournalCalendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function MonthCalendar({ year, month, dayMap, onDayClick }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday

  // We'll pad with empty cells for days before the 1st
  const padding = Array.from({ length: firstDay }).map((_, i) => (
    <div key={`pad-${i}`} className="w-5 h-5 sm:w-6 sm:h-6" />
  ));

  const days = Array.from({ length: daysInMonth }).map((_, i) => {
    const day = i + 1;
    // Format YYYY-MM-DD
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = dayMap[dateStr];

    return (
      <div key={dateStr} className="flex justify-center items-center">
        <CalendarDay date={dateStr} dayData={dayData} dayNum={day} onClick={() => onDayClick && onDayClick(dateStr, dayData)} />
      </div>
    );
  });

  return (
    <div className="relative flex flex-col mb-4 p-4 md:p-5 bg-background-card border border-border-default rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-white/10 transition-all duration-300 group">
      {/* Inner Glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <h3 className="text-sm font-bold text-text-primary tracking-wide mb-3 flex items-center justify-between">
          <span>{MONTHS[month]}</span>
          <span className="text-[10px] text-text-tertiary font-mono">{year}</span>
        </h3>
        
        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={`header-${i}`} className="text-[10px] text-center text-text-tertiary font-bold uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>
        
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {padding}
          {days}
        </div>
      </div>
    </div>
  );
}

export default function YearCalendar({ year, dayMap, loading, error, onDayClick, onYearChange }) {
  const targetYear = year || new Date().getFullYear();
  const [mockOverrides, setMockOverrides] = React.useState({});

  const injectMock = (type) => {
    const today = new Date();
    // Pick the 15th for profit and 16th for loss
    const dateStr = `${targetYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${type === 'profit' ? '15' : '16'}`;
    setMockOverrides(prev => ({
      ...prev,
      [dateStr]: { 
        state: type, 
        pnl: type === 'profit' ? 450.50 : -125.00,
        tradesCount: 3
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-text-secondary font-mono text-sm animate-pulse">Synchronizing Market Data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center backdrop-blur-sm">
        <p className="text-red-400 font-medium">Failed to load calendar data.</p>
        <p className="text-red-400/60 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const mergedDayMap = { ...dayMap, ...mockOverrides };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Trading Journal</h2>
          <p className="text-text-secondary text-sm mt-1">Select any highlighted day to review your execution.</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Debug Buttons */}
          <button 
            onClick={() => injectMock('profit')}
            className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold hover:bg-emerald-500/30 transition-colors"
          >
            Mock Profit
          </button>
          <button 
            onClick={() => injectMock('loss')}
            className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold hover:bg-red-500/30 transition-colors"
          >
            Mock Loss
          </button>
          
          {/* Year Controller */}
          <div className="flex items-center bg-background-card border border-border-default rounded-full shadow-sm ml-4 overflow-hidden">
            <button 
              onClick={() => onYearChange && onYearChange(targetYear - 1)}
              className="px-2 py-1.5 hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-3 py-1.5 text-sm font-mono font-bold text-text-primary">
              {targetYear}
            </div>
            <button 
              onClick={() => onYearChange && onYearChange(targetYear + 1)}
              className="px-2 py-1.5 hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 12 }).map((_, monthIndex) => (
          <MonthCalendar 
            key={`month-${monthIndex}`} 
            year={targetYear} 
            month={monthIndex} 
            dayMap={mergedDayMap} 
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
}
