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
                value: series[i]
            });
        }

        return result;
    }, [card]);

    // Color Logic based on normalized score
    const norm = card.normalized || 0;
    let color = '#fbbf24'; // Yellow/Neutral
    let signalLabel = 'Neutral';

    if (norm > 0.3) {
        color = '#34d399'; // Green/Bullish
        signalLabel = 'Bullish';
    } else if (norm < -0.3) {
        color = '#f87171'; // Red/Bearish
        signalLabel = 'Bearish';
    }

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">30-Day History</span>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-white/60 capitalize font-mono">{signalLabel}</span>
                </div>
            </div>

            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#ffffff30"
                            tick={{ fontSize: 10, fill: '#ffffff50' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                            interval={4}
                        />
                        <YAxis
                            stroke="#ffffff30"
                            tick={{ fontSize: 10, fill: '#ffffff50' }}
                            axisLine={false}
                            tickLine={false}
                            domain={['auto', 'auto']}
                            width={40}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0b1220',
                                borderColor: '#ffffff20',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            itemStyle={{ color: color }}
                            labelStyle={{
                                color: '#ffffff50',
                                marginBottom: '4px',
                                fontSize: '10px',
                                textTransform: 'uppercase'
                            }}
                            cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                            formatter={(value) => value.toFixed(2)}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            dot={{ fill: '#0b1220', stroke: color, strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5, fill: color, stroke: '#fff' }}
                            strokeDasharray="5 5"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
