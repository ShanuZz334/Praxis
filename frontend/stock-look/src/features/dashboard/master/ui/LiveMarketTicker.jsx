import React from "react";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { useDashboardContext } from "@/shared/context/DashboardContext";

const TICKER_KEYS = [
    { key: "NSE_INDEX|India VIX", label: "INDIA VIX" },
    { key: "GLOBAL_INDICATOR|USDINR", label: "USDINR" },
    { key: "GLOBAL_INDICATOR|BZUSD", label: "BRENT CRUDE" }
];

const LiveMarketTicker = React.memo(function LiveMarketTicker({ livePrices: propLivePrices }) {
    const context = useDashboardContext();
    const livePrices = propLivePrices || context?.livePrices;

    return (
        <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="flex items-center text-text-secondary text-[11px] font-bold uppercase tracking-wider mr-2 hidden md:flex">
                <Activity className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                Live Market
            </div>
            {TICKER_KEYS.map(({ key, label }) => {
                const data = livePrices?.[key] || {};
                const ltp = data.ltp || 0;
                const pctChange = data.pctChange || 0;
                const netChange = data.netChange || 0;
                const isUp = netChange > 0;
                const isDown = netChange < 0;
                
                return (
                    <div 
                        key={key} 
                        className={`
                            px-3 py-1.5 rounded bg-background-card border border-border-default flex items-center gap-3 text-xs font-semibold tracking-wide shadow-sm
                        `}
                    >
                        <span className="text-text-primary">{label}</span>
                        
                        <div className={`flex items-center tabular-nums ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-text-secondary'}`}>
                            {ltp > 0 ? ltp.toFixed(2) : "---"}
                            {isUp && <ArrowUpRight className="w-3.5 h-3.5 ml-1" />}
                            {isDown && <ArrowDownRight className="w-3.5 h-3.5 ml-1" />}
                            {ltp > 0 && (
                                <span className="ml-2 text-[10px] bg-background-elevated px-1.5 py-0.5 rounded text-text-primary tabular-nums">
                                    {isUp ? '+' : ''}{pctChange.toFixed(2)}%
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

export default LiveMarketTicker;
