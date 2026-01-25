import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function TechnicalHistoryChart({ trend = 'neutral', baseValue = 50, label = 'Indicator' }) {

    // GENERATE MOCK HISTORY (30 Days)
    const data = useMemo(() => {
        const result = [];
        const today = new Date();
        const startVal = parseFloat(baseValue) || 50;

        // Configuration for 30 days
        const days = 30;
        const volatility = startVal * 0.05; // 5% noise

        let drift = 0;
        const safeTrend = (trend || '').toLowerCase();
        if (safeTrend.includes('bull') || safeTrend.includes('up') || safeTrend.includes('positive')) drift = 0.01;
        if (safeTrend.includes('bear') || safeTrend.includes('down') || safeTrend.includes('negative')) drift = -0.01;

        let series = [];
        let val = startVal;

        // Walk backwards 30 days
        for (let i = 0; i < days; i++) {
            val = val / (1 + drift);
            val = val + (Math.random() - 0.5) * volatility;
            series.unshift(val);
        }

        // Map to object
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (days - 1 - i));
            result.push({
                date: date.toLocaleDateString('en-US', { disable_month: 'short', day: 'numeric' }),
                value: series[i]
            });
        }

        return result;
    }, [trend, baseValue]);

    // Color Logic
    const safeTrend = (trend || '').toLowerCase();
    let color = '#fbbf24'; // Warning/Neutral
    if (safeTrend.includes('bull') || safeTrend.includes('up') || safeTrend.includes('positive') || safeTrend.includes('buy')) color = '#34d399';
    if (safeTrend.includes('bear') || safeTrend.includes('down') || safeTrend.includes('negative') || safeTrend.includes('sell')) color = '#f87171';

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">30-Day Trend</span>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-white/60 capitalize font-mono">{trend || 'Neutral'}</span>
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
                            width={30}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0b1220', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: color }}
                            labelStyle={{ color: '#ffffff50', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
                            cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
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
