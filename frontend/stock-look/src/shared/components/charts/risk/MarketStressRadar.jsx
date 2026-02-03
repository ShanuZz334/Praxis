/**
 * @file MarketStressRadar.jsx
 * @purpose Multi-dimensional view of market risk factors.
 * @responsibilities
 * - Renders a RadarChart comparing riskAcross 5 dimensions (VIX, Liquidity, etc.).
 * - Calculates composite Stress Score.
 * - Alerts on critical stress levels.
 * @key_exports
 * - MarketStressRadar (Default)
 * @dependencies
 * - Recharts, ChartTooltip
 * @lifecycle
 * - Central component of Risk Management dashboard.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { RechartsTooltipWrapper } from '../ChartTooltip';

// =============================
// Component
// =============================

export default function MarketStressRadar({
    data = {},
    height = 350,
}) {
    // Transform data for radar chart
    const radarData = [
        { dimension: 'VIX', value: data.vix || 0, fullMark: 100 },
        { dimension: 'Liquidity', value: data.liquidity || 0, fullMark: 100 },
        { dimension: 'Flows', value: data.flows || 0, fullMark: 100 },
        { dimension: 'Credit', value: data.credit || 0, fullMark: 100 },
        { dimension: 'Global', value: data.global || 0, fullMark: 100 },
    ];

    // Calculate overall stress score
    const overallStress = radarData.reduce((sum, d) => sum + d.value, 0) / radarData.length;

    let stressLevel = 'Low';
    let stressColor = '#22c55e';

    if (overallStress > 70) {
        stressLevel = 'Extreme';
        stressColor = '#ef4444';
    } else if (overallStress > 50) {
        stressLevel = 'High';
        stressColor = '#f97316';
    } else if (overallStress > 30) {
        stressLevel = 'Moderate';
        stressColor = '#fbbf24';
    }

    return (
        <div className="market-stress-radar">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <div className="text-sm text-white/60">Market Stress Composite</div>
                    <div className="text-2xl font-semibold" style={{ color: stressColor }}>
                        {overallStress.toFixed(0)}/100
                    </div>
                </div>
                <div
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{
                        backgroundColor: `${stressColor}20`,
                        color: stressColor,
                    }}
                >
                    {stressLevel} Stress
                </div>
            </div>

            {/* Radar Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />

                    <PolarAngleAxis
                        dataKey="dimension"
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '12px' }}
                    />

                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: '10px' }}
                    />

                    <Tooltip content={<RechartsTooltipWrapper metricUnit="/100" />} />

                    <Radar
                        name="Stress Level"
                        dataKey="value"
                        stroke={stressColor}
                        fill={stressColor}
                        fillOpacity={0.5}
                        strokeWidth={2}
                    />
                </RadarChart>
            </ResponsiveContainer>

            {/* Dimension Breakdown */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                {radarData.map((d) => {
                    const dimColor = d.value > 70 ? '#ef4444' : d.value > 50 ? '#f97316' : d.value > 30 ? '#fbbf24' : '#22c55e';

                    return (
                        <div key={d.dimension} className="text-center">
                            <div className="text-xs text-white/60 mb-1">{d.dimension}</div>
                            <div className="text-lg font-semibold" style={{ color: dimColor }}>
                                {d.value.toFixed(0)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Interpretation */}
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-white/70">
                    <span className="font-medium">💡 Stress Analysis:</span>{' '}
                    {overallStress > 70
                        ? 'Extreme stress across multiple dimensions - high caution advised'
                        : overallStress > 50
                            ? 'Elevated stress levels - monitor closely for deterioration'
                            : overallStress > 30
                                ? 'Moderate stress - some pockets of concern'
                                : 'Low stress environment - favorable for risk-taking'}
                </div>
            </div>

            {/* Warning Badges */}
            {radarData.filter(d => d.value > 70).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {radarData.filter(d => d.value > 70).map(d => (
                        <div
                            key={d.dimension}
                            className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs text-red-400"
                        >
                            ⚠ {d.dimension} Alert
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
