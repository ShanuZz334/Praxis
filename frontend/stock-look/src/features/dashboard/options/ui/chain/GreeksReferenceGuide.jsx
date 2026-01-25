import React from 'react';

export default function GreeksReferenceGuide() {
    return (
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
            <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-2 sticky top-0 bg-[#0b1220] py-1 z-10 border-b border-white/5">
                How to Read Option Greeks
            </div>

            {/* DELTA */}
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-blue-400 font-bold uppercase">Delta</span>
                    <span className="text-[9px] text-white/40">Direction Sensitivity</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-white/70 leading-relaxed">
                    <p><strong className="text-white/40">Means:</strong> Change in option price for ₹1 move in underlying.</p>
                    <div className="grid grid-cols-[auto_1fr] gap-2 text-[9px]">
                        <span className="text-white/30">0.20</span> <span>Low directional exposure</span>
                        <span className="text-white/30">0.50</span> <span>Balanced (ATM)</span>
                        <span className="text-white/30">0.70+</span> <span>Strong directional proxy</span>
                    </div>
                    <div className="pt-1 border-t border-white/5 mt-1">
                        <span className="text-blue-300">⚡ Rising Delta confirms momentum.</span>
                    </div>
                </div>
            </div>

            {/* GAMMA */}
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-purple-400 font-bold uppercase">Gamma</span>
                    <span className="text-[9px] text-white/40">Acceleration Risk</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-white/70 leading-relaxed">
                    <p><strong className="text-white/40">Means:</strong> Speed of Delta change. High near ATM & Exp.</p>
                    <div className="pt-1 border-t border-white/5 mt-1">
                        <span className="text-purple-300">⚡ High Gamma = Fast profits & fast losses. Best for scalping.</span>
                    </div>
                </div>
            </div>

            {/* THETA */}
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-orange-400 font-bold uppercase">Theta</span>
                    <span className="text-[9px] text-white/40">Time Decay</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-white/70 leading-relaxed">
                    <p><strong className="text-white/40">Means:</strong> Daily premium erosion if price stalls.</p>
                    <p>Accelerates sharply near expiry. Highest for ATM.</p>
                    <div className="pt-1 border-t border-white/5 mt-1">
                        <span className="text-orange-300">⚡ Neutral markets favor Theta-positive (selling) strategies.</span>
                    </div>
                </div>
            </div>

            {/* VEGA */}
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-yellow-400 font-bold uppercase">Vega</span>
                    <span className="text-[9px] text-white/40">Vol Sensitivity</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-white/70 leading-relaxed">
                    <p><strong className="text-white/40">Means:</strong> Price change for 1% IV move.</p>
                    <p>High Vega benefits from IV expansion.</p>
                    <div className="pt-1 border-t border-white/5 mt-1">
                        <span className="text-yellow-300">⚡ Buy when IV is low & rising. Sell when high.</span>
                    </div>
                </div>
            </div>

            {/* IV */}
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-red-400 font-bold uppercase">Implied Vol</span>
                    <span className="text-[9px] text-white/40">Expectation</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-white/70 leading-relaxed">
                    <p>Low IV = Cheap options. High IV = Expensive.</p>
                    <div className="pt-1 border-t border-white/5 mt-1">
                        <span className="text-red-300">⚡ IV Rank &gt; 60 is a premium selling zone.</span>
                    </div>
                </div>
            </div>

            {/* COMBOS */}
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Power Combos</span>
                </div>
                <div className="grid gap-2 text-[9px] text-white/70">
                    <div className="flex justify-between">
                        <span>High Delta + Gamma</span>
                        <span className="text-white">Breakout</span>
                    </div>
                    <div className="flex justify-between">
                        <span>High Theta + Low IV</span>
                        <span className="text-white">Credit Spreads</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
