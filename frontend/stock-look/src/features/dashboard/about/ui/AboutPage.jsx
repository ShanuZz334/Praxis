/**
 * @file AboutPage.jsx
 * @purpose Institutional Terminal Architecture & System Overview for Praxis.
 * @responsibilities
 * - Presents the 9-Engine core ecosystem architecture.
 * - Details the PACE Bayesian calibration and machine-learning forecasting stack.
 * - Displays institutional comparison matrices (Retail vs Praxis).
 * - Surfaces trader mandates (Built For vs Anti-Personas) and platform axioms.
 * - Engineered specifically for Shanif (Shanu).
 * @dependencies
 * - lucide-react: Specialized icons for institutional visual telemetry.
 * - react-router-dom: Client-side routing to platform engines.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Shield,
    Layers,
    Target,
    CheckCircle2,
    XCircle,
    BrainCircuit,
    Terminal,
    Cpu,
    TrendingUp,
    BarChart3,
    Compass,
    Globe,
    Calendar,
    Wallet,
    BookOpen,
    Zap,
    ArrowUpRight,
    Sparkles,
    Scale,
    Activity,
    Lock,
    ExternalLink,
    Code2,
    Mail,
    LayoutGrid,
    GitBranch,
    ShieldCheck
} from "lucide-react";

// =============================
// Platform Architecture Data
// =============================

const PLATFORM_ENGINES = [
    {
        id: "master",
        title: "Master Terminal",
        category: "Command Center",
        path: "/dashboard/home",
        icon: LayoutGrid,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20 hover:border-blue-500/40",
        badge: "Core Hub",
        desc: "Unified multi-timeframe crosshair sync, market-wide gamma exposure (GEX), and real-time institutional dark pool block tracking across all liquid F&O assets."
    },
    {
        id: "fundamental",
        title: "Fundamental Desk",
        category: "Valuation & Balance Sheet",
        path: "/dashboard/fundamental",
        icon: Scale,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20 hover:border-emerald-500/40",
        badge: "30 Ratios",
        desc: "30 balance-sheet and macroeconomic metrics with automated live Upstox/Yahoo resolution, sector P/E spreads, and zero-clutter manual fallbacks."
    },
    {
        id: "technical",
        title: "Technical Engine",
        category: "Microstructure & Flow",
        path: "/dashboard/technical",
        icon: Activity,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20 hover:border-indigo-500/40",
        badge: "Order Flow",
        desc: "Multi-Anchor VWAP pinch breakouts, tick-level cumulative volume delta (CVD) footprints, Central Pivot Range (CPR) confluence, and Market Profile POC migration."
    },
    {
        id: "options",
        title: "Options & Volatility",
        category: "Derivatives Analytics",
        path: "/dashboard/options",
        icon: TrendingUp,
        color: "text-violet-500",
        bg: "bg-violet-500/10",
        border: "border-violet-500/20 hover:border-violet-500/40",
        badge: "Greek Surface",
        desc: "Second-order Greeks (Vanna, Charm), 0DTE hyperbolic volatility compression, 25-Delta volatility skew, and dealer zero-gamma flip boundaries."
    },
    {
        id: "global",
        title: "Global Macro Sentinel",
        category: "Sovereign & Contagion",
        path: "/dashboard/globalstructure",
        icon: Globe,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20 hover:border-cyan-500/40",
        badge: "Sovereign Debt",
        desc: "India 5Y Sovereign CDS spreads, Baltic Dry Index maritime velocity, Net Federal Reserve Dollar Liquidity, US High-Yield OAS, and currency contagion gauges."
    },
    {
        id: "events",
        title: "Events & Catalyst Desk",
        category: "Tail Shocks",
        path: "/dashboard/events",
        icon: Calendar,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20 hover:border-amber-500/40",
        badge: "Macro Shocks",
        desc: "SEBI market-wide circuit breaker halts, MSCI index rebalancing flows, promoter share pledging distress cascades, and central bank policy shocks."
    },
    {
        id: "wallet",
        title: "Capital & Risk Guard",
        category: "Portfolio Defense",
        path: "/dashboard/wallet",
        icon: Wallet,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20 hover:border-rose-500/40",
        badge: "Capital Shield",
        desc: "Multi-asset correlated Kelly Criterion, Maximum Adverse Excursion (MAE/MFE) stop optimization, terminal portfolio heat locks, and extreme historical stress testing."
    },
    {
        id: "journal",
        title: "Behavioral Journal",
        category: "Psychological Audit",
        path: "/dashboard/journal",
        icon: BookOpen,
        color: "text-fuchsia-500",
        bg: "bg-fuchsia-500/10",
        border: "border-fuchsia-500/20 hover:border-fuchsia-500/40",
        badge: "Cognitive Audit",
        desc: "Neuro-behavioral trading psychology, Heart Rate Variability (HRV) stress telemetry, 15-minute emotional cool-down codification, and automated EOD retrospectives."
    },
    {
        id: "pai",
        title: "PAI Neural Co-Pilot",
        category: "Quantitative Intelligence",
        path: "/dashboard/pai",
        icon: BrainCircuit,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20 hover:border-purple-500/40",
        badge: "Bayesian AI",
        desc: "Multi-agent dialectical debate (Bull Advocate vs Bear Red-Team vs CRO), WebSocket micro-agent event bus, and Bayesian epistemic PACE calibration."
    }
];

const COMPARISON_DATA = [
    {
        dimension: "Market Context",
        retail: "Single isolated chart with static lagging moving averages",
        praxis: "Multi-Timeframe sync + 4-Pillar Confluence (EMA, VWAP, Supertrend, RSI)"
    },
    {
        dimension: "Derivatives Telemetry",
        retail: "Basic PCR and generic 'unusual volume' alerts with zero gamma context",
        praxis: "Second-order Greeks (Vanna/Charm), 25-Delta Skew & Zero-Gamma Flip Boundaries"
    },
    {
        dimension: "Macro Grounding",
        retail: "Completely ignores global liquidity and sovereign credit conditions",
        praxis: "India 5Y CDS, Net Fed Dollar Liquidity & Baltic Dry Index integrated in real time"
    },
    {
        dimension: "Risk Management",
        retail: "Arbitrary mental stops, unchecked leverage, and revenge trading",
        praxis: "Correlated Kelly Criterion sizing, MAE/MFE stop clamping & Max Loss circuit locks"
    },
    {
        dimension: "Machine Learning",
        retail: "Uncalibrated black-box AI with hallucinated price targets",
        praxis: "PACE Bayesian Calibration with permanent error tracking and variance shrinkage"
    },
    {
        dimension: "Discipline & Audit",
        retail: "Unrecorded trades, result-oriented bias, and emotional tilt",
        praxis: "Clinical neurobiology audit, HRV telemetry, and multi-section EOD retrospectives"
    }
];

// =============================
// Main Component
// =============================

export default function AboutPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("engines"); // 'engines' | 'pipeline' | 'comparison' | 'mandate'

    return (
        <div className="min-h-screen w-full relative pb-24 font-sans text-slate-900 dark:text-text-primary bg-slate-50/50 dark:bg-transparent">

            {/* Ambient Background Light/Dark Accents */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[140px]" />
                <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[130px]" />
                <div className="absolute bottom-[-10%] left-[25%] w-[650px] h-[650px] bg-emerald-600/5 dark:bg-emerald-600/5 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 space-y-12 sm:space-y-16 animate-in fade-in duration-700">

                {/* ── 1. Hero Section ────────────────────────────────────────── */}
                <div className="text-center max-w-4xl mx-auto space-y-6 pt-4">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold tracking-wider shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span>PRAXIS FINANCIAL ARCHITECTURE // V2.4.0 STABLE</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-text-primary leading-[1.12]">
                        Precision Intelligence <br className="hidden sm:inline" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 dark:from-blue-400 dark:via-indigo-400 dark:to-emerald-400">
                            For Quantitative Traders
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-600 dark:text-text-secondary leading-relaxed max-w-3xl mx-auto">
                        Praxis is not a retail signal service. It is an <strong className="text-blue-600 dark:text-blue-400 font-semibold">institutional-grade decision support platform</strong> engineered to synthesize order flow microstructure, options gamma exposure, global macro contagion, and Bayesian prediction calibration into a unified execution desk.
                    </p>

                    {/* Quick Stat Pill Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2">
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-background-card/80 border border-slate-200 dark:border-border-default shadow-xs text-center">
                            <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">9</div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-text-tertiary mt-0.5">Core Engines</div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-background-card/80 border border-slate-200 dark:border-border-default shadow-xs text-center">
                            <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">200</div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-text-tertiary mt-0.5">Playbook Topics</div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-background-card/80 border border-slate-200 dark:border-border-default shadow-xs text-center">
                            <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">PACE</div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-text-tertiary mt-0.5">Bayesian Shrinkage</div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-background-card/80 border border-slate-200 dark:border-border-default shadow-xs text-center">
                            <div className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400">100%</div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-text-tertiary mt-0.5">Grounded Data</div>
                        </div>
                    </div>
                </div>

                {/* ── 2. Interactive Navigation Tabs ─────────────────────────── */}
                <div className="flex items-center justify-center">
                    <div className="p-1.5 rounded-2xl bg-white/80 dark:bg-background-card/90 border border-slate-200 dark:border-border-default shadow-sm backdrop-blur-md flex flex-wrap gap-1.5 justify-center max-w-full">
                        {[
                            { id: "engines", label: "9 Platform Engines", icon: LayoutGrid },
                            { id: "pipeline", label: "PACE & AI Pipeline", icon: Cpu },
                            { id: "comparison", label: "Retail vs Praxis Matrix", icon: ShieldCheck },
                            { id: "mandate", label: "Trader Mandate & Rules", icon: Target }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isSelected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                        isSelected
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/5"
                                    }`}
                                >
                                    <Icon size={14} className={isSelected ? "text-white" : "text-slate-400 dark:text-text-tertiary"} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── 3. Tab Content Area ────────────────────────────────────── */}

                {/* TAB 1: 9 PLATFORM ENGINES */}
                {activeTab === "engines" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="text-center max-w-2xl mx-auto space-y-1.5">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-text-primary">Institutional Engine Architecture</h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-text-secondary">
                                Praxis decomposes financial markets into nine deterministic computational engines running concurrently.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {PLATFORM_ENGINES.map((engine) => {
                                const Icon = engine.icon;
                                return (
                                    <div
                                        key={engine.id}
                                        className={`group p-5 rounded-2xl bg-white dark:bg-background-card/80 border ${engine.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative flex flex-col justify-between`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-10 h-10 rounded-xl ${engine.bg} ${engine.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                                    <Icon size={20} />
                                                </div>
                                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-text-tertiary border border-slate-200 dark:border-border-default/50">
                                                    {engine.badge}
                                                </span>
                                            </div>

                                            <div className="text-[11px] font-mono uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                                {engine.category}
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-text-primary mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {engine.title}
                                            </h3>
                                            <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed mb-4">
                                                {engine.desc}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => navigate(engine.path)}
                                            className="w-full flex items-center justify-between pt-3 border-t border-slate-100 dark:border-border-default/40 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors cursor-pointer"
                                        >
                                            <span>Launch {engine.title}</span>
                                            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 2: PACE & MACHINE LEARNING PIPELINE */}
                {activeTab === "pipeline" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="text-center max-w-2xl mx-auto space-y-1.5">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-text-primary">Bayesian Predictive Intelligence Stack</h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-text-secondary">
                                How raw market ticks transition through deterministic mathematical verification into calibrated Future Vision candlestick forecasts.
                            </p>
                        </div>

                        {/* Visual Workflow Steps */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                            {[
                                {
                                    step: "01",
                                    title: "Telemetry Ingestion",
                                    subtitle: "Upstox WebSocket Pipeline",
                                    desc: "Real-time tick-by-tick order book depth, trades, and Greeks captured directly to local cache.",
                                    icon: Activity,
                                    color: "border-blue-500/40 text-blue-500"
                                },
                                {
                                    step: "02",
                                    title: "Confluence Matrix",
                                    subtitle: "4-Pillar Validation",
                                    desc: "EMA 9/21 Trend, VWAP Alignment, Supertrend Regime, and RSI Momentum verified concurrently.",
                                    icon: Layers,
                                    color: "border-indigo-500/40 text-indigo-500"
                                },
                                {
                                    step: "03",
                                    title: "PACE Calibration",
                                    subtitle: "Bayesian Variance Shrinkage",
                                    desc: "Tracks Directional Accuracy & Close Bias error margins to systematically clamp generative model hallucinations.",
                                    icon: Cpu,
                                    color: "border-purple-500/40 text-purple-500"
                                },
                                {
                                    step: "04",
                                    title: "Future Vision",
                                    subtitle: "Generative Candlesticks",
                                    desc: "Produces 5-to-10 bar probabilistic path projections with dynamic upper/lower uncertainty error cones.",
                                    icon: Sparkles,
                                    color: "border-fuchsia-500/40 text-fuchsia-500"
                                },
                                {
                                    step: "05",
                                    title: "Retrospective Codification",
                                    subtitle: "Self-Healing Memory",
                                    desc: "Every closed prediction is scored in SQLite, updating the persistent profile for subsequent sessions.",
                                    icon: BookOpen,
                                    color: "border-emerald-500/40 text-emerald-500"
                                }
                            ].map((s, idx) => {
                                const Icon = s.icon;
                                return (
                                    <div
                                        key={s.step}
                                        className="p-5 rounded-2xl bg-white dark:bg-background-card/80 border border-slate-200 dark:border-border-default shadow-sm relative flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-mono font-black text-slate-400 dark:text-text-tertiary">
                                                    PHASE {s.step}
                                                </span>
                                                <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 ${s.color}`}>
                                                    <Icon size={16} />
                                                </div>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-text-primary mb-0.5">{s.title}</h4>
                                            <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold mb-2">{s.subtitle}</div>
                                            <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed">{s.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Deep Feature Callout Banner */}
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md">
                                    <ShieldCheck size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-text-primary">Anti-Hallucination & Grounding Guarantee</h3>
                                    <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed max-w-2xl">
                                        Praxis AI models operate under Level-4 clinical grounding guardrails. When real-time data is absent, the system seamlessly falls back to deterministic rule algorithms rather than inventing speculative metrics.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate("/dashboard/manual")}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                            >
                                <BookOpen size={14} />
                                <span>Explore 200 Playbooks</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB 3: RETAIL VS PRAXIS MATRIX */}
                {activeTab === "comparison" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="text-center max-w-2xl mx-auto space-y-1.5">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-text-primary">Ecosystem Differentiation</h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-text-secondary">
                                Comparing typical retail trading indicators against the Praxis institutional multi-factor infrastructure.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-background-card/90 border border-slate-200 dark:border-border-default rounded-2xl overflow-hidden shadow-lg">
                            <div className="grid grid-cols-1 md:grid-cols-12 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-border-default">
                                <div className="md:col-span-3 p-3.5 bg-slate-100/70 dark:bg-white/5 text-slate-500 dark:text-text-tertiary">Dimension</div>
                                <div className="md:col-span-4 p-3.5 bg-slate-100/40 dark:bg-background-surface text-rose-600 dark:text-rose-400">Legacy Retail Tools</div>
                                <div className="md:col-span-5 p-3.5 bg-blue-600/10 text-blue-600 dark:text-blue-400">Praxis Ecosystem</div>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-border-default/50">
                                {COMPARISON_DATA.map((row, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 text-xs hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                                        <div className="md:col-span-3 p-3.5 font-bold text-slate-800 dark:text-text-primary flex items-center gap-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-border-default/50">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <span>{row.dimension}</span>
                                        </div>
                                        <div className="md:col-span-4 p-3.5 text-slate-500 dark:text-text-tertiary flex items-start gap-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-border-default/50">
                                            <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                            <span className="line-through decoration-slate-400 dark:decoration-text-tertiary/70 leading-relaxed">{row.retail}</span>
                                        </div>
                                        <div className="md:col-span-5 p-3.5 font-medium text-slate-900 dark:text-text-primary flex items-start gap-2 bg-blue-50/20 dark:bg-blue-500/[0.02]">
                                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                            <span className="leading-relaxed">{row.praxis}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: TRADER MANDATE & RULES */}
                {activeTab === "mandate" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="text-center max-w-2xl mx-auto space-y-1.5">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-text-primary">Operational Mandate & Target Audience</h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-text-secondary">
                                Praxis enforces systematic discipline. It is built strictly for operators who treat capital as an institutional balance sheet.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* BUILT FOR */}
                            <div className="p-6 rounded-3xl bg-emerald-500/[0.03] border border-emerald-500/20 relative overflow-hidden shadow-sm">
                                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <h3 className="text-base font-bold uppercase tracking-wider">Built For</h3>
                                </div>
                                <ul className="space-y-3 text-xs text-slate-700 dark:text-text-secondary">
                                    {[
                                        "Quantitative systems traders executing rule-based playbooks with strict entry confluences.",
                                        "Option sellers and volatility arbitrageurs managing second-order Greek exposure (Vanna/Charm).",
                                        "Positional swing traders seeking macroeconomic grounding (Sovereign CDS, Central Bank liquidity).",
                                        "Discretionary traders seeking automated emotional telemetry (HRV tracking, 15-minute tilt locks).",
                                        "Serious capital operators who systematically journal every trade, loss, and psychological variance."
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5">
                                            <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* NOT FOR */}
                            <div className="p-6 rounded-3xl bg-rose-500/[0.03] border border-rose-500/20 relative overflow-hidden shadow-sm">
                                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
                                        <XCircle size={18} />
                                    </div>
                                    <h3 className="text-base font-bold uppercase tracking-wider">Not For</h3>
                                </div>
                                <ul className="space-y-3 text-xs text-slate-700 dark:text-text-secondary">
                                    {[
                                        "Gamblers looking for 'guaranteed' Telegram trade calls or get-rich-quick hero trades.",
                                        "Impulsive zero-day (0DTE) traders who gamble on out-of-the-money lotto calls without mathematical edge.",
                                        "Users expecting a fully passive, unmonitored 'autopilot bot' to take trades without human oversight.",
                                        "Traders who refuse to honor hard stop losses, risk budgets, or Max Daily Loss circuit ceilings.",
                                        "Individuals seeking emotional validation rather than clinical statistical accountability."
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5">
                                            <XCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 4. Core Institutional Axioms ──────────────────────────── */}
                <div className="space-y-6 pt-4">
                    <div className="text-center max-w-2xl mx-auto space-y-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-text-primary">Core Architectural Axioms</h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-text-secondary">
                            The four non-negotiable principles that govern all Praxis computational scoring algorithms.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                        <div className="p-5 rounded-2xl bg-white dark:bg-background-card/80 border border-slate-200 dark:border-border-default shadow-xs hover:border-emerald-500/40 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                                <Shield size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary mb-1">Risk First</h3>
                            <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed">
                                Capital preservation is the core axiom. Downside tail-risk and maximum drawdown are quantified prior to upside evaluation.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white dark:bg-background-card/80 border border-slate-200 dark:border-border-default shadow-xs hover:border-blue-500/40 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                                <Layers size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary mb-1">Regime Aware</h3>
                            <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed">
                                No metric exists in a vacuum. Intraday signals are continuously filtered by macro liquidity, volatility regimes, and IV rank.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white dark:bg-background-card/80 border border-slate-200 dark:border-border-default shadow-xs hover:border-purple-500/40 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                                <BrainCircuit size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary mb-1">Bayesian Shrinkage</h3>
                            <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed">
                                Models continuously calibrate past prediction accuracy, shrinking variance toward historical statistical reality.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white dark:bg-background-card/80 border border-slate-200 dark:border-border-default shadow-xs hover:border-amber-500/40 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                                <Target size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary mb-1">Execution Precision</h3>
                            <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed">
                                Ideas are meaningless without execution. Tools are calibrated for millisecond order execution, slippage reduction, and audit.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── 5. Institutional System Telemetry Footer ───────────────── */}
                <div className="border-t border-slate-200 dark:border-border-default pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500 dark:text-text-tertiary">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white dark:bg-background-surface border border-slate-200 dark:border-border-default">
                            <Code2 size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-slate-900 dark:text-text-primary font-bold">Engineered for Shanif (Shanu)</div>
                            <div className="text-[11px] font-mono opacity-80">Praxis Architecture v2.4.0-stable</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <button 
                            onClick={() => navigate("/dashboard/manual")}
                            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                            <BookOpen size={14} />
                            <span>Institutional Documentation Manual</span>
                        </button>
                        <button 
                            onClick={() => navigate("/dashboard/master")}
                            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                            <Terminal size={14} />
                            <span>Terminal Command Center</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">ALL SYSTEMS NOMINAL</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

