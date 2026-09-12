import React, { useState, useEffect } from 'react';
import { Activity, Zap, Server, Shield, RefreshCw, Cpu, Clock, CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';

function formatCountdown(resetTimestamp, nowTimestamp, fallbackStr = 'Daily') {
    if (!resetTimestamp) return fallbackStr;
    const diffMs = resetTimestamp - nowTimestamp;
    if (diffMs <= 0) return 'Resetting...';
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
}

function ProgressBar({ percent = 100, label, current, total, color = 'emerald' }) {
    const num = Number(percent);
    const clamped = Math.max(0, Math.min(100, isNaN(num) ? 100 : num));
    const isUnderFull = (current !== undefined && total !== undefined && typeof current === 'number' && typeof total === 'number' && current < total && current > 0) || (clamped >= 99 && clamped < 100);
    const displayPct = isUnderFull 
        ? ((current !== undefined && total !== undefined && typeof current === 'number' && typeof total === 'number' && total > 0) 
            ? ((current / total) * 100).toFixed(1) 
            : clamped.toFixed(1))
        : Math.round(clamped);
    const barColor = clamped > 50 
        ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
        : clamped > 20 
        ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
        : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]';

    const textClass = clamped > 50 ? 'text-emerald-600 dark:text-emerald-400' : clamped > 20 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-text-tertiary">{label}</span>
                <div className="flex items-center gap-1.5">
                    <span className="text-text-primary font-medium">{current} <span className="opacity-40">/</span> {total}</span>
                    <span className={`font-bold ${textClass}`}>({displayPct}%)</span>
                </div>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-800/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60 dark:border-white/[0.04]">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${clamped}%` }}
                />
            </div>
        </div>
    );
}

