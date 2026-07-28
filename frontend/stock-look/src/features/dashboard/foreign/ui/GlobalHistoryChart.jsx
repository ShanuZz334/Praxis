/**
 * @file GlobalHistoryChart.jsx
 * @purpose Displays a 30-day historical trend chart for Global Indicators.
 * @responsibilities
 * - Generates mock historical data based on the card's current trend and volatility profile (until backend ready).
 * - Visualizes data using a responsive Recharts line chart.
 * - Adapts coloring based on Bullish/Bearish sentiment.
 * @key_exports
 * - GlobalHistoryChart (Default Component)
 * @dependencies
 * - recharts: Charting library.
 * @lifecycle
 * - Rendered by GlobalStructureModal.
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
export default function GlobalHistoryChart({ card, id }) {
    if (!card) return null;

    // 1. Mock Data Generation (30 Days)
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!card) return;

            try {
                // Try fetching from backend
                const metricKey = id || card.label;
                const res = await axiosInstance.get(API_PATHS.CHARTS.GET_DATA(metricKey));

                if (res.data && res.data.length > 0) {
                    setData(res.data);
                } else {
                    setData([]);
                }
            } catch (err) {
                console.warn("Failed to fetch chart data", err);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [card, id]);

    // 2. Visual Logic
    const norm = card.normalized || 0;
    let color = '#d97706'; // Neutral (Amber)
    let signalLabel = 'Neutral';

    if (norm > 0.3) {
        color = '#059669'; // Bullish (Emerald)
        signalLabel = 'Bullish';
    } else if (norm < -0.3) {
        color = '#dc2626'; // Bearish (Red)
        signalLabel = 'Bearish';
    }

    // 3. Render
    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-background-surface/30 rounded-xl border border-border-subtle">
                <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-accent-primary/50" />
                    <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase">Loading History...</span>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-background-surface/30 rounded-xl border border-border-subtle border-dashed">
                <span className="text-xs text-text-muted font-medium">No historical data available</span>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">30-Day History</span>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-text-secondary capitalize font-mono">{signalLabel}</span>
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
                            width={40}
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
                            formatter={(value) => [`${value.toFixed(3)}`, 'Value']}
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
