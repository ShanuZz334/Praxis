import React from "react";

export default function VolatilityRatesPanel({ volatility, rates }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 1. VOLATILITY & CREDIT */}
            <div className="relative overflow-hidden bg-[#0f172a]/40 backdrop-blur-sm border border-slate-800/60 rounded-2xl flex flex-col shadow-sm">
                <div className="flex h-full flex-col p-6 space-y-6">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</div>
                            <div className="inline-block text-[10px] text-emerald-300 font-bold uppercase bg-emerald-950/30 px-3 py-1 rounded border border-emerald-500/20 tracking-wide">
                                {volatility.creditSpreads.signal}
                            </div>
                            {/* Anomaly Detector Simulator */}
                            {volatility.vix.value > 20 && <div className="mt-2 text-[10px] text-red-300 font-bold uppercase tracking-wide animate-pulse">! High Stress Detected</div>}
                        </div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-right">Volatility & Credit</div>
                    </div>

                    {/* Metrics Body */}
                    <div className="grid grid-cols-3 gap-4 flex-1">
                        <MetricBox label="VIX" value={volatility.vix.value} sub={volatility.vix.regime} delta={volatility.vix.change} />
                        <MetricBox label="VIX9D" value={volatility.vix9d.value} sub="Short-Term" delta={volatility.vix9d.change} />
                        <MetricBox label="VVIX" value={volatility.vvix.value} sub="Vol of Vol" delta={volatility.vvix.change} />
                    </div>

                    {/* Footer - Anchored */}
                    <div className="mt-auto pt-4 border-t border-slate-800/50 grid grid-cols-2 gap-6">
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase mb-1 font-semibold tracking-wider">HY Spreads</div>
                            <span className="text-base text-slate-300 font-mono">{volatility.creditSpreads.hy} <span className="text-[10px] text-slate-600">bps</span></span>
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase mb-1 font-semibold tracking-wider">IG Spreads</div>
                            <span className="text-base text-slate-300 font-mono">{volatility.creditSpreads.ig} <span className="text-[10px] text-slate-600">bps</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. RATES & LIQUIDITY */}
            <div className="relative overflow-hidden bg-[#0f172a]/40 backdrop-blur-sm border border-slate-800/60 rounded-2xl flex flex-col shadow-sm">
                <div className="flex h-full flex-col p-6 space-y-6">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Curve Shape</div>
                            {/* Anomaly Tag for Curve */}
                            <div className={`inline-block text-[10px] font-bold uppercase px-3 py-1 rounded border tracking-wide ${rates.us10y.shape.includes('Inverted') ? 'bg-red-950/30 text-red-300 border-red-500/20' : 'bg-green-950/30 text-green-300 border-green-500/20'}`}>
                                {rates.us10y.shape}
                            </div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-right">US Yields & Liquidity</div>
                    </div>

                    {/* Metrics Body */}
                    <div className="grid grid-cols-3 gap-4 flex-1">
                        <MetricBox label="US 2Y" value={`${rates.us2y.value}%`} sub="Fed Policy Proxy" delta={rates.us2y.change} color="text-yellow-100/90" />
                        <MetricBox label="US 10Y" value={`${rates.us10y.value}%`} sub="Global Benchmark" delta={rates.us10y.change} color="text-yellow-100/90" />
                        <MetricBox label="Real Yield" value={`${rates.realYield.value}%`} sub="Restrictive" color="text-blue-200/90" />
                    </div>

                    {/* Footer - Anchored */}
                    <div className="mt-auto pt-4 border-t border-slate-800/50">
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Implication</div>
                            <div className="text-sm font-bold text-slate-200 break-words leading-snug">
                                {rates.us10y.value > 4.2 ? "⚠️ Tech & Private Banks Headwind" : "✅ Supportive for Equity Valuations"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

function MetricBox({ label, value, sub, delta, color = "text-slate-200" }) {
    return (
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3 flex flex-col justify-between h-full min-w-0">
            <div className="text-[10px] text-slate-500 uppercase mb-2 font-bold tracking-wider truncate">{label}</div>
            <div>
                <div className={`text-xl xl:text-2xl font-bold font-mono tracking-tight ${color}`}>{value}</div>
                <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end mt-1 gap-0.5">
                    <span className="text-[9px] text-slate-500 uppercase font-medium leading-tight">{sub}</span>
                    {delta !== undefined && (
                        <span className={`text-[9px] font-bold ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {delta > 0 ? '+' : ''}{delta}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
