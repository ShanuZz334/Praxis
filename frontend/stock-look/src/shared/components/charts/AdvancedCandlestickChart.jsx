/**
 * @file AdvancedCandlestickChart.jsx
 * @purpose Interactive financial chart with AI insights, fundamental overlays, and drawing toolkit.
 * @date 2026-07-20
 */

import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, createSeriesMarkers } from 'lightweight-charts';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilRuler, Activity, TrendingUp, BarChart2, Layers, Plus, Waves, TrendingUpDown, Anchor, AlignJustify, MoreHorizontal, Cloud, Frame, SlidersHorizontal, Spline } from 'lucide-react';
import DrawingToolbar, { COLORS } from './drawing/DrawingToolbar';
import DrawingCanvas from './drawing/DrawingCanvas';
import { useDrawings } from './drawing/useDrawings';
import { calculateSupertrend, calculateVWAP, calculateEMA, calculateCPR } from '../../utils/chartUtils';
import { calculateMACD, calculatePSAR, calculateIchimoku, calculateAnchoredVWAP, calculateAutoFib, calculateRSIDivergence } from '../../utils/advancedIndicators';
import { computeAdaptiveBands } from '../../utils/adaptiveBandsEngine';
import { analyzeChartPatterns } from '../../utils/patternEngine';

import { useTheme } from '../../context/ThemeContext';
import { FO_INDICES, FO_EQUITIES } from '../../utils/foInstruments';
import { assembleContext, getFVSettings } from '../../utils/futureVisionContextAssembler';
import { storePrediction, scoreClosedCandle, getPAESession, clearPAESession, computeConfidence, getAllPAESessions, updatePAEAutoMode, deletePAECandleByTime, deletePAESessionByTime, storeLiveErrors } from '../../utils/predictionAccuracyEngine';
import { blendRollingForecasts } from '../../utils/FutureVisionBlender';
import axiosInstance from '../../utils/axiosInstance';
import { useDataRegistry } from '../../context/DataRegistryContext';
import { Telescope, Info, Eye, EyeOff, Microscope } from 'lucide-react';
import Loader from '../ui/Loader';
import OHLCLegend from './OHLCLegend';
import { getGlobalInsightCache } from '../ui/AiInsightSection';

