/**
 * @file BacktestConfigPanel.jsx
 * @purpose Left-side control panel for configuring backtesting parameters, testable units, exit rules, and execution models.
 * @date 2026-09-12
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
    Play, Sliders, ShieldCheck, Cpu, Zap, Activity, Layers, 
    TrendingUp, RefreshCw, BarChart2, Eye, GitCompare, ChevronDown,
    Building2, Search, Filter, Sparkles, Calendar
} from 'lucide-react';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import InstrumentSelectorModal from '@/features/trading/ui/InstrumentSelectorModal';
import { TIMEFRAME_DEFAULTS } from '../engine/backtestEngine';

export const TESTABLE_UNITS = [
    { id: 'PREDICTOR', label: '7-Candle Predictor', icon: Cpu, desc: 'AI forecast direction & confidence calibration' },
    { id: 'PATTERNS', label: 'Pattern Engine', icon: Layers, desc: '40+ candlestick & chart patterns win rate' },
    { id: 'COMPOSITE_SCORE', label: 'Composite Score', icon: Activity, desc: 'Pattern sentiment threshold crossovers' },
    { id: 'PNCO', label: 'PNCO Oscillator', icon: Zap, desc: 'Cross-domain momentum & bull/bear trap filter' },
    { id: 'AAVB', label: 'AAVB Bands', icon: TrendingUp, desc: 'Macro-volatility adaptive channel bounces' },
    { id: 'IFDI', label: 'IFDI Flow Index', icon: BarChart2, desc: 'Smart money hidden accumulation & distribution' },
    { id: 'HEAD_TO_HEAD', label: 'Head-to-Head', icon: GitCompare, desc: 'Confluence vs individual component benchmark' },
    { id: 'CUSTOM_COMBO', label: 'Custom Combo', icon: Sliders, desc: 'Multi-factor rule builder' },
];

const QUICK_INDICES = [
    { label: 'NIFTY 50', value: 'NSE_INDEX|Nifty 50' },
    { label: 'BANK NIFTY', value: 'NSE_INDEX|Nifty Bank' },
    { label: 'FINNIFTY', value: 'NSE_INDEX|Nifty Fin Service' },
    { label: 'MIDCAP', value: 'NSE_INDEX|NIFTY MID SELECT' },
    { label: 'SENSEX', value: 'BSE_INDEX|SENSEX' },
];

const QUICK_COMPANIES = [
    { label: 'RELIANCE', value: 'NSE_EQ|INE002A01018' },
    { label: 'TCS', value: 'NSE_EQ|INE467B01029' },
    { label: 'HDFCBANK', value: 'NSE_EQ|INE040A01034' },
    { label: 'INFY', value: 'NSE_EQ|INE009A01021' },
    { label: 'ICICIBANK', value: 'NSE_EQ|INE090A01021' },
];

export default function BacktestConfigPanel({
    config,
    onChangeConfig,
    onRunBacktest,
    isRunning,
    runName,
    setRunName,
    onOpenOptimizer = () => {},
    isOpen = true,
    onClose = () => {},
}) {
    if (!isOpen) return null;
    const [isPatternDropdownOpen, setIsPatternDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isCompanyInstrument = Boolean(
        config.instrument?.startsWith('NSE_EQ|') || 
        (FO_EQUITIES || []).some(e => e.value === config.instrument)
    );

    const [activeCategory, setActiveCategory] = useState(() => isCompanyInstrument ? 'Companies' : 'Indices');

    useEffect(() => {
        if (isCompanyInstrument && activeCategory !== 'Companies') {
            setActiveCategory('Companies');
        } else if (!isCompanyInstrument && activeCategory !== 'Indices') {
            setActiveCategory('Indices');
        }
    }, [config.instrument, isCompanyInstrument]);

    const formattedIndices = useMemo(() => {
        return (FO_INDICES || []).map(i => ({
            ...i,
            label: i.label === 'NIFTY' ? 'NIFTY 50' : i.label === 'BANKNIFTY' ? 'BANK NIFTY' : (i.name && i.name !== i.label ? `${i.label} (${i.name})` : i.label),
            badge: 'INDEX'
        }));
    }, []);

    const formattedEquities = useMemo(() => {
        return (FO_EQUITIES || []).map(e => ({
            ...e,
            label: e.name && e.name !== e.label ? `${e.label} (${e.name})` : e.label,
            badge: 'EQ'
        }));
    }, []);

    const currentLabel = useMemo(() => {
        const pool = activeCategory === 'Indices' ? formattedIndices : formattedEquities;
        const match = pool.find(i => i.value === config.instrument);
        if (match) return match.label;
        const all = [...formattedIndices, ...formattedEquities];
        const anyMatch = all.find(i => i.value === config.instrument);
        if (anyMatch) return anyMatch.label;
        return config.instrument?.split('|').pop() || 'Select Instrument';
    }, [config.instrument, activeCategory, formattedIndices, formattedEquities]);

    const handleCategorySwitch = (cat) => {
        setActiveCategory(cat);
        if (cat === 'Companies' && !isCompanyInstrument) {
            update('instrument', QUICK_COMPANIES[0].value);
        } else if (cat === 'Indices' && isCompanyInstrument) {
            update('instrument', QUICK_INDICES[0].value);
        }
    };

    const handleModalSelect = (selected) => {
        const token = selected.instrument_token || selected.value;
        if (token) {
            update('instrument', token);
        }
        setIsModalOpen(false);
    };

    const update = (key, val) => {
        onChangeConfig({ ...config, [key]: val });
    };

    const updateExitRule = (key, val) => {
        onChangeConfig({
            ...config,
            exitRule: { ...config.exitRule, [key]: val }
        });
    };

    const updateCustomRule = (key, val) => {
        onChangeConfig({
            ...config,
            customRules: { ...config.customRules, [key]: val }
        });
    };

    const handleTimeframeChange = (tf) => {
        const profile = TIMEFRAME_DEFAULTS[tf] || TIMEFRAME_DEFAULTS.day;
        onChangeConfig({
            ...config,
            timeframe: tf,
            mode: profile.mode,
            exitRule: {
                ...config.exitRule,
                targetPct: profile.targetPct,
                stopPct: profile.stopPct,
                trailingStopPct: profile.trailingStopPct,
                horizonBars: profile.horizonBars,
            }
        });
    };

    const handleAutoCalibrateExitRules = () => {
        const profile = TIMEFRAME_DEFAULTS[config.timeframe] || TIMEFRAME_DEFAULTS.day;
        onChangeConfig({
            ...config,
            exitRule: {
                ...config.exitRule,
                targetPct: profile.targetPct,
                stopPct: profile.stopPct,
                trailingStopPct: profile.trailingStopPct,
                horizonBars: profile.horizonBars,
            }
        });
    };

    return (
        <>
        <aside className="w-[340px] flex-shrink-0 bg-background-card border-r border-border-subtle h-full overflow-y-auto overflow-x-hidden p-4 pb-10 flex flex-col gap-4 text-xs select-none custom-scrollbar">
            {/* Header Title */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                <div className="flex items-center gap-2">
                    <Sliders size={15} className="text-accent-primary" />
                    <span className="font-bold text-text-primary uppercase tracking-wider text-xs font-mono">
                        Test Configuration
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-text-tertiary bg-background-surface px-2 py-0.5 rounded font-mono">
                        v1.0 Pro
                    </span>
                </div>
            </div>

            {/* 1. Instrument & Timeframe */}
            <div className="flex flex-col gap-2 relative z-30">
                <div className="flex items-center justify-between">
                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Filter size={11} className="text-accent-primary" />
                        <span>Instrument</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="text-[10px] text-accent-primary hover:text-accent-primary/80 flex items-center gap-1 font-mono font-bold transition px-1.5 py-0.5 rounded hover:bg-accent-primary/10 cursor-pointer"
                        title="Search All Instruments Modal"
                    >
                        <Search size={10} />
                        <span>Browse All</span>
                    </button>
                </div>

                {/* Category Switcher: Indices vs Companies */}
                <div className="flex bg-background-surface rounded-lg p-0.5 border border-border-subtle shadow-inner w-full gap-1">
                    <button
                        type="button"
                        onClick={() => handleCategorySwitch('Indices')}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] py-1 rounded-md font-bold transition-all cursor-pointer ${
                            activeCategory === 'Indices'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm'
                                : 'text-text-secondary hover:text-text-primary hover:bg-background-subtle border border-transparent'
                        }`}
                    >
                        <Layers size={11} />
                        <span>Indices</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCategorySwitch('Companies')}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] py-1 rounded-md font-bold transition-all cursor-pointer ${
                            activeCategory === 'Companies'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm'
                                : 'text-text-secondary hover:text-text-primary hover:bg-background-subtle border border-transparent'
                        }`}
                    >
                        <Building2 size={11} />
                        <span>Companies</span>
                    </button>
                </div>

                {/* Quick Selection Chips */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                    <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase tracking-wider shrink-0">Quick:</span>
                    {(activeCategory === 'Indices' ? QUICK_INDICES : QUICK_COMPANIES).map((item) => {
                        const isSelected = config.instrument === item.value;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => update('instrument', item.value)}
                                className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer border ${
                                    isSelected
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                        : 'bg-background-surface text-text-secondary hover:text-text-primary hover:bg-background-subtle border-border-subtle'
                                }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* Searchable UiverseDropdown */}
                <div className="w-full relative">
                    <UiverseDropdown
                        value={config.instrument}
                        onChange={(val) => update('instrument', val)}
                        options={activeCategory === 'Indices' ? formattedIndices : formattedEquities}
                        placeholder={activeCategory === 'Indices' ? 'Select Index...' : 'Select Company...'}
                        searchPlaceholder={activeCategory === 'Indices' ? 'Search Index (Nifty, BankNifty...)' : 'Search Company (Reliance, TCS...)'}
                        showSearch={true}
                        matchWidth={true}
                        className="w-full !w-full"
                    />
                </div>

                {/* Current Target Tag */}
                <div className="flex items-center justify-between px-2 py-1 rounded bg-background-surface/60 border border-border-subtle/50 text-[10px]">
                    <span className="text-text-tertiary font-mono">Target:</span>
                    <span className="font-bold text-text-primary font-mono truncate max-w-[190px]" title={currentLabel}>
                        {currentLabel}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                        {activeCategory === 'Indices' ? 'INDEX' : 'EQUITY'}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                        <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px] block mb-1">
                            Timeframe
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-background-surface p-1 rounded-lg border border-border-subtle">
                            {['1m', '5m', '15m', '1h', 'day'].map((tf) => (
                                <button
                                    key={tf}
                                    type="button"
                                    onClick={() => handleTimeframeChange(tf)}
                                    className={`py-1 text-[10px] font-bold rounded-md uppercase transition cursor-pointer ${
                                        config.timeframe === tf
                                            ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                                            : 'text-text-tertiary hover:text-text-primary border border-transparent'
                                    }`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px] block mb-1">
                            Mode
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-background-surface p-1 rounded-lg border border-border-subtle">
                            {['intraday', 'swing', 'positional'].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => update('mode', m)}
                                    className={`py-1 text-[9px] font-bold rounded-md capitalize transition cursor-pointer ${
                                        config.mode === m
                                            ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                                            : 'text-text-tertiary hover:text-text-primary border border-transparent'
                                    }`}
                                >
                                    {m === 'positional' ? 'Pos' : m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Historical Date Range / Depth Horizon (for daily data) */}
                {config.timeframe === 'day' && (
                    <div className="mt-2 pt-2 border-t border-border-subtle/50">
                        <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <Calendar size={11} className="text-emerald-400" />
                                <span>Historical Horizon</span>
                            </label>
                            <span className="text-[9px] font-mono text-emerald-400 font-bold">
                                {(config.dateRange || 'SINCE_2010') === 'SINCE_2010' && 'Since 2010 (~4.1k Bars)'}
                                {config.dateRange === 'SINCE_2015' && 'Since 2015 (~2.8k Bars)'}
                                {config.dateRange === 'SINCE_2020' && 'Since 2020 (~1.6k Bars)'}
                                {config.dateRange === 'ALL_TIME' && 'Full 2000+ (~6.6k Bars)'}
                                {config.dateRange === 'LAST_2_YEARS' && 'Last 2 Years (~500 Bars)'}
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1 bg-background-surface p-1 rounded-lg border border-border-subtle">
                            {[
                                { id: 'SINCE_2010', label: '2010+' },
                                { id: 'SINCE_2015', label: '2015+' },
                                { id: 'SINCE_2020', label: '2020+' },
                                { id: 'ALL_TIME', label: 'Max' },
                                { id: 'LAST_2_YEARS', label: '2Y' },
                            ].map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => update('dateRange', r.id)}
                                    className={`py-1 text-[9px] font-mono font-bold rounded-md transition cursor-pointer ${
                                        (config.dateRange || 'SINCE_2010') === r.id
                                            ? 'bg-emerald-600 text-white border border-emerald-500 shadow-sm'
                                            : 'text-text-tertiary hover:text-text-primary border border-transparent'
                                    }`}
                                    title={r.label}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Unit Under Test */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
                        Unit Under Test
                    </label>
                    <button
                        type="button"
                        onClick={onOpenOptimizer}
                        className="flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition cursor-pointer"
                        title="Run multi-parameter optimization sweep on active unit"
                    >
                        <Zap size={10} className="fill-blue-400/20" />
                        <span>Auto-Calibrate</span>
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    {TESTABLE_UNITS.map((unit) => {
                        const Icon = unit.icon;
                        const isSelected = config.unit === unit.id;
                        return (
                            <button
                                key={unit.id}
                                type="button"
                                onClick={() => update('unit', unit.id)}
                                className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-blue-600/15 border-blue-500 text-text-primary shadow-sm ring-1 ring-blue-500/40 font-bold'
                                        : 'bg-background-surface/60 border-border-subtle text-text-tertiary hover:border-border-default hover:text-text-secondary'
                                }`}
                                title={unit.desc}
                            >
                                <div className="flex items-center gap-1.5 w-full">
                                    <Icon size={13} className={isSelected ? 'text-blue-400' : 'text-text-muted'} />
                                    <span className="font-bold text-[11px] truncate">{unit.label}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Sub-parameters based on unit */}
                {config.unit === 'COMPOSITE_SCORE' && (
                    <div className="bg-background-surface/80 p-2.5 rounded-lg border border-border-subtle mt-1">
                        <div className="flex justify-between items-center mb-1 text-[11px]">
                            <span className="text-text-secondary font-medium">Score Threshold:</span>
                            <span className="font-bold text-accent-primary">±{config.patternThreshold || 4}</span>
                        </div>
                        <input
                            type="range"
                            min="2"
                            max="8"
                            step="1"
                            value={config.patternThreshold || 4}
                            onChange={(e) => update('patternThreshold', Number(e.target.value))}
                            className="w-full accent-accent-primary cursor-pointer"
                        />
                    </div>
                )}

                {config.unit === 'CUSTOM_COMBO' && (
                    <div className="bg-background-surface/80 p-2.5 rounded-lg border border-border-subtle mt-1 flex flex-col gap-2">
                        <span className="font-bold text-[10px] text-text-secondary uppercase">Strategy Rule Builder</span>
                        <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.customRules?.requireIfdiAccumulation ?? true}
                                onChange={(e) => updateCustomRule('requireIfdiAccumulation', e.target.checked)}
                                className="accent-accent-primary rounded"
                            />
                            <span>Require IFDI Smart Accumulation</span>
                        </label>
                        <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.customRules?.aboveAavbMidline ?? true}
                                onChange={(e) => updateCustomRule('aboveAavbMidline', e.target.checked)}
                                className="accent-accent-primary rounded"
                            />
                            <span>Price Above AAVB Midline</span>
                        </label>
                    </div>
                )}
            </div>

            {/* 3. Exit Rules */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
                        Exit Rules
                    </label>
                    <button
                        type="button"
                        onClick={handleAutoCalibrateExitRules}
                        className="flex items-center gap-1 text-[9px] font-mono font-bold text-accent-primary hover:text-blue-400 transition cursor-pointer"
                        title="Auto-calibrate target & stop to active timeframe volatility"
                    >
                        <Zap size={10} />
                        <span>Auto-Scale ({config.timeframe.toUpperCase()})</span>
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-background-surface p-1 rounded-lg border border-border-subtle">
                    {[
                        { id: 'TARGET_STOP', label: 'Target/Stop' },
                        { id: 'TRAILING_STOP', label: 'Trailing' },
                        { id: 'HORIZON', label: 'Fixed Horizon' },
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => updateExitRule('type', mode.id)}
                            className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                                config.exitRule.type === mode.id
                                    ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                                    : 'text-text-tertiary hover:text-text-primary border border-transparent'
                            }`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>

                {config.exitRule.type !== 'HORIZON' && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="bg-background-surface/80 p-2 rounded-lg border border-border-subtle">
                            <span className="text-[10px] text-text-tertiary block mb-1">Profit Target %</span>
                            <div className="flex items-center justify-between">
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0.05"
                                    max="20"
                                    value={config.exitRule.targetPct}
                                    onChange={(e) => updateExitRule('targetPct', Number(e.target.value))}
                                    className="w-14 bg-background-app px-1.5 py-0.5 rounded border border-border-subtle text-text-primary font-bold text-xs"
                                />
                                <span className="text-emerald-400 font-bold text-[11px]">+{config.exitRule.targetPct}%</span>
                            </div>
                        </div>

                        <div className="bg-background-surface/80 p-2 rounded-lg border border-border-subtle">
                            <span className="text-[10px] text-text-tertiary block mb-1">Stop Loss %</span>
                            <div className="flex items-center justify-between">
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0.05"
                                    max="15"
                                    value={config.exitRule.stopPct}
                                    onChange={(e) => updateExitRule('stopPct', Number(e.target.value))}
                                    className="w-14 bg-background-app px-1.5 py-0.5 rounded border border-border-subtle text-text-primary font-bold text-xs"
                                />
                                <span className="text-rose-400 font-bold text-[11px]">-{config.exitRule.stopPct}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {config.exitRule.type === 'TARGET_STOP' ? (
                    <div className="bg-background-surface/80 p-2 rounded-lg border border-border-subtle flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-text-secondary text-[11px] font-medium">Max Bar Timeout</span>
                            <span className="text-[9px] text-text-tertiary">Force-exit if target/stop not reached</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={config.exitRule.enableHorizonTimeout ?? false}
                                onChange={(e) => updateExitRule('enableHorizonTimeout', e.target.checked)}
                                className="accent-accent-primary w-3.5 h-3.5 cursor-pointer"
                                title="Toggle max holding period timeout"
                            />
                            {config.exitRule.enableHorizonTimeout && (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min="2"
                                        max="100"
                                        value={config.exitRule.horizonBars || 14}
                                        onChange={(e) => updateExitRule('horizonBars', Number(e.target.value))}
                                        className="w-12 bg-background-app px-1.5 py-0.5 rounded border border-border-subtle text-text-primary font-bold text-xs text-center"
                                    />
                                    <span className="text-text-tertiary text-[10px]">bars</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-background-surface/80 p-2 rounded-lg border border-border-subtle flex items-center justify-between">
                        <span className="text-text-secondary text-[11px]">Horizon (Fixed Bars):</span>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={config.exitRule.horizonBars || 7}
                                onChange={(e) => updateExitRule('horizonBars', Number(e.target.value))}
                                className="w-12 bg-background-app px-1.5 py-0.5 rounded border border-border-subtle text-text-primary font-bold text-xs text-center"
                            />
                            <span className="text-text-tertiary text-[10px]">bars</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Execution Guardrails & Slippage */}
            <div className="flex flex-col gap-2">
                <label className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
                    Realistic Execution Guardrails
                </label>

                {/* Slippage Fill */}
                <div className="flex items-center justify-between bg-background-surface/60 p-2 rounded-lg border border-border-subtle">
                    <div>
                        <span className="font-medium text-text-primary text-[11px] block">Execution Fill Model</span>
                        <span className="text-[9px] text-text-tertiary">
                            {config.slippageModel === 'NEXT_BAR_OPEN' ? 'Realistic: Fill at Next Open' : 'Instant: Fill at Signal Close'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => update('slippageModel', config.slippageModel === 'NEXT_BAR_OPEN' ? 'SAME_BAR_CLOSE' : 'NEXT_BAR_OPEN')}
                        className={`px-2 py-1 text-[10px] font-bold rounded transition ${
                            config.slippageModel === 'NEXT_BAR_OPEN'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                    >
                        {config.slippageModel === 'NEXT_BAR_OPEN' ? 'Realistic' : 'Instant'}
                    </button>
                </div>

                {/* Walk-Forward Split */}
                <div className="flex items-center justify-between bg-background-surface/60 p-2 rounded-lg border border-border-subtle">
                    <div>
                        <span className="font-medium text-text-primary text-[11px] block">Walk-Forward Evaluation</span>
                        <span className="text-[9px] text-text-tertiary">70% Train / 30% Validation Split</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={config.walkForward?.enabled ?? true}
                        onChange={(e) => update('walkForward', { ...config.walkForward, enabled: e.target.checked })}
                        className="accent-accent-primary w-4 h-4 cursor-pointer"
                    />
                </div>
            </div>

            {/* 5. Run Name & Action Button */}
            <div className="mt-auto pt-3 border-t border-border-subtle flex flex-col gap-2">
                <input
                    type="text"
                    placeholder="Run Name (e.g. Predictor v1 7-Bar)"
                    value={runName}
                    onChange={(e) => setRunName(e.target.value)}
                    className="w-full bg-background-surface border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-primary outline-none"
                />

                <button
                    type="button"
                    onClick={onRunBacktest}
                    disabled={isRunning}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                    {isRunning ? (
                        <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Simulating Historical Replay...</span>
                        </>
                    ) : (
                        <>
                            <Play size={14} fill="currentColor" />
                            <span>Run Backtest Simulation</span>
                        </>
                    )}
                </button>
            </div>
        </aside>

        {/* Global Instrument Search Modal Overlay */}
        {isModalOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl rounded-2xl">
                    <InstrumentSelectorModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        currentInstrument={{ value: config.instrument }}
                        onSelect={handleModalSelect}
                        mode="select"
                    />
                </div>
            </div>
        )}
        </>
    );
}
