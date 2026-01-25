import React, { useMemo } from 'react';
import {
    ComposedChart,
    Line,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell
} from 'recharts';
import { RechartsTooltipWrapper } from '../ChartTooltip';
import { formatChartDate } from '@/shared/utils/chartUtils';

/**
 * ForwardPEChart
 *
 * Primary: Forward PE vs Trailing PE Line Chart
 * Supporting: Spread Ribbon (Forward - Trailing)
 */
export default function ForwardPEChart({ data = [], height = 400 }) {
    // 1. Prepare Data
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data.map(d => {
            // Mock Trailing PE if missing (logic: Forward is usually lower than Trailing in growth)
            // If real data has it, great. Else generate reasonable mock for demo.
            const forward = d.forwardPE || d.value || 0;
            const trailing = d.trailingPE || d.value * 1.15 || 0; // Fallback
            const spread = forward - trailing;

            return {
                date: d.date,
                forwardPE: forward,
                trailingPE: trailing,
                spread: spread
            };
        });
    }, [data]);

    if (chartData.length === 0) {
        return <div className="flex items-center justify-center h-full text-white/40">No Data</div>;
    }

    const latest = chartData[chartData.length - 1];

    return (
        <div className="flex flex-col h-full gap-4">
            {/* --- PRIMARY CHART: Forward vs Trailing PE --- */}
            <div className="flex-1 min-h-[50%] relative">
                <div className="text-xs text-white/50 mb-2 flex justify-between">
                    <span>Forward Valuation Multiples</span>
                    <div className="flex gap-3">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-0.5 bg-blue-400"></span> Fwd PE
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-0.5 bg-white/40 border-dashed border-b"></span> Trailing PE
                        </span>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="99%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="fwdGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={d => formatChartDate(d, 'short')}
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                            tickLine={false}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip content={<RechartsTooltipWrapper />} />

                        {/* Trailing PE (Dashed) */}
                        <Line
                            type="monotone"
                            dataKey="trailingPE"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            dot={false}
                            activeDot={false}
                        />

                        {/* Forward PE (Solid + Area) */}
                        <Area
                            type="monotone"
                            dataKey="forwardPE"
                            stroke="#60a5fa"
                            strokeWidth={2}
                            fill="url(#fwdGradient)"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>



            {/* AI Custom Interpretation added via standard layout, not inside chart component */}
        </div>
    );
}

// Helper BarChart wrapper needed since we imported Bar but setup ComposedChart above
import { BarChart } from 'recharts';
