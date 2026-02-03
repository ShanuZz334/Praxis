/**
 * @file ChartWrapper.jsx
 * @purpose Universal container for all application charts.
 * @responsibilities
 * - Provides responsive container dimensions via ResizeObserver.
 * - Handles Skeleton loading states.
 * - Manages Error boundaries for visualization failures.
 * - Standardizes chart transitions and controls positioning.
 * @key_exports
 * - ChartWrapper (Default)
 * @dependencies
 * - ChartSkeleton
 * - chartAnimations (chartVariants)
 * @lifecycle
 * - Wraps every chart instance to ensure consistency.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { chartVariants } from '@/shared/utils/chartAnimations';
import ChartSkeleton from './ChartSkeleton';

// =============================
// Component
// =============================

export default function ChartWrapper({
    children,
    loading = false,
    error = null,
    height = 300,
    className = '',
    showControls = false,
    controls = null,
    skeletonType = 'line',
}) {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Measure container dimensions
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Error state
    if (error) {
        return (
            <div
                ref={containerRef}
                className={`chart-wrapper chart-error ${className}`}
                style={{ height }}
            >
                <div className="flex items-center justify-center h-full text-red-400 text-sm">
                    <span>⚠ {error}</span>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div
                ref={containerRef}
                className={`chart-wrapper ${className}`}
                style={{ height }}
            >
                <ChartSkeleton type={skeletonType} height={height} />
            </div>
        );
    }

    return (
        <motion.div
            ref={containerRef}
            className={`chart-wrapper ${className}`}
            style={{ height }}
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* Controls */}
            {showControls && controls && (
                <div className="chart-controls mb-3 flex items-center justify-between">
                    {controls}
                </div>
            )}

            {/* Chart Content */}
            <div className="chart-content h-full w-full">
                {React.cloneElement(children, { width: dimensions.width, height: dimensions.height })}
            </div>
        </motion.div>
    );
}
