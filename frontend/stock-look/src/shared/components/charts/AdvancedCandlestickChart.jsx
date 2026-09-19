/**
 * @file AdvancedCandlestickChart.jsx
 * @purpose Interactive financial chart with AI insights, fundamental overlays, and drawing toolkit.
 * @date 2026-07-20
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, createSeriesMarkers } from 'lightweight-charts';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilRuler, Activity, TrendingUp, BarChart2, Layers, Plus, Waves, TrendingUpDown, Anchor, AlignJustify, MoreHorizontal, Cloud, Frame, SlidersHorizontal, Spline, Zap, ChevronDown, Check, Sparkles, X, Trash2, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';
import DrawingToolbar, { COLORS } from './drawing/DrawingToolbar';
import DrawingCanvas from './drawing/DrawingCanvas';
import { useDrawings } from './drawing/useDrawings';
import { calculateSupertrend, calculateVWAP, calculateEMA, calculateCPR } from '../../utils/chartUtils';
import { calculateMACD, calculatePSAR, calculateIchimoku, calculateAnchoredVWAP, calculateAutoFib, calculateRSIDivergence } from '../../utils/advancedIndicators';
import { computeAdaptiveBands } from '../../utils/adaptiveBandsEngine';
import { analyzeChartPatterns } from '../../utils/patternEngine';

import { useTheme } from '../../context/ThemeContext';
import { getIndicatorProfiles } from '../../utils/indicatorModeProfiles';
import { FO_INDICES, FO_EQUITIES } from '../../utils/foInstruments';
import { assembleContext, getFVSettings } from '../../utils/futureVisionContextAssembler';
import { storePrediction, scoreClosedCandle, getPAESession, clearPAESession, computeConfidence, getAllPAESessions, updatePAEAutoMode, deletePAECandleByTime, deletePAESessionByTime, storeLiveErrors, buildContinuousTimeline, normalizeTimeKey, sanitizePAESession, calculateInstitutionalCandleError } from '../../utils/predictionAccuracyEngine';
import { blendRollingForecasts } from '../../utils/FutureVisionBlender';
import { getNextIntradayCandleTime, getNextTradingDay, healFutureCandleTimes, formatDateKey } from '../../utils/tradingCalendar';
import axiosInstance from '../../utils/axiosInstance';
import { useDataRegistry } from '../../context/DataRegistryContext';
import { Telescope, Info, Eye, EyeOff, Microscope, RotateCw, Brain } from 'lucide-react';
import Loader from '../ui/Loader';
import OHLCLegend from './OHLCLegend';
import { getGlobalInsightCache } from '../ui/AiInsightSection';
import { getCustomIndicators, subscribeToCustomIndicators } from '@/features/backtest/lab/customIndicatorRegistry';
import { getStrategies, subscribeToStrategies } from '@/features/backtest/strategy/strategyRegistry';
import { runStrategyBacktest } from '@/features/backtest/strategy/strategyEngine';

const DEFAULT_DATA = [];
const DEFAULT_FUNDAMENTAL_DATA = {};
const DEFAULT_EVENTS = [];

const getMsTimestamp = (timeObj) => {
    if (!timeObj) return 0;
    if (typeof timeObj === 'number') return timeObj < 10000000000 ? timeObj * 1000 : timeObj;
    if (typeof timeObj === 'string') return new Date(timeObj).getTime();
    if (timeObj && timeObj.year) return new Date(timeObj.year, timeObj.month - 1, timeObj.day).getTime();
    return 0;
};

const CANONICAL_ENSEMBLE_MODELS = [
    { model_id: 'chronos_bolt', defaultWeight: 0.25, label: 'Chronos-Bolt (Amazon)' },
    { model_id: 'kronos', defaultWeight: 0.25, label: 'Kronos (AAAI 2026)' },
    { model_id: 'naive_baseline', defaultWeight: 0.30, label: 'Naive Baseline' },
    { model_id: 'lag_llama', defaultWeight: 0.20, label: 'Lag-Llama' },
];

export default React.memo(function AdvancedCandlestickChart({
    data = DEFAULT_DATA,
    liveCandle = null,
    fundamentalData = DEFAULT_FUNDAMENTAL_DATA,
    events = DEFAULT_EVENTS,
    showValuationBands = true,
    showEvents = true,
    timeframeMode = 'medium',
    height = 500,
    isBackfilling = false,
    instrumentKey = 'default',
    timeframe = 'day',
    allowFutureVision = true,
    isMultiMode = false,
}) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const chartWrapperRef = useRef(null);

    const [showDrawing, setShowDrawing] = useState(false);
    const [activeTool, setActiveTool] = useState('cursor');
    const [activeColor, setActiveColor] = useState(COLORS[0]);
    const { drawings, addDrawing, deleteDrawing, undo, clearAll } = useDrawings(instrumentKey, timeframe);

    const [crosshairData, setCrosshairData] = useState(null);
    const [ghostTooltip, setGhostTooltip] = useState(null);

    const candleSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const undervaluedSeriesRef = useRef(null);
    const fairValueSeriesRef = useRef(null);
    const overvaluedSeriesRef = useRef(null);
    const supertrendUpSeriesRef = useRef(null);
    const supertrendDownSeriesRef = useRef(null);
    const vwapSeriesRef = useRef(null);
    const ema9SeriesRef = useRef(null);
    const ema21SeriesRef = useRef(null);
    const cprTcSeriesRef = useRef(null);
    const cprPivotSeriesRef = useRef(null);
    const cprBcSeriesRef = useRef(null);
    const markersPluginRef = useRef(null);

    // Advanced Indicators Refs
    // ── Adaptive Bands (replaces separate BB / KC / Donchian refs) ──────────
    const bandOuterUpperRef = useRef(null);
    const bandOuterLowerRef = useRef(null);
    const bandMiddleRef     = useRef(null);
    const bandInnerUpperRef = useRef(null);   // KC inner / Donchian 20-bar (null for BB)
    const bandInnerLowerRef = useRef(null);
    const macdLineRef = useRef(null);
    const signalLineRef = useRef(null);
    const macdHistRef = useRef(null);

    const psarRef = useRef(null);
    const ichimokuTenkanRef = useRef(null);
    const ichimokuKijunRef = useRef(null);
    const ichimokuSpanARef = useRef(null);
    const ichimokuSpanBRef = useRef(null);
    const anchoredVwapRef = useRef(null);
    const autoFibLinesRef = useRef([]);
    const rsiRef = useRef(null);
    const rsiOverboughtLineRef = useRef(null);
    const rsiOversoldLineRef = useRef(null);
    const lastDataTimeRef = useRef(null);

    const volumeDataRef = useRef([]);
    const visibleMaxVolRef = useRef(0);
    
    const [showSupertrend, setShowSupertrend] = useState(false);
    const [showVWAP, setShowVWAP] = useState(false);
    const [showEMA, setShowEMA] = useState(false);
    const [showCPR, setShowCPR] = useState(false);
    
    const [showMenu, setShowMenu] = useState(false);
    // Unified Adaptive Bands state — replaces showBollinger, showKeltner, showDonchian
    const [showAdaptiveBands, setShowAdaptiveBands] = useState(false);
    const [bandsMode, setBandsMode] = useState('swing'); // 'scalp' | 'swing' | 'positional'
    const [showMACD, setShowMACD] = useState(false);

    const [showPSAR, setShowPSAR] = useState(false);
    const [showIchimoku, setShowIchimoku] = useState(false);
    const [showAnchoredVWAP, setShowAnchoredVWAP] = useState(false);
    const [showAutoFib, setShowAutoFib] = useState(false);
    const [showRSI, setShowRSI] = useState(false);
    
    // Custom Indicators & Strategies Integration
    const [promotedCustomIndicators, setPromotedCustomIndicators] = useState([]);
    const [activeCustomIndicatorIds, setActiveCustomIndicatorIds] = useState(new Set());
    const customSeriesMapRef = useRef(new Map());

    const [promotedStrategies, setPromotedStrategies] = useState([]);
    const [activeStrategyIds, setActiveStrategyIds] = useState(new Set());
    const strategyMarkersPluginRef = useRef(null);

    const [hoveredIndicator, setHoveredIndicator] = useState(null);
    const [panePositions, setPanePositions] = useState({});
    const updatePaneTopsRef = useRef(null);

    const { theme, tradingMode } = useTheme();
    const activeIndicatorConfig = getIndicatorProfiles(tradingMode);
    // Derive bandsMode from global tradingMode (intraday -> scalp)
    const bandsModeTheme = activeIndicatorConfig.adaptiveBands.mode;
    const isLight = theme === 'light';

    // Auto-sync bandsMode to current trading mode profile
    useEffect(() => {
        if (activeIndicatorConfig?.adaptiveBands?.mode) {
            setBandsMode(activeIndicatorConfig.adaptiveBands.mode);
        }
    }, [tradingMode]);

    const { getMasterSnapshot } = useDataRegistry();

    const [fvActive, setFvActive] = useState(false);
    const [fvLoading, setFvLoading] = useState(false);
    const [fvBias, setFvBias] = useState(null);
    const [fvRisk, setFvRisk] = useState('');
    const [fvPAE, setFvPAE] = useState(null);
    const [fvModel, setFvModel] = useState(null);
    const [fvVisible, setFvVisible] = useState(true);
    const [fvAutoMode, setFvAutoMode] = useState(() => {
        try {
            return localStorage.getItem('praxis_fv_auto_mode') === 'true';
        } catch {
            return false;
        }
    });
    const [fvHasFutureCandles, setFvHasFutureCandles] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem('praxis_fv_auto_mode', fvAutoMode ? 'true' : 'false');
        } catch {}
    }, [fvAutoMode]);
    
    // Probabilistic Ensemble, Friction Drag & Calibration States
    const [fvQuantiles, setFvQuantiles] = useState(null);
    const [fvFriction, setFvFriction] = useState(null);
    const [fvEdge, setFvEdge] = useState(null);
    const [fvModelWeights, setFvModelWeights] = useState([]);
    const [fvActiveModels, setFvActiveModels] = useState(() => {
        try {
            const saved = localStorage.getItem('praxis_prediction_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed.ensembleModels) && parsed.ensembleModels.length > 0) {
                    return parsed.ensembleModels;
                }
            }
        } catch (_) {}
        return null;
    });
    const [fvEnsembleWeights, setFvEnsembleWeights] = useState(() => {
        try {
            const saved = localStorage.getItem('praxis_prediction_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.ensembleWeights) return parsed.ensembleWeights;
            }
        } catch (_) {}
        return null;
    });
    const [fvConformalMultiplier, setFvConformalMultiplier] = useState(1.0);
    const [fvRegime, setFvRegime] = useState('CHOPPY');
    
    // Developer testing states
    const [demoRealCandles, setDemoRealCandles] = useState([]);
    const [demoLiveCandle, setDemoLiveCandle] = useState(null);

    const [patternScore, setPatternScore] = useState(null);
    const [hoveredPattern, setHoveredPattern] = useState(null);
    const [confluenceData, setConfluenceData] = useState(null);
    const [showAiFlyout, setShowAiFlyout] = useState(false);

    const fvClickTimerRef = useRef(null);
    const fvIgnoreStaleRef = useRef(false); // useRef so it's instantly readable in the same closure

    const fvSessionRef = useRef(null);
    const fvLiveBarIndexRef = useRef(0);
    const ghostCandleSeriesRef = useRef(null);
    const ghostUpperConeRef = useRef(null);
    const ghostLowerConeRef = useRef(null);
    const ghostMarkersRef = useRef([]); // Track persistent error markers
    const ghostMarkersPluginRef = useRef(null); // Fix setMarkers is not a function
    const hoveredTimeRef = useRef(null); // Track hovered time for specific candle deletion
    const paceProfileRef = useRef(null); // PACE: permanent calibration profile
    const analystBriefRef = useRef(null); // Analyst: daily strategic brief
    const lastLiveCandleRef = useRef(null); // Tracks last closed tick before boundary change

    const dataRef = useRef(data);
    const liveCandleRef = useRef(liveCandle);
    const demoLiveCandleRef = useRef(demoLiveCandle);
    const demoRealCandlesRef = useRef(demoRealCandles);

    const fvVisibleRef = useRef(fvVisible);
    const isMultiModeRef = useRef(isMultiMode);

    useEffect(() => { dataRef.current = data; }, [data]);
    useEffect(() => { liveCandleRef.current = liveCandle; }, [liveCandle]);
    useEffect(() => { demoLiveCandleRef.current = demoLiveCandle; }, [demoLiveCandle]);
    useEffect(() => { demoRealCandlesRef.current = demoRealCandles; }, [demoRealCandles]);
    useEffect(() => { fvVisibleRef.current = fvVisible; }, [fvVisible]);
    useEffect(() => { isMultiModeRef.current = isMultiMode; }, [isMultiMode]);

    const updateGhostMarkers = useCallback((markers) => {
        ghostMarkersRef.current = markers || [];
        if (!candleSeriesRef.current) return;

        try {
            const sorted = [...(markers || [])].sort((a, b) => {
                const getMs = (t) => {
                    if (!t) return 0;
                    if (typeof t === 'number') return t < 10000000000 ? t * 1000 : t;
                    if (typeof t === 'string') return new Date(t).getTime();
                    if (t?.year) return new Date(t.year, t.month - 1, t.day).getTime();
                    return 0;
                };
                return getMs(a.time) - getMs(b.time);
            });

            const isVisible = fvVisibleRef.current && !isMultiModeRef.current;
            const markersToSet = isVisible ? sorted : [];

            if (!ghostMarkersPluginRef.current) {
                ghostMarkersPluginRef.current = createSeriesMarkers(candleSeriesRef.current, markersToSet, { zOrder: 'aboveSeries' });
            } else {
                ghostMarkersPluginRef.current.setMarkers(markersToSet);
            }
        } catch (e) {
            console.warn('[FutureVision] Error updating ghost markers:', e);
        }
    }, []);

    const liveIndicatorSnapshotRef = useRef({});

    // Overnight Analyst Strategic Brief States
    const [analystBrief, setAnalystBrief] = useState(null);
    const [analystBriefCreatedAt, setAnalystBriefCreatedAt] = useState(null);
    const [showAnalystPopover, setShowAnalystPopover] = useState(false);
    const [isAnalyzingBrief, setIsAnalyzingBrief] = useState(false);

    // Dynamic Sub-Pane Oscillator hover & latest value tracking
    const [oscillatorHover, setOscillatorHover] = useState({ rsi: null, macd: null, signal: null, hist: null });
    const latestOscillatorsRef = useRef({ rsi: null, macd: null, signal: null, hist: null });

    // PACE & Analyst: Fetch calibration profile & brief on instrument/timeframe change
    useEffect(() => {
        if (!instrumentKey || !timeframe) return;
        
        // Fetch PACE
        axiosInstance.get('/api/v1/pace/profile', { params: { instrumentKey, timeframe } })
            .then(res => {
                paceProfileRef.current = res.data?.hasData ? { profile: res.data.profile, promptBlock: res.data.promptBlock } : null;
                if (res.data?.hasData) {
                    console.log(`[PACE] Loaded profile for ${instrumentKey}/${timeframe}: ${res.data.profile?.barsScored} bars scored, correction strength ${(res.data.profile?.correctionStrength * 100).toFixed(0)}%`);
                }
            })
            .catch(() => { /* silent */ });

        // Fetch Analyst Brief
        axiosInstance.get('/api/v1/pace/analyst', { params: { instrumentKey, timeframe } })
            .then(res => {
                const rawBrief = res.data?.brief;
                const text = typeof rawBrief === 'string' ? rawBrief : (rawBrief?.brief_text || rawBrief?.brief || null);
                const createdAt = res.data?.createdAt || rawBrief?.created_at || null;
                analystBriefRef.current = text;
                setAnalystBrief(text);
                setAnalystBriefCreatedAt(createdAt);
                if (text) console.log(`[OvernightAnalyst] Loaded brief for ${instrumentKey}/${timeframe}`);
            })
            .catch(() => {
                analystBriefRef.current = null;
                setAnalystBrief(null);
                setAnalystBriefCreatedAt(null);
            });

        // Fetch Calibrated Prediction Weights & Conformal State
        axiosInstance.get('/api/v1/predictions/weights', { params: { instrument: instrumentKey, timeframe } })
            .then(res => {
                if (res.data?.weights) {
                    setFvModelWeights(res.data.weights);
                    if (res.data.edge) setFvEdge(res.data.edge);
                    if (res.data.regime) setFvRegime(res.data.regime);
                    if (res.data.activeModels) setFvActiveModels(res.data.activeModels);
                    if (res.data.ensembleWeights) setFvEnsembleWeights(res.data.ensembleWeights);
                }
            })
            .catch(() => { /* silent */ });

        axiosInstance.get('/api/v1/predictions/calibration', { params: { instrument: instrumentKey, timeframe } })
            .then(res => {
                if (res.data?.conformal_multiplier) {
                    setFvConformalMultiplier(res.data.conformal_multiplier);
                }
            })
            .catch(() => { /* silent */ });

    }, [instrumentKey, timeframe]);

    // Realtime synchronization with PAI model configuration changes
    useEffect(() => {
        const handleConfigUpdate = (e) => {
            if (e.detail?.ensembleModels) {
                setFvActiveModels(e.detail.ensembleModels);
            }
            if (e.detail?.ensembleWeights) {
                setFvEnsembleWeights(e.detail.ensembleWeights);
            }
        };
        window.addEventListener('praxis:prediction-config-updated', handleConfigUpdate);

        // Fetch backend prediction config if not yet loaded from localStorage
        axiosInstance.get('/api/v1/ai-settings/prediction-models/config')
            .then(res => {
                if (res.data?.ensembleModels) {
                    setFvActiveModels(res.data.ensembleModels);
                }
                if (res.data?.ensembleWeights) {
                    setFvEnsembleWeights(res.data.ensembleWeights);
                }
            })
            .catch(() => { /* silent */ });

        return () => {
            window.removeEventListener('praxis:prediction-config-updated', handleConfigUpdate);
        };
    }, []);

    // Reset ephemeral demo candles and live candle when instrument or timeframe changes
    useEffect(() => {
        setDemoRealCandles([]);
        setDemoLiveCandle(null);
    }, [instrumentKey, timeframe]);

    // Handler to run fresh deep overnight analysis without closing or vanishing
    const handleRunAnalystBrief = async () => {
        if (!instrumentKey || !timeframe) return;
        setIsAnalyzingBrief(true);
        try {
            const res = await axiosInstance.post('/api/v1/pace/analyst/run', { 
                instrumentKey, 
                timeframe,
                candles: data?.slice(-50),
                confluence: confluenceData
            });
            if (res.data?.success) {
                const newBrief = typeof res.data.brief === 'string' ? res.data.brief : res.data.brief?.brief_text;
                const newCreated = res.data.createdAt || Date.now();
                analystBriefRef.current = newBrief;
                setAnalystBrief(newBrief);
                setAnalystBriefCreatedAt(newCreated);
                const { toast } = await import('sonner');
                toast.success('Overnight Analyst Brief Generated');
            }
        } catch (err) {
            const detail = err.response?.data?.details || err.response?.data?.error || err.message;
            const { toast } = await import('sonner');
            toast.error('Analysis Failed', { description: detail });
        } finally {
            setIsAnalyzingBrief(false);
        }
    };

    // PACE: After bar close, post score to backend to update permanent profile
    const postPACEScore = (barScore, liveCandle) => {
        if (!barScore || !instrumentKey || !timeframe) return;
        // Detect regime from recent ATR proxy: compare last candle range to avg
        const recentData = data?.slice(-10) ?? [];
        const avgRange = recentData.length > 1
            ? recentData.reduce((s, c) => s + (c.high - c.low), 0) / recentData.length
            : 0;
        const lastRange = liveCandle ? liveCandle.high - liveCandle.low : 0;
        const ratio = avgRange > 0 ? lastRange / avgRange : 1;
        const regime = ratio > 1.5 ? 'volatile' : ratio < 0.7 ? 'calm' : 'normal';

        axiosInstance.post('/api/v1/pace/score', { instrumentKey, timeframe, barScore, regime })
            .then(res => {
                // Refresh profile after update
                return axiosInstance.get('/api/v1/pace/profile', { params: { instrumentKey, timeframe } });
            })
            .then(res => { paceProfileRef.current = res.data?.hasData ? { profile: res.data.profile, promptBlock: res.data.promptBlock } : null; })
            .catch(() => { /* silent */ });
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth || 600,
            height: chartContainerRef.current.clientHeight || 350,
            layout: {
                background: { color: 'transparent' },
                textColor: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            },
            watermark: {
                visible: false,
            },
            localization: {
                timeFormatter: (ts) => {
                    if (!ts) return '';
                    let date;
                    if (typeof ts === 'number') date = new Date(ts * 1000);
                    else if (ts.year) date = new Date(ts.year, ts.month - 1, ts.day);
                    else if (typeof ts === 'string') date = new Date(ts);
                    if (!date || isNaN(date)) return String(ts);
                    const opts = { day: 'numeric', month: 'short', year: 'numeric' };
                    if (typeof ts === 'number') { opts.hour = 'numeric'; opts.minute = '2-digit'; opts.hour12 = true; }
                    return date.toLocaleString('en-US', opts);
                }
            },
            grid: {
                vertLines: { color: isLight ? 'rgba(0, 0, 0, 0.09)' : 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: isLight ? 'rgba(0, 0, 0, 0.09)' : 'rgba(255, 255, 255, 0.05)' },
            },
            crosshair: {
                mode: 1,
                vertLine: { color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', width: 1, style: 2 },
                horzLine: { color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', width: 1, style: 2 },
            },
            panes: {
                enableResize: true,
                separatorColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                separatorHoverColor: 'rgba(59, 130, 246, 0.6)',
            },
            rightPriceScale: {
                borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                scaleMargins: { top: 0.08, bottom: 0.08 },
            },
            leftPriceScale: {
                visible: true,
                minimumWidth: 50,
                borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                scaleMargins: { top: 0.70, bottom: 0.00 },
            },
            timeScale: {
                rightOffset: 20,
                borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                timeVisible: true,
                secondsVisible: false,
                tickMarkFormatter: (time, tickMarkType) => {
                    let date;
                    if (typeof time === 'number') date = new Date(time * 1000);
                    else if (time.year) date = new Date(time.year, time.month - 1, time.day);
                    else if (typeof time === 'string') date = new Date(time);
                    else return '';
                    if (isNaN(date)) return '';

                    if (tickMarkType === 0) return date.getFullYear().toString();
                    if (tickMarkType === 1) return date.toLocaleString('en-US', { month: 'short' });
                    if (tickMarkType === 2) return date.toLocaleString('en-US', { day: 'numeric', month: 'short' });
                    if (tickMarkType === 3 || tickMarkType === 4) return date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    return date.toLocaleString('en-US', { day: 'numeric', month: 'short' });
                }
            },
        });

        chartRef.current = chart;

        // ── Future Vision Ghost Candle Series (Inserted here so it draws under main candles) ──
        ghostCandleSeriesRef.current = chart.addSeries(CandlestickSeries, {
            upColor:         'rgba(16, 185, 129, 0.42)', 
            downColor:       'rgba(244, 63, 94, 0.42)',            
            borderVisible:   true,
            borderUpColor:   '#10b981',
            borderDownColor: '#f43f5e',
            wickUpColor:     '#34d399',
            wickDownColor:   '#fb7185',
            priceLineVisible:      false,
            lastValueVisible:      false,
            crosshairMarkerVisible: false,
        });

        ghostUpperConeRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(52, 211, 153, 0.65)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        ghostLowerConeRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(251, 113, 133, 0.65)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
            upColor: 'rgba(38, 166, 154, 0.92)', 
            downColor: 'rgba(239, 83, 80, 0.92)', 
            borderVisible: true,
            borderUpColor: '#26a69a',
            borderDownColor: '#ef5350',
            wickUpColor: '#26a69a', 
            wickDownColor: '#ef5350', 
            priceLineVisible: true,
        });

        volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
            color: '#26a69a', 
            priceScaleId: 'left',
            lastValueVisible: false, 
            priceLineVisible: false,
            priceFormat: {
                type: 'custom',
                minMove: 0.01,
                formatter: (price) => {
                    // Physically calculate the exact price at the 50% height mark of the screen
                    if (chartContainerRef.current && volumeSeriesRef.current) {
                        const h = chartContainerRef.current.clientHeight;
                        const priceAtHalf = volumeSeriesRef.current.coordinateToPrice(h / 2);
                        // The volume scale goes from highest at the top to lowest at the bottom.
                        // If the current price is greater than the price at the halfway mark, 
                        // it means it physically sits in the top half of the screen. Hide it!
                        if (priceAtHalf !== null && price > priceAtHalf) {
                            return '';
                        }
                    }
                    
                    if (price <= 0) return '';
                    if (price >= 1000000000) return (price / 1000000000).toFixed(1) + 'B';
                    if (price >= 1000000) return (price / 1000000).toFixed(1) + 'M';
                    if (price >= 1000) return (price / 1000).toFixed(1) + 'K';
                    return price.toString();
                }
            }
        });
        chart.priceScale('left').applyOptions({ 
            scaleMargins: { top: 0.65, bottom: 0 },
            minimumWidth: 50,
            visible: true,
        });

        undervaluedSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(34,197,94,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false,
        });
        fairValueSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(255,255,255,0.5)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
        });
        overvaluedSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(239,68,68,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false,
        });

        // Supertrend Series
        supertrendUpSeriesRef.current = chart.addSeries(LineSeries, {
            color: '#34d399', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });
        supertrendDownSeriesRef.current = chart.addSeries(LineSeries, {
            color: '#f87171', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });
        
        // VWAP Series
        vwapSeriesRef.current = chart.addSeries(LineSeries, {
            color: '#f59e0b', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });

        // EMA Series
        ema9SeriesRef.current = chart.addSeries(LineSeries, {
            color: '#3b82f6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });
        ema21SeriesRef.current = chart.addSeries(LineSeries, {
            color: '#8b5cf6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });

        // CPR Series
        cprTcSeriesRef.current = chart.addSeries(LineSeries, {
            color: '#94a3b8', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });
        cprPivotSeriesRef.current = chart.addSeries(LineSeries, {
            color: '#60a5fa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });
        cprBcSeriesRef.current = chart.addSeries(LineSeries, {
            color: '#94a3b8', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });

        // Advanced Indicators — Adaptive Bands (outer + middle + inner)
        // Colors are overridden per-mode in the useEffect
        bandOuterUpperRef.current = chart.addSeries(LineSeries, { color: '#fbbf24', lineWidth: 1, lineStyle: 0, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        bandOuterLowerRef.current = chart.addSeries(LineSeries, { color: '#fbbf24', lineWidth: 1, lineStyle: 0, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        bandMiddleRef.current     = chart.addSeries(LineSeries, { color: '#fbbf24', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        bandInnerUpperRef.current = chart.addSeries(LineSeries, { color: '#fbbf2466', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        bandInnerLowerRef.current = chart.addSeries(LineSeries, { color: '#fbbf2466', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

        psarRef.current = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 2, lineStyle: 3, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

        ichimokuTenkanRef.current = chart.addSeries(LineSeries, { color: '#0ea5e9', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        ichimokuKijunRef.current = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        ichimokuSpanARef.current = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        ichimokuSpanBRef.current = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

        anchoredVwapRef.current = chart.addSeries(LineSeries, { color: '#fb923c', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth || 600,
                    height: chartContainerRef.current.clientHeight || 350,
                });
                updatePaneTopsRef.current?.();
            }
        };
        const observer = new ResizeObserver(handleResize);
        if (chartContainerRef.current) observer.observe(chartContainerRef.current);
        window.addEventListener('resize', handleResize);

        const handleCrosshairMove = (param) => {
            if (param.time) {
                hoveredTimeRef.current = param.time;
            } else {
                hoveredTimeRef.current = null;
            }
            
            // Native OHLC
            if (param.time && param.point && candleSeriesRef.current && param.seriesData.get(candleSeriesRef.current)) {
                const d = param.seriesData.get(candleSeriesRef.current);
                const volData = volumeSeriesRef?.current ? param.seriesData.get(volumeSeriesRef.current) : null;
                setCrosshairData({ 
                    open: d.open, 
                    high: d.high, 
                    low: d.low, 
                    close: d.close,
                    volume: volData?.value ?? null
                });
            } else {
                setCrosshairData(null);
            }

            // Sub-pane oscillator crosshair readouts
            if (param.time && param.point) {
                const rVal = rsiRef.current ? param.seriesData.get(rsiRef.current)?.value : null;
                const mVal = macdLineRef.current ? param.seriesData.get(macdLineRef.current)?.value : null;
                const sVal = signalLineRef.current ? param.seriesData.get(signalLineRef.current)?.value : null;
                const hVal = macdHistRef.current ? param.seriesData.get(macdHistRef.current)?.value : null;
                setOscillatorHover({
                    rsi: rVal ?? null,
                    macd: mVal ?? null,
                    signal: sVal ?? null,
                    hist: hVal ?? null
                });
            } else {
                setOscillatorHover({ rsi: null, macd: null, signal: null, hist: null });
            }
            
            // Ghost PAE / AI Reference Tooltip
            if (param.time && param.point && ghostCandleSeriesRef.current && param.seriesData.get(ghostCandleSeriesRef.current)) {
                const gData = param.seriesData.get(ghostCandleSeriesRef.current);
                const paramKey = normalizeTimeKey(param.time);
                const effectiveLive = demoLiveCandleRef.current || liveCandleRef.current;
                const isLiveBar = effectiveLive && normalizeTimeKey(effectiveLive.time) === paramKey;
                
                // Real candle: check candle series directly, then live bar, then historical array
                const realFromSeries = candleSeriesRef.current ? param.seriesData.get(candleSeriesRef.current) : null;
                const allReal = [...(dataRef.current || []), ...(demoRealCandlesRef.current || [])];
                const realCandle = realFromSeries || (isLiveBar ? effectiveLive : allReal.find(c => normalizeTimeKey(c.time) === paramKey));

                // A marker from ghostMarkersRef
                const gMarker = (realCandle || isLiveBar)
                    ? ghostMarkersRef.current.find(m => normalizeTimeKey(m.time) === paramKey)
                    : null;

                // Lookup original unpadded ghost candle from active session to ensure mathematical consistency with chart markers
                let rawGhost = null;
                if (fvSessionRef.current?.times && fvSessionRef.current?.candles) {
                    const idx = fvSessionRef.current.times.findIndex(t => normalizeTimeKey(t) === paramKey);
                    if (idx !== -1) {
                        rawGhost = fvSessionRef.current.candles[idx];
                    }
                }
                const ghostForEval = rawGhost || gData;

                if (realCandle && ghostForEval && ghostForEval.open !== undefined) {
                    const instEval = calculateInstitutionalCandleError(ghostForEval, realCandle);
                    const rClose = Number(realCandle?.close ?? ghostForEval.close);
                    const gClose = Number(ghostForEval.close);
                    const diff = gClose - rClose;
                    const diffSign = diff >= 0 ? '+' : '';

                    // Use canonical error % from marker if present, guaranteeing 100% sync
                    const errNum = gMarker?.text ? parseInt(gMarker.text, 10) : instEval.errorPct;
                    const errColor = gMarker?.color || instEval.color;
                    const titleLabel = isLiveBar ? 'Live Drift' : 'Forecast Error';

                    setGhostTooltip({
                        x: param.point.x,
                        y: param.point.y,
                        title: titleLabel,
                        text: `${errNum}% | FC: ${gClose.toFixed(2)} | Real: ${rClose.toFixed(2)} (${diffSign}${diff.toFixed(2)})`,
                        color: errColor
                    });
                } else if (ghostForEval && ghostForEval.open !== undefined) {
                    // Pure future forecast candle (not yet formed)
                    const isUp = ghostForEval.close >= ghostForEval.open;
                    setGhostTooltip({
                        x: param.point.x,
                        y: param.point.y,
                        title: isUp ? 'AI Forecast (Bullish)' : 'AI Forecast (Bearish)',
                        text: `O: ${Number(ghostForEval.open).toFixed(2)}  H: ${Number(ghostForEval.high).toFixed(2)}  L: ${Number(ghostForEval.low).toFixed(2)}  C: ${Number(ghostForEval.close).toFixed(2)}`,
                        color: isUp ? '#10b981' : '#f43f5e'
                    });
                } else {
                    setGhostTooltip(null);
                }
            } else {
                setGhostTooltip(null);
            }
        };
        chart.subscribeCrosshairMove(handleCrosshairMove);

        return () => {
            chart.unsubscribeCrosshairMove(handleCrosshairMove);
            window.removeEventListener('resize', handleResize);
            if (chartContainerRef.current) observer.unobserve(chartContainerRef.current);
            ghostMarkersPluginRef.current = null;
            patternMarkersPluginRef.current = null;
            chart.remove();
            chartRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!chartRef.current) return;
        const chart = chartRef.current;
        const _isLight = theme === 'light';
        chart.applyOptions({
            layout: { textColor: _isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)' },
            watermark: { visible: false },
            grid: {
                vertLines: { color: _isLight ? 'rgba(0, 0, 0, 0.09)' : 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: _isLight ? 'rgba(0, 0, 0, 0.09)' : 'rgba(255, 255, 255, 0.05)' },
            },
            crosshair: {
                vertLine: { 
                    color: _isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                    labelBackgroundColor: _isLight ? '#4b5563' : '#4b5563'
                },
                horzLine: { 
                    color: _isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                    labelBackgroundColor: _isLight ? '#4b5563' : '#4b5563'
                },
            },
            panes: {
                separatorColor: _isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                separatorHoverColor: 'rgba(59, 130, 246, 0.6)',
            },
            rightPriceScale: { borderColor: _isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' },
            leftPriceScale: { borderColor: _isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' },
            timeScale: { borderColor: _isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' },
        });
    }, [theme]);

    // Live update for the latest candle without redrawing the whole chart
    useEffect(() => {
        if (!candleSeriesRef.current || !liveCandle) return;
        try {
            candleSeriesRef.current.update(liveCandle);
            if (volumeSeriesRef.current) {
                volumeSeriesRef.current.update({
                    time: liveCandle.time,
                    value: liveCandle.volume || 0,
                    color: liveCandle.close >= liveCandle.open ? 'rgba(38,166,154,0.22)' : 'rgba(239,83,80,0.22)'
                });
            }

            // Also keep Pattern Engine strictly in sync with the live tick
            if (data && data.length > 0) {
                const latestData = [...data];
                const liveMatchIdx = latestData.findIndex(c => c.time === liveCandle.time);
                if (liveMatchIdx !== -1) latestData[liveMatchIdx] = liveCandle;
                else latestData.push(liveCandle);

                const newPScore = analyzeChartPatterns(latestData, bandsModeTheme);
                setPatternScore(prev => {
                    const isSame = prev && prev.activePatterns?.length === newPScore.activePatterns?.length &&
                                   prev.activePatterns.every((p, i) => p.id === newPScore.activePatterns[i].id && p.age === newPScore.activePatterns[i].age);
                    return isSame ? prev : newPScore;
                });
            }
        } catch (e) {
            // Ignore error if live tick is older than our latest historical candle
        }
    }, [liveCandle]);

    // ── Future Vision: PAE Scoring on live bar close ────────────────────────────
    // When FV is active and a new live tick arrives, score closed bars and show live drift
    // ONLY on the candle that is currently forming right now.
    useEffect(() => {
        const effectiveLiveCandle = demoLiveCandle || liveCandle;
        if (!fvActive || !effectiveLiveCandle || !fvSessionRef.current) return;

        const session = fvSessionRef.current;
        let barIdx  = fvLiveBarIndexRef.current;

        const getMs = (t) => {
            if (!t) return 0;
            if (typeof t === 'number') return t < 10000000000 ? t * 1000 : t;
            if (typeof t === 'string') return new Date(t).getTime();
            if (t?.year) return new Date(t.year, t.month - 1, t.day).getTime();
            return 0;
        };

        const liveMs = getMs(effectiveLiveCandle.time);
        const liveKey = normalizeTimeKey(effectiveLiveCandle.time);

        // 1. Process all bars whose time has PASSED (bar has closed)
        while (barIdx < session.candles.length) {
            const expectedTime = session.times[barIdx];
            const expMs = getMs(expectedTime);
            const expKey = normalizeTimeKey(expectedTime);

            // The bar has closed if live time is strictly after this bar's expected time
            const isClosed = (liveMs > expMs && liveKey !== expKey);
            if (!isClosed) break;

            // Find the actual closed real candle that traded during this bar
            let realClosed = null;
            if (data && data.length > 0) {
                realClosed = data.find(c => normalizeTimeKey(c.time) === expKey);
            }
            if (!realClosed && demoRealCandles && demoRealCandles.length > 0) {
                realClosed = demoRealCandles.find(c => normalizeTimeKey(c.time) === expKey);
            }
            if (!realClosed && lastLiveCandleRef.current && normalizeTimeKey(lastLiveCandleRef.current.time) === expKey) {
                realClosed = lastLiveCandleRef.current;
            }

            if (realClosed) {
                const currentGhost = session.candles[barIdx];
                const barScore = scoreClosedCandle(
                    session.instrumentKey,
                    session.timeframe,
                    barIdx,
                    realClosed
                );

                if (barScore && currentGhost) {
                    const instEval = calculateInstitutionalCandleError(currentGhost, realClosed);

                    const finalMarker = {
                        time: realClosed.time,
                        position: 'aboveBar',
                        color: instEval.color,
                        shape: 'arrowDown',
                        text: `${instEval.errorPct}%`,
                        size: 1
                    };
                    const filtered = ghostMarkersRef.current.filter(m => normalizeTimeKey(m.time) !== expKey);
                    updateGhostMarkers([...filtered, finalMarker]);

                    const paeSession = getPAESession(session.instrumentKey, session.timeframe);
                    setFvPAE(paeSession);

                    postPACEScore(barScore, realClosed);

                    if (ghostCandleSeriesRef.current && session.candles[barIdx]) {
                        _renderGhostCandles(session.candles, session.times, true);
                    }
                }
            }

            barIdx++;
            fvLiveBarIndexRef.current = barIdx;
        }

        // Keep fvHasFutureCandles strictly in sync: are there any candles still in the future?
        const hasRemainingFuture = session.times.slice(barIdx).some(t => getMsTimestamp(t) > liveMs);
        setFvHasFutureCandles(hasRemainingFuture);

        // 2. REAL-TIME ERR% MARKER: ONLY for the candle forming right now
        if (barIdx < session.candles.length) {
            const expectedTime = session.times[barIdx];
            const expKey = normalizeTimeKey(expectedTime);

            // Strictly guard: live candle MUST match the expected bar's timestamp
            if (liveKey === expKey) {
                const currentGhost = session.candles[barIdx];
                if (currentGhost && !currentGhost.deleted && candleSeriesRef.current) {
                    const instEval = calculateInstitutionalCandleError(currentGhost, effectiveLiveCandle);

                    const liveMarker = {
                        time: effectiveLiveCandle.time,
                        position: 'aboveBar',
                        color: instEval.color,
                        shape: 'arrowDown',
                        text: `${instEval.errorPct}%`,
                        size: 1
                    };

                    const filtered = ghostMarkersRef.current.filter(m => normalizeTimeKey(m.time) !== expKey);
                    updateGhostMarkers([...filtered, liveMarker]);

                    storeLiveErrors(
                        session.instrumentKey || instrumentKey,
                        session.timeframe || timeframe,
                        barIdx,
                        instEval.details.priceError,
                        effectiveLiveCandle,
                        currentGhost,
                        instEval.errorPct
                    );
                }
            } else {
                // If live candle has NOT reached this expectedTime (future bar),
                // remove any stale marker from this future slot!
                const nextMarkers = ghostMarkersRef.current.filter(m => normalizeTimeKey(m.time) !== expKey);
                updateGhostMarkers(nextMarkers);
            }
        }

        lastLiveCandleRef.current = effectiveLiveCandle;
    }, [liveCandle, demoLiveCandle, fvActive, data, demoRealCandles, updateGhostMarkers]);

    // ── Future Vision: Continuous Auto-Generation on Candle Close / Rollover ───────
    const lastAutoHistoricalCandleRef = useRef(null);
    const lastAutoLiveCandleTimeRef = useRef(null);
    const fvTriggerInProgressRef = useRef(false);

    useEffect(() => {
        if (!fvAutoMode || !data || data.length === 0) return;

        const lastBar = data[data.length - 1];
        if (!lastBar) return;

        const lastKey = normalizeTimeKey(lastBar.time);

        // Initial setup on mount or instrument/timeframe change
        if (lastAutoHistoricalCandleRef.current === null) {
            lastAutoHistoricalCandleRef.current = lastKey;
            // If future vision is not active or has no future candles left, run initial prediction
            if (!fvActive || !fvHasFutureCandles) {
                if (!fvLoading && !fvTriggerInProgressRef.current) {
                    fvTriggerInProgressRef.current = true;
                    triggerFutureVision(false).finally(() => {
                        fvTriggerInProgressRef.current = false;
                    });
                }
            }
            return;
        }

        // Detect new historical bar completion (e.g. 5m / 15m / 1D bar closed and new bar added)
        if (lastKey !== lastAutoHistoricalCandleRef.current) {
            console.log(`[FutureVision Auto] Candle closed: ${lastAutoHistoricalCandleRef.current} -> ${lastKey}. Triggering auto-prediction.`);
            lastAutoHistoricalCandleRef.current = lastKey;
            if (!fvLoading && !fvTriggerInProgressRef.current) {
                fvTriggerInProgressRef.current = true;
                triggerFutureVision(false).finally(() => {
                    fvTriggerInProgressRef.current = false;
                });
            }
        }
    }, [data?.length, data && data[data.length - 1]?.time, fvAutoMode, fvActive, fvHasFutureCandles, fvLoading]);

    // Detect live streaming bar time rollover (e.g., tick advances to next candle timestamp)
    useEffect(() => {
        if (!fvAutoMode) return;
        const effectiveLive = demoLiveCandle || liveCandle;
        if (!effectiveLive?.time) return;

        const liveKey = normalizeTimeKey(effectiveLive.time);
        if (lastAutoLiveCandleTimeRef.current && lastAutoLiveCandleTimeRef.current !== liveKey) {
            console.log(`[FutureVision Auto] Live streaming bar rolled over: ${lastAutoLiveCandleTimeRef.current} -> ${liveKey}. Triggering auto-prediction.`);
            lastAutoLiveCandleTimeRef.current = liveKey;
            if (!fvLoading && !fvTriggerInProgressRef.current) {
                fvTriggerInProgressRef.current = true;
                triggerFutureVision(false).finally(() => {
                    fvTriggerInProgressRef.current = false;
                });
            }
        } else if (!lastAutoLiveCandleTimeRef.current) {
            lastAutoLiveCandleTimeRef.current = liveKey;
        }
    }, [liveCandle?.time, demoLiveCandle?.time, fvAutoMode, fvLoading]);

    // ── Ghost Candle & Uncertainty Cone Clean Clearing ───────────────────────────
    const _clearGhostSeries = () => {
        if (ghostCandleSeriesRef.current) ghostCandleSeriesRef.current.setData([]);
        if (ghostUpperConeRef.current) ghostUpperConeRef.current.setData([]);
        if (ghostLowerConeRef.current) ghostLowerConeRef.current.setData([]);
    };

    // ── Ghost Candle Renderer ────────────────────────────────────────────────────
    const _renderGhostCandles = (candles, times, withPAEDimming) => {
        if (!ghostCandleSeriesRef.current) return;
        if (!candles?.length || !times?.length) {
            _clearGhostSeries();
            return;
        }

        // Calculate average candle range and body from recent real candles to guarantee authentic size & shape
        const recentCandles = data && data.length > 0 ? data.slice(-20) : [];
        const avgRange = recentCandles.length > 0
            ? recentCandles.reduce((acc, bar) => acc + Math.max(bar.high - bar.low, 0.01), 0) / recentCandles.length
            : (data?.[data.length - 1]?.close * 0.004) || 2;
        const avgBody = recentCandles.length > 0
            ? recentCandles.reduce((acc, bar) => acc + Math.abs(bar.close - bar.open), 0) / recentCandles.length
            : avgRange * 0.6;
        
        // Realistic minimums so predicted candles never collapse into flat "+" signs or distorted shapes
        const minBody = Math.max(avgBody * 0.4, 0.2);
        const minWick = Math.max(avgRange * 0.15, 0.1);

        const getMs = (t) => {
            if (!t) return 0;
            if (typeof t === 'number') return t < 10000000000 ? t * 1000 : t;
            if (typeof t === 'string') return new Date(t).getTime();
            if (t?.year) return new Date(t.year, t.month - 1, t.day).getTime();
            return 0;
        };

        // Build set of all real candle timestamps (including demo candles and live streaming candle)
        const realCandles = [...(data || []), ...(demoRealCandles || [])];
        if (liveCandle) realCandles.push(liveCandle);

        const realTimeSet = new Set(realCandles.map(c => normalizeTimeKey(c.time)));
        const lastRealMs = realCandles.length > 0 ? getMs(realCandles[realCandles.length - 1].time) : 0;

        const isDailyOrAbove = typeof (data?.[data.length - 1]?.time) !== 'number';
        const TF_SECONDS = {
            '1m': 60, '1minute': 60, '3m': 180, '3minute': 180, '5m': 300, '5minute': 300,
            '10m': 600, '10minute': 600, '15m': 900, '15minute': 900, '30m': 1800, '30minute': 1800,
            '1h': 3600, '60m': 3600, '1hour': 3600,
        };
        const barSize = TF_SECONDS[timeframe] || 900;
        const lastCandleTime = realCandles.length > 0 ? realCandles[realCandles.length - 1].time : null;
        const healedTimes = healFutureCandleTimes(times, lastCandleTime, barSize, isDailyOrAbove);

        let lastValidTime = 0;

        let ghostData = candles
            .map((c, i) => {
                if (!c || c.deleted) return null;

                let open  = Number(c.open)  || 0;
                let close = Number(c.close) || 0;
                let high  = Number(c.high)  || 0;
                let low   = Number(c.low)   || 0;

                if (open <= 0 && close <= 0) return null;

                // Ensure authentic body height matching real candles (prevents flat horizontal plus marks)
                if (Math.abs(close - open) < minBody) {
                    const isBull = c.direction === 'bullish' || close >= open;
                    if (isBull) {
                        close = Number((open + minBody).toFixed(2));
                    } else {
                        close = Number((open - minBody).toFixed(2));
                    }
                }

                // Ensure authentic upper and lower wicks matching real candles
                const bodyMax = Math.max(open, close);
                const bodyMin = Math.min(open, close);
                high = Math.max(high, Number((bodyMax + minWick).toFixed(2)));
                low  = Math.min(low,  Number((bodyMin - minWick).toFixed(2)));

                const candleTime = healedTimes[i] ?? times[i];
                const timeKey = normalizeTimeKey(candleTime);
                const candleMs = getMs(candleTime);

                // Detect if a real candle is rendering above this ghost candle
                const isOverlappedByReal = realTimeSet.has(timeKey) || (lastRealMs > 0 && candleMs <= lastRealMs);
                const isUp = close >= open;

                let candleColor, borderColor, wickColor;

                if (isOverlappedByReal) {
                    // ── BACKGROUND REFERENCE CANDLE MODE ──
                    // Real market candle renders on top. Predicted candle acts as an underlying reference watermark.
                    if (isUp) {
                        candleColor = 'rgba(16, 185, 129, 0.16)'; // Soft translucent emerald watermark
                        borderColor = 'rgba(16, 185, 129, 0.45)'; // Subtle neon emerald outline
                        wickColor   = 'rgba(52, 211, 153, 0.45)'; // Subtle mint wick
                    } else {
                        candleColor = 'rgba(244, 63, 94, 0.16)';  // Soft translucent ruby-rose watermark
                        borderColor = 'rgba(244, 63, 94, 0.45)';  // Subtle neon rose outline
                        wickColor   = 'rgba(251, 113, 133, 0.45)'; // Subtle coral wick
                    }
                } else {
                    // ── ACTIVE FUTURE FORECAST CANDLE MODE ──
                    // Top-notch institutional dual-color palette matching platform design language:
                    // Luminous Translucent Emerald (Bullish) vs Vibrant Electric Ruby-Rose (Bearish)
                    if (isUp) {
                        candleColor = 'rgba(16, 185, 129, 0.42)'; // Luminous translucent emerald body
                        borderColor = '#10b981';                  // Crisp vibrant emerald border
                        wickColor   = '#34d399';                  // High-visibility mint/emerald wick
                    } else {
                        candleColor = 'rgba(244, 63, 94, 0.42)';  // Luminous translucent ruby-rose body
                        borderColor = '#f43f5e';                  // Crisp vibrant ruby-rose border
                        wickColor   = '#fb7185';                  // High-visibility coral/rose wick
                    }
                }

                return {
                    time:  candleTime,
                    open,
                    high,
                    low,
                    close,
                    color: candleColor,
                    borderColor: borderColor,
                    wickColor: wickColor,
                };
            })
            .filter(Boolean)
            .filter(c => c.time != null && c.open > 0);

        // Lightweight Charts FATAL ERROR FIX:
        // Times MUST be strictly increasing
        ghostData = ghostData.filter(c => {
            const currMs = getMs(c.time);
            const prevMs = getMs(lastValidTime);

            if (currMs > prevMs) {
                lastValidTime = c.time;
                return true;
            }
            return false;
        });

        if (!ghostData.length) {
            console.warn('[FutureVision] No valid ghost candles to render after strictly increasing filter. Clearing ghost series.');
            ghostCandleSeriesRef.current.setData([]);
            if (ghostUpperConeRef.current) ghostUpperConeRef.current.setData([]);
            if (ghostLowerConeRef.current) ghostLowerConeRef.current.setData([]);
            return;
        }

        console.log('[FutureVision] Rendering ghost candles:', ghostData.length, 'candles. First time:', ghostData[0]?.time);
        ghostCandleSeriesRef.current.setData(ghostData);
        if (ghostUpperConeRef.current) {
            const upperCone = ghostData.map(c => ({
                time: c.time,
                value: c.q90 !== undefined ? c.q90 : (c.quantiles?.close?.q90 ?? c.high)
            }));
            ghostUpperConeRef.current.setData(upperCone);
        }
        if (ghostLowerConeRef.current) {
            const lowerCone = ghostData.map(c => ({
                time: c.time,
                value: c.q10 !== undefined ? c.q10 : (c.quantiles?.close?.q10 ?? c.low)
            }));
            ghostLowerConeRef.current.setData(lowerCone);
        }
    };

    // ──────────────── Hierarchical AI Prerequisite Check ────────────────────────────────
    const isIndexSymbol = instrumentKey.startsWith('NSE_INDEX|');
    
    let cleanSymbol = instrumentKey.split('|').pop() || instrumentKey;
    const match = FO_EQUITIES.find(e => e.value === instrumentKey) || FO_INDICES.find(i => i.value === instrumentKey);
    if (match) cleanSymbol = match.label;
    const reqIds = [
        { id: isIndexSymbol ? 'fundamentals_index_header' : 'fundamentals_company_header', name: 'Fundamentals' },
        { id: isIndexSymbol ? 'technical_index_header' : 'technical_company_header', name: 'Technical' },
        { id: 'options_header', name: 'Options' },
        { id: 'events_header', name: 'Events' },
        { id: 'foreign_header', name: 'Global' }
    ];
    
    const globalCache = getGlobalInsightCache();
    const fvIssues = [];
    let aiNarratives = {};

    if (!fvActive) {
        for (const req of reqIds) {
            let symbolSuffix = cleanSymbol;
            if (req.id === 'foreign_header') symbolSuffix = 'GLOBAL';
            if (req.id === 'events_header') symbolSuffix = 'EVENTS';

            const key = `${req.id}_${symbolSuffix}`;
            const entry = globalCache[key];
            if (!entry) {
                fvIssues.push(`• ${req.name} — missing`);
            } else if (Date.now() - entry.timestamp > 12 * 60 * 1000) {
                const mins = Math.floor((Date.now() - entry.timestamp) / 60000);
                fvIssues.push(`• ${req.name} — ${mins} min${mins !== 1 ? 's' : ''} old`);
                aiNarratives[req.name] = entry.insightText;
            } else {
                aiNarratives[req.name] = entry.insightText;
            }
        }
    }

            // TEMPORARY TESTING OVERRIDE
    const handleTestFutureVision = () => {
        if (!fvSessionRef.current || !data || data.length === 0) {
            import('sonner').then(({ toast }) => toast.error('Generate a prediction first!'));
            return;
        }
        
        let count = 0;
        const interval = setInterval(() => {
            if (count >= 7 || count >= fvSessionRef.current.candles.length) {
                clearInterval(interval);
                return;
            }
            
            // EXACT TIMESTAMPS: Draw exactly over the ghost candle's timeframe!
            const newTime = fvSessionRef.current.times[count];
            const predicted = fvSessionRef.current.candles[count];
            
            count++;
            
            if (!predicted || !newTime) return;
            
            // Jitter the OHLC by a realistic tiny fraction (e.g. 0.05% to 0.15%)
            // so the candles look like real candles, just slightly missing the prediction.
            const jitter = 1 + ((Math.random() - 0.5) * 0.003); 
            
            const tick = {
                time: newTime,
                open: predicted.open * jitter,
                high: predicted.high * jitter,
                low: predicted.low * jitter,
                close: predicted.close * jitter
            };
            window.dispatchEvent(new CustomEvent(`liveCandleUpdate_${instrumentKey}`, { detail: tick }));
        }, 1500);
    };

    const fvStaleMsg = fvIssues.length > 0
        ? `AI summaries need attention:\n${fvIssues.join('\n')}`
        : null;


    // ── Future Vision: Trigger Function ─────────────────────────────────────────
    const triggerFutureVision = async (isOptimize = false) => {
        if (fvLoading) return;

        

        if (fvStaleMsg && !fvIgnoreStaleRef.current && !fvAutoMode) {
            import('sonner').then(({ toast }) => {
                const lines = fvIssues;
                toast.warning('Future Vision — AI Summaries Needed', {
                    description: lines.join('\n'),
                    duration: 10000,
                    action: {
                        label: 'Ignore & Run',
                        onClick: () => {
                            fvIgnoreStaleRef.current = true;
                            triggerFutureVision(isOptimize);
                        }
                    }
                });
            });
            return;
        }

        if (!data || data.length === 0) return;

        setFvLoading(true);
        try {
            const fvSettings = getFVSettings();
            const horizonBars = fvSettings.horizonBars;
            const ohlcvBars   = fvSettings.ohlcvBars ?? 50;

            const masterSnapshot = getMasterSnapshot();
            const registryTechnicals = masterSnapshot.technical || {};
            let registryFundamentals = masterSnapshot.fundamentals || {};

            // Direct sync of 10-year financial statements for Future Vision
            try {
                const cachedScreener = localStorage.getItem(`praxis_screener_${instrumentKey}`) 
                    || localStorage.getItem(`praxis_screener_${cleanSymbol}`) 
                    || localStorage.getItem('praxis_screener_latest');
                if (cachedScreener) {
                    const parsed = JSON.parse(cachedScreener);
                    if (parsed.financials10Year) {
                        registryFundamentals = { 
                            ...registryFundamentals, 
                            financials10Year: parsed.financials10Year,
                            screener: parsed
                        };
                    }
                }
            } catch (e) {}

            const resolvedEvents = events || [];

            // Compile active indicator overlays state from chart
            const activeOverlays = {
                supertrend: {
                    enabled: showSupertrend,
                    value: confluenceData?.supertrendLevel ?? null,
                    signal: confluenceData?.supertrendDir ?? null
                },
                vwap: {
                    enabled: showVWAP,
                    value: confluenceData?.vwap ?? null
                },
                ema: {
                    enabled: showEMA,
                    fast: confluenceData?.ema9 ?? null,
                    slow: confluenceData?.ema21 ?? null,
                    trend: (confluenceData?.ema9 != null && confluenceData?.ema21 != null) 
                        ? (confluenceData.ema9 >= confluenceData.ema21 ? 'BULLISH CROSSOVER (EMA9 > EMA21)' : 'BEARISH CROSSOVER (EMA9 < EMA21)')
                        : null
                },
                cpr: {
                    enabled: showCPR
                },
                adaptiveBands: {
                    enabled: showAdaptiveBands,
                    mode: bandsMode
                },
                macd: {
                    enabled: showMACD,
                    line: latestOscillatorsRef.current?.macd ?? null,
                    signal: latestOscillatorsRef.current?.signal ?? null,
                    hist: latestOscillatorsRef.current?.hist ?? null
                },
                rsi: {
                    enabled: showRSI,
                    value: confluenceData?.rsi ?? null
                },
                psar: {
                    enabled: showPSAR
                },
                ichimoku: {
                    enabled: showIchimoku
                },
                autoFib: {
                    enabled: showAutoFib
                }
            };

            // Assemble payload using the pre-digested AI narratives, user chart drawings & overlays
            const contextPayload = assembleContext({
                ohlcv:         data,
                instrumentKey,
                symbol:        instrumentKey.split('|').pop() || instrumentKey,
                timeframe,
                tradingMode:   tradingMode || 'swing',
                indicators:    registryTechnicals,
                fundamentals:  registryFundamentals,
                events:        resolvedEvents,
                horizonBars,
                ohlcvBars,
                aiNarratives,
                isAutoRefresh: fvActive && fvAutoMode,
                calibrationProfile: paceProfileRef.current,
                analystBrief: analystBriefRef.current,
                patternScore: patternScore,
                drawings:      drawings || [],
                activeOverlays,
                masterSnapshot
            });


            // Debug log — visible in browser console to verify all data is populated
            console.groupCollapsed('[FutureVision] Context Payload Preview');
            console.log('Indicators snapshot:', registryTechnicals);
            console.log('Fundamentals (merged):', registryFundamentals);
            console.log('Events:', resolvedEvents);
            console.log('Master Registry pages:', Object.keys(masterSnapshot || {}));
            console.log('Payload length (chars):', contextPayload.length);
            console.groupEnd();

            // Format historical candles for local time-series foundation models (Kronos & Chronos-Bolt)
            const formattedCandles = (data || []).slice(-60).map(c => {
                let ts = null;
                if (typeof c.time === 'number') {
                    ts = new Date(c.time * 1000).toISOString();
                } else if (typeof c.time === 'string') {
                    ts = c.time;
                } else if (c.time?.year) {
                    ts = `${c.time.year}-${String(c.time.month).padStart(2, '0')}-${String(c.time.day).padStart(2, '0')}T00:00:00Z`;
                }
                return {
                    timestamp: ts,
                    open: Number(c.open) || 0,
                    high: Number(c.high) || 0,
                    low: Number(c.low) || 0,
                    close: Number(c.close) || 0,
                    volume: Number(c.volume) || 0
                };
            }).filter(c => c.open > 0 && c.close > 0);

            // Call backend
            const res = await axiosInstance.post('/api/v1/future-vision/predict', {
                contextPayload,
                instrumentKey,
                timeframe,
                horizonBars,
                candles: formattedCandles
            });

            let { candles, overall_bias, key_risk } = res.data;

            // Enrich ghost candles with calibrated quantiles for cone rendering
            candles = (candles || []).map((c, i) => {
                const eq = res.data.ensembleQuantiles?.[i] || res.data.quantiles;
                return {
                    ...c,
                    q10: c.q10 ?? eq?.close?.q10 ?? c.low,
                    q50: c.q50 ?? eq?.close?.q50 ?? c.close,
                    q90: c.q90 ?? eq?.close?.q90 ?? c.high
                };
            });

            const lastCandle = data && data.length > 0 ? data[data.length - 1] : null;

            // --- Institutional Bayesian-Kalman Blending ---
            // STRICT CONDITION: Only optimize/blend if explicitly requested AND there are actual unfulfilled future bars left!
            const oldSession = fvSessionRef.current;
            if (isOptimize && oldSession && oldSession.candles && oldSession.candles.length > 0) {
                const oldRemaining = oldSession.candles.slice(fvLiveBarIndexRef.current);
                if (oldRemaining.length > 0) {
                    const blended = blendRollingForecasts(oldRemaining, candles, {
                        skipRenderingCandle: false,
                        maxHorizon: horizonBars || candles.length || 7,
                        anchorPrice: lastCandle?.close
                    });
                    candles = blended;
                    import('sonner').then(({ toast }) => toast.success('Future Vision Optimized', { 
                        description: `Preserved active forecast; blended & smoothed ${blended.length} forecast bars.`, 
                        duration: 3500 
                    }));
                }
            }

            fvLiveBarIndexRef.current = 0;

            // Generate robust future market timestamps for ghost candles
            const times = [];
            const isDailyOrAbove = typeof lastCandle?.time !== 'number';

            if (isDailyOrAbove) {
                let date = typeof lastCandle.time === 'string' 
                    ? (() => { const [y, m, d] = lastCandle.time.split('T')[0].split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); })()
                    : new Date(lastCandle.time.year, lastCandle.time.month - 1, lastCandle.time.day);
                
                for (let i = 0; i < candles.length; i++) {
                    date = getNextTradingDay(date);
                    if (typeof lastCandle.time === 'string') {
                        times.push(formatDateKey(date));
                    } else {
                        times.push({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });
                    }
                }
            } else {
                const TF_SECONDS = {
                    '1m': 60, '1minute': 60,
                    '3m': 180, '3minute': 180,
                    '5m': 300, '5minute': 300,
                    '10m': 600, '10minute': 600,
                    '15m': 900, '15minute': 900,
                    '30m': 1800, '30minute': 1800,
                    '1h': 3600, '60m': 3600, '1hour': 3600,
                };
                let barSize = TF_SECONDS[timeframe] || 900;
                
                let currentTime = typeof lastCandle.time === 'number'
                    ? lastCandle.time
                    : Math.floor(new Date(lastCandle.time).getTime() / 1000);

                for (let i = 0; i < candles.length; i++) {
                    currentTime = getNextIntradayCandleTime(currentTime, barSize);
                    times.push(currentTime);
                }
            }

            // Store session for PAE
            storePrediction(instrumentKey, timeframe, tradingMode || 'swing', candles, overall_bias, key_risk, times, res.data.modelUsed);
            
            // Persist auto mode flag
            updatePAEAutoMode(instrumentKey, timeframe, fvAutoMode);

            // Fetch the continuous timeline (pruning stale unfulfilled ghost candles from older sessions)
            const allSessions = getAllPAESessions(instrumentKey, timeframe);
            const { candles: continuousCandles, times: continuousTimes } = buildContinuousTimeline(allSessions, lastCandle?.time);

            fvSessionRef.current = {
                candles: continuousCandles.length > 0 ? continuousCandles : candles,
                instrumentKey,
                timeframe,
                times: continuousTimes.length > 0 ? continuousTimes : times
            };

            // Render ghost candles across the full continuous timeline
            _renderGhostCandles(
                continuousCandles.length > 0 ? continuousCandles : candles,
                continuousTimes.length > 0 ? continuousTimes : times,
                false
            );

            // Immediately synchronize error markers for any historical ghost candles
            const effectiveData = [...(data || []), ...demoRealCandles];
            if (effectiveData.length > 0 && fvSessionRef.current) {
                syncFutureVisionWithData(effectiveData, fvSessionRef.current);
            }

            setFvBias(overall_bias || 'neutral');
            setFvRisk(key_risk || '');
            setFvModel(res.data.modelUsed);
            setFvActive(true);
            setFvHasFutureCandles(true);

            // Update Probabilistic Ensemble, Friction & Edge states
            if (res.data.quantiles) setFvQuantiles(res.data.quantiles);
            if (res.data.friction) setFvFriction(res.data.friction);
            if (res.data.edge) setFvEdge(res.data.edge);
            if (res.data.modelWeights) setFvModelWeights(res.data.modelWeights);
            if (res.data.activeModels) setFvActiveModels(res.data.activeModels);
            if (res.data.ensembleConfig?.weights) setFvEnsembleWeights(res.data.ensembleConfig.weights);
            if (res.data.conformalMultiplier) setFvConformalMultiplier(res.data.conformalMultiplier);
            if (res.data.volatility_regime) setFvRegime(res.data.volatility_regime);

            if (!isOptimize) {
                import('sonner').then(({ toast }) => {
                    toast.success(res.data.modelUsed ? `Forecast Complete: ${res.data.modelUsed}` : 'Future Vision Complete', {
                        description: `7 forward candles synthesized across local foundation models & AI reasoning.`,
                        duration: 4000
                    });
                });
            }

            if (res.data.fallbackTriggered) {
                import('sonner').then(({ toast }) => {
                    toast.warning(`Model Fallback: ${res.data.fallbackReason || 'Selected model failed'}. Used ${res.data.modelUsed} instead.`, { duration: 6000 });
                });
            }
        } catch (err) {
            console.error('[FutureVision] Error:', err);
            // Display the exact error from the backend so the user knows if the model hallucinated or failed
            const errorMsg = err.response?.data?.error || err.message || 'Prediction failed';
            import('sonner').then(({ toast }) => {
                toast.error(`Future Vision Error: ${errorMsg}`, { duration: 6000 });
            });
        } finally {
            setFvLoading(false);
        }
    };

    // ── Future Vision Toolbar Click Handler (Single-Click Predict/Optimize, Double-Click Auto Mode) ──
    const handleTelescopeClick = () => {
        if (fvLoading) return;

        // If Auto Mode is already active, clicking immediately turns it off
        if (fvAutoMode) {
            setFvAutoMode(false);
            updatePAEAutoMode(instrumentKey, timeframe, false);
            import('sonner').then(({ toast }) => toast.info('Future Vision Auto Mode disabled'));
            return;
        }

        if (fvClickTimerRef.current) {
            // Double-click detected: Toggle Auto Mode ON
            clearTimeout(fvClickTimerRef.current);
            fvClickTimerRef.current = null;
            setFvAutoMode(true);
            updatePAEAutoMode(instrumentKey, timeframe, true);
            import('sonner').then(({ toast }) => toast.success('Future Vision Auto Mode enabled', {
                description: 'AI will continuously refresh predictions on every candle close.'
            }));
            if (!fvActive || !fvHasFutureCandles) {
                triggerFutureVision(false);
            }
        } else {
            // First click: Start 260ms window to distinguish single click from double click
            fvClickTimerRef.current = setTimeout(() => {
                fvClickTimerRef.current = null;
                // STRICT RULE: Optimizing is only possible when there is at least one future candle remaining!
                // If all previous predictions have already received real candles, generate a fresh forecast forward.
                if (fvActive && fvHasFutureCandles) {
                    triggerFutureVision(true);
                } else {
                    triggerFutureVision(false);
                }
            }, 260);
        }
    };

    // ── Unified Future Vision Synchronization Helper ────────────────────────────
    const syncFutureVisionWithData = useCallback((realCandles, session) => {
        if (!realCandles || realCandles.length === 0 || !session?.times?.length) return;

        const getMs = (timeObj) => {
            if (!timeObj) return 0;
            if (typeof timeObj === 'number') return timeObj < 10000000000 ? timeObj * 1000 : timeObj;
            if (typeof timeObj === 'string') return new Date(timeObj).getTime();
            if (timeObj && timeObj.year) return new Date(timeObj.year, timeObj.month - 1, timeObj.day).getTime();
            return 0;
        };

        const lastRealMs = getMs(realCandles[realCandles.length - 1].time);

        // Sanitize stored scores to prune any phantom future scores from past runs
        sanitizePAESession(session.instrumentKey || instrumentKey, session.timeframe || timeframe, lastRealMs);

        let newIdx = 0;
        const restoredMarkers = [];

        for (let i = 0; i < session.times.length; i++) {
            const gTime = session.times[i];
            const gMs = getMs(gTime);
            const gKey = normalizeTimeKey(gTime);

            if (gMs <= lastRealMs) {
                newIdx = i + 1;
                const realCandle = realCandles.find(d => normalizeTimeKey(d.time) === gKey);
                const ghost = session.candles[i];
                if (realCandle && ghost && !ghost.deleted) {
                    const instEval = calculateInstitutionalCandleError(ghost, realCandle);

                    restoredMarkers.push({
                        time: realCandle.time,
                        position: 'aboveBar',
                        color: instEval.color,
                        shape: 'arrowDown',
                        text: `${instEval.errorPct}%`,
                        size: 1
                    });
                }
            }
        }

        fvLiveBarIndexRef.current = newIdx;

        // Strictly check if there are any unfulfilled ghost candles currently in the future
        const hasFuture = session.times.some(t => getMsTimestamp(t) > lastRealMs);
        setFvHasFutureCandles(hasFuture);

        _renderGhostCandles(
            session.candles, 
            session.times, 
            false
        );

        updateGhostMarkers(restoredMarkers);
    }, [instrumentKey, timeframe, updateGhostMarkers]);

    // Check for stored PAE session on mount or instrument/timeframe change
    useEffect(() => {
        if (!chartRef.current) return;
        const allSessions = getAllPAESessions(instrumentKey, timeframe);
        
        if (allSessions && allSessions.length > 0) {
            const effectiveData = [...(data || []), ...demoRealCandles];
            const lastRealTime = effectiveData.length > 0 ? effectiveData[effectiveData.length - 1].time : null;
            // Build a continuous, non-overlapping history of ghost candles (pruning stale unfulfilled ghost candles)
            const { candles: continuousCandles, times: continuousTimes } = buildContinuousTimeline(allSessions, lastRealTime);
            
            if (continuousCandles.length === 0) {
                setFvActive(false);
                setFvHasFutureCandles(false);
                const isAutoPersisted = (() => {
                    try { return localStorage.getItem('praxis_fv_auto_mode') === 'true'; } catch { return false; }
                })();
                setFvAutoMode(isAutoPersisted);
                setFvBias(null);
                setFvRisk('');
                setFvPAE(null);
                setFvModel(null);
                fvSessionRef.current = null;
                updateGhostMarkers([]);
                _clearGhostSeries();
                return;
            }

            const latestSession = allSessions[allSessions.length - 1];

            fvSessionRef.current = { 
                candles: continuousCandles, 
                instrumentKey: latestSession.instrumentKey || instrumentKey, 
                timeframe: latestSession.timeframe || timeframe, 
                times: continuousTimes 
            };
            
            setFvBias(latestSession.bias);
            setFvRisk(latestSession.risk || '');
            setFvModel(latestSession.modelUsed);
            setFvActive(true);
            const isAutoPersisted = (() => {
                try { return localStorage.getItem('praxis_fv_auto_mode') === 'true'; } catch { return false; }
            })();
            setFvAutoMode(isAutoPersisted || latestSession.autoMode || false);
            
            if (effectiveData.length > 0) {
                syncFutureVisionWithData(effectiveData, fvSessionRef.current);
            } else {
                _renderGhostCandles(continuousCandles, continuousTimes, false);
                const hasFuture = continuousTimes.some(t => getMsTimestamp(t) > getMsTimestamp(lastRealTime));
                setFvHasFutureCandles(hasFuture);
            }
            
            setFvPAE(getPAESession(instrumentKey, timeframe));
        } else {
            setFvActive(false);
            setFvHasFutureCandles(false);
            const isAutoPersisted = (() => {
                try { return localStorage.getItem('praxis_fv_auto_mode') === 'true'; } catch { return false; }
            })();
            setFvAutoMode(isAutoPersisted);
            setFvBias(null);
            setFvRisk('');
            setFvPAE(null);
            setFvModel(null);
            fvSessionRef.current = null;
            updateGhostMarkers([]);
            _clearGhostSeries();
        }
    }, [instrumentKey, timeframe, syncFutureVisionWithData, updateGhostMarkers]);

    // Handle Hide/Unhide toggle
    useEffect(() => {
        const isVisible = fvVisible && !isMultiMode;
        if (ghostCandleSeriesRef.current) {
            ghostCandleSeriesRef.current.applyOptions({ visible: isVisible });
        }
        if (ghostUpperConeRef.current) {
            ghostUpperConeRef.current.applyOptions({ visible: isVisible });
        }
        if (ghostLowerConeRef.current) {
            ghostLowerConeRef.current.applyOptions({ visible: isVisible });
        }
        if (ghostMarkersPluginRef.current) {
            ghostMarkersPluginRef.current.setMarkers(isVisible ? ghostMarkersRef.current : []);
        }
    }, [fvVisible, isMultiMode]);

    useEffect(() => {
        if (!candleSeriesRef.current || !volumeSeriesRef.current || !data || data.length === 0) return;
        
        const effectiveData = [...data, ...demoRealCandles];
        lastDataTimeRef.current = effectiveData[effectiveData.length - 1].time;
        
        candleSeriesRef.current.setData(effectiveData);
        
        // Analyze Patterns
        const pScore = analyzeChartPatterns(effectiveData, bandsModeTheme);
        setPatternScore(pScore);

        const volumeData = effectiveData.map(item => ({
            time: item.time, value: item.volume || 0,
            color: item.close >= item.open ? 'rgba(38,166,154,0.22)' : 'rgba(239,83,80,0.22)'
        }));
        volumeDataRef.current = volumeData;
        volumeSeriesRef.current.setData(volumeData);

        // Dynamically sync ghost candles and PAE tracking with fresh historical data
        if (fvActive && fvSessionRef.current?.candles?.length && fvSessionRef.current?.times?.length) {
            syncFutureVisionWithData(effectiveData, fvSessionRef.current);
        }

        // ── Always compute full indicator snapshot for Future Vision ──────────────────
        // These run unconditionally (not gated on showXxx) so the AI always gets fresh data.
        try {
            const snap = {};
            const d = effectiveData;
            if (d.length >= 14) {
                // Supertrend (Mode-aware parameters)
                const stData = calculateSupertrend(d, activeIndicatorConfig.supertrend.period, activeIndicatorConfig.supertrend.multiplier);
                const lastST = stData.up.at(-1) || stData.down.at(-1);
                snap.supertrendDir = stData.up.at(-1)?.value != null ? 'bullish' : 'bearish';
                snap.supertrendLevel = lastST?.value ?? null;

                // VWAP (Mode-aware anchor: daily, weekly, monthly)
                const vwapData = calculateVWAP(d, activeIndicatorConfig.vwap.anchor);
                snap.vwap = vwapData.at(-1)?.value ?? null;

                // EMA (Mode-aware fast / slow + institutional 50 benchmark)
                const emaFastData = calculateEMA(d, activeIndicatorConfig.ema.fast);
                const emaSlowData = calculateEMA(d, activeIndicatorConfig.ema.slow);
                const ema50Data   = calculateEMA(d, 50);
                snap.emaFast = emaFastData.at(-1)?.value ?? null;
                snap.emaSlow = emaSlowData.at(-1)?.value ?? null;
                snap.ema9    = snap.emaFast; // Backwards compatible proxy for AI
                snap.ema21   = snap.emaSlow;
                snap.ema50   = ema50Data.at(-1)?.value  ?? null;

                // MACD (Mode-aware fast, slow, signal)
                const macd = calculateMACD(d, activeIndicatorConfig.macd.fast, activeIndicatorConfig.macd.slow, activeIndicatorConfig.macd.signal);
                snap.macdLine   = macd.macd.at(-1)?.value      ?? null;
                snap.macdSignal = macd.signal.at(-1)?.value    ?? null;
                snap.macdHist   = macd.histogram.at(-1)?.value ?? null;

                // RSI (Mode-aware period & dynamic overbought/oversold boundaries)
                const rsiResult = calculateRSIDivergence(d, activeIndicatorConfig.rsi.period);
                const lastRsi   = rsiResult.rsi.at(-1)?.value ?? null;
                snap.rsi = lastRsi;
                snap.rsiSignal = lastRsi != null
                    ? (lastRsi > activeIndicatorConfig.rsi.overbought ? 'OVERBOUGHT' : lastRsi < activeIndicatorConfig.rsi.oversold ? 'OVERSOLD' : lastRsi > 55 ? 'Bullish' : lastRsi < 45 ? 'Bearish' : 'Neutral')
                    : 'N/A';

                // Adaptive Bands (always compute in current bandsMode for ATR proxy)
                const bands = computeAdaptiveBands(d, bandsMode);
                const lastOU = bands.outer?.upper?.at(-1)?.value ?? null;
                const lastOL = bands.outer?.lower?.at(-1)?.value ?? null;
                const lastMid = bands.middle?.at(-1)?.value      ?? null;
                snap.bandsMode    = bandsMode;
                snap.bandsUpper   = lastOU;
                snap.bandsLower   = lastOL;
                snap.bandsMid     = lastMid;
                snap.bandsWidth   = (lastOU != null && lastOL != null) ? lastOU - lastOL : null;

                // ATR(14) — compute from True Ranges
                {
                    const atrWindow = d.slice(-15);
                    let atrSum = 0, atrN = 0;
                    for (let i = 1; i < atrWindow.length; i++) {
                        const hi = atrWindow[i].high, lo = atrWindow[i].low, pc = atrWindow[i-1].close;
                        const tr = Math.max(hi - lo, Math.abs(hi - pc), Math.abs(lo - pc));
                        if (tr > 0) { atrSum += tr; atrN++; }
                    }
                    snap.atr14 = atrN ? atrSum / atrN : null;
                }

                // Volume averages
                const vol5  = d.slice(-5).reduce((a, c) => a + (c.volume || 0), 0) / 5;
                const vol20 = d.slice(-20).reduce((a, c) => a + (c.volume || 0), 0) / 20;
                snap.recentVolAvg5  = vol5;
                snap.recentVolAvg20 = vol20;

                // Pattern Score
                snap.patternScore = pScore;

                // Pass horizonBars for ATR-scaling note in assembler
                snap._horizonBars = getFVSettings().horizonBars;
            }
            liveIndicatorSnapshotRef.current = snap;

            // Compute Institutional 4-Pillar Confluence Matrix & Key Levels
            if (snap && d && d.length >= 14) {
                const lastClose = d[d.length - 1]?.close;
                const p1_ema = (snap.emaFast != null && snap.emaSlow != null) ? (snap.emaFast >= snap.emaSlow ? 1 : -1) : 0;
                const p2_vwap = (snap.vwap != null && lastClose != null) ? (lastClose >= snap.vwap ? 1 : -1) : 0;
                const p3_st = snap.supertrendDir === 'bullish' ? 1 : snap.supertrendDir === 'bearish' ? -1 : 0;
                const p4_mom = (snap.rsi != null) ? (snap.rsi >= 50 ? 1 : -1) : 0;

                const bullCount = [p1_ema === 1, p2_vwap === 1, p3_st === 1, p4_mom === 1].filter(Boolean).length;
                const vwapDelta = (snap.vwap && lastClose) ? ((lastClose - snap.vwap) / snap.vwap * 100) : null;

                setConfluenceData({
                    bullCount,
                    totalPillars: 4,
                    p1_ema,
                    p2_vwap,
                    p3_st,
                    p4_mom,
                    vwap: snap.vwap,
                    vwapDelta,
                    ema9: snap.emaFast,
                    ema21: snap.emaSlow,
                    rsi: snap.rsi,
                    supertrendDir: snap.supertrendDir
                });
            }
        } catch (e) {
            // Never crash the chart if snapshot computation fails
            console.warn('[FV] Indicator snapshot error:', e);
        }


        if (showSupertrend && supertrendUpSeriesRef.current && supertrendDownSeriesRef.current) {
            const stData = calculateSupertrend(effectiveData, activeIndicatorConfig.supertrend.period, activeIndicatorConfig.supertrend.multiplier);
            supertrendUpSeriesRef.current.setData(stData.up);
            supertrendDownSeriesRef.current.setData(stData.down);
        } else if (supertrendUpSeriesRef.current && supertrendDownSeriesRef.current) {
            supertrendUpSeriesRef.current.setData([]);
            supertrendDownSeriesRef.current.setData([]);
        }

        if (showVWAP && vwapSeriesRef.current) {
            vwapSeriesRef.current.setData(calculateVWAP(effectiveData, activeIndicatorConfig.vwap.anchor));
        } else if (vwapSeriesRef.current) {
            vwapSeriesRef.current.setData([]);
        }

        if (showEMA && ema9SeriesRef.current && ema21SeriesRef.current) {
            ema9SeriesRef.current.setData(calculateEMA(effectiveData, activeIndicatorConfig.ema.fast));
            ema21SeriesRef.current.setData(calculateEMA(effectiveData, activeIndicatorConfig.ema.slow));
        } else if (ema9SeriesRef.current && ema21SeriesRef.current) {
            ema9SeriesRef.current.setData([]);
            ema21SeriesRef.current.setData([]);
        }

        if (showCPR && cprTcSeriesRef.current && cprPivotSeriesRef.current && cprBcSeriesRef.current) {
            const cprData = calculateCPR(effectiveData, activeIndicatorConfig.cpr.period);
            cprTcSeriesRef.current.setData(cprData.tc);
            cprPivotSeriesRef.current.setData(cprData.p);
            cprBcSeriesRef.current.setData(cprData.bc);
        } else if (cprTcSeriesRef.current && cprPivotSeriesRef.current && cprBcSeriesRef.current) {
            cprTcSeriesRef.current.setData([]);
            cprPivotSeriesRef.current.setData([]);
            cprBcSeriesRef.current.setData([]);
        }
        // ── Adaptive Bands — unified 3-mode institutional engine ─────────────
        if (showAdaptiveBands && bandOuterUpperRef.current && bandOuterLowerRef.current && bandMiddleRef.current) {
            // Per-mode color palette
            const modeColors = {
                scalp:      { outer: '#818cf8', inner: '#818cf866', middle: '#818cf8' }, // indigo  (BB)
                swing:      { outer: '#fbbf24', inner: '#fbbf2466', middle: '#fbbf24' }, // amber   (KC)
                positional: { outer: '#34d399', inner: '#34d39966', middle: '#6ee7b7' }, // emerald (Donchian)
            };
            const palette = modeColors[bandsMode] || modeColors.swing;

            // Apply colors
            bandOuterUpperRef.current.applyOptions({ color: palette.outer });
            bandOuterLowerRef.current.applyOptions({ color: palette.outer });
            bandMiddleRef.current.applyOptions({ color: palette.middle, lineStyle: 2 });
            bandInnerUpperRef.current.applyOptions({ color: palette.inner });
            bandInnerLowerRef.current.applyOptions({ color: palette.inner });

            // Compute institutional-grade bands for this mode
            const bands = computeAdaptiveBands(effectiveData, bandsMode);
            bandOuterUpperRef.current.setData(bands.outer.upper);
            bandOuterLowerRef.current.setData(bands.outer.lower);
            bandMiddleRef.current.setData(bands.middle);
            // Inner channel: KC has it, Donchian has it, BB (scalp) does not
            bandInnerUpperRef.current.setData(bands.inner ? bands.inner.upper : []);
            bandInnerLowerRef.current.setData(bands.inner ? bands.inner.lower : []);
        } else if (bandOuterUpperRef.current) {
            bandOuterUpperRef.current.setData([]);
            bandOuterLowerRef.current.setData([]);
            bandMiddleRef.current.setData([]);
            bandInnerUpperRef.current.setData([]);
            bandInnerLowerRef.current.setData([]);
        }



        if (showMACD && macdLineRef.current && signalLineRef.current && macdHistRef.current) {
            const macd = calculateMACD(effectiveData, activeIndicatorConfig.macd.fast, activeIndicatorConfig.macd.slow, activeIndicatorConfig.macd.signal);
            macdLineRef.current.setData(macd.macd);
            signalLineRef.current.setData(macd.signal);
            macdHistRef.current.setData(macd.histogram);
            latestOscillatorsRef.current.macd = macd.macd.at(-1)?.value ?? null;
            latestOscillatorsRef.current.signal = macd.signal.at(-1)?.value ?? null;
            latestOscillatorsRef.current.hist = macd.histogram.at(-1)?.value ?? null;
        } else if (macdLineRef.current) {
            macdLineRef.current.setData([]);
            signalLineRef.current.setData([]);
            macdHistRef.current.setData([]);
            latestOscillatorsRef.current.macd = null;
            latestOscillatorsRef.current.signal = null;
            latestOscillatorsRef.current.hist = null;
        }

        if (showPSAR && psarRef.current) {
            psarRef.current.setData(calculatePSAR(effectiveData, activeIndicatorConfig.psar.step, activeIndicatorConfig.psar.maxStep));
        } else if (psarRef.current) {
            psarRef.current.setData([]);
        }


        if (showIchimoku && ichimokuTenkanRef.current && ichimokuKijunRef.current && ichimokuSpanARef.current && ichimokuSpanBRef.current) {
            const ichi = calculateIchimoku(effectiveData, activeIndicatorConfig.ichimoku.conversion, activeIndicatorConfig.ichimoku.base, activeIndicatorConfig.ichimoku.span, activeIndicatorConfig.ichimoku.displacement);
            ichimokuTenkanRef.current.setData(ichi.tenkan);
            ichimokuKijunRef.current.setData(ichi.kijun);
            ichimokuSpanARef.current.setData(ichi.spanA);
            ichimokuSpanBRef.current.setData(ichi.spanB);
        } else if (ichimokuTenkanRef.current) {
            ichimokuTenkanRef.current.setData([]);
            ichimokuKijunRef.current.setData([]);
            ichimokuSpanARef.current.setData([]);
            ichimokuSpanBRef.current.setData([]);
        }

        if (showAnchoredVWAP && anchoredVwapRef.current) {
            anchoredVwapRef.current.setData(calculateAnchoredVWAP(effectiveData, activeIndicatorConfig.anchoredVwap.lookback));
        } else if (anchoredVwapRef.current) {
            anchoredVwapRef.current.setData([]);
        }

        if (showAutoFib && candleSeriesRef.current) {
            // clear existing
            autoFibLinesRef.current.forEach(line => candleSeriesRef.current.removePriceLine(line));
            autoFibLinesRef.current = [];
            
            const fib = calculateAutoFib(effectiveData, activeIndicatorConfig.autoFib.lookback);
            if (fib) {
                const fibColors = ['#f87171', '#fb923c', '#facc15', '#a3e635', '#4ade80', '#2dd4bf', '#38bdf8'];
                fib.levels.forEach((lvl, idx) => {
                    const line = candleSeriesRef.current.createPriceLine({
                        price: lvl.price,
                        color: fibColors[idx % fibColors.length],
                        lineWidth: 1,
                        lineStyle: 2,
                        axisLabelVisible: true,
                        title: lvl.label,
                    });
                    autoFibLinesRef.current.push(line);
                });
            }
        } else if (candleSeriesRef.current) {
            autoFibLinesRef.current.forEach(line => candleSeriesRef.current.removePriceLine(line));
            autoFibLinesRef.current = [];
        }

        if (showRSI && rsiRef.current) {
            const r = calculateRSIDivergence(effectiveData, activeIndicatorConfig.rsi.period);
            rsiRef.current.setData(r.rsi);
            latestOscillatorsRef.current.rsi = r.rsi.at(-1)?.value ?? null;
        } else if (rsiRef.current) {
            rsiRef.current.setData([]);
            latestOscillatorsRef.current.rsi = null;
        }

    }, [data, demoRealCandles, showSupertrend, showVWAP, showEMA, showCPR, showAdaptiveBands, bandsMode, showMACD, showPSAR, showIchimoku, showAnchoredVWAP, showAutoFib, showRSI, tradingMode, activeIndicatorConfig]);

    // ── Dynamic Native Multi-Pane Layout Manager (Lightweight Charts v5) ────────
    // Isolates Candlesticks, MACD, and RSI into native independent vertical panes with their own scales.
    const updatePaneTops = useCallback(() => {
        if (!chartRef.current) return;
        const chart = chartRef.current;
        const panes = chart.panes();
        if (!panes || panes.length <= 1) {
            setPanePositions({});
            return;
        }
        const positions = {};
        const p0Height = panes[0]?.getHeight() || 0;
        let currentY = p0Height;

        if (showMACD && showRSI) {
            positions.macd = currentY;
            const p1Height = panes[1]?.getHeight() || 0;
            currentY += p1Height;
            positions.rsi = currentY;
        } else if (showMACD) {
            positions.macd = currentY;
        } else if (showRSI) {
            positions.rsi = currentY;
        }
        setPanePositions(positions);
    }, [showMACD, showRSI]);

    useEffect(() => {
        updatePaneTopsRef.current = updatePaneTops;
    }, [updatePaneTops]);

    // Track pane resize updates smoothly when multiple panes exist
    useEffect(() => {
        if (!showMACD && !showRSI) return;
        const interval = setInterval(updatePaneTops, 250);
        return () => clearInterval(interval);
    }, [showMACD, showRSI, updatePaneTops]);

    useEffect(() => {
        if (!chartRef.current) return;
        const chart = chartRef.current;

        let targetMacdPane = null;
        let targetRsiPane = null;

        if (showMACD && showRSI) {
            targetMacdPane = 1;
            targetRsiPane = 2;
        } else if (showMACD) {
            targetMacdPane = 1;
        } else if (showRSI) {
            targetRsiPane = 1;
        }

        // 1. MACD Sub-Pane Management
        if (targetMacdPane !== null) {
            if (!macdLineRef.current) {
                macdHistRef.current = chart.addSeries(HistogramSeries, {
                    priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
                    lastValueVisible: false,
                    priceLineVisible: false,
                }, targetMacdPane);

                macdLineRef.current = chart.addSeries(LineSeries, {
                    color: '#2962FF',
                    lineWidth: 1.5,
                    priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
                    lastValueVisible: true,
                    priceLineVisible: false,
                    crosshairMarkerVisible: true,
                    title: 'MACD',
                }, targetMacdPane);

                signalLineRef.current = chart.addSeries(LineSeries, {
                    color: '#FF6D00',
                    lineWidth: 1.5,
                    priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
                    lastValueVisible: true,
                    priceLineVisible: false,
                    crosshairMarkerVisible: true,
                    title: 'Signal',
                }, targetMacdPane);

                macdLineRef.current.createPriceLine({
                    price: 0,
                    color: isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.25)',
                    lineWidth: 1,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: '0.00',
                });

                chart.priceScale('right', targetMacdPane).applyOptions({
                    visible: true,
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                    scaleMargins: { top: 0.12, bottom: 0.12 },
                });
            } else {
                macdHistRef.current?.moveToPane(targetMacdPane);
                macdLineRef.current?.moveToPane(targetMacdPane);
                signalLineRef.current?.moveToPane(targetMacdPane);
            }

            const effectiveDataForPanes = [...(data || []), ...(demoRealCandles || [])];
            if (effectiveDataForPanes.length > 0) {
                const macd = calculateMACD(effectiveDataForPanes, activeIndicatorConfig.macd.fast, activeIndicatorConfig.macd.slow, activeIndicatorConfig.macd.signal);
                macdLineRef.current.setData(macd.macd);
                signalLineRef.current.setData(macd.signal);
                macdHistRef.current.setData(macd.histogram);
                latestOscillatorsRef.current.macd = macd.macd.at(-1)?.value ?? null;
                latestOscillatorsRef.current.signal = macd.signal.at(-1)?.value ?? null;
                latestOscillatorsRef.current.hist = macd.histogram.at(-1)?.value ?? null;
            }
        } else {
            if (macdLineRef.current) {
                if (macdHistRef.current) {
                    chart.removeSeries(macdHistRef.current);
                    macdHistRef.current = null;
                }
                if (macdLineRef.current) {
                    chart.removeSeries(macdLineRef.current);
                    macdLineRef.current = null;
                }
                if (signalLineRef.current) {
                    chart.removeSeries(signalLineRef.current);
                    signalLineRef.current = null;
                }
                latestOscillatorsRef.current.macd = null;
                latestOscillatorsRef.current.signal = null;
                latestOscillatorsRef.current.hist = null;
            }
        }

        // 2. RSI Sub-Pane Management
        if (targetRsiPane !== null) {
            if (!rsiRef.current) {
                rsiRef.current = chart.addSeries(LineSeries, {
                    color: '#a78bfa',
                    lineWidth: 1.5,
                    priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
                    lastValueVisible: true,
                    priceLineVisible: false,
                    crosshairMarkerVisible: true,
                    title: 'RSI',
                    autoscaleInfoProvider: (original) => {
                        const res = original();
                        return {
                            priceRange: {
                                minValue: Math.min(20, res?.priceRange?.minValue ?? 20),
                                maxValue: Math.max(80, res?.priceRange?.maxValue ?? 80),
                            },
                        };
                    },
                }, targetRsiPane);

                chart.priceScale('right', targetRsiPane).applyOptions({
                    visible: true,
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                    scaleMargins: { top: 0.12, bottom: 0.12 },
                });
            } else {
                rsiRef.current?.moveToPane(targetRsiPane);
            }

            // Dynamically manage mode-aware RSI reference price lines
            if (rsiRef.current) {
                if (rsiOverboughtLineRef.current) {
                    try { rsiRef.current.removePriceLine(rsiOverboughtLineRef.current); } catch (_) {}
                    rsiOverboughtLineRef.current = null;
                }
                if (rsiOversoldLineRef.current) {
                    try { rsiRef.current.removePriceLine(rsiOversoldLineRef.current); } catch (_) {}
                    rsiOversoldLineRef.current = null;
                }

                rsiOverboughtLineRef.current = rsiRef.current.createPriceLine({
                    price: activeIndicatorConfig.rsi.overbought,
                    color: 'rgba(239, 68, 68, 0.6)',
                    lineWidth: 1,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: `${activeIndicatorConfig.rsi.overbought}`,
                });

                rsiOversoldLineRef.current = rsiRef.current.createPriceLine({
                    price: activeIndicatorConfig.rsi.oversold,
                    color: 'rgba(34, 197, 94, 0.6)',
                    lineWidth: 1,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: `${activeIndicatorConfig.rsi.oversold}`,
                });
            }

            const effectiveDataForPanes = [...(data || []), ...(demoRealCandles || [])];
            if (effectiveDataForPanes.length > 0) {
                const r = calculateRSIDivergence(effectiveDataForPanes, activeIndicatorConfig.rsi.period);
                rsiRef.current.setData(r.rsi);
                latestOscillatorsRef.current.rsi = r.rsi.at(-1)?.value ?? null;
            }
        } else {
            if (rsiRef.current) {
                if (rsiOverboughtLineRef.current) {
                    try { rsiRef.current.removePriceLine(rsiOverboughtLineRef.current); } catch (_) {}
                    rsiOverboughtLineRef.current = null;
                }
                if (rsiOversoldLineRef.current) {
                    try { rsiRef.current.removePriceLine(rsiOversoldLineRef.current); } catch (_) {}
                    rsiOversoldLineRef.current = null;
                }
                chart.removeSeries(rsiRef.current);
                rsiRef.current = null;
                latestOscillatorsRef.current.rsi = null;
            }
        }

        // 3. Dynamic Stretch Factor Distribution
        const panes = chart.panes();
        if (targetMacdPane !== null && targetRsiPane !== null) {
            // 3 Panes: Price (60%), MACD (20%), RSI (20%)
            if (panes[0]) panes[0].setStretchFactor(600);
            if (panes[1]) panes[1].setStretchFactor(200);
            if (panes[2]) panes[2].setStretchFactor(200);
        } else if (targetMacdPane !== null || targetRsiPane !== null) {
            // 2 Panes: Price (75%), Sub-pane (25%)
            if (panes[0]) panes[0].setStretchFactor(750);
            if (panes[1]) panes[1].setStretchFactor(250);
        } else {
            // 1 Pane: Price (100%)
            if (panes[0]) panes[0].setStretchFactor(1000);
        }

        // 4. Pane 0 Scale Calibration (Main Price & Left Volume)
        chart.priceScale('right', 0).applyOptions({
            visible: true,
            scaleMargins: { top: 0.08, bottom: 0.08 },
            borderColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        });
        chart.priceScale('left', 0).applyOptions({
            visible: true,
            minimumWidth: 50,
            scaleMargins: { top: 0.70, bottom: 0.00 },
            borderColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        });

        requestAnimationFrame(updatePaneTops);
    }, [showMACD, showRSI, isLight, data, demoRealCandles, updatePaneTops, tradingMode, activeIndicatorConfig]);


    useEffect(() => {
        if (!undervaluedSeriesRef.current) return;
        if (showValuationBands && fundamentalData && fundamentalData.fairValueBands) {
            undervaluedSeriesRef.current.setData(fundamentalData.fairValueBands.undervalued || []);
            fairValueSeriesRef.current.setData(fundamentalData.fairValueBands.fairValue || []);
            overvaluedSeriesRef.current.setData(fundamentalData.fairValueBands.overvalued || []);
        } else {
            undervaluedSeriesRef.current.setData([]);
            fairValueSeriesRef.current.setData([]);
            overvaluedSeriesRef.current.setData([]);
        }
    }, [fundamentalData, showValuationBands]);

    useEffect(() => {
        if (!candleSeriesRef.current) return;
        let markers = [];
        
        // 1. Fundamental Events
        if (showEvents && events && events.length > 0) {
            const eventMarkers = events.map(event => ({
                time: event.time,
                position: event.impact > 0 ? 'aboveBar' : 'belowBar',
                color: event.type === 'gdp' ? '#3b82f6' : event.type === 'cpi' ? '#f97316' : event.type === 'rbi' ? '#8b5cf6' : event.type === 'budget' ? '#22c55e' : '#fbbf24',
                shape: 'circle', text: event.label,
            }));
            markers.push(...eventMarkers);
        }
        
        // Clean up markers plugin if it exists
        if (markersPluginRef.current && typeof candleSeriesRef.current.detachPrimitive === 'function') {
            try { candleSeriesRef.current.detachPrimitive(markersPluginRef.current); } catch(e) {}
        }
    }, [events, showEvents]);

    // Track original candles for restoring colors when a pattern is un-hovered
    const patternColoredCandlesRef = useRef([]);
    const patternMarkersPluginRef = useRef(null);

    // Dynamically color multi-candle patterns
    useEffect(() => {
        if (!candleSeriesRef.current || !data) return;

        // 1. We must use setData() to safely update historical candles in v5
        let needReset = patternColoredCandlesRef.current.length > 0;
        let nextData = [...data, ...demoRealCandles];

        if (liveCandle) {
            const liveMatchIdx = nextData.findIndex(c => c.time === liveCandle.time);
            if (liveMatchIdx !== -1) nextData[liveMatchIdx] = liveCandle;
            else nextData.push(liveCandle);
        }

        let isPainting = false;

        // 2. If hovering over a pattern, paint its involved candles blue
        if (hoveredPattern && hoveredPattern.len >= 1) {
            const endIdx = nextData.findIndex(c => c.time === hoveredPattern.time);
            if (endIdx !== -1) {
                const startIdx = Math.max(0, endIdx - hoveredPattern.len + 1);
                
                nextData = nextData.map((c, i) => {
                    if (i >= startIdx && i <= endIdx) {
                        return {
                            ...c,
                            color: 'rgba(59, 130, 246, 0.9)', // Solid blue body
                            borderColor: '#3b82f6',
                            wickColor: '#3b82f6'
                        };
                    }
                    return c;
                });
                isPainting = true;
                patternColoredCandlesRef.current = [true]; // flag that we have painted
            }
            
            // Add native thin blue arrow ONLY for single-candle patterns
            if (hoveredPattern.len === 1) {
                const marker = {
                    time: hoveredPattern.time,
                    position: hoveredPattern.dir > 0 ? 'belowBar' : 'aboveBar',
                    color: '#3b82f6',
                    shape: hoveredPattern.dir > 0 ? 'arrowUp' : 'arrowDown',
                };
                
                if (!patternMarkersPluginRef.current) {
                    patternMarkersPluginRef.current = createSeriesMarkers(candleSeriesRef.current, [marker]);
                    if (typeof candleSeriesRef.current.attachPrimitive === 'function') {
                        candleSeriesRef.current.attachPrimitive(patternMarkersPluginRef.current);
                    }
                } else {
                    patternMarkersPluginRef.current.setMarkers([marker]);
                }
            } else {
                // Multi-candle pattern: NO arrow needed, blue colored bodies are enough
                if (patternMarkersPluginRef.current) {
                    patternMarkersPluginRef.current.setMarkers([]);
                }
            }
        } else {
            patternColoredCandlesRef.current = [];
            if (patternMarkersPluginRef.current) {
                patternMarkersPluginRef.current.setMarkers([]);
            }
        }

        if (isPainting || needReset) {
            try { candleSeriesRef.current.setData(nextData); } catch (e) {}
        }
    }, [hoveredPattern, data, demoRealCandles, liveCandle]);

    

    const getRegimeBackground = () => {
        if (!fundamentalData || !fundamentalData.regime) return 'transparent';
        const r = fundamentalData.regime;
        if (r === 'risk-on') return 'rgba(34,197,94,0.03)';
        if (r === 'risk-off') return 'rgba(239,68,68,0.03)';
        return 'rgba(251,191,36,0.02)';
    };

    const handleMouseEnter = (e, label) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredIndicator({ label, top: rect.bottom + 12, left: rect.left + rect.width / 2 });
    };

    
    // Live Candle Sync & Institutional Error Markers are handled via the `liveCandle` prop.

    // Refresh available models whenever indicator menu opens or on mount, and subscribe to real-time changes
    useEffect(() => {
        const syncRegistries = () => {
            try {
                const indList = getCustomIndicators().filter(i => i.promoted);
                setPromotedCustomIndicators(indList);
                const stratList = getStrategies().filter(s => s.promoted);
                setPromotedStrategies(stratList);

                // Cascade cleanup of deleted custom indicator series on the chart
                if (customSeriesMapRef.current && chartRef.current) {
                    const activeIds = Array.from(customSeriesMapRef.current.keys());
                    activeIds.forEach(id => {
                        if (!indList.some(i => i.id === id)) {
                            const series = customSeriesMapRef.current.get(id);
                            if (series) {
                                try { chartRef.current.removeSeries(series); } catch (e) {}
                            }
                            customSeriesMapRef.current.delete(id);
                            setActiveCustomIndicatorIds(prev => {
                                const next = new Set(prev);
                                next.delete(id);
                                return next;
                            });
                        }
                    });
                }
            } catch (e) {}
        };
        syncRegistries();

        const unsubInd = typeof subscribeToCustomIndicators === 'function' ? subscribeToCustomIndicators(syncRegistries) : () => {};
        const unsubStrat = typeof subscribeToStrategies === 'function' ? subscribeToStrategies(syncRegistries) : () => {};

        return () => {
            if (typeof unsubInd === 'function') unsubInd();
            if (typeof unsubStrat === 'function') unsubStrat();
        };
    }, [showMenu]);

    // Custom Indicator Execution & Plotted Overlay
    const toggleCustomIndicator = useCallback(async (ind) => {
        setActiveCustomIndicatorIds(prev => {
            const next = new Set(prev);
            if (next.has(ind.id)) {
                next.delete(ind.id);
                const series = customSeriesMapRef.current.get(ind.id);
                if (series && chartRef.current) {
                    try { chartRef.current.removeSeries(series); } catch (e) {}
                }
                customSeriesMapRef.current.delete(ind.id);
            } else {
                next.add(ind.id);
                const effectiveData = [...(data || []), ...demoRealCandles];
                if (effectiveData.length > 5 && chartRef.current) {
                    const activeMode = ['1m', '3m', '5m', '15m', '30m', '60m', '1h'].includes(timeframe?.toLowerCase())
                        ? 'intraday'
                        : (['week', 'month', 'w', 'm'].includes(timeframe?.toLowerCase()) ? 'positional' : 'swing');

                    axiosInstance.post('/api/v1/indicator-lab/run', {
                        code: ind.code,
                        mode: activeMode,
                        candles: effectiveData.map(c => ({
                            time: c.time,
                            open: c.open,
                            high: c.high,
                            low: c.low,
                            close: c.close,
                            volume: c.volume || 0,
                        }))
                    }).then(res => {
                        if (res.data?.success && Array.isArray(res.data.data) && chartRef.current) {
                            const validPoints = res.data.data.filter(d => d.value !== null);
                            const lineSeries = chartRef.current.addLineSeries({
                                color: '#f97316',
                                lineWidth: 2,
                                title: ind.nickname || ind.name,
                                priceScaleId: 'right',
                            });
                            lineSeries.setData(validPoints);
                            customSeriesMapRef.current.set(ind.id, lineSeries);
                        }
                    }).catch(err => {
                        console.warn('[Chart] Custom indicator error:', err);
                    });
                }
            }
            return next;
        });
    }, [data, demoRealCandles, timeframe]);

    // Strategy Execution & Plotted Markers
    const toggleStrategy = useCallback((strat) => {
        setActiveStrategyIds(prev => {
            const next = new Set(prev);
            if (next.has(strat.id)) {
                next.delete(strat.id);
            } else {
                next.add(strat.id);
            }
            return next;
        });
    }, []);

    // Effect to calculate and update strategy signal markers on the chart
    useEffect(() => {
        if (!candleSeriesRef.current) return;
        const effectiveData = [...(data || []), ...demoRealCandles];
        if (effectiveData.length < 20) return;

        const allMarkers = [];
        activeStrategyIds.forEach(stratId => {
            const strat = promotedStrategies.find(s => s.id === stratId);
            if (!strat) return;
            try {
                const stratMode = strat.mode || (['1m', '3m', '5m', '15m', '30m', '60m', '1h'].includes(timeframe?.toLowerCase()) ? 'intraday' : (['week', 'month', 'w', 'm'].includes(timeframe?.toLowerCase()) ? 'positional' : 'swing'));
                const res = runStrategyBacktest(effectiveData, {
                    ...strat,
                    mode: stratMode,
                    customLabModels: getCustomIndicators(),
                });
                if (res?.trades?.length > 0) {
                    const nick = strat.nickname || 'STRAT';
                    res.trades.forEach(trade => {
                        allMarkers.push({
                            time: trade.entryTime,
                            position: trade.direction > 0 ? 'belowBar' : 'aboveBar',
                            color: trade.direction > 0 ? '#10b981' : '#f43f5e',
                            shape: trade.direction > 0 ? 'arrowUp' : 'arrowDown',
                            text: `${nick} ${trade.direction > 0 ? 'BUY' : 'SELL'}`,
                        });
                    });
                }
            } catch (err) {
                console.warn('[Chart] Error running strategy markers:', err);
            }
        });

        if (allMarkers.length > 0) {
            allMarkers.sort((a, b) => getMsTimestamp(a.time) - getMsTimestamp(b.time));
            if (!strategyMarkersPluginRef.current) {
                strategyMarkersPluginRef.current = createSeriesMarkers(candleSeriesRef.current, allMarkers, { zOrder: 'aboveSeries' });
                if (typeof candleSeriesRef.current.attachPrimitive === 'function') {
                    candleSeriesRef.current.attachPrimitive(strategyMarkersPluginRef.current);
                }
            } else {
                strategyMarkersPluginRef.current.setMarkers(allMarkers);
            }
        } else if (strategyMarkersPluginRef.current) {
            strategyMarkersPluginRef.current.setMarkers([]);
        }
    }, [activeStrategyIds, promotedStrategies, data, demoRealCandles]);

    return (
        <div className="advanced-candlestick-chart relative w-full h-full flex flex-col">
            <div className="absolute inset-0 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: getRegimeBackground() }} />

            {/* Institutional Chart Workspace Ribbon */}
            <div className="absolute top-1.5 left-1.5 right-20 md:right-24 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
                {/* Left Controls: Standalone Draw Block (strictly on left side of line) + Indicators Block (inside chart) */}
                <div className="flex items-center pointer-events-none">
                    {/* Block 1: Standalone Draw Tool (Strictly left of the line, fits within 36px so it never cuts the line) */}
                    <div className="pointer-events-auto w-9 h-7 flex items-center justify-center bg-white/90 dark:bg-[#111622]/90 backdrop-blur-md rounded-lg border border-slate-200/90 dark:border-border-subtle/90 shadow-sm">
                        <button
                            onMouseEnter={(e) => handleMouseEnter(e, showDrawing ? 'Close Drawing Suite' : 'Open Drawing Suite')}
                            onMouseLeave={() => setHoveredIndicator(null)}
                            onClick={() => { setShowDrawing(p => !p); if (showDrawing) setActiveTool('cursor'); setHoveredIndicator(null); }}
                            className={`flex items-center justify-center w-full h-full text-[10px] font-bold transition-all ${
                                showDrawing 
                                    ? 'text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]' 
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                            title="Drawing Tools"
                        >
                            <PencilRuler size={13} strokeWidth={2} />
                        </button>
                    </div>

                    {/* Scale boundary gap: ensures the vertical scale boundary line at ~65px passes cleanly in this open channel */}
                    {!isMultiMode && <div className="w-12" />}

                    {/* Block 2: Technical Indicators & Overlays (Inside the line - moved safely to the right so it never cuts the line) */}
                    {!isMultiMode && (
                    <div className="pointer-events-auto h-7 flex items-center gap-2 bg-white/90 dark:bg-[#111622]/90 backdrop-blur-md px-2.5 rounded-lg border border-slate-200/90 dark:border-border-subtle/90 shadow-sm">

                    {/* Pinned 1-Click Toggles - Text Glow Only, Zero Box/Dots */}
                    <button
                        onMouseEnter={(e) => handleMouseEnter(e, showVWAP ? 'Hide VWAP' : `Show ${activeIndicatorConfig.vwap.label}`)}
                        onMouseLeave={() => setHoveredIndicator(null)}
                        onClick={() => setShowVWAP(p => !p)}
                        className={`px-1 py-0.5 text-[10px] font-bold transition-all ${
                            showVWAP 
                                ? 'text-amber-600 dark:text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        VWAP
                    </button>

                    <button
                        onMouseEnter={(e) => handleMouseEnter(e, showEMA ? `Hide ${activeIndicatorConfig.ema.fast}/${activeIndicatorConfig.ema.slow} EMA` : `Show ${activeIndicatorConfig.ema.label} Crossover`)}
                        onMouseLeave={() => setHoveredIndicator(null)}
                        onClick={() => setShowEMA(p => !p)}
                        className={`px-1 py-0.5 text-[10px] font-bold transition-all ${
                            showEMA 
                                ? 'text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]' 
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        EMA
                    </button>

                    <button
                        onMouseEnter={(e) => handleMouseEnter(e, showSupertrend ? 'Hide Supertrend' : `Show ${activeIndicatorConfig.supertrend.label}`)}
                        onMouseLeave={() => setHoveredIndicator(null)}
                        onClick={() => setShowSupertrend(p => !p)}
                        className={`px-1 py-0.5 text-[10px] font-bold transition-all ${
                            showSupertrend 
                                ? 'text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' 
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        ST
                    </button>

                    <div className="w-px h-3 bg-border-subtle/80 mx-0.5" />

                    {/* Master Indicator Arsenal Trigger & Popover - Text & Icon Only, Zero Box */}
                    <div className="relative">
                        {(() => {
                            const activeCount = [showSupertrend, showVWAP, showEMA, showCPR, showAdaptiveBands, showMACD, showPSAR, showIchimoku, showAnchoredVWAP, showAutoFib, showRSI].filter(Boolean).length;
                            return (
                                <button
                                    onClick={() => setShowMenu(p => !p)}
                                    className={`flex items-center gap-1 px-1 py-0.5 text-[10px] font-bold transition-all ${
                                        showMenu || activeCount > 0
                                            ? 'text-text-primary' 
                                            : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                    title="Open Indicator Arsenal"
                                >
                                    <Zap size={11} className={activeCount > 0 ? 'text-amber-500 dark:text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]' : 'text-text-tertiary'} />
                                    <span className="hidden sm:inline">Indicators</span>
                                    {activeCount > 0 && (
                                        <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                                            {activeCount}
                                        </span>
                                    )}
                                    <ChevronDown size={10} className={`transition-transform duration-150 ${showMenu ? 'rotate-180' : ''}`} />
                                </button>
                            );
                        })()}

                        {/* Indicator Arsenal Popover */}
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full left-0 mt-1.5 w-72 bg-white/95 dark:bg-[#121622]/95 backdrop-blur-xl border border-slate-200 dark:border-border-default rounded-xl shadow-2xl p-2.5 z-50 pointer-events-auto"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200 dark:border-border-subtle">
                                        <div className="flex items-center gap-1.5">
                                            <Zap size={13} className="text-amber-500 dark:text-amber-400" />
                                            <span className="text-xs font-bold text-text-primary uppercase tracking-wide">Indicator Arsenal</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-text-tertiary uppercase">
                                            {[showSupertrend, showVWAP, showEMA, showCPR, showAdaptiveBands, showMACD, showPSAR, showIchimoku, showAnchoredVWAP, showAutoFib, showRSI].filter(Boolean).length} Active
                                        </span>
                                    </div>

                                    {/* Categorized Indicator List */}
                                    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-0.5 custom-scrollbar">
                                        {/* Group 1: Overlays */}
                                        <div>
                                            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Price Overlays</span>
                                            <div className="grid grid-cols-2 gap-1">
                                                <button onClick={() => setShowSupertrend(p => !p)} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${showSupertrend ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}>
                                                    <span>{activeIndicatorConfig.supertrend.label}</span>
                                                    {showSupertrend && <Check size={11} />}
                                                </button>
                                                <button onClick={() => setShowVWAP(p => !p)} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${showVWAP ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}>
                                                    <span>{activeIndicatorConfig.vwap.label}</span>
                                                    {showVWAP && <Check size={11} />}
                                                </button>
                                                <button onClick={() => setShowEMA(p => !p)} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${showEMA ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}>
                                                    <span>{activeIndicatorConfig.ema.label}</span>
                                                    {showEMA && <Check size={11} />}
                                                </button>
                                                <button onClick={() => setShowCPR(p => !p)} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${showCPR ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}>
                                                    <span>{activeIndicatorConfig.cpr.label}</span>
                                                    {showCPR && <Check size={11} />}
                                                </button>
                                                <button onClick={() => setShowAdaptiveBands(p => !p)} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${showAdaptiveBands ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}>
                                                    <span>{activeIndicatorConfig.adaptiveBands.label}</span>
                                                    {showAdaptiveBands && <Check size={11} />}
                                                </button>
                                                <button onClick={() => setShowPSAR(p => !p)} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${showPSAR ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}>
                                                    <span>{activeIndicatorConfig.psar.label}</span>
                                                    {showPSAR && <Check size={11} />}
                                                </button>
                                                <button onClick={() => setShowIchimoku(p => !p)} className={`col-span-2 flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${showIchimoku ? 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}>
                                                    <span>{activeIndicatorConfig.ichimoku.label}</span>
                                                    {showIchimoku && <Check size={11} />}
                                                </button>
                                            </div>

                                            {/* Mode selector if Adaptive Bands active */}
                                            {showAdaptiveBands && (
                                                <div className="flex items-center gap-1 mt-1.5 p-1 bg-slate-100 dark:bg-background-surface/80 rounded border border-slate-200 dark:border-border-subtle">
                                                    <span className="text-[9px] text-text-tertiary uppercase font-bold pl-1">Bands:</span>
                                                    {[
                                                        { id: 'scalp', label: 'BB Scalp' },
                                                        { id: 'swing', label: 'KC Swing' },
                                                        { id: 'positional', label: 'DC Pos' },
                                                    ].map(m => (
                                                        <button
                                                            key={m.id}
                                                            onClick={() => setBandsMode(m.id)}
                                                            className={`flex-1 py-0.5 rounded text-[9px] font-bold ${bandsMode === m.id ? 'bg-blue-600 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                                        >
                                                            {m.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Group 2: Sub-chart Oscillators */}
                                        <div className="pt-1.5 border-t border-slate-200 dark:border-border-subtle">
                                            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Oscillators & Studies</span>
                                            <div className="grid grid-cols-2 gap-1">
                                                <button onClick={() => setShowMACD(p => !p)} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${showMACD ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}>
                                                    <span>{activeIndicatorConfig.macd.label}</span>
                                                    {showMACD && <Check size={11} />}
                                                </button>
                                                <button onClick={() => setShowRSI(p => !p)} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${showRSI ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}>
                                                    <span>{activeIndicatorConfig.rsi.label}</span>
                                                    {showRSI && <Check size={11} />}
                                                </button>
                                                <button onClick={() => setShowAnchoredVWAP(p => !p)} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${showAnchoredVWAP ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}>
                                                    <span>{activeIndicatorConfig.anchoredVwap.label}</span>
                                                    {showAnchoredVWAP && <Check size={11} />}
                                                </button>
                                                <button onClick={() => setShowAutoFib(p => !p)} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${showAutoFib ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}>
                                                    <span>{activeIndicatorConfig.autoFib.label}</span>
                                                    {showAutoFib && <Check size={11} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Group 3: Promoted Custom Lab Indicators */}
                                        {promotedCustomIndicators.length > 0 && (
                                            <div className="pt-1.5 border-t border-slate-200 dark:border-border-subtle">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[9px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wider">
                                                        Custom Lab Models
                                                    </span>
                                                    <span className="text-[8px] font-mono text-text-tertiary">
                                                        {activeCustomIndicatorIds.size} Active
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    {promotedCustomIndicators.map(ind => {
                                                        const isActive = activeCustomIndicatorIds.has(ind.id);
                                                        return (
                                                            <button
                                                                key={ind.id}
                                                                onClick={() => toggleCustomIndicator(ind)}
                                                                className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                                                                    isActive
                                                                        ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                                                                        : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                                                                }`}
                                                            >
                                                                <span className="truncate">{ind.name}</span>
                                                                {isActive && <Check size={11} />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Group 4: Promoted Live Strategies */}
                                        {promotedStrategies.length > 0 && (
                                            <div className="pt-1.5 border-t border-slate-200 dark:border-border-subtle">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                                        Strategies & Signals
                                                    </span>
                                                    <span className="text-[8px] font-mono text-text-tertiary">
                                                        {activeStrategyIds.size} Active
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    {promotedStrategies.map(strat => {
                                                        const isActive = activeStrategyIds.has(strat.id);
                                                        return (
                                                            <button
                                                                key={strat.id}
                                                                onClick={() => toggleStrategy(strat)}
                                                                className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                                                                    isActive
                                                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                                                        : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-1 truncate">
                                                                    <span className="truncate">{strat.name}</span>
                                                                    {strat.nickname && (
                                                                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
                                                                            {strat.nickname}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {isActive && <Check size={11} />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-px h-3 bg-slate-200 dark:bg-border-subtle/80 mx-0.5" />

                    {/* 1. Future Vision Engine: Single-Click Predict/Optimize, Double-Click Auto Mode */}
                    <button
                        onClick={handleTelescopeClick}
                        disabled={fvLoading}
                        className={`relative flex items-center justify-center p-0.5 rounded transition-all select-none cursor-pointer ${
                            fvLoading 
                                ? 'cursor-wait opacity-80' 
                                : fvAutoMode 
                                ? 'text-violet-600 dark:text-violet-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]' 
                                : (fvActive && fvHasFutureCandles) 
                                ? 'text-violet-600 dark:text-violet-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)] hover:text-violet-700 dark:hover:text-violet-300' 
                                : 'text-text-tertiary hover:text-text-primary'
                        }`}
                        title={
                            fvLoading 
                                ? "Future Vision: Generating prediction..." 
                                : fvAutoMode 
                                ? "Future Vision Auto Mode: ON (Click to turn OFF)" 
                                : (fvActive && fvHasFutureCandles) 
                                ? "Future Vision: Click to optimize & extend active forecast (Double-click for Auto Mode)" 
                                : "Future Vision: Click to predict (Double-click for Auto Mode)"
                        }
                    >
                        {fvLoading ? (
                            <Loader size="tiny" color="purple" />
                        ) : (
                            <>
                                <Telescope size={12} />
                                {fvAutoMode && (
                                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                                )}
                            </>
                        )}
                    </button>

                    {/* 2. Future Vision Ghost Candles Visibility Toggle (Icon Only, Glowing Violet) */}
                    <button
                        onClick={() => setFvVisible(p => !p)}
                        className={`flex items-center justify-center p-0.5 transition-colors ${
                            fvVisible 
                                ? 'text-violet-600 dark:text-violet-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' 
                                : 'text-text-tertiary hover:text-text-primary'
                        }`}
                        title={fvVisible ? "Hide Ghost Candles" : "Show Ghost Candles"}
                    >
                        {fvVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>

                    {/* Overnight Strategic Brief Trigger & Popover */}
                    <div className="relative">
                        <button
                            onClick={() => setShowAnalystPopover(p => !p)}
                            className={`relative flex items-center justify-center p-0.5 rounded transition-colors ${
                                showAnalystPopover
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : analystBrief
                                    ? 'text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300'
                                    : 'text-text-tertiary hover:text-purple-600 dark:hover:text-purple-400'
                            }`}
                            title={analystBrief ? "Overnight Strategic Brief (Active in Future Vision Block 0)" : "Overnight Strategic Brief"}
                        >
                            <Microscope size={12} />
                            {Boolean(analystBrief) && (
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                            )}
                        </button>

                        <AnimatePresence>
                            {showAnalystPopover && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white/95 dark:bg-[#111622]/95 backdrop-blur-xl border border-slate-200 dark:border-border-default rounded-xl shadow-2xl p-3.5 z-50 pointer-events-auto select-text text-left"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2 pb-2 mb-2.5 border-b border-slate-200 dark:border-border-subtle">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <Microscope size={13} className="text-purple-500 dark:text-purple-400" />
                                                <span className="text-xs font-bold text-text-primary tracking-wide">Overnight Strategic Brief</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                                    Active in Future Vision Block 0
                                                </span>
                                                <span className="text-[10px] font-mono text-text-tertiary">
                                                    {timeframe?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowAnalystPopover(false)}
                                            className="text-text-tertiary hover:text-text-primary p-0.5 rounded transition-colors"
                                            title="Close"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* Body */}
                                    <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 min-h-[50px] max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                        {isAnalyzingBrief ? (
                                            <div className="flex flex-col items-center justify-center py-6 gap-2 text-text-secondary">
                                                <Loader size="tiny" color="purple" />
                                                <span className="text-xs font-medium">Running quantitative overnight analysis...</span>
                                            </div>
                                        ) : analystBrief ? (
                                            <p className="whitespace-pre-wrap font-normal">{analystBrief}</p>
                                        ) : (
                                            <p className="text-text-tertiary italic text-[11px]">
                                                No overnight brief generated yet for this symbol and timeframe. Run analysis to create an institutional calibration brief.
                                            </p>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200 dark:border-border-subtle text-[10px] text-text-tertiary">
                                        <div>
                                            {analystBriefCreatedAt ? (
                                                <span>Generated: {new Date(analystBriefCreatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            ) : (
                                                <span>Not yet generated</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleRunAnalystBrief}
                                            disabled={isAnalyzingBrief || !instrumentKey || !timeframe}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition-all shadow-sm shadow-purple-600/20"
                                        >
                                            <RotateCw size={11} className={isAnalyzingBrief ? 'animate-spin' : ''} />
                                            <span>{isAnalyzingBrief ? 'Analyzing...' : (analystBrief ? 'Re-analyze' : 'Run Analysis')}</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    </div>
                    )}
                </div>

                {/* Center Section: 4-Pillar Confluence Matrix + Key Levels (hidden in multi-chart tile mode, visible in maximized/single mode) */}
                {!isMultiMode && confluenceData && (
                    <div className="pointer-events-auto h-7 hidden 2xl:flex items-center gap-2 bg-white/90 dark:bg-[#111622]/90 backdrop-blur-md px-2.5 rounded-lg border border-slate-200/90 dark:border-border-subtle/90 shadow-sm select-none">
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${confluenceData.p1_ema === 1 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} title="EMA 9/21 Trend" />
                                <span className={`w-1.5 h-1.5 rounded-full ${confluenceData.p2_vwap === 1 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} title="VWAP Alignment" />
                                <span className={`w-1.5 h-1.5 rounded-full ${confluenceData.p3_st === 1 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} title="Supertrend Regime" />
                                <span className={`w-1.5 h-1.5 rounded-full ${confluenceData.p4_mom === 1 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} title="RSI Momentum" />
                            </div>
                            <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-wider">Confluence:</span>
                            <span className={`text-[10px] font-bold font-mono ${
                                confluenceData.bullCount >= 3 ? 'text-emerald-600 dark:text-emerald-400' :
                                confluenceData.bullCount <= 1 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                            }`}>
                                {confluenceData.bullCount}/4 {confluenceData.bullCount >= 3 ? 'BULL' : confluenceData.bullCount <= 1 ? 'BEAR' : 'NEUTRAL'}
                            </span>
                        </div>

                        {/* VWAP Delta */}
                        {confluenceData.vwapDelta !== null && (
                            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-border-subtle/80 font-mono text-[10px]">
                                <span className="text-text-tertiary text-[9px] font-sans uppercase font-bold">VWAP Δ</span>
                                <span className={`font-semibold tabular-nums min-w-[42px] text-right inline-block ${confluenceData.vwapDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {confluenceData.vwapDelta >= 0 ? '+' : ''}{confluenceData.vwapDelta.toFixed(2)}%
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Right Group: Consolidated AI Intelligence Capsule + OHLC */}
                <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
                    {/* Consolidated AI Intelligence Capsule */}
                    {!isMultiMode && (
                        <div className="relative">
                            <button
                                onClick={() => setShowAiFlyout(p => !p)}
                                className={`h-7 flex items-center gap-1.5 px-2.5 rounded-lg border text-[10px] font-bold transition-all backdrop-blur-md shadow-sm shrink-0 ${
                                    showAiFlyout 
                                        ? 'bg-violet-500/15 dark:bg-violet-600/20 text-violet-700 dark:text-violet-300 border-violet-500/50 ring-1 ring-violet-500/30' 
                                        : 'bg-white/90 dark:bg-[#111622]/90 text-text-primary border-slate-200/90 dark:border-border-subtle/90 hover:border-violet-500/40'
                                }`}
                                title="Praxis AI Intelligence Hub"
                            >
                                <Sparkles size={11} className={fvLoading ? 'text-violet-500 dark:text-violet-400 animate-spin' : 'text-violet-500 dark:text-violet-400'} />
                                <span className="text-text-secondary uppercase tracking-wider text-[9px]">AI</span>
                                {fvBias && (
                                    <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
                                        fvBias === 'bullish' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                        fvBias === 'bearish' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                                        'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                                    }`}>
                                        {fvBias.toUpperCase()}
                                    </span>
                                )}
                                {fvEdge && (
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold flex items-center gap-1 border ${
                                        fvEdge.edge_detected
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                    }`} title={fvEdge.reason}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${fvEdge.edge_detected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                        {fvEdge.edge_detected ? 'EDGE' : 'NOISE'}
                                    </span>
                                )}
                                {patternScore && (
                                    <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold tabular-nums ${
                                        patternScore.score > 2 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                        patternScore.score < -2 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    }`}>
                                        {patternScore.score > 0 ? '+' : ''}{patternScore.score}
                                    </span>
                                )}
                                <ChevronDown size={10} className={`text-text-tertiary transition-transform ${showAiFlyout ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Rich AI Flyout */}
                            <AnimatePresence>
                                {showAiFlyout && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full right-0 mt-1.5 w-[600px] sm:w-[650px] max-w-[calc(100vw-24px)] bg-white/95 dark:bg-[#0d121f]/95 backdrop-blur-xl border border-slate-200 dark:border-border-default rounded-xl shadow-2xl p-3 z-50 pointer-events-auto"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {/* Header Row with Title, Regime Badge & Status */}
                                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200 dark:border-border-subtle">
                                            <div className="flex items-center gap-2">
                                                <Sparkles size={13} className="text-violet-500 dark:text-violet-400" />
                                                <span className="text-xs font-bold text-text-primary uppercase tracking-wide">Praxis AI Intelligence</span>
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                                                    {fvRegime || 'CHOPPY'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {fvEdge && (
                                                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 ${
                                                        fvEdge.edge_detected
                                                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                            : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                                                    }`} title={fvEdge.reason}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${fvEdge.edge_detected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                                        {fvEdge.edge_detected ? 'ALPHA EDGE' : 'NOISE DOMINATES'}
                                                    </span>
                                                )}
                                                <button 
                                                    onClick={() => setShowAiFlyout(false)} 
                                                    className="text-text-tertiary hover:text-text-primary p-0.5 rounded transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* 2-Column Responsive Cockpit Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                            {/* ── COLUMN 1: Predictive Bias, Foundation Ensemble & Controls ── */}
                                            <div className="flex flex-col gap-2">
                                                {/* Directional Bias */}
                                                {fvBias && (() => {
                                                    const isBull = fvBias === 'bullish';
                                                    const isBear = fvBias === 'bearish';
                                                    const biasColor = isBull ? 'text-emerald-600 dark:text-emerald-400' : isBear ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400';
                                                    const confidence = fvSessionRef.current?.candles
                                                        ? Math.round(fvSessionRef.current.candles.reduce((a, c) => a + c.confidence, 0) / fvSessionRef.current.candles.length)
                                                        : null;
                                                    const confBarColor = confidence >= 70 ? 'bg-emerald-500 dark:bg-emerald-400' : confidence >= 50 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-rose-500 dark:bg-rose-400';

                                                    return (
                                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-background-surface/80 border border-slate-200 dark:border-border-subtle">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[9px] uppercase font-bold text-text-tertiary">Directional Bias</span>
                                                                <span className={`text-[11px] font-bold font-mono ${biasColor}`}>
                                                                    AI {fvBias.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            {confidence !== null && (
                                                                <div className="flex flex-col gap-1 mt-1.5">
                                                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                                                        <span className="text-text-tertiary text-[9px]">Confidence</span>
                                                                        <span className="text-violet-600 dark:text-violet-300 font-bold">{confidence}%</span>
                                                                    </div>
                                                                    <div className="h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                                                        <div className={`h-full rounded-full ${confBarColor} transition-all duration-500`} style={{ width: `${confidence}%` }} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {fvPAE?.scores?.length > 0 && (
                                                                <div className="flex flex-col gap-1 mt-1.5 pt-1 border-t border-slate-200 dark:border-border-subtle/60 text-[10px] font-mono">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-text-tertiary text-[9px]">Directional Accuracy</span>
                                                                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                                                                            {Math.round(fvPAE.scores.reduce((a, b) => a + b.da, 0) / fvPAE.scores.length * 100)}%
                                                                            <span className="text-text-tertiary font-normal ml-1">({fvPAE.scores.length} bars)</span>
                                                                        </span>
                                                                    </div>
                                                                    {(() => {
                                                                        const validScores = fvPAE.scores.filter(s => typeof s.errorPct === 'number');
                                                                        if (validScores.length === 0) return null;
                                                                        const avgErr = Math.round(validScores.reduce((a, b) => a + b.errorPct, 0) / validScores.length);
                                                                        const errColor = avgErr <= 25 ? 'text-emerald-600 dark:text-emerald-400' : avgErr <= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
                                                                        return (
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-text-tertiary text-[9px]">Mean Candle Error</span>
                                                                                <span className={`font-bold ${errColor}`}>
                                                                                    {avgErr}%
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* Foundation Model Ensemble & Conformal Weights */}
                                                {(fvActive || fvModelWeights?.length > 0 || fvEdge) && (
                                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-background-surface/80 border border-slate-200 dark:border-border-subtle flex flex-col gap-1.5">
                                                        <div className="flex items-center justify-between text-[9px] text-text-tertiary font-mono">
                                                            <span className="uppercase font-bold">Hedge Ensemble Weights</span>
                                                            <span>λ = {fvConformalMultiplier ? Number(fvConformalMultiplier).toFixed(3) : '1.000'}x</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            {(() => {
                                                                const rawWeights = (fvModelWeights || []).filter(mw => mw.model_id !== 'future_vision');
                                                                const existingMap = new Map(rawWeights.map(w => [w.model_id, w.weight]));
                                                                const activeModelSet = fvActiveModels ? new Set(fvActiveModels) : null;
                                                                
                                                                // Filter canonical models to only currently selected models
                                                                const activeCanonical = CANONICAL_ENSEMBLE_MODELS.filter(cm => 
                                                                    activeModelSet ? activeModelSet.has(cm.model_id) : true
                                                                );

                                                                const displayList = activeCanonical.map(cm => {
                                                                    const wt = existingMap.has(cm.model_id) 
                                                                        ? existingMap.get(cm.model_id) 
                                                                        : (fvEnsembleWeights?.[cm.model_id] || cm.defaultWeight);
                                                                    return {
                                                                        model_id: cm.model_id,
                                                                        weight: wt,
                                                                        label: cm.label
                                                                    };
                                                                });

                                                                const totalWt = displayList.reduce((acc, m) => acc + (m.weight || 0), 0);

                                                                return displayList.map((mw, idx) => {
                                                                    const pct = Math.round((totalWt > 0 ? (mw.weight / totalWt) : (1 / Math.max(displayList.length, 1))) * 100);
                                                                    const isStandby = mw.model_id === 'lag_llama' && pct <= 10;
                                                                    const label = mw.model_id === 'lag_llama' ? (isStandby ? 'Lag-Llama (Standby)' : 'Lag-Llama') : mw.label;
                                                                    const isLeading = fvEdge?.leading_model === mw.model_id;
                                                                    return (
                                                                        <div key={idx} className="flex flex-col gap-0.5">
                                                                            <div className="flex justify-between items-center text-[9px] font-mono">
                                                                                <span className={`truncate ${isLeading ? 'font-bold text-violet-600 dark:text-violet-300' : isStandby ? 'text-text-muted italic' : 'text-text-secondary'}`}>
                                                                                    {label}
                                                                                </span>
                                                                                <span className={`font-bold tabular-nums ${isStandby ? 'text-text-muted' : 'text-text-primary'}`}>{pct}%</span>
                                                                            </div>
                                                                            <div className="h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                                        mw.model_id === 'naive_baseline' ? 'bg-slate-400 dark:bg-slate-500' :
                                                                                        mw.model_id === 'chronos_bolt' ? 'bg-amber-500 dark:bg-amber-400' :
                                                                                        mw.model_id === 'kronos' ? 'bg-indigo-500 dark:bg-indigo-400' :
                                                                                        'bg-violet-400/50 dark:bg-violet-600/50'
                                                                                    }`}
                                                                                    style={{ width: `${pct}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                });
                                                            })()}
                                                            {/* Master LLM Agent — only displayed if currently selected */}
                                                            {(!fvActiveModels || fvActiveModels.includes('master_llm')) && (
                                                                <div className={`flex flex-col gap-0.5 ${(!fvActiveModels || CANONICAL_ENSEMBLE_MODELS.some(cm => fvActiveModels.includes(cm.model_id))) ? 'mt-0.5 pt-0.5 border-t border-border-subtle/40' : ''}`}>
                                                                    <div className="flex justify-between items-center text-[9px] font-mono">
                                                                        <span className="truncate text-sky-500 dark:text-sky-400 font-semibold flex items-center gap-1">
                                                                            <Brain size={10} className="shrink-0 text-sky-500 dark:text-sky-400" />
                                                                            <span>Master LLM (Synthesis)</span>
                                                                        </span>
                                                                        <span className="font-bold tabular-nums text-sky-500 dark:text-sky-400">
                                                                            {fvEnsembleWeights?.master_llm != null ? `${Math.round(Number(fvEnsembleWeights.master_llm))}%` : '45%'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                                                        <div 
                                                                            className="h-full rounded-full bg-sky-500 dark:bg-sky-400 transition-all duration-500" 
                                                                            style={{ width: `${fvEnsembleWeights?.master_llm != null ? Math.min(Math.round(Number(fvEnsembleWeights.master_llm)), 100) : 45}%` }} 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Future Vision Predictive Controls */}
                                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-background-surface/80 border border-slate-200 dark:border-border-subtle flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-wider flex items-center gap-1">
                                                            <Telescope size={11} className="text-violet-500 dark:text-violet-400" />
                                                            Future Vision Engine
                                                        </span>
                                                        {fvActive && (
                                                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                                                fvHasFutureCandles 
                                                                    ? 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20' 
                                                                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                            }`}>
                                                                {fvHasFutureCandles ? `${fvSessionRef.current?.candles?.length || 7} BARS PREDICTED` : 'FULFILLED'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <button
                                                            onClick={() => triggerFutureVision(Boolean(fvActive && fvHasFutureCandles))}
                                                            disabled={fvLoading}
                                                            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                                                                fvLoading 
                                                                    ? 'bg-violet-600/30 text-violet-300 cursor-wait border border-violet-500/30' 
                                                                    : 'bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/50 hover:shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                                                            }`}
                                                            title={(fvActive && fvHasFutureCandles) ? "Regenerate and blend forecast with fresh AI inference" : "Generate a single 7-bar AI predictive forecast on demand"}
                                                        >
                                                            {fvLoading ? (
                                                                <>
                                                                    <Loader size="tiny" color="purple" />
                                                                    <span>Predicting...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Sparkles size={11} />
                                                                    <span>{(fvActive && fvHasFutureCandles) ? 'Optimize & Blend' : 'Manual Predict'}</span>
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setFvAutoMode(p => {
                                                                    const next = !p;
                                                                    try {
                                                                        localStorage.setItem('praxis_fv_auto_mode', next ? 'true' : 'false');
                                                                    } catch {}
                                                                    updatePAEAutoMode(instrumentKey, timeframe, next);
                                                                    if (next) {
                                                                        import('sonner').then(({ toast }) => toast.success('Future Vision Auto-Generation Enabled', {
                                                                            description: 'Continuous predictive forecasts will generate automatically on every candle close.'
                                                                        }));
                                                                        if (!fvActive || !fvHasFutureCandles) {
                                                                            triggerFutureVision(false);
                                                                        }
                                                                    } else {
                                                                        import('sonner').then(({ toast }) => toast.info('Future Vision Auto-Generation Disabled'));
                                                                    }
                                                                    return next;
                                                                });
                                                            }}
                                                            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                                                                fvAutoMode 
                                                                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]' 
                                                                    : 'bg-slate-100 dark:bg-background-surface/80 hover:bg-slate-200 dark:hover:bg-background-surface text-text-secondary hover:text-text-primary border-slate-200 dark:border-border-subtle'
                                                            }`}
                                                            title="Automatically generates new predictions on every candle close"
                                                        >
                                                            <Telescope size={11} />
                                                            <span>Auto: {fvAutoMode ? 'ON' : 'OFF'}</span>
                                                            {fvAutoMode && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── COLUMN 2: Execution Friction, Net Edge & Active Formations ── */}
                                            <div className="flex flex-col gap-2 h-full min-h-0">
                                                {/* Execution Friction & Net Edge Box */}
                                                {fvFriction && (
                                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-background-surface/80 border border-slate-200 dark:border-border-subtle flex flex-col gap-1.5 text-[10px] font-mono shrink-0">
                                                        <div className="flex justify-between items-center pb-1 border-b border-slate-200 dark:border-border-subtle/60">
                                                            <span className="text-text-tertiary text-[9px] uppercase font-bold">Execution Friction</span>
                                                            <span className="text-text-secondary">{fvFriction.friction_drag_pct}% ({fvFriction.friction_breakdown?.mode || 'NSE'})</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-text-tertiary text-[9px]">Gross Expected Move</span>
                                                            <span className="font-bold text-text-primary">+{fvFriction.gross_edge_pct}%</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-text-tertiary text-[9px]">Net Tradeable Edge</span>
                                                            <span className={`font-bold ${fvFriction.net_edge_pct > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                                {fvFriction.net_edge_pct > 0 ? `+${fvFriction.net_edge_pct}%` : `${fvFriction.net_edge_pct}%`}
                                                            </span>
                                                        </div>
                                                        <div className={`mt-0.5 p-1 rounded text-[9px] leading-snug font-sans ${
                                                            fvFriction.tradeable_edge 
                                                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                                                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                                        }`}>
                                                            {fvFriction.reason}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Pattern Recognition Formations */}
                                                {patternScore && (
                                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-background-surface/80 border border-slate-200 dark:border-border-subtle flex-1 flex flex-col min-h-0">
                                                        <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-slate-200 dark:border-border-subtle/60 shrink-0">
                                                            <span className="text-[9px] uppercase font-bold text-text-tertiary">Active Formations</span>
                                                            <span className={`text-[10px] font-bold font-mono ${
                                                                patternScore.score > 2 ? 'text-emerald-600 dark:text-emerald-400' :
                                                                patternScore.score < -2 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                                                            }`}>
                                                                {patternScore.score > 0 ? '+' : ''}{patternScore.score} ({patternScore.label})
                                                            </span>
                                                        </div>
                                                        {patternScore.activePatterns.length > 0 ? (
                                                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-0.5 min-h-0">
                                                                {patternScore.activePatterns.map((p, i) => {
                                                                    const isSelected = hoveredPattern?.id === p.id && hoveredPattern?.time === p.time;
                                                                    return (
                                                                        <div 
                                                                            key={i} 
                                                                            onClick={() => setHoveredPattern(isSelected ? null : p)}
                                                                            className={`flex items-center justify-between text-[10px] px-1.5 py-1 rounded cursor-pointer transition-colors shrink-0 ${isSelected ? 'bg-slate-200/70 dark:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                                                        >
                                                                            <span className={`font-medium ${p.dir > 0 ? 'text-emerald-600 dark:text-emerald-400' : p.dir < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-text-tertiary'}`}>
                                                                                {p.name}
                                                                            </span>
                                                                            <div className="flex items-center gap-1.5 font-mono text-[9px]">
                                                                                <span className={p.contribution > 0 ? 'text-emerald-600 dark:text-emerald-400' : p.contribution < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}>
                                                                                    {p.contribution > 0 ? '+' : ''}{p.contribution}
                                                                                </span>
                                                                                <span className="text-text-tertiary">({p.age}b)</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 flex items-center justify-center text-[10px] text-text-tertiary italic py-2 text-center">
                                                                No active structural patterns detected.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Institutional High-Density Tabular OHLCV Status Bar */}
                    <OHLCLegend crosshairData={crosshairData} chartRef={chartRef} candleSeriesRef={candleSeriesRef} volumeSeriesRef={volumeSeriesRef} data={[...(data || []), ...(demoRealCandles || [])]} />
                </div>
            </div>

            {/* Developer Testing Bar (Cleanly anchored to bottom left, shifted when drawing toolbar is active) */}
            {!isMultiMode && (
                <div className={`absolute bottom-6 transition-all duration-200 z-20 ${showDrawing ? 'left-[76px]' : 'left-3'}`}>
                    {(() => {
                        if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) return null;
                        const addDemoRealCandle = () => {
                            const effectiveData = [...data, ...demoRealCandles];
                            const lastReal = effectiveData?.[effectiveData.length - 1];
                            if (!lastReal) return;

                            const drift = (Math.random() - 0.48) * 0.008;
                            const open  = lastReal.close;
                            const close = parseFloat((open * (1 + drift)).toFixed(2));
                            const high  = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.004)).toFixed(2));
                            const low   = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.004)).toFixed(2));

                            let nextTime;
                            const isDailyOrAbove = typeof lastReal.time !== 'number';

                            if (isDailyOrAbove) {
                                let date = typeof lastReal.time === 'string'
                                    ? (() => { const [y, m, d] = lastReal.time.split('T')[0].split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); })()
                                    : new Date(lastReal.time.year, lastReal.time.month - 1, lastReal.time.day);
                                date = getNextTradingDay(date);
                                if (typeof lastReal.time === 'string') {
                                    nextTime = formatDateKey(date);
                                } else {
                                    nextTime = { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
                                }
                            } else {
                                let minUtcMins = 1440;
                                let maxUtcMins = 0;
                                let barSize = 86400;
                                const lookback = Math.min(effectiveData.length, 500);
                                for (let i = effectiveData.length - lookback; i < effectiveData.length; i++) {
                                    const cTime = effectiveData[i].time;
                                    if (i > 0) {
                                        const diff = cTime - effectiveData[i-1].time;
                                        if (diff > 0 && diff < barSize) barSize = diff;
                                    }
                                    const d = new Date(cTime * 1000);
                                    const tm = d.getUTCHours() * 60 + d.getUTCMinutes();
                                    if (tm < minUtcMins) minUtcMins = tm;
                                    if (tm > maxUtcMins) maxUtcMins = tm;
                                }
                                maxUtcMins += Math.floor(barSize / 60);
                                if (minUtcMins >= maxUtcMins || maxUtcMins > 1440) {
                                    minUtcMins = 225; maxUtcMins = 600;
                                }

                                nextTime = getNextIntradayCandleTime(lastReal.time, barSize, minUtcMins, maxUtcMins);
                            }
                            const newCandle = { time: nextTime, open, high, low, close, volume: Math.min(lastReal.volume || 1000, 50000) };

                            setDemoRealCandles(prev => {
                                const updated = [...prev, newCandle];
                                setDemoLiveCandle(newCandle);
                                return updated;
                            });

                            const formattedLabel = typeof nextTime === 'object' && nextTime ? `${nextTime.year}-${String(nextTime.month).padStart(2, '0')}-${String(nextTime.day).padStart(2, '0')}` : String(nextTime);
                            import('sonner').then(({ toast }) =>
                                toast.success(`Demo REAL candle added at ${formattedLabel}`, { duration: 1500 })
                            );
                        };

                        const clearDemoData = () => {
                            setDemoRealCandles([]);
                            setDemoLiveCandle(null);
                            updateGhostMarkers([]);
                            if (fvSessionRef.current?.candles?.length && fvSessionRef.current?.times?.length) {
                                fvLiveBarIndexRef.current = 0;
                                _renderGhostCandles(fvSessionRef.current.candles, fvSessionRef.current.times);
                                const lastHistoricalMs = data?.length > 0 ? getMsTimestamp(data[data.length - 1].time) : 0;
                                const hasFuture = fvSessionRef.current.times.some(t => getMsTimestamp(t) > lastHistoricalMs);
                                setFvHasFutureCandles(hasFuture);
                            } else {
                                setFvHasFutureCandles(false);
                            }
                            import('sonner').then(({ toast }) => toast.info('Demo data cleared'));
                        };

                        return (
                            <div className="flex gap-1">
                                <button
                                    onClick={addDemoRealCandle}
                                    onMouseEnter={(e) => handleMouseEnter(e, `DEV: Fast-forward time (+1 real candle)`)}
                                    onMouseLeave={() => setHoveredIndicator(null)}
                                    className="pointer-events-auto flex items-center justify-center gap-0.5 px-1.5 h-5 rounded text-[9px] font-bold tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors"
                                >
                                    <Plus size={10} />
                                </button>
                                {demoRealCandles.length > 0 && (
                                    <button
                                        onClick={clearDemoData}
                                        onMouseEnter={(e) => handleMouseEnter(e, `DEV: Clear demo data`)}
                                        onMouseLeave={() => setHoveredIndicator(null)}
                                        className="pointer-events-auto flex items-center justify-center px-1.5 h-5 rounded text-[9px] font-bold tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 transition-colors"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                )}
                            </div>
                        );
                    })()}
                </div>
            )}

            <DrawingToolbar
                visible={showDrawing}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                activeColor={activeColor}
                setActiveColor={setActiveColor}
                onUndo={undo}
                onClearAll={clearAll}
            />

            <div className="flex-1 w-full relative min-h-0" ref={chartWrapperRef} onContextMenu={(e) => {
                if (fvActive && fvSessionRef.current) {
                    e.preventDefault();
                    
                    const rect = chartContainerRef.current?.getBoundingClientRect();
                    const x = rect ? e.clientX - rect.left : null;
                    let targetTime = hoveredTimeRef.current;
                    if (!targetTime && x != null && chartRef.current) {
                        try {
                            targetTime = chartRef.current.timeScale().coordinateToTime(x);
                        } catch (err) {
                            // ignore coordinate translation error
                        }
                    }

                    const targetKey = normalizeTimeKey(targetTime);
                    let hoveredGhostIndex = -1;
                    if (targetKey && fvSessionRef.current && fvSessionRef.current.times) {
                        hoveredGhostIndex = fvSessionRef.current.times.findIndex(t => normalizeTimeKey(t) === targetKey);
                    }

                    if (hoveredGhostIndex !== -1) {
                        // 1) Capture the exact time synchronously before the user moves their mouse to click the toast!
                        const targetDeleteTime = targetTime || fvSessionRef.current.times[hoveredGhostIndex];
                        
                        import('sonner').then(({ toast }) => {
                            toast.custom((t) => (
                                <div className="bg-slate-900 text-white p-4 rounded-lg shadow-xl border border-rose-900/50 flex flex-col gap-3 min-w-[320px]">
                                    <div className="font-semibold text-rose-400">Delete Prediction?</div>
                                    <div className="text-sm text-slate-300 leading-snug">
                                        You selected a specific ghost candle. Do you want to delete just this single candle, or the entire set it belongs to?
                                    </div>
                                    <div className="flex gap-2 justify-end mt-1">
                                        <button onClick={() => toast.dismiss(t)} className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded transition-colors">
                                            Cancel
                                        </button>
                                        <button onClick={() => {
                                            toast.dismiss(t);
                                            
                                            // 1) Delete the single candle from the permanent DB
                                            deletePAECandleByTime(instrumentKey, timeframe, targetDeleteTime);
                                            
                                            // 2) Seamlessly rebuild the continuous 3-month UI state from DB without reload
                                            const allSessions = getAllPAESessions(instrumentKey, timeframe);
                                            if (allSessions && allSessions.length > 0) {
                                                const effectiveData = [...(data || []), ...demoRealCandles];
                                                const lastRealTime = effectiveData.length > 0 ? effectiveData[effectiveData.length - 1].time : null;
                                                const { candles: continuousCandles, times: continuousTimes } = buildContinuousTimeline(allSessions, lastRealTime);
                                                
                                                if (continuousCandles.length > 0) {
                                                    if (fvSessionRef.current) {
                                                        fvSessionRef.current.candles = continuousCandles;
                                                        fvSessionRef.current.times = continuousTimes;
                                                    }
                                                    
                                                    _renderGhostCandles(continuousCandles, continuousTimes, false);
                                                    
                                                    // Remove marker for this deleted candle
                                                    const delKey = normalizeTimeKey(targetDeleteTime);
                                                    const remainingMarkers = ghostMarkersRef.current.filter(m => normalizeTimeKey(m.time) !== delKey);
                                                    updateGhostMarkers(remainingMarkers);
                                                    
                                                    const hasFuture = continuousTimes.some(t => getMsTimestamp(t) > getMsTimestamp(lastRealTime));
                                                    setFvHasFutureCandles(hasFuture);
                                                    setFvPAE(getPAESession(instrumentKey, timeframe));
                                                } else {
                                                    clearPAESession(instrumentKey, timeframe);
                                                    setFvActive(false);
                                                    setFvHasFutureCandles(false);
                                                    setFvAutoMode(false);
                                                    setFvBias(null);
                                                    setFvRisk('');
                                                    setFvPAE(null);
                                                    setFvModel(null);
                                                    fvSessionRef.current = null;
                                                    fvLiveBarIndexRef.current = 0;
                                                    updateGhostMarkers([]);
                                                    _clearGhostSeries();
                                                }
                                            } else {
                                                clearPAESession(instrumentKey, timeframe);
                                                setFvActive(false);
                                                setFvHasFutureCandles(false);
                                                setFvAutoMode(false);
                                                setFvBias(null);
                                                setFvRisk('');
                                                setFvPAE(null);
                                                setFvModel(null);
                                                fvSessionRef.current = null;
                                                fvLiveBarIndexRef.current = 0;
                                                updateGhostMarkers([]);
                                                _clearGhostSeries();
                                            }
                                            setHoveredIndicator(null);
                                        }} className="px-3 py-1.5 text-xs font-medium bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded border border-rose-500/30 transition-colors">
                                            Delete 1 Candle
                                        </button>
                                        <button onClick={() => {
                                            toast.dismiss(t);
                                            // 3) Delete the entire session containing this candle
                                            deletePAESessionByTime(instrumentKey, timeframe, targetDeleteTime);
                                            
                                            // Seamlessly rebuild continuous timeline
                                            const allSessions = getAllPAESessions(instrumentKey, timeframe);
                                            if (allSessions && allSessions.length > 0) {
                                                const effectiveData = [...(data || []), ...demoRealCandles];
                                                const lastRealTime = effectiveData.length > 0 ? effectiveData[effectiveData.length - 1].time : null;
                                                const { candles: continuousCandles, times: continuousTimes } = buildContinuousTimeline(allSessions, lastRealTime);
                                                
                                                if (continuousCandles.length > 0) {
                                                    if (fvSessionRef.current) {
                                                        fvSessionRef.current.candles = continuousCandles;
                                                        fvSessionRef.current.times = continuousTimes;
                                                    }
                                                    
                                                    _renderGhostCandles(continuousCandles, continuousTimes, false);
                                                    
                                                    // Prune markers
                                                    updateGhostMarkers([]);
                                                    
                                                    const hasFuture = continuousTimes.some(t => getMsTimestamp(t) > getMsTimestamp(lastRealTime));
                                                    setFvHasFutureCandles(hasFuture);
                                                    setFvPAE(getPAESession(instrumentKey, timeframe));
                                                } else {
                                                    clearPAESession(instrumentKey, timeframe);
                                                    setFvActive(false);
                                                    setFvHasFutureCandles(false);
                                                    setFvAutoMode(false);
                                                    setFvBias(null);
                                                    setFvRisk('');
                                                    setFvPAE(null);
                                                    setFvModel(null);
                                                    fvSessionRef.current = null;
                                                    fvLiveBarIndexRef.current = 0;
                                                    updateGhostMarkers([]);
                                                    _clearGhostSeries();
                                                }
                                            } else {
                                                clearPAESession(instrumentKey, timeframe);
                                                setFvActive(false);
                                                setFvHasFutureCandles(false);
                                                setFvAutoMode(false);
                                                setFvBias(null);
                                                setFvRisk('');
                                                setFvPAE(null);
                                                setFvModel(null);
                                                fvSessionRef.current = null;
                                                fvLiveBarIndexRef.current = 0;
                                                updateGhostMarkers([]);
                                                _clearGhostSeries();
                                            }
                                            setHoveredIndicator(null);
                                        }} className="px-3 py-1.5 text-xs font-medium bg-rose-600 text-white hover:bg-rose-500 rounded transition-colors shadow-sm shadow-rose-900/50">
                                            Delete Entire Set
                                        </button>
                                    </div>
                                </div>
                            ), { duration: 15000 });
                        });
                    } else {
                        import('sonner').then(({ toast }) => {
                            toast.error('Delete Future Vision Prediction?', {
                                description: 'Are you sure you want to permanently delete ALL predictions in this set?',
                                duration: 10000,
                                cancel: { label: 'Cancel' },
                                action: {
                                    label: 'Delete All',
                                    onClick: () => {
                                        clearPAESession(instrumentKey, timeframe);
                                        setFvActive(false);
                                        setFvAutoMode(false);
                                        setFvBias(null);
                                        setFvRisk('');
                                        setFvPAE(null);
                                        setFvModel(null);
                                        fvSessionRef.current = null;
                                        fvLiveBarIndexRef.current = 0;
                                        updateGhostMarkers([]);
                                        _clearGhostSeries();
                                        setHoveredIndicator(null);
                                    }
                                }
                            });
                        });
                    }
                }
            }}
            onMouseLeave={() => {
                hoveredTimeRef.current = null;
                setCrosshairData(null);
                setGhostTooltip(null);
            }}>
                <div ref={chartContainerRef} className="absolute inset-0" />
                <DrawingCanvas
                    chartRef={chartRef}
                    candleSeriesRef={candleSeriesRef}
                    containerRef={chartWrapperRef}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    activeColor={activeColor}
                    drawings={drawings}
                    addDrawing={addDrawing}
                    deleteDrawing={deleteDrawing}
                />
                
                {/* Ghost PAE Clean Hover Tooltip */}
                {ghostTooltip && (
                    <div 
                        className="absolute pointer-events-none z-50 text-[10px] font-mono px-2 py-1 rounded-md bg-[#0a0e17]/90 border backdrop-blur-md whitespace-nowrap shadow-xl flex items-center gap-1.5"
                        style={{
                            left: ghostTooltip.x,
                            top: ghostTooltip.y - 30,
                            transform: 'translateX(-50%)',
                            borderColor: ghostTooltip.color,
                            boxShadow: `0 0 14px ${ghostTooltip.color}33`,
                        }}
                    >
                        <Sparkles size={11} style={{ color: ghostTooltip.color }} />
                        <span className="text-text-tertiary text-[9px] uppercase font-sans font-bold">{ghostTooltip.title || 'AI Forecast'}:</span>
                        <span className="font-bold" style={{ color: ghostTooltip.color }}>{ghostTooltip.text}</span>
                    </div>
                )}
                {/* Sub-Pane Institutional Readout Headers (dynamically anchored to native pane coordinates) */}
                {showRSI && (
                    <div 
                        className="absolute left-0 right-0 pointer-events-none z-10 select-none transition-all duration-150"
                        style={{ top: panePositions.rsi != null ? `${panePositions.rsi + 4}px` : (showMACD ? '80%' : '75%') }}
                    >
                        {/* RSI Header & Live Readout */}
                        <div className="flex items-center gap-2 px-3 py-0.5 text-[11px] font-mono tabular-nums">
                            <span className="font-semibold text-violet-400">RSI ({activeIndicatorConfig.rsi.period})</span>
                            <span className="font-bold text-violet-300 tabular-nums">
                                {(oscillatorHover.rsi ?? latestOscillatorsRef.current.rsi) != null 
                                    ? Number(oscillatorHover.rsi ?? latestOscillatorsRef.current.rsi).toFixed(2) 
                                    : '--'}
                            </span>
                            <span className="text-[9px] text-text-tertiary">{activeIndicatorConfig.rsi.oversold} / {activeIndicatorConfig.rsi.overbought}</span>
                            <button
                                onClick={() => setShowRSI(false)}
                                className="pointer-events-auto p-0.5 rounded text-text-tertiary hover:text-rose-400 hover:bg-white/10 transition-colors ml-1 cursor-pointer"
                                title="Close RSI"
                            >
                                <X size={11} />
                            </button>
                        </div>
                    </div>
                )}

                {showMACD && (
                    <div 
                        className="absolute left-0 right-0 pointer-events-none z-10 select-none transition-all duration-150"
                        style={{ top: panePositions.macd != null ? `${panePositions.macd + 4}px` : (showRSI ? '60%' : '75%') }}
                    >
                        {/* MACD Header & Live Readout */}
                        <div className="flex items-center gap-2.5 px-3 py-0.5 text-[11px] font-mono tabular-nums">
                            <span className="font-semibold text-blue-400">MACD ({activeIndicatorConfig.macd.fast}, {activeIndicatorConfig.macd.slow}, {activeIndicatorConfig.macd.signal})</span>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-text-tertiary">MACD:</span>
                                <span className="text-blue-400 font-semibold tabular-nums">
                                    {(oscillatorHover.macd ?? latestOscillatorsRef.current.macd) != null 
                                        ? Number(oscillatorHover.macd ?? latestOscillatorsRef.current.macd).toFixed(2) 
                                        : '--'}
                                </span>
                                <span className="text-text-tertiary">Signal:</span>
                                <span className="text-amber-400 font-semibold tabular-nums">
                                    {(oscillatorHover.signal ?? latestOscillatorsRef.current.signal) != null 
                                        ? Number(oscillatorHover.signal ?? latestOscillatorsRef.current.signal).toFixed(2) 
                                        : '--'}
                                </span>
                                <span className="text-text-tertiary">Hist:</span>
                                {(() => {
                                    const h = oscillatorHover.hist ?? latestOscillatorsRef.current.hist;
                                    if (h == null) return <span className="text-text-tertiary">--</span>;
                                    const isPos = h >= 0;
                                    return (
                                        <span className={`font-semibold tabular-nums ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {isPos ? `+${Number(h).toFixed(2)}` : Number(h).toFixed(2)}
                                        </span>
                                    );
                                })()}
                            </div>
                            <button
                                onClick={() => setShowMACD(false)}
                                className="pointer-events-auto p-0.5 rounded text-text-tertiary hover:text-rose-400 hover:bg-white/10 transition-colors ml-1 cursor-pointer"
                                title="Close MACD"
                            >
                                <X size={11} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isBackfilling && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.3 }}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                    >
                        <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            <span className="text-[10px] font-medium text-blue-300 tracking-wide">Loading history...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showValuationBands && fundamentalData && fundamentalData.scoreTimeline && fundamentalData.scoreTimeline.length > 0 && (
                <FundamentalTimeline data={fundamentalData.scoreTimeline} height={80} />
            )}

            
            {/* Custom Fixed Tooltip for Indicators */}
            <AnimatePresence>
                {hoveredIndicator && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="fixed z-[100] bg-background-surface/95 backdrop-blur-xl border border-border-subtle text-text-primary text-[11px] font-medium px-2.5 py-1.5 rounded-md shadow-2xl pointer-events-none whitespace-nowrap"
                        style={{
                            top: hoveredIndicator.top,
                            left: hoveredIndicator.left,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        {hoveredIndicator.label}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

function FundamentalTimeline({ data, height }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        if (!canvasRef.current || !data || data.length === 0) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = height * dpr;
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        const width = canvas.offsetWidth;
        const padding = 10;
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        data.forEach((point, i) => {
            const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
            const y = height - padding - ((point.score / 100) * (height - padding * 2));
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        [25, 50, 75].forEach(level => {
            const y = height - padding - ((level / 100) * (height - padding * 2));
            ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
        });
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('Fundamental Score (0-100)', padding, 12);
    }, [data, height]);
    return React.createElement('div', { className: 'mt-4' }, React.createElement('canvas', { ref: canvasRef, className: 'w-full' }));
}









