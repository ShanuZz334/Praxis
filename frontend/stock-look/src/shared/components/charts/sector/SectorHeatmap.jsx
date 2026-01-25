import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * SectorHeatmap
 * Grid heatmap showing sector valuation vs historical percentiles
 */
export default function SectorHeatmap({
    sectors = [],
    height = 400,
    onSectorClick = null,
}) {
    if (!sectors || sectors.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-white/40">
                No sector data available
            </div>
        );
    }

    // Sort sectors by market cap weight
    const sortedSectors = [...sectors].sort((a, b) => b.weight - a.weight);

    // Get color based on PE percentile
    const getColor = (percentile) => {
        if (percentile < 20) return { bg: '#22c55e', intensity: 0.8, label: 'Cheap' };
        if (percentile < 40) return { bg: '#86efac', intensity: 0.6, label: 'Fair' };
        if (percentile < 60) return { bg: '#fbbf24', intensity: 0.5, label: 'Neutral' };
        if (percentile < 80) return { bg: '#fca5a5', intensity: 0.6, label: 'Expensive' };
        return { bg: '#ef4444', intensity: 0.8, label: 'Very Expensive' };
    };

    return (
        <div className="sector-heatmap">
            {/* Header */}
            <div className="mb-4">
                <div className="text-sm text-white/60">Sector Valuation Heatmap</div>
                <div className="text-xs text-white/40 mt-1">Color intensity = PE percentile vs own history</div>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {sortedSectors.map((sector, index) => {
                    const colorInfo = getColor(sector.pePercentile);

                    return (
                        <motion.div
                            key={sector.name}
                            className="sector-tile relative overflow-hidden rounded-lg cursor-pointer group"
                            style={{
                                backgroundColor: `${colorInfo.bg}${Math.floor(colorInfo.intensity * 255).toString(16).padStart(2, '0')}`,
                                border: `1px solid ${colorInfo.bg}40`,
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSectorClick && onSectorClick(sector)}
                        >
                            <div className="p-4 relative z-10">
                                {/* Sector Name */}
                                <div className="text-sm font-semibold text-white mb-1">
                                    {sector.name}
                                </div>

                                {/* PE Value */}
                                <div className="text-2xl font-bold text-white mb-2">
                                    {(sector.pe || 0).toFixed(1)}x
                                </div>

                                {/* Percentile */}
                                <div className="text-xs text-white/80">
                                    {(sector.pePercentile || 0).toFixed(0)}th percentile
                                </div>

                                {/* Weight */}
                                <div className="text-xs text-white/60 mt-1">
                                    Weight: {(sector.weight || 0).toFixed(1)}%
                                </div>

                                {/* Label Badge */}
                                <div className="absolute top-2 right-2">
                                    <div className="px-2 py-0.5 bg-black/30 rounded text-xs text-white font-medium">
                                        {colorInfo.label}
                                    </div>
                                </div>
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
                        </motion.div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }} />
                    <span className="text-white/60">Cheap</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#86efac' }} />
                    <span className="text-white/60">Fair</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fbbf24' }} />
                    <span className="text-white/60">Neutral</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fca5a5' }} />
                    <span className="text-white/60">Expensive</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
                    <span className="text-white/60">Very Expensive</span>
                </div>
            </div>

            {/* Interpretation */}
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-white/70">
                    <span className="font-medium">💡 How to Read:</span>{' '}
                    Green sectors are trading below historical averages (potential value),
                    Red sectors are at historical highs (expensive). Click any sector for detailed analysis.
                </div>
            </div>
        </div>
    );
}
