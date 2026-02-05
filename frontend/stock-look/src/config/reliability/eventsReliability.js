/**
 * @file eventsReliability.js
 * @purpose Central source of truth for Event Reliability scores based on Impact.
 */

export const EVENTS_RELIABILITY = {
    'e1': 0.85, // India CPI
    'e2': 0.92, // RBI Policy
    'e3': 0.88, // Reliance Earnings
    'e4': 0.95, // US FOMC
    'e5': 0.90, // HDFC Earnings
    'e6': 1.00  // Budget 2026
};

export default EVENTS_RELIABILITY;
