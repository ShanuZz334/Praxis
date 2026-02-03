/**
 * @file BuffettIndicatorChart.jsx
 * @purpose Visualizes Market Cap to GDP ratio (Buffett Indicator).
 * @responsibilities
 * - Renders AreaChart of the ratio over time.
 * - Highlights valuation zones (Undervalued, Fair, Overvalued).
 * - Provides AI-driven interpretation of current market valuation.
 * @key_exports
 * - BuffettIndicatorChart (Default)
 * @dependencies
 * - Recharts, ChartTooltip
 * - chartUtils (formatChartDate)
 * @lifecycle
 * - Core Valuation indicator in Macro/Valuation dashboards.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { RechartsTooltipWrapper } from '../ChartTooltip';
import { formatChartDate } from '@/shared/utils/chartUtils';

// =============================
// Component
// =============================

export default function BuffettIndicatorChart({
    data = [],
    height = 300,
}) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data.map(d => ({
            date: d.date,
            ratio: d.value, // Market Cap / GDP ratio in %
        }));
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-white/40">
                No data available
            </div>
        );
    }

    const latestRatio = chartData[chartData.length - 1]?.ratio || 0;

    // Determine zone
    let zone = 'neutral';
    let zoneLabel = 'Fair Value';
    let zoneColor = '#fbbf24';

    if (latestRatio < 75) {
        zone = 'undervalued';
        zoneLabel = 'Undervalued';
        zoneColor = '#22c55e';
    } else if (latestRatio > 115) {
        zone = 'overvalued';
        zoneLabel = 'Overvalued';
        zoneColor = '#ef4444';
    }

    return (
        <div className="buffett-indicator-chart">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <div className="text-sm text-white/60">Market Cap to GDP</div>
                    <div className="text-2xl font-semibold" style={{ color: zoneColor }}>
                        {latestRatio.toFixed(1)}%
                    </div>
                </div>
                <div className="text-right">
                    <div
                        className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                            backgroundColor: `${zoneColor}20`,
                            color: zoneColor,
                        }}
                    >
                        {zoneLabel}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        {/* Gradient based on zone */}
                        <linearGradient id="buffettGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={zoneColor} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={zoneColor} stopOpacity={0.1} />
                        </linearGradient>

                        {/* Zone backgrounds */}
                        <linearGradient id="undervaluedZone" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.1} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                        </linearGradient>

                        <linearGradient id="overvaluedZone" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

                    <XAxis
                        dataKey="date"
                        tickFormatter={(date) => formatChartDate(date, 'month')}
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                    />

                    <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                        domain={[0, 'auto']}
                        label={{ value: 'Ratio (%)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    />

                    <Tooltip content={<RechartsTooltipWrapper metricUnit="%" />} />

                    {/* Undervalued threshold (75%) */}
                    <ReferenceLine
                        y={75}
                        stroke="#22c55e"
                        strokeDasharray="5 5"
                        strokeOpacity={0.6}
                        label={{
                            value: 'Undervalued (<75%)',
                            position: 'right',
                            fill: '#22c55e',
                            fontSize: 10,
                        }}
                    />

                    {/* Overvalued threshold (115%) */}
                    <ReferenceLine
                        y={115}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        strokeOpacity={0.6}
                        label={{
                            value: 'Overvalued (>115%)',
                            position: 'right',
                            fill: '#ef4444',
                            fontSize: 10,
                        }}
                    />

                    {/* Main area */}
                    <Area
                        type="monotone"
                        dataKey="ratio"
                        stroke={zoneColor}
                        strokeWidth={2}
                        fill="url(#buffettGradient)"
                        fillOpacity={0.5}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Zone Legend */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                    <div className="text-green-400 font-medium">Undervalued</div>
                    <div className="text-white/60">&lt; 75%</div>
                </div>
                <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                    <div className="text-yellow-400 font-medium">Fair Value</div>
                    <div className="text-white/60">75-115%</div>
                </div>
                <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                    <div className="text-red-400 font-medium">Overvalued</div>
                    <div className="text-white/60">&gt; 115%</div>
                </div>
            </div>

            {/* Interpretation */}
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-white/70">
                    <span className="font-medium">💡 Buffett Indicator:</span>{' '}
                    {zone === 'undervalued'
                        ? 'Market trading below GDP - potential buying opportunity'
                        : zone === 'overvalued'
                            ? 'Market significantly above GDP - exercise caution'
                            : 'Market fairly valued relative to economic output'}
                </div>
            </div>
        </div>
    );
}
