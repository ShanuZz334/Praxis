/* --------------------------------------------------------------------------
   FUNDAMENTAL DATA CONSTANTS
   Defines the core sections and configuration for the Fundamental Engine.
-------------------------------------------------------------------------- */

export const FUNDAMENTAL_SECTIONS = [
    { id: 'Valuation', label: 'Valuation', desc: 'Price vs Value metrics', weight: 0.20 },
    { id: 'Earnings',  label: 'Earnings',  desc: 'Earnings Growth',        weight: 0.22 },
    { id: 'Macro',     label: 'Macro',     desc: 'Economic Indicators',    weight: 0.05 },
    { id: 'Liquidity', label: 'Liquidity', desc: 'Flows & Market Depth',   weight: 0.08 },
    { id: 'Sector',    label: 'Sector',    desc: 'Group Performance',      weight: 0.15 },
    { id: 'Corporate', label: 'Corporate', desc: 'Balance Sheet Health',   weight: 0.18 },
    { id: 'Global',    label: 'Global',    desc: 'Systemic Stress',        weight: 0.12 },
];

export const WEIGHTS = FUNDAMENTAL_SECTIONS.reduce((acc, curr) => {
    acc[curr.id] = curr.weight;
    return acc;
}, {});
