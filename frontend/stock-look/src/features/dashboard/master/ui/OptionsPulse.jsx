import React from 'react';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';

export default function OptionsPulse() {
    const { smartlists } = useDashboardContext();

    if (!smartlists || (Object.keys(smartlists).length === 0)) {
        return (
            <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full opacity-50">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Options Pulse</h3>
                </div>
                <p className="text-[11px] text-text-secondary">{smartlists && Object.keys(smartlists).length === 0 ? "No smartlists data available (market closed)." : "Waiting for smartlists..."}</p>
            </div>
        );
    }

    // Attempt to extract some key signals
    const extractList = (source, category) => {
        if (Array.isArray(source)) {
            return source.filter(i => i.category === category);
        }
        if (source && typeof source === 'object' && source[category]) {
            return source[category];
        }
        if (Array.isArray(source)) return source;
        return [];
    };

    const oiGainers = extractList(smartlists.options, 'OI_GAINERS');
    const ivSurge = extractList(smartlists.options, 'IV_GAINERS');
    const premium = extractList(smartlists.futures, 'PREMIUM');

    // Helper to format symbols like NSE_FO|RELIANCE24JUL2900CE (if trading_symbol is missing)
    const formatSymbol = (key) => {
        if (!key) return "Unknown";
        const parts = key.split('|');
        let sym = parts[parts.length - 1];
        if (sym.length > 20) sym = sym.substring(0, 20) + '..';
        return sym;
    };

    // Helper to inject hyphens for readability (e.g., BANKNIFTY26SEPFUT -> BANKNIFTY-26SEP-FUT)
    const formatTradingSymbol = (sym) => {
        if (!sym) return "Unknown";
        const matchOpt = sym.match(/^([A-Z]+)(\d{2}[A-Z]{3}|\d{5}|\d{2}[A-Z]\d{2})([\d\.]+)?(CE|PE|FUT)$/i);
        if (matchOpt) {
            return matchOpt.slice(1).filter(Boolean).join('-');
        }
        return sym;
    };

    const renderList = (title, items, icon, color) => (
        <div className="mb-4 last:mb-0">
            <div className="flex items-center gap-1.5 mb-2 sticky top-0 bg-background-card z-10 py-1">
                {icon}
                <span className="text-[11px] font-bold text-text-secondary uppercase">{title}</span>
            </div>
            <div className="space-y-1.5">
                {items.length === 0 ? (
                    <div className="text-[10px] text-text-tertiary px-2">No signals found</div>
                ) : items.map((item, i) => {
                    const rawSymbol = item.trading_symbol || formatSymbol(item.instrument_key || item.symbol);
                    const displaySymbol = formatTradingSymbol(rawSymbol);
                    
                    return (
                        <div key={i} className="flex items-center justify-between bg-background-elevated px-2.5 py-2 rounded text-[10.5px]">
                            <span className="font-semibold text-text-primary truncate mr-2 flex-1" title={displaySymbol}>
                                {displaySymbol}
                            </span>
                            <div className="flex flex-col items-end shrink-0">
                            <span className="text-text-secondary font-medium">₹{item.price?.current || item.ltp || 0}</span>
                            <span className={item.price?.change_pct > 0 ? color : color.replace('400', '400')}>
                                {item.price?.change_pct > 0 ? '+' : ''}
                                {(item.price?.change_pct || item.pct_change || 0).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full shadow-sm overflow-y-auto custom-scrollbar">
            <div className="mb-4">
                <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Options Pulse</h3>
                <p className="text-[11px] text-text-secondary">Smartlist Signals</p>
            </div>
            
            <div className="flex-1 space-y-4">
                {renderList("OI Surge", oiGainers, <TrendingUp size={12} className="text-blue-400" />, "text-blue-400")}
                {renderList("IV Expansion", ivSurge, <Activity size={12} className="text-purple-400" />, "text-purple-400")}
                {renderList("Futures Premium", premium, <AlertTriangle size={12} className="text-amber-400" />, "text-amber-400")}
            </div>
        </div>
    );
}
