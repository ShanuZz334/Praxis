/* --------------------------------------------------------------------------
   FUNDAMENTAL DATA CONSTANTS
   Defines the core sections and configuration for the Fundamental Engine.
-------------------------------------------------------------------------- */

export const FUNDAMENTAL_SECTIONS = [
    { id: 'Valuation', label: 'Valuation', desc: 'Price vs Value metrics', weight: 0.15 },
    { id: 'Earnings', label: 'Earnings', desc: 'Growth & Profitability', weight: 0.20 },
    { id: 'Macro', label: 'Macro', desc: 'Economic Indicators', weight: 0.15 },
    { id: 'Liquidity', label: 'Liquidity', desc: 'Flows & Market Depth', weight: 0.12 },
    { id: 'Sector', label: 'Sector', desc: 'Group Performance', weight: 0.10 },
    { id: 'Corporate', label: 'Corporate', desc: 'Balance Sheet Health', weight: 0.10 },
    { id: 'Global', label: 'Global', desc: 'International cues', weight: 0.08 },
    { id: 'Risk', label: 'Risk', desc: 'Systemic Stress', weight: 0.10 }
];

export const WEIGHTS = FUNDAMENTAL_SECTIONS.reduce((acc, curr) => {
    acc[curr.id] = curr.weight;
    return acc;
}, {});
