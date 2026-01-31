import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

/**
 * GlobalHistoryChart
 * 30-day historical chart for Global Structure metrics
 * Generates category-specific mock data patterns
 */
export default function GlobalHistoryChart({ card }) {
    if (!card) return null;

    // GENERATE MOCK HISTORY (30 Days)
    const data = useMemo(() => {
        const result = [];
        const today = new Date();
        const startVal = parseFloat(card.raw?.toString().replace(/[^0-9.-]/g, '')) || 100;
        const days = 30;

        // Category-specific volatility and drift patterns
        let volatility = 0.02; // Default 2%
        let drift = 0;

        const category = card.category?.toLowerCase() || '';
        const norm = card.normalized || 0;

        // Adjust based on category
        if (category.includes('currency')) {
            volatility = 0.015; // Forex: Lower daily volatility
            drift = norm > 0.3 ? 0.003 : norm < -0.3 ? -0.003 : 0;
        } else if (category.includes('indices')) {
            volatility = 0.025; // Indices: Moderate volatility
            drift = norm > 0.2 ? 0.005 : norm < -0.2 ? -0.005 : 0;
        } else if (category.includes('commodities')) {
            volatility = 0.035; // Commodities: Higher volatility
            drift = norm > 0.2 ? 0.004 : norm < -0.2 ? -0.004 : 0;
        } else if (category.includes('rates') || category.includes('volatility')) {
            volatility = 0.04; // Rates/VIX: Highest volatility
            drift = norm > 0.3 ? 0.006 : norm < -0.3 ? -0.006 : 0;
        }

        let series = [];
        let val = startVal;

        // Walk backwards 30 days to generate history
        for (let i = 0; i < days; i++) {
            val = val / (1 + drift);
            val = val + (Math.random() - 0.5) * volatility * val;
            series.unshift(val);
        }

        // Map to date objects
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (days - 1 - i));
            result.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: parseFloat(series[i].toFixed(3))
            });
        }

        return result;
    }, [card]);

    // Color Logic based on normalized score
    const norm = card.normalized || 0;
    let color = '#d97706'; // Amber 600
    let signalLabel = 'Neutral';

    if (norm > 0.3) {
        color = '#059669'; // Emerald 600
        signalLabel = 'Bullish';
    } else if (norm < -0.3) {
        color = '#dc2626'; // Red 600
        signalLabel = 'Bearish';
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#94a3b8"
                            tick={{ fontSize: 10, fill: '#475569', fontWeight: '500' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                            interval={4}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            tick={{ fontSize: 10, fill: '#475569', fontWeight: '500' }}
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
                            cursor={{ stroke: '#88888840', strokeWidth: 1 }}
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