const DEFAULT_DATA = [];
const DEFAULT_FUNDAMENTAL_DATA = {};
const DEFAULT_EVENTS = [];

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
    
    const [hoveredIndicator, setHoveredIndicator] = useState(null);

    const { theme, tradingMode } = useTheme();
    // Derive bandsMode from global tradingMode (intraday -> scalp)
    const bandsModeTheme = tradingMode === 'intraday' ? 'scalp' : (tradingMode || 'swing');
    const isLight = theme === 'light';

    const { getMasterSnapshot } = useDataRegistry();

    const [fvActive, setFvActive] = useState(false);
    const [fvLoading, setFvLoading] = useState(false);
    const [fvBias, setFvBias] = useState(null);
    const [fvRisk, setFvRisk] = useState('');
    const [fvPAE, setFvPAE] = useState(null);
    const [fvModel, setFvModel] = useState(null);
    const [fvVisible, setFvVisible] = useState(true);
    const [fvAutoMode, setFvAutoMode] = useState(false);
    
    // Developer testing states
    const [demoRealCandles, setDemoRealCandles] = useState([]);
    const [demoLiveCandle, setDemoLiveCandle] = useState(null);

    const [patternScore, setPatternScore] = useState(null);
    const [hoveredPattern, setHoveredPattern] = useState(null);

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

    const liveIndicatorSnapshotRef = useRef({});

    // 🎯 PACE & Analyst: Fetch calibration profile & brief on instrument/timeframe change 🎯
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
                analystBriefRef.current = res.data?.brief || null;
                if (res.data?.brief) console.log(`[OvernightAnalyst] Loaded brief for ${instrumentKey}/${timeframe}`);
            })
            .catch(() => { /* silent */ });

    }, [instrumentKey, timeframe]);

    // 🎯 PACE: After bar close, post score to backend to update permanent profile 🎯──
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
            rightPriceScale: {
                borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                scaleMargins: { top: 0.1, bottom: 0.2 },
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
            upColor:         'rgba(167,139,250,0.25)', 
            downColor:       'transparent',            
            borderVisible:   true,
            borderUpColor:   'rgba(167,139,250,0.7)',
            borderDownColor: 'rgba(167,139,250,0.4)',
            wickUpColor:     'rgba(167,139,250,0.6)',
            wickDownColor:   'rgba(167,139,250,0.3)',
            priceLineVisible:      false,
            lastValueVisible:      false,
            crosshairMarkerVisible: false,
        });

        candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
            wickUpColor: '#26a69a', wickDownColor: '#ef5350', priceLineVisible: true,
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
            visible: true,
        });

        undervaluedSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(34,197,94,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false,
        });
        fairValueSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(255,255,255,0.5)', lineWidth: 1, priceLineVisible: true, lastValueVisible: true,
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

        macdHistRef.current = chart.addSeries(HistogramSeries, { priceScaleId: 'macd', priceFormat: { type: 'volume' } });
        macdLineRef.current = chart.addSeries(LineSeries, { priceScaleId: 'macd', color: '#2962FF', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        signalLineRef.current = chart.addSeries(LineSeries, { priceScaleId: 'macd', color: '#FF6D00', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        chart.priceScale('macd').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

        psarRef.current = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 2, lineStyle: 3, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });


        ichimokuTenkanRef.current = chart.addSeries(LineSeries, { color: '#0ea5e9', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        ichimokuKijunRef.current = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        ichimokuSpanARef.current = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        ichimokuSpanBRef.current = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

        anchoredVwapRef.current = chart.addSeries(LineSeries, { color: '#fb923c', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        
        rsiRef.current = chart.addSeries(LineSeries, { priceScaleId: 'rsi', color: '#a78bfa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        chart.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });



        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth || 600,
                    height: chartContainerRef.current.clientHeight || 350,
                });
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
            if (param.time && param.point && param.seriesData.get(candleSeriesRef.current)) {
                const d = param.seriesData.get(candleSeriesRef.current);
                setCrosshairData({ open: d.open, high: d.high, low: d.low, close: d.close });
            } else {
                setCrosshairData(null);
            }
            
            // Ghost PAE Tooltip
            if (param.time && param.point && ghostCandleSeriesRef.current && param.seriesData.get(ghostCandleSeriesRef.current)) {
                const gMarker = ghostMarkersRef.current.find(m => {
                    if (typeof m.time === 'number' && typeof param.time === 'number') return m.time === param.time;
                    if (m.time?.year) return (m.time.year === param.time.year && m.time.month === param.time.month && m.time.day === param.time.day);
                    return m.time === param.time;
                });
                if (gMarker) {
                    setGhostTooltip({
                        x: param.point.x,
                        y: param.point.y,
                        text: gMarker.text,
                        color: gMarker.color
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
            rightPriceScale: { borderColor: _isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' },
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
                    color: liveCandle.close >= liveCandle.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)'
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
    // When FV is active and a new live tick arrives, check if a new bar has closed
    // and score it against the stored prediction.
    useEffect(() => {
        const effectiveLiveCandle = demoLiveCandle || liveCandle;
        if (!fvActive || !effectiveLiveCandle || !fvSessionRef.current) return;

        const session = fvSessionRef.current;
        const barIdx  = fvLiveBarIndexRef.current;

        if (barIdx < session.candles.length) {
            // -----------------------------------------------------------------
            // REAL-TIME ERR% MARKER: Show live error % on the currently-forming bar
            // This runs on every tick so the marker updates in real time.
            // -----------------------------------------------------------------
            const currentGhost = session.candles[barIdx];
            if (currentGhost && !currentGhost.deleted && ghostCandleSeriesRef.current) {
                const errOpen  = Math.abs(currentGhost.open  - effectiveLiveCandle.open)  / Math.max(effectiveLiveCandle.open,  0.001);
                const errHigh  = Math.abs(currentGhost.high  - effectiveLiveCandle.high)  / Math.max(effectiveLiveCandle.high,  0.001);
                const errLow   = Math.abs(currentGhost.low   - effectiveLiveCandle.low)   / Math.max(effectiveLiveCandle.low,   0.001);
                const errClose = Math.abs(currentGhost.close - effectiveLiveCandle.close) / Math.max(effectiveLiveCandle.close, 0.001);
                const mape = ((errOpen + errHigh + errLow + errClose) / 4) * 100;
                
                const markerTime = session.times[barIdx];
                const liveMarker = {
                    time: markerTime,
                    position: 'aboveBar',
                    color: mape < 1 ? '#10b981' : mape < 2 ? '#f59e0b' : '#ef4444',
                    shape: 'arrowDown',
                    text: `${mape.toFixed(1)}%`,
                    size: 1
                };

                // Replace any existing marker at this time slot and re-apply
                const filtered = ghostMarkersRef.current.filter(m => {
                    if (typeof m.time === 'number' && typeof markerTime === 'number') return m.time !== markerTime;
                    if (m.time?.year) return !(m.time.year === markerTime?.year && m.time.month === markerTime?.month && m.time.day === markerTime?.day);
                    return m.time !== markerTime;
                });
                ghostMarkersRef.current = [...filtered, liveMarker];

                // Disable native overlapping arrows; we now use the custom clean hover tooltip
                // if (!ghostMarkersPluginRef.current && ghostCandleSeriesRef.current) {
                //     const plugin = createSeriesMarkers(ghostCandleSeriesRef.current, ghostMarkersRef.current);
                //     ghostMarkersPluginRef.current = plugin;
                //     if (typeof ghostCandleSeriesRef.current.attachPrimitive === 'function') {
                //         ghostCandleSeriesRef.current.attachPrimitive(plugin);
                //     }
                // } else if (ghostMarkersPluginRef.current) {
                //     ghostMarkersPluginRef.current.setMarkers(ghostMarkersRef.current);
                // }
                
                // Persist live errors into PAE DB so auto-mode next generation gets real feedback
                storeLiveErrors(
                    session.instrumentKey || instrumentKey,
                    session.timeframe || timeframe,
                    barIdx,
                    mape,
                    effectiveLiveCandle,
                    currentGhost
                );
            }

            // -----------------------------------------------------------------
            // BAR-CLOSE SCORING: Only runs when live time has PASSED the predicted bar's time
            // -----------------------------------------------------------------
            const expectedTime = session.times[barIdx];
            
            let isTimePassed = false;
            if (typeof effectiveLiveCandle.time === 'number' && typeof expectedTime === 'number') {
                isTimePassed = effectiveLiveCandle.time > expectedTime;
            } else {
                const liveT = new Date(effectiveLiveCandle.time).getTime();
                const expT = new Date(expectedTime).getTime();
                isTimePassed = liveT > expT;
            }
        
            if (!isTimePassed) return;

            const barScore = scoreClosedCandle(
                session.instrumentKey,
                session.timeframe,
                barIdx,
                effectiveLiveCandle
            );
            if (barScore) {
                fvLiveBarIndexRef.current = barIdx + 1;
                // Update PAE HUD
                const paeSession = getPAESession(session.instrumentKey, session.timeframe);
                setFvPAE(paeSession);

                // ── PACE: push bar score to permanent backend calibration ──
                postPACEScore(barScore, effectiveLiveCandle);

                // Dim the ghost candle that was just scored
                if (ghostCandleSeriesRef.current && session.candles[barIdx]) {
                    _renderGhostCandles(session.candles, session.times, true);
                }
                
                // If auto mode is enabled, trigger a fresh prediction upon bar close
                if (fvAutoMode) {
                    triggerFutureVision();
                }
            }
        }
    }, [liveCandle, demoLiveCandle, fvActive]);

    // ── Ghost Candle Renderer ────────────────────────────────────────────────────
    const _renderGhostCandles = (candles, times, withPAEDimming) => {
        if (!ghostCandleSeriesRef.current) return;
        if (!candles?.length || !times?.length) return;

        // The time of the very last REAL candle in the chart
        let lastValidTime = 0;

        let ghostData = candles
            .map((c, i) => {
                const base = {
                    time:  times[i],
                    open:  Number(c.open)  || 0,
                    high:  Number(c.high)  || 0,
                    low:   Number(c.low)   || 0,
                    close: Number(c.close) || 0,
                };
                
                if (c.deleted) {
                    return {
                        ...base,
                        color: 'transparent',
                        borderColor: 'transparent',
                        wickColor: 'transparent',
                        // Also explicitly override up/down colors just in case
                        upColor: 'transparent',
                        downColor: 'transparent',
                        borderUpColor: 'transparent',
                        borderDownColor: 'transparent',
                        wickUpColor: 'transparent',
                        wickDownColor: 'transparent'
                    };
                }
                
                return base;
            })
            .filter(c => c.time != null && c.open > 0);

        // Lightweight Charts FATAL ERROR FIX:
        // Times MUST be strictly increasing and must be > the last real candle's time.
        // If times duplicate or go backward, LWC throws "Cannot read properties of undefined (reading 'startTime')"
        ghostData = ghostData.filter(c => {
            // Helper to compare times (handles both UNIX seconds and YYYY-MM-DD string)
            const getMs = (t) => {
                if (typeof t === 'number') return t; // UNIX timestamp
                if (typeof t === 'string') return new Date(t).getTime();
                if (t?.year) return new Date(t.year, t.month - 1, t.day).getTime();
                return 0;
            };
            
            const currMs = getMs(c.time);
            const prevMs = getMs(lastValidTime);

            if (currMs > prevMs) {
                lastValidTime = c.time; // Update running last valid time
                return true;
            }
            return false; // Skip if not strictly increasing
        });

        if (!ghostData.length) {
            console.warn('[FutureVision] No valid ghost candles to render after strictly increasing filter.');
            return;
        }

        console.log('[FutureVision] Rendering ghost candles:', ghostData.length, 'candles. First time:', ghostData[0]?.time);
        ghostCandleSeriesRef.current.setData(ghostData);
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
        ? `⚠️ AI summaries need attention:\n${fvIssues.join('\n')}`
        : null;


    // ── Future Vision: Trigger Function ─────────────────────────────────────────
    const triggerFutureVision = async () => {
        if (fvLoading) return;

        

        if (fvStaleMsg && !fvIgnoreStaleRef.current) {
            import('sonner').then(({ toast }) => {
                const lines = fvIssues;
                toast.warning('Future Vision — AI Summaries Needed', {
                    description: lines.join('\n'),
                    duration: 10000,
                    action: {
                        label: 'Ignore & Run',
                        onClick: () => {
                            fvIgnoreStaleRef.current = true;
                            triggerFutureVision();
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
            const registryFundamentals = masterSnapshot.fundamentals || {};
            const resolvedEvents = events || [];

            // Assemble payload using the pre-digested AI narratives
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
                patternScore: patternScore
            });


            // Debug log — visible in browser console to verify all data is populated
            console.groupCollapsed('[FutureVision] Context Payload Preview');
            console.log('Indicators snapshot:', registryTechnicals);
            console.log('Fundamentals (merged):', registryFundamentals);
            console.log('Events:', resolvedEvents);
            console.log('Master Registry pages:', Object.keys(masterSnapshot || {}));
            console.log('Payload length (chars):', contextPayload.length);
            console.groupEnd();

            // Call backend
            const res = await axiosInstance.post('/api/v1/future-vision/predict', {
                contextPayload,
                instrumentKey,
                timeframe,
                horizonBars,
            });

            let { candles, overall_bias, key_risk } = res.data;

            // --- MVUE Institutional Blending ---
            const oldSession = fvSessionRef.current;
            if (oldSession && oldSession.candles && oldSession.candles.length > 0) {
                const oldRemaining = oldSession.candles.slice(fvLiveBarIndexRef.current);
                if (oldRemaining.length > 0) {
                    const blended = blendRollingForecasts(oldRemaining, candles);
                    candles = blended;
                    import('sonner').then(({ toast }) => toast.success('MVUE Blending Applied', { description: 'Prior predictions optimally blended with fresh data.', duration: 3000 }));
                }
            }

            fvLiveBarIndexRef.current = 0;

            // Generate robust future market timestamps for ghost candles
            const lastCandle = data[data.length - 1];
            const times = [];
            const isDailyOrAbove = typeof lastCandle.time !== 'number';

            if (isDailyOrAbove) {
                let currentMs = typeof lastCandle.time === 'string' 
                    ? new Date(lastCandle.time).getTime() 
                    : new Date(lastCandle.time.year, lastCandle.time.month - 1, lastCandle.time.day).getTime();
                
                for (let i = 0; i < candles.length; i++) {
                    currentMs += 86400000;
                    let date = new Date(currentMs);
                    while (date.getDay() === 0 || date.getDay() === 6) {
                        currentMs += 86400000;
                        date = new Date(currentMs);
                    }
                    if (typeof lastCandle.time === 'string') {
                        times.push(date.toISOString().split('T')[0]);
                    } else {
                        times.push({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });
                    }
                }
            } else {
                let minUtcMins = 1440;
                let maxUtcMins = 0;
                let barSize = 86400;
                const lookback = Math.min(data.length, 500);
                for (let i = data.length - lookback; i < data.length; i++) {
                    const cTime = data[i].time;
                    if (i > 0) {
                        const diff = cTime - data[i-1].time;
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
                
                let currentTime = lastCandle.time;
                for (let i = 0; i < candles.length; i++) {
                    currentTime += barSize;
                    let date = new Date(currentTime * 1000);
                    let tm = date.getUTCHours() * 60 + date.getUTCMinutes();
                    
                    if (tm >= maxUtcMins || tm < minUtcMins) {
                        if (tm >= maxUtcMins) date.setUTCDate(date.getUTCDate() + 1);
                        if (maxUtcMins < 1400) {
                            if (date.getUTCDay() === 6) date.setUTCDate(date.getUTCDate() + 2);
                            if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
                        }
                        date.setUTCHours(Math.floor(minUtcMins / 60), minUtcMins % 60, 0, 0);
                        currentTime = Math.floor(date.getTime() / 1000);
                    }
                    times.push(currentTime);
                }
            }

            // Store session for PAE
            fvSessionRef.current = { candles, instrumentKey, timeframe, times };
            storePrediction(instrumentKey, timeframe, tradingMode || 'swing', candles, overall_bias, key_risk, times, res.data.modelUsed);
            
            // Persist auto mode flag
            updatePAEAutoMode(instrumentKey, timeframe, fvAutoMode);

            // Render ghost candles
            _renderGhostCandles(candles, times, false);

            setFvBias(overall_bias || 'neutral');
            setFvRisk(key_risk || '');
            setFvModel(res.data.modelUsed);
            setFvActive(true);

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



    // Check for stored PAE session on mount or instrument/timeframe change
    useEffect(() => {
        if (!chartRef.current) return;
        const allSessions = getAllPAESessions(instrumentKey, timeframe);
        
        if (allSessions && allSessions.length > 0) {
            // Build a continuous, non-overlapping history of all ghost candles
            const uniqueCandles = new Map();
            const uniqueTimes = new Map();
            
            for (const session of allSessions) {
                if (!session.candles || !session.times) continue;
                for (let i = 0; i < session.candles.length; i++) {
                    const t = session.times[i];
                    uniqueCandles.set(t, session.candles[i]);
                    uniqueTimes.set(t, t);
                }
            }
            
            // Sort chronologically
            const sortedTimes = Array.from(uniqueTimes.keys()).sort((a, b) => {
                const ta = typeof a === 'object' ? new Date(a.year, a.month-1, a.day).getTime() : new Date(a).getTime();
                const tb = typeof b === 'object' ? new Date(b.year, b.month-1, b.day).getTime() : new Date(b).getTime();
                return ta - tb;
            });
            
            const continuousCandles = sortedTimes.map(t => uniqueCandles.get(t));
            const continuousTimes = sortedTimes.map(t => uniqueTimes.get(t));
            
            const latestSession = allSessions[allSessions.length - 1];

            fvSessionRef.current = { 
                candles: continuousCandles, 
                instrumentKey: latestSession.instrumentKey, 
                timeframe: latestSession.timeframe, 
                times: continuousTimes 
            };
            
            // Fast-forward fvLiveBarIndexRef to match the current real time
            let newIdx = 0;
            if (data && data.length > 0) {
                const lastTime = data[data.length - 1].time;
                for (let i = 0; i < continuousTimes.length; i++) {
                    const t = continuousTimes[i];
                    
                    const getMs = (timeObj) => {
                        if (typeof timeObj === 'number') return timeObj;
                        if (typeof timeObj === 'string') return new Date(timeObj).getTime();
                        if (timeObj && timeObj.year) return new Date(timeObj.year, timeObj.month - 1, timeObj.day).getTime();
                        return 0;
                    };
                    
                    if (getMs(t) <= getMs(lastTime)) {
                        newIdx = i + 1;
                    }
                }
            }
            fvLiveBarIndexRef.current = newIdx;
            
            setFvBias(latestSession.bias);
            setFvRisk(latestSession.risk || '');
            setFvModel(latestSession.modelUsed);
            setFvActive(true);
            setFvAutoMode(latestSession.autoMode || false);
            
            // Recompute historical MAPE markers for any ghost candles that have already been overtaken by real candles
            if (data && data.length > 0 && newIdx > 0) {
                const restoredMarkers = [];
                for (let i = 0; i < newIdx; i++) {
                    const ghost = continuousCandles[i];
                    const gTime = continuousTimes[i];
                    
                    // Find the exact real candle that matched this time
                    const realCandle = data.find(d => {
                        if (d.time === gTime) return true;
                        if (d.time && gTime && d.time.year === gTime.year && d.time.month === gTime.month && d.time.day === gTime.day) return true;
                        return false;
                    });
                    
                    if (realCandle && ghost) {
                        const errOpen = Math.abs(ghost.open - realCandle.open) / Math.max(realCandle.open, 0.001);
                        const errHigh = Math.abs(ghost.high - realCandle.high) / Math.max(realCandle.high, 0.001);
                        const errLow = Math.abs(ghost.low - realCandle.low) / Math.max(realCandle.low, 0.001);
                        const errClose = Math.abs(ghost.close - realCandle.close) / Math.max(realCandle.close, 0.001);
                        const mape = ((errOpen + errHigh + errLow + errClose) / 4) * 100;
                        
                        restoredMarkers.push({
                            time: gTime,
                            position: 'aboveBar',
                            color: mape < 1 ? '#10b981' : mape < 2 ? '#f59e0b' : '#ef4444',
                            shape: 'arrowDown',
                            text: `${mape.toFixed(1)}%`,
                            size: 1
                        });
                    }
                }
                ghostMarkersRef.current = restoredMarkers;
            } else {
                ghostMarkersRef.current = [];
            }
            
            // Only render strictly future ghost candles so they don't visually overlap and clash with historical real candles
            _renderGhostCandles(
                continuousCandles.slice(newIdx), 
                continuousTimes.slice(newIdx), 
                true
            );
            // Disable native overlapping arrows on restore
            // if (ghostCandleSeriesRef.current && ghostMarkersRef.current.length > 0) {
            //     if (!ghostMarkersPluginRef.current) {
            //         ghostMarkersPluginRef.current = createSeriesMarkers(ghostCandleSeriesRef.current, ghostMarkersRef.current);
            //     } else {
            //         ghostMarkersPluginRef.current.setMarkers(ghostMarkersRef.current);
            //     }
            // }
            
            setFvPAE(getPAESession(instrumentKey, timeframe));
        } else {
            setFvActive(false);
            setFvAutoMode(false);
            setFvBias(null);
            setFvRisk('');
            setFvPAE(null);
            setFvModel(null);
            fvSessionRef.current = null;
            if (ghostCandleSeriesRef.current) ghostCandleSeriesRef.current.setData([]);
        }
    }, [instrumentKey, timeframe]);

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
            color: item.close >= item.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)'
        }));
        volumeDataRef.current = volumeData;
        volumeSeriesRef.current.setData(volumeData);

        // ── Always compute full indicator snapshot for Future Vision ──────────────────
        // These run unconditionally (not gated on showXxx) so the AI always gets fresh data.
        try {
            const snap = {};
            const d = data;
            if (d.length >= 14) {
                // Supertrend
                const stData = calculateSupertrend(d, 10, 3);
                const lastST = stData.up.at(-1) || stData.down.at(-1);
                snap.supertrendDir = stData.up.at(-1)?.value != null ? 'bullish' : 'bearish';
                snap.supertrendLevel = lastST?.value ?? null;

                // VWAP
                const vwapData = calculateVWAP(d);
                snap.vwap = vwapData.at(-1)?.value ?? null;

                // EMA 9 / 21 / 50
                const ema9Data  = calculateEMA(d, 9);
                const ema21Data = calculateEMA(d, 21);
                const ema50Data = calculateEMA(d, 50);
                snap.ema9  = ema9Data.at(-1)?.value  ?? null;
                snap.ema21 = ema21Data.at(-1)?.value ?? null;
                snap.ema50 = ema50Data.at(-1)?.value ?? null;

                // MACD
                const macd = calculateMACD(d);
                snap.macdLine   = macd.macd.at(-1)?.value      ?? null;
                snap.macdSignal = macd.signal.at(-1)?.value    ?? null;
                snap.macdHist   = macd.histogram.at(-1)?.value ?? null;

                // RSI
                const rsiResult = calculateRSIDivergence(d, 14);
                const lastRsi   = rsiResult.rsi.at(-1)?.value ?? null;
                snap.rsi = lastRsi;
                snap.rsiSignal = lastRsi != null
                    ? (lastRsi > 70 ? 'OVERBOUGHT' : lastRsi < 30 ? 'OVERSOLD' : lastRsi > 55 ? 'Bullish' : lastRsi < 45 ? 'Bearish' : 'Neutral')
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
        } catch (e) {
            // Never crash the chart if snapshot computation fails
            console.warn('[FV] Indicator snapshot error:', e);
        }


        if (showSupertrend && supertrendUpSeriesRef.current && supertrendDownSeriesRef.current) {
            const stData = calculateSupertrend(data, 10, 3);
            supertrendUpSeriesRef.current.setData(stData.up);
            supertrendDownSeriesRef.current.setData(stData.down);
        } else if (supertrendUpSeriesRef.current && supertrendDownSeriesRef.current) {
            supertrendUpSeriesRef.current.setData([]);
            supertrendDownSeriesRef.current.setData([]);
        }

        if (showVWAP && vwapSeriesRef.current) {
            vwapSeriesRef.current.setData(calculateVWAP(data));
        } else if (vwapSeriesRef.current) {
            vwapSeriesRef.current.setData([]);
        }

        if (showEMA && ema9SeriesRef.current && ema21SeriesRef.current) {
            ema9SeriesRef.current.setData(calculateEMA(data, 9));
            ema21SeriesRef.current.setData(calculateEMA(data, 21));
        } else if (ema9SeriesRef.current && ema21SeriesRef.current) {
            ema9SeriesRef.current.setData([]);
            ema21SeriesRef.current.setData([]);
        }

        if (showCPR && cprTcSeriesRef.current && cprPivotSeriesRef.current && cprBcSeriesRef.current) {
            const cprData = calculateCPR(data);
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
            const bands = computeAdaptiveBands(data, bandsMode);
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
            const macd = calculateMACD(data);
            macdLineRef.current.setData(macd.macd);
            signalLineRef.current.setData(macd.signal);
            macdHistRef.current.setData(macd.histogram);
        } else if (macdLineRef.current) {
            macdLineRef.current.setData([]);
            signalLineRef.current.setData([]);
            macdHistRef.current.setData([]);
        }

        if (showPSAR && psarRef.current) {
            psarRef.current.setData(calculatePSAR(data));
        } else if (psarRef.current) {
            psarRef.current.setData([]);
        }


        if (showIchimoku && ichimokuTenkanRef.current && ichimokuKijunRef.current && ichimokuSpanARef.current && ichimokuSpanBRef.current) {
            const ichi = calculateIchimoku(data);
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
            anchoredVwapRef.current.setData(calculateAnchoredVWAP(data));
        } else if (anchoredVwapRef.current) {
            anchoredVwapRef.current.setData([]);
        }

        if (showAutoFib && candleSeriesRef.current) {
            // clear existing
            autoFibLinesRef.current.forEach(line => candleSeriesRef.current.removePriceLine(line));
            autoFibLinesRef.current = [];
            
            const fib = calculateAutoFib(data);
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
            const r = calculateRSIDivergence(data, 14);
            rsiRef.current.setData(r.rsi);
            // Ignore markers for now to keep it clean
        } else if (rsiRef.current) {
            rsiRef.current.setData([]);
        }

    }, [data, demoRealCandles, showSupertrend, showVWAP, showEMA, showCPR, showAdaptiveBands, bandsMode, showMACD, showPSAR, showIchimoku, showAnchoredVWAP, showAutoFib, showRSI]);


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

    return (
        <div className="advanced-candlestick-chart relative w-full h-full flex flex-col">
            <div className="absolute inset-0 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: getRegimeBackground() }} />

            {/* Top Left Toolbar */}
            <div className="absolute top-1.5 left-3 z-20 flex items-center gap-2">
                <button
                    onMouseEnter={(e) => handleMouseEnter(e, showDrawing ? 'Close Drawing Tools' : 'Open Drawing Tools')}
                    onMouseLeave={() => setHoveredIndicator(null)}
                    onClick={() => { setShowDrawing(p => !p); if (showDrawing) setActiveTool('cursor'); }}
                    className={`pointer-events-auto flex items-center justify-center transition-all duration-150 ${showDrawing ? 'text-blue-500' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <PencilRuler size={13} strokeWidth={2} />
                </button>
                <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-0.5"></div>
                <button
                    onMouseEnter={(e) => handleMouseEnter(e, showSupertrend ? 'Hide Supertrend' : 'Show Supertrend (10, 3)')}
                    onMouseLeave={() => setHoveredIndicator(null)}
                    onClick={() => setShowSupertrend(p => !p)}
                    className={`pointer-events-auto flex items-center justify-center transition-all duration-150 ${showSupertrend ? 'text-emerald-500' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <Activity size={13} strokeWidth={2} />
                </button>
                <button
                    onMouseEnter={(e) => handleMouseEnter(e, showVWAP ? 'Hide VWAP' : 'Show VWAP (Daily)')}
                    onMouseLeave={() => setHoveredIndicator(null)}
                    onClick={() => setShowVWAP(p => !p)}
                    className={`pointer-events-auto flex items-center justify-center transition-all duration-150 ${showVWAP ? 'text-amber-500' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <BarChart2 size={13} strokeWidth={2} />
                </button>
                <button
                    onMouseEnter={(e) => handleMouseEnter(e, showEMA ? 'Hide 9/21 EMA' : 'Show 9/21 EMA Crossover')}
                    onMouseLeave={() => setHoveredIndicator(null)}
                    onClick={() => setShowEMA(p => !p)}
                    className={`pointer-events-auto flex items-center justify-center transition-all duration-150 ${showEMA ? 'text-blue-500' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <TrendingUp size={13} strokeWidth={2} />
                </button>
                <button
                    onMouseEnter={(e) => handleMouseEnter(e, showCPR ? 'Hide CPR' : 'Show CPR (Central Pivot Range)')}
                    onMouseLeave={() => setHoveredIndicator(null)}
                    onClick={() => setShowCPR(p => !p)}
                    className={`pointer-events-auto flex items-center justify-center transition-all duration-150 ${showCPR ? 'text-slate-400' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <Layers size={13} strokeWidth={2} />
                </button>
                <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-0.5"></div>
                
                <button
                    onMouseEnter={(e) => handleMouseEnter(e, showMenu ? 'Hide Extra Indicators' : 'More Indicators')}
                    onMouseLeave={() => setHoveredIndicator(null)}
                    onClick={() => setShowMenu(p => !p)}
                    className={`pointer-events-auto flex items-center justify-center transition-all duration-150 ${showMenu ? 'text-blue-500 rotate-45' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <Plus size={14} strokeWidth={2.5} />
                </button>

                {/* ── Future Vision Button ─────────────────────────────────── */}
                {!isMultiMode && (
                    <>
                        <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-0.5" />
                        <button
                            onMouseEnter={(e) => {
                                const isExpired = fvSessionRef.current && fvSessionRef.current.candles && fvLiveBarIndexRef.current >= fvSessionRef.current.candles.length;
                                const label = fvAutoMode ? 'Auto Mode Active (Double click to disable)' : 
                                              (fvActive && isExpired) ? 'Generate New Prediction (Old expired)' :
                                              fvActive ? 'Refine Prediction (Right-click to delete)' : 
                                              (fvStaleMsg || 'Future Vision - AI Candle Prediction');
                                handleMouseEnter(e, label);
                            }}
                            onMouseLeave={() => setHoveredIndicator(null)}
                            onClick={(e) => {
                                if (fvClickTimerRef.current) {
                                    clearTimeout(fvClickTimerRef.current);
                                    fvClickTimerRef.current = null;
                                    setFvAutoMode(p => {
                                        const next = !p;
                                        updatePAEAutoMode(instrumentKey, timeframe, next);
                                        if (next && !fvActive) triggerFutureVision();
                                        return next;
                                    });
                                } else {
                                    fvClickTimerRef.current = setTimeout(() => {
                                        fvClickTimerRef.current = null;
                                        if (fvActive) {
                                            if (!fvVisible) setFvVisible(true);
                                            else triggerFutureVision();
                                        } else {
                                            triggerFutureVision();
                                        }
                                    }, 250);
                                }
                            }}
                            disabled={fvLoading}
                            className={`pointer-events-auto relative flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200
                                ${fvLoading ? 'text-violet-400 animate-pulse' : ''}
                                ${!fvLoading && fvAutoMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : ''}
                                ${!fvLoading && !fvAutoMode && fvActive ? 'text-violet-400' : ''}
                                ${!fvLoading && !fvActive ? 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5' : ''}`}
                        >
                            {fvAutoMode && !fvLoading && (
                                <span className="absolute inset-0 rounded-md ring-2 ring-blue-400/50 animate-ping" />
                            )}
                            {fvLoading
                                ? <Loader size="tiny" />
                                : <Telescope size={13} strokeWidth={2} />
                            }
                        </button>

                        <button
                            onClick={async () => {
                                if (!instrumentKey || !timeframe) return;
                                import('sonner').then(({ toast }) => toast.loading('Running deep overnight analysis...', { id: 'analyst' }));
                                try {
                                    const res = await axiosInstance.post('/api/v1/pace/analyst/run', { instrumentKey, timeframe });
                                    if (res.data?.success) {
                                        analystBriefRef.current = res.data.brief;
                                        import('sonner').then(({ toast }) => toast.success('Analyst Brief Generated', { 
                                            id: 'analyst',
                                            description: res.data.brief 
                                        }));
                                    }
                                } catch (err) {
                                    import('sonner').then(({ toast }) => toast.error('Analysis Failed', { id: 'analyst', description: err.message }));
                                }
                            }}
                            onMouseEnter={(e) => handleMouseEnter(e, `Run Overnight Deep Analysis`)}
                            onMouseLeave={() => setHoveredIndicator(null)}
                            className="pointer-events-auto flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200 text-fuchsia-500/60 dark:text-fuchsia-400/50 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-black/5 dark:hover:bg-white/5"
                        >
                            <Microscope size={13} strokeWidth={2} />
                        </button>
                    </>
                )}
                {/* ── DEV: Demo Ghost Candle Button (Testing Only) ─── */}
                {!isMultiMode && (
                    <div className="absolute bottom-6 left-3 z-[60]">
                    {(() => {
                    // Only render in dev/localhost to keep production clean
                    if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) return null;
                    const addDemoRealCandle = () => {
                        const effectiveData = [...data, ...demoRealCandles];
                        const lastReal = effectiveData?.[effectiveData.length - 1];
                        if (!lastReal) return;

                        // Random-walk ±0.8%
                        const drift = (Math.random() - 0.48) * 0.008;
                        const open  = lastReal.close;
                        const close = parseFloat((open * (1 + drift)).toFixed(2));
                        const high  = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.004)).toFixed(2));
                        const low   = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.004)).toFixed(2));

                        // Compute next timestamp with dynamic market bounds
                        let nextTime;
                        const isDailyOrAbove = typeof lastReal.time !== 'number';

                        if (isDailyOrAbove) {
                            let currentMs = typeof lastReal.time === 'string'
                                ? new Date(lastReal.time).getTime()
                                : new Date(lastReal.time.year, lastReal.time.month - 1, lastReal.time.day).getTime();
                            
                            currentMs += 86400000;
                            let date = new Date(currentMs);
                            while (date.getDay() === 0 || date.getDay() === 6) {
                                currentMs += 86400000;
                                date = new Date(currentMs);
                            }
                            if (typeof lastReal.time === 'string') {
                                nextTime = date.toISOString().split('T')[0];
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
                                minUtcMins = 225; maxUtcMins = 600; // fallback
                            }

                            let currentTime = lastReal.time + barSize;
                            let date = new Date(currentTime * 1000);
                            let tm = date.getUTCHours() * 60 + date.getUTCMinutes();

                            if (tm >= maxUtcMins || tm < minUtcMins) {
                                if (tm >= maxUtcMins) date.setUTCDate(date.getUTCDate() + 1);
                                if (maxUtcMins < 1400) {
                                    if (date.getUTCDay() === 6) date.setUTCDate(date.getUTCDate() + 2);
                                    if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
                                }
                                date.setUTCHours(Math.floor(minUtcMins / 60), minUtcMins % 60, 0, 0);
                                currentTime = Math.floor(date.getTime() / 1000);
                            }
                            nextTime = currentTime;
                        }
                        const newCandle = { time: nextTime, open, high, low, close, volume: lastReal.volume || 1000 };

                        setDemoRealCandles(prev => {
                            const updated = [...prev, newCandle];
                            setDemoLiveCandle(newCandle);
                            return updated;
                        });

                        import('sonner').then(({ toast }) =>
                            toast.success(`Demo REAL candle added at ${nextTime}`, { duration: 1500 })
                        );
                    };

                    const clearDemoData = () => {
                        setDemoRealCandles([]);
                        setDemoLiveCandle(null);
                        import('sonner').then(({ toast }) => toast.info('Demo data cleared'));
                    };

                    return (
                        <div className="flex gap-1">
                            <button
                                onClick={addDemoRealCandle}
                                onMouseEnter={(e) => handleMouseEnter(e, `DEV: Fast-forward time (+1 real candle)`)}
                                onMouseLeave={() => setHoveredIndicator(null)}
                                className="pointer-events-auto flex items-center justify-center px-1.5 h-5 rounded text-[9px] font-bold tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors"
                            >
                                +🕯
                            </button>
                            {demoRealCandles.length > 0 && (
                                <button
                                    onClick={clearDemoData}
                                    onMouseEnter={(e) => handleMouseEnter(e, `DEV: Clear demo data`)}
                                    onMouseLeave={() => setHoveredIndicator(null)}
                                    className="pointer-events-auto flex items-center justify-center px-1.5 h-5 rounded text-[9px] font-bold tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 transition-colors"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    );
                })()}
                    </div>
                )}

                {fvActive && !isMultiMode && (
                    <button
                        onMouseEnter={(e) => handleMouseEnter(e, fvVisible ? 'Hide Ghost Candles' : 'Show Ghost Candles')}
                        onMouseLeave={() => setHoveredIndicator(null)}
                        onClick={() => setFvVisible(!fvVisible)}
                        className={`pointer-events-auto flex items-center justify-center w-6 h-6 rounded-md transition-all duration-150 ${fvVisible ? 'text-text-secondary hover:text-text-primary' : 'text-slate-500'}`}
                    >
                        {fvVisible ? <Eye size={13} strokeWidth={2} /> : <EyeOff size={13} strokeWidth={2} />}
                    </button>
                )}

                {/* ── Future Vision Bias HUD ─────────────────────────── */}
                {fvActive && fvBias && !isMultiMode && (() => {
                    const isBull = fvBias === 'bullish';
                    const isBear = fvBias === 'bearish';
                    const biasColor   = isBull ? 'text-emerald-400' : isBear ? 'text-red-400' : 'text-slate-400';
                    const confidence  = fvSessionRef.current?.candles
                        ? Math.round(fvSessionRef.current.candles.reduce((a, c) => a + c.confidence, 0) / fvSessionRef.current.candles.length)
                        : null;
                    const confBarColor = confidence >= 70 ? 'bg-emerald-400' : confidence >= 50 ? 'bg-amber-400' : 'bg-red-400';
                    const modelShort  = fvModel ? fvModel.split('/').pop().split('-').slice(0, 2).join('-') : null;

                    const tooltipContent = (
                        <div className="flex flex-col gap-2 min-w-[180px] p-0.5">
                            <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isBull ? 'bg-emerald-400' : isBear ? 'bg-red-400' : 'bg-slate-400'}`} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Future Vision</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-tertiary text-[9px] uppercase font-semibold tracking-wider">Bias</span>
                                <span className={`text-[11px] font-bold ${biasColor}`}>AI {fvBias.toUpperCase()}</span>
                            </div>
                            {confidence !== null && (
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-tertiary text-[9px] uppercase font-semibold tracking-wider">Confidence</span>
                                        <span className="text-violet-500 dark:text-violet-300 text-[10px] font-bold font-mono">{confidence}%</span>
                                    </div>
                                    <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                        <div className={`h-full rounded-full ${confBarColor} transition-all duration-500`} style={{ width: `${confidence}%` }} />
                                    </div>
                                </div>
                            )}
                            {fvPAE?.scores?.length > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-tertiary text-[9px] uppercase font-semibold tracking-wider">Dir. Accuracy</span>
                                    <span className="text-blue-500 dark:text-blue-300 text-[10px] font-bold font-mono">
                                        {Math.round(fvPAE.scores.reduce((a, b) => a + b.da, 0) / fvPAE.scores.length * 100)}%
                                        <span className="text-text-tertiary font-normal ml-1">({fvPAE.scores.length} bars)</span>
                                    </span>
                                </div>
                            )}
                            {modelShort && (
                                <div className="flex justify-between items-center pt-1.5 border-t border-border-subtle">
                                    <span className="text-text-tertiary text-[9px] uppercase font-semibold tracking-wider">Model</span>
                                    <span className="text-text-tertiary text-[9px] font-mono">{modelShort}</span>
                                </div>
                            )}
                        </div>
                    );

                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: -4 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="flex items-center ml-1.5 gap-1"
                        >
                            {/* Pill badge */}
                            <button
                                onMouseEnter={(e) => handleMouseEnter(e, tooltipContent)}
                                onMouseLeave={() => setHoveredIndicator(null)}
                                className="pointer-events-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border-subtle bg-transparent cursor-default hover:brightness-110 transition-all duration-150"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-wide text-text-primary">AI Bias</span>
                                <span className={`text-[10px] font-bold ${biasColor}`}>
                                    {fvBias.toUpperCase()}
                                </span>
                                {confidence !== null && (
                                    <span className={`text-[9px] font-semibold px-1 rounded-sm ml-0.5 ${
                                        isBull ? 'bg-emerald-500/10 text-emerald-400' : 
                                        isBear ? 'bg-red-500/10 text-red-400' : 
                                        'bg-slate-500/10 text-slate-400'
                                    }`}>
                                        {confidence}%
                                    </span>
                                )}
                            </button>
                        </motion.div>
                    );
                })()}

                {/* Pattern Recognition & Scoring Engine Badge */}
                {patternScore && !isMultiMode && (
                    <div className="flex items-center pointer-events-auto ml-1 group relative">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border-subtle bg-transparent cursor-default hover:brightness-110 transition-all duration-150">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-text-primary">Pattern Score</span>
                            <span className={`text-[10px] font-bold ${
                                patternScore.score > 2 ? 'text-emerald-500' :
                                patternScore.score < -2 ? 'text-rose-500' :
                                'text-amber-500'
                            }`}>
                                {patternScore.score > 0 ? '+' : ''}{patternScore.score}
                            </span>
                            <span className={`text-[9px] font-semibold px-1 rounded-sm ml-0.5 ${
                                patternScore.score > 2 ? 'bg-emerald-500/10 text-emerald-400' :
                                patternScore.score < -2 ? 'bg-rose-500/10 text-rose-400' :
                                'bg-amber-500/10 text-amber-400'
                            }`}>
                                {patternScore.label}
                            </span>
                        </div>

                        {/* Active Patterns Dropdown (Visible on Hover) */}
                        {patternScore.activePatterns.length > 0 && (
                            <div 
                                className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col gap-0 w-64 bg-background-surface/95 backdrop-blur-xl border border-border-subtle rounded-md p-1.5 shadow-2xl z-[100]"
                            >
                                <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1 px-1.5 pt-0.5">
                                    <span className="text-[10px] font-semibold text-text-secondary">Active Formations</span>
                                    <span className="text-[9px] text-text-tertiary uppercase tracking-wider">Click to view</span>
                                </div>
                                {patternScore.activePatterns.map((p, i) => {
                                    const isSelected = hoveredPattern?.id === p.id && hoveredPattern?.time === p.time;
                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => setHoveredPattern(isSelected ? null : p)}
                                            className={`flex items-center justify-between text-[11px] px-2 py-1.5 rounded cursor-pointer transition-colors ${isSelected ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'}`}
                                        >
                                            <span className={`font-medium ${p.dir > 0 ? 'text-emerald-400' : p.dir < 0 ? 'text-rose-400' : 'text-text-tertiary'}`}>
                                                {p.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-mono text-[10px] ${p.contribution > 0 ? 'text-emerald-500' : p.contribution < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                                                    {p.contribution > 0 ? '+' : ''}{p.contribution}
                                                </span>
                                                <span className="text-text-tertiary text-[10px]">
                                                    ({p.age} bar{p.age !== 1 ? 's' : ''} ago)
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
                {/* OHLC Legend inline in top toolbar */}
                <OHLCLegend chartRef={chartRef} candleSeriesRef={candleSeriesRef} data={data} />

                <AnimatePresence>
                    {showMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute top-full left-0 mt-2 bg-white/80 dark:bg-[#1e222d]/80 border border-black/5 dark:border-white/5 rounded-xl backdrop-blur-md shadow-2xl p-2 z-30"
                        >
                            <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-4 gap-2">
                                    {/* ── Adaptive Bands ── */}
                                    <button
                                        onMouseEnter={(e) => handleMouseEnter(e, `Adaptive Bands — ${bandsMode === 'scalp' ? 'BB Scalp' : bandsMode === 'swing' ? 'KC Swing' : 'DC Positional'}`)}
                                        onMouseLeave={() => setHoveredIndicator(null)}
                                        onClick={() => setShowAdaptiveBands(p => !p)}
                                        className={`pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 ${showAdaptiveBands
                                            ? bandsMode === 'scalp'      ? 'bg-indigo-500/15 text-indigo-400'
                                            : bandsMode === 'positional' ? 'bg-emerald-500/15 text-emerald-400'
                                            :                              'bg-amber-500/15 text-amber-400'
                                            : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <Waves size={13} strokeWidth={2} />
                                    </button>

                                    {/* Remaining indicators */}
                                    <button
                                        onMouseEnter={(e) => handleMouseEnter(e, 'MACD (12, 26, 9)')}
                                        onMouseLeave={() => setHoveredIndicator(null)}
                                        onClick={() => setShowMACD(p => !p)}
                                        className={`pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 ${showMACD ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <TrendingUpDown size={13} strokeWidth={2} />
                                    </button>
                                    <button
                                        onMouseEnter={(e) => handleMouseEnter(e, 'Anchored VWAP')}
                                        onMouseLeave={() => setHoveredIndicator(null)}
                                        onClick={() => setShowAnchoredVWAP(p => !p)}
                                        className={`pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 ${showAnchoredVWAP ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <Anchor size={13} strokeWidth={2} />
                                    </button>
                                    <button
                                        onMouseEnter={(e) => handleMouseEnter(e, 'Auto Fibonacci')}
                                        onMouseLeave={() => setHoveredIndicator(null)}
                                        onClick={() => setShowAutoFib(p => !p)}
                                        className={`pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 ${showAutoFib ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <AlignJustify size={13} strokeWidth={2} />
                                    </button>
                                    <button
                                        onMouseEnter={(e) => handleMouseEnter(e, 'Parabolic SAR')}
                                        onMouseLeave={() => setHoveredIndicator(null)}
                                        onClick={() => setShowPSAR(p => !p)}
                                        className={`pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 ${showPSAR ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <MoreHorizontal size={13} strokeWidth={2} />
                                    </button>
                                    <button
                                        onMouseEnter={(e) => handleMouseEnter(e, 'Ichimoku Cloud')}
                                        onMouseLeave={() => setHoveredIndicator(null)}
                                        onClick={() => setShowIchimoku(p => !p)}
                                        className={`pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 ${showIchimoku ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <Cloud size={13} strokeWidth={2} />
                                    </button>
                                    <button
                                        onMouseEnter={(e) => handleMouseEnter(e, 'RSI Divergence')}
                                        onMouseLeave={() => setHoveredIndicator(null)}
                                        onClick={() => setShowRSI(p => !p)}
                                        className={`pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 ${showRSI ? 'bg-pink-500/15 text-pink-600 dark:text-pink-400' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <Spline size={13} strokeWidth={2} />
                                    </button>
                                </div>

                                {/* Mode toggle pills — visible only when bands are on */}
                                <AnimatePresence>
                                    {showAdaptiveBands && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: -6, height: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-1 rounded-md"
                                        >
                                            {[
                                                { id: 'scalp',      label: 'SCP', color: 'indigo' },
                                                { id: 'swing',      label: 'SWG', color: 'amber'  },
                                                { id: 'positional', label: 'POS', color: 'emerald'},
                                            ].map(m => (
                                                <button
                                                    key={m.id}
                                                    onMouseEnter={(e) => handleMouseEnter(e,
                                                        m.id === 'scalp'      ? 'Scalp — Bollinger Bands (20, 2σ sample)'
                                                        : m.id === 'swing'    ? 'Swing — Keltner Channels (EMA20, ATR14)'
                                                        :                       'Positional — Donchian Dual Channel (50+20)'
                                                    )}
                                                    onMouseLeave={() => setHoveredIndicator(null)}
                                                    onClick={() => setBandsMode(m.id)}
                                                    className={`flex-1 px-1 py-1 rounded text-[10px] font-bold tracking-wide transition-all duration-150 mx-0.5
                                                        ${bandsMode === m.id
                                                            ? m.color === 'indigo'  ? 'bg-indigo-500/20  text-indigo-400  border border-indigo-500/30 shadow-sm'
                                                            : m.color === 'amber'   ? 'bg-amber-500/20   text-amber-400   border border-amber-500/30 shadow-sm'
                                                            :                         'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                                                            : 'bg-transparent text-slate-500 dark:text-white/40 border border-transparent hover:text-slate-800 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/10'
                                                        }`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>


                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
                    
                    let hoveredGhostIndex = -1;
                    if (hoveredTimeRef.current) {
                        for (let i = 0; i < fvSessionRef.current.times.length; i++) {
                            const ht = hoveredTimeRef.current;
                            const st = fvSessionRef.current.times[i];
                            if (st === ht || (st && ht && st.year === ht.year && st.month === ht.month && st.day === ht.day)) {
                                hoveredGhostIndex = i;
                                break;
                            }
                        }
                    }

                    if (hoveredGhostIndex !== -1) {
                        // 1) Capture the exact time synchronously before the user moves their mouse to click the toast!
                        const targetDeleteTime = hoveredTimeRef.current;
                        const targetGhostIndex = hoveredGhostIndex;
                        
                        import('sonner').then(({ toast }) => {
                            toast.custom((t) => (
                                <div className="bg-slate-900 text-white p-4 rounded-lg shadow-xl border border-rose-900/50 flex flex-col gap-3 min-w-[320px]">
                                    <div className="font-semibold text-rose-400">Delete Prediction?</div>
                                    <div className="text-sm text-slate-300 leading-snug">
                                        You selected a specific ghost candle. Do you want to delete just this single candle, or the entire 7-candle set it belongs to?
                                    </div>
                                    <div className="flex gap-2 justify-end mt-1">
                                        <button onClick={() => toast.dismiss(t)} className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded transition-colors">
                                            Cancel
                                        </button>
                                        <button onClick={() => {
                                            toast.dismiss(t);
                                            
                                            // 1) Delete the single candle from the permanent DB
                                            deletePAECandleByTime(instrumentKey, timeframe, targetDeleteTime);
                                            
                                            // 2) Seamlessly rebuild the UI state from the DB without page reload
                                            const allSessions = getAllPAESessions(instrumentKey, timeframe);
                                            if (allSessions && allSessions.length > 0) {
                                                const uniqueCandles = new Map();
                                                const uniqueTimes = new Map();
                                                
                                                for (const session of allSessions) {
                                                    if (!session.candles || !session.times) continue;
                                                    for (let i = 0; i < session.candles.length; i++) {
                                                        const t = session.times[i];
                                                        uniqueCandles.set(t, session.candles[i]);
                                                        uniqueTimes.set(t, t);
                                                    }
                                                }
                                                
                                                const sortedTimes = Array.from(uniqueTimes.keys()).sort((a, b) => {
                                                    const ta = typeof a === 'object' ? new Date(a.year, a.month-1, a.day).getTime() : new Date(a).getTime();
                                                    const tb = typeof b === 'object' ? new Date(b.year, b.month-1, b.day).getTime() : new Date(b).getTime();
                                                    return ta - tb;
                                                });
                                                
                                                const continuousCandles = sortedTimes.map(t => uniqueCandles.get(t));
                                                const continuousTimes = sortedTimes.map(t => uniqueTimes.get(t));
                                                
                                                if (fvSessionRef.current) {
                                                    fvSessionRef.current.candles = continuousCandles;
                                                    fvSessionRef.current.times = continuousTimes;
                                                }
                                                
                                                _renderGhostCandles(continuousCandles, continuousTimes, true);
                                                
                                                // Remove marker for this deleted candle
                                                const filteredMarkers = ghostMarkersRef.current.filter(m => {
                                                    return m.time !== targetDeleteTime && !(m.time.year && targetDeleteTime.year && m.time.year === targetDeleteTime.year && m.time.month === targetDeleteTime.month && m.time.day === targetDeleteTime.day);
                                                });
                                                ghostMarkersRef.current = filteredMarkers;
                                                if (ghostMarkersPluginRef.current) {
                                                    ghostMarkersPluginRef.current.setMarkers(ghostMarkersRef.current);
                                                }
                                                
                                                setFvPAE(getPAESession(instrumentKey, timeframe));
                                            } else {
                                                clearPAESession(instrumentKey, timeframe);
                                                setFvActive(false);
                                                setFvAutoMode(false);
                                                setFvBias(null);
                                                setFvRisk('');
                                                setFvPAE(null);
                                                setFvModel(null);
                                                fvSessionRef.current = null;
                                                fvLiveBarIndexRef.current = 0;
                                                ghostMarkersRef.current = [];
                                                if (ghostMarkersPluginRef.current) ghostMarkersPluginRef.current.setMarkers([]);
                                                if (ghostCandleSeriesRef.current) ghostCandleSeriesRef.current.setData([]);
                                            }
                                            setHoveredIndicator(null);
                                        }} className="px-3 py-1.5 text-xs font-medium bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded border border-rose-500/30 transition-colors">
                                            Delete 1 Candle
                                        </button>
                                        <button onClick={() => {
                                            toast.dismiss(t);
                                            // 3) Use the captured exact timestamp of the set they want to delete!
                                            deletePAESessionByTime(instrumentKey, timeframe, targetDeleteTime);
                                            
                                            // Seamlessly rebuild the UI state without a page reload
                                            const allSessions = getAllPAESessions(instrumentKey, timeframe);
                                            if (allSessions && allSessions.length > 0) {
                                                const uniqueCandles = new Map();
                                                const uniqueTimes = new Map();
                                                
                                                for (const session of allSessions) {
                                                    if (!session.candles || !session.times) continue;
                                                    for (let i = 0; i < session.candles.length; i++) {
                                                        const t = session.times[i];
                                                        uniqueCandles.set(t, session.candles[i]);
                                                        uniqueTimes.set(t, t);
                                                    }
                                                }
                                                
                                                const sortedTimes = Array.from(uniqueTimes.keys()).sort((a, b) => {
                                                    const ta = typeof a === 'object' ? new Date(a.year, a.month-1, a.day).getTime() : new Date(a).getTime();
                                                    const tb = typeof b === 'object' ? new Date(b.year, b.month-1, b.day).getTime() : new Date(b).getTime();
                                                    return ta - tb;
                                                });
                                                
                                                const continuousCandles = sortedTimes.map(t => uniqueCandles.get(t));
                                                const continuousTimes = sortedTimes.map(t => uniqueTimes.get(t));
                                                
                                                fvSessionRef.current.candles = continuousCandles;
                                                fvSessionRef.current.times = continuousTimes;
                                                
                                                _renderGhostCandles(continuousCandles, continuousTimes, true);
                                                
                                                // Clear existing markers plugin safely
                                                if (ghostMarkersPluginRef.current) {
                                                    ghostMarkersPluginRef.current.setMarkers([]);
                                                }
                                                ghostMarkersRef.current = [];
                                                
                                                // Trigger a subtle state toggle to refresh dependent PAE visual components
                                                setFvPAE(getPAESession(instrumentKey, timeframe));
                                            } else {
                                                // If that was the last set, clear everything
                                                clearPAESession(instrumentKey, timeframe);
                                                setFvActive(false);
                                                setFvAutoMode(false);
                                                setFvBias(null);
                                                setFvRisk('');
                                                setFvPAE(null);
                                                setFvModel(null);
                                                fvSessionRef.current = null;
                                                fvLiveBarIndexRef.current = 0;
                                                ghostMarkersRef.current = [];
                                                if (ghostMarkersPluginRef.current) ghostMarkersPluginRef.current.setMarkers([]);
                                                if (ghostCandleSeriesRef.current) ghostCandleSeriesRef.current.setData([]);
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
                                        ghostMarkersRef.current = [];
                                        if (ghostMarkersPluginRef.current) ghostMarkersPluginRef.current.setMarkers([]);
                                        if (ghostCandleSeriesRef.current) ghostCandleSeriesRef.current.setData([]);
                                        setHoveredIndicator(null);
                                    }
                                }
                            });
                        });
                    }
                }
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
                        className="absolute pointer-events-none z-50 text-[11px] font-mono px-2 py-1 rounded bg-black/80 border backdrop-blur-md whitespace-nowrap shadow-xl"
                        style={{
                            left: ghostTooltip.x,
                            top: ghostTooltip.y - 30,
                            transform: 'translateX(-50%)',
                            borderColor: ghostTooltip.color,
                            color: ghostTooltip.color,
                            textShadow: '0 0 10px rgba(0,0,0,0.8)'
                        }}
                    >
                        Error: {ghostTooltip.text}
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









