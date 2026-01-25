import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { RechartsTooltipWrapper } from '../ChartTooltip';
import { formatChartDate } from '@/shared/utils/chartUtils';

/**
 * PBRatioChart
 *
 * Primary: Historical PB Ratio Area Chart
 * Supporting: Valuation Percentile Gauge
 */
export default function PBRatioChart({ data = [], height = 400 }) {
    // 1. Prepare Data
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map(d => ({
            date: d.date,
            value: d.pb || d.value // Metric agnostic fallback
        }));
    }, [data]);

    // 2. Compute Statistics for Gauge
    const stats = useMemo(() => {
        if (!chartData.length) return { current: 0, min: 0, max: 0, percentile: 50 };
        const values = chartData.map(d => d.value);
        const current = values[values.length - 1];
        const min = Math.min(...values);
        const max = Math.max(...values);
        // Simple percentile rank
        const sorted = [...values].sort((a, b) => a - b);
        const rank = sorted.indexOf(current);
        const percentile = (rank / sorted.length) * 100;

        return { current, min, max, percentile };
    }, [chartData]);

    if (!chartData.length) return <div className="text-white/40 flex justify-center items-center h-full">No Data</div>;

    return (
        <div className="flex flex-col h-full gap-4">
            {/* --- PRIMARY CHART: Historical PB Area --- */}
            <div className="flex-1 min-h-[50%] relative">
                <div className="text-xs text-white/50 mb-2">Historical Price-to-Book Range</div>
                <ResponsiveContainer width="100%" height="95%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="pbGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
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
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#f472b6"
                            fill="url(#pbGradient)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>


        </div>
    );
}
