/**
 * @file eventsData.js
 * @purpose Centralized repository for mock economic and corporate event data.
 * @responsibilities
 * - Provides structured mock data for development and testing of event dashboards.
 * - Defines event schemas including frequency, impact scores, and playbooks.
 * - Serves as the single source of truth for static event simulations.
 * @key_exports
 * - MOCK_EVENTS (Array): List of detailed event objects.
 * - TOTAL_EVENTS_CREDITS (Constant): Baseline for credit allocation calculations.
 * @dependencies
 * - None
 * @lifecycle
 * - Imported by data hooks or service layers to simulate backend responses.
 * @date 2026-02-03
 */

import { EVENTS_RELIABILITY, TOTAL_EVENTS_CREDITS as _TOTAL_CREDITS } from '../../../../config/reliability';
import { getCreditFromReliability } from '@/shared/global/logic/signals';

// =============================
// Constants & Config
// =============================
// Re-export for backward compatibility
export const TOTAL_EVENTS_CREDITS = _TOTAL_CREDITS;

// =============================
// Mock Data Definition
// =============================
const _baseEvents = [
    {
        id: 'e1',
        title: 'India CPI Inflation',
        date: '2026-02-12T17:30:00',
        category: 'Macro',
        impactScore: 8.5,
        consensus: '5.4%',
        previous: '5.69%',
        frequency: 'Monthly',
        marketSensitivity: 'High',
        historicalImpact: { ivSpike: 12, niftyMove: 0.8 },
        surpriseFrequency: 6,
        globalCorrelation: 4,
        playbook: {
            before: 'Reduce leverage, Iron Fly',
            after: 'Directional if > 0.2% deviation'
        }
    },
    {
        id: 'e2',
        title: 'RBI MPC Policy',
        date: '2026-02-08T10:00:00',
        category: 'Policy',
        impactScore: 9.2,
        consensus: 'Hold',
        previous: 'Hold',
        frequency: 'Bi-Monthly',
        marketSensitivity: 'High',
        historicalImpact: { ivSpike: 25, niftyMove: 1.5 },
        surpriseFrequency: 8,
        globalCorrelation: 2,
        playbook: {
            before: 'Long Straddle',
            after: 'Fade spikes'
        }
    },
    {
        id: 'e3',
        title: 'Reliance Earnings',
        date: '2026-01-24T16:00:00',
        category: 'Corporate',
        impactScore: 8.8,
        frequency: 'Quarterly',
        marketSensitivity: 'High',
        historicalImpact: { ivSpike: 15, niftyMove: 0.6 },
        surpriseFrequency: 7,
        globalCorrelation: 0
    },
    {
        id: 'e4',
        title: 'US FOMC Decision',
        date: '2026-01-29T23:30:00',
        category: 'Global',
        impactScore: 9.5,
        frequency: 'Monthly',
        marketSensitivity: 'High',
        historicalImpact: { ivSpike: 10, niftyMove: 1.2 },
        surpriseFrequency: 6,
        globalCorrelation: 10
    },
    {
        id: 'e5',
        title: 'HDFC Bank Earnings',
        date: '2026-01-20T12:00:00',
        category: 'Corporate',
        impactScore: 9.0,
        frequency: 'Quarterly',
        marketSensitivity: 'High',
        historicalImpact: { ivSpike: 18, niftyMove: 1.1 },
        surpriseFrequency: 5,
        globalCorrelation: 3
    },
    {
        id: 'e6',
        title: 'Budget 2026',
        date: '2026-02-01T11:00:00',
        category: 'Policy',
        impactScore: 10.0,
        frequency: 'Annual',
        marketSensitivity: 'High',
        historicalImpact: { ivSpike: 40, niftyMove: 2.5 },
        surpriseFrequency: 9,
        globalCorrelation: 5
    }
];

// Dynamic Export with Tiered Credits derived from centralized Reliability source
export const MOCK_EVENTS = _baseEvents.map(event => {
    const reliability = EVENTS_RELIABILITY[event.id] || 0.5;
    return {
        ...event,
        reliability,
        creditAllocation: getCreditFromReliability(reliability)
    };
});
