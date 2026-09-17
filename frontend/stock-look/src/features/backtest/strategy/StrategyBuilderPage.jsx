/**
 * @file StrategyBuilderPage.jsx
 * @purpose Full-screen institutional Strategy Builder workspace for Praxis.
 * Combines technical indicators, proprietary oscillators, and raw tape data into multi-factor strategies,
 * runs historical simulations, and facilitates TOTP promotion to the Live Chart.
 * @date 2026-09-17
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Sliders, Play, ShieldCheck, Plus, Trash2, Search, Filter, 
    Save, RefreshCw, Layers, Check, AlertCircle, ChevronRight, ChevronDown,
    TrendingUp, Activity, Cpu, Sparkles, Clock, Target, Shield, Lock, PlusCircle, CheckCircle2,
    Download, Upload, Copy, FileText, X, Zap, RotateCcw
} from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { useTheme } from '@/shared/context/ThemeContext';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import Loader from '@/shared/components/ui/Loader';
import DangerActionModal from '@/features/dashboard/settings/ui/DangerActionModal';
import InstrumentSelectorModal from '@/features/trading/ui/InstrumentSelectorModal';
import BacktestHeader from '../ui/BacktestHeader';
import BacktestScorecard from '../ui/BacktestScorecard';
import BacktestEquityCurve from '../ui/BacktestEquityCurve';
import ModelFinetuneCard from '@/shared/components/finetune/ModelFinetuneCard';

import StrategyRuleCard from './StrategyRuleCard';
import { SIGNAL_DEFINITIONS, SIGNAL_CATEGORIES } from './strategySignalDefinitions';
import { runStrategyBacktest } from './strategyEngine';
import { 
    getStrategies, 
    saveStrategy, 
    deleteStrategy, 
    promoteStrategy,
    downloadStrategyJson,
    copyStrategyToClipboard,
    importStrategy,
    subscribeToStrategies
} from './strategyRegistry';
import { 
    getCustomIndicators, 
    promoteCustomIndicator, 
    deleteCustomIndicator, 
    purgeAllCustomIndicators,
    loadSampleTemplates,
    exportIndicatorJson,
    exportAllIndicatorsJson,
    importIndicatorFromJson,
    subscribeToCustomIndicators 
} from '../lab/customIndicatorRegistry';
import CustomIndicatorModal from './CustomIndicatorModal';

const WORKSPACE_STORAGE_KEY = 'praxis_strategy_builder_active_workspace';

const DEFAULT_WORKSPACE = {
    strategyName: 'Momentum Confluence Bull',
    nickname: 'MCB',
    description: 'Combines RSI oversold rebound with MACD acceleration and Volume confirmation.',
    entryDirection: 'LONG',
    volatileTimer: 5,
    strategyMode: 'swing',
    rules: [
        {
            id: 'rule_1',
            indicatorId: 'rsi',
            conditionId: 'rsi_oversold',
            threshold: 30,
            customThreshold: 30,
            params: { period: 14 },
            logic: 'AND',
        },
        {
            id: 'rule_2',
            indicatorId: 'macd',
            conditionId: 'macd_bullish_cross',
            threshold: 0,
            customThreshold: 0,
            params: { fast: 12, slow: 26, signal: 9 },
            logic: 'AND',
        },
        {
            id: 'rule_3',
            indicatorId: 'volume_sma',
            conditionId: 'vol_above_avg',
            threshold: 1.2,
            customThreshold: 1.2,
            params: { period: 20 },
            logic: 'AND',
        }
    ],
    exitRule: {
        type: 'TARGET_STOP',
        targetPct: 2.5,
        stopPct: 1.25,
        trailingStopPct: 1.0,
        horizonBars: 14,
        enableHorizonTimeout: false,
        lockBreakeven: false,
    },
    instrument: 'NSE_INDEX|Nifty 50',
    timeframe: 'day',
    dateRange: 'SINCE_2010',
    activeStrategyId: null,
};

function getSavedWorkspace() {
    try {
        if (typeof localStorage === 'undefined') return DEFAULT_WORKSPACE;
        const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_WORKSPACE,
                ...parsed,
                rules: Array.isArray(parsed.rules) && parsed.rules.length > 0 ? parsed.rules : DEFAULT_WORKSPACE.rules,
                exitRule: { ...DEFAULT_WORKSPACE.exitRule, ...(parsed.exitRule || {}) },
            };
        }
    } catch (e) {
        console.warn('Failed to load saved strategy workspace:', e);
    }
    return DEFAULT_WORKSPACE;
}

export default function StrategyBuilderPage() {
    const navigate = useNavigate();
    const { theme } = useTheme();

    const initialWorkspace = useMemo(() => getSavedWorkspace(), []);

    // 1. Core Strategy State - Continuous Workspace State Persistence
    const [strategyName, setStrategyName] = useState(() => initialWorkspace.strategyName);
    const [nickname, setNickname] = useState(() => initialWorkspace.nickname);
    const [description, setDescription] = useState(() => initialWorkspace.description);
    const [entryDirection, setEntryDirection] = useState(() => initialWorkspace.entryDirection);
    const [volatileTimer, setVolatileTimer] = useState(() => initialWorkspace.volatileTimer);
    const [strategyMode, setStrategyMode] = useState(() => initialWorkspace.strategyMode);
    const [rules, setRules] = useState(() => initialWorkspace.rules);
    const [exitRule, setExitRule] = useState(() => initialWorkspace.exitRule);
    const [instrument, setInstrument] = useState(() => initialWorkspace.instrument);
    const [timeframe, setTimeframe] = useState(() => initialWorkspace.timeframe);
    const [dateRange, setDateRange] = useState(() => initialWorkspace.dateRange);
    const [activeStrategyId, setActiveStrategyId] = useState(() => initialWorkspace.activeStrategyId);

    const AVAILABLE_TIMEFRAMES = [
        { value: '5minute', label: '5M' },
        { value: '15minute', label: '15M' },
        { value: '1hour', label: '1H' },
        { value: 'day', label: 'DAY' },
        { value: 'week', label: '1W' },
    ];

    const MODE_CONFIGS = {
        intraday: {
            label: 'Intraday',
            desc: 'Fast reactive horizon, tight targets & stops',
            targetPct: 0.8,
            stopPct: 0.4,
            horizonBars: 8,
            defaultTimeframe: '15minute',
            timeframeLabel: '15M',
        },
        swing: {
            label: 'Swing',
            desc: 'Balanced multi-day momentum & trend following',
            targetPct: 2.5,
            stopPct: 1.25,
            horizonBars: 14,
            defaultTimeframe: 'day',
            timeframeLabel: 'DAY',
        },
        positional: {
            label: 'Positional',
            desc: 'Macro multi-week regime & trend continuation',
            targetPct: 6.0,
            stopPct: 2.5,
            horizonBars: 28,
            defaultTimeframe: 'day',
            timeframeLabel: 'DAY',
        },
    };

    // 2. Data & Simulation State
    const [candles, setCandles] = useState([]);
    const [loadingCandles, setLoadingCandles] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState(null);

    // 3. Saved Strategies & Promoted Custom Labs
    const [savedStrategies, setSavedStrategies] = useState([]);
    const [isSavedStratDropdownOpen, setIsSavedStratDropdownOpen] = useState(false);
    const savedStratDropdownRef = useRef(null);
    const [promotedLabs, setPromotedLabs] = useState([]);
    const [allCustomIndicators, setAllCustomIndicators] = useState([]);
    const [isCustomLabModalOpen, setIsCustomLabModalOpen] = useState(false);
    const [isClearStrategiesModalOpen, setIsClearStrategiesModalOpen] = useState(false);

    const latestConfigRef = useRef();
    latestConfigRef.current = {
        rules,
        entryDirection,
        exitRule,
        instrument,
        timeframe,
        strategyName,
        nickname,
        allCustomIndicators,
        strategyMode,
        volatileTimer,
    };

    // 3b. Custom Lab Detach & Delete Modal State
    const [labToDelete, setLabToDelete] = useState(null);
    const [isLabDeleteModalOpen, setIsLabDeleteModalOpen] = useState(false);
    const [showDeleteCodePreview, setShowDeleteCodePreview] = useState(false);

    // 3c. Manage Custom Labs Menu State & File Input Ref
    const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
    const labFileInputRef = useRef(null);


    // 4. Palette Search & Category Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false);

    // 5. TOTP Promotion Modal State
    const [isTotpOpen, setIsTotpOpen] = useState(false);
    const [totpError, setTotpError] = useState('');
    const [isPromoting, setIsPromoting] = useState(false);
    const [promotedToast, setPromotedToast] = useState(null);

    // 5b. TOTP Custom Indicator Promotion Modal State
    const [labToApprove, setLabToApprove] = useState(null);
    const [isLabTotpOpen, setIsLabTotpOpen] = useState(false);
    const [labTotpError, setLabTotpError] = useState('');
    const [isLabPromoting, setIsLabPromoting] = useState(false);

    // 5c. AI Model Fine-Tuning Studio Modal State
    const [isFinetuneOpen, setIsFinetuneOpen] = useState(false);

    // 6. Strategy Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importJsonText, setImportJsonText] = useState('');
    const [importError, setImportError] = useState('');
    const fileInputRef = React.useRef(null);

    // Panel collapse toggles
    const [isLeftOpen, setIsLeftOpen] = useState(true);
    const [isRightOpen, setIsRightOpen] = useState(true);

    // Load initial strategies and custom labs
    useEffect(() => {
        setSavedStrategies(getStrategies());
        const allLabs = getCustomIndicators();
        setAllCustomIndicators(allLabs);
        setPromotedLabs(allLabs.filter(i => i.promoted));

        const unsub = subscribeToCustomIndicators((updated) => {
            setAllCustomIndicators(updated);
            setPromotedLabs(updated.filter(i => i.promoted));
            // Automatically purge any rule referencing a deleted indicator
            setRules(prev => prev.filter(r => {
                if (SIGNAL_DEFINITIONS[r.indicatorId]) return true;
                return updated.some(lab => lab.id === r.indicatorId);
            }));
        });
        const unsubStrat = subscribeToStrategies((updated) => {
            setSavedStrategies(updated);
        });
        return () => {
            if (typeof unsub === 'function') unsub();
            if (typeof unsubStrat === 'function') unsubStrat();
        };
    }, []);

    // Close saved strategies dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (savedStratDropdownRef.current && !savedStratDropdownRef.current.contains(event.target)) {
                setIsSavedStratDropdownOpen(false);
            }
        }
        if (isSavedStratDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSavedStratDropdownOpen]);

    // ── Continuous Workspace State Persistence (never revert user changes) ──
    useEffect(() => {
        try {
            const snapshot = {
                strategyName,
                nickname,
                description,
                entryDirection,
                volatileTimer,
                strategyMode,
                rules,
                exitRule,
                instrument,
                timeframe,
                dateRange,
                activeStrategyId,
            };
            localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(snapshot));
        } catch (e) {
            console.error('Failed to persist workspace state:', e);
        }
    }, [strategyName, nickname, description, entryDirection, volatileTimer, strategyMode, rules, exitRule, instrument, timeframe, dateRange, activeStrategyId]);

    const handleResetWorkspaceToDefault = () => {
        if (window.confirm("Reset strategy blueprint to factory defaults? Your custom parameters will be cleared.")) {
            setStrategyName(DEFAULT_WORKSPACE.strategyName);
            setNickname(DEFAULT_WORKSPACE.nickname);
            setDescription(DEFAULT_WORKSPACE.description);
            setEntryDirection(DEFAULT_WORKSPACE.entryDirection);
            setVolatileTimer(DEFAULT_WORKSPACE.volatileTimer);
            setStrategyMode(DEFAULT_WORKSPACE.strategyMode);
            setRules(DEFAULT_WORKSPACE.rules);
            setExitRule(DEFAULT_WORKSPACE.exitRule);
            setInstrument(DEFAULT_WORKSPACE.instrument);
            setTimeframe(DEFAULT_WORKSPACE.timeframe);
            setDateRange(DEFAULT_WORKSPACE.dateRange);
            setActiveStrategyId(null);
            try {
                localStorage.removeItem(WORKSPACE_STORAGE_KEY);
            } catch (e) {}
            setPromotedToast("Workspace reset to default factory blueprint.");
            setTimeout(() => setPromotedToast(null), 3000);
        }
    };

    const handleOpenApproveLabModal = (lab) => {
        setLabToApprove(lab);
        setLabTotpError('');
        setIsLabTotpOpen(true);
    };

    const handleConfirmLabPromotion = ({ totp }) => {
        setIsLabPromoting(true);
        setLabTotpError('');

        setTimeout(() => {
            if (!/^\d{6}$/.test(totp)) {
                setLabTotpError('Invalid 6-digit TOTP authenticator code.');
                setIsLabPromoting(false);
                return;
            }

            if (labToApprove) {
                promoteCustomIndicator(labToApprove.id);
                const allLabs = getCustomIndicators();
                setAllCustomIndicators(allLabs);
                setPromotedLabs(allLabs.filter(i => i.promoted));
                setIsLabTotpOpen(false);
                setPromotedToast(`Indicator "${labToApprove.name}" is now approved & promoted to LIVE status.`);
                setTimeout(() => setPromotedToast(null), 5000);
            }
            setIsLabPromoting(false);
        }, 250);
    };

    const handlePromptDeleteLab = (lab) => {
        setLabToDelete(lab);
        setShowDeleteCodePreview(false);
        setIsLabDeleteModalOpen(true);
    };

    const handleConfirmDeleteLab = () => {
        if (!labToDelete) return;
        const labId = labToDelete.id;
        deleteCustomIndicator(labId);
        const allLabs = getCustomIndicators();
        setAllCustomIndicators(allLabs);
        setPromotedLabs(allLabs.filter(i => i.promoted));
        const nextRules = rules.filter(r => r.indicatorId !== labId);
        setRules(nextRules);

        setIsLabDeleteModalOpen(false);
        setLabToDelete(null);
        setPromotedToast(`Detached & permanently purged "${labToDelete.name}" [${labToDelete.nickname}] with all code & data.`);
        setTimeout(() => setPromotedToast(null), 4500);

        // Auto-refresh simulation
        if (candles && candles.length >= 30) {
            setIsSimulating(true);
            setTimeout(() => {
                const res = runStrategyBacktest(candles, {
                    rules: nextRules,
                    entryDirection,
                    exitRule,
                    instrument,
                    timeframe,
                    name: strategyName,
                    nickname,
                    customLabModels: allLabs,
                    mode: strategyMode,
                });
                setSimulationResult(res);
                setIsSimulating(false);
            }, 60);
        }
    };

    const handleImportLabFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const imported = importIndicatorFromJson(text);
                if (imported) {
                    const allLabs = getCustomIndicators();
                    setAllCustomIndicators(allLabs);
                    setPromotedLabs(allLabs.filter(i => i.promoted));
                    setPromotedToast(`Attached custom indicator "${imported.name}" [${imported.nickname}].`);
                    setTimeout(() => setPromotedToast(null), 4500);
                }
            } catch (err) {
                setPromotedToast(`Import failed: ${err.message}`);
                setTimeout(() => setPromotedToast(null), 4500);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // ── Fetch Historical Candles on instrument / timeframe change ──
    const fetchCandles = useCallback(async (inst, tf, range) => {
        setLoadingCandles(true);
        setFetchError(null);
        try {
            let fromDate = null;
            if (tf === 'day') {
                if (range === 'SINCE_2010') fromDate = '2010-01-01';
                else if (range === 'SINCE_2015') fromDate = '2015-01-01';
                else if (range === 'SINCE_2020') fromDate = '2020-01-01';
                else if (range === 'ALL_TIME') fromDate = '2000-01-01';
                else if (range === 'LAST_2_YEARS' || range === '2Y') {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() - 2);
                    fromDate = d.toISOString().split('T')[0];
                }
            }

            const res = await axiosInstance.get('/api/v1/upstox/candles', {
                params: {
                    instrument: inst,
                    timeframe: tf,
                    fromDate,
                    limit: 25000,
                }
            });

            if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                setCandles(res.data.data);
                return res.data.data;
            } else {
                setCandles([]);
                setSimulationResult(null);
                setFetchError(`No historical candles available for ${inst} (${tf}).`);
                return [];
            }
        } catch (err) {
            setCandles([]);
            setSimulationResult(null);
            setFetchError(`Candle sync failed: ${err.message}`);
            return [];
        } finally {
            setLoadingCandles(false);
        }
    }, []);

    const handleSelectMode = (newMode) => {
        setStrategyMode(newMode);
        const cfg = MODE_CONFIGS[newMode];
        let nextExitRule = exitRule;
        if (cfg) {
            nextExitRule = {
                ...exitRule,
                targetPct: cfg.targetPct,
                stopPct: cfg.stopPct,
                horizonBars: cfg.horizonBars,
            };
            setExitRule(nextExitRule);
        }

        const targetTf = cfg?.defaultTimeframe || 'day';

        // Keep latestConfigRef synchronized immediately
        latestConfigRef.current = {
            ...latestConfigRef.current,
            strategyMode: newMode,
            exitRule: nextExitRule,
            timeframe: targetTf,
        };

        if (targetTf !== timeframe) {
            setTimeframe(targetTf);
            // Changing timeframe triggers useEffect([instrument, timeframe, dateRange]), which fetches candles and executes backtest!
        } else if (candles && candles.length >= 30) {
            setIsSimulating(true);
            setTimeout(() => {
                try {
                    const res = runStrategyBacktest(candles, {
                        rules,
                        entryDirection,
                        exitRule: nextExitRule,
                        instrument,
                        timeframe: targetTf,
                        name: strategyName,
                        nickname,
                        customLabModels: allCustomIndicators,
                        mode: newMode,
                        volatileTimer: Number(volatileTimer) || 5,
                    });
                    setSimulationResult(res);
                } catch (e) {
                    console.error('Mode switch simulation error:', e);
                } finally {
                    setIsSimulating(false);
                }
            }, 80);
        }
    };

    const handleSelectTimeframe = (newTf) => {
        if (newTf === timeframe) return;
        latestConfigRef.current = {
            ...latestConfigRef.current,
            timeframe: newTf,
        };
        setTimeframe(newTf);
    };

    useEffect(() => {
        fetchCandles(instrument, timeframe, dateRange).then((data) => {
            if (data && data.length >= 30) {
                const cfg = latestConfigRef.current || {};
                try {
                    const res = runStrategyBacktest(data, {
                        rules: cfg.rules || rules,
                        entryDirection: cfg.entryDirection || entryDirection,
                        exitRule: cfg.exitRule || exitRule,
                        instrument: cfg.instrument || instrument,
                        timeframe: cfg.timeframe || timeframe,
                        name: cfg.strategyName || strategyName,
                        nickname: cfg.nickname || nickname,
                        customLabModels: cfg.allCustomIndicators || allCustomIndicators,
                        mode: cfg.strategyMode || strategyMode,
                        volatileTimer: Number(cfg.volatileTimer || volatileTimer) || 5,
                    });
                    setSimulationResult(res);
                } catch (e) {
                    console.error('Candle load simulation error:', e);
                }
            }
        });
    }, [instrument, timeframe, dateRange]);

    // Run Strategy Backtest Handler
    const handleRunSimulation = useCallback(() => {
        if (!candles || candles.length < 30) {
            setPromotedToast("Insufficient historical bars loaded to run simulation.");
            setTimeout(() => setPromotedToast(null), 3000);
            return;
        }
        setIsSimulating(true);

        setTimeout(() => {
            try {
                const res = runStrategyBacktest(candles, {
                    rules,
                    entryDirection,
                    exitRule,
                    instrument,
                    timeframe,
                    name: strategyName,
                    nickname,
                    customLabModels: allCustomIndicators,
                    mode: strategyMode,
                    volatileTimer: Number(volatileTimer) || 5,
                });
                setSimulationResult(res);
                setIsSimulating(false);

                if (res?.summary) {
                    if (res.summary.totalTrades > 0) {
                        setPromotedToast(`Confluence Backtest complete: ${res.summary.totalTrades} trades generated.`);
                    } else {
                        setPromotedToast(`Backtest executed across ${candles.length} bars: 0 trades met the strict criteria.`);
                    }
                    setTimeout(() => setPromotedToast(null), 4000);
                }

                // Auto-save strategy draft
                const draft = {
                    id: activeStrategyId || undefined,
                    name: strategyName,
                    nickname,
                    description,
                    entryDirection,
                    volatileTimer: Number(volatileTimer),
                    rules,
                    exitRule,
                    instrument,
                    timeframe,
                    mode: strategyMode,
                    backtestSummary: res.summary,
                };
                const updated = saveStrategy(draft);
                setSavedStrategies(updated);
                const match = updated.find(s => s.name === draft.name);
                if (match) setActiveStrategyId(match.id);
            } catch (err) {
                console.error("Backtest simulation error:", err);
                setIsSimulating(false);
                setPromotedToast(`Simulation error: ${err.message}`);
                setTimeout(() => setPromotedToast(null), 4000);
            }
        }, 200);
    }, [candles, rules, entryDirection, exitRule, instrument, timeframe, strategyName, nickname, description, volatileTimer, activeStrategyId, strategyMode, allCustomIndicators]);

    // Rule Management Handlers
    const handleAddRuleFromPalette = (indicatorIdOrObj) => {
        const indicatorId = typeof indicatorIdOrObj === 'string' ? indicatorIdOrObj : indicatorIdOrObj?.id;
        if (!indicatorId) return;

        // Strict duplicate rule prevention
        if (rules.some(r => r.indicatorId === indicatorId)) {
            setPromotedToast("Indicator is already active in strategy rules.");
            setTimeout(() => setPromotedToast(null), 3000);
            return;
        }

        const def = SIGNAL_DEFINITIONS[indicatorId];
        const labMatch = (allCustomIndicators || []).find(l => l.id === indicatorId) || (typeof indicatorIdOrObj === 'object' ? indicatorIdOrObj : null);

        let conditionId = '';
        let defaultThresh = 30;
        let defaultParams = {};

        if (def) {
            const firstCond = def.presetConditions?.[0];
            conditionId = firstCond?.id || '';
            defaultThresh = firstCond?.thresholdConfig?.defaultThreshold ?? firstCond?.defaultThreshold ?? 30;
            defaultParams = def.defaultParams ? { ...def.defaultParams } : {};
        } else if (labMatch) {
            const firstBakedRule = labMatch.rules?.[0];
            conditionId = firstBakedRule?.id || 'lab_cross_above';
            defaultThresh = labMatch.modes?.[strategyMode]?.threshold ?? labMatch.signalConfig?.crossAbove ?? 0;
        }

        const newRule = {
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            indicatorId,
            indicatorLabel: labMatch?.name || def?.label || indicatorId,
            conditionId,
            threshold: defaultThresh,
            customThreshold: defaultThresh,
            params: defaultParams,
            logic: 'AND',
        };
        const nextRules = [...rules, newRule];
        setRules(nextRules);

        // Auto-run simulation immediately when rule is added
        if (candles && candles.length >= 30) {
            setIsSimulating(true);
            setTimeout(() => {
                try {
                    const res = runStrategyBacktest(candles, {
                        rules: nextRules,
                        entryDirection,
                        exitRule,
                        instrument,
                        timeframe,
                        name: strategyName,
                        nickname,
                        customLabModels: allCustomIndicators,
                        mode: strategyMode,
                        volatileTimer: Number(volatileTimer) || 5,
                    });
                    setSimulationResult(res);
                } catch (e) {
                    console.error('Add rule simulation error:', e);
                } finally {
                    setIsSimulating(false);
                }
            }, 60);
        }
    };

    const handleUpdateRule = (ruleId, updatedRule) => {
        setRules(prev => prev.map(r => r.id === ruleId ? updatedRule : r));
    };

    const handleRemoveRule = (ruleId) => {
        const nextRules = rules.filter(r => r.id !== ruleId);
        setRules(nextRules);

        // Auto-run simulation immediately on removal
        if (candles && candles.length >= 30) {
            setIsSimulating(true);
            setTimeout(() => {
                try {
                    const res = runStrategyBacktest(candles, {
                        rules: nextRules,
                        entryDirection,
                        exitRule,
                        instrument,
                        timeframe,
                        name: strategyName,
                        nickname,
                        customLabModels: allCustomIndicators,
                        mode: strategyMode,
                        volatileTimer: Number(volatileTimer) || 5,
                    });
                    setSimulationResult(res);
                } catch (e) {
                    console.error('Remove rule simulation error:', e);
                } finally {
                    setIsSimulating(false);
                }
            }, 60);
        }
    };

    const handleToggleRuleFromPalette = (indicatorIdOrObj) => {
        const indicatorId = typeof indicatorIdOrObj === 'string' ? indicatorIdOrObj : indicatorIdOrObj?.id;
        if (!indicatorId) return;

        const existingRule = rules.find(r => r.indicatorId === indicatorId);
        if (existingRule) {
            handleRemoveRule(existingRule.id);
            setPromotedToast(`Removed "${existingRule.indicatorLabel || indicatorId}" from strategy rules.`);
            setTimeout(() => setPromotedToast(null), 2500);
        } else {
            handleAddRuleFromPalette(indicatorIdOrObj);
        }
    };

    // TOTP Promotion Handler
    const handleConfirmPromotion = ({ totp }) => {
        setIsPromoting(true);
        setTotpError('');

        setTimeout(() => {
            if (!/^\d{6}$/.test(totp)) {
                setTotpError('Invalid 6-digit TOTP authenticator code.');
                setIsPromoting(false);
                return;
            }

            if (activeStrategyId) {
                const target = promoteStrategy(activeStrategyId);
                setSavedStrategies(getStrategies());
                setIsTotpOpen(false);
                setPromotedToast(`Strategy "${strategyName}" is now active in Live Chart Strategies drawer.`);
                setTimeout(() => setPromotedToast(null), 6000);
            }
            setIsPromoting(false);
        }, 300);
    };

    // ── Strategy Blueprint Export & Import Handlers ──
    const handleExportStrategy = () => {
        const currentStrat = {
            id: activeStrategyId,
            name: strategyName,
            nickname,
            description,
            entryDirection,
            volatileTimer: Number(volatileTimer),
            rules,
            exitRule,
            instrument,
            timeframe,
            mode: strategyMode,
        };
        try {
            downloadStrategyJson(currentStrat);
            setPromotedToast(`Exported "${strategyName}" blueprint (.json)`);
            setTimeout(() => setPromotedToast(null), 4000);
        } catch (err) {
            setPromotedToast(`Export failed: ${err.message}`);
            setTimeout(() => setPromotedToast(null), 4000);
        }
    };

    const handleCopyStrategyJson = async () => {
        const currentStrat = {
            id: activeStrategyId,
            name: strategyName,
            nickname,
            description,
            entryDirection,
            volatileTimer: Number(volatileTimer),
            rules,
            exitRule,
            instrument,
            timeframe,
            mode: strategyMode,
        };
        try {
            await copyStrategyToClipboard(currentStrat);
            setPromotedToast(`Copied "${strategyName}" blueprint JSON to clipboard`);
            setTimeout(() => setPromotedToast(null), 4000);
        } catch (err) {
            setPromotedToast(`Copy failed: ${err.message}`);
            setTimeout(() => setPromotedToast(null), 4000);
        }
    };

    const handleImportStrategyData = (rawJsonOrObj) => {
        try {
            const imported = importStrategy(rawJsonOrObj);
            setActiveStrategyId(imported.id);
            setStrategyName(imported.name);
            setNickname(imported.nickname);
            setDescription(imported.description || '');
            setEntryDirection(imported.entryDirection || 'LONG');
            setVolatileTimer(imported.volatileTimer || 5);
            setRules(imported.rules || []);
            if (imported.mode) setStrategyMode(imported.mode);
            if (imported.exitRule) setExitRule(imported.exitRule);

            setSavedStrategies(getStrategies());
            setPromotedToast(`Strategy "${imported.name}" loaded into workspace!`);
            setTimeout(() => setPromotedToast(null), 5000);

            // Trigger immediate simulation if candles exist
            if (candles && candles.length >= 30) {
                setIsSimulating(true);
                setTimeout(() => {
                    const res = runStrategyBacktest(candles, {
                        rules: imported.rules,
                        entryDirection: imported.entryDirection,
                        exitRule: imported.exitRule,
                        instrument,
                        timeframe,
                        name: imported.name,
                        nickname: imported.nickname,
                        customLabModels: allCustomIndicators,
                        mode: imported.mode || strategyMode,
                    });
                    setSimulationResult(res);
                    setIsSimulating(false);
                }, 100);
            }
        } catch (err) {
            throw err;
        }
    };

    const handleFileImport = (e) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result;
                handleImportStrategyData(content);
                setIsImportModalOpen(false);
                setImportError('');
            } catch (err) {
                setImportError(`File parse failed: ${err.message}`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handlePasteImportSubmit = () => {
        try {
            handleImportStrategyData(importJsonText.trim());
            setIsImportModalOpen(false);
            setImportError('');
            setImportJsonText('');
        } catch (err) {
            setImportError(`Import failed: ${err.message}`);
        }
    };

    // Filter Palette Indicators
    const filteredPalette = useMemo(() => {
        if (selectedCategory === 'CUSTOM_LAB') return [];
        let list = Object.values(SIGNAL_DEFINITIONS);
        if (selectedCategory !== 'ALL') {
            list = list.filter(i => i.category === selectedCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(i => i.label.toLowerCase().includes(q) || i.desc?.toLowerCase().includes(q));
        }
        return list;
    }, [selectedCategory, searchQuery]);

    const filteredCustomModels = useMemo(() => {
        if (selectedCategory !== 'ALL' && selectedCategory !== 'CUSTOM_LAB') return [];
        if (!searchQuery.trim()) return allCustomIndicators;
        const q = searchQuery.toLowerCase();
        return allCustomIndicators.filter(i => 
            i.name?.toLowerCase().includes(q) || 
            i.description?.toLowerCase().includes(q) || 
            i.nickname?.toLowerCase().includes(q)
        );
    }, [allCustomIndicators, selectedCategory, searchQuery]);

    const instrumentLabel = useMemo(() => {
        const all = [...(FO_INDICES || []), ...(FO_EQUITIES || [])];
        const match = all.find(i => i.value === instrument);
        return match ? match.label : (instrument.split('|')[1] || instrument);
    }, [instrument]);

    const candleSpan = useMemo(() => {
        if (!candles || candles.length === 0) return null;
        const first = candles[0];
        const last = candles[candles.length - 1];

        const formatDate = (t) => {
            if (!t) return '';
            const d = typeof t === 'string' ? new Date(t) : new Date(t * (t < 10000000000 ? 1000 : 1));
            if (isNaN(d.getTime())) return String(t);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        const uniqueDays = new Set(candles.map(c => {
            if (!c.time) return null;
            if (typeof c.time === 'string') return c.time.slice(0, 10);
            const d = new Date(c.time * (c.time < 10000000000 ? 1000 : 1));
            return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
        }).filter(Boolean)).size;

        const firstStr = formatDate(first.time);
        const lastStr = formatDate(last.time);

        return {
            tradingDays: uniqueDays,
            firstStr,
            lastStr,
            compact: `${candles.length.toLocaleString()} bars • ${uniqueDays} days`,
            full: `${candles.length.toLocaleString()} bars • ${uniqueDays} trading days • ${firstStr} – ${lastStr}`
        };
    }, [candles]);

    return (
        <div className="w-full max-w-[100vw] h-screen flex flex-col bg-background-app text-text-primary overflow-hidden font-sans select-none">
            {/* 1. Header */}
            <BacktestHeader
                instrumentLabel={instrumentLabel}
                timeframe={timeframe}
                tradingMode="strategy"
                walkForwardEnabled={true}
                activeUnit="STRATEGY_BUILDER"
                dateSpan={candleSpan ? `${candles.length.toLocaleString()} bars • ${candleSpan.tradingDays} days (${candleSpan.firstStr} – ${candleSpan.lastStr})` : null}
                onExit={() => navigate('/dashboard/home')}
                isSimulating={isSimulating}
                isLeftOpen={isLeftOpen}
                isRightOpen={isRightOpen}
                onToggleLeft={() => setIsLeftOpen(p => !p)}
                onToggleRight={() => setIsRightOpen(p => !p)}
                onOpenFinetune={() => setIsFinetuneOpen(true)}
            />

            {/* Floating Toast Notification */}
            {promotedToast && (
                <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background-card/95 border border-emerald-500/50 text-text-primary shadow-2xl shadow-emerald-950/40 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <Check size={18} />
                    </div>
                    <div className="text-xs font-bold text-text-primary">
                        {promotedToast}
                    </div>
                </div>
            )}

            {/* 2. Main 3-Column Workspace */}
            <div className="flex-1 min-w-0 max-w-full w-full flex overflow-hidden relative">
                {/* ── LEFT COLUMN: Signal Palette (300px) ── */}
                {isLeftOpen && (
                    <aside className="w-[310px] flex-shrink-0 bg-background-card border-r border-border-subtle h-full overflow-y-auto p-3 flex flex-col gap-3 text-xs custom-scrollbar">
                        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                            <div className="flex items-center gap-2">
                                <Layers size={14} className="text-accent-primary" />
                                <span className="font-bold text-text-primary uppercase tracking-wider text-xs font-mono">
                                    Signal Palette
                                </span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.2 bg-background-surface rounded border border-border-subtle font-mono text-text-tertiary">
                                {Object.keys(SIGNAL_DEFINITIONS).length + allCustomIndicators.length} Sources
                            </span>
                        </div>

                        {/* Custom Indicator Studio Action Button */}
                        <button
                            type="button"
                            onClick={() => setIsCustomLabModalOpen(true)}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-500/10 hover:from-orange-500/30 hover:to-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                        >
                            <PlusCircle size={13} className="text-orange-400" />
                            <span>+ Custom Indicator Studio</span>
                        </button>

                        {/* Search Input */}
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search indicators..."
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background-surface border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-hidden"
                            />
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('ALL')}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 transition cursor-pointer ${
                                    selectedCategory === 'ALL'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-background-surface text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                All
                            </button>
                            {SIGNAL_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 transition cursor-pointer ${
                                        selectedCategory === cat.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-background-surface text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Palette List */}
                        <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-0.5">
                            {filteredPalette.map(ind => {
                                const isAdded = rules.some(r => r.indicatorId === ind.id);
                                return (
                                    <div
                                        key={ind.id}
                                        className="p-2 rounded-xl bg-background-surface/60 hover:bg-background-surface border border-border-subtle flex items-center justify-between gap-2 group transition-all"
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-text-primary text-[11px] truncate">
                                                {ind.label}
                                            </span>
                                            <span className="text-[9px] text-text-tertiary truncate">
                                                {ind.desc}
                                            </span>
                                        </div>
                                        {isAdded ? (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleRuleFromPalette(ind.id)}
                                                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 border border-emerald-500/30 hover:border-rose-500/40 font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer transition-all group/btn active:scale-95"
                                                title="Click to remove indicator from strategy rules"
                                            >
                                                <Check size={11} className="group-hover/btn:hidden text-emerald-400" />
                                                <X size={11} className="hidden group-hover/btn:inline text-rose-400" />
                                                <span className="group-hover/btn:hidden">Added</span>
                                                <span className="hidden group-hover/btn:inline">Remove</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleRuleFromPalette(ind.id)}
                                                className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white font-bold text-[10px] border border-blue-500/30 transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                                                title="Add indicator to strategy"
                                            >
                                                <Plus size={11} />
                                                <span>Add</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Custom Lab Models Section */}
                            {(selectedCategory === 'ALL' || selectedCategory === 'CUSTOM_LAB') && (
                                <div className="pt-2 border-t border-border-subtle/60 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                                            <Sparkles size={11} />
                                            Custom Lab Models ({filteredCustomModels.length})
                                        </span>

                                        {/* Manage Menu Popover */}
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsManageMenuOpen(prev => !prev)}
                                                className="text-[9px] px-2 py-0.5 rounded-md bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 border border-orange-500/30 transition cursor-pointer"
                                            >
                                                <span>Manage</span>
                                                <ChevronDown size={10} className={isManageMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                            </button>

                                            {isManageMenuOpen && (
                                                <div className="absolute right-0 top-full mt-1.5 w-52 p-1.5 rounded-xl bg-background-card border border-border-subtle shadow-2xl z-50 space-y-1 text-xs animate-in fade-in zoom-in-95">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsManageMenuOpen(false);
                                                            labFileInputRef.current?.click();
                                                        }}
                                                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-background-surface text-text-primary flex items-center gap-2 transition cursor-pointer"
                                                    >
                                                        <Upload size={12} className="text-blue-400" />
                                                        <span>Import Struct (.json)</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsManageMenuOpen(false);
                                                            exportAllIndicatorsJson();
                                                            setPromotedToast("Exported all custom models (.json bundle)");
                                                            setTimeout(() => setPromotedToast(null), 4000);
                                                        }}
                                                        disabled={allCustomIndicators.length === 0}
                                                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-background-surface text-text-primary flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <Download size={12} className="text-emerald-400" />
                                                        <span>Export All Models (.json)</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsManageMenuOpen(false);
                                                            const updated = loadSampleTemplates();
                                                            setAllCustomIndicators(updated);
                                                            setPromotedToast("Loaded 5 sample starter templates as drafts.");
                                                            setTimeout(() => setPromotedToast(null), 4000);
                                                        }}
                                                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-background-surface text-text-primary flex items-center gap-2 transition cursor-pointer"
                                                    >
                                                        <Sparkles size={12} className="text-amber-400" />
                                                        <span>Load 5 Sample Templates</span>
                                                    </button>
                                                    <div className="border-t border-border-subtle/60 my-1" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsManageMenuOpen(false);
                                                            if (window.confirm("Purge all unpromoted draft models? Promoted LIVE models will be kept.")) {
                                                                const remaining = purgeAllCustomIndicators({ draftsOnly: true });
                                                                setAllCustomIndicators(remaining);
                                                                setPromotedLabs(remaining.filter(i => i.promoted));
                                                                setRules(prev => prev.filter(r => Boolean(SIGNAL_DEFINITIONS[r.indicatorId]) || remaining.some(l => l.id === r.indicatorId)));
                                                                setPromotedToast("Purged all draft models.");
                                                                setTimeout(() => setPromotedToast(null), 4000);
                                                            }
                                                        }}
                                                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 transition cursor-pointer"
                                                    >
                                                        <Trash2 size={12} />
                                                        <span>Purge All Draft Models</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsManageMenuOpen(false);
                                                            if (window.confirm("Permanently wipe ALL custom models and detach all associated rules?")) {
                                                                purgeAllCustomIndicators({ draftsOnly: false });
                                                                setAllCustomIndicators([]);
                                                                setPromotedLabs([]);
                                                                setRules(prev => prev.filter(r => Boolean(SIGNAL_DEFINITIONS[r.indicatorId])));
                                                                setPromotedToast("Wiped all custom models. Clean slate active.");
                                                                setTimeout(() => setPromotedToast(null), 4000);
                                                            }
                                                        }}
                                                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 font-semibold flex items-center gap-2 transition cursor-pointer"
                                                    >
                                                        <Trash2 size={12} />
                                                        <span>Purge ALL Custom Models</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hidden File Input for .json struct import */}
                                    <input
                                        type="file"
                                        ref={labFileInputRef}
                                        accept=".json,.js"
                                        className="hidden"
                                        onChange={handleImportLabFile}
                                    />

                                    {filteredCustomModels.length === 0 ? (
                                        <div className="p-3 rounded-xl bg-orange-500/5 border border-dashed border-orange-500/20 text-center space-y-2">
                                            <div>
                                                <p className="text-[11px] font-semibold text-text-secondary">No Custom Lab Models Active</p>
                                                <p className="text-[9px] text-text-tertiary">Author an indicator in Studio or import a .json struct.</p>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCustomLabModalOpen(true)}
                                                    className="px-2 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-white text-[10px] font-bold border border-orange-500/40 transition cursor-pointer"
                                                >
                                                    + Studio
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => labFileInputRef.current?.click()}
                                                    className="px-2 py-1 rounded-lg bg-background-surface hover:bg-background-surface/80 text-text-secondary hover:text-text-primary text-[10px] font-bold border border-border-subtle transition cursor-pointer"
                                                >
                                                    📥 Import
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = loadSampleTemplates();
                                                        setAllCustomIndicators(updated);
                                                        setPromotedToast("Loaded 5 sample starter templates as drafts.");
                                                        setTimeout(() => setPromotedToast(null), 4000);
                                                    }}
                                                    className="px-2 py-1 rounded-lg bg-background-surface hover:bg-background-surface/80 text-text-secondary hover:text-text-primary text-[10px] font-bold border border-border-subtle transition cursor-pointer"
                                                >
                                                    ✨ 5 Samples
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        filteredCustomModels.map(lab => {
                                            const isAdded = rules.some(r => r.indicatorId === lab.id);
                                            return (
                                                <div
                                                    key={lab.id}
                                                    className="p-2 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20 flex items-center justify-between gap-2 transition-all"
                                                >
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <span className="font-semibold text-orange-300 text-[11px] truncate">
                                                                {lab.name}
                                                            </span>
                                                            {lab.promoted ? (
                                                                <span className="px-1 py-0.2 text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold uppercase shrink-0">
                                                                    LIVE
                                                                </span>
                                                            ) : (
                                                                <span className="px-1 py-0.2 text-[8px] bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded font-bold uppercase shrink-0">
                                                                    DRAFT
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[9px] text-text-tertiary font-mono truncate">
                                                            [{lab.nickname}] {lab.description}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {/* Add / Added Button - enabled for BOTH draft & live models */}
                                                        {isAdded ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleRuleFromPalette(lab.id)}
                                                                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 border border-emerald-500/30 hover:border-rose-500/40 font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer transition-all group/btn active:scale-95"
                                                                title="Click to remove custom model from strategy rules"
                                                            >
                                                                <Check size={11} className="group-hover/btn:hidden text-emerald-400" />
                                                                <X size={11} className="hidden group-hover/btn:inline text-rose-400" />
                                                                <span className="group-hover/btn:hidden">Added</span>
                                                                <span className="hidden group-hover/btn:inline">Remove</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleRuleFromPalette(lab.id)}
                                                                className="px-2 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-white font-bold text-[10px] border border-orange-500/40 transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                                                                title={lab.promoted ? "Add Rule to Active Strategy" : "Add Draft Model to Strategy to Test"}
                                                            >
                                                                <Plus size={11} />
                                                                <span>Add</span>
                                                            </button>
                                                        )}

                                                        {/* Approve Button with 6-digit TOTP for draft models */}
                                                        {!lab.promoted && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenApproveLabModal(lab)}
                                                                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white font-bold text-[10px] border border-emerald-500/40 transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                                                                title="Authorize & Promote Model to LIVE status via 6-digit TOTP"
                                                            >
                                                                <ShieldCheck size={11} />
                                                                <span>Approve</span>
                                                            </button>
                                                        )}

                                                        {/* Detach & Delete trigger */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePromptDeleteLab(lab)}
                                                            className="p-1 rounded-lg text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                            title="Detach & Permanently Remove Model with Code and Rules"
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                )}

                {/* ── CENTER COLUMN: Strategy Canvas & Rules ── */}
                <main className="flex-1 min-w-0 bg-background-app overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                    {/* Strategy Metadata Card - Institutional Command Hub */}
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-background-card via-background-card to-background-surface/80 border border-border-subtle shadow-md space-y-3.5">
                        {/* Header & Saved Preset Switcher */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle/50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary">
                                    <Sliders size={13} />
                                </div>
                                <div>
                                    <span className="font-bold text-xs uppercase tracking-wider text-text-primary font-mono block">
                                        Strategy Blueprint & Parameters
                                    </span>
                                    <span className="text-[10px] text-text-tertiary">
                                        Real-time multi-factor execution and risk architecture
                                    </span>
                                </div>
                            </div>

                            {/* Saved Strategies Quick Switch & Export / Import Controls */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {savedStrategies.length > 0 && (
                                    <div ref={savedStratDropdownRef} className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsSavedStratDropdownOpen(prev => !prev)}
                                            className="flex items-center gap-2 bg-background-surface/80 hover:bg-background-elevated px-2.5 py-1 rounded-xl border border-border-subtle hover:border-border-default transition-all shadow-xs cursor-pointer group select-none"
                                        >
                                            <span className="text-[10px] uppercase font-mono font-bold text-text-tertiary">Saved:</span>
                                            <span className="text-[11px] font-semibold text-text-primary max-w-[180px] md:max-w-[220px] truncate text-left">
                                                {savedStrategies.find(s => s.id === activeStrategyId || (!activeStrategyId && s.name === strategyName))?.name || 'Select Strategy Blueprint...'}
                                            </span>
                                            {savedStrategies.find(s => s.id === activeStrategyId || (!activeStrategyId && s.name === strategyName))?.promoted && (
                                                <span className="text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded shrink-0">
                                                    LIVE
                                                </span>
                                            )}
                                            <ChevronDown 
                                                size={13} 
                                                className={`text-text-tertiary transition-transform duration-200 shrink-0 ${isSavedStratDropdownOpen ? 'rotate-180 text-blue-400' : 'group-hover:text-text-primary'}`} 
                                            />
                                        </button>

                                        {isSavedStratDropdownOpen && (
                                            <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[260px] max-w-[340px] bg-background-tooltip border border-border-default rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
                                                <div className="px-3 py-2 border-b border-border-subtle/60 flex items-center justify-between text-[10px] font-mono font-bold text-text-tertiary uppercase tracking-wider">
                                                    <span>Strategy Blueprints</span>
                                                    <span className="bg-background-surface px-1.5 py-0.5 rounded text-[9px] text-text-secondary">{savedStrategies.length}</span>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto no-scrollbar p-1 space-y-0.5">
                                                    {savedStrategies.map(s => {
                                                        const isSelected = activeStrategyId === s.id || (!activeStrategyId && strategyName === s.name);
                                                        return (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setActiveStrategyId(s.id);
                                                                    setStrategyName(s.name);
                                                                    setNickname(s.nickname);
                                                                    setDescription(s.description || '');
                                                                    setEntryDirection(s.entryDirection || 'LONG');
                                                                    setVolatileTimer(s.volatileTimer || 5);
                                                                    setRules(s.rules || []);
                                                                    if (s.mode) setStrategyMode(s.mode);
                                                                    if (s.exitRule) setExitRule(s.exitRule);
                                                                    setIsSavedStratDropdownOpen(false);
                                                                }}
                                                                className={`
                                                                    w-full text-left px-2.5 py-2 rounded-lg text-[11px] transition-colors flex items-center justify-between group cursor-pointer
                                                                    hover:bg-background-surface
                                                                    ${isSelected 
                                                                        ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-2 border-blue-400 pl-2' 
                                                                        : 'text-text-primary border-l-2 border-transparent'}
                                                                `}
                                                            >
                                                                <div className="flex flex-col min-w-0 pr-2">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="truncate font-medium">{s.name}</span>
                                                                        {s.promoted && (
                                                                            <span className="text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded shrink-0">
                                                                                LIVE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[9px] text-text-tertiary font-mono mt-0.5">
                                                                        <span>{s.mode ? s.mode.toUpperCase() : 'SWING'}</span>
                                                                        <span>•</span>
                                                                        <span>{s.rules?.length || 0} Rules</span>
                                                                        <span>•</span>
                                                                        <span className={s.entryDirection === 'SHORT' ? 'text-rose-400' : 'text-emerald-400'}>
                                                                            {s.entryDirection || 'LONG'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <Check size={14} className="text-blue-400 shrink-0 ml-2" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <div className="p-1 border-t border-border-subtle/50 bg-background-surface/30">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveStrategyId(null);
                                                            setIsSavedStratDropdownOpen(false);
                                                        }}
                                                        className="w-full text-left px-2.5 py-1.5 rounded-md text-[10px] font-mono text-text-tertiary hover:text-blue-400 hover:bg-background-surface transition-colors flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Plus size={11} className="text-blue-400" />
                                                        <span>New Blank Strategy Blueprint</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Export & Import Action Buttons */}
                                <div className="flex items-center gap-1 bg-background-surface/60 p-0.5 rounded-xl border border-border-subtle">
                                    <button
                                        type="button"
                                        onClick={handleExportStrategy}
                                        title="Download Strategy Blueprint (.json)"
                                        className="px-2 py-1 rounded-lg hover:bg-background-card text-text-secondary hover:text-text-primary text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                        <Download size={11} className="text-blue-400" />
                                        <span>Export</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCopyStrategyJson}
                                        title="Copy Strategy Blueprint JSON to Clipboard"
                                        className="p-1 rounded-lg hover:bg-background-card text-text-secondary hover:text-text-primary text-[10px] transition-all flex items-center justify-center cursor-pointer"
                                    >
                                        <Copy size={11} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImportError('');
                                            setImportJsonText('');
                                            setIsImportModalOpen(true);
                                        }}
                                        title="Import Strategy Blueprint (.json or paste JSON)"
                                        className="px-2 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                        <Upload size={11} />
                                        <span>Import</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResetWorkspaceToDefault}
                                        title="Reset Blueprint to Factory Defaults"
                                        className="p-1 rounded-lg hover:bg-background-card text-text-tertiary hover:text-rose-400 text-[10px] transition-all flex items-center justify-center cursor-pointer"
                                    >
                                        <RotateCcw size={11} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Trading Horizon Mode Selector */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-background-surface/80 border border-border-subtle flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5 font-mono">
                                    <Zap size={11} className="text-amber-400" />
                                    Trading Horizon Mode:
                                </span>
                                <span className="text-[10px] text-text-tertiary hidden md:inline">
                                    {MODE_CONFIGS[strategyMode]?.desc}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 bg-background-card p-1 rounded-xl border border-border-subtle shadow-inner">
                                {['intraday', 'swing', 'positional'].map(m => {
                                    const isAct = strategyMode === m;
                                    const tfLabel = MODE_CONFIGS[m]?.timeframeLabel || 'DAY';
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => handleSelectMode(m)}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                                                isAct
                                                    ? m === 'intraday'
                                                        ? 'bg-amber-500 text-black shadow-sm font-black'
                                                        : m === 'swing'
                                                            ? 'bg-blue-600 text-white shadow-sm font-black'
                                                            : 'bg-purple-600 text-white shadow-sm font-black'
                                                    : 'text-text-tertiary hover:text-text-primary'
                                            }`}
                                        >
                                            {m === 'intraday' && <Zap size={10} />}
                                            {m === 'swing' && <Activity size={10} />}
                                            {m === 'positional' && <TrendingUp size={10} />}
                                            <span>{m}</span>
                                            <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold ${
                                                isAct
                                                    ? m === 'intraday'
                                                        ? 'bg-black/20 text-black'
                                                        : 'bg-white/20 text-white'
                                                    : 'bg-background-surface/80 text-text-tertiary'
                                            }`}>
                                                {tfLabel}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Tier: Strategy Identity */}
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-6 space-y-1">
                                <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1">
                                    <span>Strategy Name</span>
                                </label>
                                <input
                                    type="text"
                                    value={strategyName}
                                    onChange={(e) => setStrategyName(e.target.value)}
                                    placeholder="e.g. Momentum Confluence Bull"
                                    className="w-full px-3 py-2 rounded-xl bg-background-surface border border-border-subtle hover:border-border-default text-xs text-text-primary focus:border-accent-primary focus:outline-hidden transition-colors"
                                />
                            </div>

                            <div className="col-span-3 space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                                        Chart Badge
                                    </label>
                                    <span className="text-[9px] font-mono text-accent-primary font-bold px-1.5 py-0.2 rounded bg-accent-primary/10 border border-accent-primary/20">
                                        {nickname || 'ID'}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value.toUpperCase())}
                                    placeholder="MCB"
                                    className="w-full px-2.5 py-2 rounded-xl bg-background-surface border border-border-subtle text-xs font-mono uppercase text-center text-text-primary focus:border-accent-primary focus:outline-hidden font-bold"
                                />
                            </div>

                            <div className="col-span-3 space-y-1">
                                <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider flex items-center justify-between">
                                    <span>Signal Life</span>
                                    <span className="text-[9px] font-mono text-text-tertiary">Expires</span>
                                </label>
                                <div className="flex items-center gap-1 bg-background-surface px-2.5 py-1.5 rounded-xl border border-border-subtle">
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={volatileTimer}
                                        onChange={(e) => setVolatileTimer(Number(e.target.value))}
                                        className="w-full bg-transparent text-xs font-mono text-center text-text-primary focus:outline-hidden font-bold"
                                    />
                                    <span className="text-[10px] font-mono text-text-tertiary">bars</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Tier: Direction & Risk Management Architecture */}
                        <div className="grid grid-cols-12 gap-3 pt-2.5 border-t border-border-subtle/50">
                            {/* Direction Selector */}
                            <div className="col-span-4 space-y-1">
                                <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                                    Trade Direction
                                </label>
                                <div className="grid grid-cols-2 gap-1 bg-background-surface p-1 rounded-xl border border-border-subtle">
                                    <button
                                        type="button"
                                        onClick={() => setEntryDirection('LONG')}
                                        className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                            entryDirection === 'LONG'
                                                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                                                : 'text-text-tertiary hover:text-text-primary'
                                        }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                        <span>LONG (Bull)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEntryDirection('SHORT')}
                                        className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                            entryDirection === 'SHORT'
                                                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                                                : 'text-text-tertiary hover:text-text-primary'
                                        }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                        <span>SHORT (Bear)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Target Profit % */}
                            <div className="col-span-3 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
                                    <span className="text-text-tertiary">Target Profit</span>
                                    <span className="text-emerald-400 font-mono text-[9px] font-bold">Take-Profit</span>
                                </div>
                                <div className="flex items-center bg-background-surface px-2.5 py-1.5 rounded-xl border border-border-subtle focus-within:border-emerald-500/50 transition-colors">
                                    <span className="text-xs font-mono font-bold text-emerald-400 mr-1">+</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={exitRule.targetPct}
                                        onChange={(e) => setExitRule(p => ({ ...p, targetPct: Number(e.target.value) }))}
                                        className="w-full bg-transparent text-xs font-mono text-right text-emerald-400 font-bold focus:outline-hidden"
                                    />
                                    <span className="text-xs font-mono text-text-tertiary ml-1">%</span>
                                </div>
                            </div>

                            {/* Stop Loss % */}
                            <div className="col-span-3 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
                                    <span className="text-text-tertiary">Stop Loss</span>
                                    <span className="text-rose-400 font-mono text-[9px] font-bold">Guard</span>
                                </div>
                                <div className="flex items-center bg-background-surface px-2.5 py-1.5 rounded-xl border border-border-subtle focus-within:border-rose-500/50 transition-colors">
                                    <span className="text-xs font-mono font-bold text-rose-400 mr-1">-</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={exitRule.stopPct}
                                        onChange={(e) => setExitRule(p => ({ ...p, stopPct: Number(e.target.value) }))}
                                        className="w-full bg-transparent text-xs font-mono text-right text-rose-400 font-bold focus:outline-hidden"
                                    />
                                    <span className="text-xs font-mono text-text-tertiary ml-1">%</span>
                                </div>
                            </div>

                            {/* Horizon & Live R:R Badge */}
                            <div className="col-span-2 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
                                    <span className="text-text-tertiary">Max Hold</span>
                                    <span className="text-amber-400 font-mono text-[9px] font-bold">
                                        R:R 1:{exitRule.stopPct > 0 ? (exitRule.targetPct / exitRule.stopPct).toFixed(1) : '1.0'}
                                    </span>
                                </div>
                                <div className="flex items-center bg-background-surface px-2.5 py-1.5 rounded-xl border border-border-subtle">
                                    <input
                                        type="number"
                                        value={exitRule.horizonBars}
                                        onChange={(e) => setExitRule(p => ({ ...p, horizonBars: Number(e.target.value) }))}
                                        className="w-full bg-transparent text-xs font-mono text-center text-text-primary focus:outline-hidden font-bold"
                                    />
                                    <span className="text-[10px] font-mono text-text-tertiary">bars</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rule Canvas Container */}
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono flex items-center gap-1.5">
                                    <Target size={13} className="text-accent-primary" />
                                    Confluence Rule Pipeline
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/25 text-accent-primary text-[10px] font-mono font-bold">
                                    {rules.length} {rules.length === 1 ? 'Rule' : 'Rules'} Active
                                </span>
                            </div>

                            {/* Chain Formula Display */}
                            {rules.length > 0 && (
                                <div className="hidden lg:flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-background-surface border border-border-subtle text-[10px] font-mono text-text-tertiary">
                                    <span>Formula:</span>
                                    <span className="text-text-primary font-bold">
                                        {rules.map((r, i) => (
                                            <span key={r.id}>
                                                {i > 0 && <span className="text-accent-primary mx-1">{r.logic || 'AND'}</span>}
                                                <span>#{i + 1}</span>
                                            </span>
                                        ))}
                                    </span>
                                </div>
                            )}
                        </div>

                        {rules.length === 0 ? (
                            <div className="flex-1 min-h-[200px] rounded-2xl border-2 border-dashed border-border-subtle/80 bg-background-surface/30 flex flex-col items-center justify-center p-8 text-center text-text-tertiary gap-2.5">
                                <div className="w-12 h-12 rounded-2xl bg-background-card border border-border-subtle flex items-center justify-center text-text-tertiary">
                                    <Layers size={22} className="opacity-60" />
                                </div>
                                <div>
                                    <span className="font-bold text-sm text-text-primary block">No Rules in Strategy</span>
                                    <p className="text-xs text-text-tertiary max-w-sm mt-0.5">
                                        Select indicators from the Signal Palette on the left to start weaving your multi-factor confluence rules.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {rules.map((rule, idx) => {
                                    const labInd = allCustomIndicators.find(l => l.id === rule.indicatorId) || promotedLabs.find(l => l.id === rule.indicatorId);
                                    return (
                                        <StrategyRuleCard
                                            key={rule.id}
                                            rule={rule}
                                            index={idx}
                                            totalRules={rules.length}
                                            onChangeRule={handleUpdateRule}
                                            onRemoveRule={handleRemoveRule}
                                            customLabIndicator={labInd}
                                            strategyMode={strategyMode}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Action Execution Footer - Premium Control Dock */}
                    <div className="sticky bottom-0 bg-background-card/95 backdrop-blur-xl border border-border-subtle/90 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 z-20">
                        <div className="flex items-center gap-2 text-[11px] font-mono flex-wrap">
                            <button
                                type="button"
                                onClick={() => setIsInstrumentModalOpen(true)}
                                className="px-2.5 py-1 rounded-lg bg-background-surface hover:bg-background-surface/80 border border-border-subtle text-text-primary font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                title="Change Instrument"
                            >
                                <span>{instrumentLabel}</span>
                                <ChevronDown size={11} className="text-text-tertiary" />
                            </button>

                            <div className="flex items-center bg-background-surface border border-border-subtle rounded-lg p-0.5">
                                {AVAILABLE_TIMEFRAMES.map(tf => {
                                    const isSelected = timeframe === tf.value || (tf.value === '15minute' && timeframe === '15m');
                                    return (
                                        <button
                                            key={tf.value}
                                            type="button"
                                            onClick={() => handleSelectTimeframe(tf.value)}
                                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'text-text-tertiary hover:text-text-primary'
                                            }`}
                                        >
                                            {tf.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {loadingCandles ? (
                                <span className="text-blue-400 flex items-center gap-1.5 text-[10px]">
                                    <RefreshCw size={11} className="animate-spin" />
                                    <span>Syncing bars...</span>
                                </span>
                            ) : candleSpan ? (
                                <span className="text-text-tertiary hidden sm:inline text-[10px] font-mono tracking-tight" title={candleSpan.full}>
                                    ({candleSpan.full})
                                </span>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={handleRunSimulation}
                                disabled={isSimulating || loadingCandles || rules.length === 0}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {isSimulating ? (
                                    <>
                                        <RefreshCw size={13} className="animate-spin" />
                                        <span>Evaluating Confluence...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={13} fill="currentColor" />
                                        <span>Run Strategy Backtest</span>
                                    </>
                                )}
                            </button>

                            {simulationResult?.summary && (
                                <button
                                    type="button"
                                    onClick={() => setIsTotpOpen(true)}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer animate-in fade-in"
                                >
                                    <ShieldCheck size={14} />
                                    <span>Approve & Promote</span>
                                    <Lock size={12} className="text-white/80" />
                                </button>
                            )}
                        </div>
                    </div>
                </main>

                {/* ── RIGHT COLUMN: Scorecard (420px) ── */}
                {isRightOpen && (
                    <BacktestScorecard
                        summary={simulationResult?.summary || {}}
                        calibration={simulationResult?.calibration || []}
                        walkForward={simulationResult?.walkForward || null}
                        trades={simulationResult?.trades || []}
                        activeUnit="STRATEGY"
                        savedRuns={savedStrategies.map(s => ({
                            id: s.id,
                            name: s.name,
                            unit: 'STRATEGY',
                            instrument: s.instrument || instrument,
                            timeframe: s.timeframe || timeframe,
                            summary: s.backtestSummary,
                            timestamp: s.createdAt,
                            config: s,
                        }))}
                        onRestoreRun={(runItem, name) => {
                            const s = runItem?.config || savedStrategies.find(item => item.id === runItem?.id || item.name === name);
                            if (s) {
                                if (s.rules) setRules(s.rules);
                                if (s.exitRule) setExitRule(s.exitRule);
                                if (s.entryDirection) setEntryDirection(s.entryDirection);
                                if (s.name) setStrategyName(s.name);
                                if (s.nickname) setNickname(s.nickname);
                                if (s.description) setDescription(s.description);
                                if (s.instrument && s.instrument !== instrument) setInstrument(s.instrument);
                                if (s.timeframe && s.timeframe !== timeframe) setTimeframe(s.timeframe);
                                if (s.mode && s.mode !== strategyMode) setStrategyMode(s.mode);
                                setActiveStrategyId(s.id);
                                setPromotedToast(`Restored strategy "${s.name}".`);
                                setTimeout(() => setPromotedToast(null), 3500);

                                if (candles && candles.length >= 30) {
                                    setIsSimulating(true);
                                    setTimeout(() => {
                                        const res = runStrategyBacktest(candles, {
                                            rules: s.rules || rules,
                                            entryDirection: s.entryDirection || entryDirection,
                                            exitRule: s.exitRule || exitRule,
                                            instrument: s.instrument || instrument,
                                            timeframe: s.timeframe || timeframe,
                                            name: s.name,
                                            nickname: s.nickname,
                                            customLabModels: allCustomIndicators,
                                            mode: s.mode || strategyMode,
                                        });
                                        setSimulationResult(res);
                                        setIsSimulating(false);
                                    }, 80);
                                }
                            }
                        }}
                        onDeleteRun={(id) => {
                            const updated = deleteStrategy(id);
                            setSavedStrategies(updated);
                        }}
                        onClearRuns={() => {
                            setIsClearStrategiesModalOpen(true);
                        }}
                        isOpen={isRightOpen}
                    />
                )}
            </div>

            {/* Bottom Equity Curve */}
            <BacktestEquityCurve
                equityCurve={simulationResult?.equityCurve || []}
                initialCapital={100000}
                endingCapital={simulationResult?.summary?.endingCapital || 100000}
                maxDrawdownPct={simulationResult?.summary?.maxDrawdownPct || 0}
            />

            {/* TOTP Promotion Modal */}
            <DangerActionModal
                isOpen={isTotpOpen}
                onClose={() => setIsTotpOpen(false)}
                onConfirm={handleConfirmPromotion}
                isLoading={isPromoting}
                errorMessage={totpError}
                config={{
                    id: 'promote_strategy',
                    title: `Promote Strategy: "${strategyName}"`,
                    description: `This strategy will be elevated into the chart section under the Strategies drawer. It will run in real-time generating buy/sell arrows with badge "${nickname}".`,
                    requiredConfirmText: nickname || 'APPROVE',
                    actionButtonText: 'Authorize & Promote Strategy',
                    buttonVariant: 'orange',
                }}
            />

            {/* Custom Indicator Studio Modal */}
            <CustomIndicatorModal
                isOpen={isCustomLabModalOpen}
                onClose={() => setIsCustomLabModalOpen(false)}
                candles={candles}
                onAddToStrategy={(indicator) => {
                    handleAddRuleFromPalette(indicator.id || indicator);
                    setIsCustomLabModalOpen(false);
                }}
            />

            {/* Custom Lab Model Promotion TOTP Modal */}
            {labToApprove && (
                <DangerActionModal
                    isOpen={isLabTotpOpen}
                    onClose={() => {
                        setIsLabTotpOpen(false);
                        setLabToApprove(null);
                    }}
                    onConfirm={handleConfirmLabPromotion}
                    isLoading={isLabPromoting}
                    errorMessage={labTotpError}
                    config={{
                        id: `promote_lab_${labToApprove.id}`,
                        title: `Authorize Promotion: "${labToApprove.name}"`,
                        description: `You are elevating model "${labToApprove.name}" [${labToApprove.nickname}] to LIVE status with mandatory 6-digit TOTP verification.`,
                        requiredConfirmText: labToApprove.nickname || 'APPROVE',
                        actionButtonText: 'Authorize & Promote Indicator',
                        buttonVariant: 'orange',
                    }}
                />
            )}

            {/* Instrument Modal */}
            {isInstrumentModalOpen && (
                <InstrumentSelectorModal
                    isOpen={isInstrumentModalOpen}
                    onClose={() => setIsInstrumentModalOpen(false)}
                    currentInstrument={{ value: instrument }}
                    onSelect={(s) => {
                        if (s.instrument_token || s.value) setInstrument(s.instrument_token || s.value);
                        setIsInstrumentModalOpen(false);
                    }}
                    mode="select"
                />
            )}

            {/* Hidden File Input for Strategy Import */}
            <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
            />

            {/* Strategy Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
                    <div className="w-full max-w-lg bg-background-card border border-border-subtle rounded-3xl shadow-2xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                    <Upload size={16} />
                                </div>
                                <div>
                                    <span className="font-bold text-sm text-text-primary block">Import Strategy Blueprint</span>
                                    <span className="text-[10px] text-text-tertiary">Upload a .json blueprint file or paste JSON code directly</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsImportModalOpen(false)}
                                className="w-7 h-7 rounded-lg hover:bg-background-surface flex items-center justify-center text-text-tertiary hover:text-text-primary cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {importError && (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{importError}</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            {/* File Upload Zone */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-5 border-2 border-dashed border-border-subtle hover:border-blue-500/50 rounded-2xl bg-background-surface/40 hover:bg-background-surface/80 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
                            >
                                <FileText size={24} className="text-blue-400" />
                                <span className="text-xs font-bold">Click to Select Blueprint JSON File</span>
                                <span className="text-[10px] text-text-tertiary">Accepts .json files exported from Praxis Strategy Builder</span>
                            </button>

                            <div className="flex items-center gap-2 my-1">
                                <div className="flex-1 h-px bg-border-subtle" />
                                <span className="text-[9px] font-mono text-text-tertiary uppercase">OR PASTE JSON BLUEPRINT</span>
                                <div className="flex-1 h-px bg-border-subtle" />
                            </div>

                            {/* Paste Textarea */}
                            <textarea
                                rows={6}
                                value={importJsonText}
                                onChange={(e) => setImportJsonText(e.target.value)}
                                placeholder='{"schema":"praxis_strategy_blueprint","version":"2.0","strategy":{...}}'
                                className="w-full p-3 rounded-xl bg-background-surface border border-border-subtle text-xs font-mono text-text-primary placeholder:text-text-tertiary/50 focus:border-blue-500 focus:outline-hidden resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                            <button
                                type="button"
                                onClick={() => setIsImportModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePasteImportSubmit}
                                disabled={!importJsonText.trim()}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
                            >
                                <Check size={14} />
                                <span>Import Blueprint</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detach & Delete Custom Indicator Modal ── */}
            {isLabDeleteModalOpen && labToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
                    <div className="w-full max-w-lg p-5 rounded-2xl bg-background-card border border-border-subtle shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                                    <Trash2 size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-text-primary">Detach & Remove Model</span>
                                        <span className="px-1.5 py-0.5 text-[9px] rounded font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                            {labToDelete.nickname}
                                        </span>
                                        {labToDelete.promoted ? (
                                            <span className="px-1.5 py-0.5 text-[9px] rounded font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                LIVE
                                            </span>
                                        ) : (
                                            <span className="px-1.5 py-0.5 text-[9px] rounded font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/30">
                                                DRAFT
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-text-secondary">{labToDelete.name}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsLabDeleteModalOpen(false)}
                                className="w-7 h-7 rounded-lg hover:bg-background-surface flex items-center justify-center text-text-tertiary hover:text-text-primary cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-rose-400">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>Permanent Algorithmic Purge</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-rose-200/90">
                                This will permanently detach this custom indicator struct and its sandboxed algorithmic code from your browser.
                                Any active strategy rules and live chart overlays referencing this model will be automatically cleaned up.
                            </p>
                        </div>

                        {/* Code Inspection Accordion */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteCodePreview(prev => !prev)}
                                    className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                    <ChevronDown size={13} className={showDeleteCodePreview ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                    <span>{showDeleteCodePreview ? 'Hide Algorithm Code' : 'Inspect Algorithm Code before deleting'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(labToDelete.code || '');
                                        setPromotedToast("Copied indicator code to clipboard");
                                        setTimeout(() => setPromotedToast(null), 3000);
                                    }}
                                    className="text-[10px] text-text-tertiary hover:text-text-primary flex items-center gap-1 cursor-pointer"
                                >
                                    <Copy size={11} />
                                    <span>Copy Code</span>
                                </button>
                            </div>

                            {showDeleteCodePreview && (
                                <div className="max-h-48 overflow-y-auto custom-scrollbar p-2.5 rounded-xl bg-background-surface border border-border-subtle font-mono text-[10px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                                    {labToDelete.code || '// No source code provided'}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                            <button
                                type="button"
                                onClick={() => {
                                    exportIndicatorJson(labToDelete);
                                    setPromotedToast(`Backed up "${labToDelete.nickname}_struct.json"`);
                                    setTimeout(() => setPromotedToast(null), 4000);
                                }}
                                className="px-3 py-2 rounded-xl bg-background-surface hover:bg-background-surface/80 text-text-primary text-xs font-semibold flex items-center gap-1.5 border border-border-subtle transition cursor-pointer"
                            >
                                <Download size={13} className="text-blue-400" />
                                <span>Download Struct (.json)</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsLabDeleteModalOpen(false)}
                                    className="px-3.5 py-2 rounded-xl text-xs text-text-tertiary hover:text-text-primary transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDeleteLab}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/25 active:scale-95 transition cursor-pointer"
                                >
                                    <Trash2 size={13} />
                                    <span>Permanently Detach & Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear All Strategies Confirmation Modal */}
            <DangerActionModal
                isOpen={isClearStrategiesModalOpen}
                onClose={() => setIsClearStrategiesModalOpen(false)}
                onConfirm={() => {
                    localStorage.removeItem('praxis_strategies');
                    setSavedStrategies([]);
                    setIsClearStrategiesModalOpen(false);
                    setPromotedToast("Cleared all saved strategies.");
                    setTimeout(() => setPromotedToast(null), 3500);
                }}
                config={{
                    id: 'clear_all_strategies',
                    title: 'Purge All Saved Strategies',
                    description: 'You are about to permanently delete all saved strategy blueprints and backtest configurations stored in your browser. This action cannot be undone.',
                    requiredConfirmText: 'CLEAR',
                    actionButtonText: 'Permanently Purge All Strategies',
                    buttonVariant: 'rose',
                }}
            />

            {/* AI Foundation Model Auto-Fine-Tuning Studio Modal */}
            {isFinetuneOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        <ModelFinetuneCard
                            instrument={instrument}
                            timeframe={timeframe}
                            onClose={() => setIsFinetuneOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
