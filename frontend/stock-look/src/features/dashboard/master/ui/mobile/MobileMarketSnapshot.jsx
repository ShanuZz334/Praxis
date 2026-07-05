import React from "react";

const mockData = [
    { label: "NIFTY 50", value: "24,725.80", change: "+0.58%", isPos: true },
    { label: "BANK NIFTY", value: "51,148.35", change: "+0.42%", isPos: true },
    { label: "INDIA VIX", value: "13.24", change: "-1.23%", isPos: false },
    { label: "PCR (NIFTY)", value: "0.92", status: "Neutral", color: "#F59E0B" },
    { label: "ADV / DEC", value: "1.86", status: "Advance", color: "#4ADE80" },
    { label: "FII (Cash)", value: "+1,243 Cr", status: "Buy", color: "#4ADE80" },
    { label: "DII (Cash)", value: "+2,156 Cr", status: "Buy", color: "#4ADE80" },
    { label: "MARKET BREADTH", value: "68%", status: "Positive", color: "#4ADE80" }
];

export default function MobileMarketSnapshot() {
    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-[#F8FAFC] text-[13px] font-semibold tracking-wider">MARKET SNAPSHOT</h3>
                <button className="text-[#1E1BFF] text-[11px] font-medium hover:underline">View all</button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 overflow-x-auto pb-2 custom-scrollbar-hidden snap-x snap-mandatory">
                {mockData.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="bg-[#111827] rounded-2xl p-3 border border-[rgba(255,255,255,0.06)] min-w-[100px] flex-shrink-0 snap-center">
                        <div className="text-[#94A3B8] text-[9px] uppercase tracking-wider mb-2">{item.label}</div>
                        <div className="text-white text-[15px] font-bold mb-1">{item.value}</div>
                        {item.change ? (
                            <div className={`text-[10px] font-medium ${item.isPos ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>
                                {item.change}
                            </div>
                        ) : (
                            <div className="text-[10px] font-medium" style={{ color: item.color }}>
                                {item.status}
                            </div>
                        )}
                        {/* Fake mini sparkline */}
                        <div className="mt-2 h-4 w-full flex items-end">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
                                <path 
                                    d={item.isPos ? "M0 20 L20 15 L40 18 L60 10 L80 12 L100 5" : "M0 5 L20 10 L40 8 L60 15 L80 12 L100 20"} 
                                    fill="none" 
                                    stroke={item.change ? (item.isPos ? "#4ADE80" : "#EF4444") : item.color} 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-4 gap-2 overflow-x-auto custom-scrollbar-hidden snap-x snap-mandatory mt-1">
                {mockData.slice(4).map((item, idx) => (
                    <div key={idx} className="bg-[#111827] rounded-2xl p-3 border border-[rgba(255,255,255,0.06)] min-w-[100px] flex-shrink-0 snap-center">
                        <div className="text-[#94A3B8] text-[9px] uppercase tracking-wider mb-2">{item.label}</div>
                        <div className="text-white text-[15px] font-bold mb-1">{item.value}</div>
                        <div className="text-[10px] font-medium" style={{ color: item.color }}>
                            {item.status}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
