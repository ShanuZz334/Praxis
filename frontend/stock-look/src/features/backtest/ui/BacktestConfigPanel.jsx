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
        const isCurrentDay = config.timeframe === 'day';
        const isNextDay = tf === 'day';
        let newDateRange = config.dateRange;

        if (isCurrentDay && !isNextDay) {
            // Switching from Daily to Intraday: default to 1Y
            newDateRange = '1Y';
        } else if (!isCurrentDay && isNextDay) {
            // Switching from Intraday to Daily: default to SINCE_2010
            newDateRange = 'SINCE_2010';
        }

        onChangeConfig({
            ...config,
            timeframe: tf,
            dateRange: newDateRange,
            mode: profile.mode,
            exitRule: {
                ...config.exitRule,
                targetPct: profile.targetPct,
                stopPct: profile.stopPct,
                trailingStopPct: profile.trailingStopPct,
                horizonBars: profile.horizonBars,
                // Bug fix: reset premature timeout on timeframe switch —
                // the prior timeout bar count is meaningless for the new timeframe's volatility profile
                enableHorizonTimeout: false,
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

    const handleModeChange = (newMode) => {
        if (newMode === 'intraday') {
            const nextTf = config.timeframe === 'day' ? '15m' : config.timeframe;
            const profile = TIMEFRAME_DEFAULTS[nextTf] || TIMEFRAME_DEFAULTS['15m'];
            onChangeConfig({
                ...config,
                mode: 'intraday',
                timeframe: nextTf,
                dateRange: config.timeframe === 'day' ? '1Y' : config.dateRange,
                exitRule: {
                    ...config.exitRule,
                    targetPct: profile.targetPct,
                    stopPct: profile.stopPct,
                    trailingStopPct: profile.trailingStopPct,
                    horizonBars: profile.horizonBars,
                    enableHorizonTimeout: false,
                }
            });
        } else if (newMode === 'swing') {
            const nextTf = (config.timeframe === '1m' || config.timeframe === '5m') ? 'day' : config.timeframe;
            const profile = TIMEFRAME_DEFAULTS[nextTf] || TIMEFRAME_DEFAULTS.day;
            onChangeConfig({
                ...config,
                mode: 'swing',
                timeframe: nextTf,
                dateRange: nextTf === 'day' && (config.dateRange === '1Y' || config.dateRange === '6M' || config.dateRange === '1M') ? 'SINCE_2010' : config.dateRange,
                exitRule: {
                    ...config.exitRule,
                    targetPct: profile.targetPct,
                    stopPct: profile.stopPct,
                    trailingStopPct: profile.trailingStopPct,
                    horizonBars: profile.horizonBars,
                    enableHorizonTimeout: false,
                }
            });
        } else if (newMode === 'positional') {
            const nextTf = 'day';
            onChangeConfig({
                ...config,
                mode: 'positional',
                timeframe: nextTf,
                dateRange: (config.dateRange === '1Y' || config.dateRange === '6M' || config.dateRange === '1M') ? 'SINCE_2010' : config.dateRange,
                exitRule: {
                    ...config.exitRule,
                    targetPct: 5.0,
                    stopPct: 2.5,
                    trailingStopPct: 2.0,
                    horizonBars: 25,
                    enableHorizonTimeout: false,
                }
            });
        }
    };

    if (!isOpen) return null;

    return (
        <>
        <aside className="w-[340px] flex-shrink-0 bg-background-card border-r border-border-subtle h-full overflow-y-auto overflow-x-hidden p-3.5 pb-10 flex flex-col gap-3 text-xs select-none custom-scrollbar">
            {/* Header Title */}
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle/60">
                <div className="flex items-center gap-2">
                    <Sliders size={14} className="text-accent-primary" />
                    <span className="font-bold text-text-primary uppercase tracking-wider text-xs font-mono">
                        Test Configuration
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-text-tertiary bg-background-surface px-2 py-0.5 rounded border border-border-subtle/50 font-mono">
                        v1.0 Pro
                    </span>
                </div>
            </div>

            {/* 1. Instrument Selection */}
            <div className="bg-background-surface/70 rounded-xl p-3 border border-border-subtle flex flex-col gap-2.5 shadow-xs relative z-30">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/50">
                    <div className="flex items-center gap-1.5">
                        <Filter size={12} className="text-text-tertiary" />
                        <span className="font-semibold text-[10px] text-text-secondary uppercase tracking-wider">
                            Instrument
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="text-[10px] text-accent-primary hover:text-accent-primary/80 flex items-center gap-1 font-mono font-semibold transition px-1.5 py-0.5 rounded hover:bg-accent-primary/10 cursor-pointer"
                        title="Search All Instruments Modal"
                    >
                        <Search size={10} />
                        <span>Browse All</span>
                    </button>
                </div>

                {/* Category Switcher */}
                <div className="flex bg-background-app/80 rounded-lg p-0.5 border border-border-subtle w-full gap-1">
                    <button
                        type="button"
                        onClick={() => handleCategorySwitch('Indices')}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] py-1 rounded-md font-bold transition-all cursor-pointer ${
                            activeCategory === 'Indices'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-xs'
                                : 'text-text-tertiary hover:text-text-primary hover:bg-background-surface/50 border border-transparent'
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
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-xs'
                                : 'text-text-tertiary hover:text-text-primary hover:bg-background-surface/50 border border-transparent'
                        }`}
                    >
                        <Building2 size={11} />
                        <span>Companies</span>
                    </button>
                </div>

                {/* Quick Presets with Dedicated Non-Clipping Label */}
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-semibold text-text-tertiary uppercase tracking-wider">
                        Quick Presets
                    </span>
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                        {(activeCategory === 'Indices' ? QUICK_INDICES : QUICK_COMPANIES).map((item) => {
                            const isSelected = config.instrument === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => update('instrument', item.value)}
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer border ${
                                        isSelected
                                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-xs'
                                            : 'bg-background-app/70 text-text-secondary hover:text-text-primary hover:bg-background-elevated border-border-subtle/60'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Searchable Dropdown */}
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
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-background-app/70 border border-border-subtle/60 text-[10px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-text-tertiary font-mono text-[9px] uppercase tracking-wider shrink-0">Target:</span>
                        <span className="font-bold text-text-primary font-mono truncate max-w-[170px]" title={currentLabel}>
                            {currentLabel}
                        </span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase shrink-0">
                        {isCompanyInstrument ? 'EQUITY' : 'INDEX'}
                    </span>
                </div>
            </div>

            {/* 2. Timeframe, Mode & Historical Horizon */}
            <div className="bg-background-surface/70 rounded-xl p-3 border border-border-subtle flex flex-col gap-2.5 shadow-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/50">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-text-tertiary" />
                        <span className="font-semibold text-[10px] text-text-secondary uppercase tracking-wider">
                            Timeframe & Horizon
                        </span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                        {config.timeframe === 'day' ? (
                            <>
                                {(config.dateRange || 'SINCE_2010') === 'SINCE_2010' && '~4.1k Daily Bars'}
                                {config.dateRange === 'SINCE_2015' && '~2.8k Daily Bars'}
                                {config.dateRange === 'SINCE_2020' && '~1.6k Daily Bars'}
                                {config.dateRange === 'ALL_TIME' && '~6.6k Daily Bars'}
                                {(config.dateRange === 'LAST_2_YEARS' || config.dateRange === '2Y') && '~500 Daily Bars'}
                                {config.dateRange === '3Y' && '~750 Daily Bars'}
                                {config.dateRange === '1Y' && '~250 Daily Bars'}
                                {config.dateRange === '6M' && '~125 Daily Bars'}
                                {config.dateRange === '1M' && '~22 Daily Bars'}
                            </>
                        ) : config.timeframe === '1m' ? (
                            <>
                                {(config.dateRange === '3Y' || config.dateRange === 'SINCE_2010' || !config.dateRange) && '~Not Stored (3.5Y)'}
                                {config.dateRange === '2Y' && '~Not Stored (2Y)'}
                                {config.dateRange === '1Y' && '~~375k 1m Bars'}
                                {config.dateRange === '6M' && '~187k 1m Bars'}
                                {config.dateRange === '1M' && '~33k 1m Bars'}
                            </>
                        ) : config.timeframe === '5m' ? (
                            <>
                                {config.dateRange === '3Y' && '~~111k 5m Bars'}
                                {config.dateRange === '2Y' && '~74k 5m Bars'}
                                {(config.dateRange === '1Y' || config.dateRange === 'SINCE_2010' || !config.dateRange) && '~37k 5m Bars'}
                                {config.dateRange === '6M' && '~18.5k 5m Bars'}
                                {config.dateRange === '1M' && '~3.1k 5m Bars'}
                            </>
                        ) : config.timeframe === '1h' ? (
                            <>
                                {config.dateRange === '3Y' && '~2.2k 1h Bars'}
                                {config.dateRange === '2Y' && '~1.5k 1h Bars'}
                                {(config.dateRange === '1Y' || config.dateRange === 'SINCE_2010' || !config.dateRange) && '~750 1h Bars'}
                                {config.dateRange === '6M' && '~375 1h Bars'}
                                {config.dateRange === '1M' && '~62 1h Bars'}
                            </>
                        ) : (
                            <>
                                {config.dateRange === '3Y' && '~22k 15m Bars'}
                                {config.dateRange === '2Y' && '~12.5k 15m Bars'}
                                {(config.dateRange === '1Y' || config.dateRange === 'SINCE_2010' || !config.dateRange) && '~6.2k 15m Bars'}
                                {config.dateRange === '6M' && '~3.1k 15m Bars'}
                                {config.dateRange === '1M' && '~550 15m Bars'}
                            </>
                        )}
                    </span>
                </div>

                {/* Timeframe Selection: 5 Equal Columns */}
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-semibold text-text-tertiary uppercase tracking-wider">
                        Timeframe
                    </span>
                    <div className="grid grid-cols-5 gap-1 bg-background-app/80 p-0.5 rounded-lg border border-border-subtle">
                        {['1m', '5m', '15m', '1h', 'day'].map((tf) => (
                            <button
                                key={tf}
                                type="button"
                                onClick={() => handleTimeframeChange(tf)}
                                className={`py-1 text-[10px] font-mono font-bold rounded-md uppercase transition cursor-pointer text-center ${
                                    config.timeframe === tf
                                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-xs'
                                        : 'text-text-tertiary hover:text-text-primary hover:bg-background-surface/50 border border-transparent'
                                }`}
                            >
                                {tf === 'day' ? '1D' : tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Strategy Mode Selection: 3 Equal Columns */}
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-semibold text-text-tertiary uppercase tracking-wider">
                        Strategy Mode
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-background-app/80 p-0.5 rounded-lg border border-border-subtle">
                        {[
                            { id: 'intraday', label: 'Intraday' },
                            { id: 'swing', label: 'Swing' },
                            { id: 'positional', label: 'Positional' }
                        ].map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => handleModeChange(m.id)}
                                className={`py-1 text-[10px] font-medium rounded-md transition cursor-pointer text-center ${
                                    config.mode === m.id
                                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-xs font-bold'
                                        : 'text-text-tertiary hover:text-text-primary hover:bg-background-surface/50 border border-transparent'
                                }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Historical Horizon: 5 Equal Columns */}
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono font-semibold text-text-tertiary uppercase tracking-wider">
                        Historical Horizon
                    </span>
                    <div className="grid grid-cols-5 gap-1 bg-background-app/80 p-0.5 rounded-lg border border-border-subtle">
                        {(config.timeframe === 'day' ? [
                            { id: 'SINCE_2010', label: '2010+' },
                            { id: 'SINCE_2015', label: '2015+' },
                            { id: 'SINCE_2020', label: '2020+' },
                            { id: 'ALL_TIME', label: 'Max' },
                            { id: 'LAST_2_YEARS', label: '2Y' },
                        ] : [
                            { id: '3Y', label: '3.5Y' },
                            { id: '2Y', label: '2Y' },
                            { id: '1Y', label: '1Y' },
                            { id: '6M', label: '6M' },
                            { id: '1M', label: '1M' },
                        ]).map((r) => {
                            const isSelected = config.timeframe === 'day'
                                ? (config.dateRange || 'SINCE_2010') === r.id
                                : (config.dateRange || '1Y') === r.id || (r.id === '1Y' && config.dateRange === 'SINCE_2010');
                            return (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => update('dateRange', r.id)}
                                    className={`py-1 text-[9px] font-mono font-bold rounded-md transition cursor-pointer text-center ${
                                        isSelected
                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs'
                                            : 'text-text-tertiary hover:text-text-primary hover:bg-background-surface/50 border border-transparent'
                                    }`}
                                    title={r.label}
                                >
                                    {r.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Unit Under Test */}
            <div className="bg-background-surface/70 rounded-xl p-3 border border-border-subtle flex flex-col gap-2.5 shadow-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/50">
                    <div className="flex items-center gap-1.5">
                        <Cpu size={12} className="text-text-tertiary" />
                        <span className="font-semibold text-[10px] text-text-secondary uppercase tracking-wider">
                            Unit Under Test
                        </span>
                    </div>
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

                {/* 8 Engine Selection Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                    {TESTABLE_UNITS.map((unit) => {
                        const Icon = unit.icon;
                        const isSelected = config.unit === unit.id;
                        return (
                            <button
                                key={unit.id}
                                type="button"
                                onClick={() => update('unit', unit.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-blue-500/15 border-blue-500/40 text-text-primary shadow-xs ring-1 ring-blue-500/30 font-semibold'
                                        : 'bg-background-app/50 border-border-subtle/60 text-text-secondary hover:bg-background-elevated/40 hover:text-text-primary hover:border-border-default'
                                }`}
                                title={unit.desc}
                            >
                                <Icon size={13} className={isSelected ? 'text-blue-400 shrink-0' : 'text-text-tertiary shrink-0'} />
                                <span className="text-[11px] truncate font-medium">{unit.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Sub-parameters based on unit */}
                {config.unit === 'PATTERNS' && (
                    <div className="bg-background-app/70 p-2.5 rounded-lg border border-border-subtle/60 flex flex-col gap-2 mt-0.5">
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-text-secondary font-medium">Filter Pattern</span>
                            <span className="font-mono font-bold text-accent-primary text-[10px]">
                                {config.selectedPattern || 'ALL'}
                            </span>
                        </div>
                        <select
                            value={config.selectedPattern || 'ALL'}
                            onChange={(e) => update('selectedPattern', e.target.value)}
                            className="w-full bg-background-elevated border border-border-subtle rounded-md px-2 py-1 text-[11px] text-text-primary outline-none font-mono cursor-pointer"
                        >
                            <option value="ALL">All 40+ Patterns (Any Trigger)</option>
                            <optgroup label="Single-Candle Reversals">
                                <option value="Hammer">Hammer (Bull)</option>
                                <option value="ShootingStar">Shooting Star (Bear)</option>
                                <option value="InvertedHammer">Inverted Hammer (Bull)</option>
                                <option value="HangingMan">Hanging Man (Bear)</option>
                                <option value="BullMarubozu">Bullish Marubozu</option>
                                <option value="BearMarubozu">Bearish Marubozu</option>
                            </optgroup>
                            <optgroup label="Two-Candle Formations">
                                <option value="BullEngulfing">Bullish Engulfing</option>
                                <option value="BearEngulfing">Bearish Engulfing</option>
                                <option value="PiercingLine">Piercing Line (Bull)</option>
                                <option value="DarkCloudCover">Dark Cloud Cover (Bear)</option>
                                <option value="BullHarami">Bullish Harami</option>
                                <option value="BearHarami">Bearish Harami</option>
                            </optgroup>
                            <optgroup label="Three-Candle Formations">
                                <option value="MorningStar">Morning Star (Bull)</option>
                                <option value="EveningStar">Evening Star (Bear)</option>
                                <option value="ThreeWhiteSoldiers">Three White Soldiers</option>
                                <option value="ThreeBlackCrows">Three Black Crows</option>
                            </optgroup>
                            <optgroup label="Structural Patterns">
                                <option value="DoubleBottom">Double Bottom</option>
                                <option value="DoubleTop">Double Top</option>
                                <option value="HeadAndShoulders">Head &amp; Shoulders</option>
                                <option value="InvHeadAndShoulders">Inv Head &amp; Shoulders</option>
                            </optgroup>
                        </select>
                    </div>
                )}

                {config.unit === 'PNCO' && (
                    <div className="bg-background-app/70 p-2.5 rounded-lg border border-border-subtle/60 flex flex-col gap-1.5 mt-0.5">
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-text-secondary font-medium">Momentum Threshold</span>
                            <span className="font-mono font-bold text-accent-primary">±{config.pncoThreshold || 25}</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="45"
                            step="5"
                            value={config.pncoThreshold || 25}
                            onChange={(e) => update('pncoThreshold', Number(e.target.value))}
                            className="w-full accent-accent-primary cursor-pointer h-1.5 bg-background-subtle rounded-lg"
                        />
                        <span className="text-[9px] text-text-tertiary">
                            Triggers on zero-line crosses and ±{config.pncoThreshold || 25} extreme momentum rebounds
                        </span>
                    </div>
                )}

                {config.unit === 'HEAD_TO_HEAD' && (
                    <div className="bg-background-app/70 p-2.5 rounded-lg border border-border-subtle/60 flex flex-col gap-1.5 mt-0.5">
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-text-secondary font-medium">Confluence Sensitivity</span>
                            <span className="font-mono font-bold text-accent-primary">±{config.pncoThreshold || 20}</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="35"
                            step="5"
                            value={config.pncoThreshold || 20}
                            onChange={(e) => update('pncoThreshold', Number(e.target.value))}
                            className="w-full accent-accent-primary cursor-pointer h-1.5 bg-background-subtle rounded-lg"
                        />
                        <span className="text-[9px] text-text-tertiary">
                            Requires PNCO ±{config.pncoThreshold || 20} alignment with smart money flow
                        </span>
                    </div>
                )}

                {config.unit === 'COMPOSITE_SCORE' && (
                    <div className="bg-background-app/70 p-2.5 rounded-lg border border-border-subtle/60 flex flex-col gap-1.5 mt-0.5">
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-text-secondary font-medium">Score Threshold</span>
                            <span className="font-mono font-bold text-accent-primary">±{config.patternThreshold || 4}</span>
                        </div>
                        <input
                            type="range"
                            min="2"
                            max="8"
                            step="1"
                            value={config.patternThreshold || 4}
                            onChange={(e) => update('patternThreshold', Number(e.target.value))}
                            className="w-full accent-accent-primary cursor-pointer h-1.5 bg-background-subtle rounded-lg"
                        />
                    </div>
                )}

                {config.unit === 'CUSTOM_COMBO' && (
                    <div className="bg-background-app/70 p-2.5 rounded-lg border border-border-subtle/60 flex flex-col gap-2 mt-0.5">
                        <span className="font-bold text-[10px] text-text-secondary uppercase tracking-wider">Strategy Rule Builder</span>
                        <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                            <input
                                type="checkbox"
                                checked={config.customRules?.requireIfdiAccumulation ?? true}
                                onChange={(e) => updateCustomRule('requireIfdiAccumulation', e.target.checked)}
                                className="accent-accent-primary rounded"
                            />
                            <span>Require IFDI Smart Accumulation</span>
                        </label>
                        <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
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

            {/* 4. Exit Rules & Stops */}
            <div className="bg-background-surface/70 rounded-xl p-3 border border-border-subtle flex flex-col gap-2.5 shadow-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/50">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-text-tertiary" />
                        <span className="font-semibold text-[10px] text-text-secondary uppercase tracking-wider">
                            Exit Rules & Stops
                        </span>
                    </div>
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

                {/* Exit Type Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-background-app/80 p-0.5 rounded-lg border border-border-subtle">
                    {[
                        { id: 'TARGET_STOP', label: 'Target/Stop' },
                        { id: 'TRAILING_STOP', label: 'Trailing' },
                        { id: 'HORIZON', label: 'Fixed Horizon' },
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => updateExitRule('type', mode.id)}
                            className={`py-1 text-[10px] font-medium rounded-md transition cursor-pointer text-center ${
                                config.exitRule.type === mode.id
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-xs font-bold'
                                    : 'text-text-tertiary hover:text-text-primary hover:bg-background-surface/50 border border-transparent'
                            }`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>

                {config.exitRule.type !== 'HORIZON' && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-background-app/70 p-2 rounded-lg border border-border-subtle/60 flex flex-col gap-1">
                                <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">Profit Target</span>
                                <div className="flex items-center justify-between">
                                    <input
                                        type="number"
                                        step="0.05"
                                        min="0.05"
                                        max="20"
                                        value={config.exitRule.targetPct}
                                        onChange={(e) => updateExitRule('targetPct', Number(e.target.value))}
                                        className="w-14 bg-background-elevated/80 px-1.5 py-0.5 rounded border border-border-subtle text-text-primary font-mono font-bold text-xs outline-none focus:border-accent-primary/60"
                                    />
                                    <span className="text-emerald-400 font-mono font-bold text-xs">+{config.exitRule.targetPct}%</span>
                                </div>
                            </div>

                            <div className="bg-background-app/70 p-2 rounded-lg border border-border-subtle/60 flex flex-col gap-1">
                                <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">Stop Loss</span>
                                <div className="flex items-center justify-between">
                                    <input
                                        type="number"
                                        step="0.05"
                                        min="0.05"
                                        max="15"
                                        value={config.exitRule.stopPct}
                                        onChange={(e) => updateExitRule('stopPct', Number(e.target.value))}
                                        className="w-14 bg-background-elevated/80 px-1.5 py-0.5 rounded border border-border-subtle text-text-primary font-mono font-bold text-xs outline-none focus:border-accent-primary/60"
                                    />
                                    <span className="text-rose-400 font-mono font-bold text-xs">-{config.exitRule.stopPct}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Theoretical R:R Ratio Preview */}
                        <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-background-app/70 border border-border-subtle/60 text-[10px] font-mono">
                            <span className="text-text-tertiary uppercase tracking-wider text-[9px]">Theoretical R : R</span>
                            <span className="font-bold text-blue-400 text-xs">
                                1 : {config.exitRule.stopPct > 0 ? ((config.exitRule.targetPct || 1) / config.exitRule.stopPct).toFixed(2) : '∞'}
                            </span>
                        </div>

                        {/* Breakeven Stop Lock Toggle */}
                        <div className="bg-background-app/70 p-2 rounded-lg border border-border-subtle/60 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-text-secondary text-[11px] font-medium">Breakeven Stop Lock</span>
                                <span className="text-[9px] text-text-tertiary">Move stop to entry after +50% target</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={config.exitRule?.lockBreakeven ?? false}
                                onChange={(e) => updateExitRule('lockBreakeven', e.target.checked)}
                                className="accent-accent-primary w-3.5 h-3.5 cursor-pointer"
                                title="Lock stop to breakeven once price reaches half of target"
                            />
                        </div>
                    </>
                )}

                {config.exitRule.type === 'TRAILING_STOP' && (
                    <div className="bg-background-app/70 p-2 rounded-lg border border-border-subtle/60 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-text-secondary text-[11px] font-medium">Trailing Distance %</span>
                            <span className="text-[9px] text-text-tertiary">Trails peak high / trough low</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono">
                            <input
                                type="number"
                                step="0.05"
                                min="0.05"
                                max="10"
                                value={config.exitRule.trailingStopPct ?? 0.4}
                                onChange={(e) => updateExitRule('trailingStopPct', Number(e.target.value))}
                                className="w-14 bg-background-elevated/80 px-1.5 py-0.5 rounded border border-border-subtle text-text-primary font-bold text-xs text-center outline-none focus:border-accent-primary/60"
                            />
                            <span className="text-text-tertiary text-[10px]">%</span>
                        </div>
                    </div>
                )}

                {config.exitRule.type === 'TARGET_STOP' ? (
                    <div className="bg-background-app/70 p-2 rounded-lg border border-border-subtle/60 flex items-center justify-between">
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
                                        value={config.exitRule.horizonBars || (TIMEFRAME_DEFAULTS[config.timeframe]?.horizonBars ?? 10)}
                                        onChange={(e) => updateExitRule('horizonBars', Number(e.target.value))}
                                        className="w-12 bg-background-elevated/80 px-1.5 py-0.5 rounded border border-border-subtle text-text-primary font-mono font-bold text-xs text-center outline-none focus:border-accent-primary/60"
                                    />
                                    <span className="text-text-tertiary text-[10px] font-sans">bars</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : config.exitRule.type === 'HORIZON' ? (
                    <div className="bg-background-app/70 p-2.5 rounded-lg border border-border-subtle/60 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-text-secondary text-[11px] font-medium">Horizon (Fixed Bars)</span>
                            <span className="text-[9px] text-text-tertiary">Unconditional trade exit after N bars</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={config.exitRule.horizonBars || (TIMEFRAME_DEFAULTS[config.timeframe]?.horizonBars ?? 10)}
                                onChange={(e) => updateExitRule('horizonBars', Number(e.target.value))}
                                className="w-12 bg-background-elevated/80 px-1.5 py-0.5 rounded border border-border-subtle text-text-primary font-bold text-xs text-center outline-none focus:border-accent-primary/60"
                            />
                            <span className="text-text-tertiary text-[10px] font-sans">bars</span>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* 5. Capital & Risk Sizing */}
            <div className="bg-background-surface/70 rounded-xl p-3 border border-border-subtle flex flex-col gap-2.5 shadow-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/50">
                    <div className="flex items-center gap-1.5">
                        <BarChart2 size={12} className="text-text-tertiary" />
                        <span className="font-semibold text-[10px] text-text-secondary uppercase tracking-wider">
                            Capital & Risk Sizing
                        </span>
                    </div>
                </div>

                {/* Sizing Model Switch */}
                <div className="flex bg-background-app/80 rounded-lg p-0.5 border border-border-subtle w-full gap-1">
                    <button
                        type="button"
                        onClick={() => update('sizingModel', 'PERCENT_EQUITY')}
                        className={`flex-1 flex items-center justify-center text-[10px] py-1 rounded-md font-bold transition-all cursor-pointer ${
                            (config.sizingModel ?? 'PERCENT_EQUITY') === 'PERCENT_EQUITY'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-xs'
                                : 'text-text-tertiary hover:text-text-primary hover:bg-background-surface/50 border border-transparent'
                        }`}
                        title="Position size compounds dynamically with current portfolio equity"
                    >
                        <span>% Equity (Compound)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => update('sizingModel', 'FIXED_CAPITAL')}
                        className={`flex-1 flex items-center justify-center text-[10px] py-1 rounded-md font-bold transition-all cursor-pointer ${
                            config.sizingModel === 'FIXED_CAPITAL'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-xs'
                                : 'text-text-tertiary hover:text-text-primary hover:bg-background-surface/50 border border-transparent'
                        }`}
                        title="Position size calculated against static starting capital (flat risk per trade)"
                    >
                        <span>Fixed Capital</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {/* Starting Capital */}
                    <div className="bg-background-app/70 p-2 rounded-lg border border-border-subtle/60 flex flex-col gap-1 justify-between">
                        <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">Starting Capital</span>
                        <div className="flex items-center bg-background-elevated/80 border border-border-subtle rounded-md px-2 py-0.5 focus-within:border-accent-primary/60 transition-colors">
                            <span className="text-text-tertiary text-xs font-mono mr-1">₹</span>
                            <input
                                type="number"
                                step="10000"
                                min="1000"
                                max="100000000"
                                value={config.initialCapital ?? 100000}
                                onChange={(e) => update('initialCapital', Math.max(1000, Number(e.target.value)))}
                                className="w-full bg-transparent text-text-primary font-mono font-bold text-xs outline-none"
                            />
                        </div>
                    </div>

                    {/* Position Sizing */}
                    <div className="bg-background-app/70 p-2 rounded-lg border border-border-subtle/60 flex flex-col gap-1 justify-between">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">Position Sizing</span>
                            <span className="text-blue-400 font-mono font-bold text-xs">{config.positionSizePct ?? 100}%</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={config.positionSizePct ?? 100}
                            onChange={(e) => update('positionSizePct', Number(e.target.value))}
                            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-background-subtle rounded-lg my-1"
                        />
                    </div>
                </div>
            </div>

            {/* 6. Execution Guardrails & Friction */}
            <div className="bg-background-surface/70 rounded-xl p-3 border border-border-subtle flex flex-col gap-2.5 shadow-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/50">
                    <div className="flex items-center gap-1.5">
                        <Activity size={12} className="text-text-tertiary" />
                        <span className="font-semibold text-[10px] text-text-secondary uppercase tracking-wider">
                            Execution Guardrails
                        </span>
                    </div>
                </div>

                {/* Slippage Fill Model */}
                <div className="flex items-center justify-between bg-background-app/70 p-2 rounded-lg border border-border-subtle/60">
                    <div>
                        <span className="font-medium text-text-primary text-[11px] block">Execution Fill Model</span>
                        <span className="text-[9px] text-text-tertiary">
                            {config.slippageModel === 'NEXT_BAR_OPEN' ? 'Realistic: Next Open' : 'Instant: Signal Close'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => update('slippageModel', config.slippageModel === 'NEXT_BAR_OPEN' ? 'SAME_BAR_CLOSE' : 'NEXT_BAR_OPEN')}
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border transition cursor-pointer ${
                            config.slippageModel === 'NEXT_BAR_OPEN'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-xs'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                    >
                        {config.slippageModel === 'NEXT_BAR_OPEN' ? 'Realistic' : 'Instant'}
                    </button>
                </div>

                {/* Friction Cost Model */}
                <div className="flex items-center justify-between bg-background-app/70 p-2 rounded-lg border border-border-subtle/60">
                    <div>
                        <span className="font-medium text-text-primary text-[11px] block">Friction Cost Model</span>
                        <span className="text-[9px] text-text-tertiary">
                            {config.costModel === 'INDIAN_REALISTIC' ? 'STT + Brokerage (~0.08%)' : 'Zero Friction (Gross Alpha)'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => update('costModel', config.costModel === 'INDIAN_REALISTIC' ? 'ZERO_FRICTION' : 'INDIAN_REALISTIC')}
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border transition cursor-pointer ${
                            config.costModel === 'INDIAN_REALISTIC'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-xs'
                                : 'bg-background-elevated text-text-tertiary border-border-subtle'
                        }`}
                    >
                        {config.costModel === 'INDIAN_REALISTIC' ? 'Realistic' : 'Zero Cost'}
                    </button>
                </div>

                {/* Walk-Forward Split */}
                <div className="flex items-center justify-between bg-background-app/70 p-2 rounded-lg border border-border-subtle/60">
                    <div>
                        <span className="font-medium text-text-primary text-[11px] block">Walk-Forward Evaluation</span>
                        <span className="text-[9px] text-text-tertiary">
                            {Math.round((config.walkForward?.splitRatio ?? 0.7) * 100)}% Train / {Math.round((1 - (config.walkForward?.splitRatio ?? 0.7)) * 100)}% Validation Split
                        </span>
                    </div>
                    <input
                        type="checkbox"
                        checked={config.walkForward?.enabled ?? true}
                        onChange={(e) => update('walkForward', { ...config.walkForward, enabled: e.target.checked })}
                        className="accent-accent-primary w-3.5 h-3.5 cursor-pointer"
                    />
                </div>
            </div>

            {/* Panel Footer: Run Name & Simulation Button */}
            <div className="mt-auto pt-2 border-t border-border-subtle/60 flex flex-col gap-2">
                <input
                    type="text"
                    placeholder="Run Name (e.g. Predictor v1 7-Bar)"
                    value={runName}
                    onChange={(e) => setRunName(e.target.value)}
                    className="w-full bg-background-app/80 border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-primary/60 outline-none transition-colors"
                />

                <button
                    type="button"
                    onClick={onRunBacktest}
                    disabled={isRunning}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
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
