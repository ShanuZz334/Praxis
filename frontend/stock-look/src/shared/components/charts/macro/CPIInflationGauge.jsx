/**
 * @file CPIInflationGauge.jsx
 * @purpose Vertical thermometer gauge for tracking inflation.
 * @responsibilities
 * - Visualizes current CPI value against a target threshold (e.g., RBI 4%).
 * - Uses color-coding (Green/Yellow/Red) to indicate risk levels.
 * - Provides AI interpretation of the inflationary environment.
 * @key_exports
 * - CPIInflationGauge (Default)
 * @dependencies
 * - framer-motion
 * @lifecycle
 * - Key widget in Macro Economic Analysis dashboard.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from 'react';
import { motion } from 'framer-motion';

// =============================
// Component
// =============================

export default function CPIInflationGauge({ value = 5.5, target = 4.0, height = 300 }) {
    const maxValue = 10;
    const percentage = (value / maxValue) * 100;
    const targetPercentage = (target / maxValue) * 100;

    const getColor = (inflationValue) => {
        if (inflationValue > 6) return '#ef4444'; // High inflation
        if (inflationValue > 4.5) return '#fbbf24'; // Moderate
        return '#22c55e'; // Low/controlled
    };

    return (
        <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="relative" style={{ height, width: '120px' }}>
                {/* Thermometer body */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-full bg-white/5 rounded-full border border-white/10">
                    {/* Fill */}
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 rounded-full"
                        style={{
                            height: `${percentage}%`,
                            backgroundColor: getColor(value),
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: `${percentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />

                    {/* Target line */}
                    <div
                        className="absolute left-0 right-0 h-0.5 bg-blue-400"
                        style={{
                            bottom: `${targetPercentage}%`,
                        }}
                    >
                        <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-xs text-blue-400 whitespace-nowrap">
                            Target: {target}%
                        </div>
                    </div>
                </div>

                {/* Scale markers */}
                <div className="absolute right-full mr-2 h-full flex flex-col justify-between text-xs text-white/40">
                    <span>10%</span>
                    <span>7.5%</span>
                    <span>5%</span>
                    <span>2.5%</span>
                    <span>0%</span>
                </div>

                {/* Bulb */}
                <div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4 w-16 h-16 rounded-full"
                    style={{
                        backgroundColor: getColor(value),
                        boxShadow: `0 0 20px ${getColor(value)}`,
                    }}
                />
            </div>

            {/* Current Value */}
            <div className="mt-8 text-center">
                <div className="text-3xl font-bold" style={{ color: getColor(value) }}>
                    {value.toFixed(1)}%
                </div>
                <div className="text-sm text-white/50 mt-1">CPI Inflation</div>
            </div>

            {/* Status */}
            <div className="mt-4 px-4 py-2 rounded-lg bg-white/5">
                <div className={`text-xs font-medium ${value > 6 ? 'text-red-400' :
                    value > 4.5 ? 'text-yellow-400' :
                        'text-green-400'
                    }`}>
                    {value > 6 ? '🔥 High Inflation Risk' :
                        value > 4.5 ? '⚠️ Above Target' :
                            '✅ Within Range'}
                </div>
            </div>

            {/* AI Interpretation */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg w-full max-w-md">
                <div className="flex items-start gap-2">
                    <span className="text-blue-400 text-sm">💡</span>
                    <p className="text-xs text-white/70 leading-relaxed">
                        {getCPIInterpretation(value, target)}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

function getCPIInterpretation(value, target) {
    const deviation = value - target;

    if (deviation > 2) {
        return `Inflation at ${value.toFixed(1)}% is significantly above RBI's ${target}% target. Expect continued hawkish stance and pressure on consumption stocks.`;
    } else if (deviation > 0.5) {
        return `Inflation at ${value.toFixed(1)}% remains sticky above target. RBI likely to hold rates steady - limited room for policy easing.`;
    } else {
        return `Inflation at ${value.toFixed(1)}% is well-controlled within RBI's target band. Supportive environment for rate cuts and equity valuations.`;
    }
}
