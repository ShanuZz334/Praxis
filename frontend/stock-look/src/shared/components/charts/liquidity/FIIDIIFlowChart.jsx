/**
 * @file FIIDIIFlowChart.jsx
 * @purpose Visualizes institutional investment flows (FII vs DII).
 * @responsibilities
 * - Renders ComposedChart with Area (daily flow) and Line (cumulative).
 * - Comparatively displays Foreign vs Domestic flows.
 * - Provides immediate net flow calculation and insight.
 * @key_exports
 * - FIIDIIFlowChart (Default)
 * @dependencies
 * - Recharts, ChartTooltip
 * - chartUtils (formatChartDate)
 * @lifecycle
 * - Core component of Liquidity Analysis dashboard.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RechartsTooltipWrapper } from '../ChartTooltip';
import { formatChartDate } from '@/shared/utils/chartUtils';

// =============================
// Component
// =============================

export default function FIIDIIFlowChart({
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

    // Calculate cumulative flows
    let fiiCumulative = 0;
    let diiCumulative = 0;

    const chartData = data.map(d => {
        fiiCumulative += d.fii || 0;
        diiCumulative += d.dii || 0;

        return {
            date: d.date,
            fii: d.fii || 0,
            dii: d.dii || 0,
            fiiCumulative,
            diiCumulative,
            netFlow: (d.fii || 0) + (d.dii || 0),
        };
    });

    const latestData = chartData[chartData.length - 1];
    const netFlowColor = latestData.netFlow > 0 ? '#22c55e' : latestData.netFlow < 0 ? '#ef4444' : '#fbbf24';

    return (
        <div className="fii-dii-flow-chart">
            {/* Header */}
            <div className="mb-4 grid grid-cols-3 gap-4">
                <div>
                    <div className="text-xs text-white/60">FII Flow</div>
                    <div className={`text-lg font-semibold ${latestData.fii > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {latestData.fii > 0 ? '+' : ''}{(latestData.fii / 100).toFixed(0)} Cr
                    </div>
                </div>
                <div>
                    <div className="text-xs text-white/60">DII Flow</div>
                    <div className={`text-lg font-semibold ${latestData.dii > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {latestData.dii > 0 ? '+' : ''}{(latestData.dii / 100).toFixed(0)} Cr
                    </div>
                </div>
                <div>
                    <div className="text-xs text-white/60">Net Flow</div>
                    <div className="text-lg font-semibold" style={{ color: netFlowColor }}>
                        {latestData.netFlow > 0 ? '+' : ''}{(latestData.netFlow / 100).toFixed(0)} Cr
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        {/* FII gradient */}
                        <linearGradient id="fiiGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                        </linearGradient>

                        {/* DII gradient */}
                        <linearGradient id="diiGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

                    <XAxis
                        dataKey="date"
                        tickFormatter={(date) => formatChartDate(date, 'short')}
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                    />

                    <YAxis
                        yAxisId="flow"
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                        label={{ value: 'Daily Flow (₹ Cr)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    />

                    <YAxis
                        yAxisId="cumulative"
                        orientation="right"
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                        label={{ value: 'Cumulative (₹ Cr)', angle: 90, position: 'insideRight', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    />

                    <Tooltip content={<RechartsTooltipWrapper metricUnit=" Cr" />} />

                    <Legend
                        wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
                    />

                    {/* FII Daily Flow */}
                    <Area
                        yAxisId="flow"
                        type="monotone"
                        dataKey="fii"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#fiiGradient)"
                        fillOpacity={0.4}
                        name="FII Daily"
                    />

                    {/* DII Daily Flow */}
                    <Area
                        yAxisId="flow"
                        type="monotone"
                        dataKey="dii"
                        stroke="#f97316"
                        strokeWidth={2}
                        fill="url(#diiGradient)"
                        fillOpacity={0.4}
                        name="DII Daily"
                    />

                    {/* FII Cumulative */}
                    <Line
                        yAxisId="cumulative"
                        type="monotone"
                        dataKey="fiiCumulative"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="FII Cumulative"
                    />

                    {/* DII Cumulative */}
                    <Line
                        yAxisId="cumulative"
                        type="monotone"
                        dataKey="diiCumulative"
                        stroke="#f97316"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="DII Cumulative"
                    />
                </ComposedChart>
            </ResponsiveContainer>

            {/* Interpretation */}
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-white/70">
                    <span className="font-medium">💡 Flow Dynamics:</span>{' '}
                    {latestData.fii > 0 && latestData.dii > 0
                        ? 'Both FII & DII buying - strong positive momentum'
                        : latestData.fii < 0 && latestData.dii > 0
                            ? 'DII supporting despite FII outflows - domestic strength'
                            : latestData.fii > 0 && latestData.dii < 0
                                ? 'FII inflows offsetting DII outflows'
                                : 'Both selling - near-term pressure'}
                </div>
            </div>
        </div>
    );
}
