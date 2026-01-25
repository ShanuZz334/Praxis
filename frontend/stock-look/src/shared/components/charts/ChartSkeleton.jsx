import React from 'react';
import { motion } from 'framer-motion';

/**
 * ChartSkeleton - Skeleton loader for charts
 * Shows shimmer animation while chart data loads
 */
export default function ChartSkeleton({ type = 'line', height = 300 }) {
    const shimmerVariants = {
        animate: {
            backgroundPosition: ['200% 0', '-200% 0'],
        },
    };

    const shimmerTransition = {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
    };

    // Line chart skeleton
    if (type === 'line' || type === 'area') {
        return (
            <div className="chart-skeleton" style={{ height }}>
                <svg width="100%" height="100%" className="opacity-20">
                    {/* Y-axis lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((y, i) => (
                        <line
                            key={i}
                            x1="0"
                            y1={`${y * 100}%`}
                            x2="100%"
                            y2={`${y * 100}%`}
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                    ))}

                    {/* Skeleton path */}
                    <motion.path
                        d={`M 0,${height * 0.7} Q ${height * 0.3},${height * 0.3} ${height * 0.5},${height * 0.5} T ${height},${height * 0.4}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="opacity-30"
                    />
                </svg>

                {/* Shimmer overlay */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    variants={shimmerVariants}
                    animate="animate"
                    transition={shimmerTransition}
                    style={{
                        backgroundSize: '200% 100%',
                    }}
                />
            </div>
        );
    }

    // Bar chart skeleton
    if (type === 'bar') {
        return (
            <div className="chart-skeleton flex items-end justify-around gap-2 px-4" style={{ height }}>
                {[0.6, 0.8, 0.5, 0.9, 0.7, 0.4, 0.85].map((h, i) => (
                    <motion.div
                        key={i}
                        className="flex-1 bg-white/10 rounded-t"
                        style={{ height: `${h * 100}%` }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                    />
                ))}

                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    variants={shimmerVariants}
                    animate="animate"
                    transition={shimmerTransition}
                    style={{
                        backgroundSize: '200% 100%',
                    }}
                />
            </div>
        );
    }

    // Gauge skeleton
    if (type === 'gauge') {
        return (
            <div className="chart-skeleton flex items-center justify-center" style={{ height }}>
                <svg width={height * 0.8} height={height * 0.8} viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="opacity-20"
                    />
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset="125.6"
                        className="opacity-30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{ transformOrigin: '50% 50%' }}
                    />
                </svg>
            </div>
        );
    }

    // Heatmap skeleton
    if (type === 'heatmap') {
        return (
            <div className="chart-skeleton grid grid-cols-4 gap-2 p-4" style={{ height }}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="bg-white/10 rounded aspect-square"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                    />
                ))}

                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    variants={shimmerVariants}
                    animate="animate"
                    transition={shimmerTransition}
                    style={{
                        backgroundSize: '200% 100%',
                    }}
                />
            </div>
        );
    }

    // Default skeleton
    return (
        <div className="chart-skeleton bg-white/5 rounded-lg animate-pulse" style={{ height }} />
    );
}
