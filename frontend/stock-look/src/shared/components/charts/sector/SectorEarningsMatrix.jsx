import React from 'react';
import { motion } from 'framer-motion';

/**
 * SectorEarningsMatrix
 * Visualizes Sector Earnings Strength using a scored grid.
 * 
 * Replaces generic Valuation Heatmap for the "Sector Earnings Strength" card.
 * Focuses on Earnings Growth, Contribution, and Revision Momentum.
 */
export default function SectorEarningsMatrix({
    sectors = [],
    height = 400,
}) {
    if (!sectors || sectors.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-white/40">
                No sector data available
            </div>
        );
    }

    // Sort by Sector Score (Descending) - Best earnings first
    const sortedSectors = [...sectors].sort((a, b) => (b.sectorScore || 0) - (a.sectorScore || 0));

    // Get color based on Earnings Strength Label/Score
    const getColor = (score) => {
        if (score >= 0.6) return { bg: '#22c55e', label: 'Strong Earnings' }; // Green
        if (score >= 0.2) return { bg: '#86efac', label: 'Improving' };       // Light Green
        if (score >= -0.2) return { bg: '#fbbf24', label: 'Neutral' };        // Yellow
        if (score >= -0.6) return { bg: '#fca5a5', label: 'Weakening' };      // Light Red
        return { bg: '#ef4444', label: 'Earnings Stress' };                   // Red
    };

    return (
        <div className="sector-matrix h-full flex flex-col">
            {/* Header / Legend */}
            <div className="mb-4 flex flex-wrap gap-4 justify-between items-end shrink-0">
                <div>
                    <div className="text-sm text-white/60">Sector Earnings Matrix</div>
                    <div className="text-xs text-white/40 mt-1">Sorted by Earnings Momentum & Contribution</div>
                </div>

                {/* Legend */}
                <div className="flex gap-2 text-[10px]">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Strong</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div>Neutral</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Weak</div>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="
                flex-1 overflow-y-auto pr-2
                grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3
                content-start
            ">
                {sortedSectors.map((sector, index) => {
                    const { bg, label } = getColor(sector.sectorScore || 0);
                    // Use a subtle background opacity for the card
                    const cardBg = `${bg}15`;
                    const borderColor = `${bg}40`;
                    const textColor = bg;

                    return (
                        <motion.div
                            key={sector.name}
                            className="relative rounded-xl border p-4 group hover:bg-white/5 transition-colors"
                            style={{
                                backgroundColor: cardBg,
                                borderColor: borderColor
                            }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            {/* Header: Name & Status */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="font-semibold text-white tracking-wide">
                                    {sector.name}
                                </div>
                                <div
                                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/40"
                                    style={{ color: textColor }}
                                >
                                    {label}
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">

                                {/* Row 1: Earnings YoY */}
                                <div>
                                    <div className="text-white/40 mb-0.5">Earnings YoY</div>
                                    <div className={`font-mono font-medium ${sector.earningsGrowthYoY >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {sector.earningsGrowthYoY > 0 ? '+' : ''}{sector.earningsGrowthYoY}%
                                    </div>
                                </div>

                                {/* Row 1: Index Contrib */}
                                <div className="text-right">
                                    <div className="text-white/40 mb-0.5">Index Contrib</div>
                                    <div className="font-mono font-medium text-white/90">
                                        {sector.contributionToIndexEarnings}%
                                    </div>
                                </div>

                                {/* Row 2: Revision Trend */}
                                <div>
                                    <div className="text-white/40 mb-0.5">Revisions</div>
                                    <div className="text-white/80">
                                        {sector.revisionTrend > 0 ? '↗ Upgrading' : sector.revisionTrend < 0 ? '↘ Downgrading' : '→ Stable'}
                                    </div>
                                </div>

                                {/* Row 2: Percentile */}
                                <div className="text-right">
                                    <div className="text-white/40 mb-0.5">Hist. %ile</div>
                                    <div className="text-white/70">
                                        {sector.historicalPercentile}th
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
