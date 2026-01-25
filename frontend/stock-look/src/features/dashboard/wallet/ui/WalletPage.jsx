import React from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Shield, CheckCircle, Zap, Activity, GripHorizontal, ArrowRight, Wallet } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { MOCK_WALLET_DATA } from "../data/walletData";
import { colors } from "@/shared/global/styles/palette";

export default function WalletPage() {
    const { summary, allocation, performance, riskRules, positions, systemNote } = MOCK_WALLET_DATA;

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-700">
            {/* 1. TOP SUMMARY STRIP (HERO) */}
            <SummaryStrip summary={summary} />

            {/* 2. CAPITAL ALLOCATION PANEL */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                {allocation.map((item) => (
                    <AllocationCard key={item.id} item={item} />
                ))}
            </div>

            {/* 3. PERFORMANCE & DRAWDOWN + 4. RISK GUARDRAILS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                {/* Left Column: Performance & Drawdown Cards */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EquityCurveCard data={performance.equityCurve} />
                    <DrawdownMonitor drawdown={performance.drawdown} />
                </div>

                {/* Right Column: Risk Guardrails */}
                <div className="lg:col-span-1">
                    <RiskGuardrails rules={riskRules} />
                </div>
            </div>

            {/* 5. LIVE POSITIONS SUMMARY */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <LivePositionsTable positions={positions} />
            </div>

            {/* 6. SYSTEM NOTES */}
            <SystemNote note={systemNote} />
        </div>
    );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function SummaryStrip({ summary }) {
    const isPnLPositive = summary.todayPnL >= 0;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-[#0b1220] border border-white/10 shadow-2xl">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10 flex flex-wrap items-center justify-between px-8 py-6 gap-6">

                {/* Available Capital */}
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-blue-300/60 uppercase tracking-widest mb-0.5">Available Capital</div>
                        <div className="text-3xl font-bold text-white tracking-tight font-mono">
                            ₹{summary.availableCapital.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px h-12 bg-white/5" />

                {/* P&L Hero */}
                <div className="flex flex-col">
                    <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Today's P&L</div>
                    <div className="flex items-baseline gap-3">
                        <span className={`text-4xl font-bold tracking-tighter ${isPnLPositive ? "text-emerald-400" : "text-red-400"}`}>
                            {isPnLPositive ? "+" : ""}₹{summary.todayPnL.toLocaleString()}
                        </span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${isPnLPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                            {summary.todayPnLPct}%
                        </span>
                    </div>
                </div>

                {/* Risk Stats */}
                <div className="flex gap-8">
                    <MetricItem
                        label="Open Risk"
                        value={`${summary.openRiskPct}%`}
                        valueClass="text-orange-400"
                    />
                    <MetricItem
                        label="Max Risk"
                        value={`${summary.maxRiskAllowedPct}%`}
                        valueClass="text-white/60"
                        subtext="Per Day"
                    />
                </div>

                {/* Mode Tag */}
                <div className="pl-6 border-l border-white/5">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${summary.activeMode === 'Aggressive' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        summary.activeMode === 'Conservative' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${summary.activeMode === 'Aggressive' ? 'bg-red-500' :
                            summary.activeMode === 'Conservative' ? 'bg-emerald-500' :
                                'bg-blue-500'
                            }`} />
                        {summary.activeMode}
                    </span>
                </div>
            </div>
        </div>
    );
}

function MetricItem({ label, value, valueClass = "text-white", subtext }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">{label}</span>
            <span className={`text-xl font-bold font-mono tracking-tight ${valueClass}`}>{value}</span>
            {subtext && <span className="text-[9px] text-white/20">{subtext}</span>}
        </div>
    );
}

function AllocationCard({ item }) {
    const isHealthy = item.status === 'Healthy' || item.status === 'Optimal';
    const isElevated = item.status === 'Elevated';

    const statusColor = isHealthy ? 'text-emerald-400' : isElevated ? 'text-red-400' : 'text-orange-400';
    const glowClass = isHealthy ? 'group-hover:shadow-[0_0_20px_rgba(52,211,153,0.1)]' : isElevated ? 'group-hover:shadow-[0_0_20px_rgba(248,113,113,0.1)]' : '';

    return (
        <div className={`relative bg-[#0b1220] border border-white/5 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 ${glowClass}`}>
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-white/50 text-[10px] uppercase font-bold tracking-widest">{item.name}</h3>
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border border-white/5 bg-white/5 ${statusColor}`}>
                    {item.status}
                </span>
            </div>

            <div className="mb-4">
                <div className="text-2xl font-bold text-white">{item.value}%</div>
                <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${isHealthy ? 'bg-emerald-500' : isElevated ? 'bg-red-500' : 'bg-orange-500'}`}
                        style={{ width: `${Math.min(item.value, 100)}%` }}
                    />
                </div>
            </div>

            <div className="flex items-start gap-2 pt-3 border-t border-white/5 mt-auto">
                <Zap className="w-3 h-3 text-white/20 mt-0.5 shrink-0" />
                <p className="text-[10px] text-white/40 italic leading-relaxed">
                    {item.suggestion}
                </p>
            </div>
        </div>
    );
}

function EquityCurveCard({ data }) {
    const isPositive = data[data.length - 1].val >= data[0].val;
    const color = isPositive ? colors.state.bullish.hex : colors.state.bearish.hex;

    return (
        <div className="relative bg-[#0b1220] border border-white/5 rounded-2xl p-6 flex flex-col h-full shadow-lg overflow-hidden group">
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 rounded bg-white/5 text-white/60">
                    <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Equity Curve</h3>
                    <p className="text-[10px] text-white/30 font-medium">Last 7 Days Performance</p>
                </div>
            </div>

            <div className="flex-1 min-h-[160px] w-full mt-2 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value) => [`₹${value}`, "Equity"]}
                            labelStyle={{ color: '#94a3b8' }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="val"
                            stroke={color}
                            strokeWidth={3}
                            fill="url(#equityGradient)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function DrawdownMonitor({ drawdown }) {
    const percentageUsed = (drawdown.current / drawdown.maxAllowed) * 100;
    const isCrisis = percentageUsed > 80;
    const isWarning = percentageUsed > 50;

    // Gauge Data for Pie Chart
    const gaugeData = [
        { name: 'Used', value: drawdown.current, fill: isCrisis ? colors.state.bearish.hex : isWarning ? '#fbbf24' : colors.state.bullish.hex }, // Red, Amber, Green
        { name: 'Remaining', value: Math.max(0, drawdown.maxAllowed - drawdown.current), fill: '#1e293b' },
    ];

    return (
        <div className="relative bg-[#0b1220] border border-white/5 rounded-2xl p-6 flex flex-col justify-between h-full shadow-lg overflow-hidden">
            <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="p-2 rounded bg-white/5 text-white/60">
                    <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Drawdown Monitor</h3>
                    <p className="text-[10px] text-white/30 font-medium">Real-time Risk Usage</p>
                </div>
            </div>

            <div className="flex items-center justify-center relative h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={gaugeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={70}
                            startAngle={180}
                            endAngle={0}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {gaugeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-0 text-center">
                    <div className={`text-3xl font-bold tracking-tighter ${isCrisis ? 'text-red-400' : 'text-white'}`}>
                        {drawdown.current}%
                    </div>
                    <div className="text-[9px] text-white/30 uppercase tracking-widest mt-1">Peak DD</div>
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span className="text-white/40 font-medium">Allowed Threshold</span>
                    <span className="text-white font-mono">{drawdown.maxAllowed}%</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-white/40 font-medium">Risk Budget Left</span>
                    <span className={`font-mono font-bold ${isCrisis ? 'text-red-400' : 'text-emerald-400'}`}>
                        {drawdown.riskBudgetLeft}%
                    </span>
                </div>
            </div>
        </div>
    );
}

function RiskGuardrails({ rules }) {
    return (
        <div className="relative bg-[#0b1220] border border-white/5 rounded-2xl p-6 h-full shadow-lg overflow-hidden">
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 rounded bg-white/5 text-white/60">
                    <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Risk Guardrails</h3>
            </div>

            <div className="space-y-3 relative z-10">
                {rules.map((rule) => (
                    <div
                        key={rule.id}
                        className={`
                            group flex items-start gap-4 p-4 rounded-xl border transition-all duration-300
                            ${rule.status === 'Triggered' ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' :
                                rule.status === 'Active' ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10' :
                                    'bg-white/[0.02] border-white/5 hover:bg-white/5'}
                        `}
                    >
                        <div className={`mt-0.5 ${rule.status === 'Triggered' ? 'text-red-400' : rule.status === 'Active' ? 'text-orange-400' : 'text-emerald-500/50'}`}>
                            {rule.status === 'Triggered' ? <AlertTriangle className="w-4 h-4" /> :
                                rule.status === 'Active' ? <Activity className="w-4 h-4" /> :
                                    <CheckCircle className="w-4 h-4" />}
                        </div>

                        <div className="flex-1">
                            <p className={`text-xs font-semibold mb-1 ${rule.status === 'Safe' ? 'text-white/60' : 'text-white'}`}>
                                {rule.text}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/30 font-medium">{rule.condition}</span>
                                <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 rounded ${rule.status === 'Triggered' ? 'text-red-400 bg-red-500/10' :
                                    rule.status === 'Active' ? 'text-orange-400 bg-orange-500/10' :
                                        'text-emerald-500 bg-emerald-500/10'
                                    }`}>
                                    {rule.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LivePositionsTable({ positions }) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const displayedPositions = isExpanded ? positions : positions.slice(0, 5);

    return (
        <div className="relative bg-[#0b1220] border border-white/5 rounded-2xl overflow-hidden shadow-lg transition-all duration-500">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-white/5 text-white/60">
                        <GripHorizontal className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Live Positions</h3>
                </div>
                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                    {positions.length} Active
                </div>
            </div>

            <div className="overflow-x-auto transition-all duration-500">
                <table className="w-full text-left text-sm text-white/70">
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] text-white/40 uppercase tracking-widest">
                            <th className="px-6 py-4 font-bold text-white">Instrument</th>
                            <th className="hidden md:table-cell px-6 py-4 font-bold">Type</th>
                            <th className="hidden md:table-cell px-6 py-4 font-bold">Exposure Space</th>
                            <th className="px-6 py-4 font-bold text-right md:text-left">Unrealized P&L</th>
                            <th className="hidden md:table-cell px-6 py-4 font-bold text-right pt-4 pr-8">Risk Tag</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {displayedPositions.map((pos) => (
                            <tr key={pos.id} className="hover:bg-white/[0.02] transition-colors group animate-in fade-in slide-in-from-top-1 duration-300">
                                <td className="px-6 py-4 font-medium text-white">
                                    {pos.instrument}
                                </td>
                                <td className="hidden md:table-cell px-6 py-4">
                                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-white/5 border border-white/5 text-white/60">
                                        {pos.type}
                                    </span>
                                </td>
                                <td className="hidden md:table-cell px-6 py-4">
                                    <div className="flex flex-col gap-1.5 w-32">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="font-mono text-white/70">{pos.exposure}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500/60 rounded-full"
                                                style={{ width: `${pos.exposure}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right md:text-left">
                                    <span className={`font-mono font-bold text-sm ${pos.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {pos.pnl >= 0 ? "+" : ""}{pos.pnl.toLocaleString()}
                                    </span>
                                </td>
                                <td className="hidden md:table-cell px-6 py-4 text-right">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${pos.riskTag === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                        pos.riskTag === 'Medium' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                        }`}>
                                        <span className={`w-1 h-1 rounded-full ${pos.riskTag === 'High' ? 'bg-red-500' :
                                            pos.riskTag === 'Medium' ? 'bg-orange-500' :
                                                'bg-emerald-500'
                                            }`} />
                                        {pos.riskTag}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {positions.length > 5 && (
                <div className="p-3 border-t border-white/5 bg-white/[0.02] flex justify-center">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-widest flex items-center gap-2 transition-colors"
                    >
                        {isExpanded ? (
                            <>Collapse <TrendingUp className="w-3 h-3 rotate-180" /></>
                        ) : (
                            <>View All Positions ({positions.length}) <ArrowRight className="w-3 h-3" /></>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

function SystemNote({ note }) {
    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-0.5">System Insight</h4>
                    <p className="text-sm text-blue-100/80 font-medium italic">"{note}"</p>
                </div>
            </div>
            <div className="hidden md:block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 font-bold uppercase tracking-widest">
                AI Mode: Active
            </div>
        </div>
    );
}
