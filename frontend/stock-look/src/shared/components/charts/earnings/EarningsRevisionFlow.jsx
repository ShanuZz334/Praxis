/**
 * @file EarningsRevisionFlow.jsx
 * @purpose Illustrates analyst earnings revision trends.
 * @responsibilities
 * - Renders a diverging bar chart for Upgrades vs. Downgrades.
 * - Calculates and visualizes Net Revision Score.
 * - Provides AI-driven insight based on revision momentum.
 * @key_exports
 * - EarningsRevisionFlow (Default)
 * @dependencies
 * - Recharts, ChartTooltip
 * @lifecycle
 * - Used in Earnings Dashboard for sentiment analysis.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { RechartsTooltipWrapper } from '../ChartTooltip';

// =============================
// Component
// =============================

export default function EarningsRevisionFlow({
    data = [],
    height = 300,
}) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-white/40">
                No data available
            </div>
        );
    }

    // Transform data for diverging bars
    const chartData = data.map(d => ({
        date: d.date,
        upgrades: d.upgrades || 0,
        downgrades: -(d.downgrades || 0), // Negative for diverging effect
        net: (d.upgrades || 0) - (d.downgrades || 0),
    }));

    const latestNet = chartData[chartData.length - 1]?.net || 0;
    const netColor = latestNet > 0 ? '#22c55e' : latestNet < 0 ? '#ef4444' : '#fbbf24';

    return (
        <div className="earnings-revision-flow">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <div className="text-sm text-white/60">Net Revision Score</div>
                    <div className="text-2xl font-semibold" style={{ color: netColor }}>
                        {latestNet > 0 ? '+' : ''}{latestNet}
                    </div>
                </div>
                <div className="flex gap-4 text-xs">
                    <div>
                        <div className="text-white/60">Upgrades</div>
                        <div className="text-green-400 font-semibold">{chartData[chartData.length - 1]?.upgrades || 0}</div>
                    </div>
                    <div>
                        <div className="text-white/60">Downgrades</div>
                        <div className="text-red-400 font-semibold">{Math.abs(chartData[chartData.length - 1]?.downgrades || 0)}</div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    layout="vertical"
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

                    <XAxis
                        type="number"
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                    />

                    <YAxis
                        type="category"
                        dataKey="date"
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                        width={80}
                    />

                    <Tooltip content={<RechartsTooltipWrapper />} />

                    {/* Zero reference line */}
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />

                    {/* Upgrades (positive) */}
                    <Bar
                        dataKey="upgrades"
                        fill="#22c55e"
                        radius={[0, 4, 4, 0]}
                        name="Upgrades"
                    />

                    {/* Downgrades (negative) */}
                    <Bar
                        dataKey="downgrades"
                        fill="#ef4444"
                        radius={[4, 0, 0, 4]}
                        name="Downgrades"
                    />
                </BarChart>
            </ResponsiveContainer>

            {/* Interpretation */}
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-white/70">
                    <span className="font-medium">💡 Insight:</span>{' '}
                    {latestNet > 5
                        ? 'Strong upgrade momentum - positive earnings outlook'
                        : latestNet < -5
                            ? 'Downgrade pressure - earnings expectations declining'
                            : 'Balanced revisions - neutral earnings outlook'}
                </div>
            </div>
        </div>
    );
}
