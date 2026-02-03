/**
 * @file FundamentalHistoryChart.jsx
 * @purpose Renders a 30-day historical trend using Recharts.
 * @responsibilities
 * - Generates visual trend data based on the current signal (Bullish/Bearish).
 * - Adapts chart color to the signal.
 * @key_exports
 * - FundamentalHistoryChart (Default Component)
 * @dependencies
 * - Recharts
 * @lifecycle
 * - Rendered inside FundamentalModal (Desktop) or Detail View.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// =============================
// Main Component
// =============================
export default function FundamentalHistoryChart({ trend = 'neutral', baseValue = 50, label = 'Metric' }) {

    // --- Data Generation ---
    const data = useMemo(() => {
        const result = [];
        const today = new Date();
        const startVal = parseFloat(baseValue) || 50;

        const days = 30;
        const volatility = startVal * 0.05;

        let drift = 0;
        const safeTrend = (trend || '').toLowerCase();
        if (safeTrend.includes('bull') || safeTrend.includes('top') || safeTrend.includes('high')) drift = 0.01;
        if (safeTrend.includes('bear') || safeTrend.includes('bottom') || safeTrend.includes('low')) drift = -0.01;

        let series = [];
        let val = startVal;

        // Backward simulation
        for (let i = 0; i < days; i++) {
            val = val / (1 + drift);
            val = val + (Math.random() - 0.5) * volatility;
            series.unshift(val);
        }

        // Map to date objects
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (days - 1 - i));
            result.push({
                date: date.toLocaleDateString('en-US', { disable_month: 'short', day: 'numeric' }),
                value: parseFloat(series[i].toFixed(3))
            });
        }

        return result;
    }, [trend, baseValue]);

    // --- Visual Config ---
    const safeTrend = (trend || '').toLowerCase();
    let color = 'var(--state-warning-main)';
    if (safeTrend.includes('bull') || safeTrend.includes('top') || safeTrend.includes('high')) color = 'var(--state-bullish-main)';
    if (safeTrend.includes('bear') || safeTrend.includes('bottom') || safeTrend.includes('low')) color = 'var(--state-bearish-main)';

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">30-Day Trend</span>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-text-secondary capitalize font-mono">{trend || 'Neutral'}</span>
                </div>
            </div>

            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="var(--text-tertiary)"
                            tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: '500' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                            interval={4}
                        />
                        <YAxis
                            stroke="var(--text-tertiary)"
                            tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: '500' }}
                            axisLine={false}
                            tickLine={false}
                            domain={['auto', 'auto']}
                            width={30}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--background-card)',
                                border: '1px solid var(--border-default)',
                                borderRadius: '12px',
                                padding: '8px 12px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                                color: 'var(--text-primary)'
                            }}
                            itemStyle={{ color: color, fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}
                            labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            cursor={{ stroke: 'var(--text-tertiary)', strokeWidth: 1, strokeOpacity: 0.5 }}
                            formatter={(value) => [`${value}`, 'Value']}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            dot={{ fill: 'var(--background-card)', stroke: color, strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5, fill: color, stroke: '#fff' }}
                            strokeDasharray="5 5"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
