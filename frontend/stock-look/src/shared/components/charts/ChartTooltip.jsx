/**
 * @file ChartTooltip.jsx
 * @purpose Specialized tooltip for data visualization.
 * @responsibilities
 * - Displays data point values on hover.
 * - Shows delta context and zone-based coloring.
 * - Supports custom Recharts payloads via wrapper.
 * @key_exports
 * - ChartTooltip (Default)
 * - RechartsTooltipWrapper
 * @dependencies
 * - framer-motion
 * - chartUtils (formatNumber, formatChartDate)
 * @lifecycle
 * - Rendered by Chart libraries (Recharts/Lightweight) on interaction.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tooltipVariants } from '@/shared/utils/chartAnimations';
import { formatNumber, formatChartDate, getZoneColor } from '@/shared/utils/chartUtils';

// =============================
// Component
// =============================

export default function ChartTooltip({
    active = false,
    payload = [],
    label = '',
    context = '',
    showDelta = false,
    deltaValue = null,
    metricUnit = '',
    position = { x: 0, y: 0 },
}) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const data = payload[0];
    const value = data.value;
    const zone = data.payload?.zone || 'neutral';
    const color = getZoneColor(zone);

    return (
        <AnimatePresence>
            <motion.div
                className="chart-tooltip"
                variants={tooltipVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    zIndex: 1000,
                }}
            >
                <div className="bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl max-w-xs">
                    {/* Date/Label */}
                    {label && (
                        <div className="text-xs text-white/60 mb-1">
                            {typeof label === 'string' && label.includes('-')
                                ? formatChartDate(label, 'long')
                                : label}
                        </div>
                    )}

                    {/* Value */}
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-lg font-semibold" style={{ color }}>
                            {formatNumber(value, { decimals: 2, suffix: metricUnit })}
                        </span>

                        {/* Delta */}
                        {showDelta && deltaValue && (
                            <span className={`text-xs ${deltaValue.direction === 'up' ? 'text-green-400' : deltaValue.direction === 'down' ? 'text-red-400' : 'text-white/60'}`}>
                                {deltaValue.direction === 'up' ? '↑' : deltaValue.direction === 'down' ? '↓' : '→'}
                                {Math.abs(deltaValue.percent).toFixed(1)}%
                            </span>
                        )}
                    </div>

                    {/* Context */}
                    {context && (
                        <div className="text-xs text-white/70 leading-relaxed border-t border-white/10 pt-2">
                            💡 {context}
                        </div>
                    )}

                    {/* Zone indicator */}
                    <div className="flex items-center gap-2 mt-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-white/50 capitalize">
                            {zone.replace('-', ' ')}
                        </span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * Custom Recharts Tooltip Wrapper
 */
export function RechartsTooltipWrapper({ active, payload, label, metricId, metricUnit }) {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0];
    const value = data.value;
    const normalized = data.payload?.normalized || 0;

    // Get context based on metric
    const getContext = (id, norm) => {
        if (norm > 0.25) return 'Strong positive signal';
        if (norm < -0.25) return 'Caution advised';
        return 'Neutral zone - monitor closely';
    };

    return (
        <div className="bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
            <div className="text-xs text-white/60 mb-1">
                {formatChartDate(label, 'long')}
            </div>
            <div className="text-lg font-semibold text-white mb-1">
                {formatNumber(value, { decimals: 2, suffix: metricUnit })}
            </div>
            <div className="text-xs text-white/70">
                💡 {getContext(metricId, normalized)}
            </div>
        </div>
    );
}
