import React from "react";
import { FiBriefcase, FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const MarketTicker = () => {
    // Mock data - would come from context/store in real app
    const marketData = [
        { symbol: "NIFTY 50", value: "21,456.70", change: "+0.45%", isUp: true },
        { symbol: "BANKNIFTY", value: "47,890.15", change: "-0.12%", isUp: false },
        { symbol: "SENSEX", value: "71,500.30", change: "+0.38%", isUp: true },
        { symbol: "VIX", value: "13.45", change: "-1.20%", isUp: false },
    ];

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#02050e]/95 backdrop-blur-md border-b border-white/5 md:hidden">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 px-4 whitespace-nowrap mask-linear-fade">
                {/* Live Pulse */}
                <div className="flex items-center gap-2 pr-2 border-r border-white/10">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-green-400 tracking-wider">LIVE</span>
                </div>

                {marketData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-300">{item.symbol}</span>
                        <span className={`text-xs font-mono font-medium ${item.isUp ? "text-green-400" : "text-red-400"}`}>
                            {item.value}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.isUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                            {item.change}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketTicker;
