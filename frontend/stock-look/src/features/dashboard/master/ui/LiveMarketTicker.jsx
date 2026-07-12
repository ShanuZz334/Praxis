import React, { useEffect, useState } from "react";
import socket from "@/shared/utils/socket";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

export default function LiveMarketTicker() {
    const [prices, setPrices] = useState({
        "NSE_INDEX|Nifty 50": { ltp: 0, prev: 0, status: 'neutral' },
        "NSE_INDEX|Nifty Bank": { ltp: 0, prev: 0, status: 'neutral' },
        "NSE_EQ|RELIANCE": { ltp: 0, prev: 0, status: 'neutral' }
    });

    useEffect(() => {
        const handleUpdate = ({ instrumentKey, data }) => {
            setPrices(prev => {
                const oldLtp = prev[instrumentKey]?.ltp || 0;
                const newLtp = data.ltp;
                
                if (oldLtp === newLtp) return prev;

                let status = 'neutral';
                if (oldLtp > 0) {
                    status = newLtp > oldLtp ? 'up' : 'down';
                }

                return {
                    ...prev,
                    [instrumentKey]: { ltp: newLtp, prev: oldLtp, status }
                };
            });
        };

        socket.on("market:update", handleUpdate);
        return () => socket.off("market:update", handleUpdate);
    }, []);

    const formatName = (key) => {
        if (key.includes("Nifty 50")) return "NIFTY 50";
        if (key.includes("Nifty Bank")) return "BANKNIFTY";
        if (key.includes("RELIANCE")) return "RELIANCE";
        return key;
    };

    return (
        <div className="flex flex-wrap items-center gap-4 py-2 border-b border-white/5 mb-6">
            <div className="flex items-center text-slate-400 text-sm font-medium mr-2">
                <Activity className="w-4 h-4 mr-2 text-indigo-400" />
                LIVE FEED
            </div>
            {Object.entries(prices).map(([key, data]) => {
                const isUp = data.status === 'up';
                const isDown = data.status === 'down';
                
                return (
                    <div 
                        key={key} 
                        className={`
                            px-4 py-1.5 rounded-md flex items-center gap-3 text-sm font-semibold tracking-wide transition-colors duration-300
                            ${isUp ? "bg-emerald-500/10 text-emerald-400" : ""}
                            ${isDown ? "bg-rose-500/10 text-rose-400" : ""}
                            ${data.status === 'neutral' ? "bg-white/5 text-slate-300" : ""}
                        `}
                    >
                        <span className="text-slate-200">{formatName(key)}</span>
                        
                        <div className="flex items-center">
                            {data.ltp > 0 ? data.ltp.toFixed(2) : "---"}
                            {isUp && <ArrowUpRight className="w-4 h-4 ml-1" />}
                            {isDown && <ArrowDownRight className="w-4 h-4 ml-1" />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
