/**
 * @file EarningsYieldChart.jsx
 * @purpose Compares Earnings Yield vs Bond Yields (Equity Risk Premium).
 * @responsibilities
 * - Renders ComposedChart with Earnings Yield and 10Y G-Sec Yield.
 * - Visualizes ERP spread as a shaded area.
 * - Colors spread based on attractiveness (Green/Red).
 * @key_exports
 * - EarningsYieldChart (Default)
 * @dependencies
 * - Recharts, ChartTooltip
 * - chartUtils (formatChartDate)
 * @lifecycle
 * - Key Valuation metric for Asset Allocation decisions.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RechartsTooltipWrapper } from '../ChartTooltip';
import { formatChartDate } from '@/shared/utils/chartUtils';

// =============================
// Component
// =============================

export default function EarningsYieldChart({
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

    // Calculate ERP (Equity Risk Premium) = Earnings Yield - Bond Yield
    const chartData = data.map(d => ({
        date: d.date,
        earningsYield: d.earningsYield || 0,
        bondYield: d.bondYield || 0,
        erp: (d.earningsYield || 0) - (d.bondYield || 0),
    }));

    const latestData = chartData[chartData.length - 1];
    const erpColor = latestData.erp > 2 ? '#22c55e' : latestData.erp < 0 ? '#ef4444' : '#fbbf24';

    return (
        <div className="earnings-yield-chart">
            {/* Header */}
            <div className="mb-4 grid grid-cols-3 gap-4">
                <div>
                    <div className="text-xs text-white/60">Earnings Yield</div>
                    <div className="text-lg font-semibold text-blue-400">
                        {latestData.earningsYield.toFixed(2)}%
                    </div>
                </div>
                <div>
                    <div className="text-xs text-white/60">10Y G-Sec</div>
                    <div className="text-lg font-semibold text-orange-400">
                        {latestData.bondYield.toFixed(2)}%
                    </div>
                </div>
                <div>
                    <div className="text-xs text-white/60">ERP Spread</div>
                    <div className="text-lg font-semibold" style={{ color: erpColor }}>
                        {latestData.erp > 0 ? '+' : ''}{latestData.erp.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        {/* ERP gradient */}
                        <linearGradient id="erpGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={erpColor} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={erpColor} stopOpacity={0.05} />
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
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                        label={{ value: 'Yield (%)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    />

                    <Tooltip content={<RechartsTooltipWrapper metricUnit="%" />} />

                    <Legend
                        wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
                        iconType="line"
                    />

                    {/* ERP Spread Area */}
                    <Area
                        type="monotone"
                        dataKey="erp"
                        stroke="none"
                        fill="url(#erpGradient)"
                        fillOpacity={0.4}
                        name="ERP Spread"
                    />

                    {/* Earnings Yield Line */}
                    <Line
                        type="monotone"
                        dataKey="earningsYield"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="Earnings Yield"
                    />

                    {/* Bond Yield Line */}
                    <Line
                        type="monotone"
                        dataKey="bondYield"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={false}
                        name="10Y G-Sec"
                    />
                </ComposedChart>
            </ResponsiveContainer>

            {/* Interpretation */}
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-white/70">
                    <span className="font-medium">💡 Insight:</span>{' '}
                    {latestData.erp > 2
                        ? 'Positive ERP suggests equities are attractive vs bonds'
                        : latestData.erp < 0
                            ? 'Negative ERP - bonds more attractive than equities'
                            : 'Neutral ERP - equities fairly priced vs bonds'}
                </div>
            </div>
        </div>
    );
}
