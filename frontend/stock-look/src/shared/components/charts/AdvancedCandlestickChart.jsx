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

import { useTheme } from '../../context/ThemeContext';
import { FO_INDICES, FO_EQUITIES } from '../../utils/foInstruments';
import { assembleContext, getFVSettings } from '../../utils/futureVisionContextAssembler';
import { storePrediction, scoreClosedCandle, getPAESession, clearPAESession, computeConfidence } from '../../utils/predictionAccuracyEngine';
import axiosInstance from '../../utils/axiosInstance';
import { useDataRegistry } from '../../context/DataRegistryContext';
import { Telescope, Info } from 'lucide-react';
import Loader from '../ui/Loader';
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
}) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const chartWrapperRef = useRef(null);

    const [showDrawing, setShowDrawing] = useState(false);
    const [activeTool, setActiveTool] = useState('cursor');
    const [activeColor, setActiveColor] = useState(COLORS[0]);
    const { drawings, addDrawing, deleteDrawing, undo, clearAll } = useDrawings(instrumentKey, timeframe);

    const [crosshairData, setCrosshairData] = useState(null);

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
    const hiddenFutureSeriesRef = useRef(null);
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
    const fvIgnoreStaleRef = useRef(false); // useRef so it's instantly readable in the same closure

    const fvSessionRef = useRef(null);
    const fvLiveBarIndexRef = useRef(0);
    const ghostCandleSeriesRef = useRef(null);
    const ghostUpperConeRef = useRef(null);
    const ghostLowerConeRef = useRef(null);

    const liveIndicatorSnapshotRef = useRef({});

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

                    if (lastDataTimeRef.current) {
                        let lastDate;
                        const lt = lastDataTimeRef.current;
                        if (typeof lt === 'number') lastDate = new Date(lt * 1000);
                        else if (lt.year) lastDate = new Date(lt.year, lt.month - 1, lt.day);
                        else if (typeof lt === 'string') lastDate = new Date(lt);
                        
                        if (lastDate && date > lastDate) {
                            return ''; // Hide labels for future grid lines
                        }
                    }

                    if (tickMarkType === 0) return date.getFullYear().toString();
                    if (tickMarkType === 1) return date.toLocaleString('en-US', { month: 'short' });
                    if (tickMarkType === 2) return date.toLocaleString('en-US', { day: 'numeric', month: 'short' });
                    if (tickMarkType === 3 || tickMarkType === 4) return date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    return date.toLocaleString('en-US', { day: 'numeric', month: 'short' });
                }
            },
        });

        chartRef.current = chart;



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

        
        hiddenFutureSeriesRef.current = chart.addSeries(LineSeries, { color: 'transparent', priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

        ichimokuTenkanRef.current = chart.addSeries(LineSeries, { color: '#0ea5e9', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        ichimokuKijunRef.current = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        ichimokuSpanARef.current = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        ichimokuSpanBRef.current = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

        anchoredVwapRef.current = chart.addSeries(LineSeries, { color: '#fb923c', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        
        rsiRef.current = chart.addSeries(LineSeries, { priceScaleId: 'rsi', color: '#a78bfa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        chart.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

        // ── Future Vision Ghost Candle Series ──────────────────────────────────────
        // CandlestickSeries rendered as translucent ghost candles for AI predictions
        ghostCandleSeriesRef.current = chart.addSeries(CandlestickSeries, {
            upColor:         'rgba(167,139,250,0.25)', // Solid translucent violet for UP
            downColor:       'transparent',            // Hollow for DOWN
            borderVisible:   true,
            borderUpColor:   'rgba(167,139,250,0.7)',
            borderDownColor: 'rgba(167,139,250,0.4)',
            wickUpColor:     'rgba(167,139,250,0.6)',
            wickDownColor:   'rgba(167,139,250,0.3)',
            priceLineVisible:      false,
            lastValueVisible:      false,
            crosshairMarkerVisible: false,
        });



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
            if (param.time && param.point && param.seriesData.get(candleSeriesRef.current)) {
                const d = param.seriesData.get(candleSeriesRef.current);
                setCrosshairData({ open: d.open, high: d.high, low: d.low, close: d.close });
            } else {
                setCrosshairData(null);
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
        } catch (e) {
            // Ignore error if live tick is older than our latest historical candle
        }
    }, [liveCandle]);

    // ── Future Vision: PAE Scoring on live bar close ────────────────────────────
    // When FV is active and a new live tick arrives, check if a new bar has closed
    // and score it against the stored prediction.
    useEffect(() => {
        if (!fvActive || !liveCandle || !fvSessionRef.current) return;

        const session = fvSessionRef.current;
        const barIdx  = fvLiveBarIndexRef.current;

        if (barIdx < session.candles.length) {
            // Only score if the live market has ACTUALLY reached or passed the predicted candle's time!
            // We use string comparison for daily charts, or numeric comparison for intraday.
            const expectedTime = session.times[barIdx];
            
            let isTimePassed = false;
            if (typeof liveCandle.time === 'number' && typeof expectedTime === 'number') {
                // For intraday, we consider the bar "closed" when the liveCandle time has moved PAST the expected time
                isTimePassed = liveCandle.time > expectedTime;
            } else {
                // For daily/string dates, we can't easily check > unless we parse, so we just check if it moved past
                const liveT = new Date(liveCandle.time).getTime();
                const expT = new Date(expectedTime).getTime();
                isTimePassed = liveT > expT;
            }

            if (!isTimePassed) return;

            const barScore = scoreClosedCandle(
                session.instrumentKey,
                session.timeframe,
                barIdx,
                liveCandle
            );
            if (barScore) {
                fvLiveBarIndexRef.current = barIdx + 1;
                // Update PAE HUD
                const paeSession = getPAESession(session.instrumentKey, session.timeframe);
                setFvPAE(paeSession);

                // Dim the ghost candle that was just scored
                if (ghostCandleSeriesRef.current && session.candles[barIdx]) {
                    _renderGhostCandles(session.candles, session.times, true);
                }
            }
        }
    }, [liveCandle, fvActive]);

    // ── Ghost Candle Renderer ────────────────────────────────────────────────────
    const _renderGhostCandles = (candles, times, withPAEDimming) => {
        if (!ghostCandleSeriesRef.current) return;
        if (!candles?.length || !times?.length) return;

        // The time of the very last REAL candle in the chart
        let lastValidTime = data && data.length > 0 ? data[data.length - 1].time : 0;

        let ghostData = candles
            .map((c, i) => ({
                time:  times[i],
                open:  Number(c.open)  || 0,
                high:  Number(c.high)  || 0,
                low:   Number(c.low)   || 0,
                close: Number(c.close) || 0,
            }))
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

    const fvStaleMsg = fvIssues.length > 0
        ? `⚠️ AI summaries need attention:\n${fvIssues.join('\n')}`
        : null;


    // ── Future Vision: Trigger Function ─────────────────────────────────────────
    const triggerFutureVision = async () => {
        if (fvLoading) return;

        // If active, toggle off (clear ghosts)
        if (fvActive) {
            setFvActive(false);
            setFvBias(null);
            setFvRisk('');
            setFvPAE(null);
            setFvModel(null);
            fvIgnoreStaleRef.current = false;
            fvSessionRef.current = null;
            fvLiveBarIndexRef.current = 0;
            if (ghostCandleSeriesRef.current) ghostCandleSeriesRef.current.setData([]);
            return;
        }

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
                aiNarratives
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
                horizonBars,
            });

            const { candles, overall_bias, key_risk } = res.data;

            // Store prediction in PAE engine
            clearPAESession(instrumentKey, timeframe);
            fvLiveBarIndexRef.current = 0;

            // Generate future timestamps for ghost candles
            const lastCandle = data[data.length - 1];
            
            const times = candles.map((_, i) => {
                if (typeof lastCandle.time === 'number') {
                    const timeDiff = data.length > 1 ? lastCandle.time - data[data.length - 2].time : 86400;
                    return lastCandle.time + timeDiff * (i + 1);
                } else if (typeof lastCandle.time === 'string') {
                    const timeDiffMs = data.length > 1 
                        ? new Date(lastCandle.time).getTime() - new Date(data[data.length - 2].time).getTime() 
                        : 86400000;
                    const nextTimeMs = new Date(lastCandle.time).getTime() + (timeDiffMs * (i + 1));
                    return new Date(nextTimeMs).toISOString().split('T')[0];
                } else if (lastCandle.time && lastCandle.time.year) {
                    let date = new Date(lastCandle.time.year, lastCandle.time.month - 1, lastCandle.time.day);
                    date.setDate(date.getDate() + (i + 1));
                    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
                }
                return lastCandle.time; // ultimate fallback
            });

            // Store session for PAE
            fvSessionRef.current = { candles, instrumentKey, timeframe, times };
            storePrediction(instrumentKey, timeframe, tradingMode || 'swing', candles, overall_bias, key_risk, times, res.data.modelUsed);

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
        const session = getPAESession(instrumentKey, timeframe);
        if (session && session.candles && session.times && session.bias) {
            // Restore session
            fvSessionRef.current = { 
                candles: session.candles, 
                instrumentKey: session.instrumentKey, 
                timeframe: session.timeframe, 
                times: session.times 
            };
            setFvBias(session.bias);
            setFvRisk(session.risk || '');
            setFvModel(session.modelUsed || null);
            setFvActive(true);
            
            // Re-render ghosts
            _renderGhostCandles(session.candles, session.times, false);
            
            // Setup HUD
            setFvPAE(getPAESession(instrumentKey, timeframe));
        } else {
            // Clear if none
            setFvActive(false);
            setFvBias(null);
            setFvRisk('');
            setFvPAE(null);
            setFvModel(null);
            fvSessionRef.current = null;
            if (ghostCandleSeriesRef.current) ghostCandleSeriesRef.current.setData([]);
        }
    }, [instrumentKey, timeframe]);

    useEffect(() => {
        if (!candleSeriesRef.current || !volumeSeriesRef.current || !data || data.length === 0) return;
        
        lastDataTimeRef.current = data[data.length - 1].time;
        
        // --- Generate Future Grid Space ---
        const lastCandle = data[data.length - 1];
        const futureData = [];
        if (lastCandle) {
            if (typeof lastCandle.time === 'number') {
                const timeDiff = data.length > 1 ? lastCandle.time - data[data.length - 2].time : 86400; // default 1 day
                let nextTime = lastCandle.time;
                for (let i = 0; i < 60; i++) {
                    nextTime += timeDiff;
                    futureData.push({ time: nextTime });
                }
            } else if (typeof lastCandle.time === 'string') {
                const timeDiffMs = data.length > 1 ? new Date(lastCandle.time).getTime() - new Date(data[data.length - 2].time).getTime() : 86400000;
                let nextTimeMs = new Date(lastCandle.time).getTime();
                for (let i = 0; i < 60; i++) {
                    nextTimeMs += timeDiffMs;
                    futureData.push({ time: new Date(nextTimeMs).toISOString().split('T')[0] });
                }
            } else if (lastCandle.time && lastCandle.time.year) {
                // business day object fallback
                let date = new Date(lastCandle.time.year, lastCandle.time.month - 1, lastCandle.time.day);
                for (let i = 0; i < 60; i++) {
                    date.setDate(date.getDate() + 1);
                    futureData.push({ time: { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() } });
                }
            }
        }
        
        candleSeriesRef.current.setData(data);
        if (hiddenFutureSeriesRef.current) {
            // Map futureData to have a dummy value just to extend the time scale
            hiddenFutureSeriesRef.current.setData([...data.map(d => ({time: d.time, value: d.close})), ...futureData.map(d => ({time: d.time, value: data[data.length-1].close}))]);
        }
        const volumeData = data.map(item => ({
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

    }, [data, showSupertrend, showVWAP, showEMA, showCPR, showAdaptiveBands, bandsMode, showMACD, showPSAR, showIchimoku, showAnchoredVWAP, showAutoFib, showRSI]);


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
        if (showEvents && events && events.length > 0) {
            markers = events.map(event => ({
                time: event.time,
                position: event.impact > 0 ? 'aboveBar' : 'belowBar',
                color: event.type === 'gdp' ? '#3b82f6' : event.type === 'cpi' ? '#f97316' : event.type === 'rbi' ? '#8b5cf6' : event.type === 'budget' ? '#22c55e' : '#fbbf24',
                shape: 'circle', text: event.label,
            }));
        }
        if (!markersPluginRef.current) {
            markersPluginRef.current = createSeriesMarkers(candleSeriesRef.current, markers);
        } else {
            markersPluginRef.current.setMarkers(markers);
        }
    }, [events, showEvents]);

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
                <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-0.5" />
                <button
                    onMouseEnter={(e) => handleMouseEnter(e, fvActive ? 'Clear Future Vision' : (fvStaleMsg || 'Future Vision — AI Candle Prediction'))}
                    onMouseLeave={() => setHoveredIndicator(null)}
                    onClick={triggerFutureVision}
                    disabled={fvLoading}
                    className={`pointer-events-auto relative flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200
                        ${fvLoading ? 'text-violet-400 animate-pulse' : ''}
                        ${fvActive && !fvLoading ? 'text-violet-400' : ''}
                        ${!fvActive && !fvLoading ? 'text-text-secondary hover:text-violet-400' : ''}`}
                >
                    {fvActive && !fvLoading && (
                        <span className="absolute inset-0 rounded-md ring-2 ring-violet-400/50 animate-ping" />
                    )}
                    {fvLoading
                        ? <Loader size="tiny" />
                        : <Telescope size={13} strokeWidth={2} />
                    }
                </button>

                {/* ── Future Vision Bias HUD ─────────────────────────── */}
                {fvActive && fvBias && (() => {
                    const isBull = fvBias === 'bullish';
                    const isBear = fvBias === 'bearish';
                    const biasColor   = isBull ? 'text-emerald-400' : isBear ? 'text-red-400' : 'text-slate-400';
                    const biasBg      = isBull ? 'bg-emerald-500/10 border-emerald-500/30' : isBear ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-500/10 border-slate-500/30';
                    const dotColor    = isBull ? 'bg-emerald-400' : isBear ? 'bg-red-400' : 'bg-slate-400';
                    const confidence  = fvSessionRef.current?.candles
                        ? Math.round(fvSessionRef.current.candles.reduce((a, c) => a + c.confidence, 0) / fvSessionRef.current.candles.length)
                        : null;
                    const confBarColor = confidence >= 70 ? 'bg-emerald-400' : confidence >= 50 ? 'bg-amber-400' : 'bg-red-400';
                    const modelShort  = fvModel ? fvModel.split('/').pop().split('-').slice(0, 2).join('-') : null;

                    const tooltipContent = (
                        <div className="flex flex-col gap-2 min-w-[180px] p-0.5">
                            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Future Vision</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/40 text-[9px] uppercase font-semibold tracking-wider">Bias</span>
                                <span className={`text-[11px] font-bold ${biasColor}`}>AI {fvBias.toUpperCase()}</span>
                            </div>
                            {confidence !== null && (
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40 text-[9px] uppercase font-semibold tracking-wider">Confidence</span>
                                        <span className="text-violet-300 text-[10px] font-bold font-mono">{confidence}%</span>
                                    </div>
                                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                        <div className={`h-full rounded-full ${confBarColor} transition-all duration-500`} style={{ width: `${confidence}%` }} />
                                    </div>
                                </div>
                            )}
                            {fvPAE?.scores?.length > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-white/40 text-[9px] uppercase font-semibold tracking-wider">Dir. Accuracy</span>
                                    <span className="text-blue-300 text-[10px] font-bold font-mono">
                                        {Math.round(fvPAE.scores.reduce((a, b) => a + b.da, 0) / fvPAE.scores.length * 100)}%
                                        <span className="text-white/30 font-normal ml-1">({fvPAE.scores.length}/{fvSessionRef.current?.candles?.length})</span>
                                    </span>
                                </div>
                            )}
                            {modelShort && (
                                <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
                                    <span className="text-white/40 text-[9px] uppercase font-semibold tracking-wider">Model</span>
                                    <span className="text-slate-400 text-[9px] font-mono">{modelShort}</span>
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
                                className={`pointer-events-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide transition-all duration-150 hover:brightness-110 ${biasBg} ${biasColor}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColor}`} />
                                AI {fvBias.toUpperCase()}
                                {confidence !== null && (
                                    <span className="text-[9px] font-mono text-white/50 ml-0.5">{confidence}%</span>
                                )}
                            </button>
                        </motion.div>
                    );
                })()}



                {/* OHLC Legend inline in top toolbar */}
                <div className="pointer-events-none flex items-center gap-1.5 text-[11px] font-mono drop-shadow-md bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 px-1.5 py-0.5 rounded backdrop-blur-sm ml-1">
                    {(() => {
                        const d = crosshairData || (data && data.length > 0 ? data[data.length - 1] : null);
                        if (!d) return null;
                        const isUp = d.close >= d.open;
                        const chg = d.close - d.open;
                        const pct = (chg / d.open) * 100;
                        const cls = isUp ? 'text-[#26a69a]' : 'text-[#ef5350]';
                        const sign = isUp ? '+' : '';
                        return (
                            <>
                                <span className="text-slate-600 dark:text-gray-500">O<span className={cls}>{d.open.toFixed(2)}</span></span>
                                <span className="text-slate-600 dark:text-gray-500">H<span className={cls}>{d.high.toFixed(2)}</span></span>
                                <span className="text-slate-600 dark:text-gray-500">L<span className={cls}>{d.low.toFixed(2)}</span></span>
                                <span className="text-slate-600 dark:text-gray-500">C<span className={cls}>{d.close.toFixed(2)}</span></span>
                                <span className={cls}>{sign}{chg.toFixed(2)} ({sign}{pct.toFixed(2)}%)</span>
                            </>
                        );
                    })()}
                </div>

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

            <div className="flex-1 w-full relative min-h-0" ref={chartWrapperRef}>
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
                        className="fixed z-[100] bg-[#1a1f2e] border border-white/10 text-white/90 text-[11px] font-medium px-2.5 py-1.5 rounded-md shadow-xl pointer-events-none whitespace-nowrap"
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









