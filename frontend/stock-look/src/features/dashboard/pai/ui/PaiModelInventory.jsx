import React, { useState, useEffect } from 'react';
import { Cpu, Info, Search, X, Shield, Sparkles, Check, AlertTriangle, Layers, Clock } from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { MODEL_CATALOG } from '../data/modelCatalogData';

/**
 * Minimal Circular Ring Gauge matching user reference:
 * [54%] [⭕ ring]
 */
function ModelGauge({ percent = 100, size = 32, strokeWidth = 3.2 }) {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    const colorClass = clamped > 65 ? 'text-emerald-500' : clamped > 35 ? 'text-amber-500' : 'text-rose-500';

    return (
        <div className="flex items-center gap-2 select-none">
            <span className="text-[13px] font-bold text-text-primary font-mono tracking-tight">
                {clamped}%
            </span>
            <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                        className="text-neutral-800 dark:text-neutral-800"
                        strokeWidth={strokeWidth}
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                        className={`${colorClass} transition-all duration-500`}
                        strokeDasharray={`${clamped}, 100`}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                </svg>
            </div>
        </div>
    );
}

function formatCountdown(resetTimestamp, nowTimestamp, fallbackStr = 'Daily') {
    if (!resetTimestamp) return fallbackStr;
    const diffMs = Math.max(0, resetTimestamp - nowTimestamp);
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
}

function formatModalCountdown(resetTimestamp, nowTimestamp, fallbackStr = 'Daily') {
    if (!resetTimestamp) return fallbackStr;
    const diffMs = Math.max(0, resetTimestamp - nowTimestamp);
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
}

export function formatScheduleTo12Hr(str) {
    if (!str || typeof str !== 'string') return str || '';
    if (/\b(AM|PM)\b/i.test(str)) return str;
    return str.replace(/(\b\d{1,2}):(\d{2})(?::(\d{2}))?\b/g, (match, h, m, s) => {
        let hour = parseInt(h, 10);
        if (hour >= 24) return match;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return s !== undefined ? `${hour}:${m}:${s} ${ampm}` : `${hour}:${m} ${ampm}`;
    });
}

