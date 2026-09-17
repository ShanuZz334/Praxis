/**
 * @file StrategyRuleCard.jsx
 * @purpose Modern institutional card component for constructing multi-factor confluence rules.
 * Features circuit conduit connectors, category-driven color accents, stylized trigger selectors,
 * interactive parameter inputs, and dynamic threshold controls with zero hardcoded values.
 * @date 2026-09-17
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
    Trash2, Sliders, ChevronDown, Activity, Zap, Layers, 
    TrendingUp, BarChart2, Target, Cpu, Sparkles, ArrowRight,
    SlidersHorizontal, CheckCircle2, Settings2, Hash, Minus, Plus, ShieldCheck, Check
} from 'lucide-react';
import { SIGNAL_DEFINITIONS, SIGNAL_CATEGORIES } from './strategySignalDefinitions';

const CATEGORY_ICONS = {
    MOMENTUM: Activity,
    TREND: TrendingUp,
    VOLATILITY: Sliders,
    VOLUME: BarChart2,
    STRUCTURE: Target,
    PROPRIETARY: Zap,
    RAW_DATA: Layers,
    CUSTOM_LAB: Cpu,
};

const CATEGORY_ACCENT_CLASSES = {
    MOMENTUM: {
        borderLeft: 'border-l-violet-500',
        badge: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
        icon: 'text-violet-400',
        glow: 'group-hover:border-violet-500/40',
    },
    TREND: {
        borderLeft: 'border-l-blue-500',
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        icon: 'text-blue-400',
        glow: 'group-hover:border-blue-500/40',
    },
    VOLATILITY: {
        borderLeft: 'border-l-amber-500',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        icon: 'text-amber-400',
        glow: 'group-hover:border-amber-500/40',
    },
    VOLUME: {
        borderLeft: 'border-l-cyan-500',
        badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        icon: 'text-cyan-400',
        glow: 'group-hover:border-cyan-500/40',
    },
    STRUCTURE: {
        borderLeft: 'border-l-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: 'text-emerald-400',
        glow: 'group-hover:border-emerald-500/40',
    },
    PROPRIETARY: {
        borderLeft: 'border-l-fuchsia-500',
        badge: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
        icon: 'text-fuchsia-400',
        glow: 'group-hover:border-fuchsia-500/40',
    },
    RAW_DATA: {
        borderLeft: 'border-l-slate-400',
        badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
        icon: 'text-slate-300',
        glow: 'group-hover:border-slate-400/40',
    },
    CUSTOM_LAB: {
        borderLeft: 'border-l-orange-500',
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        icon: 'text-orange-400',
        glow: 'group-hover:border-orange-500/40',
    },
};

export default function StrategyRuleCard({
    rule,
    index,
    totalRules,
    onChangeRule,
    onRemoveRule,
    customLabIndicator = null,
    strategyMode = 'swing',
}) {
    const isCustomLab = Boolean(
        customLabIndicator || 
        rule.isCustom || 
        rule.indicatorId?.startsWith('ind_') || 
        rule.indicatorId?.startsWith('custom_')
    );

    const activeModeParams = (customLabIndicator?.modes && customLabIndicator.modes[strategyMode])
        ? customLabIndicator.modes[strategyMode]
        : (customLabIndicator?.modes?.swing || {});

    // Preset conditions: for custom indicators with baked rules, derive directly from indicator's rules array
    const customBakedRules = (customLabIndicator?.rules && customLabIndicator.rules.length > 0)
        ? customLabIndicator.rules.map(r => ({
            id: r.id,
            label: r.label,
            desc: r.description,
            description: r.description,
            hasThreshold: false,
        }))
        : null;

    const def = customLabIndicator 
        ? {
            id: customLabIndicator.id,
            label: customLabIndicator.name,
            category: 'CUSTOM_LAB',
            desc: customLabIndicator.description || 'Custom Lab Quantitative Model',
            presetConditions: customBakedRules || [
                {
                    id: 'lab_cross_above',
                    label: 'Crosses Above Mode Threshold',
                    hasThreshold: false,
                },
                {
                    id: 'lab_cross_below',
                    label: 'Crosses Below Mode Threshold',
                    hasThreshold: false,
                }
            ]
        }
        : SIGNAL_DEFINITIONS[rule.indicatorId];

    const categoryKey = def?.category || 'MOMENTUM';
    const categoryMeta = SIGNAL_CATEGORIES.find(c => c.id === categoryKey) || SIGNAL_CATEGORIES[0];
    const styling = CATEGORY_ACCENT_CLASSES[categoryKey] || CATEGORY_ACCENT_CLASSES.MOMENTUM;
    const CategoryIcon = CATEGORY_ICONS[categoryKey] || Activity;

    const presetConditions = def?.presetConditions || [];
    const selectedCondition = presetConditions.find(c => c.id === rule.conditionId) || presetConditions[0];

    const [isConditionDropdownOpen, setIsConditionDropdownOpen] = useState(false);
    const conditionDropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (conditionDropdownRef.current && !conditionDropdownRef.current.contains(event.target)) {
                setIsConditionDropdownOpen(false);
            }
        }
        if (isConditionDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isConditionDropdownOpen]);

    const hasThreshold = !isCustomLab && (selectedCondition?.hasThreshold || Boolean(selectedCondition?.thresholdConfig) || selectedCondition?.isCustom);
    const threshConfig = selectedCondition?.thresholdConfig || {
        label: 'Threshold Level',
        defaultThreshold: selectedCondition?.defaultThreshold ?? 30,
        step: 1,
        min: -1000,
        max: 1000,
        unit: ''
    };

    const currentThreshold = rule.threshold != null 
        ? rule.threshold 
        : (rule.customThreshold != null 
            ? rule.customThreshold 
            : threshConfig.defaultThreshold);

    const handleConditionChange = (condId) => {
        const nextCond = presetConditions.find(c => c.id === condId);
        const nextThreshold = nextCond?.thresholdConfig?.defaultThreshold ?? nextCond?.defaultThreshold ?? threshConfig.defaultThreshold;
        onChangeRule(rule.id, {
            ...rule,
            conditionId: condId,
            threshold: nextThreshold,
            customThreshold: nextThreshold,
        });
    };

    const handleThresholdChange = (rawVal) => {
        const parsed = rawVal === '' ? '' : Number(rawVal);
        onChangeRule(rule.id, {
            ...rule,
            threshold: parsed,
            customThreshold: parsed,
        });
    };

    const handleStepThreshold = (delta) => {
        const current = Number(currentThreshold != null && currentThreshold !== '' ? currentThreshold : threshConfig.defaultThreshold);
        const step = threshConfig.step || 1;
        const nextVal = Math.round((current + delta * step) * 1000) / 1000;
        handleThresholdChange(nextVal);
    };

    const handleParamChange = (paramKey, rawVal) => {
        const currentParams = rule.params || def?.defaultParams || {};
        const parsed = rawVal === '' ? '' : Number(rawVal);
        onChangeRule(rule.id, {
            ...rule,
            params: {
                ...currentParams,
                [paramKey]: parsed,
            }
        });
    };

    const handleToggleLogic = () => {
        const next = rule.logic === 'OR' ? 'AND' : 'OR';
        onChangeRule(rule.id, {
            ...rule,
            logic: next,
        });
    };

    const paramConfigList = !isCustomLab ? (def?.paramConfig || []) : [];

    return (
        <div className="flex flex-col relative group">
            {/* 1. Circuit Conduit Connector (between cards) */}
            {index > 0 && (
                <div className="relative flex items-center justify-center my-2 h-7 select-none">
                    {/* Vertical conduit pipeline wire */}
                    <div className="absolute inset-y-0 w-0.5 bg-gradient-to-b from-border-subtle via-accent-primary/50 to-border-subtle" />
                    
                    {/* Interactive Logic Gate Chip */}
                    <button
                        type="button"
                        onClick={handleToggleLogic}
                        className={`relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-black tracking-wider transition-all duration-200 cursor-pointer shadow-md backdrop-blur-md active:scale-95 ${
                            rule.logic === 'OR'
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-amber-950/30'
                                : 'bg-blue-600/25 hover:bg-blue-600/35 text-blue-300 border border-blue-500/50 shadow-blue-950/30'
                        }`}
                        title="Toggle Confluence Condition: AND requires both signals, OR requires either signal"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        <span>{rule.logic || 'AND'}</span>
                        <span className="text-[9px] font-normal font-sans opacity-70 tracking-normal">
                            {rule.logic === 'OR' ? '(Either Fires)' : '(Strict Confluence)'}
                        </span>
                    </button>
                </div>
            )}

            {/* 2. Rule Card Container */}
            <div className={`rounded-2xl border border-border-subtle/80 bg-background-card/90 hover:bg-background-card ${styling.glow} border-l-4 ${styling.borderLeft} transition-all duration-200 p-3.5 shadow-sm space-y-3`}>
                
                {/* Header Row: Step # + Indicator Icon + Title + Category Chip + Delete */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-subtle/40">
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Step badge */}
                        <span className="px-1.5 py-0.5 rounded-md bg-background-surface/80 border border-border-subtle text-[10px] font-mono font-bold text-text-tertiary">
                            RULE #{String(index + 1).padStart(2, '0')}
                        </span>

                        {/* Category Icon */}
                        <div className={`p-1.5 rounded-lg bg-background-surface/80 border border-border-subtle ${styling.icon}`}>
                            <CategoryIcon size={13} />
                        </div>

                        {/* Title & Description */}
                        <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-xs text-text-primary tracking-wide truncate">
                                {def?.label || rule.indicatorLabel || rule.indicatorId}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-md border ${styling.badge} shrink-0`}>
                                {categoryMeta.label}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => onRemoveRule(rule.id)}
                        className="p-1.5 rounded-lg text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                        title="Remove Rule"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>

                {/* Main Interactive Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    {/* Trigger Condition Selector Dropdown */}
                    <div className={`${(hasThreshold || isCustomLab) ? 'col-span-12 md:col-span-7' : 'col-span-12'} space-y-1.5`}>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                                <SlidersHorizontal size={11} className="text-accent-primary" />
                                Trigger Condition
                            </span>
                            {selectedCondition?.desc && (
                                <span className="text-[9px] font-normal text-text-tertiary truncate max-w-[220px]" title={selectedCondition.desc}>
                                    {selectedCondition.desc}
                                </span>
                            )}
                        </div>

                        <div className="relative" ref={conditionDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsConditionDropdownOpen(prev => !prev)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-background-surface border border-border-subtle/80 hover:border-border-default focus:border-accent-primary focus:outline-hidden text-xs text-text-primary font-medium cursor-pointer transition-colors shadow-xs text-left"
                            >
                                <span className="truncate pr-2">
                                    {selectedCondition?.label || 'Select Condition...'}
                                </span>
                                <ChevronDown 
                                    size={13} 
                                    className={`text-text-tertiary transition-transform duration-150 shrink-0 ${isConditionDropdownOpen ? 'rotate-180 text-accent-primary' : ''}`} 
                                />
                            </button>

                            {isConditionDropdownOpen && (
                                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl bg-background-card/95 backdrop-blur-xl border border-border-subtle shadow-2xl p-1 space-y-0.5 custom-scrollbar">
                                    {presetConditions.map(c => {
                                        const isSelected = (c.id === (rule.conditionId || presetConditions[0]?.id));
                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => {
                                                    handleConditionChange(c.id);
                                                    setIsConditionDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between group cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-accent-primary/15 text-accent-primary font-semibold' 
                                                        : 'text-text-secondary hover:bg-background-elevated hover:text-text-primary font-medium'
                                                }`}
                                            >
                                                <div className="flex flex-col min-w-0 pr-2">
                                                    <span className="truncate">{c.label}</span>
                                                    {(c.desc || c.description) && (
                                                        <span className="text-[10px] text-text-tertiary truncate font-normal group-hover:text-text-secondary">
                                                            {c.desc || c.description}
                                                        </span>
                                                    )}
                                                </div>
                                                {isSelected && <Check size={13} className="text-accent-primary shrink-0 ml-1" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Custom Lab: Zero Inboxes Mode Telemetry Ribbon */}
                    {isCustomLab ? (
                        <div className="col-span-12 md:col-span-5 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                    <Cpu size={11} className="text-orange-400" />
                                    Mode Telemetry
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase border ${
                                    strategyMode === 'intraday' 
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                                        : strategyMode === 'positional'
                                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                }`}>
                                    {strategyMode}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-background-surface/80 border border-border-subtle text-[10px] font-mono">
                                {activeModeParams.threshold != null && (
                                    <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20 font-bold">
                                        Thresh: {activeModeParams.threshold}
                                    </span>
                                )}
                                {activeModeParams.period != null && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                                        Period: {activeModeParams.period}
                                    </span>
                                )}
                                {activeModeParams.exitTargetPct != null && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                                        +{activeModeParams.exitTargetPct}%
                                    </span>
                                )}
                                {activeModeParams.exitStopPct != null && (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
                                        -{activeModeParams.exitStopPct}%
                                    </span>
                                )}
                                {activeModeParams.horizonBars != null && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-300 border border-slate-500/20 font-bold">
                                        {activeModeParams.horizonBars}b
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-text-tertiary">
                                <ShieldCheck size={10} className="text-emerald-400 shrink-0" />
                                <span>Baked model rule • Zero manual inputs required</span>
                            </div>
                        </div>
                    ) : (
                        /* Standard Built-in Indicator Threshold Numeric Input Box */
                        hasThreshold && (
                            <div className="col-span-12 md:col-span-5 space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                                    <span className="flex items-center gap-1">
                                        <Hash size={11} className="text-accent-primary" />
                                        {threshConfig.label || 'Threshold Value'}
                                    </span>
                                    {threshConfig.unit && (
                                        <span className="px-1 rounded bg-background-surface border border-border-subtle text-[9px] text-text-secondary font-mono">
                                            {threshConfig.unit}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleStepThreshold(-1)}
                                        className="px-2 py-2 rounded-xl bg-background-surface hover:bg-background-elevated border border-border-subtle text-text-secondary hover:text-text-primary cursor-pointer active:scale-95 transition-all flex items-center justify-center shrink-0"
                                        title={`Decrement by ${threshConfig.step || 1}`}
                                    >
                                        <Minus size={11} />
                                    </button>

                                    <input
                                        type="number"
                                        step={threshConfig.step || 'any'}
                                        min={threshConfig.min}
                                        max={threshConfig.max}
                                        value={currentThreshold}
                                        onChange={(e) => handleThresholdChange(e.target.value)}
                                        placeholder={String(threshConfig.defaultThreshold)}
                                        className={`w-full px-3 py-1.5 rounded-xl bg-background-surface border font-mono text-xs font-bold text-text-primary text-center transition-colors shadow-xs ${
                                            currentThreshold === '' ? 'border-amber-500/50 bg-amber-500/5 placeholder:text-amber-400/60' : 'border-border-subtle hover:border-border-default focus:border-accent-primary'
                                        } focus:outline-hidden`}
                                        title={currentThreshold === '' ? `Empty: falls back to default (${threshConfig.defaultThreshold})` : undefined}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => handleStepThreshold(1)}
                                        className="px-2 py-2 rounded-xl bg-background-surface hover:bg-background-elevated border border-border-subtle text-text-secondary hover:text-text-primary cursor-pointer active:scale-95 transition-all flex items-center justify-center shrink-0"
                                        title={`Increment by ${threshConfig.step || 1}`}
                                    >
                                        <Plus size={11} />
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* Indicator Calculation Parameters Deck (if customizable, hidden for dynamic custom models) */}
                {paramConfigList.length > 0 && (
                    <div className="pt-2 border-t border-border-subtle/30 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider shrink-0">
                            <Settings2 size={11} className="text-text-tertiary" />
                            <span>Calculation Settings:</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {paramConfigList.map(param => {
                                const activeParams = rule.params || def.defaultParams || {};
                                const currentParamVal = activeParams[param.key] ?? param.default;
                                return (
                                    <div key={param.key} className="flex items-center gap-1.5 bg-background-surface/60 border border-border-subtle/70 px-2 py-1 rounded-lg">
                                        <span className="text-[10px] font-medium text-text-secondary">{param.label}:</span>
                                        <input
                                            type="number"
                                            min={param.min || 1}
                                            max={param.max || 500}
                                            step={param.step || 1}
                                            value={currentParamVal}
                                            onChange={(e) => handleParamChange(param.key, e.target.value)}
                                            className="w-14 px-1.5 py-0.5 rounded bg-background-card border border-border-subtle font-mono text-[11px] font-bold text-text-primary text-center focus:border-accent-primary focus:outline-hidden shadow-2xs"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

