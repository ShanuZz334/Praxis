import { differenceInMinutes, parseISO } from 'date-fns';

export function detectNewsClusters(newsItems) {
    // Filter for high impact
    const highImpact = newsItems.filter(n => n.impactScore >= 7);

    if (highImpact.length < 2) return null;

    // Sort by time (descending usually, but for diff check lets do asc)
    const sorted = [...highImpact].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Check closest cluster (last 2-3 items)
    // If 2 high impact items within 60 mins -> Cluster
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
