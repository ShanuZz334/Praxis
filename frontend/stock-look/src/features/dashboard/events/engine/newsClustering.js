/**
 * @file newsClustering.js
 * @purpose Identifies immediate, high-frequency news bursts.
 * @responsibilities
 * - Detects rapid-fire news releases affecting market sentiment.
 * - Clusters high-impact news items occurring within a tight time window.
 * - Flags "Market Moving Clusters" for real-time alerts.
 * @key_exports
 * - detectNewsClusters (Function): Returns news cluster metadata.
 * @dependencies
 * - date-fns: For minute-level time difference calculations.
 * @lifecycle
 * - integrated into the news feed processing pipeline.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import { differenceInMinutes, parseISO } from 'date-fns';

// =============================
// Core Logic
// =============================

/**
 * detectNewsClusters
 * Detects if multiple high-impact news items have arrived within a short duration.
 * @param {Array} newsItems - List of news objects.
 * @returns {Object|null} - Cluster object if detected, else null.
 */
export function detectNewsClusters(newsItems) {
    // 1. Filter for High Impact
    const highImpact = newsItems.filter(n => n.impactScore >= 7);

    if (highImpact.length < 2) return null;

    // 2. Sort by Time (Ascending for diff calc)
    const sorted = [...highImpact].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // 3. Cluster Detection Loop
    // Definition: 2 high impact items within 60 minutes
    for (let i = 0; i < sorted.length - 1; i++) {
        const start = sorted[i];
        const end = sorted[i + 1];

        const mins = differenceInMinutes(parseISO(end.timestamp), parseISO(start.timestamp));

        if (mins <= 60) {
            return {
                detected: true,
                count: 2,
                minutes: mins,
                items: [start, end],
                label: "Market Moving Cluster",
                severity: "High"
            };
        }
    }

    return null;
}
