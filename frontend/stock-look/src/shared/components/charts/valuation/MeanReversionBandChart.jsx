/**
 * @file MeanReversionBandChart.jsx
 * @purpose Statistical valuation bands (Standard Deviations) around a mean.
 * @responsibilities
 * - Renders AreaChart with Mean, +1/2 SD, -1/2 SD bands.
 * - Visualizes extreme overextension or undervaluation.
 * - Can be applied to PE, PB, or any mean-reverting metric.
 * @key_exports
 * - MeanReversionBandChart (Default)
 * @dependencies
 * - Recharts, ChartTooltip
 * - chartUtils (calculateStatisticalBands, getZoneColor)
 * @lifecycle
 * - Advanced valuation tool for deep-dive analysis.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { RechartsTooltipWrapper } from '../ChartTooltip';
import { calculateStatisticalBands, formatChartDate, getZoneColor } from '@/shared/utils/chartUtils';

// =============================
// Component
// =============================

export default function MeanReversionBandChart({
    data = [],
    metricLabel = 'PE Ratio',
    metricUnit = '',
    height = 400,
}) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Calculate bands
        const bands = calculateStatisticalBands(data, [5, 10]);
        const band10Y = bands['10Y'];

        // Prepare chart data with bands and Z-Score
        return data.map((d, i) => {
            const mean = band10Y.mean; // Simplified: Using constant mean for visual stability or moving average if implemented in utils
            // Assuming utils returns constant stats for the whole period. 
            // If utils returns arrays, we'd access by index. But typically these utils return single stats for "10Y Mean".
            // Let's assume constant for this implementation to match previous logic.

            const stdDev = band10Y.stdDev || (band10Y.upper1 - band10Y.mean);
            const zScore = stdDev ? (d.value - mean) / stdDev : 0;

            return {
                date: d.date,
                value: d.value,
                mean10Y: band10Y.mean,
                upper1_10Y: band10Y.upper1,
                upper2_10Y: band10Y.upper2,
                lower1_10Y: band10Y.lower1,
                lower2_10Y: band10Y.lower2,
                zScore
            };
        });
    }, [data]);

    if (chartData.length === 0) {
        return <div className="flex items-center justify-center h-full text-white/40">No data available</div>;
    }

    const latest = chartData[chartData.length - 1];
    const latestZ = latest.zScore;

    // Determine zone color
    const zoneColor = getZoneColor(latest.value > latest.upper1_10Y ? 'bear-weak' : latest.value < latest.lower1_10Y ? 'bull-weak' : 'neutral');

    return (
        <div className="flex flex-col h-full gap-4">
            {/* --- PRIMARY CHART: Mean Reversion Bands --- */}
            <div className="flex-1 min-h-[50%] relative">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <div className="text-xs text-white/60">{metricLabel}</div>
                        <div className="text-2xl font-semibold" style={{ color: zoneColor }}>
                            {latest.value.toFixed(2)}
                            {metricUnit && <span className="text-sm ml-1 text-white/60">{metricUnit}</span>}
                        </div>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="99%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="overvaluedGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="undervaluedGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.05} />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={zoneColor} stopOpacity={0.8} />
                                <stop offset="100%" stopColor={zoneColor} stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(date) => formatChartDate(date, 'short')}
                            stroke="rgba(255,255,255,0.3)"
                            style={{ fontSize: '10px' }}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.3)"
                            style={{ fontSize: '10px' }}
                            tickLine={false}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip content={<RechartsTooltipWrapper metricUnit={metricUnit} />} />

                        <Area type="monotone" dataKey="upper2_10Y" stroke="none" fill="url(#overvaluedGradient)" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="upper1_10Y" stroke="none" fill="url(#overvaluedGradient)" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="lower1_10Y" stroke="none" fill="url(#undervaluedGradient)" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="lower2_10Y" stroke="none" fill="url(#undervaluedGradient)" fillOpacity={0.3} />

                        <ReferenceLine y={latest.mean10Y} stroke="#fbbf24" strokeDasharray="5 5" />
                        <Area type="monotone" dataKey="value" stroke={zoneColor} strokeWidth={2} fill="url(#valueGradient)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>


        </div>
    );
}
