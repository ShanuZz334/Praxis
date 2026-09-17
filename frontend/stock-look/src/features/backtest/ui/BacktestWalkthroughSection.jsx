/**
 * @file BacktestWalkthroughSection.jsx
 * @purpose Renders the comprehensive Strategic Diagnosis & Walkthrough tab in the Backtest Scorecard.
 *          Provides dual modes: Instant Algorithmic Quantitative Audit and AI Deep Synthesis (Local 7B / Gateway).
 */

import React, { useState, useMemo } from 'react';
import { 
    AlertTriangle, ShieldAlert, TrendingDown, TrendingUp, Clock, 
    Sparkles, RefreshCw, Copy, Check, Sliders, ChevronDown, ChevronUp,
    Cpu, Activity, Target, Zap, FileText
} from 'lucide-react';
import axiosInstance from '../../../shared/utils/axiosInstance';
import { API_PATHS } from '../../../shared/utils/apiPaths';
import { sanitizeAiErrorMessage } from '../../../shared/utils/aiErrorSanitizer';
import {
    computeExecutiveVerdict,
    evaluateStyleSuitability,
    diagnoseMathematicalLeaks,
    calculateBreakEvenWinRate,
    calculateDrawdownRecoveryPct,
    analyzeAnnualConsistency,
    generatePrescriptiveActions,
    compileFullWalkthroughText
} from '../engine/backtestWalkthroughEngine';

