/**
 * @file PolicyRateCycleChart.jsx
 * @purpose Step-line chart for Central Bank (RBI/Fed) policy rates.
 * @responsibilities
 * - Visualizes repo rate changes over time using step curve.
 * - Indicates policy stance (Hawkish/Dovish/Neutral).
 * - Provides AI interpretation of rate decisions.
 * @key_exports
 * - PolicyRateCycleChart (Default)
 * @dependencies
 * - Recharts, framer-motion
 * @lifecycle
 * - Critical for Macro dashboard to track monetary policy.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';

// =============================
// Component
// =============================

export default function PolicyRateCycleChart({ data, height = 300 }) {
    if (!data || data.length === 0) return null;

    const latest = data[data.length - 1];
    const previous = data[data.length - 2] || latest;
    const change = latest.rate - previous.rate;
    const trend = change > 0 ? 'tightening' : change < 0 ? 'easing' : 'neutral';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '11px' }}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '11px' }}
                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        label={{ value: 'Repo Rate %', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                        }}
                    />

                    {/* Neutral reference (pre-pandemic normal) */}
                    <ReferenceLine
                        y={5.5}
                        stroke="#6b7280"
                        strokeDasharray="5 5"
                        label={{ value: 'Neutral', fill: '#6b7280', fontSize: 10 }}
                    />

                    {/* Rate line (step style) */}
                    <Line
                        type="stepAfter"
                        dataKey="rate"
                        stroke={trend === 'tightening' ? '#ef4444' : trend === 'easing' ? '#22c55e' : '#fbbf24'}
                        strokeWidth={3}
                        dot={{ fill: trend === 'tightening' ? '#ef4444' : trend === 'easing' ? '#22c55e' : '#fbbf24', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Policy Stance Indicator */}
            <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-xs text-white/50">Current Rate</div>
                        <div className="text-lg font-bold text-white">{latest.rate}%</div>
                    </div>
                    <div>
                        <div className="text-xs text-white/50">Last Change</div>
                        <div className={`text-lg font-bold ${change > 0 ? 'text-red-400' :
                            change < 0 ? 'text-green-400' :
                                'text-white'
                            }`}>
                            {change > 0 ? '+' : ''}{change.toFixed(2)}%
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-white/50">Stance</div>
                        <div className={`text-sm font-medium ${trend === 'tightening' ? 'text-red-400' :
                            trend === 'easing' ? 'text-green-400' :
                                'text-yellow-400'
                            }`}>
                            {trend === 'tightening' ? '📈 Hawkish' :
                                trend === 'easing' ? '📉 Dovish' :
                                    '⚖️ Neutral'}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Interpretation */}
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <span className="text-blue-400 text-sm">💡</span>
                    <p className="text-xs text-white/70 leading-relaxed">
                        {getPolicyInterpretation(latest.rate, trend, change)}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

function getPolicyInterpretation(rate, trend, change) {
    if (trend === 'tightening') {
        return `RBI raised rates by ${Math.abs(change).toFixed(2)}% to ${rate}%. Tightening cycle pressures valuations - defensive sectors may outperform.`;
    } else if (trend === 'easing') {
        return `RBI cut rates by ${Math.abs(change).toFixed(2)}% to ${rate}%. Accommodative policy supports liquidity and equity multiples - risk-on environment.`;
    } else {
        return `RBI holding rates steady at ${rate}%. Neutral stance suggests data-dependent approach - focus on inflation trajectory.`;
    }
}
