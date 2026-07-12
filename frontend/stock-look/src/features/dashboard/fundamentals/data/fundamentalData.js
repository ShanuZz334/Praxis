/* --------------------------------------------------------------------------
   FUNDAMENTAL DATA CONSTANTS
   Defines the core sections and configuration for the Fundamental Engine.
-------------------------------------------------------------------------- */

export const FUNDAMENTAL_SECTIONS = [
    { id: 'Valuation',        label: 'Valuation',        desc: 'Price vs Value metrics',       weight: 0.20 },
    { id: 'Growth',           label: 'Growth',           desc: 'Earnings & Revenue Growth',    weight: 0.20 },
    { id: 'Profitability',    label: 'Profitability',    desc: 'Margins & Capital Efficiency', weight: 0.18 },
    { id: 'Financial Health', label: 'Financial Health', desc: 'Balance Sheet & Liquidity',    weight: 0.15 },
    { id: 'Market Health',    label: 'Market Health',    desc: 'Flows & Market Valuation',     weight: 0.12 },
    { id: 'Earnings',         label: 'Earnings',         desc: 'Legacy Earnings Section',      weight: 0.05 },
    { id: 'Macro',            label: 'Macro',            desc: 'Economic Indicators',          weight: 0.05 },
    { id: 'Liquidity',        label: 'Liquidity',        desc: 'Flows & Market Depth',         weight: 0.03 },
    { id: 'Sector',           label: 'Sector',           desc: 'Group Performance',            weight: 0.01 },
    { id: 'Corporate',        label: 'Corporate',        desc: 'Balance Sheet Health',         weight: 0.01 },
    { id: 'Global',           label: 'Global',           desc: 'International cues',           weight: 0.00 },
    { id: 'Risk',             label: 'Risk',             desc: 'Systemic Stress',              weight: 0.00 }
];

export const WEIGHTS = FUNDAMENTAL_SECTIONS.reduce((acc, curr) => {
    acc[curr.id] = curr.weight;
    return acc;
}, {});
