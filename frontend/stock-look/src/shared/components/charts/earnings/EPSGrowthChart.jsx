/**
 * @file EPSGrowthChart.jsx
 * @purpose Visualizes Earnings Per Share (EPS) growth momentum.
 * @responsibilities
 * - Renders a ComposedChart with Growth Bars and Trend Line.
 * - Colors bars based on growth thresholds (Green, Yellow, Red).
 * - Simulates upgrade/downgrade breadth metrics.
 * @key_exports
 * - EPSGrowthChart (Default)
 * @dependencies
 * - Recharts, ChartTooltip
 * - chartUtils (formatChartDate, calculateMovingAverage)
 * @lifecycle
 * - Core component of Earnings Analysis in Fundamental/Sector pages.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RechartsTooltipWrapper } from '../ChartTooltip';
import { formatChartDate, calculateMovingAverage } from '@/shared/utils/chartUtils';

// =============================
// Component
// =============================

export default function EPSGrowthChart({
    data = [],
    height = 400,
}) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-white/40">No data available</div>;
    }

    // 1. Prepare Data
    const chartData = useMemo(() => {
        const trendData = calculateMovingAverage(data, 12);
        return data.map(d => {
            const trend = trendData.find(t => t.date === d.date);
            const growth = d.value;

            // Simulate Breadth if missing: Positive growth -> More upgrades
            const totalRevisions = 50 + Math.floor(Math.random() * 20);
            const bullishSkew = growth > 0 ? 0.6 + (growth / 100) : 0.3;
            const upgrades = Math.floor(totalRevisions * Math.min(0.9, Math.max(0.1, bullishSkew)));
            const downgrades = totalRevisions - upgrades;

            return {
                date: d.date,
                growth,
                trend: trend?.value || null,
                upgrades,
                downgrades,
                fill: growth > 10 ? '#22c55e' : growth > 0 ? '#eab308' : '#ef4444',
            };
        });
    }, [data]);

    const latest = chartData[chartData.length - 1];
    const latestGrowth = latest?.growth || 0;
    const latestTrend = latest?.trend || 0;
    const ratio = latest ? (latest.upgrades / (latest.upgrades + latest.downgrades)) * 100 : 50;

    return (
        <div className="flex flex-col h-full gap-4">
            {/* --- PRIMARY CHART: Growth Bars + Trend --- */}
            <div className="flex-1 min-h-[50%] relative">
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <div className="text-xs text-white/60">EPS Growth (YoY)</div>
                        <div className={`text-2xl font-semibold ${latestGrowth > 10 ? 'text-green-400' : latestGrowth > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {latestGrowth > 0 ? '+' : ''}{latestGrowth.toFixed(1)}%
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-white/60">3Y Trend</div>
                        <div className="text-lg text-blue-400">{latestTrend.toFixed(1)}%</div>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="99%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(date) => formatChartDate(date, 'short')}
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                            tickLine={false}
                        />
                        <Tooltip content={<RechartsTooltipWrapper metricUnit="%" />} />

                        <Bar dataKey="growth" radius={[2, 2, 0, 0]} barSize={12}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>

                        <Line
                            type="monotone"
                            dataKey="trend"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>


        </div>
    );
}