export default function GatewayLimitsCard({ className = "" }) {
    const [gatewayData, setGatewayData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState(null);
    const [nowTimestamp, setNowTimestamp] = useState(Date.now());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const gatewayDataRef = React.useRef(null);
    gatewayDataRef.current = gatewayData;

    const isRefreshingRef = React.useRef(false);
    isRefreshingRef.current = isRefreshing;

    const fetchGatewayStatus = async () => {
        try {
            setIsRefreshing(true);
            const res = await axiosInstance.get('/api/v1/gateway/status');
            if (res.data?.providers) {
                setGatewayData(res.data.providers);
                setLastSync(new Date());
            }
        } catch (e) {
            console.error('[GatewayLimitsCard] Failed to fetch gateway status:', e);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchGatewayStatus();
        const pollInterval = setInterval(fetchGatewayStatus, 25000); // 25s auto-poll
        
        const tickInterval = setInterval(() => {
            const now = Date.now();
            setNowTimestamp(now);

            // Auto-replenish: If any exhausted provider's reset countdown has elapsed, fetch immediately
            if (gatewayDataRef.current && !isRefreshingRef.current) {
                const providers = Object.values(gatewayDataRef.current);
                const hasExpired = providers.some(p => {
                    if (!p.resetTimestamp) return false;
                    const isExhausted = p.status === 'Exhausted' || p.healthStatus === 'exhausted' || (p.remainingRequests !== 'Unlimited' && p.remainingRequests <= 0);
                    return isExhausted && now >= p.resetTimestamp;
                });
                if (hasExpired) {
                    fetchGatewayStatus();
                }
            }
        }, 1000); // 1s UI clock

        const handleRefresh = () => fetchGatewayStatus();
        window.addEventListener('ai_gateway_refresh', handleRefresh);

        return () => {
            clearInterval(pollInterval);
            clearInterval(tickInterval);
            window.removeEventListener('ai_gateway_refresh', handleRefresh);
        };
    }, []);

    if (loading && !gatewayData) {
        return (
            <div className={`bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm animate-pulse ${className}`}>
                <div className="h-6 bg-white/[0.04] rounded-md w-1/4 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 bg-white/[0.02] rounded-xl border border-white/[0.04]" />
                    ))}
                </div>
            </div>
        );
    }

    if (!gatewayData) return null;

    const providersList = Object.values(gatewayData);

    return (
        <div className={`bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm ${className}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Activity size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-semibold text-text-primary tracking-tight">AI Gateway Provider Limits</h3>
                            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live Telemetry
                            </span>
                        </div>
                        <p className="text-[11px] text-text-tertiary mt-0.5">
                            Real-time rate-limit headers intercepted directly from provider inference pipelines (Zero Mock Data)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {lastSync && (
                        <span className="text-[10px] font-mono text-text-tertiary">
                            Synced: {lastSync.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={fetchGatewayStatus}
                        disabled={isRefreshing}
                        className="p-1.5 rounded-lg bg-background-surface hover:bg-white/[0.06] border border-border-default/40 text-text-secondary hover:text-text-primary transition-all disabled:opacity-50"
                        title="Sync live gateway headers"
                    >
                        <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-400' : ''} />
                    </button>
                </div>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3">
                {providersList.map(prov => {
                    const isOnline = prov.status === 'Online';
                    const isExhausted = prov.status === 'Exhausted' || prov.healthStatus === 'exhausted' || (prov.remainingRequests !== 'Unlimited' && prov.requestsPercent === 0);
                    const isOllama = prov.id === 'ollama';

                    // Dynamic reset countdown
                    let resetText = prov.resetCountdown || 'Active';
                    if (prov.resetTimestamp) {
                        resetText = formatCountdown(prov.resetTimestamp, nowTimestamp, prov.resetCountdown || 'Daily');
                    }

                    const statusDotColor = isExhausted 
                        ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)] animate-pulse' 
                        : isOnline 
                        ? 'bg-emerald-400' 
                        : 'bg-zinc-500';
                    const statusText = isExhausted ? 'EXHAUSTED' : prov.status;
                    const statusTextColor = isExhausted ? 'text-rose-400 font-semibold' : 'text-text-tertiary';

                    return (
                        <div
                            key={prov.id}
                            className="bg-white dark:bg-background-surface/30 hover:bg-slate-50 dark:hover:bg-background-surface/60 border border-slate-200/80 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.1] rounded-xl p-3.5 flex flex-col justify-between transition-all duration-150"
                        >
                            {/* Top row */}
                            <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[13px] font-bold text-text-primary truncate">
                                        {prov.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={`w-2 h-2 rounded-full ${statusDotColor}`} />
                                        <span className={`text-[10px] font-mono uppercase ${statusTextColor}`}>
                                            {statusText}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider block mb-3 opacity-70">
                                    {prov.type}
                                </span>

                                {/* Progress Bars */}
                                <div className="space-y-3">
                                    {isOllama ? (
                                        <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.03] space-y-1">
                                            <div className="flex justify-between items-center text-[11px] font-mono">
                                                <span className="text-text-tertiary">Local Compute:</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Unlimited</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-mono text-text-tertiary">
                                                <span>Active Models:</span>
                                                <span className="text-text-secondary">{prov.modelCount || 0} installed</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <ProgressBar 
                                                percent={prov.requestsPercent}
                                                label="Requests Left"
                                                current={prov.remainingRequests}
                                                total={prov.limitRequests}
                                            />
                                            {prov.limitTokens && (
                                                <ProgressBar 
                                                    percent={prov.tokensPercent || 100}
                                                    label="Tokens Left"
                                                    current={prov.remainingTokens > 1000 ? `${Math.round(prov.remainingTokens / 1000)}K` : prov.remainingTokens}
                                                    total={prov.limitTokens > 1000 ? `${Math.round(prov.limitTokens / 1000)}K` : prov.limitTokens}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Bottom row: Reset timer */}
                            <div className="mt-4 pt-2.5 border-t border-slate-200/80 dark:border-white/[0.04] flex items-center justify-between text-[10px] font-mono">
                                <span className="text-text-tertiary truncate">
                                    {prov.resetSchedule?.split('@')[0] || 'Reset'}
                                </span>
                                <span className="text-blue-500 dark:text-blue-400 font-medium shrink-0 ml-1">
                                    {resetText}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
