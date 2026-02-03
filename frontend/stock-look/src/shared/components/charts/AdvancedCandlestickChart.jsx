/**
 * @file AdvancedCandlestickChart.jsx
 * @purpose Interactive financial chart with AI insights and fundamental overlays.
 * @responsibilities
 * - Renders candlestick price data using lightweight-charts.
 * - Overlays valuation bands (Fair Value, Over/Undervalued).
 * - Visualizes key events (GDP, Earnings) on the timeline.
 * - Displays AI-generated insights based on price vs. fundamentals.
 * - Manages chart resizing and responsive layout.
 * @key_exports
 * - AdvancedCandlestickChart (Default)
 * @dependencies
 * - lightweight-charts
 * - framer-motion
 * @lifecycle
 * - Core component for Technical and Fundamental analysis pages.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { motion, AnimatePresence } from 'framer-motion';

// =============================
// Component
// =============================

export default function AdvancedCandlestickChart({
    data = [],
    fundamentalData = {},
    events = [],
    showValuationBands = true,
    showEvents = true,
    timeframeMode = 'medium',
    height = 500,
}) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const [insight, setInsight] = useState(null);
    const [regimeConfidence, setRegimeConfidence] = useState('medium');

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: height - 150, // Reserve space for fundamental timeline
            layout: {
                background: { color: 'transparent' },
                textColor: 'rgba(255, 255, 255, 0.7)',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            crosshair: {
                mode: 1, // Normal crosshair
                vertLine: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    width: 1,
                    style: 2, // Dashed
                },
                horzLine: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    width: 1,
                    style: 2,
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2,
                },
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;

        // Add candlestick series with refined styling
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: 'rgba(34, 197, 94, 0.6)', // Softer saturation
            wickDownColor: 'rgba(239, 68, 68, 0.6)',
            wickVisible: true,
            borderVisible: true,
            priceLineVisible: true,
        });

        candleSeriesRef.current = candleSeries;
        candleSeries.setData(data);

        // Add valuation bands if enabled
        if (showValuationBands && fundamentalData.fairValueBands) {
            addValuationBands(chart, fundamentalData.fairValueBands);
        }

        // Add event markers if enabled
        if (showEvents && events.length > 0) {
            addEventMarkers(candleSeries, events);
        }

        // Generate AI insight
        generateInsight(data, fundamentalData);

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, fundamentalData, showValuationBands, showEvents, events, height]);

    // Add valuation bands
    const addValuationBands = (chart, bands) => {
        // Undervalued zone (green)
        const undervaluedSeries = chart.addLineSeries({
            color: 'rgba(34, 197, 94, 0.3)',
            lineWidth: 1,
            lineStyle: 2, // Dashed
            priceLineVisible: false,
            lastValueVisible: false,
        });
        undervaluedSeries.setData(bands.undervalued);

        // Fair value zone (yellow)
        const fairValueSeries = chart.addLineSeries({
            color: 'rgba(251, 191, 36, 0.4)',
            lineWidth: 2,
            priceLineVisible: true,
            lastValueVisible: true,
        });
        fairValueSeries.setData(bands.fairValue);

        // Overvalued zone (red)
        const overvaluedSeries = chart.addLineSeries({
            color: 'rgba(239, 68, 68, 0.3)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        overvaluedSeries.setData(bands.overvalued);
    };

    // Add event markers
    const addEventMarkers = (series, events) => {
        const markers = events.map(event => ({
            time: event.time,
            position: event.impact > 0 ? 'aboveBar' : 'belowBar',
            color: event.type === 'gdp' ? '#3b82f6' :
                event.type === 'cpi' ? '#f97316' :
                    event.type === 'rbi' ? '#8b5cf6' :
                        event.type === 'budget' ? '#22c55e' : '#fbbf24',
            shape: 'circle',
            text: event.label,
        }));

        series.setMarkers(markers);
    };

    // Generate AI-style insight
    const generateInsight = (priceData, fundData) => {
        if (!priceData || priceData.length === 0) return;

        const latestPrice = priceData[priceData.length - 1].close;
        const fairValue = fundData.fairValue || latestPrice;
        const valuationDiff = ((latestPrice - fairValue) / fairValue) * 100;

        const earningsMomentum = fundData.earningsTrend || 'stable';
        const regime = fundData.regime || 'neutral';

        let insightText = '';

        if (valuationDiff > 5) {
            insightText = `Valuations ${valuationDiff.toFixed(1)}% above fair value while earnings momentum is ${earningsMomentum} — upside likely capped unless earnings surprise.`;
        } else if (valuationDiff < -5) {
            insightText = `Trading ${Math.abs(valuationDiff).toFixed(1)}% below fair value with ${earningsMomentum} earnings — potential value opportunity if fundamentals hold.`;
        } else {
            insightText = `Price aligned with fair value. Earnings ${earningsMomentum}. ${regime === 'risk-on' ? 'Supportive macro backdrop.' : regime === 'risk-off' ? 'Cautious macro environment.' : 'Neutral macro conditions.'}`;
        }

        setInsight({
            text: insightText,
            valuationDiff,
            earningsMomentum,
            regime,
        });

        // Set confidence based on data quality
        const confidence = fundData.dataQuality > 80 ? 'high' : fundData.dataQuality > 50 ? 'medium' : 'low';
        setRegimeConfidence(confidence);
    };

    // Get regime background color
    const getRegimeBackground = () => {
        if (!fundamentalData.regime) return 'transparent';

        const regime = fundamentalData.regime;
        if (regime === 'risk-on') return 'rgba(34, 197, 94, 0.03)';
        if (regime === 'risk-off') return 'rgba(239, 68, 68, 0.03)';
        return 'rgba(251, 191, 36, 0.02)';
    };

    return (
        <div className="advanced-candlestick-chart relative">
            {/* Regime Background Tint */}
            <div
                className="absolute inset-0 pointer-events-none transition-colors duration-1000"
                style={{ backgroundColor: getRegimeBackground() }}
            />

            {/* Insight Strip (Top-Left) */}
            <AnimatePresence>
                {insight && (
                    <motion.div
                        className="absolute top-4 left-4 z-10 max-w-md"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-3 space-y-2">
                            {/* Key Metrics */}
                            <div className="flex items-center gap-4 text-xs">
                                <div>
                                    <span className="text-white/50">Price vs Fair Value: </span>
                                    <span className={`font-semibold ${insight.valuationDiff > 0 ? 'text-red-400' : insight.valuationDiff < 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {insight.valuationDiff > 0 ? '+' : ''}{insight.valuationDiff.toFixed(1)}% {insight.valuationDiff > 0 ? 'Overvalued' : insight.valuationDiff < 0 ? 'Undervalued' : 'Fair'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-white/50">Earnings: </span>
                                    <span className="font-semibold text-white/80 capitalize">{insight.earningsMomentum}</span>
                                </div>
                            </div>

                            {/* Regime Badge */}
                            <div className="flex items-center gap-2">
                                <div
                                    className="px-2 py-1 rounded text-xs font-medium"
                                    style={{
                                        backgroundColor: insight.regime === 'risk-on' ? 'rgba(34, 197, 94, 0.2)' :
                                            insight.regime === 'risk-off' ? 'rgba(239, 68, 68, 0.2)' :
                                                'rgba(251, 191, 36, 0.2)',
                                        color: insight.regime === 'risk-on' ? '#22c55e' :
                                            insight.regime === 'risk-off' ? '#ef4444' :
                                                '#fbbf24',
                                    }}
                                >
                                    {insight.regime === 'risk-on' ? '🚀 Risk-On' : insight.regime === 'risk-off' ? '⚠️ Risk-Off' : '⚖️ Neutral'}
                                </div>
                                <div className="text-xs text-white/40">
                                    Confidence: <span className={`font-medium ${regimeConfidence === 'high' ? 'text-green-400' : regimeConfidence === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {regimeConfidence.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chart Container */}
            <div ref={chartContainerRef} className="relative" />

            {/* AI Takeaway (Below Chart) */}
            {insight && (
                <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-start gap-2">
                        <span className="text-blue-400 text-sm">💡</span>
                        <p className="text-xs text-white/70 leading-relaxed">
                            {insight.text}
                        </p>
                    </div>
                </div>
            )}

            {/* Fundamental Score Timeline (Below Chart) */}
            <FundamentalTimeline
                data={fundamentalData.scoreTimeline || []}
                height={80}
            />
        </div>
    );
}

/**
 * Fundamental Score Timeline Component
 */
function FundamentalTimeline({ data, height }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || data.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = height * dpr;
        canvas.style.height = `${height}px`;

        ctx.scale(dpr, dpr);

        const width = canvas.offsetWidth;
        const padding = 10;

        // Draw background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, 0, width, height);

        // Draw score line
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;

        data.forEach((point, i) => {
            const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
            const y = height - padding - ((point.score / 100) * (height - padding * 2));

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw reference lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        [25, 50, 75].forEach(level => {
            const y = height - padding - ((level / 100) * (height - padding * 2));
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        });

        // Draw labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('Fundamental Score (0-100)', padding, 12);

    }, [data, height]);

    return (
        <div className="mt-4">
            <canvas ref={canvasRef} className="w-full" />
        </div>
    );
}