export default function PaiModelInventory({ providers = [], localModels = [] }) {
    const [selectedProvider, setSelectedProvider] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeModalModel, setActiveModalModel] = useState(null);
    const [quotasData, setQuotasData] = useState(null);
    const [nowTimestamp, setNowTimestamp] = useState(Date.now());

    useEffect(() => {
        let isMounted = true;
        const fetchQuotas = async () => {
            try {
                const res = await axiosInstance.get('/api/v1/ai-settings/quotas');
                if (isMounted && res.data?.quotas) {
                    setQuotasData(res.data.quotas);
                }
            } catch (e) {
                console.error('[PaiModelInventory] Failed to fetch live quotas:', e);
            }
        };

        fetchQuotas();
        const pollInterval = setInterval(fetchQuotas, 30000); // 30s poll
        const tickInterval = setInterval(() => setNowTimestamp(Date.now()), 1000); // 1s UI clock

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
            clearInterval(tickInterval);
        };
    }, []);

    // Extract ONLY models currently configured in the user's active providers
    const activeAppModels = React.useMemo(() => {
        const configuredMap = new Map();

        providers.forEach(p => {
            const rawPId = String(p.providerId || '').toLowerCase().trim();
            const pKey = rawPId.startsWith('openrouter') ? 'openrouter' 
                : rawPId.startsWith('groq') ? 'groq' 
                : rawPId.startsWith('gemini') ? 'gemini'
                : rawPId.startsWith('zai') || rawPId.includes('zhipu') ? 'zai'
                : rawPId.startsWith('ollama') ? 'ollama'
                : rawPId;

            if (p.providerId === 'ollama') {
                if (localModels && localModels.length > 0) {
                    localModels.forEach(lm => {
                        if (lm.modelId) {
                            const cleanId = lm.modelId.trim();
                            const slotKey = `ollama::local::${cleanId.toLowerCase()}`;
                            configuredMap.set(slotKey, {
                                id: cleanId,
                                displayName: lm.displayName || cleanId,
                                providerName: p.displayName || 'Local Ollama',
                                providerKey: 'ollama',
                                tier: 'Local Fast'
                            });
                        }
                    });
                } else if (p.models) {
                    Object.entries(p.models).forEach(([tier, modelId]) => {
                        if (modelId && typeof modelId === 'string' && modelId.trim()) {
                            const cleanId = modelId.trim();
                            const slotKey = `ollama::${tier}::${cleanId.toLowerCase()}`;
                            configuredMap.set(slotKey, {
                                id: cleanId,
                                displayName: cleanId.split('/').pop().replace(':free', ''),
                                providerName: p.displayName || 'Local Ollama',
                                providerKey: 'ollama',
                                tier: tier.replace('level', 'Level ').replace('_', ' ')
                            });
                        }
                    });
                }
            } else if (p.models) {
                Object.entries(p.models).forEach(([tier, modelId]) => {
                    if (modelId && typeof modelId === 'string' && modelId.trim()) {
                        const cleanId = modelId.trim();
                        const slotKey = `${p.providerId}::${tier}::${cleanId.toLowerCase()}`;

                        configuredMap.set(slotKey, {
                            id: cleanId,
                            displayName: cleanId.split('/').pop().replace(':free', ''),
                            providerName: p.displayName || 'Active Provider',
                            providerKey: pKey,
                            tier: tier.replace('level', 'Level ').replace('_', ' ')
                        });
                    }
                });
            }
        });

        const list = [];
        configuredMap.forEach((meta, slotKey) => {
            const rawId = meta.id.toLowerCase().trim();
            const rawNoFree = rawId.replace(':free', '');
            const rawSuffix = rawNoFree.split('/').pop();

            // Strict matching hierarchy:
            let found = MODEL_CATALOG.find(m => m.id.toLowerCase() === rawId);
            if (!found) {
                found = MODEL_CATALOG.find(m => m.id.toLowerCase().replace(':free', '') === rawNoFree);
            }
            if (!found) {
                found = MODEL_CATALOG.find(m => {
                    const mSuffix = m.id.split('/').pop().replace(':free', '').toLowerCase();
                    return mSuffix === rawSuffix;
                });
            }

            // Real Live Quota lookup (0 mock data)
            const q = quotasData?.[slotKey] || quotasData?.[`${meta.providerKey}::${meta.id.toLowerCase()}`] || null;
            const remainingPercent = q?.remainingPercent !== undefined ? q.remainingPercent : 100;

            const baseModel = found || {
                id: meta.id,
                name: meta.displayName,
                maker: meta.providerName,
                architecture: 'Configured Provider Model',
                parameters: { total: 'Active', active: 'Active' },
                contextWindow: '128,000 (128K)',
                maxOutput: '8,192 tokens',
                speed: 'Active Gateway',
                pricing: 'Configured',
                refreshSchedule: formatScheduleTo12Hr(q?.resetSchedule) || 'Daily @ 12:00 AM UTC',
                resetType: q?.resetType || 'daily',
                limits: { rpm: 'Active', rpd: q?.limitRequests || 'Active', tpm: 'Active' },
                pros: ['Wired into active Praxis AI pipeline'],
                cons: ['Subject to provider rate limits'],
                bestFor: `Task routing in ${meta.providerName}`,
                recommendedTier: meta.tier
            };

            list.push({
                ...baseModel,
                slotKey,
                provider: meta.providerName,
                providerKey: meta.providerKey,
                assignedTier: meta.tier,
                recommendedTier: meta.tier || baseModel.recommendedTier,
                // Real Live Quota Tracking (0 mock data)
                remainingPercent,
                requestsToday: q?.requestsToday ?? 0,
                tokensToday: q?.tokensToday ?? 0,
                limitRequests: q?.limitRequests ?? baseModel.limits?.rpd ?? 'Active',
                remainingRequests: q?.remainingRequests ?? 'Active',
                resetType: q?.resetType ?? baseModel.resetType ?? 'daily',
                resetSchedule: formatScheduleTo12Hr(q?.resetSchedule ?? baseModel.refreshSchedule ?? 'Daily Reset'),
                resetTimeStr: q?.resetTimeStr || '',
                resetTimestamp: q?.resetTimestamp || null,
                resetTimezone: q?.resetTimezone || 'UTC',
                status: q?.status || 'Active'
            });
        });

        return list;
    }, [providers, localModels, quotasData]);

    // Build minimal tabs with dynamic counts
    const activeProviderTabs = React.useMemo(() => {
        const counts = { all: activeAppModels.length };
        activeAppModels.forEach(m => {
            const key = m.providerKey || 'other';
            counts[key] = (counts[key] || 0) + 1;
        });

        const tabs = [{ id: 'all', label: 'All Models', count: activeAppModels.length }];
        if (counts.openrouter) tabs.push({ id: 'openrouter', label: 'OpenRouter', count: counts.openrouter });
        if (counts.groq) tabs.push({ id: 'groq', label: 'Groq', count: counts.groq });
        if (counts.gemini) tabs.push({ id: 'gemini', label: 'Google Gemini', count: counts.gemini });
        if (counts.zai) tabs.push({ id: 'zai', label: 'Z.AI', count: counts.zai });
        if (counts.ollama) tabs.push({ id: 'ollama', label: 'Ollama', count: counts.ollama });
        return tabs;
    }, [activeAppModels]);

    const filteredModels = React.useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return activeAppModels.filter(model => {
            // Provider Filter
            const matchesProvider = selectedProvider === 'all' || 
                String(model.providerKey || '').toLowerCase() === String(selectedProvider).toLowerCase();
            
            if (!matchesProvider) return false;

            // Search Filter
            if (!q) return true;

            const searchableFields = [
                model.name,
                model.id,
                model.provider,
                model.providerKey,
                model.maker,
                model.assignedTier,
                model.recommendedTier,
                model.architecture,
                model.bestFor,
                model.contextWindow,
                model.maxOutput
            ];

            return searchableFields.some(field => field && String(field).toLowerCase().includes(q));
        });
    }, [activeAppModels, selectedProvider, searchQuery]);

    return (
        <div className="bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm mt-6">
            {/* Minimal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-purple-500" />
                    <h3 className="text-[15px] font-semibold text-text-primary">Active Models & Quotas</h3>
                    <span className="text-[11px] font-mono text-text-tertiary bg-background-surface px-2 py-0.5 rounded-md border border-border-default/30">
                        {filteredModels.length !== activeAppModels.length 
                            ? `${filteredModels.length} of ${activeAppModels.length} active`
                            : `${activeAppModels.length} active`
                        }
                    </span>
                </div>

                {/* Minimal Search */}
                <div className="relative w-full sm:w-56">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search models, makers, tiers..."
                        className="w-full pl-7 pr-6 py-1.5 text-[11px] rounded-lg bg-background-surface border border-border-default/40 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                    {searchQuery && (
                        <button 
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5"
                            title="Clear search"
                        >
                            <X size={11} />
                        </button>
                    )}
                </div>
            </div>

            {/* Minimal Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
                {activeProviderTabs.map(opt => {
                    const isSelected = selectedProvider === opt.id;
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedProvider(opt.id)}
                            className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap focus:outline-none ${
                                isSelected
                                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm font-semibold'
                                    : 'text-text-tertiary hover:text-text-primary hover:bg-white/[0.04] border border-transparent'
                            }`}
                        >
                            <span>{opt.label}</span>
                            <span className={`text-[9px] font-mono ${isSelected ? 'text-blue-300/90 font-bold' : 'opacity-60'}`}>
                                ({opt.count})
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── Minimal 5 in a Row Grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-3">
                {filteredModels.map(model => {
                    let refreshText = 'Active';
                    if (model.resetType === 'continuous') {
                        refreshText = model.status === 'Offline' ? 'Offline' : 'Local';
                    } else if (model.resetType === 'rolling') {
                        refreshText = model.resetTimeStr || 'Rolling';
                    } else if (model.resetTimestamp) {
                        refreshText = formatCountdown(model.resetTimestamp, nowTimestamp, model.resetTimeStr || 'Daily');
                    } else {
                        refreshText = model.resetTimeStr || 'Daily';
                    }

                    return (
                        <div 
                            key={model.slotKey || model.id}
                            className="group bg-background-surface/30 hover:bg-background-surface/70 border border-white/[0.04] hover:border-white/[0.12] rounded-xl p-3 flex flex-col justify-between transition-all duration-150"
                        >
                            {/* Top row: Muted Provider Tag & (i) info button */}
                            <div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary tracking-wide uppercase">
                                    <span className="truncate pr-1 opacity-70">
                                        {model.provider}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveModalModel(model)}
                                        className="text-text-tertiary hover:text-text-primary p-0.5 rounded transition-colors"
                                        title="View specifications and limits"
                                    >
                                        <Info size={12} />
                                    </button>
                                </div>

                                {/* Model Name & Brief Context Specs */}
                                <h4 className="text-[12px] font-medium text-text-primary truncate mt-1 group-hover:text-blue-400 transition-colors" title={model.name}>
                                    {model.name}
                                </h4>
                                <p className="text-[10px] text-text-tertiary font-mono truncate mt-0.5">
                                    <span className="text-blue-400/80 font-medium">{model.assignedTier || model.recommendedTier}</span> • {model.contextWindow?.split(' ')[0] || '128K'}
                                </p>
                            </div>

                            {/* Bottom row: Reset Interval & Circular Gauge */}
                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.04]">
                                <div className="flex flex-col text-[10px] font-mono text-text-tertiary">
                                    <span className="opacity-60 text-[9px] uppercase">Reset</span>
                                    <span className="text-text-secondary">{refreshText}</span>
                                </div>
                                <ModelGauge percent={model.remainingPercent} size={28} strokeWidth={3.0} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredModels.length === 0 && (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                    <p className="text-text-tertiary text-[12px]">
                        No configured models found {searchQuery ? `matching "${searchQuery}"` : ''} {selectedProvider !== 'all' ? `for ${activeProviderTabs.find(t => t.id === selectedProvider)?.label || selectedProvider}` : ''}.
                    </p>
                    <button
                        type="button"
                        onClick={() => { setSelectedProvider('all'); setSearchQuery(''); }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4"
                    >
                        Reset filters & search
                    </button>
                </div>
            )}

            {/* ── Minimal Detail Modal ── */}
            {activeModalModel && (
                <div 
                    className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => setActiveModalModel(null)}
                >
                    <div 
                        className="relative w-full max-w-xl bg-background-card border border-border-default/60 rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between p-4 border-b border-border-default/30 bg-background-surface/40">
                            <div>
                                <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block mb-0.5">
                                    {activeModalModel.provider} • {activeModalModel.maker}
                                </span>
                                <h3 className="text-[15px] font-bold text-text-primary">
                                    {activeModalModel.name}
                                </h3>
                                <p className="text-[10px] font-mono text-text-tertiary mt-0.5">
                                    {activeModalModel.id}
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveModalModel(null)}
                                className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-4 text-[12px] text-text-secondary">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-background-surface/50 p-2.5 rounded-lg border border-white/[0.04]">
                                    <span className="text-[9px] uppercase tracking-wider text-text-tertiary block mb-0.5">Parameters</span>
                                    <span className="text-[12px] font-mono font-bold text-text-primary">{activeModalModel.parameters.total}</span>
                                    <span className="text-[9px] text-text-tertiary block">{activeModalModel.parameters.active}</span>
                                </div>
                                <div className="bg-background-surface/50 p-2.5 rounded-lg border border-white/[0.04]">
                                    <span className="text-[9px] uppercase tracking-wider text-text-tertiary block mb-0.5">Context</span>
                                    <span className="text-[12px] font-mono font-bold text-text-primary">{activeModalModel.contextWindow}</span>
                                    <span className="text-[9px] text-text-tertiary block">Out: {activeModalModel.maxOutput}</span>
                                </div>
                                <div className="bg-background-surface/50 p-2.5 rounded-lg border border-white/[0.04]">
                                    <span className="text-[9px] uppercase tracking-wider text-text-tertiary block mb-0.5">Quota Remaining</span>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[13px] font-mono font-bold text-text-primary">{activeModalModel.remainingPercent}%</span>
                                        <ModelGauge percent={activeModalModel.remainingPercent} size={24} strokeWidth={3.0} />
                                    </div>
                                    <span className="text-[9px] text-emerald-400 font-mono block mt-0.5">
                                        {activeModalModel.remainingRequests} left
                                    </span>
                                </div>
                            </div>

                            {/* Rate Limits & Live Utilization */}
                            <div className="bg-background-surface/30 p-3 rounded-lg border border-white/[0.04] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-text-primary uppercase tracking-wider">
                                        Rate Limits & Live Utilization
                                    </span>
                                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        {activeModalModel.status || 'Active'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                    <div><span className="text-text-tertiary">Daily Limit: </span><span className="text-text-primary font-bold">{activeModalModel.limitRequests}</span></div>
                                    <div><span className="text-text-tertiary">Used Today: </span><span className="text-blue-400 font-bold">{activeModalModel.requestsToday ?? 0}</span></div>
                                    <div><span className="text-text-tertiary">Remaining: </span><span className="text-emerald-400 font-bold">{activeModalModel.remainingRequests}</span></div>
                                    {activeModalModel.limits?.rpm && (
                                        <div><span className="text-text-tertiary">Burst RPM: </span>{activeModalModel.limits.rpm}</div>
                                    )}
                                    {activeModalModel.limits?.tpm && (
                                        <div><span className="text-text-tertiary">TPM: </span>{activeModalModel.limits.tpm}</div>
                                    )}
                                    {activeModalModel.limits?.concurrency && (
                                        <div><span className="text-text-tertiary">In-flight: </span><span className="text-purple-400 font-semibold">{activeModalModel.limits.concurrency}</span></div>
                                    )}
                                </div>
                                <div className="text-[10px] text-text-tertiary pt-2 border-t border-white/[0.04] flex flex-wrap items-center justify-between gap-1">
                                    <span>Schedule: <strong className="text-text-primary font-mono">{formatScheduleTo12Hr(activeModalModel.resetSchedule)}</strong></span>
                                    {activeModalModel.resetTimestamp && (
                                        <span>
                                            Resets in: <strong className="text-blue-400 font-mono">{formatModalCountdown(activeModalModel.resetTimestamp, nowTimestamp)}</strong>
                                            <span className="text-text-tertiary ml-1 font-mono text-[9px]">
                                                ({new Date(activeModalModel.resetTimestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })})
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Task Mapping */}
                            <div className="p-3 bg-blue-500/[0.03] border border-blue-500/15 rounded-lg">
                                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                                    Recommended Praxis Task
                                </span>
                                <p className="text-[11px] text-text-secondary leading-relaxed">
                                    {activeModalModel.bestFor}
                                </p>
                            </div>

                            {/* Pros & Cons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                                <div className="p-3.5 bg-emerald-500/[0.03] border border-emerald-500/15 rounded-lg">
                                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-2">
                                        Pros
                                    </span>
                                    <ul className="space-y-2 text-text-secondary">
                                        {activeModalModel.pros.map((p, i) => (
                                            <li key={i} className="flex items-start gap-1.5">
                                                <span className="text-emerald-400 mt-0.5 leading-none shrink-0">•</span>
                                                <span className="leading-relaxed break-words">{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-3.5 bg-rose-500/[0.03] border border-rose-500/15 rounded-lg">
                                    <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block mb-2">
                                        Cons
                                    </span>
                                    <ul className="space-y-2 text-text-secondary">
                                        {activeModalModel.cons.map((c, i) => (
                                            <li key={i} className="flex items-start gap-1.5">
                                                <span className="text-rose-400 mt-0.5 leading-none shrink-0">•</span>
                                                <span className="leading-relaxed break-words">{c}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 border-t border-border-default/30 bg-background-surface/30 flex justify-end">
                            <button
                                onClick={() => setActiveModalModel(null)}
                                className="px-3 py-1 text-[11px] font-medium bg-white/5 hover:bg-white/10 text-text-primary rounded-md transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
