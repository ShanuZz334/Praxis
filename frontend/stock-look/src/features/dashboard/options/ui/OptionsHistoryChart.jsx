import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function OptionsHistoryChart({ trend = 'neutral', baseValue = 100, label = 'Metric' }) {

    // GENERATE MOCK HISTORY (7 Days)
    const data = useMemo(() => {
        const result = [];
        const today = new Date();
        const startVal = parseFloat(baseValue) || 100;

        let current = startVal;
        // Reverse engineer 7 days based on trend
        // If UP, we start lower. If DOWN, we start higher.

        const volatility = startVal * 0.05; // 5% daily noise
        const drift = trend === 'up' ? 0.03 : trend === 'down' ? -0.03 : 0; // 3% drift

        // Generate backwards then reverse
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { disable_month: 'short', day: 'numeric' });

            // Mock logic: 
            // We want the LAST point to be roughly the baseValue.
            // So we can simulate backwards from baseValue? 
            // Or just simulate forward from (baseValue * (1 - drift*7))? Let's do forward.

            // Actually simpler:
            // Calculate a starting point
            // Trend Factor: Up means start = val * 0.8, Down means start = val * 1.2

            // Per point loop:
            // This is just a visual aid, exact math doesn't matter as much as the shape.
        }

        // Simpler approach: Create array of 7 points ending near baseValue
        let series = [];
        let val = startVal;

        // Walk backwards
        for (let i = 0; i < 7; i++) {
            // Undo drift
            val = val / (1 + drift);
            // Add noise
            val = val + (Math.random() - 0.5) * volatility;
            series.unshift(val);
        }

        // Map to object
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - i));
            result.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                value: parseFloat(series[i].toFixed(3))
            });
        }

        return result;
    }, [trend, baseValue]);

    const color = trend === 'up' ? '#059669' : trend === 'down' ? '#dc2626' : '#d97706'; // Emerald, Red, Amber 600

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">7-Day Trend</span>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-text-secondary capitalize font-mono">{trend} Trend</span>
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
                        />
                        <YAxis
                            stroke="#94a3b8"
                            tick={{ fontSize: 10, fill: '#475569', fontWeight: '500' }}
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
                            cursor={{ stroke: '#88888840', strokeWidth: 1 }}
                            formatter={(value) => [`${value}`, 'Value']}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            dot={{ fill: 'var(--background-card)', stroke: color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: color, stroke: '#fff' }}
                            strokeDasharray="5 5" // DOTTED LINE REQUEST
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
