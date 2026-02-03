/**
 * @file clustering.js
 * @purpose Logic for detecting event clusters over a time series.
 * @responsibilities
 * - Analyzes a list of events to identify high-density, high-impact windows.
 * - Filters events based on impact scores.
 * - Groups events into meaningful clusters (e.g., "Volatility Expansion Likely").
 * @key_exports
 * - detectEventClusters (Function): Returns cluster metadata if a pattern is found.
 * @dependencies
 * - date-fns: For date arithmetic and parsing.
 * @lifecycle
 * - Called by event processing engines or hooks when event data is updated.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import { differenceInDays, parseISO } from 'date-fns';

// =============================
// Core Logic
// =============================

/**
 * detectEventClusters
 * Scans a sorted list of events to find clusters of high-impact events occurring within a short timeframe.
 * @param {Array} events - The list of event objects to analyze.
 * @returns {Object|null} - The detected cluster object or null if none found.
 */
export function detectEventClusters(events) {
    // 1. Filter for high impact events only
    const highImpact = events.filter(e => e.impactScore >= 7);

    if (highImpact.length < 3) return null;

    // 2. Sort by date (Ascending)
    const sorted = [...highImpact].sort((a, b) => new Date(a.date) - new Date(b.date));

    // 3. Sliding Window Check
    let cluster = null;

    for (let i = 0; i < sorted.length - 2; i++) {
        const start = sorted[i];
        const end = sorted[i + 2]; // Look ahead to the 3rd event

        const days = differenceInDays(parseISO(end.date), parseISO(start.date));

        // Threshold: 3 high impact events within 5 days
        if (days <= 5) {
            cluster = {
                detected: true,
                count: 3, // Simplified for this implementation
                days: days,
                events: [sorted[i], sorted[i + 1], sorted[i + 2]],
                label: "Volatility Expansion Likely",
                severity: "High"
            };
            break; // Return the first significant cluster found
        }
    }

    return cluster;
}
