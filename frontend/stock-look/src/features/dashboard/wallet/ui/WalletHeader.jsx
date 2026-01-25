import React from "react";

export default function WalletHeader({ capital, riskRegime }) {
    const freeMarginPct = Math.round((capital.available / capital.total) * 100);

    // Risk Slider Visual Calculation
    // 0 = Low, 50 = Balanced, 100 = Aggressive
    const sliderPos = riskRegime.score;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#0b1220] border border-white/10 rounded-2xl p-6 shadow-2xl">

            {/* 1. CAPITAL SNAPSHOT */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Total Capital</div>
                        <div className="text-3xl font-bold text-white tracking-tighter">₹{capital.total.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Free Margin</div>
                        <div className={`text-xl font-bold ${freeMarginPct < 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {freeMarginPct}%
                        </div>
                    </div>
                </div>

                {/* Margin Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/40 uppercase">
                        <span>Used: ₹{capital.used.toLocaleString()}</span>
                        <span>Available: ₹{capital.available.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                        <div className="h-full bg-blue-500" style={{ width: `${100 - freeMarginPct}%` }} />
                        <div className="h-full bg-emerald-500/20" style={{ width: `${freeMarginPct}%` }} />
                    </div>
                </div>
            </div>

            {/* 2. RISK REGIME SLIDER */}
            <div className="flex flex-col justify-center px-4 border-l border-r border-white/5">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-xs font-bold text-white/40 uppercase tracking-wider">Risk Regime</div>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${riskRegime.label === 'Aggressive' ? 'text-red-400' :
                                riskRegime.label === 'Balanced' ? 'text-blue-300' : 'text-emerald-400'
                            }`}>{riskRegime.label}</span>
                        <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded">Conf: {riskRegime.confidence}%</span>
                    </div>
                </div>

                <div className="relative h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-red-500 rounded-full mt-2">
                    <div
                        className="absolute top-1/2 -mt-2 w-4 h-4 bg-white border-2 border-[#0b1220] rounded-full shadow-lg transition-all duration-500"
                        style={{ left: `${sliderPos}%` }}
                    />
                </div>
                <div className="flex justify-between text-[9px] text-white/20 mt-2 uppercase font-bold">
                    <span>Conservative</span>
                    <span>Balanced</span>
                    <span>Aggressive</span>
                </div>
            </div>

            {/* 3. DATA INTEGRITY */}
            <div className="flex flex-col justify-center pl-4 space-y-3">
                <IntegrityRow label="Broker Sync" value="Active" status="good" />
                <IntegrityRow label="Margin Update" value="Real-time" status="good" />
                <IntegrityRow label="Last Recalc" value="1 min ago" status="neutral" />
            </div>

        </div>
    );
}

function IntegrityRow({ label, value, status }) {
    const color = status === 'good' ? 'text-emerald-400' : status === 'bad' ? 'text-red-400' : 'text-white/60';
    const dot = status === 'good' ? 'bg-emerald-500' : status === 'bad' ? 'bg-red-500' : 'bg-slate-500';

    return (
        <div className="flex justify-between items-center text-xs">
            <span className="text-white/40 font-medium uppercase tracking-wide">{label}</span>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
                <span className={`font-mono ${color}`}>{value}</span>
            </div>
        </div>
    );
}
