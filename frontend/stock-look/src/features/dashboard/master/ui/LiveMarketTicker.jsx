import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useDashboardContext } from "@/shared/context/DashboardContext";

const TICKER_KEYS = [
    { key: "NSE_INDEX|India VIX", label: "INDIA VIX", prefix: "", suffix: "" },
    { key: "GLOBAL_INDICATOR|USDINR", label: "USDINR", prefix: "$", suffix: "" },
    { key: "GLOBAL_INDICATOR|BZUSD", label: "BRENT CRUDE", prefix: "$", suffix: "" },
    { key: "GLOBAL_INDICATOR|DXY", label: "DXY", prefix: "", suffix: "" },
    { key: "GLOBAL_INDICATOR|US10Y", label: "US 10Y", prefix: "", suffix: "%" },
    { key: "GLOBAL_INDEX|SGX NIFTY", label: "GIFT NIFTY", prefix: "", suffix: "" }
];

const GLOBAL_KEY_MAP = {
    "GLOBAL_INDICATOR|USDINR": "usd_inr",
    "GLOBAL_INDICATOR|BZUSD": "crude",
    "GLOBAL_INDICATOR|DXY": "dxy",
    "GLOBAL_INDICATOR|US10Y": "us_10y_yield"
};

const formatLtp = (val) => {
    if (!val || val <= 0) return "---";
    if (val >= 1000) {
        return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toFixed(2);
};

const LiveMarketTicker = React.memo(function LiveMarketTicker({ livePrices: propLivePrices }) {
    const context = useDashboardContext();
    const livePrices = propLivePrices || context?.livePrices;
    const globalData = context?.globalData || {};

    const getDisplayData = (key) => {
        const globalField = GLOBAL_KEY_MAP[key];
        if (globalField) {
            const item = globalData[globalField] || {};
            const val = Number(item.value || livePrices?.[key]?.ltp || 0);
            const pct = Number(item.pctChange ?? livePrices?.[key]?.pctChange ?? 0);
            const net = Number(item.netChange ?? livePrices?.[key]?.netChange ?? (pct && val ? (val * pct) / 100 : 0));
            return { ltp: val, netChange: net, pctChange: pct };
        }
        return livePrices?.[key] || livePrices?.[key.replace('|', ':')] || {};
    };

    return (
        <div className="flex items-center gap-2 w-full flex-nowrap overflow-x-auto no-scrollbar py-0.5">
            {TICKER_KEYS.map(({ key, label, prefix = "", suffix = "" }) => {
                const data = getDisplayData(key);
                const ltp = Number(data.ltp) || 0;
                const pctChange = Number(data.pctChange) || 0;
                const netChange = Number(data.netChange) || (pctChange && ltp ? (ltp * pctChange) / 100 : 0);
                const isUp = netChange > 0 || pctChange > 0;
                const isDown = netChange < 0 || pctChange < 0;
                const formattedLtp = formatLtp(ltp);
                
                return (
                    <div 
                        key={key} 
                        className="px-2.5 py-1.5 rounded bg-background-card border border-border-default flex items-center gap-2 text-xs font-semibold tracking-wide shadow-sm shrink-0 whitespace-nowrap"
                    >
                        <span className="text-text-primary text-[11px] font-bold">{label}</span>
                        
                        <div className={`flex items-center tabular-nums ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-text-secondary'}`}>
                            {ltp > 0 ? `${prefix}${formattedLtp}${suffix}` : "---"}
                            {isUp && <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />}
                            {isDown && <ArrowDownRight className="w-3.5 h-3.5 ml-0.5" />}
                            {ltp > 0 && pctChange !== 0 && (
                                <span className={`ml-1.5 text-[10px] bg-background-elevated px-1.5 py-0.5 rounded tabular-nums font-semibold ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-text-secondary'}`}>
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
