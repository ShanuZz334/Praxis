import React from 'react';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { Zap } from 'lucide-react';

export default function VolumeShockers() {
    const { smartlists } = useDashboardContext();

    if (!smartlists || !smartlists.options) {
        return (
            <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full opacity-50">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-warning-500" />
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Volume Shockers</h3>
                </div>
                <p className="text-[11px] text-text-secondary">Waiting for active options...</p>
            </div>
        );
    }

    // Extract MOST_ACTIVE category
    let activeOpts = [];
    if (Array.isArray(smartlists.options)) {
        activeOpts = smartlists.options.filter(i => i.category === 'MOST_ACTIVE');
    } else if (smartlists.options.MOST_ACTIVE) {
        activeOpts = smartlists.options.MOST_ACTIVE;
    }

    // Format Trading Symbol
    const formatTradingSymbol = (sym) => {
        if (!sym) return 'Unknown';
        const matchOpt = sym.match(/^([A-Z]+)(\d{2}[A-Z]{3}|\d{5}|\d{2}[A-Z]\d{2})([\d\.]+)?(CE|PE|FUT)$/i);
        if (matchOpt) {
            return matchOpt.slice(1).filter(Boolean).join('-');
        }
        return sym;
    };

    return (
        <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-warning-500 fill-warning-500" />
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Most Active</h3>
                </div>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
                {activeOpts.length === 0 ? (
                    <div className="text-[10px] text-text-tertiary px-2">No highly active contracts found</div>
                ) : activeOpts.map((item, i) => {
                    const rawSymbol = item.trading_symbol || item.instrument_key;
                    const displaySymbol = formatTradingSymbol(rawSymbol);
                    const isCall = displaySymbol.endsWith('CE');
                    
                    return (
                        <div key={i} className="flex items-center justify-between bg-background-elevated px-2.5 py-2 rounded text-[10.5px]">
                            <span className={`font-semibold truncate mr-2 flex-1 ${isCall ? 'text-emerald-400' : 'text-rose-400'}`} title={displaySymbol}>
                                {displaySymbol}
                            </span>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-text-secondary font-medium">&#8377;{item.price?.current || item.ltp || 0}</span>
                                <span className={item.metric?.change_pct > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                    {item.metric?.change_pct > 0 ? '+' : ''}
                                    {(item.metric?.change_pct || item.pct_change || 0).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
