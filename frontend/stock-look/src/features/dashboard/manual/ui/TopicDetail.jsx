/**
 * @file TopicDetail.jsx
 * @purpose Renders the full details of a selected manual topic.
 * @responsibilities
 * - Displays title, description, and market alpha (insights).
 * - Shows calculation formulas and model weights.
 * - Provides detailed interpretation frameworks.
 * @key_exports
 * - TopicDetail (Default Component)
 * @dependencies
 * - React, lucide-react (Icons)
 * @lifecycle
 * - Rendered by ManualSectionLayout (Right Pane).
 * @date 2026-02-03
 */

import React from "react";
import { Calculator, Scale, BookOpen, Lightbulb, Activity, Database, Clock, ShieldAlert } from "lucide-react";

export default function TopicDetail({ topic }) {
    if (!topic) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-text-tertiary p-8 text-center animate-in fade-in">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium tracking-wide text-text-secondary">Select a metric from the index to view its manual</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto pr-4 custom-scrollbar animate-in slide-in-from-right-8 duration-500 fade-in pb-12">
            
            {/* 1. HERO HEADER */}
            <div className="mb-6 flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
                        {topic.title}
                    </h1>
                    <div className="text-[13px] text-text-secondary leading-relaxed max-w-3xl whitespace-pre-wrap">
                        {topic.description}
                    </div>
                </div>
            </div>

            <div className="space-y-4 max-w-[1000px]">

                {/* 2. CORE INTERPRETATION CARD */}
                <div className="bg-[#121020] border border-purple-500/20 rounded-xl p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-1 rounded bg-purple-500/20 text-purple-400">
                            <Activity size={14} />
                        </div>
                        <h3 className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Interpretation Framework</h3>
                    </div>
                    
                    {topic.interpretationVisual ? (
                        <div className="mb-6">
                            {/* Visual Scale Line */}
                            <div className="relative h-[2px] w-full bg-white/5 rounded-full mb-4 mx-auto">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full" />
                                {/* Scale markers (dots) */}
                                {topic.interpretationVisual.map((item, idx) => {
                                    const leftPct = (idx / (topic.interpretationVisual.length - 1)) * 100;
                                    return (
                                        <div key={idx} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-[#111827] border-2 border-white rounded-full" style={{ left: `calc(${leftPct}% - 4px)` }} />
                                    );
                                })}
                            </div>
                            
                            {/* Labels Grid */}
                            <div className="flex justify-between w-full">
                                {topic.interpretationVisual.map((item, idx) => (
                                    <div key={idx} className="flex flex-col items-center text-center w-1/5">
                                        <div className="text-[11px] font-bold text-white mb-0.5">{item.range}</div>
                                        <div className={`text-[10px] font-bold ${item.color}`}>{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {topic.interpretation}
                    </div>
                </div>

                {/* 3. MARKET ALPHA (INSIGHT) */}
                <div className="bg-[#161208] border border-amber-500/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded bg-amber-500/20 text-amber-500">
                            <Lightbulb size={14} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Market Alpha Insight</h4>
                            <p className="text-[12px] text-text-secondary font-serif italic leading-relaxed whitespace-pre-wrap">
                                "{topic.proTip}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. BOTTOM SECTION: CALCULATION & METADATA GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    
                    {/* Left Col: Calculation / Framework */}
                    <div className="lg:col-span-2 bg-[#0c1017] border border-white/5 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1 rounded bg-blue-500/20 text-blue-400">
                                {topic.isBehavioral ? <BookOpen size={14} /> : <Calculator size={14} />}
                            </div>
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                                {topic.isBehavioral ? "Behavioral Framework" : "How It's Calculated"}
                            </span>
                        </div>
                        
                        <div className="text-xs text-text-secondary leading-relaxed mb-4">
                            {topic.calculation ? topic.calculation.split("Where:")[0] : ""}
                        </div>

                        {topic.calculation && topic.calculation.includes("Where:") && (
                            <div className="text-xs text-text-secondary leading-relaxed">
                                <div className="mb-2">Where:</div>
                                <div className="pl-4 space-y-1">
                                    {topic.calculation.split("Where:")[1].trim().split('\n').map((line, i) => (
                                        <div key={i} className="flex items-start">
                                            <span className="mr-2 opacity-50">•</span>
                                            <span>{line.replace(/^•\s*/, '')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!topic.calculation && (
                            <div className="text-xs text-text-tertiary">N/A</div>
                        )}
                    </div>

                    {/* Right Col: Metadata Stack */}
                    <div className="lg:col-span-1 space-y-3">
                        {topic.dataSources && (
                            <div className="bg-[#0c1017] border border-white/5 rounded-xl p-4 flex items-start gap-3">
                                <div className="mt-0.5 text-blue-400/70"><Database size={14} /></div>
                                <div>
                                    <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest mb-1">Data Sources</div>
                                    <div className="text-[11px] text-text-secondary leading-relaxed">{topic.dataSources}</div>
                                </div>
                            </div>
                        )}
                        {topic.updateFrequency && (
                            <div className="bg-[#0c1017] border border-white/5 rounded-xl p-4 flex items-start gap-3">
                                <div className="mt-0.5 text-emerald-400/70"><Clock size={14} /></div>
                                <div>
                                    <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest mb-1">Update Frequency</div>
                                    <div className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap">{topic.updateFrequency}</div>
                                </div>
                            </div>
                        )}
                        {topic.confidenceImpact && (
                            <div className="bg-[#0c1017] border border-white/5 rounded-xl p-4 flex items-start gap-3">
                                <div className="mt-0.5 text-amber-400/70"><ShieldAlert size={14} /></div>
                                <div>
                                    <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest mb-1">Confidence Impact</div>
                                    <div className="text-[11px] text-text-secondary leading-relaxed">{topic.confidenceImpact}</div>
                                </div>
                            </div>
                        )}
                        {!topic.dataSources && !topic.updateFrequency && !topic.confidenceImpact && (
                            <div className="bg-[#0c1017] border border-white/5 rounded-xl p-4 h-full flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-2">
                                    <Scale size={14} className="text-purple-400" />
                                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Model Weighting</span>
                                </div>
                                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 tracking-tighter">
                                    {topic.weight}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
