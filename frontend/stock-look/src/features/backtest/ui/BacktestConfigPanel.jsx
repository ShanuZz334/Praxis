/**
 * @file BacktestConfigPanel.jsx
 * @purpose Left-side control panel for configuring backtesting parameters, testable units, exit rules, and execution models.
 * @date 2026-09-12
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
    Play, Sliders, ShieldCheck, Cpu, Zap, Activity, Layers, 
    TrendingUp, RefreshCw, BarChart2, Eye, GitCompare, ChevronDown,
    Building2, Search, Filter, Sparkles, Calendar, Code2,
    Plus, X, Trash2, Download, Upload, Check, AlertTriangle,
    RotateCcw, SlidersHorizontal, Boxes, ArrowRight
} from 'lucide-react';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import InstrumentSelectorModal from '@/features/trading/ui/InstrumentSelectorModal';
import { SIGNAL_DEFINITIONS, SIGNAL_CATEGORIES } from '@/features/backtest/strategy/strategySignalDefinitions';
import { TIMEFRAME_DEFAULTS } from '../engine/backtestEngine';
import { 
    getTestableUnits, 
    saveTestableUnits, 
    addTestableUnit, 
    removeTestableUnit, 
    resetTestableUnitsToDefault,
    subscribeToTestableUnits,
    exportUnitJson,
    importUnitFromJson,
    DEFAULT_BUILTIN_UNITS 
} from '../engine/testableUnitsRegistry';
import { getCustomIndicators } from '../lab/customIndicatorRegistry';

export const TESTABLE_UNITS = DEFAULT_BUILTIN_UNITS;

const ICON_MAP = {
    Cpu,
    Layers,
    Activity,
    Zap,
    TrendingUp,
    BarChart2,
    GitCompare,
    Sliders,
    Sparkles,
    Code2,
    SlidersHorizontal,
    Boxes,
    ShieldCheck,
};


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

const PATTERN_OPTIONS = [
    { value: 'ALL', label: 'All 40+ Patterns (Any Trigger)', badge: 'ALL' },
    { value: 'Hammer', label: 'Hammer (Bull)', badge: 'Single' },
    { value: 'ShootingStar', label: 'Shooting Star (Bear)', badge: 'Single' },
    { value: 'InvertedHammer', label: 'Inverted Hammer (Bull)', badge: 'Single' },
    { value: 'HangingMan', label: 'Hanging Man (Bear)', badge: 'Single' },
    { value: 'BullMarubozu', label: 'Bullish Marubozu', badge: 'Single' },
    { value: 'BearMarubozu', label: 'Bearish Marubozu', badge: 'Single' },
    { value: 'BullEngulfing', label: 'Bullish Engulfing', badge: 'Two-Candle' },
    { value: 'BearEngulfing', label: 'Bearish Engulfing', badge: 'Two-Candle' },
    { value: 'PiercingLine', label: 'Piercing Line (Bull)', badge: 'Two-Candle' },
    { value: 'DarkCloudCover', label: 'Dark Cloud Cover (Bear)', badge: 'Two-Candle' },
    { value: 'BullHarami', label: 'Bullish Harami', badge: 'Two-Candle' },
    { value: 'BearHarami', label: 'Bearish Harami', badge: 'Two-Candle' },
    { value: 'MorningStar', label: 'Morning Star (Bull)', badge: 'Three-Candle' },
    { value: 'EveningStar', label: 'Evening Star (Bear)', badge: 'Three-Candle' },
    { value: 'ThreeWhiteSoldiers', label: 'Three White Soldiers', badge: 'Three-Candle' },
    { value: 'ThreeBlackCrows', label: 'Three Black Crows', badge: 'Three-Candle' },
    { value: 'DoubleBottom', label: 'Double Bottom', badge: 'Structural' },
    { value: 'DoubleTop', label: 'Double Top', badge: 'Structural' },
    { value: 'HeadAndShoulders', label: 'Head & Shoulders', badge: 'Structural' },
    { value: 'InvHeadAndShoulders', label: 'Inv Head & Shoulders', badge: 'Structural' },
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

    // Dynamic Testable Units State
    const [testableUnits, setTestableUnits] = useState(() => getTestableUnits());
    const [addModalMode, setAddModalMode] = useState(null); // 'INDICATORS' | 'LAB' | 'STRATEGY' | 'RESTORE' | 'IMPORT' | null
    const [indicatorCategory, setIndicatorCategory] = useState('ALL');
    const [unitToDetach, setUnitToDetach] = useState(null);
    const [importJsonText, setImportJsonText] = useState('');
    const [importError, setImportError] = useState('');
    const [catalogSearch, setCatalogSearch] = useState('');

    // Subscribe to testable units and custom indicator changes
    useEffect(() => {
        const unsub = subscribeToTestableUnits((updated) => {
            setTestableUnits(updated);
        });
        return unsub;
    }, []);

    // Automatic fallback if current unit was removed/deleted
    useEffect(() => {
        if (testableUnits.length > 0 && !testableUnits.some(u => u.id === config.unit)) {
            onChangeConfig(prev => ({
                ...prev,
                unit: testableUnits[0].id,
            }));
        }
    }, [testableUnits, config.unit, onChangeConfig]);

    const availableLabIndicators = useMemo(() => {
        return getCustomIndicators();
    }, [testableUnits, addModalMode]);

    const availableStrategies = useMemo(() => {
        try {
            const raw = localStorage.getItem('praxis_strategies');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }, [testableUnits, addModalMode]);

    const removedBuiltins = useMemo(() => {
        const presentIds = new Set(testableUnits.map(u => u.id));
        return DEFAULT_BUILTIN_UNITS.filter(b => !presentIds.has(b.id));
    }, [testableUnits]);

    const handleInitiateRemoveUnit = (unit) => {
        if (unit.type === 'BUILTIN' || unit.type === 'INDICATOR') {
            removeTestableUnit(unit.id);
            if (config.unit === unit.id) {
                const remaining = testableUnits.filter(u => u.id !== unit.id);
                if (remaining.length > 0) {
                    onChangeConfig(prev => ({ ...prev, unit: remaining[0].id }));
                }
            }
        } else {
            setUnitToDetach(unit);
        }
    };

    const handleConfirmRemoveOnly = (unit) => {
        removeTestableUnit(unit.id, { deleteFromApp: false });
        if (config.unit === unit.id) {
            const remaining = testableUnits.filter(u => u.id !== unit.id);
            if (remaining.length > 0) {
                onChangeConfig(prev => ({ ...prev, unit: remaining[0].id }));
            }
        }
        setUnitToDetach(null);
    };

    const handleConfirmDeletePermanently = (unit) => {
        removeTestableUnit(unit.id, { deleteFromApp: true });
        if (config.unit === unit.id) {
            const remaining = testableUnits.filter(u => u.id !== unit.id);
            if (remaining.length > 0) {
                onChangeConfig(prev => ({ ...prev, unit: remaining[0].id }));
            }
        }
        setUnitToDetach(null);
    };

    const handleResetUnits = () => {
        resetTestableUnitsToDefault();
        onChangeConfig(prev => ({ ...prev, unit: 'PREDICTOR' }));
    };

    const handleImportJson = () => {
        setImportError('');
        try {
            const imported = importUnitFromJson(importJsonText);
            if (imported) {
                onChangeConfig(prev => ({ ...prev, unit: imported.id }));
                setAddModalMode(null);
                setImportJsonText('');
            }
        } catch (err) {
            setImportError(err.message || 'Failed to parse unit struct JSON.');
        }
    };

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
                        <Cpu size={12} className="text-text-tertiary shrink-0" />
                        <span className="font-semibold text-[10px] text-text-secondary uppercase tracking-wider whitespace-nowrap">
                            Unit Under Test
                        </span>
                        <span className="text-[9px] font-mono font-bold text-accent-primary bg-accent-primary/10 border border-accent-primary/25 px-1.5 py-0.2 rounded shrink-0">
                            {testableUnits.length}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAddModalMode('INDICATORS')}
                        className="flex items-center gap-1 text-[10px] font-mono font-semibold text-accent-primary hover:text-accent-primary/80 transition px-1.5 py-0.5 rounded hover:bg-accent-primary/10 cursor-pointer shrink-0"
                        title="Open Units Catalog to add standard indicators, custom models, or strategies"
                    >
                        <Plus size={10} />
                        <span>Add Unit</span>
                    </button>
                </div>

                {/* Dynamic Engine Selection Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                    {testableUnits.map((unit) => {
                        const Icon = ICON_MAP[unit.iconName] || unit.icon || Cpu;
                        const isSelected = config.unit === unit.id;
                        const isCustom = unit.type === 'CUSTOM_INDICATOR' || unit.type === 'STRATEGY' || unit.type === 'INDICATOR' || unit.isDetachable;
                        return (
                            <div
                                key={unit.id}
                                className={`group relative flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                                    isSelected
                                        ? 'bg-blue-500/15 border-blue-500/40 text-text-primary shadow-xs ring-1 ring-blue-500/30 font-semibold'
                                        : 'bg-background-app/50 border-border-subtle/60 text-text-secondary hover:bg-background-elevated/40 hover:text-text-primary hover:border-border-default'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => update('unit', unit.id)}
                                    className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                                    title={unit.desc}
                                >
                                    <Icon size={13} className={isSelected ? 'text-blue-400 shrink-0' : 'text-text-tertiary shrink-0'} />
                                    <span className="text-[11px] truncate font-medium">{unit.label}</span>
                                </button>

                                {/* Badges for custom units, indicators, strategies */}
                                {isCustom && unit.nickname && (
                                    <span className={`text-[8px] font-mono px-1 py-0.2 rounded border shrink-0 mr-3 ${
                                        unit.type === 'INDICATOR'
                                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                            : unit.type === 'STRATEGY'
                                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    }`}>
                                        {unit.nickname}
                                    </span>
                                )}

                                {/* Floating remove/detach button on hover */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleInitiateRemoveUnit(unit);
                                    }}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-text-tertiary hover:text-rose-400 p-0.5 rounded transition cursor-pointer z-10"
                                    title={isCustom ? "Remove / Detach Unit from Grid" : "Remove from Grid"}
                                >
                                    <X size={10} />
                                </button>
                            </div>
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
                        <UiverseDropdown
                            options={PATTERN_OPTIONS}
                            value={config.selectedPattern || 'ALL'}
                            onChange={(val) => update('selectedPattern', val)}
                            placeholder="Select Pattern..."
                            searchPlaceholder="Search patterns..."
                            matchWidth={true}
                        />
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

                {/* Dynamic Unit Sub-Parameters (Standard Indicators / Custom Lab / Strategies) */}
                {Boolean(!['PATTERNS', 'PNCO', 'HEAD_TO_HEAD', 'COMPOSITE_SCORE', 'CUSTOM_COMBO', 'PREDICTOR', 'AAVB', 'IFDI'].includes(config.unit)) && (() => {
                    const activeUnitObj = testableUnits.find(u => u.id === config.unit);
                    const isIndicator = activeUnitObj?.type === 'INDICATOR' || Boolean(SIGNAL_DEFINITIONS[config.unit]);
                    const isStrategy = activeUnitObj?.type === 'STRATEGY' || config.unit?.startsWith('strat_');
                    const indDef = isIndicator ? SIGNAL_DEFINITIONS[activeUnitObj?.id || config.unit] : null;

                    if (isIndicator && indDef) {
                        const preset = indDef.presetConditions?.[0];
                        return (
                            <div className="bg-background-app/70 p-2.5 rounded-lg border border-border-subtle/60 flex flex-col gap-2 mt-0.5">
                                <div className="flex justify-between items-center text-[11px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Activity size={12} className="text-cyan-400 shrink-0" />
                                        <span className="text-text-secondary font-medium truncate">
                                            {indDef.label}
                                        </span>
                                    </div>
                                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase">
                                        {indDef.category || 'INDICATOR'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-text-tertiary leading-snug">
                                    {indDef.desc}
                                </p>
                                {preset && (
                                    <div className="text-[9px] font-mono text-cyan-300 bg-cyan-500/10 p-1.5 rounded border border-cyan-500/20">
                                        Signal Trigger: {preset.label}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    if (isStrategy) {
                        return (
                            <div className="bg-background-app/70 p-2.5 rounded-lg border border-border-subtle/60 flex flex-col gap-2 mt-0.5">
                                <div className="flex justify-between items-center text-[11px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <SlidersHorizontal size={12} className="text-blue-400 shrink-0" />
                                        <span className="text-text-secondary font-medium truncate">
                                            {activeUnitObj?.label || 'Strategy Blueprint'}
                                        </span>
                                    </div>
                                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase">
                                        {(activeUnitObj?.rules || []).length} RULES
                                    </span>
                                </div>
                                <p className="text-[10px] text-text-tertiary leading-snug">
                                    {activeUnitObj?.desc || 'Compound multi-factor strategy'}
                                </p>
                            </div>
                        );
                    }

                    const activeMode = config.mode || 'swing';
                    const modeThreshold = activeUnitObj?.modes?.[activeMode]?.threshold ?? 20;
                    const currentThreshold = config.customThreshold !== undefined ? config.customThreshold : modeThreshold;

                    return (
                        <div className="bg-background-app/70 p-2.5 rounded-lg border border-border-subtle/60 flex flex-col gap-2 mt-0.5">
                            <div className="flex justify-between items-center text-[11px]">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles size={12} className="text-amber-400" />
                                    <span className="text-text-secondary font-medium truncate max-w-[140px]">
                                        {activeUnitObj?.label || 'Custom Model'}
                                    </span>
                                </div>
                                <span className="font-mono font-bold text-accent-primary text-[10px]">
                                    ±{currentThreshold}
                                </span>
                            </div>
                            
                            <input
                                type="range"
                                min="5"
                                max="50"
                                step="5"
                                value={currentThreshold}
                                onChange={(e) => update('customThreshold', Number(e.target.value))}
                                className="w-full accent-accent-primary cursor-pointer h-1.5 bg-background-subtle rounded-lg"
                            />
                            
                            <div className="flex items-center justify-between text-[9px] text-text-tertiary pt-0.5 border-t border-border-subtle/40">
                                <span className="truncate max-w-[160px]">
                                    {activeUnitObj?.rules?.length ? `${activeUnitObj.rules.length} custom rules baked` : 'Zero-line & threshold reversals'}
                                </span>
                            </div>
                        </div>
                    );
                })()}

                {/* Auto-Calibrate Active Unit Action */}
                <button
                    type="button"
                    onClick={onOpenOptimizer}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 hover:border-blue-500/40 text-[10px] font-mono font-bold transition cursor-pointer shadow-xs active:scale-[0.99] mt-0.5"
                    title="Run multi-parameter optimization sweep on active unit"
                >
                    <Zap size={11} className="fill-blue-400/20 text-blue-400" />
                    <span>Auto-Calibrate Active Unit</span>
                </button>
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
        {/* Dynamic Units Catalog Modal */}
        {addModalMode && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
                <div className="w-full max-w-md bg-background-card border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-background-elevated/30">
                        <div className="flex items-center gap-2">
                            <Boxes size={16} className="text-accent-primary" />
                            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                                Units Catalog &amp; Manager
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setAddModalMode(null); setCatalogSearch(''); setImportError(''); }}
                            className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-background-elevated transition cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 px-3 py-2 border-b border-border-subtle bg-background-app/60 overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => { setAddModalMode('INDICATORS'); setImportError(''); }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                addModalMode === 'INDICATORS'
                                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                                    : 'text-text-tertiary hover:text-text-primary hover:bg-background-elevated'
                            }`}
                        >
                            <Activity size={11} />
                            <span>Standard Indicators ({Object.keys(SIGNAL_DEFINITIONS).length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => { setAddModalMode('LAB'); setImportError(''); }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                addModalMode === 'LAB'
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                                    : 'text-text-tertiary hover:text-text-primary hover:bg-background-elevated'
                            }`}
                        >
                            <Sparkles size={11} />
                            <span>Custom Lab ({availableLabIndicators.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => { setAddModalMode('STRATEGY'); setImportError(''); }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                addModalMode === 'STRATEGY'
                                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-xs'
                                    : 'text-text-tertiary hover:text-text-primary hover:bg-background-elevated'
                            }`}
                        >
                            <SlidersHorizontal size={11} />
                            <span>Strategies ({availableStrategies.length})</span>
                        </button>

                        {removedBuiltins.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { setAddModalMode('RESTORE'); setImportError(''); }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                    addModalMode === 'RESTORE'
                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs'
                                        : 'text-text-tertiary hover:text-text-primary hover:bg-background-elevated'
                                }`}
                            >
                                <RotateCcw size={11} />
                                <span>Restore Built-in ({removedBuiltins.length})</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => { setAddModalMode('IMPORT'); setImportError(''); }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                addModalMode === 'IMPORT'
                                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-xs'
                                    : 'text-text-tertiary hover:text-text-primary hover:bg-background-elevated'
                            }`}
                        >
                            <Upload size={11} />
                            <span>Import JSON</span>
                        </button>
                    </div>

                    {/* Content */}
                    {addModalMode === 'IMPORT' ? (
                        <div className="p-4 flex flex-col gap-3">
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                                Paste a valid Praxis unit or custom indicator JSON struct to register and add it directly to your testable units.
                            </p>
                            <textarea
                                rows={8}
                                value={importJsonText}
                                onChange={(e) => setImportJsonText(e.target.value)}
                                placeholder={`{\n  "version": "2.0.0",\n  "label": "My Custom Unit",\n  "nickname": "MCU",\n  "code": "..."\n}`}
                                className="w-full font-mono text-[10px] p-2.5 rounded-xl bg-background-app border border-border-subtle text-text-primary outline-none focus:border-accent-primary transition-colors resize-none"
                            />
                            {importError && (
                                <div className="text-[10px] text-rose-400 flex items-center gap-1.5 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 font-mono">
                                    <AlertTriangle size={12} className="shrink-0" />
                                    <span>{importError}</span>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
                                <button
                                    type="button"
                                    onClick={() => { setAddModalMode(null); setImportJsonText(''); setImportError(''); }}
                                    className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded-lg cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleImportJson}
                                    disabled={!importJsonText.trim()}
                                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    Import &amp; Add Unit
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 flex flex-col gap-3 flex-1 overflow-hidden">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                                <input
                                    type="text"
                                    value={catalogSearch}
                                    onChange={(e) => setCatalogSearch(e.target.value)}
                                    placeholder="Filter units by name, category, or nickname..."
                                    className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-background-app border border-border-subtle text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary"
                                />
                            </div>

                            {/* Standard Indicators Category Filter Bar */}
                            {addModalMode === 'INDICATORS' && (
                                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                                    {['ALL', 'MOMENTUM', 'TREND', 'VOLATILITY', 'VOLUME', 'STRUCTURE', 'RAW_DATA'].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setIndicatorCategory(cat)}
                                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold whitespace-nowrap transition cursor-pointer ${
                                                indicatorCategory === cat
                                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                                                    : 'bg-background-app text-text-tertiary hover:text-text-secondary border border-border-subtle'
                                            }`}
                                        >
                                            {cat === 'ALL' ? `All (${Object.keys(SIGNAL_DEFINITIONS).length})` : cat}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Catalog Item List */}
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar max-h-[50vh]">
                                {addModalMode === 'INDICATORS' && (() => {
                                    const filtered = Object.values(SIGNAL_DEFINITIONS).filter(ind => {
                                        const matchesCat = indicatorCategory === 'ALL' || ind.category === indicatorCategory;
                                        const matchesSearch = !catalogSearch || 
                                            (ind.label || '').toLowerCase().includes(catalogSearch.toLowerCase()) || 
                                            (ind.id || '').toLowerCase().includes(catalogSearch.toLowerCase()) ||
                                            (ind.desc || '').toLowerCase().includes(catalogSearch.toLowerCase());
                                        return matchesCat && matchesSearch;
                                    });

                                    if (filtered.length === 0) {
                                        return (
                                            <div className="text-center py-6 text-text-tertiary text-xs">
                                                No standard indicators match the selected filter.
                                            </div>
                                        );
                                    }

                                    return filtered.map(ind => {
                                        const isAdded = testableUnits.some(u => u.id === ind.id);
                                        const catObj = SIGNAL_CATEGORIES.find(c => c.id === ind.category) || { badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
                                        return (
                                            <div key={ind.id} className="p-2.5 rounded-xl border border-border-subtle bg-background-elevated/20 flex items-center justify-between gap-3 hover:border-border-default transition">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-text-primary truncate">{ind.label}</span>
                                                        <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border ${catObj.badgeColor}`}>
                                                            {ind.category}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-text-tertiary truncate mt-0.5">{ind.desc}</p>
                                                </div>
                                                {isAdded ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            removeTestableUnit(ind.id);
                                                            setTestableUnits(getTestableUnits());
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 border border-emerald-500/30 hover:border-rose-500/40 text-[10px] font-bold shrink-0 cursor-pointer transition group/btn flex items-center gap-1 active:scale-95"
                                                        title="Click to remove from testable units grid"
                                                    >
                                                        <Check size={10} className="group-hover/btn:hidden text-emerald-400" />
                                                        <X size={10} className="hidden group-hover/btn:inline text-rose-400" />
                                                        <span className="group-hover/btn:hidden">Added</span>
                                                        <span className="hidden group-hover/btn:inline">Remove</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            addTestableUnit({
                                                                id: ind.id,
                                                                label: ind.label,
                                                                nickname: ind.id.toUpperCase().slice(0, 5),
                                                                desc: ind.desc,
                                                                category: ind.category,
                                                                type: 'INDICATOR',
                                                                iconName: ind.category === 'MOMENTUM' ? 'Activity' : ind.category === 'TREND' ? 'TrendingUp' : ind.category === 'VOLATILITY' ? 'Zap' : ind.category === 'VOLUME' ? 'BarChart2' : 'Layers',
                                                            });
                                                            onChangeConfig(prev => ({ ...prev, unit: ind.id }));
                                                            setTestableUnits(getTestableUnits());
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-white text-[10px] font-bold shrink-0 cursor-pointer shadow-xs transition"
                                                    >
                                                        + Add Unit
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}

                                {addModalMode === 'LAB' && (() => {
                                    const filtered = availableLabIndicators.filter(i => 
                                        !catalogSearch || 
                                        (i.name || '').toLowerCase().includes(catalogSearch.toLowerCase()) || 
                                        (i.nickname || '').toLowerCase().includes(catalogSearch.toLowerCase())
                                    );
                                    if (filtered.length === 0) {
                                        return (
                                            <div className="text-center py-6 text-text-tertiary text-xs">
                                                No custom indicators found. Create one in Strategy Builder or Indicator Lab!
                                            </div>
                                        );
                                    }
                                    return filtered.map(ind => {
                                        const isAdded = testableUnits.some(u => u.id === ind.id || u.indicatorId === ind.id);
                                        return (
                                            <div key={ind.id} className="p-2.5 rounded-xl border border-border-subtle bg-background-elevated/20 flex items-center justify-between gap-3 hover:border-border-default transition">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-text-primary truncate">{ind.name}</span>
                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                                            {ind.nickname || 'CUST'}
                                                        </span>
                                                        {ind.promoted && (
                                                            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                PROMOTED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-text-tertiary truncate mt-0.5">{ind.description || 'Custom Lab quantitative model'}</p>
                                                </div>
                                                {isAdded ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            removeTestableUnit(ind.id);
                                                            setTestableUnits(getTestableUnits());
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 border border-emerald-500/30 hover:border-rose-500/40 text-[10px] font-bold shrink-0 cursor-pointer transition group/btn flex items-center gap-1 active:scale-95"
                                                        title="Click to remove from testable units grid"
                                                    >
                                                        <Check size={10} className="group-hover/btn:hidden text-emerald-400" />
                                                        <X size={10} className="hidden group-hover/btn:inline text-rose-400" />
                                                        <span className="group-hover/btn:hidden">Added</span>
                                                        <span className="hidden group-hover/btn:inline">Remove</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            addTestableUnit(ind);
                                                            onChangeConfig(prev => ({ ...prev, unit: ind.id }));
                                                            setTestableUnits(getTestableUnits());
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-white text-[10px] font-bold shrink-0 cursor-pointer shadow-xs transition"
                                                    >
                                                        + Add Unit
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}

                                {addModalMode === 'STRATEGY' && (() => {
                                    const filtered = availableStrategies.filter(s => 
                                        !catalogSearch || 
                                        (s.name || '').toLowerCase().includes(catalogSearch.toLowerCase())
                                    );
                                    if (filtered.length === 0) {
                                        return (
                                            <div className="text-center py-6 text-text-tertiary text-xs">
                                                No saved strategies found. Create one in Strategy Builder!
                                            </div>
                                        );
                                    }
                                    return filtered.map(strat => {
                                        const isAdded = testableUnits.some(u => u.id === strat.id);
                                        return (
                                            <div key={strat.id} className="p-2.5 rounded-xl border border-border-subtle bg-background-elevated/20 flex items-center justify-between gap-3 hover:border-border-default transition">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-text-primary truncate">{strat.name}</span>
                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                                            {(strat.rules || []).length} RULES
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-text-tertiary truncate mt-0.5">{strat.description || 'Compound multi-factor blueprint'}</p>
                                                </div>
                                                {isAdded ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            removeTestableUnit(strat.id);
                                                            setTestableUnits(getTestableUnits());
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 border border-emerald-500/30 hover:border-rose-500/40 text-[10px] font-bold shrink-0 cursor-pointer transition group/btn flex items-center gap-1 active:scale-95"
                                                        title="Click to remove from testable units grid"
                                                    >
                                                        <Check size={10} className="group-hover/btn:hidden text-emerald-400" />
                                                        <X size={10} className="hidden group-hover/btn:inline text-rose-400" />
                                                        <span className="group-hover/btn:hidden">Added</span>
                                                        <span className="hidden group-hover/btn:inline">Remove</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            addTestableUnit({
                                                                id: strat.id,
                                                                name: strat.name,
                                                                nickname: 'STRAT',
                                                                description: strat.description,
                                                                type: 'STRATEGY',
                                                                rules: strat.rules,
                                                                mode: strat.mode,
                                                            });
                                                            onChangeConfig(prev => ({ ...prev, unit: strat.id }));
                                                            setTestableUnits(getTestableUnits());
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-white text-[10px] font-bold shrink-0 cursor-pointer shadow-xs transition"
                                                    >
                                                        + Add Unit
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}

                                {addModalMode === 'RESTORE' && (() => {
                                    const filtered = removedBuiltins.filter(b => 
                                        !catalogSearch || 
                                        b.label.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                                        b.id.toLowerCase().includes(catalogSearch.toLowerCase())
                                    );
                                    if (filtered.length === 0) {
                                        return (
                                            <div className="text-center py-6 text-text-tertiary text-xs">
                                                All 8 built-in units are currently active in your grid!
                                            </div>
                                        );
                                    }
                                    return filtered.map(b => (
                                        <div key={b.id} className="p-2.5 rounded-xl border border-border-subtle bg-background-elevated/20 flex items-center justify-between gap-3 hover:border-border-default transition">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-text-primary">{b.label}</span>
                                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-background-app text-text-tertiary border border-border-subtle">
                                                        {b.id}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-text-tertiary truncate mt-0.5">{b.desc}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    addTestableUnit(b);
                                                    onChangeConfig(prev => ({ ...prev, unit: b.id }));
                                                    setAddModalMode(null);
                                                }}
                                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shrink-0 cursor-pointer shadow-xs transition"
                                            >
                                                Restore
                                            </button>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Modal Footer */}
                    <div className="px-4 py-2.5 border-t border-border-subtle flex items-center justify-between bg-background-elevated/20">
                        <button
                            type="button"
                            onClick={() => {
                                handleResetUnits();
                                setAddModalMode(null);
                            }}
                            className="text-[10px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
                            title="Reset active units grid to standard 8 built-ins"
                        >
                            <RotateCcw size={11} />
                            <span>Reset to 8 Defaults</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAddModalMode(null); setCatalogSearch(''); setImportError(''); }}
                            className="px-3 py-1 rounded-lg text-xs text-text-tertiary hover:text-text-primary hover:bg-background-elevated transition cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}


        {/* Dynamic Detach & Delete Unit Modal */}
        {unitToDetach && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
                <div className="w-full max-w-sm bg-background-card border border-border-default rounded-2xl shadow-2xl p-4 flex flex-col gap-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                        <div className="flex items-center gap-2 text-rose-400">
                            <AlertTriangle size={16} />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                Detach Unit: {unitToDetach.label}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setUnitToDetach(null)}
                            className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-background-elevated transition cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <p className="text-[11px] text-text-secondary leading-relaxed">
                        Choose how you want to detach <strong className="text-text-primary font-mono">{unitToDetach.label}</strong> ({unitToDetach.nickname}):
                    </p>

                    <div className="flex flex-col gap-2">
                        {/* Option 1: Remove from Grid only */}
                        <button
                            type="button"
                            onClick={() => handleConfirmRemoveOnly(unitToDetach)}
                            className="w-full p-2.5 rounded-xl border border-border-subtle bg-background-app/70 hover:bg-background-elevated text-left transition cursor-pointer flex items-center justify-between group"
                        >
                            <div>
                                <div className="text-xs font-bold text-text-primary group-hover:text-accent-primary transition">
                                    Remove from Grid Only
                                </div>
                                <div className="text-[10px] text-text-tertiary mt-0.5">
                                    Hides unit from this panel. Model code remains safe in your Indicator Lab.
                                </div>
                            </div>
                            <ArrowRight size={14} className="text-text-tertiary group-hover:text-accent-primary group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                        </button>

                        {/* Option 2: Permanently Detach & Delete */}
                        <button
                            type="button"
                            onClick={() => handleConfirmDeletePermanently(unitToDetach)}
                            className="w-full p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-left transition cursor-pointer flex items-center justify-between group"
                        >
                            <div>
                                <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                                    <Trash2 size={12} />
                                    <span>Permanently Detach &amp; Delete</span>
                                </div>
                                <div className="text-[10px] text-rose-300/70 mt-0.5">
                                    Deletes code &amp; struct from entire app and cascade-cleans any strategy rules.
                                </div>
                            </div>
                            <ArrowRight size={14} className="text-rose-400 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                        </button>
                    </div>

                    {/* Backup option */}
                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => exportUnitJson(unitToDetach)}
                            className="text-[10px] font-mono font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1 cursor-pointer"
                        >
                            <Download size={11} /> Download Backup (.json)
                        </button>
                        <button
                            type="button"
                            onClick={() => setUnitToDetach(null)}
                            className="text-xs text-text-tertiary hover:text-text-primary px-2 py-1 rounded-md cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

