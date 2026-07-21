const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'src', 'shared', 'components', 'charts', 'AdvancedCandlestickChart.jsx');

const content = `/**
 * @file AdvancedCandlestickChart.jsx
 * @purpose Interactive financial chart with AI insights, fundamental overlays, and drawing toolkit.
 * @date 2026-07-20
 */

import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, createSeriesMarkers } from 'lightweight-charts';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine } from 'lucide-react';
import DrawingToolbar, { COLORS } from './drawing/DrawingToolbar';
import DrawingCanvas from './drawing/DrawingCanvas';
import { useDrawings } from './drawing/useDrawings';

const DEFAULT_DATA = [];
const DEFAULT_FUNDAMENTAL_DATA = {};
const DEFAULT_EVENTS = [];

export default function AdvancedCandlestickChart({
    data = DEFAULT_DATA,
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
    const markersPluginRef = useRef(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth || 600,
            height: chartContainerRef.current.clientHeight || 350,
            layout: {
                background: { color: 'transparent' },
                textColor: 'rgba(255, 255, 255, 0.7)',
            },
            localization: {
                timeFormatter: (ts) => {
                    if (!ts) return '';
                    let date;
                    if (typeof ts === 'number') date = new Date(ts * 1000);
                    else if (ts.year) date = new Date(ts.year, ts.month - 1, ts.day);
                    else if (typeof ts === 'string') date = new Date(ts);
                    if (!date || isNaN(date)) return String(ts);
                    const opts = { weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' };
                    if (typeof ts === 'number') { opts.hour = '2-digit'; opts.minute = '2-digit'; opts.hour12 = true; }
                    return date.toLocaleString('en-US', opts).replace(',', '');
                }
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            crosshair: {
                mode: 1,
                vertLine: { color: 'rgba(255,255,255,0.3)', width: 1, style: 2 },
                horzLine: { color: 'rgba(255,255,255,0.3)', width: 1, style: 2 },
            },
            rightPriceScale: {
                borderColor: 'rgba(255,255,255,0.1)',
                scaleMargins: { top: 0.1, bottom: 0.2 },
            },
            timeScale: {
                borderColor: 'rgba(255,255,255,0.1)',
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

        candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
            wickUpColor: '#26a69a', wickDownColor: '#ef5350', priceLineVisible: true,
        });

        volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
            color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '',
        });
        chart.priceScale('').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

        undervaluedSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(34,197,94,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false,
        });
        fairValueSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(255,255,255,0.5)', lineWidth: 1, priceLineVisible: true, lastValueVisible: true,
        });
        overvaluedSeriesRef.current = chart.addSeries(LineSeries, {
            color: 'rgba(239,68,68,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false,
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
        if (!candleSeriesRef.current || !volumeSeriesRef.current || !data || data.length === 0) return;
        candleSeriesRef.current.setData(data);
        const volumeData = data.map(item => ({
            time: item.time, value: item.volume || 0,
            color: item.close >= item.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)'
        }));
        volumeSeriesRef.current.setData(volumeData);
    }, [data]);

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

    return (
        <div className="advanced-candlestick-chart relative w-full h-full flex flex-col">
            <div className="absolute inset-0 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: getRegimeBackground() }} />

            {/* OHLC Legend + Pen Button */}
            <div className="absolute top-1.5 left-3 z-20 flex items-center gap-2">
                <div className="pointer-events-none flex space-x-2 text-xs font-mono drop-shadow-md bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
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
                                <span className="text-gray-500">O<span className={cls}>{d.open.toFixed(2)}</span></span>
                                <span className="text-gray-500">H<span className={cls}>{d.high.toFixed(2)}</span></span>
                                <span className="text-gray-500">L<span className={cls}>{d.low.toFixed(2)}</span></span>
                                <span className="text-gray-500">C<span className={cls}>{d.close.toFixed(2)}</span></span>
                                <span className={cls}>{sign}{chg.toFixed(2)} ({sign}{pct.toFixed(2)}%)</span>
                            </>
                        );
                    })()}
                </div>
                <button
                    title={showDrawing ? 'Close Drawing Tools' : 'Open Drawing Tools'}
                    onClick={() => { setShowDrawing(p => !p); if (showDrawing) setActiveTool('cursor'); }}
                    className={\`pointer-events-auto w-6 h-6 flex items-center justify-center rounded-md transition-all duration-150 \${showDrawing ? 'bg-blue-500/30 text-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'bg-black/20 text-white/40 hover:text-white/80 hover:bg-white/10'}\`}
                >
                    <PenLine size={11} strokeWidth={2} />
                </button>
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
        </div>
    );
}

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
`;

fs.writeFileSync(target, content, 'utf8');
console.log('AdvancedCandlestickChart.jsx written successfully. Lines:', content.split('\n').length);