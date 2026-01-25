import { differenceInDays, parseISO } from 'date-fns';

export function detectEventClusters(events) {
    // Filter for high impact events only
    const highImpact = events.filter(e => e.impactScore >= 7);

    if (highImpact.length < 3) return null;

    // Sort by date
    const sorted = [...highImpact].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Check windows
    let cluster = null;

    for (let i = 0; i < sorted.length - 2; i++) {
        const start = sorted[i];
        const end = sorted[i + 2]; // Check window of 3 events

        const days = differenceInDays(parseISO(end.date), parseISO(start.date));

        // If 3 high impact events happen within 5 days
        if (days <= 5) {
            cluster = {
                detected: true,
                count: 3, // simplified, could be more
                days: days,
                events: [sorted[i], sorted[i + 1], sorted[i + 2]],
                label: "Volatility Expansion Likely",
                severity: "High"
            };
            break;
        }
    }

    return cluster;
}
