import React from "react";
import { Info, Calculator, Scale, BookOpen, Lightbulb, Activity, ArrowRight } from "lucide-react";

export default function TopicDetail({ topic }) {
    if (!topic) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/20 p-8 text-center animate-in fade-in">
                <BookOpen size={48} className="mb-4 opacity-30" />
                <p className="text-sm font-bold uppercase tracking-widest text-white/30">Select a metric to analyze</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-right-4 duration-300">

            {/* 1. HERO HEADER */}
            <div className="mb-6 md:mb-8 relative group">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-transparent opacity-50 rounded-full" />
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3 tracking-tight group-hover:text-blue-100 transition-colors">
                    {topic.title}
                </h2>
                <div className="text-sm md:text-lg text-slate-400 leading-relaxed font-light">
                    {topic.description}
                </div>
            </div>

            <div className="space-y-6">

                {/* 2. CORE INTERPRETATION CARD */}
                <div className="bg-[#0b1221] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <div className="bg-white/[0.02] border-b border-white/5 p-4 flex items-center gap-2">
                        <BookOpen size={16} className="text-emerald-400" />
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Interpretation Framework</span>
                    </div>
                    <div className="p-6">
                        <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-7">
                            {topic.interpretation}
                        </div>
                    </div>
                </div>

                {/* 3. MARKET ALPHA (INSIGHT) */}
                <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 group transition-all hover:bg-amber-500/10">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Lightbulb size={120} className="text-amber-500" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb size={18} className="text-amber-400" />
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Market Alpha</span>
                        </div>
                        <p className="text-base text-amber-100/90 italic font-medium leading-relaxed border-l-2 border-amber-500/40 pl-4">
                            "{topic.proTip}"
                        </p>
                    </div>
                </div>

                {/* 4. TECHNICAL SPECS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Calculation */}
                    <div className="bg-[#0f172a] border border-white/10 rounded-xl p-5 flex flex-col hover:border-blue-500/30 transition-colors group">
                        <div className="flex items-center gap-2 mb-4 text-white/40 group-hover:text-blue-400 transition-colors">
                            <Calculator size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Formula</span>
                        </div>
                        <div className="mt-auto bg-black/40 rounded-lg p-3 border border-white/5">
                            <code className="text-xs font-mono text-blue-300 break-words">
                                {topic.calculation || "N/A"}
                            </code>
                        </div>
                    </div>

                    {/* Weight */}
                    <div className="bg-[#0f172a] border border-white/10 rounded-xl p-5 flex flex-col hover:border-purple-500/30 transition-colors group">
                        <div className="flex items-center gap-2 mb-4 text-white/40 group-hover:text-purple-400 transition-colors">
                            <Scale size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Model Weight</span>
                        </div>
                        <div className="mt-auto">
                            <div className="text-xl font-bold text-white mb-1">
                                {topic.weight}
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 w-3/4 rounded-full opacity-60" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. FOOTER META */}
                <div className="flex items-center gap-2 pt-6 border-t border-white/5 text-xs text-white/20 font-mono uppercase tracking-tight">
                    <Activity size={12} />
                    <span>System ID: {topic.id}</span>
                </div>
            </div>
        </div>
    );
}