export default function BacktestWalkthroughSection({
    summary = {},
    config = {},
    trades = [],
    onOpenOptimizer = () => {},
}) {
    const [auditMode, setAuditMode] = useState('ALGO'); // 'ALGO' | 'AI'
    const [aiDiagnosis, setAiDiagnosis] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [aiModelUsed, setAiModelUsed] = useState(null);
    const [copied, setCopied] = useState(false);

    // Collapsible section toggles
    const [expandedSections, setExpandedSections] = useState({
        leaks: true,
        math: true,
        risk: true,
        regime: true,
        actions: true
    });

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Algorithmic calculations
    const verdict = useMemo(() => computeExecutiveVerdict(summary, config), [summary, config]);
    const style = useMemo(() => evaluateStyleSuitability(summary, config), [summary, config]);
    const leaks = useMemo(() => diagnoseMathematicalLeaks(summary, config, trades), [summary, config, trades]);
    const recoveryPct = useMemo(() => calculateDrawdownRecoveryPct(summary.maxDrawdownPct), [summary.maxDrawdownPct]);
    const breakEvenWr = useMemo(() => calculateBreakEvenWinRate(summary.realizedRR), [summary.realizedRR]);
    const annual = useMemo(() => analyzeAnnualConsistency(summary), [summary]);
    const prescriptions = useMemo(() => generatePrescriptiveActions(summary, config), [summary, config]);

    // Copy formatted report to clipboard
    const handleCopyReport = () => {
        const text = aiDiagnosis ? aiDiagnosis : compileFullWalkthroughText(summary, config, trades);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Request AI Deep Walkthrough from backend
    const handleRunAiDiagnosis = async (forceRefresh = false) => {
        setIsAiLoading(true);
        setAiError(null);
        try {
            const payload = {
                summary,
                config,
                instrument: config.instrument,
                timeframe: config.timeframe,
                activeUnit: config.unit,
                forceRefresh: Boolean(forceRefresh)
            };

            const endpoint = API_PATHS?.BACKTEST?.WALKTHROUGH || '/api/v1/intelligence/backtest-walkthrough';
            const res = await axiosInstance.post(endpoint, payload, { timeout: 60000 });

            if (res.data?.status === 'success' && res.data?.data?.walkthrough) {
                setAiDiagnosis(res.data.data.walkthrough);
                setAiModelUsed(res.data.data.model || res.data.data.provider || 'AI');
                setAuditMode('AI');
            } else {
                throw new Error(res.data?.message || 'Failed to generate AI walkthrough');
            }
        } catch (err) {
            console.error('[Walkthrough] AI error:', err);
            const sanitized = sanitizeAiErrorMessage(err.response?.data?.error || err.message, 'AI Gateway');
            setAiError(sanitized.cleanMessage);
        } finally {
            setIsAiLoading(false);
        }
    };

    // Color theme helper
    const getBadgeStyle = (col) => {
        if (col === 'emerald') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        if (col === 'blue') return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        if (col === 'amber') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    };

    return (
        <div className="flex flex-col gap-3.5 animate-in fade-in duration-200">
            {/* 1. Mode Selector & Action Bar */}
            <div className="flex items-center justify-between bg-background-surface/80 p-1 rounded-xl border border-border-subtle">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setAuditMode('ALGO')}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                            auditMode === 'ALGO'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-text-tertiary hover:text-text-primary'
                        }`}
                    >
                        <Cpu size={12} />
                        <span>Quant Audit</span>
                    </button>
                    <button
                        onClick={() => {
                            setAuditMode('AI');
                            if (!aiDiagnosis && !isAiLoading) {
                                handleRunAiDiagnosis();
                            }
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                            auditMode === 'AI'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-text-tertiary hover:text-text-primary'
                        }`}
                    >
                        <Sparkles size={12} />
                        <span>AI Synthesis</span>
                        {aiModelUsed && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-white/20 font-mono">
                                {aiModelUsed}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-1 pr-1">
                    <button
                        onClick={handleCopyReport}
                        className="p-1 text-text-tertiary hover:text-text-primary rounded-md transition hover:bg-background-elevated cursor-pointer"
                        title="Copy diagnostic report to clipboard"
                    >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                </div>
            </div>

            {/* 2. Primary Executive Verdict Card */}
            <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${getBadgeStyle(verdict.color)}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                            verdict.color === 'emerald' ? 'bg-emerald-400' : verdict.color === 'amber' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        <span className="text-[9px] font-black uppercase tracking-wider font-mono">
                            {verdict.badgeText}
                        </span>
                    </div>
                    <span className="text-[9px] font-mono opacity-70">
                        Score: {summary.profitFactor || 0} PF
                    </span>
                </div>

                <h4 className="text-xs font-bold leading-snug text-text-primary mt-0.5">
                    {verdict.headline}
                </h4>

                <p className="text-[11px] leading-relaxed opacity-90 text-text-secondary">
                    {verdict.summaryText}
                </p>
            </div>

            {/* 3. Trading Style & Horizon Fit Card */}
            <div className="bg-background-surface/80 p-3 rounded-xl border border-border-subtle flex flex-col gap-2 shadow-xs">
                {/* Header: Title + Status Badge */}
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/50">
                    <div className="flex items-center gap-1.5 text-text-tertiary">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                            Style Suitability
                        </span>
                    </div>
                    <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded border tracking-wider ${getBadgeStyle(style.viabilityColor)}`}>
                        {style.viabilityStatus.replace(/_/g, ' ')}
                    </span>
                </div>

                {/* Style Name & Holding Horizon Pill */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-text-primary">
                        {style.detectedStyle}
                    </span>
                    <span className="text-[10px] font-mono text-text-tertiary px-1.5 py-0.5 rounded bg-background-app border border-border-subtle/60 shrink-0">
                        {style.holdMetric || `${style.avgDurationBars || summary.avgBarsHeld || 0} Bars`}
                    </span>
                </div>

                {/* Holding Horizon Context */}
                {style.holdHorizon && (
                    <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary -mt-1 font-mono">
                        <span className="text-text-muted">Horizon:</span>
                        <span className="text-text-secondary font-medium">{style.holdHorizon}</span>
                    </div>
                )}

                {/* Viability Diagnostic Verdict */}
                <p className="text-[11px] text-text-secondary leading-relaxed pt-1 border-t border-border-subtle/30">
                    {style.viabilityVerdict}
                </p>
            </div>

            {/* If in AI Mode, display AI Output or Prompt to Run */}
            {auditMode === 'AI' && (
                <div className="bg-background-surface/90 rounded-xl p-3.5 border border-purple-500/30 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
                        <div className="flex items-center gap-1.5 text-purple-400">
                            <Sparkles size={13} />
                            <span className="font-bold text-[10px] uppercase tracking-wider">
                                AI Strategic Diagnosis
                            </span>
                        </div>
                        <button
                            onClick={() => handleRunAiDiagnosis(true)}
                            disabled={isAiLoading}
                            className="flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw size={11} className={isAiLoading ? 'animate-spin' : ''} />
                            <span>{isAiLoading ? 'Analyzing...' : 'Re-Diagnose'}</span>
                        </button>
                    </div>

                    {isAiLoading ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-2 text-text-tertiary">
                            <RefreshCw size={20} className="animate-spin text-purple-400" />
                            <span className="text-xs font-medium">Synthesizing quantitative breakdown...</span>
                            <span className="text-[10px] text-text-tertiary font-mono">Querying Local 7B / AI Gateway</span>
                        </div>
                    ) : aiError ? (
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex flex-col gap-1">
                            <span className="font-bold">AI Generation Note:</span>
                            <span className="text-[11px] leading-relaxed text-rose-300">{aiError}</span>
                            <span className="text-[10px] text-text-tertiary mt-1">Falling back to full Quant Audit below.</span>
                        </div>
                    ) : aiDiagnosis ? (
                        <div className="prose prose-invert prose-xs max-w-none text-[11px] leading-relaxed text-text-secondary whitespace-pre-line">
                            {aiDiagnosis}
                        </div>
                    ) : (
                        <div className="py-6 flex flex-col items-center justify-center gap-2 text-center">
                            <p className="text-xs text-text-secondary">Ready to generate comprehensive AI synthesis using your telemetry & test configs.</p>
                            <button
                                onClick={handleRunAiDiagnosis}
                                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md shadow-purple-600/25 cursor-pointer mt-1"
                            >
                                Generate AI Walkthrough
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 4. Mathematical Breakdown & Break-Even Math */}
            <div className="bg-background-surface/80 rounded-xl border border-border-subtle overflow-hidden">
                <button
                    onClick={() => toggleSection('math')}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-background-elevated/40 transition cursor-pointer"
                >
                    <div className="flex items-center gap-1.5">
                        <Target size={13} className="text-blue-400" />
                        <span className="font-bold text-[10px] text-text-primary uppercase tracking-wider">
                            Mathematical Edge Audit
                        </span>
                    </div>
                    {expandedSections.math ? <ChevronUp size={13} className="text-text-tertiary" /> : <ChevronDown size={13} className="text-text-tertiary" />}
                </button>

                {expandedSections.math && (
                    <div className="p-3 pt-0 border-t border-border-subtle/40 flex flex-col gap-2 mt-2">
                        <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                            <div className="p-2 rounded-lg bg-background-elevated/40 border border-border-subtle/50 flex flex-col">
                                <span className="text-[8px] uppercase text-text-tertiary">Actual WR</span>
                                <span className={`text-xs font-black mt-0.5 ${summary.winRate >= breakEvenWr ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {summary.winRate}%
                                </span>
                            </div>
                            <div className="p-2 rounded-lg bg-background-elevated/40 border border-border-subtle/50 flex flex-col">
                                <span className="text-[8px] uppercase text-text-tertiary">Break-Even WR</span>
                                <span className="text-xs font-black text-amber-400 mt-0.5">
                                    {breakEvenWr}%
                                </span>
                            </div>
                            <div className="p-2 rounded-lg bg-background-elevated/40 border border-border-subtle/50 flex flex-col">
                                <span className="text-[8px] uppercase text-text-tertiary">Realized R:R</span>
                                <span className="text-xs font-black text-blue-400 mt-0.5">
                                    {summary.realizedRR}x
                                </span>
                            </div>
                        </div>

                        <p className="text-[10.5px] leading-relaxed text-text-secondary mt-1">
                            {summary.winRate < breakEvenWr ? (
                                <>
                                    <strong className="text-rose-400 font-bold">Negative Mathematical Edge: </strong> 
                                    With a realized Risk:Reward of {summary.realizedRR}x, you require a win rate of at least <strong>{breakEvenWr}%</strong> just to break even. Your current {summary.winRate}% leaves a <strong>{Math.round((breakEvenWr - summary.winRate) * 10) / 10}% deficit</strong>, causing steady equity bleed.
                                </>
                            ) : (
                                <>
                                    <strong className="text-emerald-400 font-bold">Positive Mathematical Edge: </strong> 
                                    Your win rate of {summary.winRate}% comfortably clears the break-even threshold of {breakEvenWr}%, establishing a sustainable compounding buffer.
                                </>
                            )}
                        </p>
                    </div>
                )}
            </div>

            {/* 5. Identified Core Mathematical Leaks */}
            {leaks.length > 0 && (
                <div className="bg-background-surface/80 rounded-xl border border-border-subtle overflow-hidden">
                    <button
                        onClick={() => toggleSection('leaks')}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-background-elevated/40 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-1.5">
                            <AlertTriangle size={13} className="text-rose-400" />
                            <span className="font-bold text-[10px] text-text-primary uppercase tracking-wider">
                                Identified Leaks ({leaks.length})
                            </span>
                        </div>
                        {expandedSections.leaks ? <ChevronUp size={13} className="text-text-tertiary" /> : <ChevronDown size={13} className="text-text-tertiary" />}
                    </button>

                    {expandedSections.leaks && (
                        <div className="p-3 pt-0 border-t border-border-subtle/40 flex flex-col gap-2 mt-2">
                            {leaks.map((leak) => (
                                <div key={leak.id} className="p-2.5 rounded-lg bg-background-elevated/40 border border-border-subtle/60 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-text-primary">
                                            {leak.title}
                                        </span>
                                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                            leak.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                        }`}>
                                            {leak.severity}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-accent-primary font-bold">
                                        {leak.metric}
                                    </span>
                                    <p className="text-[10.5px] text-text-secondary leading-relaxed mt-0.5">
                                        {leak.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 6. Drawdown & Gambler's Ruin Warning */}
            <div className="bg-background-surface/80 rounded-xl border border-border-subtle overflow-hidden">
                <button
                    onClick={() => toggleSection('risk')}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-background-elevated/40 transition cursor-pointer"
                >
                    <div className="flex items-center gap-1.5">
                        <ShieldAlert size={13} className="text-amber-400" />
                        <span className="font-bold text-[10px] text-text-primary uppercase tracking-wider">
                            Drawdown & Ruin Risk
                        </span>
                    </div>
                    {expandedSections.risk ? <ChevronUp size={13} className="text-text-tertiary" /> : <ChevronDown size={13} className="text-text-tertiary" />}
                </button>

                {expandedSections.risk && (
                    <div className="p-3 pt-0 border-t border-border-subtle/40 flex flex-col gap-2 mt-2">
                        <div className="flex justify-between items-center py-1 border-b border-border-subtle/30 text-[11px]">
                            <span className="text-text-secondary">Peak-to-Trough Drawdown</span>
                            <span className="font-mono font-bold text-rose-400">-{summary.maxDrawdownPct}%</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border-subtle/30 text-[11px]">
                            <span className="text-text-secondary">Return Needed to Recover</span>
                            <span className="font-mono font-bold text-amber-400">+{recoveryPct}%</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border-subtle/30 text-[11px]">
                            <span className="text-text-secondary">Max Consecutive Losses</span>
                            <span className="font-mono font-bold text-rose-400">{summary.maxConsecutiveLosses || 0} in a row</span>
                        </div>

                        <p className="text-[10.5px] leading-relaxed text-text-secondary mt-1">
                            A drawdown of <strong>-{summary.maxDrawdownPct}%</strong> imposes an asymmetrical recovery burden. You now require a <strong>+{recoveryPct}% gain</strong> simply to get back to starting capital. Without risk caps per trade, normal cluster variance causes account insolvency.
                        </p>
                    </div>
                )}
            </div>

            {/* 7. Multi-Year Regime Consistency */}
            {annual && (
                <div className="bg-background-surface/80 rounded-xl border border-border-subtle overflow-hidden">
                    <button
                        onClick={() => toggleSection('regime')}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-background-elevated/40 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-1.5">
                            <Activity size={13} className="text-blue-400" />
                            <span className="font-bold text-[10px] text-text-primary uppercase tracking-wider">
                                Regime & Year Resilience
                            </span>
                        </div>
                        {expandedSections.regime ? <ChevronUp size={13} className="text-text-tertiary" /> : <ChevronDown size={13} className="text-text-tertiary" />}
                    </button>

                    {expandedSections.regime && (
                        <div className="p-3 pt-0 border-t border-border-subtle/40 flex flex-col gap-2 mt-2">
                            <p className="text-[10.5px] leading-relaxed text-text-secondary">
                                {annual.commentary}
                            </p>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                {annual.bestYear && (
                                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                                        <span className="text-[8px] uppercase text-emerald-400 font-bold">Best Year ({annual.bestYear.year})</span>
                                        <div className="font-mono text-xs font-black text-emerald-400 mt-0.5">
                                            +{annual.bestYear.returnPct}%
                                        </div>
                                    </div>
                                )}
                                {annual.worstYear && (
                                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                                        <span className="text-[8px] uppercase text-rose-400 font-bold">Worst Year ({annual.worstYear.year})</span>
                                        <div className="font-mono text-xs font-black text-rose-400 mt-0.5">
                                            {annual.worstYear.returnPct}%
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 8. Prescriptive Optimization Roadmap */}
            {prescriptions.length > 0 && (
                <div className="bg-background-surface/80 rounded-xl border border-border-subtle overflow-hidden">
                    <button
                        onClick={() => toggleSection('actions')}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-background-elevated/40 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-1.5">
                            <Zap size={13} className="text-emerald-400" />
                            <span className="font-bold text-[10px] text-text-primary uppercase tracking-wider">
                                Prescribed Fixes ({prescriptions.length})
                            </span>
                        </div>
                        {expandedSections.actions ? <ChevronUp size={13} className="text-text-tertiary" /> : <ChevronDown size={13} className="text-text-tertiary" />}
                    </button>

                    {expandedSections.actions && (
                        <div className="p-3 pt-0 border-t border-border-subtle/40 flex flex-col gap-2 mt-2">
                            {prescriptions.map((p, idx) => (
                                <div key={idx} className="p-2.5 rounded-lg bg-background-elevated/40 border border-border-subtle/60 flex flex-col gap-1">
                                    <span className="text-[11px] font-bold text-text-primary">
                                        {idx + 1}. {p.title}
                                    </span>
                                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                        Target: {p.recommendedValue}
                                    </span>
                                    <p className="text-[10.5px] text-text-secondary leading-relaxed">
                                        {p.impact}
                                    </p>
                                </div>
                            ))}

                            <button
                                onClick={onOpenOptimizer}
                                className="w-full mt-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                            >
                                <Sliders size={13} />
                                <span>Launch Auto-Calibration Studio</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
