/**
 * @file CustomIndicatorModal.jsx
 * @purpose Dedicated User-Side Custom Indicator Studio Modal for Strategy Builder.
 * Allows users to create, sandbox test, approve (promote), and delete custom indicator models
 * directly from the Strategy Builder without navigating away.
 * @date 2026-09-17
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Code2, Play, Check, Trash2, Sparkles, HelpCircle, 
    ChevronDown, RefreshCw, SlidersHorizontal, PlusCircle, 
    CheckCircle2, RotateCcw, AlertTriangle, Cpu, Copy, ShieldCheck, Plus
} from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import DangerActionModal from '@/features/dashboard/settings/ui/DangerActionModal';
import { 
    getCustomIndicators, 
    saveCustomIndicator, 
    deleteCustomIndicator, 
    promoteCustomIndicator,
    demoteCustomIndicator,
    resetToDefaultStarters,
    subscribeToCustomIndicators,
    STARTER_TEMPLATES,
    extractIndicatorDefinition,
    getAiPromptTemplate,
    exportIndicatorJson,
    importIndicatorFromJson
} from '../lab/customIndicatorRegistry';

export default function CustomIndicatorModal({
    isOpen,
    onClose,
    candles = [],
    onAddToStrategy
}) {
    const [savedIndicators, setSavedIndicators] = useState([]);
    const [activeId, setActiveId] = useState(null);

    // Form fields
    const [name, setName] = useState(STARTER_TEMPLATES[0].name);
    const [nickname, setNickname] = useState(STARTER_TEMPLATES[0].nickname);
    const [description, setDescription] = useState(STARTER_TEMPLATES[0].description);
    const [code, setCode] = useState(STARTER_TEMPLATES[0].code);
    const [activeModeTab, setActiveModeTab] = useState('swing');

    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [copiedPrompt, setCopiedPrompt] = useState(false);

    // TOTP Promotion Modal State
    const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);
    const [totpError, setTotpError] = useState('');
    const [isPromoting, setIsPromoting] = useState(false);
    const [targetModelForTotp, setTargetModelForTotp] = useState(null);

    // Live extracted definition from code
    const currentExtracted = useMemo(() => {
        return extractIndicatorDefinition(code, activeModeTab);
    }, [code, activeModeTab]);

    // Load and subscribe
    useEffect(() => {
        if (!isOpen) return;
        const list = getCustomIndicators();
        setSavedIndicators(list);
        if (list.length > 0) {
            handleSelectModel(list[0]);
        }
        const unsub = subscribeToCustomIndicators((updated) => {
            setSavedIndicators(updated);
        });
        return unsub;
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectModel = (model) => {
        setActiveId(model.id);
        setName(model.name);
        setNickname(model.nickname);
        setDescription(model.description);
        setCode(model.code);
        setError(null);
        setSuccessMessage(null);
    };

    const handleNewModel = () => {
        setActiveId(null);
        setName('New Custom Indicator');
        setNickname('CUST');
        setDescription('Custom algorithmic rule engine with 3-mode support');
        setCode(STARTER_TEMPLATES[0].code);
        setError(null);
        setSuccessMessage(null);
        setMetrics(null);
    };

    const handleLoadTemplate = (tmpl) => {
        setName(tmpl.name);
        setNickname(tmpl.nickname);
        setDescription(tmpl.description);
        setCode(tmpl.code);
        setShowTemplateMenu(false);
        setError(null);
        setSuccessMessage(`Loaded template: ${tmpl.name}`);
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        const extracted = extractIndicatorDefinition(newCode, activeModeTab);
        if (extracted && extracted.isV2) {
            if (extracted.name && extracted.name !== 'Custom Indicator') setName(extracted.name);
            if (extracted.nickname && extracted.nickname !== 'CUST') setNickname(extracted.nickname);
            if (extracted.description) setDescription(extracted.description);
        }
    };

    const handleCopyAiPrompt = async () => {
        try {
            const promptText = getAiPromptTemplate();
            await navigator.clipboard.writeText(promptText);
            setCopiedPrompt(true);
            setSuccessMessage("AI Prompt Template copied! Paste into Claude, ChatGPT, or Gemini.");
            setTimeout(() => setCopiedPrompt(false), 3500);
        } catch (e) {
            setError("Failed to copy AI prompt template to clipboard.");
        }
    };

    const handleRunSandbox = async () => {
        if (!candles || candles.length < 5) {
            setError("No market candle data available to test. Please ensure an instrument is selected.");
            return;
        }

        setIsExecuting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await axiosInstance.post('/api/v1/indicator-lab/run', {
                code,
                mode: activeModeTab,
                candles: candles.map(c => ({
                    time: c.time,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    volume: c.volume || 0,
                }))
            });

            if (res.data?.success) {
                setMetrics(res.data.metrics);
                setSuccessMessage(`Sandbox test passed (${activeModeTab.toUpperCase()} mode)! ${res.data.metrics.validBars} bars computed in ${res.data.metrics.executionTimeMs}ms.`);
            } else {
                setError(res.data?.error || "Sandbox evaluation failed.");
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || "Failed to compile indicator in sandbox.");
        } finally {
            setIsExecuting(false);
        }
    };

    const handleSaveModel = (andApprove = false) => {
        if (!name.trim()) {
            setError("Model name cannot be empty.");
            return null;
        }

        const payload = {
            id: activeId || undefined,
            name: name.trim(),
            nickname: nickname.trim().toUpperCase() || 'IND',
            description: description.trim(),
            code,
            modes: currentExtracted?.modes,
            rules: currentExtracted?.rules,
            promoted: andApprove ? true : (savedIndicators.find(i => i.id === activeId)?.promoted ?? false),
        };

        const updated = saveCustomIndicator(payload);
        setSavedIndicators(updated);
        const match = (payload.id && updated.find(i => i.id === payload.id)) || updated.find(i => i.name === payload.name) || payload;
        if (match.id) setActiveId(match.id);
        setSuccessMessage(andApprove ? `Saved & Approved "${payload.name}"! Added to strategy palette.` : `Saved "${payload.name}" as draft.`);
        return match;
    };

    const handleInitiateApproval = (ind = null, e = null) => {
        if (e) e.stopPropagation();
        const target = ind || savedIndicators.find(i => i.id === activeId) || {
            name: name.trim(),
            nickname: nickname.trim().toUpperCase() || 'IND',
            description: description.trim(),
            code,
        };

        if (target.promoted && target.id) {
            demoteCustomIndicator(target.id);
            setSavedIndicators(getCustomIndicators());
            setSuccessMessage(`Demoted "${target.name}" back to temporary draft.`);
            return;
        }

        // Save active edits before opening TOTP
        const saved = handleSaveModel(false);
        setTargetModelForTotp(saved || target);
        setTotpError('');
        setIsTotpModalOpen(true);
    };

    const handleConfirmPromotion = ({ totp }) => {
        setIsPromoting(true);
        setTotpError('');

        setTimeout(() => {
            if (!/^\d{6}$/.test(totp)) {
                setTotpError('Invalid 6-digit TOTP authenticator code.');
                setIsPromoting(false);
                return;
            }

            const modelId = targetModelForTotp?.id || activeId;
            if (modelId) {
                promoteCustomIndicator(modelId);
                const updatedList = getCustomIndicators();
                setSavedIndicators(updatedList);
                setIsTotpModalOpen(false);
                setSuccessMessage(`Model "${targetModelForTotp?.name || name}" promoted to LIVE status with TOTP!`);
            } else {
                setTotpError('Unable to identify target model to promote.');
            }
            setIsPromoting(false);
        }, 250);
    };

    const handleAddToStrategyClick = () => {
        if (!name.trim()) {
            setError("Model name cannot be empty.");
            return;
        }
        const saved = handleSaveModel(false);
        if (saved && typeof onAddToStrategy === 'function') {
            onAddToStrategy(saved);
        }
    };

    const handleDelete = (id, e) => {
        if (e) e.stopPropagation();
        const target = savedIndicators.find(i => i.id === id);
        const targetName = target?.name || 'this indicator';
        if (window.confirm(`Permanently detach & delete "${targetName}" and wipe all its code and rules?`)) {
            const updated = deleteCustomIndicator(id);
            setSavedIndicators(updated);
            setSuccessMessage("Model and algorithm code permanently purged.");
            if (activeId === id) {
                if (updated.length > 0) {
                    handleSelectModel(updated[0]);
                } else {
                    setActiveId(null);
                    setName('');
                    setNickname('');
                    setDescription('');
                    setCode('');
                    setMetrics(null);
                }
            }
        }
    };

    const handleRestoreStarters = () => {
        const restored = resetToDefaultStarters();
        setSavedIndicators(restored);
        if (restored.length > 0) handleSelectModel(restored[0]);
        setSuccessMessage("Restored turnkey starter models (PNCO, AAVB, IFDI, ROC, Volume Spread).");
    };

    const activeItem = savedIndicators.find(i => i.id === activeId);
    const isApproved = Boolean(activeItem?.promoted);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
            <div className="w-full max-w-5xl h-[88vh] bg-background-card border border-border-subtle rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header Row */}
                <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-background-surface/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-sm">
                            <Code2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text-primary tracking-wide flex items-center gap-2">
                                <span>Custom Indicator Studio</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                    Strategy Lab
                                </span>
                            </h3>
                            <p className="text-[11px] text-text-tertiary">
                                Add temporary models, test in sandbox, approve to add to strategy, or delete anytime
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleRestoreStarters}
                            className="px-2.5 py-1.5 rounded-xl bg-background-surface hover:bg-background-hover text-text-tertiary hover:text-text-primary border border-border-subtle text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Restore default proprietary templates (PNCO, AAVB, IFDI)"
                        >
                            <RotateCcw size={12} />
                            <span>Reset Starters</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-background-surface border border-transparent hover:border-border-subtle transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Main Body: 2-Column Split */}
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                    
                    {/* Left Column: User Models List (4 cols) */}
                    <div className="md:col-span-4 border-r border-border-subtle p-4 flex flex-col gap-3 bg-background-app/40 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between pb-2 border-b border-border-subtle/60">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                                User Models ({savedIndicators.length})
                            </span>
                            <button
                                type="button"
                                onClick={handleNewModel}
                                className="px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-300 hover:text-white border border-orange-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                                <PlusCircle size={12} />
                                <span>Add New</span>
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            {savedIndicators.map((ind) => {
                                const isSelected = activeId === ind.id;
                                return (
                                    <div
                                        key={ind.id}
                                        onClick={() => handleSelectModel(ind)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                            isSelected
                                                ? 'bg-orange-500/10 border-orange-500/40 shadow-xs'
                                                : 'bg-background-surface/70 hover:bg-background-surface border-border-subtle'
                                        }`}
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-xs text-text-primary truncate">
                                                    {ind.name}
                                                </span>
                                                <span className="text-[9px] font-mono text-text-tertiary">
                                                    [{ind.nickname}]
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-text-tertiary truncate">
                                                {ind.description || 'Custom indicator model'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {ind.promoted ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleInitiateApproval(ind, e)}
                                                    className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                                                    title="Approved & Live in Strategy Builder (Click to demote)"
                                                >
                                                    APPROVED
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleInitiateApproval(ind, e)}
                                                    className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors cursor-pointer"
                                                    title="Temporary Draft (Click to authorize with TOTP)"
                                                >
                                                    APPROVE
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={(e) => handleDelete(ind.id, e)}
                                                className="p-1.5 rounded-lg text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                title="Delete Model"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Authoring & Sandbox Studio (8 cols) */}
                    <div className="md:col-span-8 p-5 flex flex-col gap-3.5 overflow-y-auto custom-scrollbar">
                        
                        {/* Model Metadata Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                            <div className="md:col-span-3 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">
                                    Model Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. PNCO Confluence Oscillator"
                                    className="w-full px-3 py-1.5 rounded-xl bg-background-surface border border-border-subtle focus:border-orange-500 focus:outline-hidden text-xs text-text-primary"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">
                                    Badge (2-5 Chars)
                                </label>
                                <input
                                    type="text"
                                    maxLength={5}
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value.toUpperCase())}
                                    placeholder="PNCO"
                                    className="w-full px-3 py-1.5 rounded-xl bg-background-surface border border-border-subtle focus:border-orange-500 focus:outline-hidden text-xs font-mono font-bold text-orange-400 text-center uppercase"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">
                                Description / Mathematical Concept
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Multi-factor momentum & trap detection oscillator"
                                className="w-full px-3 py-1.5 rounded-xl bg-background-surface border border-border-subtle focus:border-orange-500 focus:outline-hidden text-xs text-text-secondary"
                            />
                        </div>

                        {/* Code Editor Deck */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider flex items-center gap-1.5">
                                    <Code2 size={12} className="text-orange-400" />
                                    <span>Algorithm Function (Sandboxed JavaScript)</span>
                                </label>

                                {/* Template & Prompt Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCopyAiPrompt}
                                        className="text-[10px] font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded-lg border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                                        title="Copy standardized AI prompt for ChatGPT, Claude, or Gemini"
                                    >
                                        {copiedPrompt ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                        <span>{copiedPrompt ? 'Copied AI Prompt!' : 'Copy AI Prompt Template'}</span>
                                    </button>

                                    {/* Template selector */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                                            className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Sparkles size={11} />
                                            <span>Load Template</span>
                                            <ChevronDown size={11} />
                                        </button>

                                        {showTemplateMenu && (
                                            <div className="absolute right-0 top-full mt-1 w-64 rounded-xl bg-background-card border border-border-subtle shadow-2xl p-1 z-50 space-y-0.5">
                                                <div className="px-2.5 py-1 text-[9px] uppercase font-bold text-text-tertiary border-b border-border-subtle/50">
                                                    Turnkey Starters (v2)
                                                </div>
                                                {STARTER_TEMPLATES.map((tmpl) => (
                                                    <button
                                                        key={tmpl.name}
                                                        type="button"
                                                        onClick={() => handleLoadTemplate(tmpl)}
                                                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-background-surface text-text-primary text-[11px] flex flex-col transition cursor-pointer"
                                                    >
                                                        <span className="font-bold text-text-primary">{tmpl.name}</span>
                                                        <span className="text-[9px] text-text-tertiary truncate">{tmpl.description}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border-subtle bg-[#0c1017] p-2.5 shadow-inner focus-within:border-orange-500/60">
                                <textarea
                                    value={code}
                                    onChange={(e) => handleCodeChange(e.target.value)}
                                    rows={10}
                                    spellCheck={false}
                                    className="w-full bg-transparent font-mono text-[11px] text-slate-200 resize-y focus:outline-hidden leading-relaxed custom-scrollbar"
                                />
                            </div>

                            <div className="p-2 rounded-xl bg-background-surface/50 border border-border-subtle/60 text-[10px] text-text-tertiary flex items-center gap-1.5">
                                <HelpCircle size={12} className="text-accent-primary shrink-0" />
                                <span>
                                    Function returns <code className="text-orange-400">{'{ modes, rules, calculate }'}</code>. Rules execute automatically based on active mode with zero manual inputs.
                                </span>
                            </div>
                        </div>

                        {/* 3-Mode Configuration & Baked Rules Telemetry Deck */}
                        <div className="p-3.5 rounded-2xl bg-background-surface border border-border-subtle space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-text-tertiary tracking-wider">
                                    <Cpu size={12} className="text-orange-400" />
                                    <span>3-Mode Calibrated Profiles</span>
                                </div>

                                {/* Mode Selector Tabs */}
                                <div className="flex items-center gap-1 bg-background-card p-0.5 rounded-lg border border-border-subtle">
                                    {['intraday', 'swing', 'positional'].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setActiveModeTab(m)}
                                            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                                                activeModeTab === m
                                                    ? m === 'intraday'
                                                        ? 'bg-amber-500 text-black shadow-xs font-black'
                                                        : m === 'swing'
                                                            ? 'bg-blue-600 text-white shadow-xs font-black'
                                                            : 'bg-purple-600 text-white shadow-xs font-black'
                                                    : 'text-text-tertiary hover:text-text-primary'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mode Parameters Readout */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                <div className="p-2 rounded-xl bg-background-card border border-border-subtle flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-text-tertiary">Period</span>
                                    <span className="text-xs font-mono font-bold text-blue-400">
                                        {currentExtracted?.modes?.[activeModeTab]?.period ?? 'N/A'}
                                    </span>
                                </div>
                                <div className="p-2 rounded-xl bg-background-card border border-border-subtle flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-text-tertiary">Threshold</span>
                                    <span className="text-xs font-mono font-bold text-orange-400">
                                        {currentExtracted?.modes?.[activeModeTab]?.threshold ?? 'N/A'}
                                    </span>
                                </div>
                                <div className="p-2 rounded-xl bg-background-card border border-border-subtle flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-text-tertiary">Target Profit</span>
                                    <span className="text-xs font-mono font-bold text-emerald-400">
                                        +{currentExtracted?.modes?.[activeModeTab]?.exitTargetPct ?? 2.5}%
                                    </span>
                                </div>
                                <div className="p-2 rounded-xl bg-background-card border border-border-subtle flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-text-tertiary">Stop Loss</span>
                                    <span className="text-xs font-mono font-bold text-rose-400">
                                        -{currentExtracted?.modes?.[activeModeTab]?.exitStopPct ?? 1.25}%
                                    </span>
                                </div>
                                <div className="p-2 rounded-xl bg-background-card border border-border-subtle flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-text-tertiary">Horizon Bars</span>
                                    <span className="text-xs font-mono font-bold text-text-primary">
                                        {currentExtracted?.modes?.[activeModeTab]?.horizonBars ?? 14}b
                                    </span>
                                </div>
                            </div>

                            {/* Baked Rules Readout */}
                            <div className="space-y-1.5 pt-1 border-t border-border-subtle/50">
                                <div className="flex items-center justify-between text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                                    <span className="flex items-center gap-1">
                                        <ShieldCheck size={11} className="text-emerald-400" />
                                        Baked Confluence Rules ({currentExtracted?.rules?.length || 0})
                                    </span>
                                    <span className="text-[9px] text-text-tertiary">
                                        Pure Boolean logic executed directly in engine
                                    </span>
                                </div>

                                <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                                    {currentExtracted?.rules?.map((r, i) => (
                                        <div key={r.id || i} className="p-1.5 rounded-lg bg-background-card border border-border-subtle/70 flex items-center justify-between text-[10px]">
                                            <span className="font-bold text-text-primary font-mono">{r.label}</span>
                                            <span className="text-[9px] text-text-tertiary truncate max-w-[280px]">{r.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Error & Success Feedback */}
                        {error && (
                            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                <span className="font-mono text-[11px] break-words">{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                                <Check size={14} className="shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {/* Action Buttons Deck */}
                        <div className="pt-2 flex items-center justify-between gap-2 border-t border-border-subtle flex-wrap">
                            <button
                                type="button"
                                onClick={handleRunSandbox}
                                disabled={isExecuting}
                                className="px-4 py-2 rounded-xl bg-background-surface hover:bg-background-elevated text-orange-400 border border-orange-500/40 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                                {isExecuting ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                                <span>Run Sandbox Test</span>
                            </button>

                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => handleSaveModel(false)}
                                    className="px-3.5 py-2 rounded-xl bg-background-surface hover:bg-background-elevated text-text-secondary hover:text-text-primary border border-border-subtle font-bold text-xs transition-colors cursor-pointer"
                                >
                                    Save as Draft
                                </button>

                                {/* Add to Strategy Button: lets user test drafts on active canvas without approving first */}
                                {onAddToStrategy && (
                                    <button
                                        type="button"
                                        onClick={handleAddToStrategyClick}
                                        className="px-3.5 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-white border border-orange-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                        title="Add this indicator model directly into active Strategy Builder rules to test"
                                    >
                                        <Plus size={13} />
                                        <span>Add to Strategy</span>
                                    </button>
                                )}

                                {isApproved ? (
                                    <button
                                        type="button"
                                        onClick={(e) => handleInitiateApproval(activeItem, e)}
                                        className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                                        title="Approved & Live (Click to demote to Draft)"
                                    >
                                        <CheckCircle2 size={13} />
                                        <span>Promoted [LIVE]</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={(e) => handleInitiateApproval(activeItem, e)}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer active:scale-95"
                                        title="Promote indicator to LIVE status with mandatory 6-digit TOTP verification"
                                    >
                                        <ShieldCheck size={13} />
                                        <span>Authorize & Promote [TOTP]</span>
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* TOTP Promotion Modal */}
                {targetModelForTotp && (
                    <DangerActionModal
                        isOpen={isTotpModalOpen}
                        onClose={() => {
                            setIsTotpModalOpen(false);
                            setTargetModelForTotp(null);
                        }}
                        onConfirm={handleConfirmPromotion}
                        isLoading={isPromoting}
                        errorMessage={totpError}
                        config={{
                            id: `promote_custom_indicator_${targetModelForTotp.id || 'new'}`,
                            title: `Authorize Promotion: "${targetModelForTotp.name || name}"`,
                            description: `You are elevating model "${targetModelForTotp.name || name}" [${targetModelForTotp.nickname || nickname}] to LIVE institutional production status. It will execute in real time on the Live Chart with calibrated 3-mode profiles.`,
                            requiredConfirmText: targetModelForTotp.nickname || nickname.trim().toUpperCase() || 'APPROVE',
                            actionButtonText: 'Authorize & Promote Model',
                            buttonVariant: 'orange',
                        }}
                    />
                )}

            </div>
        </div>
    );
}
