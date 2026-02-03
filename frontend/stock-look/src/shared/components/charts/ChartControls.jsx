/**
 * @file ChartControls.jsx
 * @purpose User interface for interacting with financial charts.
 * @responsibilities
 * - Provides toggles for overlays (Events, Fair Value).
 * - Manages timeframe selection (Tactical, Swing, Valuation).
 * - Includes tooltips for educational context.
 * - Uses Framer Motion for interactive feedback.
 * @key_exports
 * - ChartControls (Default)
 * @dependencies
 * - framer-motion
 * @lifecycle
 * - Controlled by parent page/grid components.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useState } from 'react';
import { motion } from 'framer-motion';

// =============================
// Component
// =============================

export default function ChartControls({
    showEvents = true,
    onToggleEvents,
    showFairValue = true,
    onToggleFairValue,
    timeframeMode = 'medium',
    onTimeframeModeChange,
}) {
    return (
        <div className="chart-controls flex items-center justify-between gap-4 mb-4">
            {/* Left: Toggle Controls */}
            <div className="flex items-center gap-2">
                {/* Events Toggle */}
                <ToggleButton
                    active={showEvents}
                    onClick={onToggleEvents}
                    label="Events"
                    icon="📅"
                />

                {/* Fair Value Toggle */}
                <ToggleButton
                    active={showFairValue}
                    onClick={onToggleFairValue}
                    label="Fair Value"
                    icon="📊"
                />
            </div>

            {/* Right: Timeframe Intelligence */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <TimeframeButton
                    active={timeframeMode === 'short'}
                    onClick={() => onTimeframeModeChange('short')}
                    label="Tactical"
                    tooltip="Short-term (1-5 days) - Focus on momentum & technicals"
                />
                <TimeframeButton
                    active={timeframeMode === 'medium'}
                    onClick={() => onTimeframeModeChange('medium')}
                    label="Swing"
                    tooltip="Medium-term (1-4 weeks) - Balance of technicals & fundamentals"
                />
                <TimeframeButton
                    active={timeframeMode === 'long'}
                    onClick={() => onTimeframeModeChange('long')}
                    label="Valuation"
                    tooltip="Long-term (3-12 months) - Focus on fundamentals & fair value"
                />
            </div>
        </div>
    );
}

/**
 * Toggle Button Component
 */
function ToggleButton({ active, onClick, label, icon }) {
    return (
        <motion.button
            onClick={onClick}
            className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200
        ${active
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                }
      `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <span>{icon}</span>
            <span>{label}</span>
            <div className={`
        w-8 h-4 rounded-full relative transition-colors duration-200
        ${active ? 'bg-blue-500' : 'bg-white/20'}
      `}>
                <motion.div
                    className="absolute top-0.5 w-3 h-3 bg-white rounded-full"
                    animate={{ left: active ? '16px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </div>
        </motion.button>
    );
}

/**
 * Timeframe Button Component
 */
function TimeframeButton({ active, onClick, label, tooltip }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative">
            <motion.button
                onClick={onClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`
          px-4 py-1.5 rounded-md text-xs font-medium
          transition-all duration-200
          ${active
                        ? 'bg-blue-500 text-white'
                        : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                    }
        `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {label}
            </motion.button>

            {/* Tooltip */}
            {showTooltip && (
                <motion.div
                    className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 whitespace-nowrap">
                        <p className="text-xs text-white/80">{tooltip}</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
