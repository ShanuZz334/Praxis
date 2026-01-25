import React, { useMemo } from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea
} from 'recharts';
import { RechartsTooltipWrapper } from '../ChartTooltip';
import { formatChartDate } from '@/shared/utils/chartUtils';

/**
 * GDPGrowthChart
 *
 * Primary: GDP Growth Rate (Line) with Color-coded regimes
 * Supporting: Zone/Cycle Shading Indicator
 */
export default function GDPGrowthChart({ data = [], height = 400 }) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map(d => ({
            date: d.date,
            value: d.gdp || d.value
        }));
    }, [data]);

    if (!chartData.length) return <div className="text-white/40 flex justify-center items-center h-full">No Data</div>;

    const latest = chartData[chartData.length - 1]?.value || 0;

    // Determine regime color
    const getRegimeColor = (val) => {
        if (val > 7) return '#4ade80'; // Boom
        if (val > 5) return '#60a5fa'; // Stable
        if (val > 2) return '#facc15'; // Slow
        return '#ef4444'; // Recession
    };

    const currentColor = getRegimeColor(latest);

    return (
        <div className="flex flex-col h-full gap-4">
            {/* --- PRIMARY CHART: GDP Line with Zones --- */}
            <div className="flex-1 min-h-[50%] relative">
                <div className="text-xs text-white/50 mb-2">Real GDP Growth (YoY %)</div>
                <ResponsiveContainer width="100%" height="99%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
                        <Tooltip content={<RechartsTooltipWrapper metricUnit="%" />} />

                        {/* Background Zones (Simulated with References if fixed, or just implicit in line color) */}
                        <ReferenceArea y1={0} y2={2} fill="#ef4444" fillOpacity={0.05} />
                        <ReferenceArea y1={7} y2={10} fill="#4ade80" fillOpacity={0.05} />

                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={currentColor} // Dynamic coloring per point is hard in Recharts Line, using latest for whole or just standard color
                            strokeWidth={3}
                            dot={{ fill: '#0b1220', strokeWidth: 2, r: 4 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>


        </div>
    );
}
