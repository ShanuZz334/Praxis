/**
 * @file ModelFinetuneCard.jsx
 * @purpose Backtesting Workshop dedicated Model Fine-Tuning Box.
 * Renders per-model readiness gauges, live status badges, probation tooltips,
 * manual retraining triggers, and version audit history.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Sparkles, RefreshCw, Play, CheckCircle2, XCircle, AlertTriangle, 
    Clock, ShieldAlert, Cpu, ChevronDown, ChevronUp, History, Info
} from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { toast } from 'sonner';

export default function ModelFinetuneCard({
    instrument = 'NSE_INDEX|Nifty 50',
    timeframe = 'day',
    onClose = null,
}) {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [retrainingModel, setRetrainingModel] = useState(null);
    const [expandedHistoryModel, setExpandedHistoryModel] = useState(null);
    const [historyData, setHistoryData] = useState({});
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [message, setMessage] = useState(null);
    const [lastChecked, setLastChecked] = useState(null);

    // Reset expanded history and cache if asset changes
    useEffect(() => {
        setExpandedHistoryModel(null);
        setHistoryData({});
        setLoading(true);
    }, [instrument, timeframe]);

    const fetchStatus = useCallback(async (isManual = false) => {
        if (isManual) {
            setIsRefreshing(true);
        }
        const startTime = Date.now();
        try {
            const res = await axiosInstance.get('/api/v1/finetune/status', {
                params: { instrument, timeframe }
            });
            if (res.data && res.data.success) {
                setStatusData(res.data);
                const timeStr = new Date().toLocaleTimeString();
                setLastChecked(timeStr);
                if (isManual) {
                    toast.success(`Fine-tuning status updated (${timeStr})`, { id: 'finetune-status' });
                }
            }
        } catch (err) {
            console.error('Error fetching finetune status:', err);
            if (isManual) {
                toast.error('Failed to update fine-tuning status', { id: 'finetune-status' });
            }
        } finally {
            setLoading(false);
            if (isManual) {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 500 - elapsed);
                setTimeout(() => {
                    setIsRefreshing(false);
                }, remaining);
            }
        }
    }, [instrument, timeframe]);

    useEffect(() => {
        fetchStatus(false);
        const interval = setInterval(() => fetchStatus(false), 8000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleTriggerRetrain = async (modelId) => {
        try {
            setRetrainingModel(modelId);
            setMessage({ type: 'info', text: `Initiating retraining for ${modelId}...` });
            const res = await axiosInstance.post('/api/v1/finetune/trigger', {
                model_id: modelId,
                instrument,
                timeframe
            });
            if (res.data && res.data.success) {
                setMessage({ type: 'success', text: res.data.message || 'Retraining worker launched!' });
                fetchStatus();
            } else {
                setMessage({ type: 'error', text: res.data?.error || 'Failed to launch retraining.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || err.message });
        } finally {
            setRetrainingModel(null);
            setTimeout(() => setMessage(null), 6000);
        }
    };

    const toggleHistory = async (modelId) => {
        if (expandedHistoryModel === modelId) {
            setExpandedHistoryModel(null);
            return;
        }

        setExpandedHistoryModel(modelId);
        const cacheKey = `${modelId}|${instrument}|${timeframe}`;
        if (!historyData[cacheKey]) {
            setLoadingHistory(true);
            try {
                const res = await axiosInstance.get('/api/v1/finetune/history', {
                    params: { instrument, timeframe, limit: 15 }
                });
                if (res.data && res.data.history) {
                    const filtered = res.data.history.filter(h => h.model_id === modelId);
                    setHistoryData(prev => ({ ...prev, [cacheKey]: filtered }));
                }
            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setLoadingHistory(false);
            }
        }
    };

    const getStatusBadge = (model) => {
        const stage = model.stage;
        switch (stage) {
            case 'COLLECTING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Clock size={11} />
                        <span>COLLECTING</span>
                    </span>
                );
            case 'READY_TO_TRAIN':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        <CheckCircle2 size={11} />
                        <span>READY TO TRAIN</span>
                    </span>
                );
            case 'TRAINING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                        <RefreshCw size={11} className="animate-spin" />
                        <span>TRAINING</span>
                    </span>
                );
            case 'VALIDATING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <Sparkles size={11} />
                        <span>VALIDATING</span>
                    </span>
                );
            case 'PROMOTED':
                return (
                    <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-help"
                        title={model.is_probation ? "Probation: starts at 0.10 weight. Must earn higher weight through live prediction accuracy. Auto-reverts to base if live loss exceeds validation loss by 25%." : "Promoted to Live Production"}
                    >
                        <CheckCircle2 size={11} />
                        <span>PROMOTED {model.is_probation ? '(PROBATION)' : ''}</span>
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30" title={model.blocker || 'Failed validation gate'}>
                        <XCircle size={11} />
                        <span>REJECTED</span>
                    </span>
                );
            case 'DRIFT_REVERTED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-rose-400 border-2 border-rose-500/60" title={model.blocker || 'Reverted to base'}>
                        <ShieldAlert size={11} />
                        <span>DRIFT REVERTED</span>
                    </span>
                );
            case 'DEFERRED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700" title={model.blocker || 'Deferred'}>
                        <AlertTriangle size={11} />
                        <span>DEFERRED</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400">
                        {stage}
                    </span>
                );
        }
    };

    const getModelDisplayName = (id) => {
        switch (id) {
            case 'kronos':
                return { name: 'Kronos-small', desc: 'AAAI 2026 Foundation Model (24.7M)' };
            case 'chronos_bolt':
                return { name: 'Chronos-Bolt', desc: 'Amazon Distilled T5 Quantile Pipeline' };
            case 'lag_llama':
                return { name: 'Lag-Llama', desc: 'Probabilistic Time-Series Decoder' };
            default:
                return { name: id, desc: 'Ensemble Member' };
        }
    };

    return (
        <div className="w-full bg-background-card border border-border-subtle rounded-xl p-4 shadow-xl text-text-primary flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle/60 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Cpu size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black tracking-wide uppercase font-mono text-text-primary">
                                Auto-Fine-Tuning Studio
                            </h3>
                            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                                CONTINUOUS ML
                            </span>
                        </div>
                        <p className="text-[11px] text-text-tertiary">
                            Zero-shot base immutable fallback • Walk-forward promotion gate (&gt;3% edge) • Probation weight auto-revert
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-2 py-1 rounded-md bg-background-surface border border-border-subtle text-[11px] font-mono text-text-secondary flex items-center gap-1.5">
                        <span className="font-bold text-text-primary">{instrument}</span>
                        <span className="text-text-muted">•</span>
                        <span className="uppercase font-bold text-indigo-400">
                            {timeframe === '15minute' || timeframe === '15m' ? '15M' :
                             timeframe === '5minute' || timeframe === '5m' ? '5M' :
                             timeframe === '1minute' || timeframe === '1m' ? '1M' :
                             timeframe === 'day' ? '1D' :
                             timeframe === 'week' ? '1W' : timeframe}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchStatus(true)}
                        disabled={isRefreshing}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center active:scale-90 ${
                            isRefreshing
                                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                : 'bg-background-surface hover:bg-background-hover border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-secondary/40'
                        }`}
                        title="Refresh Status"
                    >
                        <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-indigo-400' : ''} />
                    </button>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-2 py-1 text-xs text-text-muted hover:text-text-primary transition cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Notification alert banner */}
            {message && (
                <div className={`px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between ${
                    message.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' :
                    message.type === 'error' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' :
                    'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                }`}>
                    <span>{message.text}</span>
                    <button type="button" onClick={() => setMessage(null)} className="cursor-pointer ml-2 text-text-muted hover:text-text-primary">✕</button>
                </div>
            )}

            {/* Table Matrix */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border-subtle text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
                            <th className="py-2 px-3">Model</th>
                            <th className="py-2 px-2 text-center">Data %</th>
                            <th className="py-2 px-2 text-center">Train %</th>
                            <th className="py-2 px-2 text-center">Val %</th>
                            <th className="py-2 px-2 text-center">Calib %</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Hedge Wt</th>
                            <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/50 text-xs">
                        {loading && !statusData ? (
                            [1, 2, 3].map(idx => (
                                <tr key={idx} className="animate-pulse">
                                    <td className="py-3 px-3"><div className="h-4 bg-background-surface rounded w-28 mb-1" /><div className="h-3 bg-background-surface rounded w-36" /></td>
                                    <td className="py-3 px-2"><div className="h-3 bg-background-surface rounded w-12 mx-auto" /></td>
                                    <td className="py-3 px-2"><div className="h-3 bg-background-surface rounded w-12 mx-auto" /></td>
                                    <td className="py-3 px-2"><div className="h-3 bg-background-surface rounded w-12 mx-auto" /></td>
                                    <td className="py-3 px-2"><div className="h-3 bg-background-surface rounded w-12 mx-auto" /></td>
                                    <td className="py-3 px-3"><div className="h-4 bg-background-surface rounded w-20" /></td>
                                    <td className="py-3 px-3"><div className="h-4 bg-background-surface rounded w-12" /></td>
                                    <td className="py-3 px-3 text-right"><div className="h-6 bg-background-surface rounded w-16 ml-auto" /></td>
                                </tr>
                            ))
                        ) : (!statusData?.models || statusData.models.length === 0) ? (
                            <tr>
                                <td colSpan={8} className="py-10 text-center text-text-tertiary">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Cpu size={28} className="text-text-muted opacity-60" />
                                        <div className="text-xs font-mono text-text-secondary">
                                            No readiness state rows found for {instrument} ({timeframe}).
                                        </div>
                                        <p className="text-[11px] text-text-muted max-w-sm">
                                            Click below to initialize foundation model tracking for this instrument & interval.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLoading(true);
                                                fetchStatus();
                                            }}
                                            className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                                        >
                                            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                                            <span>Initialize Model Matrix</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            statusData?.models?.map((model) => {
                                const { name, desc } = getModelDisplayName(model.model_id);
                                const isRetraining = retrainingModel === model.model_id;
                                const isDeferred = model.stage === 'DEFERRED';
                                const isCollecting = model.stage === 'COLLECTING';
                                const isTraining = model.stage === 'TRAINING';
                                const isValidating = model.stage === 'VALIDATING';
                                const canRetrain = !isDeferred && !isCollecting && !isTraining && !isValidating;

                            return (
                                <React.Fragment key={model.model_id}>
                                    <tr className="hover:bg-background-surface/50 transition">
                                        {/* Model Name */}
                                        <td className="py-3 px-3">
                                            <div className="font-bold text-text-primary font-mono">{name}</div>
                                            <div className="text-[10px] text-text-tertiary">{desc}</div>
                                        </td>

                                        {/* Data Progress */}
                                        <td className="py-3 px-2 text-center">
                                            <div className="w-16 mx-auto">
                                                <div className="h-1.5 w-full bg-background-surface rounded-full overflow-hidden border border-border-subtle">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${model.data_pct || 0}%` }}
                                                    />
                                                </div>
                                                <div className="text-[9px] font-mono text-text-secondary mt-0.5">
                                                    {model.data_pct}%
                                                </div>
                                            </div>
                                        </td>

                                        {/* Train Progress */}
                                        <td className="py-3 px-2 text-center">
                                            <div className="w-16 mx-auto">
                                                <div className="h-1.5 w-full bg-background-surface rounded-full overflow-hidden border border-border-subtle">
                                                    <div
                                                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${model.train_pct || 0}%` }}
                                                    />
                                                </div>
                                                <div className="text-[9px] font-mono text-text-secondary mt-0.5">
                                                    {model.train_pct}%
                                                </div>
                                            </div>
                                        </td>

                                        {/* Validation Progress */}
                                        <td className="py-3 px-2 text-center">
                                            <div className="w-16 mx-auto">
                                                <div className="h-1.5 w-full bg-background-surface rounded-full overflow-hidden border border-border-subtle">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${model.validation_pct || 0}%` }}
                                                    />
                                                </div>
                                                <div className="text-[9px] font-mono text-text-secondary mt-0.5">
                                                    {model.validation_pct}%
                                                </div>
                                            </div>
                                        </td>

                                        {/* Calibration Progress */}
                                        <td className="py-3 px-2 text-center">
                                            <div className="w-16 mx-auto">
                                                <div className="h-1.5 w-full bg-background-surface rounded-full overflow-hidden border border-border-subtle">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${model.calibration_pct || 0}%` }}
                                                    />
                                                </div>
                                                <div className="text-[9px] font-mono text-text-secondary mt-0.5">
                                                    {model.calibration_pct}%
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="py-3 px-3">
                                            <div>{getStatusBadge(model)}</div>
                                            <div className="text-[10px] text-text-tertiary mt-0.5 font-mono truncate max-w-[140px]" title={model.eta_text || model.blocker}>
                                                {model.eta_text || model.blocker || 'Standby'}
                                            </div>
                                        </td>

                                        {/* Hedge Weight */}
                                        <td className="py-3 px-3">
                                            <div className="font-mono text-xs font-bold text-text-primary">
                                                {(model.current_weight * 100).toFixed(1)}%
                                            </div>
                                            {model.is_probation ? (
                                                <div 
                                                    className="text-[9px] text-amber-400 font-mono flex items-center gap-0.5 cursor-help"
                                                    title="Probation: starts at 0.10 weight. Must earn higher weight through live prediction accuracy. Auto-reverts to base if live loss exceeds validation loss by 25%."
                                                >
                                                    <Info size={10} />
                                                    <span>Probation</span>
                                                </div>
                                            ) : (
                                                <div className="text-[9px] text-text-muted font-mono">Live</div>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTriggerRetrain(model.model_id)}
                                                    disabled={!canRetrain || isRetraining}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                                        canRetrain && !isRetraining
                                                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                                                            : 'bg-background-surface text-text-muted border border-border-subtle cursor-not-allowed opacity-50'
                                                    }`}
                                                    title={canRetrain ? 'Trigger immediate retraining subprocess' : 'Retraining currently unavailable'}
                                                >
                                                    {isRetraining ? (
                                                        <RefreshCw size={11} className="animate-spin" />
                                                    ) : (
                                                        <Play size={11} />
                                                    )}
                                                    <span>Retrain</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleHistory(model.model_id)}
                                                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                                        expandedHistoryModel === model.model_id
                                                            ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                                                            : 'bg-background-surface border-border-subtle text-text-secondary hover:text-text-primary'
                                                    }`}
                                                    title="View Version History & Audit Log"
                                                >
                                                    <History size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expandable Version History Drawer */}
                                    {expandedHistoryModel === model.model_id && (
                                        <tr>
                                            <td colSpan={8} className="p-3 bg-background-surface/80 border-t border-b border-border-subtle/80">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-[11px] font-mono font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                                                        <History size={12} className="text-indigo-400" />
                                                        <span>Version Audit History — {name}</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-text-tertiary">
                                                        Walk-forward validation on strictly unseen chronological candles
                                                    </span>
                                                </div>

                                                {(() => {
                                                    const cacheKey = `${model.model_id}|${instrument}|${timeframe}`;
                                                    const currentHistory = historyData[cacheKey] || [];

                                                    if (loadingHistory) {
                                                        return (
                                                            <div className="py-4 text-center text-xs text-text-muted font-mono">
                                                                Loading audit logs...
                                                            </div>
                                                        );
                                                    }
                                                    if (currentHistory.length === 0) {
                                                        return (
                                                            <div className="py-3 text-center text-xs text-text-muted font-mono">
                                                                No prior fine-tuning runs logged yet for this asset. Initial training run will establish v1.
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-background-card">
                                                            <table className="w-full text-left text-[11px] font-mono">
                                                                <thead>
                                                                    <tr className="border-b border-border-subtle text-text-tertiary bg-background-surface">
                                                                        <th className="py-1.5 px-2.5">Version</th>
                                                                        <th className="py-1.5 px-2.5">Status</th>
                                                                        <th className="py-1.5 px-2.5">Epochs</th>
                                                                        <th className="py-1.5 px-2.5">Val Pinball</th>
                                                                        <th className="py-1.5 px-2.5">Zero-Shot</th>
                                                                        <th className="py-1.5 px-2.5">Edge Δ%</th>
                                                                        <th className="py-1.5 px-2.5">80% Cov</th>
                                                                        <th className="py-1.5 px-2.5">Gate Notes</th>
                                                                        <th className="py-1.5 px-2.5 text-right">Finished</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border-subtle">
                                                                    {currentHistory.map((v) => (
                                                                        <tr key={v.id} className={v.is_currently_active ? 'bg-emerald-500/5' : ''}>
                                                                            <td className="py-1.5 px-2.5 font-bold">
                                                                                v{v.version_num} {v.is_currently_active && '⭐'}
                                                                            </td>
                                                                            <td className="py-1.5 px-2.5">
                                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                                                    v.status === 'PROMOTED' ? 'bg-emerald-500/15 text-emerald-400' :
                                                                                    v.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400' :
                                                                                    v.status === 'DRIFT_REVERTED' ? 'bg-amber-500/15 text-rose-400 border border-rose-500/50' :
                                                                                    'bg-zinc-800 text-zinc-400'
                                                                                }`}>
                                                                                    {v.status}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-1.5 px-2.5">{v.epochs_completed}/{v.epochs_total}</td>
                                                                            <td className="py-1.5 px-2.5">{v.val_pinball_loss ? v.val_pinball_loss.toFixed(4) : '—'}</td>
                                                                            <td className="py-1.5 px-2.5">{v.zero_shot_pinball_loss ? v.zero_shot_pinball_loss.toFixed(4) : '—'}</td>
                                                                            <td className="py-1.5 px-2.5">
                                                                                {v.improvement_vs_zero_shot_pct !== null && v.improvement_vs_zero_shot_pct !== undefined ? (
                                                                                    <span className={v.improvement_vs_zero_shot_pct > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                                                                                        {v.improvement_vs_zero_shot_pct > 0 ? `+${v.improvement_vs_zero_shot_pct.toFixed(2)}%` : `${v.improvement_vs_zero_shot_pct.toFixed(2)}%`}
                                                                                    </span>
                                                                                ) : '—'}
                                                                            </td>
                                                                            <td className="py-1.5 px-2.5">
                                                                                {v.val_coverage_80 ? `${(v.val_coverage_80 * 100).toFixed(1)}%` : '—'}
                                                                            </td>
                                                                            <td className="py-1.5 px-2.5 text-text-tertiary max-w-[200px] truncate" title={v.rejection_reason || 'Gate Passed'}>
                                                                                {v.rejection_reason || 'Validation Passed'}
                                                                            </td>
                                                                            <td className="py-1.5 px-2.5 text-right text-text-muted">
                                                                                {v.finished_at ? new Date(v.finished_at).toLocaleDateString() : '—'}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        }))}
                    </tbody>
                </table>
            </div>

            {/* Bottom Guardrail Footer */}
            <div className="pt-2 border-t border-border-subtle/50 flex flex-wrap items-center justify-between text-[10px] font-mono text-text-tertiary gap-2">
                <div className="flex items-center gap-3">
                    <span>🛡️ Base Model Immutable: Zero-shot weights remain untouched as eternal fallback.</span>
                    <span>•</span>
                    <span>⚖️ Gate Bar: Improvement &gt; 3.00% &amp; Coverage in 65%–95%.</span>
                </div>
                <div>
                    Last checked: <span className="text-text-secondary">{lastChecked || new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        </div>
    );
}
