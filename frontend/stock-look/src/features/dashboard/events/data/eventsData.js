export const MOCK_EVENTS = [
    {
        id: 'e1',
        title: 'India CPI Inflation',
        date: '2026-02-12T17:30:00',
        category: 'Macro',
        impactScore: 8.5, // Calculated
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
        date: '2026-01-24T16:00:00', // Close
        category: 'Corporate',
        impactScore: 8.8,
        frequency: 'Quarterly',
        marketSensitivity: 'High', // Heavyweight
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
        historicalImpact: { ivSpike: 10, niftyMove: 1.2 }, // Gap ups
        surpriseFrequency: 6,
        globalCorrelation: 10
    },
    {
        id: 'e5',
        title: 'HDFC Bank Earnings',
        date: '2026-01-20T12:00:00', // Market hours
        category: 'Corporate',
        impactScore: 9.0,
        frequency: 'Quarterly',
        marketSensitivity: 'High',
        historicalImpact: { ivSpike: 18, niftyMove: 1.1 }, // Bank Nifty driver
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
        globalCorrelation: 5,
        creditAllocation: 20
    }
];

export const TOTAL_EVENTS_CREDITS = 100;
