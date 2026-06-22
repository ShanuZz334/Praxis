/**
 * @file OptionsHistoryChart.jsx
 * @purpose Renders a lightweight 7-day trend chart for options metrics.
 * @responsibilities
 * - Visualizes the historical trend of a specific metric (e.g., PCR or Net Delta).
 * - Simulates historical data points based on the current "trend" and "baseValue" (since backend history is pending).
 * - Adapts line color based on trend direction (Emerald/Red/Amber).
 * @key_exports
 * - OptionsHistoryChart (Default Component)
 * @dependencies
 * - recharts: For responsive line charting.
 * @lifecycle
 * - Rendered by OptionsModal.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';

// =============================
// Main Component
// =============================
export default function OptionsHistoryChart({ id, trend = 'neutral', baseValue = 100, label = 'Metric' }) {

    // =============================
    // Mock Data Generation
    // =============================
    // =============================
    // Data Fetching
    // =============================
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id && !label) return;

            try {
                const metricKey = id || label.replace(/\s+/g, '_').toLowerCase();
                const res = await axiosInstance.get(`${API_PATHS.CHARTS.GET_DATA(metricKey)}?days=7`);

                if (res.data && res.data.length > 0) {
                    setData(res.data);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.warn("Using simulated 7-day data");
            }

            // --- Fallback Simulation ---
            const result = [];
            const today = new Date();
            const startVal = parseFloat(baseValue) || 100;
            const volatility = startVal * 0.05;
            const drift = trend === 'up' ? 0.03 : trend === 'down' ? -0.03 : 0;
            let series = [];
            let val = startVal;
            for (let i = 0; i < 7; i++) {
                val = val / (1 + drift);
                val = val + (Math.random() - 0.5) * volatility;
                series.unshift(val);
            }
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - (6 - i));
                result.push({
                    date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    value: parseFloat(series[i].toFixed(3))
                });
            }
            setData(result);
            setLoading(false);
        };
        fetchData();
    }, [id, label, trend, baseValue]);

    // Visual Config
    const color = trend === 'up' ? '#059669' : trend === 'down' ? '#dc2626' : '#d97706'; // Emerald, Red, Amber

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">7-Day Trend</span>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-text-secondary capitalize font-mono">{trend} Trend</span>
                </div>
            </div>

            {/* Chart Area */}
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
                            cursor={{ stroke: 'var(--text-tertiary)', strokeWidth: 1 }}
                            formatter={(value) => [`${value}`, label]}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            dot={{ fill: 'var(--background-card)', stroke: color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: color, stroke: '#fff' }}
                            strokeDasharray="5 5"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
