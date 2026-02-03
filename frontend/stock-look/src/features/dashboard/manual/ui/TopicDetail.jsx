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

// =============================
// Imports
// =============================
import React from "react";
import { Calculator, Scale, BookOpen, Lightbulb, Activity } from "lucide-react";

// =============================
// Main Component
// =============================

export default function TopicDetail({ topic }) {
    if (!topic) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-text-tertiary p-8 text-center animate-in fade-in">
                <BookOpen size={48} className="mb-4 opacity-30" />
                <p className="text-sm font-bold uppercase tracking-widest text-text-tertiary">Select a metric to analyze</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-right-4 duration-300">

            {/* 1. HERO HEADER */}
            <div className="mb-6 md:mb-8 relative group">
                <div className="absolute -left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-transparent opacity-50 rounded-full" />
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2 md:mb-3 tracking-tight group-hover:text-blue-500 transition-colors">
                    {topic.title}
                </h2>
                <div className="text-sm md:text-base text-text-secondary leading-relaxed font-light">
                    {topic.description}
                </div>
            </div>

            <div className="space-y-6">

                {/* 2. CORE INTERPRETATION CARD */}
                <div className="bg-background-elevated border border-border-default rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-background-surface border-b border-border-default p-3 md:p-4 flex items-center gap-2">
                        <BookOpen size={16} className="text-text-tertiary" />
                        <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Interpretation Framework</span>
                    </div>
                    <div className="p-4 md:p-6">
                        <div className="prose prose-slate dark:prose-invert max-w-none text-text-secondary dark:text-text-tertiary text-sm leading-7">
                            {topic.interpretation}
                        </div>
                    </div>
                </div>

                {/* 3. MARKET ALPHA (INSIGHT) */}
                <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/[0.03] dark:bg-amber-500/5 p-6 group transition-all hover:bg-amber-500/[0.05] dark:hover:bg-amber-500/10">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Lightbulb size={100} className="text-amber-500" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb size={18} className="text-amber-500" />
                            <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Market Alpha</span>
                        </div>
                        <p className="text-base text-text-secondary dark:text-text-tertiary italic font-medium leading-relaxed border-l-2 border-amber-500/20 dark:border-amber-500/20 pl-4">
                            "{topic.proTip}"
                        </p>
                    </div>
                </div>

                {/* 4. TECHNICAL SPECS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Calculation */}
                    <div className="bg-background-elevated border border-border-default rounded-xl p-5 flex flex-col hover:border-blue-500/30 transition-colors group">
                        <div className="flex items-center gap-2 mb-4 text-text-secondary dark:text-text-tertiary group-hover:text-blue-500 transition-colors">
                            <Calculator size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Formula</span>
                        </div>
                        <div className="mt-auto bg-background-card rounded-lg p-3 border border-border-default break-all">
                            <code className="text-xs font-mono text-text-tertiary">
                                {topic.calculation || "N/A"}
                            </code>
                        </div>
                    </div>

                    {/* Weight */}
                    <div className="bg-background-elevated border border-border-default rounded-xl p-5 flex flex-col hover:border-purple-500/30 transition-colors group">
                        <div className="flex items-center gap-2 mb-4 text-text-secondary dark:text-text-tertiary group-hover:text-purple-500 transition-colors">
                            <Scale size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Model Weight</span>
                        </div>
                        <div className="mt-auto">
                            <div className="text-xl font-bold text-text-primary mb-1">
                                {topic.weight}
                            </div>
                            <div className="h-1 w-full bg-background-surface rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 w-3/4 rounded-full opacity-60" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. FOOTER META */}
                <div className="flex items-center gap-2 pt-6 border-t border-border-default text-xs text-text-secondary dark:text-text-tertiary font-mono uppercase tracking-tight opacity-50">
                    <Activity size={12} />
                    <span>System ID: {topic.id}</span>
                </div>
            </div>
        </div>
    );
}
