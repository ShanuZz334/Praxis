import React from "react";
import {
    Shield,
    Layers,
    Zap,
    Target,
    CheckCircle2,
    XCircle,
    BrainCircuit,
    ArrowRight,
    Github,
    Mail,
    Code2,
    Terminal
} from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen w-full relative pb-20 overflow-hidden font-sans text-text-primary">

            {/* BACKGROUND VFX */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12 md:py-20 space-y-12 md:space-y-24 animate-in fade-in duration-700">

                {/* 1. HERO SECTION */}
                <div className="text-center max-w-3xl mx-auto space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold uppercase tracking-widest animate-in slide-in-from-bottom-4 duration-700 delay-100">
                        <Terminal size={12} />
                        System Version 2.0
                    </div>

                    <h1 className="text-3xl md:text-6xl font-bold tracking-tight text-text-primary animate-in slide-in-from-bottom-4 duration-700 delay-200 leading-tight md:leading-tight">
                        Precision Intelligence <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500 block md:inline mt-2 md:mt-0">
                            For Discretionary Traders
                        </span>
                    </h1>

                    <p className="text-sm md:text-xl text-text-secondary leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-300 max-w-xl mx-auto md:max-w-3xl">
                        Stocky is not a signal service. It is an <span className="text-blue-500 font-medium">institutional-grade decision support system</span> designed to align market context, probability, and risk execution.
                    </p>
                </div>

                {/* 2. CORE PHILOSOPHY GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in slide-in-from-bottom-8 duration-700 delay-500">
                    <PhilosophyCard
                        icon={Shield}
                        title="Risk First"
                        desc="Capital preservation is the axiom. We quantify downside before identifying upside."
                        color="text-emerald-400"
                        bg="bg-emerald-500/5"
                        border="group-hover:border-emerald-500/30"
                    />
                    <PhilosophyCard
                        icon={Layers}
                        title="Context Aware"
                        desc="No indicator works in isolation. Signals are filtered through market regime logic."
                        color="text-blue-400"
                        bg="bg-blue-500/5"
                        border="group-hover:border-blue-500/30"
                    />
                    <PhilosophyCard
                        icon={BrainCircuit}
                        title="Process Driven"
                        desc="Systematizing discretion. We replace emotional guessing with probabilistic frameworks."
                        color="text-purple-400"
                        bg="bg-purple-500/5"
                        border="group-hover:border-purple-500/30"
                    />
                    <PhilosophyCard
                        icon={Target}
                        title="Execution Focus"
                        desc="Ideas are cheap. Execution is everything. Tools built for precision entry and exit."
                        color="text-amber-400"
                        bg="bg-amber-500/5"
                        border="group-hover:border-amber-500/30"
                    />
                </div>

                {/* 3. THE DIFFERENCE ENGINE (Comparison) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-in slide-in-from-bottom-8 duration-700 delay-700">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-text-primary">
                            Why <span className="text-blue-500">Stocky</span>?
                        </h2>
                        <p className="text-text-secondary leading-relaxed text-lg">
                            Most retail tools flood you with noise—endless alerts, lagging indicators, and "buy/sell" signals with zero context.
                            <br /><br />
                            Stocky is built differently. It's built to answer the question:
                            <span className="text-text-primary italic font-medium"> "Is this trade structurally sound?"</span>
                        </p>

                        <div className="p-6 rounded-2xl bg-background-card border border-border-default relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex items-start gap-4">
                                <Zap className="w-8 h-8 text-yellow-500 shrink-0" />
                                <div>
                                    <h4 className="text-lg font-bold text-text-primary mb-1">The "Edge"</h4>
                                    <p className="text-sm text-text-secondary">
                                        Stocky's edge lies in synthesis. It doesn't just look at price. It looks at Volatility (Options), Valuation (Fundamentals), and Macros (Global) simultaneously.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="bg-background-card border border-border-default rounded-2xl overflow-hidden shadow-2xl">
                        <div className="grid grid-cols-2 text-sm font-bold uppercase tracking-widest border-b border-border-default">
                            <div className="p-4 text-text-tertiary bg-background-surface">Retail Tools</div>
                            <div className="p-4 text-blue-500 bg-blue-500/10">Stocky Ecosystem</div>
                        </div>
                        <div className="divide-y divide-border-default">
                            <ComparisonRow old="Lagging Indicators" new="Predictive Volatility Models" />
                            <ComparisonRow old="Generic 'Buy' Alerts" new="Regime-Filtered Setups" />
                            <ComparisonRow old="Isolated Charts" new="Multi-Factor Synthesis" />
                            <ComparisonRow old="Unmanaged Risk" new="Dynamic Drawdown Controls" />
                            <ComparisonRow old="Emotional Trading" new="Journaled Discipline" />
                        </div>
                    </div>
                </div>

                {/* 4. AUDIENCE PROFILE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700 delay-1000">
                    {/* Who It Is For */}
                    <div className="p-8 rounded-3xl bg-emerald-500/[0.02] border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <CheckCircle2 size={120} className="text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-emerald-500 mb-6 flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6" /> Built For
                        </h3>
                        <ul className="space-y-4 relative z-10">
                            <CheckItem text="Systems traders seeking consistency" />
                            <CheckItem text="Option sellers managing Greek exposure" />
                            <CheckItem text="Swing traders focused on fundamentals" />
                            <CheckItem text="Anyone who journals their execution" />
                        </ul>
                    </div>

                    {/* Who It Is NOT For */}
                    <div className="p-8 rounded-3xl bg-red-500/[0.02] border border-red-500/20 relative overflow-hidden group hover:border-red-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <XCircle size={120} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-3">
                            <XCircle className="w-6 h-6" /> Not For
                        </h3>
                        <ul className="space-y-4 relative z-10">
                            <CrossItem text="Gamblers looking for 'guaranteed' calls" />
                            <CrossItem text="Impulsive zero-day (0DTE) heroes" />
                            <CrossItem text="People expecting automation/bots" />
                            <CrossItem text="Those unwilling to manage risk" />
                        </ul>
                    </div>
                </div>

                {/* 5. FOOTER / CREDITS */}
                <div className="border-t border-border-default pt-8 md:pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-text-tertiary animate-in fade-in duration-1000 delay-1000">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background-surface">
                            <Code2 size={20} className="text-text-secondary" />
                        </div>
                        <div>
                            <div className="text-text-primary font-medium">Engineered by Shanif</div>
                            <div className="text-xs opacity-70">v2.4.0-stable</div>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <a href="mailto:stocky.prop@gmail.com" className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                            <Mail size={16} /> stocky.prop@gmail.com
                        </a>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Systems Operational
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// -------------------------------------------------------------
// SUB COMPONENTS
// -------------------------------------------------------------

function PhilosophyCard({ icon: Icon, title, desc, color, bg, border }) {
    return (
        <div className={`
            group p-6 rounded-2xl bg-background-card border border-border-default 
            hover:border-opacity-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl
            ${border}
        `}>
            <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-blue-500 transition-colors">
                {title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed group-hover:text-text-primary">
                {desc}
            </p>
        </div>
    );
}

function ComparisonRow({ old, new: isNew }) {
    return (
        <div className="grid grid-cols-2 text-sm border-border-default group hover:bg-background-surface transition-colors">
            <div className="p-4 text-text-tertiary border-r border-border-default flex items-center gap-2">
                <XCircle size={14} className="shrink-0 opacity-50" />
                <span className="line-through decoration-text-tertiary">{old}</span>
            </div>
            <div className="p-4 text-text-primary font-medium flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                {isNew}
            </div>
        </div>
    );
}

function CheckItem({ text }) {
    return (
        <li className="flex items-start gap-3 text-text-secondary">
            <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
            <span>{text}</span>
        </li>
    );
}

function CrossItem({ text }) {
    return (
        <li className="flex items-start gap-3 text-text-tertiary">
            <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <span>{text}</span>
        </li>
    );
}
