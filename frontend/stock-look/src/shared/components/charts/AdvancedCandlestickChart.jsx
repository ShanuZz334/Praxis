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
import { calculateBollingerBands, calculateMACD, calculateKeltnerChannels, calculateDonchianChannels, calculatePSAR, calculateIchimoku, calculateAnchoredVWAP, calculateAutoFib, calculateRSIDivergence } from '../../utils/advancedIndicators';
import { useTheme } from '../../context/ThemeContext';
import { FO_INDICES, FO_EQUITIES } from '../../utils/foInstruments';

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
    const bbUpperRef = useRef(null);
    const bbMiddleRef = useRef(null);
    const bbLowerRef = useRef(null);
    const macdLineRef = useRef(null);
    const signalLineRef = useRef(null);
    const macdHistRef = useRef(null);
    const keltnerUpperRef = useRef(null);
    const keltnerMiddleRef = useRef(null);
    const keltnerLowerRef = useRef(null);
    const donchianUpperRef = useRef(null);
    const donchianMiddleRef = useRef(null);
    const donchianLowerRef = useRef(null);
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
    
    const [showSupertrend, setShowSupertrend] = useState(false);
    const [showVWAP, setShowVWAP] = useState(false);
    const [showEMA, setShowEMA] = useState(false);
    const [showCPR, setShowCPR] = useState(false);
    
    const [showMenu, setShowMenu] = useState(false);
    const [showBollinger, setShowBollinger] = useState(false);
    const [showMACD, setShowMACD] = useState(false);
    const [showKeltner, setShowKeltner] = useState(false);
    const [showDonchian, setShowDonchian] = useState(false);
    const [showPSAR, setShowPSAR] = useState(false);
    const [showIchimoku, setShowIchimoku] = useState(false);
    const [showAnchoredVWAP, setShowAnchoredVWAP] = useState(false);
    const [showAutoFib, setShowAutoFib] = useState(false);
    const [showRSI, setShowRSI] = useState(false);
    
    const [hoveredIndicator, setHoveredIndicator] = useState(null);

    const { theme } = useTheme();
    const isLight = theme === 'light';

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
            color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: 'volume_scale',
            lastValueVisible: false, priceLineVisible: false
        });
        chart.priceScale('volume_scale').applyOptions({ 
            scaleMargins: { top: 0.8, bottom: 0 },
            visible: false
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

        // Advanced Indicators
        bbUpperRef.current = chart.addSeries(LineSeries, { color: '#818cf8', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        bbMiddleRef.current = chart.addSeries(LineSeries, { color: '#818cf8', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        bbLowerRef.current = chart.addSeries(LineSeries, { color: '#818cf8', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

        macdHistRef.current = chart.addSeries(HistogramSeries, { priceScaleId: 'macd', priceFormat: { type: 'volume' } });
        macdLineRef.current = chart.addSeries(LineSeries, { priceScaleId: 'macd', color: '#2962FF', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        signalLineRef.current = chart.addSeries(LineSeries, { priceScaleId: 'macd', color: '#FF6D00', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        chart.priceScale('macd').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

        keltnerUpperRef.current = chart.addSeries(LineSeries, { color: '#e879f9', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        keltnerMiddleRef.current = chart.addSeries(LineSeries, { color: '#e879f9', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        keltnerLowerRef.current = chart.addSeries(LineSeries, { color: '#e879f9', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

        donchianUpperRef.current = chart.addSeries(LineSeries, { color: '#9ca3af', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        donchianMiddleRef.current = chart.addSeries(LineSeries, { color: '#9ca3af', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        donchianLowerRef.current = chart.addSeries(LineSeries, { color: '#9ca3af', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

        psarRef.current = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 2, lineStyle: 3, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        
        hiddenFutureSeriesRef.current = chart.addSeries(LineSeries, { color: 'transparent', priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

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
        volumeSeriesRef.current.setData(volumeData);
        
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
        if (showBollinger && bbUpperRef.current && bbMiddleRef.current && bbLowerRef.current) {
            const bb = calculateBollingerBands(data, 20, 2);
            bbUpperRef.current.setData(bb.upper);
            bbMiddleRef.current.setData(bb.middle);
            bbLowerRef.current.setData(bb.lower);
        } else if (bbUpperRef.current) {
            bbUpperRef.current.setData([]);
            bbMiddleRef.current.setData([]);
            bbLowerRef.current.setData([]);
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

        if (showKeltner && keltnerUpperRef.current && keltnerMiddleRef.current && keltnerLowerRef.current) {
            const kc = calculateKeltnerChannels(data, 20, 2);
            keltnerUpperRef.current.setData(kc.upper);
            keltnerMiddleRef.current.setData(kc.middle);
            keltnerLowerRef.current.setData(kc.lower);
        } else if (keltnerUpperRef.current) {
            keltnerUpperRef.current.setData([]);
            keltnerMiddleRef.current.setData([]);
            keltnerLowerRef.current.setData([]);
        }

        if (showDonchian && donchianUpperRef.current && donchianMiddleRef.current && donchianLowerRef.current) {
            const dc = calculateDonchianChannels(data, 20);
            donchianUpperRef.current.setData(dc.upper);
            donchianMiddleRef.current.setData(dc.middle);
            donchianLowerRef.current.setData(dc.lower);
        } else if (donchianUpperRef.current) {
            donchianUpperRef.current.setData([]);
            donchianMiddleRef.current.setData([]);
            donchianLowerRef.current.setData([]);
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

    }, [data, showSupertrend, showVWAP, showEMA, showCPR, showBollinger, showMACD, showKeltner, showDonchian, showPSAR, showIchimoku, showAnchoredVWAP, showAutoFib, showRSI]);

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

                <AnimatePresence>
                    {showMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute top-full left-0 mt-2 bg-white/80 dark:bg-[#1e222d]/80 border border-black/5 dark:border-white/5 rounded-xl backdrop-blur-md shadow-2xl p-2 z-30"
                        >
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onMouseEnter={(e) => handleMouseEnter(e, 'Bollinger Bands (20, 2)')}
                                    onMouseLeave={() => setHoveredIndicator(null)}
                                    onClick={() => setShowBollinger(p => !p)}
                                    className={`pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 ${showBollinger ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                >
                                    <Waves size={13} strokeWidth={2} />
                                </button>
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
                                    onMouseEnter={(e) => handleMouseEnter(e, 'Keltner Channels')}
                                    onMouseLeave={() => setHoveredIndicator(null)}
                                    onClick={() => setShowKeltner(p => !p)}
                                    className={`pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 ${showKeltner ? 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                >
                                    <Frame size={13} strokeWidth={2} />
                                </button>
                                <button
                                    onMouseEnter={(e) => handleMouseEnter(e, 'Donchian Channels')}
                                    onMouseLeave={() => setHoveredIndicator(null)}
                                    onClick={() => setShowDonchian(p => !p)}
                                    className={`pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 ${showDonchian ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                >
                                    <SlidersHorizontal size={13} strokeWidth={2} />
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Left OHLC Legend */}
            <div className="absolute bottom-9 left-3 z-20">
                <div className="pointer-events-none flex space-x-2 text-xs font-mono drop-shadow-md bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 px-1.5 py-0.5 rounded backdrop-blur-sm">
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
