/**
 * @file IntelligenceDashboard.jsx
 * @purpose Top-level intelligence summary panel.
 * @responsibilities
 * - Displays high-impact "Tailwinds" (Green) and "Risks" (Red).
 * - Animates entry using Framer Motion.
 * @key_exports
 * - IntelligenceDashboard (Default Component)
 * @dependencies
 * - Framer Motion
 * @lifecycle
 * - UNUSED / DEPRECATED (Logic moved to GlobalHeader, but keeping file as per safety rules).
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, slideUp } from '@/shared/utils/chartAnimations';

// =============================
// Main Component
// =============================
export default function IntelligenceDashboard({ intelligence }) {
    if (!intelligence) return null;

    const { tailwinds, risks } = intelligence;

    return (
        <motion.div
            className="intelligence-dashboard bg-white/5 rounded-xl p-6 border border-white/10"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
        >
            {/* TAILWINDS & RISKS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. TAILWINDS */}
                <motion.div variants={slideUp}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-green-400 text-lg">🚀</span>
                        <div className="text-sm font-medium text-white/80">Top 3 Tailwinds</div>
                    </div>
                    <div className="space-y-2">
                        {tailwinds.length > 0 ? (
                            tailwinds.map((tw, i) => (
                                <motion.div
                                    key={tw.id}
                                    className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{tw.icon}</span>
                                        <span className="text-sm text-white/90">{tw.label}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-green-400">
                                        {Number(tw.creditPct || 0).toFixed(0)}%
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-xs text-white/40 italic">No significant tailwinds detected</div>
                        )}
                    </div>
                </motion.div>

                {/* 2. RISKS */}
                <motion.div variants={slideUp}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-red-400 text-lg">⚠️</span>
                        <div className="text-sm font-medium text-white/80">Top 3 Risks</div>
                    </div>
                    <div className="space-y-2">
                        {risks.length > 0 ? (
                            risks.map((risk, i) => (
                                <motion.div
                                    key={risk.id}
                                    className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{risk.icon}</span>
                                        <span className="text-sm text-white/90">{risk.label}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-red-400">
                                        {Number(risk.creditPct || 0).toFixed(0)}%
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-xs text-white/40 italic">No significant risks detected</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
