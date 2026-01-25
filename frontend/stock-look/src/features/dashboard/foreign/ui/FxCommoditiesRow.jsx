import React from "react";

export default function FxCommoditiesRow({ fx, commodities }) {

    // Helper to get Pressure Tag
    const getPressureTag = (name) => {
        if (['Brent Crude', 'Gold'].includes(name)) return 'Inflation / Safe Haven';
        if (['Copper', 'Silver'].includes(name)) return 'Growth Proxy';
        return 'Macro Factor';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 1. FX & DOLLAR */}
            <div className="relative overflow-hidden bg-[#0f172a]/40 backdrop-blur-sm border border-slate-800/60 rounded-2xl flex flex-col shadow-sm">
                <div className="flex h-full flex-col p-6 space-y-6">

                    {/* HEADER */}
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Signal</div>
                            <div className="inline-block text-[10px] text-yellow-300 font-bold uppercase bg-yellow-950/30 px-3 py-1 rounded border border-yellow-500/20 tracking-wide">
                                {fx.dxy.signal}
                            </div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-right">Dollar & FX Pressure</div>
                    </div>

                    {/* BODY: DXY + FX Pairs */}
                    <div className="flex-1 space-y-6">
                        {/* DXY Dominant */}
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase mb-2 font-bold tracking-widest">DXY Index</div>
                            <div className="flex items-baseline gap-3">
                                <div className="text-5xl font-bold text-slate-100 tracking-tighter font-mono leading-none">{fx.dxy.value}</div>
                                <div className={`text-xs font-bold font-mono ${fx.dxy.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {fx.dxy.change >= 0 ? '+' : ''}{fx.dxy.change} <span className="text-slate-500 font-normal ml-1">({fx.dxy.trend})</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary FX Grid */}
                        <div className="grid grid-cols-3 gap-4 border-t border-slate-800/30 pt-4">
                            {fx.pairs.map((p, i) => (
                                <div key={i} className="text-left">
                                    <div className="text-[9px] text-slate-600 uppercase mb-0.5 font-bold tracking-widest">{p.pair}</div>
                                    <div className="text-xs font-bold text-slate-400 font-mono flex items-center gap-2">
                                        {p.value}
                                        <span className={`text-[9px] ${p.change >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                                            {p.change >= 0 ? '+' : ''}{p.change}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FOOTER: Interpretation */}
                    <div className="mt-auto border-t border-slate-800/50 pt-4">
                        <div className="text-[10px] text-slate-500 uppercase mb-2 font-bold tracking-widest">Interpretation</div>
                        <div className="text-sm font-bold text-slate-200 leading-snug break-words">
                            Dollar strength increases <span className="text-red-300 border-b border-red-500/20">EM funding pressure</span>.
                        </div>
                    </div>

                </div>
            </div>

            {/* 2. COMMODITIES */}
            <div className="relative overflow-hidden bg-[#0f172a]/40 backdrop-blur-sm border border-slate-800/60 rounded-2xl flex flex-col shadow-sm">
                <div className="flex h-full flex-col p-6 space-y-6">

                    {/* HEADER */}
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-right">Commodity Complex</div>

                    {/* BODY */}
                    <div className="flex-1 space-y-3">
                        {commodities.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-800/50 hover:border-slate-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-1 h-8 rounded-full ${item.trend === 'Bullish' ? 'bg-emerald-500' : item.trend === 'Bearish' ? 'bg-red-500' : 'bg-slate-500'}`} />
                                    <div>
                                        <div className="text-[9px] text-blue-300 font-bold uppercase tracking-widest mb-0.5">{getPressureTag(item.name)}</div>
                                        <div className="text-sm font-bold text-slate-200">{item.name}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-mono font-bold text-slate-400">{item.value}</div>
                                    <div className={`text-[10px] font-bold ${item.change >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                                        {item.change >= 0 ? '+' : ''}{item.change}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty Footer preserved for structure if needed, or omitted if no interpretation */}
                </div>
            </div>

        </div>
    );
}
