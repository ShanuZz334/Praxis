/**
 * @file TechnicalHistoryChart.jsx
 * @purpose Renders a 30-day historical trend chart for an indicator.
 * @responsibilities
 * - Generates mock historical data based on current trend and volatility.
 * - Visualizes the trend with color-coded lines.
 * @key_exports
 * - TechnicalHistoryChart (Default)
 * @dependencies
 * - Recharts
 * @lifecycle
 * - Rendered by TechnicalModal.
 * @date 2026-02-03
 */

import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// =============================
// Component
// =============================

import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';

export default function TechnicalHistoryChart({ id, trend = 'neutral', baseValue = 50, label = 'Indicator' }) {

    // =============================
    // Logic & Memoization
    // =============================

    // =============================
    // State & Effects
    // =============================
    const [data, setData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!id && !label) return;

            try {
                // Try fetching from backend
                const metricKey = id || label; // Fallback to label if id missing
                const res = await axiosInstance.get(API_PATHS.CHARTS.GET_DATA(metricKey));

                if (res.data && res.data.length > 0) {
                    setData(res.data);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.warn("Failed to fetch chart data, falling back to simulation", err);
            }

            // --- Fallback Simulation (Original Logic) ---
            const result = [];
            const today = new Date();
            const startVal = parseFloat(baseValue) || 50;
            const days = 30;
            const volatility = startVal * 0.05;
            let drift = 0;
            const safeTrend = (trend || '').toLowerCase();
            if (safeTrend.includes('bull') || safeTrend.includes('up') || safeTrend.includes('positive')) drift = 0.01;
            if (safeTrend.includes('bear') || safeTrend.includes('down') || safeTrend.includes('negative')) drift = -0.01;

            let series = [];
            let val = startVal;
            for (let i = 0; i < days; i++) {
                val = val / (1 + drift);
                val = val + (Math.random() - 0.5) * volatility;
                series.unshift(val);
            }
            for (let i = 0; i < days; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - (days - 1 - i));
                result.push({
                    date: date.toLocaleDateString('en-US', { disable_month: 'short', day: 'numeric' }),
                    value: parseFloat(series[i].toFixed(3))
                });
            }
            setData(result);
            setLoading(false);
        };

        fetchData();
    }, [id, label, trend, baseValue]);

    // Color Logic
    const safeTrend = (trend || '').toLowerCase();
    let color = '#d97706'; // amber-600
    if (safeTrend.includes('bull') || safeTrend.includes('up') || safeTrend.includes('positive') || safeTrend.includes('buy')) color = '#059669'; // emerald-600
    if (safeTrend.includes('bear') || safeTrend.includes('down') || safeTrend.includes('negative') || safeTrend.includes('sell')) color = '#dc2626'; // red-600

    // =============================
    // Render Layer
    // =============================

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
